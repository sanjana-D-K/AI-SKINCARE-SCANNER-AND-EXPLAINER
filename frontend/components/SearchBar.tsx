"use client";

import { useState, useRef, useEffect } from "react";
import { searchIngredients } from "@/lib/api";
import { SearchResult, SkinType, IngredientTag } from "@/lib/types";
import clsx from "clsx";

const TAG_LABELS: Record<IngredientTag, string> = {
  good_for_acne: "Good for acne",
  neutral: "Neutral",
  may_irritate: "May irritate",
  avoid_acne: "Avoid for acne",
};

const TAG_COLORS: Record<IngredientTag, string> = {
  good_for_acne: "bg-sage-100 text-sage-800",
  neutral: "bg-gray-100 text-gray-700",
  may_irritate: "bg-amber-100 text-amber-800",
  avoid_acne: "bg-red-100 text-red-800",
};

interface Props {
  skinType: SkinType;
}

export default function SearchBar({ skinType }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (value.trim().length < 2) { setResults([]); setOpen(false); return; }

    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchIngredients(value.trim(), skinType);
        setResults(data.results);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Search any ingredient (e.g. niacinamide, glycerin...)"
          className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-9 pr-4 text-sm text-gray-800 placeholder:text-gray-400 focus:border-sage-400 focus:outline-none focus:ring-2 focus:ring-sage-200 transition-all"
        />
        {loading && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 animate-spin text-base">⟳</span>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1.5 w-full rounded-2xl border border-gray-200 bg-white shadow-xl max-h-96 overflow-y-auto animate-fade-in">
          {results.map((r) => (
            <div
              key={r.name}
              className="px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-default"
            >
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className="font-semibold text-sm text-gray-800">
                  {r.is_active && (
                    <span className="mr-1.5 text-xs font-semibold bg-lavender-100 text-lavender-700 px-1.5 py-0.5 rounded-full">
                      ACTIVE
                    </span>
                  )}
                  {r.name}
                </span>
                <span className={clsx("text-xs px-2 py-0.5 rounded-full flex-shrink-0", TAG_COLORS[r.tag])}>
                  {TAG_LABELS[r.tag]}
                </span>
              </div>
              <p className="text-xs text-gray-500">{r.explanation}</p>
              {r.skin_type_note && (
                <p className="text-xs text-lavender-700 mt-1">
                  <span className="font-medium">Your skin: </span>{r.skin_type_note}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {open && results.length === 0 && !loading && query.length >= 2 && (
        <div className="absolute z-50 mt-1.5 w-full rounded-2xl border border-gray-200 bg-white shadow-xl px-4 py-3 text-sm text-gray-400 animate-fade-in">
          No results found for &ldquo;{query}&rdquo;
        </div>
      )}
    </div>
  );
}
