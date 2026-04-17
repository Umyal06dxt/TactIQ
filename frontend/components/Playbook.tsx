"use client";
import type { Playbook as PB, PlaybookBranch } from "@/lib/types";

function Branch({ b, flashRefs, depth = 0 }: { b: PlaybookBranch; flashRefs: Set<string>; depth?: number }) {
  const flash = flashRefs.has(b.tactic_ref);
  return (
    <div
      style={{ marginLeft: `${depth * 16}px` }}
      className={`border-l-2 pl-4 py-2 transition-colors duration-700 ${flash ? "border-emerald-500 bg-emerald-50" : "border-neutral-200"}`}
    >
      <div className="text-xs uppercase tracking-wide text-neutral-500">{b.condition}</div>
      <div className="mt-1 font-medium">{b.move}</div>
      <div className="text-sm text-neutral-600">{b.rationale}</div>
      {b.followup?.map((f, i) => <Branch key={i} b={f} flashRefs={flashRefs} depth={depth + 1} />)}
    </div>
  );
}

export function Playbook({ playbook, flashRefs }: { playbook: PB; flashRefs: Set<string> }) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-6">
      <h3 className="mb-4 font-semibold">Playbook</h3>
      <div className={`rounded-lg p-3 transition-colors duration-700 ${flashRefs.has(playbook.opening.tactic_ref) ? "bg-emerald-50" : "bg-neutral-50"}`}>
        <div className="text-xs uppercase tracking-wide text-neutral-500">Opening</div>
        <div className="font-medium">{playbook.opening.move}</div>
        <div className="text-sm text-neutral-600">{playbook.opening.rationale}</div>
      </div>
      <div className="mt-4 space-y-2">
        {playbook.branches.map((b, i) => <Branch key={i} b={b} flashRefs={flashRefs} />)}
      </div>
    </section>
  );
}
