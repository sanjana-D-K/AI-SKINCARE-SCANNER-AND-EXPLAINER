# Skincare Ingredient Scanner & Explainer

Upload a photo of any skincare product → get plain-English explanations for every ingredient, tailored for your skin type (especially acne-prone).

## Architecture

```
┌─────────────────────────────────────────┐
│           Next.js Frontend              │
│  • Image upload / camera capture        │
│  • Skin type selector                   │
│  • Ingredient cards with tags           │
│  • Product summary with acne score      │
│  • Ingredient search bar                │
└──────────────────┬──────────────────────┘
                   │ HTTP (proxied /api/*)
┌──────────────────▼──────────────────────┐
│           FastAPI Backend               │
│  POST /api/scan   — full label scan     │
│  GET  /api/search — ingredient lookup   │
│  GET  /api/health — health check        │
└──────────┬──────────────────────────────┘
           │
    ┌──────▼──────────────┐   ┌──────────────────────┐
    │   Claude API        │   │  Local Ingredient DB  │
    │  • Vision OCR       │   │  (data/ingredients.json)│
    │  • NER + parsing    │   │  38 curated entries   │
    │  • AI explanations  │   │  INCI names, tags,    │
    │  • Prompt caching   │   │  comedogenic ratings  │
    └─────────────────────┘   └──────────────────────┘
```

## Quick Start

### 1 — Clone & enter the project

```bash
cd skincare_ingredients_explanation
```

### 2 — Backend setup

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set your Anthropic API key
cp .env.example .env
# Edit .env and add your key: ANTHROPIC_API_KEY=sk-ant-...

# Set the env var (Windows PowerShell)
$env:ANTHROPIC_API_KEY = "sk-ant-..."
# Or (bash/zsh)
export ANTHROPIC_API_KEY="sk-ant-..."

# Start the API server
uvicorn main:app --reload --port 8000
```

The API will be live at `http://localhost:8000`.
Interactive docs: `http://localhost:8000/docs`

### 3 — Frontend setup

Open a second terminal:

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## API Reference

### `POST /api/scan`

Scan a product image and return ingredient analysis.

**Request** — `multipart/form-data`:

| Field | Type | Description |
|-------|------|-------------|
| `image` | File | JPG, PNG, or WebP image of the ingredient label |
| `skin_type` | string | `oily` \| `dry` \| `combination` \| `sensitive` |

**Response** — `application/json`:

```json
{
  "raw_text": "Aqua, Niacinamide, Glycerin ...",
  "ingredients": [
    {
      "name": "Niacinamide",
      "explanation": "A form of Vitamin B3 that shrinks pores ...",
      "benefits": ["Reduces pore appearance", "Fades acne marks"],
      "concerns": [],
      "tag": "good_for_acne",
      "acne_friendly": true,
      "is_active": true,
      "skin_type_note": "Excellent for oily skin",
      "comedogenic_rating": 0
    }
  ],
  "summary": {
    "overall_rating": "excellent",
    "acne_score": 9,
    "summary_text": "This product is well-suited for oily, acne-prone skin ...",
    "key_actives": ["Niacinamide", "Salicylic Acid"],
    "ingredients_to_watch": []
  },
  "skin_type": "oily",
  "total_ingredients": 12,
  "actives_count": 2
}
```

**Ingredient tags:**

| Tag | Meaning |
|-----|---------|
| `good_for_acne` | Beneficial for acne-prone skin |
| `neutral` | Inert / no significant acne impact |
| `may_irritate` | Potential irritant; use with caution |
| `avoid_acne` | Known to clog pores or worsen acne |

---

### `GET /api/search?q={query}&skin_type={type}`

Search the curated ingredient database.

```
GET /api/search?q=niacinamide&skin_type=oily
```

---

## Dataset Structure

Each entry in `backend/data/ingredients.json`:

```json
{
  "inci_name": "Niacinamide",
  "aliases": ["Nicotinamide", "Vitamin B3"],
  "function": "Brightening, Pore-minimizing, Anti-inflammatory",
  "explanation": "...",
  "benefits": ["..."],
  "concerns": ["..."],
  "tag": "good_for_acne",
  "acne_friendly": true,
  "comedogenic_rating": 0,
  "is_active": true,
  "skin_type_notes": {
    "oily": "Excellent — directly reduces excess oil",
    "dry": "...",
    "combination": "...",
    "sensitive": "..."
  }
}
```

**Comedogenic rating scale** (0–5):
- 0: Non-comedogenic
- 1–2: Low risk
- 3: Moderate risk
- 4–5: High risk (likely to clog pores)

---

## Project Structure

```
skincare_ingredients_explanation/
├── backend/
│   ├── main.py                  # FastAPI app + routes
│   ├── models.py                # Pydantic request/response models
│   ├── requirements.txt
│   ├── .env.example
│   ├── data/
│   │   └── ingredients.json     # Curated ingredient database (38 entries)
│   └── services/
│       ├── claude_service.py    # Claude Vision OCR + AI explanations
│       └── ingredient_service.py# DB lookup + search
│
└── frontend/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx             # Main scanner page
    │   └── globals.css
    ├── components/
    │   ├── ImageUploader.tsx    # Drag-drop + camera capture
    │   ├── SkinTypeSelector.tsx # 4-way skin type picker
    │   ├── IngredientCard.tsx   # Per-ingredient card with expand
    │   ├── ResultsSummary.tsx   # Acne score ring + summary
    │   └── SearchBar.tsx        # Live ingredient search
    ├── lib/
    │   ├── types.ts             # Shared TypeScript interfaces
    │   └── api.ts               # API client functions
    ├── next.config.js           # Proxies /api/* → backend
    ├── tailwind.config.js
    └── package.json
```

---

## Deployment

### Backend (e.g. Railway, Render, Fly.io)

1. Set environment variable `ANTHROPIC_API_KEY`
2. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Frontend (Vercel — recommended)

1. Push the `frontend/` folder to GitHub
2. Import in Vercel; set root to `frontend/`
3. Add environment variable:
   ```
   NEXT_PUBLIC_API_BASE=https://your-backend-url.com
   ```
4. Update `next.config.js` rewrites destination to use that URL

---

## How It Works

1. **Image → Claude Vision OCR**: The uploaded image is sent to Claude's vision model, which reads the ingredient list even from angled or low-quality photos.

2. **NER + DB lookup**: Extracted ingredient names are matched against the curated database. Known ingredients get pre-loaded metadata (comedogenic rating, skin type notes).

3. **AI Explanation**: A single batched Claude call generates plain-English explanations for all ingredients simultaneously. The system prompt is cached (prompt caching) for faster, cheaper repeated calls.

4. **Personalisation**: All explanations are generated in context of the selected skin type, so the advice is specific to you.

5. **Scoring**: Claude assigns each product an acne score (1–10) and overall rating based on the full ingredient profile.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend | Python 3.11+, FastAPI |
| AI / OCR | Anthropic Claude Sonnet (Vision + Text) |
| Ingredient DB | Curated JSON (38 common skincare ingredients) |
| Deployment | Vercel (frontend) + Railway/Render (backend) |

---

## Notes

- **Not medical advice**: All analysis is informational only. See a dermatologist for personalised guidance.
- **Accuracy**: Claude's vision is excellent at reading printed labels. Handwritten or very blurry labels may not extract correctly.
- **Prompt caching**: The AI system prompt is cached via Anthropic's ephemeral cache, reducing latency and cost on repeated scans.
