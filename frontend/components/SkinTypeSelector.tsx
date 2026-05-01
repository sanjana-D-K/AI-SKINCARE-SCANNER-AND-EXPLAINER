"use client";

import { SkinType } from "@/lib/types";
import clsx from "clsx";

const OPTIONS: {
  value: SkinType;
  emoji: string;
  label: string;
  desc: string;
  colour: string;
  activeBg: string;
  activeBorder: string;
}[] = [
  {
    value: "oily",
    emoji: "💧",
    label: "Oily",
    desc: "Shiny, large pores, prone to breakouts",
    colour: "text-blue-600",
    activeBg: "bg-blue-50",
    activeBorder: "border-blue-400",
  },
  {
    value: "dry",
    emoji: "🌵",
    label: "Dry",
    desc: "Tight, flaky, sometimes dull",
    colour: "text-orange-600",
    activeBg: "bg-orange-50",
    activeBorder: "border-orange-400",
  },
  {
    value: "combination",
    emoji: "⚖️",
    label: "Combination",
    desc: "Oily T-zone, normal or dry cheeks",
    colour: "text-purple-600",
    activeBg: "bg-purple-50",
    activeBorder: "border-purple-400",
  },
  {
    value: "sensitive",
    emoji: "🌸",
    label: "Sensitive",
    desc: "Reacts easily, redness, delicate",
    colour: "text-pink-600",
    activeBg: "bg-pink-50",
    activeBorder: "border-pink-400",
  },
];

interface Props {
  value: SkinType;
  onChange: (v: SkinType) => void;
}

export default function SkinTypeSelector({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {OPTIONS.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={clsx(
              "relative flex items-start gap-3 rounded-2xl border-2 p-3.5 text-left transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-400",
              selected
                ? `${opt.activeBg} ${opt.activeBorder} shadow-sm`
                : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
            )}
          >
            {/* Check indicator */}
            <span
              className={clsx(
                "absolute top-2.5 right-2.5 flex h-5 w-5 items-center justify-center rounded-full border-2 text-white text-xs transition-all",
                selected
                  ? `${opt.activeBorder} bg-current`
                  : "border-gray-300 bg-white"
              )}
            >
              {selected && (
                <svg viewBox="0 0 12 12" fill="none" className="h-3 w-3">
                  <path
                    d="M2 6l3 3 5-5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={opt.colour}
                  />
                </svg>
              )}
            </span>

            <span className="mt-0.5 text-2xl leading-none">{opt.emoji}</span>
            <div className="min-w-0 flex-1 pr-5">
              <p
                className={clsx(
                  "font-semibold text-sm leading-tight",
                  selected ? opt.colour : "text-gray-800"
                )}
              >
                {opt.label}
              </p>
              <p className="mt-0.5 text-xs text-gray-500 leading-snug">{opt.desc}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
