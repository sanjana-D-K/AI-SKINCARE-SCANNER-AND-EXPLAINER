export type SkinType = "oily" | "dry" | "combination" | "sensitive";

export type IngredientTag =
  | "good_for_acne"
  | "may_irritate"
  | "neutral"
  | "avoid_acne";

export interface IngredientResult {
  name: string;
  explanation: string;
  benefits: string[];
  concerns: string[];
  tag: IngredientTag;
  acne_friendly: boolean;
  is_active: boolean;
  skin_type_note?: string | null;
  comedogenic_rating?: number | null;
}

export interface ProductSummary {
  overall_rating: "excellent" | "good" | "caution" | "avoid" | "unknown";
  acne_score: number; // 1–10
  summary_text: string;
  key_actives: string[];
  ingredients_to_watch: string[];
}

export interface ScanResponse {
  raw_text: string;
  ingredients: IngredientResult[];
  summary: ProductSummary;
  skin_type: string;
  total_ingredients: number;
  actives_count: number;
}

export interface SearchResult {
  name: string;
  function: string;
  explanation: string;
  tag: IngredientTag;
  acne_friendly: boolean;
  is_active: boolean;
  skin_type_note?: string | null;
  comedogenic_rating?: number | null;
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
}
