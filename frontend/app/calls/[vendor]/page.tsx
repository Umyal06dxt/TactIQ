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
    <main className="min-h-screen bg-[#05080f] text-white px-6 py-10 max-w-3xl mx-auto">
      <div className="mb-8 flex items-center gap-4">
        <Link href={`/briefing/${vendor}`} className="text-white/30 hover:text-white/60 text-sm transition-colors">
          ← Briefing
        </Link>
        <div className="w-px h-4 bg-white/10" />
        <h1 className="text-2xl font-bold">{vendor.toUpperCase()} — Call History</h1>
      </div>
      {calls.length === 0 ? (
        <div className="text-white/30 text-center py-20">No calls recorded yet.</div>
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
