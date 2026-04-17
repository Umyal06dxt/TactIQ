"use client";
import { useState } from "react";

const OUTCOMES = ["Successful concession", "No movement", "Escalated", "Rescheduled"] as const;

export function PostCallForm({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (notes: string, outcome: string) => Promise<void>;
}) {
  const [notes, setNotes] = useState("");
  const [outcome, setOutcome] = useState<(typeof OUTCOMES)[number]>("Successful concession");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (notes.length < 20) return;
    setLoading(true);
    try {
      await onSubmit(notes, outcome);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="w-full max-w-xl rounded-xl bg-white p-6 shadow-xl"
      >
        <h3 className="mb-4 text-xl font-semibold">Log post-call notes</h3>
        <label className="mb-4 block">
          <span className="mb-1 block text-sm font-medium">Outcome</span>
          <select
            value={outcome}
            onChange={(e) => setOutcome(e.target.value as (typeof OUTCOMES)[number])}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
          >
            {OUTCOMES.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </label>
        <label className="mb-4 block">
          <span className="mb-1 block text-sm font-medium">Notes</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={6}
            placeholder="What happened on the call? Who said what?"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
          />
          <span className="text-xs text-neutral-500">{notes.length}/20 min chars</span>
        </label>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 hover:bg-neutral-100">Cancel</button>
          <button
            type="submit"
            disabled={notes.length < 20 || loading}
            className="rounded-lg bg-black px-5 py-2 text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            {loading ? "Saving…" : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}
