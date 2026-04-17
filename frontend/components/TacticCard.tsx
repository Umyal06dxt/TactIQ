"use client";
import type { Tactic } from "@/lib/types";

function dotColor(c: number, anti: boolean) {
  if (anti) return "bg-red-500";
  if (c >= 0.7) return "bg-emerald-500";
  if (c >= 0.4) return "bg-amber-500";
  return "bg-neutral-400";
}

export function TacticCard({ tactic: t, flash }: { tactic: Tactic; flash: "up" | "down" | null }) {
  const filled = Math.round(t.confidence * 5);
  const flashBg =
    flash === "up" ? "ring-2 ring-emerald-400 bg-emerald-50" :
    flash === "down" ? "ring-2 ring-red-400 bg-red-50" : "";
  return (
    <div
      className={`rounded-xl border p-5 transition-all duration-500 ${t.is_anti_pattern ? "border-red-500 bg-red-50" : "border-neutral-200 bg-white"} ${flashBg}`}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{t.name}</h3>
        {t.is_anti_pattern && (
          <span className="rounded bg-red-600 px-2 py-0.5 text-xs font-bold text-white">AVOID</span>
        )}
      </div>
      <div className="mt-2 flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className={`h-2 w-2 rounded-full ${i < filled ? dotColor(t.confidence, t.is_anti_pattern) : "bg-neutral-200"}`} />
        ))}
        <span className="ml-2 text-sm tabular-nums text-neutral-600">{t.confidence.toFixed(2)}</span>
        <span className="ml-3 text-xs text-neutral-500">{t.successes} for {t.total_uses}</span>
      </div>
      <p className="mt-3 text-sm text-neutral-700">{t.evidence}</p>
      <p className="mt-2 text-xs italic text-neutral-500">{t.timing}</p>
    </div>
  );
}
