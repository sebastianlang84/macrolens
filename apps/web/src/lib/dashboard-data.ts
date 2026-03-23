import { runDashboardPipeline } from "@/lib/dashboard-pipeline";
import type { DashboardData } from "@/types/macro";

export async function getDashboardData(): Promise<DashboardData> {
  return runDashboardPipeline({ fredApiKey: process.env.FRED_API_KEY });
}
