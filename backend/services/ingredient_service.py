import json
import os
import re
from typing import List, Dict, Any, Optional


DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "ingredients.json")


class IngredientService:
    def __init__(self):
        self._db: List[Dict] = []
        self._load()

    def _load(self):
        with open(DATA_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        self._db = data.get("ingredients", [])

    def _normalize(self, name: str) -> str:
        return re.sub(r"[^a-z0-9]", "", name.lower())

    def _find(self, ingredient_name: str) -> Optional[Dict]:
        needle = self._normalize(ingredient_name)
        for entry in self._db:
            if self._normalize(entry["inci_name"]) == needle:
                return entry
            for alias in entry.get("aliases", []):
                if self._normalize(alias) == needle:
                    return entry
        # Partial match fallback
        for entry in self._db:
            if needle in self._normalize(entry["inci_name"]):
                return entry
            for alias in entry.get("aliases", []):
                if needle in self._normalize(alias):
                    return entry
        return None

    def lookup_all(self, ingredients: List[str]) -> Dict[str, Optional[Dict]]:
        """Return a mapping of ingredient name → DB entry (or None if not found)."""
        return {name: self._find(name) for name in ingredients}

    def search(self, query: str, skin_type: str = "combination") -> List[Dict]:
        needle = self._normalize(query)
        results = []
        for entry in self._db:
            if (
                needle in self._normalize(entry["inci_name"])
                or any(needle in self._normalize(a) for a in entry.get("aliases", []))
                or needle in self._normalize(entry.get("function", ""))
            ):
                skin_note = entry.get("skin_type_notes", {}).get(skin_type)
                results.append(
                    {
                        "name": entry["inci_name"],
                        "function": entry["function"],
                        "explanation": entry["explanation"],
                        "tag": entry["tag"],
                        "acne_friendly": entry["acne_friendly"],
                        "is_active": entry["is_active"],
                        "skin_type_note": skin_note,
                        "comedogenic_rating": entry.get("comedogenic_rating"),
                    }
                )
        return results[:10]
