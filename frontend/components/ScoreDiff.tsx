"use client";
import { useEffect } from "react";
import type { ScoreDiff } from "@/lib/types";

export function ScoreDiff({ diffs, onDismiss }: { diffs: Record<string, ScoreDiff>; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div className="fixed bottom-6 right-6 z-40 w-80 rounded-xl border border-neutral-200 bg-white p-5 shadow-xl">
      <h3 className="mb-3 text-sm font-semibold">Score updates</h3>
      <ul className="space-y-2">
        {Object.entries(diffs).map(([name, d]) => (
          <li key={name} className="flex items-center justify-between text-sm">
            <span className="font-medium">{name}</span>
            <span className={`tabular-nums ${d.direction === "up" ? "text-emerald-600" : "text-red-600"}`}>
              {d.old.toFixed(2)} → {d.new.toFixed(2)} {d.direction === "up" ? "▲" : "▼"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
