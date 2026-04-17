import { api } from "@/lib/api";
import { CallClient } from "./CallClient";

export const dynamic = "force-dynamic";

export default async function CallPage({ params }: { params: Promise<{ vendor: string }> }) {
  const { vendor } = await params;
  const briefing = await api.briefing(vendor);
  return <CallClient vendor={vendor} briefing={briefing} />;
}
