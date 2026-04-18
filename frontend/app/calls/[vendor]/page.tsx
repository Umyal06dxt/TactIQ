import { api } from "@/lib/api";
import Link from "next/link";
import { CallSummaryCard } from "@/components/CallSummaryCard";
import type { CallRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CallHistoryPage({ params }: { params: Promise<{ vendor: string }> }) {
  const { vendor } = await params;
  let calls: CallRecord[] = [];
  try {
    const data = await api.calls.list(vendor);
    calls = data.calls;
  } catch {}

  return (
    <main className="min-h-screen bg-[#f8f9fa] px-6 py-10 max-w-3xl mx-auto">
      <div className="mb-8 flex items-center gap-4">
        <Link href={`/briefing/${vendor}`} className="text-neutral-400 hover:text-neutral-700 text-sm transition-colors">
          ← Briefing
        </Link>
        <div className="w-px h-4 bg-neutral-200" />
        <h1 className="text-2xl font-black text-gray-900">{vendor.toUpperCase()} — Call History</h1>
      </div>
      {calls.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-12 text-center">
          <p className="text-neutral-500 font-semibold">No calls recorded yet</p>
          <p className="text-neutral-400 text-sm mt-1">Start a coaching session to see call history here.</p>
          <Link
            href={`/call/${vendor}`}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-gray-700 transition-colors"
          >
            Start first call →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {calls.map((c) => (
            <CallSummaryCard key={c.id} call={c} vendor={vendor} />
          ))}
        </div>
      )}
    </main>
  );
}
