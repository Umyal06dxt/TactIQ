"use client";
import type { Briefing } from "@/lib/types";

export function SignalFeed({ signals }: { signals: Briefing["recent_signals"] }) {
  if (!signals.length) return null;
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-6">
      <h3 className="mb-3 font-semibold">Recent signals</h3>
      <ul className="space-y-3">
        {signals.map((s, i) => (
          <li key={i} className="border-l-2 border-neutral-200 pl-4">
            <div className="text-xs uppercase tracking-wide text-neutral-500">
              {s.date} · {s.source}
            </div>
            <div className="font-medium">{s.summary}</div>
            <div className="text-sm italic text-neutral-600">{s.interpretation}</div>
          </li>
        ))}
      </ul>
    </section>
  );
}
