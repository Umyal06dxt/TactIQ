import { api } from "@/lib/api";
import { BriefingClient } from "./BriefingClient";

export const dynamic = "force-dynamic";

export default async function BriefingPage({ params }: { params: Promise<{ vendor: string }> }) {
  const { vendor } = await params;
  const initial = await api.briefing(vendor);
  return <BriefingClient vendor={vendor} initial={initial} />;
}
