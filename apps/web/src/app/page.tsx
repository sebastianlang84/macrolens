import { DashboardClient } from "@/components/dashboard-client";
import { getDashboardData } from "@/lib/dashboard-data";

export const runtime = "nodejs";

export default async function Home() {
  const data = await getDashboardData();
  return <DashboardClient data={data} />;
}
