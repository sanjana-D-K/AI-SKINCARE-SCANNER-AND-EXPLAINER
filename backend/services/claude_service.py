import anthropic
import json
import re
from typing import Tuple, List, Dict, Any

SYSTEM_PROMPT = """You are a friendly skincare expert who explains ingredients in plain English.
You have deep knowledge of dermatology, INCI ingredient names, and how ingredients affect acne-prone skin.
Always be clear, accurate, and avoid medical jargon. Explain like the user is new to skincare."""

EXTRACT_SYSTEM_PROMPT = """You are an expert at reading skincare product labels and extracting ingredient lists from images.
You understand INCI naming conventions and can identify ingredient lists even in low-quality or angled photos."""

BATCH_SIZE = 20  # ingredients per API call


class ClaudeService:
    def __init__(self):
        self.client = anthropic.Anthropic()
        self.model = "claude-sonnet-4-6"

    # ── Vision OCR ─────────────────────────────────────────────────────────

    def extract_ingredients_from_image(
        self, image_b64: str, media_type: str
    ) -> Tuple[str, List[str]]:
        safe_media_type = (
            media_type if media_type in ["image/jpeg", "image/png", "image/gif", "image/webp"]
            else "image/jpeg"
        )

        response = self.client.messages.create(
            model=self.model,
            max_tokens=2048,
            system=EXTRACT_SYSTEM_PROMPT,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": safe_media_type,
                                "data": image_b64,
                            },
                        },
                        {
                            "type": "text",
                            "text": (
                                "Extract the complete ingredient list from this skincare product image.\n\n"
                                "Return ONLY valid JSON — no markdown, no explanation:\n"
                                '{"raw_text": "full ingredient text as found", "ingredients": ["Ingredient One", ...]}\n\n'
                                "Rules:\n"
                                "- Extract ALL ingredients\n"
                                "- Fix obvious OCR errors\n"
                                "- Remove prefixes like 'Ingredients:', 'Contains:', 'INCI:'\n"
                                "- Normalize casing (e.g. 'NIACINAMIDE' → 'Niacinamide')\n"
                                "- Each ingredient as a separate array element\n"
                                "- If no list visible: {\"raw_text\": \"\", \"ingredients\": []}"
                            ),
                        },
                    ],
                }
            ],
        )

        text = response.content[0].text.strip()
        try:
            match = re.search(r"\{[\s\S]*\}", text)
            if match:
                data = json.loads(match.group())
                return data.get("raw_text", ""), data.get("ingredients", [])
        except (json.JSONDecodeError, AttributeError):
            pass
        return text, []

    # ── AI Explanations ────────────────────────────────────────────────────

    def explain_ingredients(
        self, ingredients: List[str], db_matches: Dict[str, Any], skin_type: str
    ) -> Dict[str, Any]:
        """
        Explain all ingredients. For lists > BATCH_SIZE, splits into chunks
        and merges results. Uses prompt caching on the system prompt.
        """
        # Split into batches
        batches = [
            ingredients[i : i + BATCH_SIZE]
            for i in range(0, len(ingredients), BATCH_SIZE)
        ]

        all_ingredient_results: List[Dict] = []
        summary: Dict = {}

        for batch_idx, batch in enumerate(batches):
            is_last = batch_idx == len(batches) - 1
            result = self._explain_batch(
                batch, db_matches, skin_type,
                include_summary=is_last,
                all_ingredients=ingredients,  # give full list context for summary
            )
            all_ingredient_results.extend(result.get("ingredients", []))
            if is_last:
                summary = result.get("summary", {})

        return {"ingredients": all_ingredient_results, "summary": summary}

    def _explain_batch(
        self,
        batch: List[str],
        db_matches: Dict[str, Any],
        skin_type: str,
        include_summary: bool,
        all_ingredients: List[str],
    ) -> Dict[str, Any]:
        """Single Claude call for one batch of ingredients."""

        # Build compact DB context for this batch only
        context_lines = []
        for name in batch:
            data = db_matches.get(name)
            if data:
                context_lines.append(
                    f'- {name}: {data["function"]}, tag={data["tag"]}, '
                    f'comedogenic={data.get("comedogenic_rating", "?")}'
                )
        context_block = "\n".join(context_lines) if context_lines else "(none)"

        summary_block = ""
        if include_summary:
            summary_block = (
                '\n  "summary": {\n'
                '    "overall_rating": "excellent | good | caution | avoid",\n'
                '    "acne_score": 1-10,\n'
                f'    "summary_text": "2-3 honest sentences for {skin_type} skin about the FULL product ({len(all_ingredients)} ingredients)",\n'
                '    "key_actives": ["top active ingredients from the full list"],\n'
                '    "ingredients_to_watch": ["concerning ingredients from the full list"]\n'
                "  }"
            )
        else:
            summary_block = '\n  "summary": null'

        prompt = (
            f"Analyze these {len(batch)} skincare ingredients for **{skin_type}** skin.\n"
            f"(This product has {len(all_ingredients)} ingredients total.)\n\n"
            "Ingredients to explain:\n"
            + "\n".join(f"- {i}" for i in batch)
            + f"\n\nPre-identified from DB:\n{context_block}\n\n"
            "Return ONLY valid JSON — no markdown:\n"
            "{\n"
            '  "ingredients": [\n'
            "    {\n"
            '      "name": "exact name",\n'
            '      "explanation": "1 plain English sentence — what it does and why it matters",\n'
            '      "benefits": ["benefit 1"],\n'
            '      "concerns": ["concern 1 if any"],\n'
            '      "tag": "good_for_acne | may_irritate | neutral | avoid_acne",\n'
            '      "acne_friendly": true or false,\n'
            '      "is_active": true or false,\n'
            f'      "skin_type_note": "brief note for {skin_type} skin, or null"\n'
            "    }\n"
            "  ],"
            + summary_block
            + "\n}\n\n"
            "Rules:\n"
            "- Plain English, no jargon, keep it SHORT (1 sentence per ingredient)\n"
            "- tag: good_for_acne=helps acne, neutral=inert/safe, may_irritate=potential irritant, avoid_acne=clogs pores/causes breakouts\n"
            "- is_active: true only for actives (acids, retinoids, vitamin C, niacinamide, peptides, etc.)\n"
            "- acne_score (summary only): 10=perfect for acne, 1=very bad for acne"
        )

        response = self.client.messages.create(
            model=self.model,
            max_tokens=8096,
            system=[
                {
                    "type": "text",
                    "text": SYSTEM_PROMPT,
                    "cache_control": {"type": "ephemeral"},
                }
            ],
            messages=[{"role": "user", "content": prompt}],
        )

        text = response.content[0].text.strip()
        return self._parse_json(text, batch)

    def _parse_json(self, text: str, batch: List[str]) -> Dict[str, Any]:
        """Try to parse JSON; fall back to partial recovery on failure."""
        # 1. Direct parse
        try:
            match = re.search(r"\{[\s\S]*\}", text)
            if match:
                return json.loads(match.group())
        except json.JSONDecodeError:
            pass

        # 2. Try to extract the ingredients array even if summary is truncated
        try:
            arr_match = re.search(r'"ingredients"\s*:\s*(\[[\s\S]*?\])\s*[,}]', text)
            if arr_match:
                ingredients_list = json.loads(arr_match.group(1))
                return {
                    "ingredients": ingredients_list,
                    "summary": {
                        "overall_rating": "unknown",
                        "acne_score": 5,
                        "summary_text": "Summary could not be generated due to response length.",
                        "key_actives": [],
                        "ingredients_to_watch": [],
                    },
                }
        except (json.JSONDecodeError, AttributeError):
            pass

        # 3. Full fallback
        return {
            "ingredients": [
                {
                    "name": i,
                    "explanation": "Could not analyze this ingredient.",
                    "benefits": [],
                    "concerns": [],
                    "tag": "neutral",
                    "acne_friendly": True,
                    "is_active": False,
                    "skin_type_note": None,
                }
                for i in batch
            ],
            "summary": {
                "overall_rating": "unknown",
                "acne_score": 5,
                "summary_text": "Analysis incomplete. Please try scanning again.",
                "key_actives": [],
                "ingredients_to_watch": [],
            },
        }
