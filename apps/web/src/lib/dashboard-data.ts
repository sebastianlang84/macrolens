import { deriveMacroSignals, attachWarnings } from "@/lib/macro-derivations";
import { SERIES_CATALOG } from "@/lib/series-catalog";
import { fetchFredSeries } from "@/lib/providers/fred";
import { fetchYahooSeries } from "@/lib/providers/yahoo";
import type { DashboardData, MacroSeries } from "@/types/macro";

async function fetchBySource(): Promise<MacroSeries[]> {
  return Promise.all(
    SERIES_CATALOG.map((spec) =>
      spec.source === "fred" ? fetchFredSeries(spec) : fetchYahooSeries(spec),
    ),
  );
}

export async function getDashboardData(): Promise<DashboardData> {
  const series = await fetchBySource();

  const baseWarnings: string[] = [];
  if (!process.env.FRED_API_KEY) {
    baseWarnings.push(
      "FRED ist aktuell deaktiviert (kein FRED_API_KEY in .env.local). Yahoo-Serien funktionieren trotzdem.",
    );
  }

  const partial: DashboardData = {
    generatedAt: new Date().toISOString(),
    series,
    signals: deriveMacroSignals(series),
    warnings: [],
  };

  return {
    ...partial,
    warnings: attachWarnings(baseWarnings, partial),
  };
}

