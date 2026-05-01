from pydantic import BaseModel
from typing import List, Optional, Dict


class IngredientResult(BaseModel):
    name: str
    explanation: str
    benefits: List[str]
    concerns: List[str]
    tag: str  # good_for_acne | may_irritate | neutral | avoid_acne
    acne_friendly: bool
    is_active: bool
    skin_type_note: Optional[str] = None
    comedogenic_rating: Optional[int] = None  # 0-5


class ProductSummary(BaseModel):
    overall_rating: str  # excellent | good | caution | avoid
    acne_score: int  # 1-10
    summary_text: str
    key_actives: List[str]
    ingredients_to_watch: List[str]


class ScanResponse(BaseModel):
    raw_text: str
    ingredients: List[IngredientResult]
    summary: ProductSummary
    skin_type: str
    total_ingredients: int
    actives_count: int


class SearchResult(BaseModel):
    name: str
    function: str
    explanation: str
    tag: str
    acne_friendly: bool
    is_active: bool


class SearchResponse(BaseModel):
    results: List[SearchResult]
    query: str
