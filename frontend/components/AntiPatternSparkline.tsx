"use client";
import type { Tactic } from "@/lib/types";

export function AntiPatternSparkline({ tactic }: { tactic: Tactic }) {
  const pts = tactic.history ?? [];
  if (pts.length < 2) return null;
  const w = 320, h = 60;
  const max = Math.max(...pts.map((p) => p.confidence));
  const min = Math.min(...pts.map((p) => p.confidence));
  const range = Math.max(0.01, max - min);
  const path = pts
    .map((p, i) => {
      const x = (i / (pts.length - 1)) * w;
      const y = h - ((p.confidence - min) / range) * h;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <section className="rounded-xl border-2 border-red-500 bg-red-50 p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-red-600 px-2 py-0.5 text-xs font-bold text-white">AVOID</span>
            <h3 className="font-semibold">{tactic.name}</h3>
          </div>
          <p className="mt-1 text-sm text-neutral-700">{tactic.evidence}</p>
        </div>
        <svg width={w} height={h} className="text-red-600">
          <path d={path} fill="none" stroke="currentColor" strokeWidth={2} />
          {pts.map((p, i) => {
            const x = (i / (pts.length - 1)) * w;
            const y = h - ((p.confidence - min) / range) * h;
            return <circle key={i} cx={x} cy={y} r={3} fill="currentColor" />;
          })}
        </svg>
      </div>
    </section>
  );
}
