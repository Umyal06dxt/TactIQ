import { api } from "@/lib/api";
import { CallSummaryDetail } from "@/components/CallSummaryDetail";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CallDetailPage({ params }: { params: Promise<{ vendor: string; id: string }> }) {
  const { vendor, id } = await params;
  const call = await api.calls.get(vendor, id);

  return (
    <main className="min-h-screen bg-[#05080f] text-white px-6 py-10 max-w-3xl mx-auto">
      <div className="mb-8">
        <Link href={`/calls/${vendor}`} className="text-white/30 hover:text-white/60 text-sm transition-colors">
          ← Call History
        </Link>
      </div>
      <CallSummaryDetail call={call} />
    </main>
  );
}
