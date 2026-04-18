import { api } from "@/lib/api";
import { AnalyticsDashboard } from "./AnalyticsDashboard";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  let portfolio = null;
  try {
    portfolio = await api.analytics.portfolio();
  } catch {}

  return <AnalyticsDashboard portfolio={portfolio} />;
}
