"use client";

import { useEffect, useState } from "react";
import { scanProduct } from "@/lib/api";
import { ScanResponse, SkinType } from "@/lib/types";
import SkinTypeSelector from "@/components/SkinTypeSelector";
import ImageUploader from "@/components/ImageUploader";
import IngredientCard from "@/components/IngredientCard";
import ResultsSummary from "@/components/ResultsSummary";
import SearchBar from "@/components/SearchBar";
import clsx from "clsx";

type Tab = "actives" | "concerns" | "all";

// ── Animated loading state ──────────────────────────────────────────────────
const LOADING_STEPS = [
  { icon: "🔍", text: "Reading the ingredient label…" },
  { icon: "🧬", text: "Identifying ingredients…" },
  { icon: "✨", text: "Generating personalised explanations…" },
];

function LoadingView() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 2000);
    const t2 = setTimeout(() => setStep(2), 5000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-8 animate-fade-in">
      {/* Spinner */}
      <div className="relative">
        <div className="h-20 w-20 rounded-full border-4 border-sage-100" />
        <div className="absolute inset-0 h-20 w-20 rounded-full border-4 border-transparent border-t-sage-500 animate-spin-slow" />
        <span className="absolute inset-0 flex items-center justify-center text-2xl">
          {LOADING_STEPS[step].icon}
        </span>
      </div>

      {/* Steps */}
      <div className="w-full max-w-xs space-y-2">
        {LOADING_STEPS.map((s, i) => (
          <div
            key={i}
            className={clsx(
              "flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-500",
              i < step
                ? "bg-sage-100 text-sage-700"
                : i === step
                ? "bg-white border border-sage-300 text-gray-800 shadow-sm scale-[1.02]"
                : "bg-gray-50 text-gray-400"
            )}
          >
            <span className="text-lg shrink-0">{i < step ? "✅" : s.icon}</span>
            <span className="text-sm font-medium">{s.text}</span>
            {i === step && (
              <span className="ml-auto flex gap-0.5">
                {[0, 1, 2].map((d) => (
                  <span
                    key={d}
                    className="h-1.5 w-1.5 rounded-full bg-sage-400 animate-pulse"
                    style={{ animationDelay: `${d * 200}ms` }}
                  />
                ))}
              </span>
            )}
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 text-center max-w-[220px]">
        This usually takes 10–20 seconds depending on the number of ingredients.
      </p>
    </div>
  );
}

// ── Step indicator ──────────────────────────────────────────────────────────
function StepBadge({ n, done }: { n: number; done: boolean }) {
  return (
    <span
      className={clsx(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all",
        done ? "bg-sage-500 text-white" : "bg-sage-100 text-sage-700"
      )}
    >
      {done ? (
        <svg viewBox="0 0 14 14" fill="none" className="h-3.5 w-3.5">
          <path d="M2.5 7l3 3 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        n
      )}
    </span>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function HomePage() {
  const [skinType, setSkinType] = useState<SkinType>("combination");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [tab, setTab] = useState<Tab>("actives");
  const [searchOpen, setSearchOpen] = useState(false);

  const canScan = !!file && !isPending;

  const handleScan = async () => {
    if (!file || isPending) return;
    setError(null);
    setIsPending(true);
    try {
      const data = await scanProduct(file, skinType);
      setResult(data);
      setTab("actives");
      setTimeout(
        () => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }),
        120
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setFile(null);
    setError(null);
    setSearchOpen(false);
  };

  const counts = result
    ? {
        actives: result.ingredients.filter((i) => i.is_active).length,
        concerns: result.ingredients.filter(
          (i) => i.tag === "may_irritate" || i.tag === "avoid_acne"
        ).length,
        all: result.total_ingredients,
      }
    : { actives: 0, concerns: 0, all: 0 };

  const filtered = result
    ? tab === "actives"
      ? result.ingredients.filter((i) => i.is_active)
      : tab === "concerns"
      ? result.ingredients.filter((i) => i.tag === "may_irritate" || i.tag === "avoid_acne")
      : result.ingredients
    : [];

  return (
    <div className="min-h-screen flex flex-col">

      {/* ── Sticky header ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sage-500 text-white text-lg shadow-sm">
              🧴
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-900 leading-tight text-sm sm:text-base truncate">
                Skincare Scanner
              </p>
              <p className="text-[11px] text-gray-400 hidden sm:block">AI ingredient analyser</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setSearchOpen((p) => !p)}
              className={clsx(
                "flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all",
                searchOpen
                  ? "border-sage-400 bg-sage-50 text-sage-700"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              )}
            >
              🔍 <span className="hidden sm:inline">Search</span>
            </button>
            {result && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:border-sage-400 hover:text-sage-700 transition-all"
              >
                📷 <span className="hidden sm:inline">Scan new</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-5">

        {/* ── Search panel ──────────────────────────────────────────────── */}
        {searchOpen && (
          <div className="card p-4 animate-slide-up">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-gray-800">Search any ingredient</p>
              <button
                onClick={() => setSearchOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ×
              </button>
            </div>
            <SearchBar skinType={skinType} />
          </div>
        )}

        {/* ── LOADING ───────────────────────────────────────────────────── */}
        {isPending && <LoadingView />}

        {/* ── SCANNER FORM (no result yet) ──────────────────────────────── */}
        {!result && !isPending && (
          <div className="space-y-5 animate-fade-in">

            {/* Hero */}
            <div className="rounded-2xl bg-gradient-to-br from-sage-500 to-sage-700 text-white px-6 py-8 text-center shadow-md">
              <div className="text-5xl mb-3">🧴</div>
              <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">
                Know what&rsquo;s in your skincare
              </h1>
              <p className="mt-2 text-sage-100 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
                Snap a photo of any product&rsquo;s ingredient label and get plain-English
                explanations — especially tailored for acne-prone skin.
              </p>

              {/* How it works */}
              <div className="mt-6 grid grid-cols-3 gap-3">
                {[
                  { icon: "📷", step: "Upload label photo" },
                  { icon: "🤖", step: "AI reads & explains" },
                  { icon: "💡", step: "Understand your product" },
                ].map((s, i) => (
                  <div key={i} className="bg-white/10 rounded-xl p-3">
                    <div className="text-2xl mb-1">{s.icon}</div>
                    <p className="text-xs text-sage-100 font-medium leading-tight">{s.step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 1 — Skin type */}
            <div className="card p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <StepBadge n={1} done={false} />
                <div>
                  <h2 className="font-bold text-gray-900 text-sm">Your skin type</h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Helps us personalise the ingredient advice for you
                  </p>
                </div>
              </div>
              <SkinTypeSelector value={skinType} onChange={setSkinType} />
            </div>

            {/* Step 2 — Upload */}
            <div className="card p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <StepBadge n={2} done={!!file} />
                <div>
                  <h2 className="font-bold text-gray-900 text-sm">
                    {file ? "Photo selected ✓" : "Upload the ingredient label"}
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    The back of the product where ingredients are listed
                  </p>
                </div>
              </div>
              <ImageUploader onFile={setFile} disabled={isPending} />
            </div>

            {/* Step 3 — Scan button */}
            <div className="space-y-3">
              <button
                onClick={handleScan}
                disabled={!canScan}
                className={clsx(
                  "relative w-full rounded-2xl py-4 text-base font-bold tracking-wide transition-all duration-200 shadow-sm",
                  canScan
                    ? "bg-sage-500 hover:bg-sage-600 text-white hover:shadow-lg active:scale-[0.98]"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                )}
              >
                {!file ? (
                  "Select a photo to continue"
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span>✨</span>
                    Analyse Ingredients
                    <span className="text-sage-200 font-normal text-sm ml-1">→</span>
                  </span>
                )}
              </button>

              {!file && (
                <p className="text-center text-xs text-gray-400">
                  Upload a photo above, then tap Analyse to get your results
                </p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 animate-fade-in">
                <div className="flex items-start gap-2.5">
                  <span className="text-xl shrink-0">❌</span>
                  <div>
                    <p className="font-semibold text-red-800 text-sm">Could not analyse</p>
                    <p className="text-sm text-red-600 mt-0.5">{error}</p>
                    <p className="text-xs text-red-400 mt-1">
                      Make sure the label is clearly visible and well-lit, then try again.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Trust signals */}
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { icon: "🔒", title: "Private", desc: "Photo is not stored" },
                { icon: "⚡", title: "Fast", desc: "Results in ~15 seconds" },
                { icon: "🆓", title: "Free", desc: "No account needed" },
              ].map((f) => (
                <div key={f.title} className="rounded-xl bg-white border border-gray-100 p-3 text-center">
                  <div className="text-xl mb-1">{f.icon}</div>
                  <p className="text-xs font-bold text-gray-700">{f.title}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── RESULTS ───────────────────────────────────────────────────── */}
        {result && !isPending && (
          <div id="results" className="space-y-5 animate-fade-in">

            {/* Summary */}
            <ResultsSummary
              summary={result.summary}
              skinType={result.skin_type}
              totalIngredients={result.total_ingredients}
              activesCount={result.actives_count}
            />

            {/* Legend */}
            <div className="card px-4 py-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2.5">
                Ingredient rating legend
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { emoji: "✅", label: "Good for acne", colour: "text-emerald-700", bg: "bg-emerald-50" },
                  { emoji: "⚪", label: "Neutral",        colour: "text-gray-600",    bg: "bg-gray-50" },
                  { emoji: "⚠️", label: "May irritate",   colour: "text-amber-700",   bg: "bg-amber-50" },
                  { emoji: "🚫", label: "Avoid for acne", colour: "text-red-700",     bg: "bg-red-50" },
                ].map((l) => (
                  <div key={l.label} className={clsx("flex items-center gap-2 rounded-lg px-3 py-2", l.bg)}>
                    <span className="text-base">{l.emoji}</span>
                    <span className={clsx("text-xs font-semibold", l.colour)}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tab bar */}
            <div>
              <div className="flex gap-1 bg-gray-100 rounded-2xl p-1">
                {(
                  [
                    { id: "actives",  label: "Key Actives",   count: counts.actives,  icon: "⚡" },
                    { id: "concerns", label: "Watch Out",      count: counts.concerns, icon: "⚠️" },
                    { id: "all",      label: "All Ingredients",count: counts.all,       icon: "📋" },
                  ] as { id: Tab; label: string; count: number; icon: string }[]
                ).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={clsx(
                      "flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 rounded-xl py-2.5 px-2 text-xs font-semibold transition-all duration-150",
                      tab === t.id
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    )}
                  >
                    <span>{t.icon}</span>
                    <span className="hidden sm:inline">{t.label}</span>
                    <span
                      className={clsx(
                        "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                        tab === t.id ? "bg-sage-100 text-sage-700" : "bg-gray-200 text-gray-500"
                      )}
                    >
                      {t.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Tab label on mobile */}
              <p className="sm:hidden text-center text-xs font-medium text-gray-500 mt-2">
                {tab === "actives" ? "⚡ Key Actives" : tab === "concerns" ? "⚠️ Watch Out" : "📋 All Ingredients"}
              </p>
            </div>

            {/* Ingredient list */}
            {filtered.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-gray-200 py-14 text-center">
                <p className="text-3xl mb-2">🎉</p>
                <p className="font-semibold text-gray-700">None found in this category</p>
                <p className="text-sm text-gray-400 mt-1">
                  {tab === "concerns"
                    ? "No irritating ingredients detected — great sign!"
                    : "Switch to All Ingredients to see the full list."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((ingredient, idx) => (
                  <IngredientCard key={ingredient.name} ingredient={ingredient} index={idx} />
                ))}
              </div>
            )}

            {/* Raw text */}
            {result.raw_text && (
              <details className="card text-sm overflow-hidden">
                <summary className="flex items-center gap-2 px-4 py-3.5 cursor-pointer font-medium text-gray-500 hover:text-gray-700 select-none list-none">
                  <span>📄</span>
                  <span>View extracted label text</span>
                  <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4 ml-auto text-gray-400">
                    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </summary>
                <div className="px-4 pb-4">
                  <pre className="text-xs text-gray-500 leading-relaxed whitespace-pre-wrap font-mono bg-gray-50 rounded-xl p-3 overflow-x-auto">
                    {result.raw_text}
                  </pre>
                </div>
              </details>
            )}

            {/* Scan again */}
            <button
              onClick={handleReset}
              className="w-full rounded-2xl border-2 border-sage-300 bg-white py-4 text-sm font-bold text-sage-700 hover:bg-sage-50 hover:border-sage-400 hover:shadow-sm transition-all active:scale-[0.99]"
            >
              📷 Scan another product
            </button>
          </div>
        )}
      </main>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="mt-8 pb-8 text-center text-xs text-gray-400 px-4 space-y-1">
        <p>Skincare Scanner · Powered by <span className="font-semibold text-gray-500">Claude AI</span></p>
        <p>Not medical advice. Always consult a dermatologist for personalised guidance.</p>
      </footer>
    </div>
  );
}
