"use client";

import clsx from "clsx";
import { ProductSummary } from "@/lib/types";

type Rating = "excellent" | "good" | "caution" | "avoid" | "unknown";

const RATING: Record<Rating, { label: string; emoji: string; gradient: string; ring: string; score_colour: string }> = {
  excellent: {
    label: "Excellent for acne-prone skin",
    emoji: "🌟",
    gradient: "from-emerald-50 to-sage-50",
    ring: "ring-emerald-300",
    score_colour: "#059669",
  },
  good: {
    label: "Good for acne-prone skin",
    emoji: "✅",
    gradient: "from-green-50 to-sage-50",
    ring: "ring-green-300",
    score_colour: "#16a34a",
  },
  caution: {
    label: "Use with caution",
    emoji: "⚠️",
    gradient: "from-amber-50 to-yellow-50",
    ring: "ring-amber-300",
    score_colour: "#d97706",
  },
  avoid: {
    label: "Not ideal for acne-prone skin",
    emoji: "🚫",
    gradient: "from-red-50 to-rose-50",
    ring: "ring-red-300",
    score_colour: "#dc2626",
  },
  unknown: {
    label: "Analysis incomplete",
    emoji: "❓",
    gradient: "from-gray-50 to-gray-100",
    ring: "ring-gray-300",
    score_colour: "#6b7280",
  },
};

function ScoreRing({ score, colour }: { score: number; colour: string }) {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const dash = circ * (score / 10);
  return (
    <div className="relative flex items-center justify-center w-28 h-28 shrink-0">
      <svg width="112" height="112" viewBox="0 0 112 112" className="-rotate-90">
        <circle cx="56" cy="56" r={r} fill="none" stroke="#e5e7eb" strokeWidth="10" />
        <circle
          cx="56"
          cy="56"
          r={r}
          fill="none"
          stroke={colour}
          strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray .8s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center leading-none">
        <span className="text-3xl font-black" style={{ color: colour }}>{score}</span>
        <span className="text-[10px] font-semibold text-gray-400 mt-0.5 tracking-wide">/ 10</span>
      </div>
    </div>
  );
}

interface Props {
  summary: ProductSummary;
  skinType: string;
  totalIngredients: number;
  activesCount: number;
}

export default function ResultsSummary({ summary, skinType, totalIngredients, activesCount }: Props) {
  const cfg = RATING[summary.overall_rating as Rating] ?? RATING.unknown;

  return (
    <div
      className={clsx(
        "rounded-2xl bg-gradient-to-br p-5 ring-2 animate-scale-in",
        cfg.gradient,
        cfg.ring
      )}
    >
      {/* Top: score + headline */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
        <ScoreRing score={summary.acne_score} colour={cfg.score_colour} />

        <div className="flex-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-1.5">
            <span className="text-2xl">{cfg.emoji}</span>
            <h2 className="text-lg font-bold text-gray-900">{cfg.label}</h2>
          </div>

          <p className="text-sm text-gray-700 leading-relaxed">{summary.summary_text}</p>

          {/* Stats chips */}
          <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-2">
            {[
              { label: `${totalIngredients} ingredients`, icon: "🧪" },
              { label: `${activesCount} actives`, icon: "⚡" },
              { label: `${skinType} skin`, icon: "👤" },
            ].map((s) => (
              <span
                key={s.label}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/70 border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700"
              >
                {s.icon} {s.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Key actives + watch list */}
      {(summary.key_actives.length > 0 || summary.ingredients_to_watch.length > 0) && (
        <div className="mt-4 grid sm:grid-cols-2 gap-3">
          {summary.key_actives.length > 0 && (
            <div className="rounded-xl bg-white/70 backdrop-blur-sm border border-emerald-200 p-3">
              <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-2">
                ⚡ Key actives found
              </p>
              <div className="flex flex-wrap gap-1.5">
                {summary.key_actives.map((a) => (
                  <span
                    key={a}
                    className="rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-0.5"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          {summary.ingredients_to_watch.length > 0 && (
            <div className="rounded-xl bg-white/70 backdrop-blur-sm border border-amber-200 p-3">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2">
                ⚠️ Watch these
              </p>
              <div className="flex flex-wrap gap-1.5">
                {summary.ingredients_to_watch.map((w) => (
                  <span
                    key={w}
                    className="rounded-full bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-0.5"
                  >
                    {w}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <p className="mt-4 text-[11px] text-gray-400 text-center sm:text-left leading-relaxed">
        ⚕️ For informational purposes only — not medical advice. Consult a dermatologist for personalised guidance.
      </p>
    </div>
  );
}
