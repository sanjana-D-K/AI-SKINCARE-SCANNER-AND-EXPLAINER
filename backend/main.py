import base64
import io
import logging
import traceback
from typing import Optional

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image

from models import IngredientResult, ProductSummary, ScanResponse, SearchResponse
from services.claude_service import ClaudeService
from services.ingredient_service import IngredientService

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Skincare Ingredient Scanner API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

claude = ClaudeService()
ingredient_svc = IngredientService()

VALID_SKIN_TYPES = {"oily", "dry", "combination", "sensitive"}
MAX_IMAGE_BYTES = 20 * 1024 * 1024  # 20 MB raw upload limit
MAX_LONG_EDGE = 1500   # Claude Vision works best at ≤1568px
TARGET_SIZE_KB = 2048  # Keep final image under ~2 MB


def prepare_image(raw_bytes: bytes) -> tuple[bytes, str]:
    """Resize and re-encode image so it fits Claude Vision limits."""
    img = Image.open(io.BytesIO(raw_bytes))
    img = img.convert("RGB")  # Strip alpha / EXIF colour profiles

    # Resize so the long edge ≤ MAX_LONG_EDGE
    w, h = img.size
    scale = min(MAX_LONG_EDGE / max(w, h), 1.0)
    if scale < 1.0:
        new_w, new_h = int(w * scale), int(h * scale)
        img = img.resize((new_w, new_h), Image.LANCZOS)
        logger.info("Resized image from %dx%d → %dx%d", w, h, new_w, new_h)

    # Re-encode to JPEG, dropping quality until under target size
    quality = 85
    while quality >= 40:
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=quality, optimize=True)
        if buf.tell() <= TARGET_SIZE_KB * 1024:
            break
        quality -= 10

    out = buf.getvalue()
    logger.info("Final image: %.1f KB (quality=%d)", len(out) / 1024, quality)
    return out, "image/jpeg"


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error("Unhandled exception: %s\n%s", exc, traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={"detail": f"Server error: {str(exc)}"},
    )


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}


@app.post("/api/scan", response_model=ScanResponse)
async def scan_product(
    image: UploadFile = File(...),
    skin_type: str = Form(default="combination"),
):
    try:
        if skin_type not in VALID_SKIN_TYPES:
            skin_type = "combination"

        # Accept any image content type — Claude handles most formats
        ct = (image.content_type or "image/jpeg").lower()
        if not ct.startswith("image/"):
            raise HTTPException(status_code=415, detail="Please upload an image file (JPG or PNG).")

        # Normalize to a type Claude Vision accepts
        safe_ct = ct if ct in {"image/jpeg", "image/png", "image/gif", "image/webp"} else "image/jpeg"

        image_bytes = await image.read()
        logger.info("Received image: %.1f KB, type=%s, skin=%s", len(image_bytes) / 1024, ct, skin_type)

        if len(image_bytes) > MAX_IMAGE_BYTES:
            raise HTTPException(status_code=413, detail="Image is too large. Please use an image under 20 MB.")

        if len(image_bytes) < 100:
            raise HTTPException(status_code=422, detail="Image appears to be empty or corrupted.")

        # Resize + re-encode so it fits Claude Vision limits (large phone photos crash the API)
        try:
            image_bytes, safe_ct = prepare_image(image_bytes)
        except Exception as e:
            logger.error("Image preparation failed: %s", e)
            raise HTTPException(status_code=422, detail=f"Could not process image: {e}")

        image_b64 = base64.b64encode(image_bytes).decode()

        # Step 1 — OCR
        logger.info("Step 1: extracting ingredients via Claude Vision…")
        raw_text, ingredients_list = claude.extract_ingredients_from_image(image_b64, safe_ct)
        logger.info("Extracted %d ingredients", len(ingredients_list))

        if not ingredients_list:
            raise HTTPException(
                status_code=422,
                detail=(
                    "No ingredient list found in the image. "
                    "Please photograph the back of the product where the full ingredient list is printed, "
                    "and make sure it is well-lit and in focus."
                ),
            )

        # Step 2 — DB lookup
        db_matches = ingredient_svc.lookup_all(ingredients_list)

        # Step 3 — AI explanations
        logger.info("Step 3: generating AI explanations for %s skin…", skin_type)
        ai_result = claude.explain_ingredients(ingredients_list, db_matches, skin_type)

        # Step 4 — Merge & build response
        merged: list[IngredientResult] = []
        for item in ai_result.get("ingredients", []):
            db_entry = db_matches.get(item.get("name", ""))
            try:
                merged.append(
                    IngredientResult(
                        name=item.get("name", "Unknown"),
                        explanation=item.get("explanation", ""),
                        benefits=item.get("benefits", []),
                        concerns=item.get("concerns", []),
                        tag=item.get("tag", "neutral"),
                        acne_friendly=bool(item.get("acne_friendly", True)),
                        is_active=bool(item.get("is_active", False)),
                        skin_type_note=item.get("skin_type_note") or None,
                        comedogenic_rating=db_entry.get("comedogenic_rating") if db_entry else None,
                    )
                )
            except Exception as e:
                logger.warning("Skipping ingredient due to model error: %s — %s", item, e)

        raw_summary = ai_result.get("summary", {})
        try:
            acne_score = max(1, min(10, int(float(raw_summary.get("acne_score", 5)))))
        except (TypeError, ValueError):
            acne_score = 5

        summary = ProductSummary(
            overall_rating=raw_summary.get("overall_rating", "unknown"),
            acne_score=acne_score,
            summary_text=raw_summary.get("summary_text", ""),
            key_actives=raw_summary.get("key_actives", []),
            ingredients_to_watch=raw_summary.get("ingredients_to_watch", []),
        )

        return ScanResponse(
            raw_text=raw_text,
            ingredients=merged,
            summary=summary,
            skin_type=skin_type,
            total_ingredients=len(merged),
            actives_count=sum(1 for i in merged if i.is_active),
        )

    except HTTPException:
        raise
    except Exception as exc:
        logger.error("scan_product failed: %s\n%s", exc, traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(exc)}")


@app.get("/api/search", response_model=SearchResponse)
async def search_ingredients(q: str, skin_type: Optional[str] = "combination"):
    if not q or len(q.strip()) < 2:
        raise HTTPException(status_code=400, detail="Query must be at least 2 characters.")
    if skin_type not in VALID_SKIN_TYPES:
        skin_type = "combination"
    results = ingredient_svc.search(q.strip(), skin_type)
    return SearchResponse(results=results, query=q.strip())
