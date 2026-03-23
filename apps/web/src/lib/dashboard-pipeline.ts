import { attachWarnings, deriveMacroSignals } from "@/lib/macro-derivations";
import { fetchFredSeries } from "@/lib/providers/fred";
import { fetchYahooSeries } from "@/lib/providers/yahoo";
import { SERIES_CATALOG, type SeriesSpec } from "@/lib/series-catalog";
import type { DashboardData, DataSource, MacroSeries } from "@/types/macro";

type FredFetcher = typeof fetchFredSeries;
type YahooFetcher = typeof fetchYahooSeries;
type DiagnosticsReporter = (
  diagnostics: DashboardPipelineDiagnostics
) => void;

interface BuildDashboardDataOptions {
  fredApiKey?: string;
  generatedAt?: string;
}

interface RunDashboardPipelineOptions extends BuildDashboardDataOptions {
  fetchFredSeries?: FredFetcher;
  fetchYahooSeries?: YahooFetcher;
  onDiagnostics?: DiagnosticsReporter;
  specs?: SeriesSpec[];
}

export interface ProviderDiagnostics {
  errorCount: number;
  proxyCount: number;
  requestedSpecCount: number;
  seriesCount: number;
  source: DataSource;
  withDataCount: number;
}

export interface SlowFetchDiagnostics {
  durationMs: number;
  key: string;
  source: DataSource;
}

export interface DashboardPipelineDiagnostics {
  missingFredApiKey: boolean;
  providers: ProviderDiagnostics[];
  slowFetches: SlowFetchDiagnostics[];
  totalDurationMs: number;
  totalSeries: number;
}

interface FetchSeriesResult {
  durationMs: number;
  series: MacroSeries;
}

async function fetchSeriesBySpec(
  spec: SeriesSpec,
  fredFetcher: FredFetcher,
  yahooFetcher: YahooFetcher
): Promise<FetchSeriesResult> {
  const itemStart = performance.now();
  const series =
    spec.source === "fred"
      ? await fredFetcher(spec)
      : await yahooFetcher(spec);
  const itemEnd = performance.now();

  return {
    series,
    durationMs: itemEnd - itemStart,
  };
}

function reportDashboardPipelineDiagnostics(
  diagnostics: DashboardPipelineDiagnostics
): void {
  console.log(
    `[MacroLens] Total fetch time: ${diagnostics.totalDurationMs.toFixed(0)}ms for ${diagnostics.totalSeries} series`
  );

  for (const item of diagnostics.slowFetches) {
    console.warn(
      `[MacroLens] Slow fetch for ${item.key} (${item.source}): ${item.durationMs.toFixed(0)}ms`
    );
  }

  if (diagnostics.missingFredApiKey) {
    console.warn(
      "[MacroLens] FRED specs requested without FRED_API_KEY; FRED series will stay empty."
    );
  }
}

export async function fetchDashboardSeries(
  specs: SeriesSpec[] = SERIES_CATALOG,
  options: Pick<
    RunDashboardPipelineOptions,
    "fetchFredSeries" | "fetchYahooSeries" | "fredApiKey" | "onDiagnostics"
  > = {}
): Promise<MacroSeries[]> {
  const fredFetcher = options.fetchFredSeries ?? fetchFredSeries;
  const yahooFetcher = options.fetchYahooSeries ?? fetchYahooSeries;
  const diagnosticsReporter = options.onDiagnostics ?? reportDashboardPipelineDiagnostics;
  const start = performance.now();
  const results = await Promise.all(
    specs.map((spec) => fetchSeriesBySpec(spec, fredFetcher, yahooFetcher))
  );
  const end = performance.now();

  diagnosticsReporter({
    totalDurationMs: end - start,
    totalSeries: results.length,
    providers: summarizeProviderDiagnostics(
      results.map((result) => result.series),
      specs
    ),
    slowFetches: results
      .filter((result) => result.durationMs > 1000)
      .map((result) => ({
        key: result.series.key,
        source: result.series.source,
        durationMs: result.durationMs,
      })),
    missingFredApiKey:
      specs.some((spec) => spec.source === "fred") && !options.fredApiKey,
  });

  return results.map((result) => result.series);
}

function getBaseWarnings(fredApiKey?: string): string[] {
  if (fredApiKey) {
    return [];
  }

  return [
    "FRED ist aktuell deaktiviert (kein FRED_API_KEY in .env.local). Yahoo-Serien funktionieren trotzdem.",
  ];
}

function createProviderDiagnostics(source: DataSource): ProviderDiagnostics {
  return {
    source,
    requestedSpecCount: 0,
    seriesCount: 0,
    withDataCount: 0,
    errorCount: 0,
    proxyCount: 0,
  };
}

export function summarizeProviderDiagnostics(
  series: MacroSeries[],
  specs?: SeriesSpec[]
): ProviderDiagnostics[] {
  const diagnostics = new Map<DataSource, ProviderDiagnostics>();

  for (const spec of specs ?? []) {
    const current =
      diagnostics.get(spec.source) ?? createProviderDiagnostics(spec.source);
    current.requestedSpecCount += 1;
    diagnostics.set(spec.source, current);
  }

  for (const item of series) {
    const current =
      diagnostics.get(item.source) ?? createProviderDiagnostics(item.source);
    current.seriesCount += 1;
    if (item.points.length > 0) {
      current.withDataCount += 1;
    }
    if (item.error) {
      current.errorCount += 1;
    }
    if (item.proxyNote) {
      current.proxyCount += 1;
    }
    diagnostics.set(item.source, current);
  }

  return [...diagnostics.values()].sort((left, right) =>
    left.source.localeCompare(right.source)
  );
}

function getProviderWarnings(series: MacroSeries[]): string[] {
  const diagnostics = summarizeProviderDiagnostics(series);
  const warnings: string[] = [];

  for (const item of diagnostics) {
    if (item.errorCount > 0) {
      warnings.push(
        `${item.source.toUpperCase()}: ${item.errorCount}/${item.seriesCount} Serien mit Fehlern, ${item.withDataCount} mit Daten geladen.`
      );
      continue;
    }

    if (item.withDataCount === 0 && item.seriesCount > 0) {
      warnings.push(
        `${item.source.toUpperCase()}: keine geladenen Zeitreihen mit Daten.`
      );
    }
  }

  if (series.every((item) => item.points.length === 0)) {
    warnings.push(
      "Dashboard-Pipeline lieferte keine Zeitreihen mit Daten; Provider-Status und Zugangsdaten pruefen."
    );
  }

  return warnings;
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
    warnings: attachWarnings(
      [...getBaseWarnings(options.fredApiKey), ...getProviderWarnings(series)],
      partial
    ),
  };
}

export async function runDashboardPipeline(
  options: RunDashboardPipelineOptions = {}
): Promise<DashboardData> {
  const series = await fetchDashboardSeries(options.specs, options);

  return buildDashboardData(series, options);
}
