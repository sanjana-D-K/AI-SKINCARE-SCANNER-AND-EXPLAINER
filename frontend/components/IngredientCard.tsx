"use client";

import { useState } from "react";
import clsx from "clsx";
import { IngredientResult, IngredientTag } from "@/lib/types";

const TAG_CONFIG: Record<
  IngredientTag,
  {
    label: string;
    emoji: string;
    badgeBg: string;
    badgeText: string;
    strip: string;
    headerBg: string;
  }
> = {
  good_for_acne: {
    label: "Good for acne",
    emoji: "✅",
    badgeBg: "bg-emerald-100",
    badgeText: "text-emerald-800",
    strip: "border-l-4 border-emerald-400",
    headerBg: "bg-emerald-50/60",
  },
  neutral: {
    label: "Neutral",
    emoji: "⚪",
    badgeBg: "bg-gray-100",
    badgeText: "text-gray-600",
    strip: "border-l-4 border-gray-300",
    headerBg: "bg-gray-50/60",
  },
  may_irritate: {
    label: "May irritate",
    emoji: "⚠️",
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-800",
    strip: "border-l-4 border-amber-400",
    headerBg: "bg-amber-50/60",
  },
  avoid_acne: {
    label: "Avoid for acne",
    emoji: "🚫",
    badgeBg: "bg-red-100",
    badgeText: "text-red-800",
    strip: "border-l-4 border-red-400",
    headerBg: "bg-red-50/40",
  },
};

function ComedogenicDots({ rating }: { rating: number }) {
  const colours = ["bg-emerald-400", "bg-emerald-400", "bg-amber-400", "bg-orange-400", "bg-red-500"];
  const label = rating === 0 ? "Non-comedogenic" : rating <= 1 ? "Very low" : rating <= 2 ? "Low" : rating <= 3 ? "Moderate" : "High";
  return (
    <div className="flex items-center gap-2 mt-2.5">
      <span className="text-xs text-gray-400 shrink-0">Pore-clogging:</span>
      <div className="flex gap-1 items-center">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={clsx(
              "h-2.5 w-2.5 rounded-full transition-all",
              i < rating ? colours[Math.min(rating - 1, 4)] : "bg-gray-200"
            )}
          />
        ))}
      </div>
      <span className="text-xs font-medium text-gray-500">{label}</span>
    </div>
  );
}

interface Props {
  ingredient: IngredientResult;
  index: number;
}

export default function IngredientCard({ ingredient, index }: Props) {
  const [expanded, setExpanded] = useState(false);
  const cfg = TAG_CONFIG[ingredient.tag] ?? TAG_CONFIG.neutral;
  const hasConcerns = ingredient.concerns?.length > 0;
  const hasBenefits = ingredient.benefits?.length > 0;
  const hasNote = !!ingredient.skin_type_note;
  const hasDetails = hasBenefits || hasConcerns || hasNote;
  const hasComedo =
    ingredient.comedogenic_rating !== null && ingredient.comedogenic_rating !== undefined;

  return (
    <div
      className={clsx(
        "rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden transition-shadow hover:shadow-md animate-slide-up",
        cfg.strip
      )}
      style={{ animationDelay: `${Math.min(index * 35, 400)}ms` }}
    >
      {/* ── Card header ── */}
      <div className={clsx("px-4 pt-4 pb-3", cfg.headerBg)}>
        <div className="flex items-start justify-between gap-3">
          {/* Name + active badge */}
          <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
            {ingredient.is_active && (
              <span className="shrink-0 text-[10px] font-bold tracking-wide bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full uppercase">
                Active
              </span>
            )}
            <h3 className="font-bold text-gray-900 text-sm leading-snug">
              {ingredient.name}
            </h3>
          </div>

          {/* Tag badge */}
          <span
            className={clsx(
              "shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
              cfg.badgeBg,
              cfg.badgeText
            )}
          >
            <span>{cfg.emoji}</span>
            <span className="hidden sm:inline">{cfg.label}</span>
          </span>
        </div>

        {/* Explanation */}
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">{ingredient.explanation}</p>

        {/* Comedogenic dots */}
        {hasComedo && <ComedogenicDots rating={ingredient.comedogenic_rating as number} />}

        {/* Skin type note pill */}
        {hasNote && (
          <div className="mt-3 inline-flex items-start gap-1.5 rounded-xl bg-violet-50 border border-violet-200 px-3 py-2 text-xs text-violet-800 w-full">
            <span className="shrink-0 mt-0.5">💜</span>
            <span>
              <span className="font-semibold">For your skin: </span>
              {ingredient.skin_type_note}
            </span>
          </div>
        )}
      </div>

      {/* ── Expandable details ── */}
      {hasDetails && (
        <div className="border-t border-gray-100">
          <button
            type="button"
            onClick={() => setExpanded((p) => !p)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors group"
            aria-expanded={expanded}
          >
            <span className="group-hover:text-gray-700 transition-colors">
              {expanded ? "Hide details" : `Show ${hasBenefits ? "benefits" : ""}${hasBenefits && hasConcerns ? " & " : ""}${hasConcerns ? "concerns" : ""}`}
            </span>
            <svg
              viewBox="0 0 16 16"
              fill="none"
              className={clsx("h-4 w-4 text-gray-400 transition-transform duration-200", expanded && "rotate-180")}
            >
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {expanded && (
            <div className="px-4 pb-4 space-y-3 animate-fade-in">
              {hasBenefits && (
                <div>
                  <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-2">Benefits</p>
                  <ul className="space-y-1.5">
                    {ingredient.benefits.map((b, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {hasConcerns && (
                <div>
                  <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2">Watch out for</p>
                  <ul className="space-y-1.5">
                    {ingredient.concerns.map((c, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
