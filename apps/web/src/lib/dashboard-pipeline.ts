import { attachWarnings, deriveMacroSignals } from "@/lib/macro-derivations";
import { fetchFredSeries } from "@/lib/providers/fred";
import { fetchYahooSeries } from "@/lib/providers/yahoo";
import { SERIES_CATALOG, type SeriesSpec } from "@/lib/series-catalog";
import type { DashboardData, MacroSeries } from "@/types/macro";

type FredFetcher = typeof fetchFredSeries;
type YahooFetcher = typeof fetchYahooSeries;

interface BuildDashboardDataOptions {
  fredApiKey?: string;
  generatedAt?: string;
}

interface RunDashboardPipelineOptions extends BuildDashboardDataOptions {
  fetchFredSeries?: FredFetcher;
  fetchYahooSeries?: YahooFetcher;
  specs?: SeriesSpec[];
}

async function fetchSeriesBySpec(
  spec: SeriesSpec,
  fredFetcher: FredFetcher,
  yahooFetcher: YahooFetcher
): Promise<MacroSeries> {
  const itemStart = performance.now();
  const series =
    spec.source === "fred"
      ? await fredFetcher(spec)
      : await yahooFetcher(spec);
  const itemEnd = performance.now();

  if (itemEnd - itemStart > 1000) {
    console.warn(
      `[MacroLens] Slow fetch for ${spec.key} (${spec.source}): ${(itemEnd - itemStart).toFixed(0)}ms`
    );
  }

  return series;
}

export async function fetchDashboardSeries(
  specs: SeriesSpec[] = SERIES_CATALOG,
  options: Pick<
    RunDashboardPipelineOptions,
    "fetchFredSeries" | "fetchYahooSeries"
  > = {}
): Promise<MacroSeries[]> {
  const fredFetcher = options.fetchFredSeries ?? fetchFredSeries;
  const yahooFetcher = options.fetchYahooSeries ?? fetchYahooSeries;
  const start = performance.now();
  const results = await Promise.all(
    specs.map((spec) => fetchSeriesBySpec(spec, fredFetcher, yahooFetcher))
  );
  const end = performance.now();

  console.log(
    `[MacroLens] Total fetch time: ${(end - start).toFixed(0)}ms for ${specs.length} series`
  );

  return results;
}

function getBaseWarnings(fredApiKey?: string): string[] {
  if (fredApiKey) {
    return [];
  }

  return [
    "FRED ist aktuell deaktiviert (kein FRED_API_KEY in .env.local). Yahoo-Serien funktionieren trotzdem.",
  ];
}

export function buildDashboardData(
  series: MacroSeries[],
  options: BuildDashboardDataOptions = {}
): DashboardData {
  const partial: DashboardData = {
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    series,
    signals: deriveMacroSignals(series),
    warnings: [],
  };

  return {
    ...partial,
    warnings: attachWarnings(getBaseWarnings(options.fredApiKey), partial),
  };
}

export async function runDashboardPipeline(
  options: RunDashboardPipelineOptions = {}
): Promise<DashboardData> {
  const series = await fetchDashboardSeries(options.specs, options);

  return buildDashboardData(series, options);
}
