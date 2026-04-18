import { api } from "@/lib/api";
import { DashboardClient } from "@/app/DashboardClient";
import { DashboardGuard } from "./DashboardGuard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [{ vendors }, portfolio] = await Promise.all([
    api.vendors().catch(() => ({ vendors: [] as import("@/lib/types").Vendor[] })),
    api.analytics.portfolio().catch(() => null),
  ]);

  return (
    <>
      <DashboardGuard />
      <DashboardClient vendors={vendors} portfolio={portfolio} />
    </>
  );
}
