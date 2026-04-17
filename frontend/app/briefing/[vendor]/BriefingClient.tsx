"use client";
import { useState, useCallback } from "react";
import type { Briefing, NoMemoryResponse, ScoreDiff } from "@/lib/types";
import { api } from "@/lib/api";
import { MemoryToggle } from "@/components/MemoryToggle";
import { PipelineStatus } from "@/components/PipelineStatus";
import { TacticCard } from "@/components/TacticCard";
import { Playbook } from "@/components/Playbook";
import { AntiPatternSparkline } from "@/components/AntiPatternSparkline";
import { SignalFeed } from "@/components/SignalFeed";
import { PostCallForm } from "@/components/PostCallForm";
import { ScoreDiff as ScoreDiffPanel } from "@/components/ScoreDiff";

export function BriefingClient({ vendor, initial }: { vendor: string; initial: Briefing }) {
  const [memoryOn, setMemoryOn] = useState(true);
  const [briefing, setBriefing] = useState<Briefing>(initial);
  const [nomem, setNomem] = useState<NoMemoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [diffs, setDiffs] = useState<Record<string, ScoreDiff> | null>(null);
  const [flashTactics, setFlashTactics] = useState<Set<string>>(new Set());

  const toggleMemory = useCallback(async (next: boolean) => {
    setLoading(true);
    setMemoryOn(next);
    try {
      if (next) {
        const b = await api.briefing(vendor);
        setBriefing(b);
        setNomem(null);
      } else {
        const n = await api.nomemory(vendor);
        setNomem(n);
      }
    } finally {
      setLoading(false);
    }
  }, [vendor]);

  const onSubmitLog = useCallback(async (notes: string, outcome: string) => {
    const res = await api.ingest({
      vendor,
      notes,
      outcome: outcome as "Successful concession" | "No movement" | "Escalated" | "Rescheduled",
      timestamp: new Date().toISOString(),
    });
    setBriefing(res.briefing);
    setDiffs(res.score_diffs);
    setFlashTactics(new Set(Object.keys(res.score_diffs)));
    setShowForm(false);
    setTimeout(() => setFlashTactics(new Set()), 1200);
  }, [vendor]);

  const antiPattern = briefing.tactics.find((t) => t.is_anti_pattern);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-8 border-b border-neutral-200 pb-6 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <a href="/" className="text-sm text-neutral-400 hover:text-neutral-600">← Dashboard</a>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{vendor.toUpperCase()}</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Contact <span className="font-medium text-gray-700">{briefing.contract.contact}</span>
            {" · "}${briefing.contract.value.toLocaleString()}/yr
            {" · "}Renewal {briefing.contract.renewal_date}
            {" · "}<span className="font-semibold text-red-600">{briefing.contract.days_remaining} days remaining</span>
          </p>
        </div>
        <div className="shrink-0 pt-1">
          <MemoryToggle value={memoryOn} onChange={toggleMemory} disabled={loading} />
        </div>
      </header>

      <PipelineStatus trail={briefing.pipeline_trail} />

      <div className={`transition-opacity duration-300 ${loading ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
        {memoryOn ? (
          <div className="space-y-8">
            <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {briefing.tactics.filter((t) => !t.is_anti_pattern).map((t) => (
                <TacticCard key={t.name} tactic={t} flash={flashTactics.has(t.name) ? (diffs?.[t.name]?.direction ?? null) : null} />
              ))}
            </section>
            <Playbook playbook={briefing.playbook} flashRefs={flashTactics} />
            {antiPattern && <AntiPatternSparkline tactic={antiPattern} />}
            <SignalFeed signals={briefing.recent_signals.slice(0, 2)} />
            <div>
              <button
                onClick={() => setShowForm(true)}
                className="rounded-lg bg-black px-5 py-3 text-white hover:bg-neutral-800"
              >
                Log post-call notes
              </button>
            </div>
          </div>
        ) : nomem ? (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-neutral-500">Generic advice (no memory)</h2>
            {nomem.tactics.map((t) => (
              <div key={t.name} className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-4">
                <div className="font-medium text-gray-800">{t.name}</div>
                <div className="text-sm text-neutral-600 mt-1">{t.advice}</div>
              </div>
            ))}
            <div className="mt-4 rounded-lg border border-dashed border-neutral-200 bg-neutral-50 p-4 text-sm italic text-neutral-400 text-center">
              — no playbook without memory —
            </div>
          </section>
        ) : (
          <div className="flex items-center justify-center py-20 text-neutral-400">
            <svg className="animate-spin h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading…
          </div>
        )}
      </div>

      {showForm && (
        <PostCallForm onClose={() => setShowForm(false)} onSubmit={onSubmitLog} />
      )}

      {diffs && Object.keys(diffs).length > 0 && (
        <ScoreDiffPanel diffs={diffs} onDismiss={() => setDiffs(null)} />
      )}
    </main>
  );
}
