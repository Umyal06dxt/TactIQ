"use client";
import type { PipelineStep } from "@/lib/types";

export function PipelineStatus({ trail }: { trail: PipelineStep[] }) {
  if (!trail?.length) return null;
  return (
    <div className="mb-8 rounded-lg border border-neutral-200 bg-neutral-900 p-4 font-mono text-sm text-neutral-100">
      <div className="mb-2 text-xs uppercase tracking-widest text-neutral-400">Agents SDK Pipeline</div>
      {trail.map((s, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className={s.status === "ok" ? "text-emerald-400" : s.status === "error" ? "text-red-400" : "text-neutral-500"}>
            {s.status === "ok" ? "✓" : s.status === "error" ? "✗" : "·"}
          </span>
          <span className="text-neutral-200">{s.step}</span>
          {s.label && <span className="text-neutral-400">— {s.label}</span>}
          <span className="ml-auto tabular-nums text-neutral-400">{s.ms} ms</span>
        </div>
      ))}
    </div>
  );
}
