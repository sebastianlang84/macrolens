import { deriveMacroSignals, attachWarnings } from "@/lib/macro-derivations";
import { SERIES_CATALOG } from "@/lib/series-catalog";
import { fetchFredSeries } from "@/lib/providers/fred";
import { fetchYahooSeries } from "@/lib/providers/yahoo";
import type { DashboardData, MacroSeries } from "@/types/macro";

async function fetchBySource(): Promise<MacroSeries[]> {
  const start = performance.now();
  const results = await Promise.all(
    SERIES_CATALOG.map(async (spec) => {
      const itemStart = performance.now();
      const series = spec.source === "fred" ? await fetchFredSeries(spec) : await fetchYahooSeries(spec);
      const itemEnd = performance.now();
      
      if (itemEnd - itemStart > 1000) {
        console.warn(`[MacroLens] Slow fetch for ${spec.key} (${spec.source}): ${(itemEnd - itemStart).toFixed(0)}ms`);
      }
      
      return series;
    }),
  );
  const end = performance.now();
  console.log(`[MacroLens] Total fetch time: ${(end - start).toFixed(0)}ms for ${SERIES_CATALOG.length} series`);
  return results;
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

