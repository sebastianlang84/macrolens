import { describe, expect, it, vi } from "vitest";
import type { MacroSeries, SeriesStats, SeriesUnit } from "@/types/macro";
import {
  buildDashboardData,
  fetchDashboardSeries,
  runDashboardPipeline,
  summarizeProviderDiagnostics,
} from "../dashboard-pipeline";

function makeStats(overrides: Partial<SeriesStats> = {}): SeriesStats {
  return {
    latestValue: null,
    change1mPct: null,
    change3mPct: null,
    change1yPct: null,
    ...overrides,
  };
}

function makeSeries(
  key: string,
  unit: SeriesUnit,
  overrides: Partial<MacroSeries> = {}
): MacroSeries {
  return {
    key,
    label: key,
    shortLabel: key,
    source: "yahoo",
    unit,
    description: `${key} test series`,
    color: "#000000",
    points: [],
    stats: makeStats(),
    ...overrides,
  };
}

describe("buildDashboardData", () => {
  it("assembles warnings and supported signals behind one boundary", () => {
    const data = buildDashboardData(
      [
        makeSeries("vix", "index", { stats: makeStats({ latestValue: 28 }) }),
        makeSeries("proxy", "usd", {
          proxyNote: "ETF Proxy statt Spotserie.",
        }),
        makeSeries("broken", "usd", {
          error: "fetch failed",
          label: "Broken Series",
        }),
      ],
      {
        fredApiKey: undefined,
        generatedAt: "2026-03-21T12:00:00.000Z",
      }
    );

    expect(data.generatedAt).toBe("2026-03-21T12:00:00.000Z");
    expect(data.signals.map((signal) => signal.id)).toEqual(["volatility"]);
    expect(data.signals[0]?.tone).toBe("negative");
    expect(data.warnings).toContain(
      "FRED ist aktuell deaktiviert (kein FRED_API_KEY in .env.local). Yahoo-Serien funktionieren trotzdem."
    );
    expect(data.warnings).toContain(
      "Einige Serien konnten nicht geladen werden: Broken Series."
    );
    expect(data.warnings).toContain("proxy: ETF Proxy statt Spotserie.");
  });

  it("adds provider-level no-data diagnostics when the pipeline returns only empty series", () => {
    const data = buildDashboardData(
      [
        makeSeries("fedfunds", "percent", {
          source: "fred",
          error: "missing key",
        }),
        makeSeries("sp500", "index", {
          points: [],
          stats: makeStats(),
        }),
      ],
      {
        fredApiKey: undefined,
        generatedAt: "2026-03-21T12:00:00.000Z",
      }
    );

    expect(data.warnings).toContain(
      "FRED: 1/1 Serien mit Fehlern, 0 mit Daten geladen."
    );
    expect(data.warnings).toContain(
      "YAHOO: keine geladenen Zeitreihen mit Daten."
    );
    expect(data.warnings).toContain(
      "Dashboard-Pipeline lieferte keine Zeitreihen mit Daten; Provider-Status und Zugangsdaten pruefen."
    );
  });
});

describe("runDashboardPipeline", () => {
  it("dispatches specs to the matching provider fetchers and emits structured diagnostics", async () => {
    const fredFetcher = vi.fn(async () =>
      makeSeries("fedfunds", "percent", {
        source: "fred",
        points: [{ date: "2025-01-01", value: 4.5 }],
        stats: makeStats({ latestValue: 4.5 }),
      })
    );
    const yahooFetcher = vi.fn(async () =>
      makeSeries("sp500", "index", {
        points: [{ date: "2025-01-01", value: 6000 }],
        stats: makeStats({ latestValue: 6000 }),
      })
    );
    const onDiagnostics = vi.fn();

    const data = await runDashboardPipeline({
      fredApiKey: "test-key",
      generatedAt: "2026-03-21T12:00:00.000Z",
      onDiagnostics,
      specs: [
        {
          key: "fedfunds",
          label: "Fed Funds",
          shortLabel: "Fed Funds",
          source: "fred",
          unit: "percent",
          description: "fred series",
          providerId: "FEDFUNDS",
          lookbackYears: 10,
          color: "#111111",
        },
        {
          key: "sp500",
          label: "S&P 500",
          shortLabel: "S&P 500",
          source: "yahoo",
          unit: "index",
          description: "yahoo series",
          providerId: "^GSPC",
          lookbackYears: 3,
          color: "#222222",
        },
      ],
      fetchFredSeries: fredFetcher,
      fetchYahooSeries: yahooFetcher,
    });

    expect(fredFetcher).toHaveBeenCalledTimes(1);
    expect(yahooFetcher).toHaveBeenCalledTimes(1);
    expect(data.series.map((series) => series.key)).toEqual([
      "fedfunds",
      "sp500",
    ]);
    expect(data.warnings).toEqual([]);
    expect(onDiagnostics).toHaveBeenCalledTimes(1);
    expect(onDiagnostics).toHaveBeenCalledWith(
      expect.objectContaining({
        missingFredApiKey: false,
        totalSeries: 2,
        providers: [
          expect.objectContaining({
            source: "fred",
            requestedSpecCount: 1,
            seriesCount: 1,
          }),
          expect.objectContaining({
            source: "yahoo",
            requestedSpecCount: 1,
            seriesCount: 1,
          }),
        ],
      })
    );
  });

  it("marks slow fetches and missing FRED credentials in diagnostics only when relevant", async () => {
    vi.useFakeTimers();
    const fredFetcher = vi.fn(
      async () =>
        await new Promise<MacroSeries>((resolve) => {
          setTimeout(
            () =>
              resolve(
                makeSeries("fedfunds", "percent", {
                  source: "fred",
                  points: [{ date: "2025-01-01", value: 4.5 }],
                  stats: makeStats({ latestValue: 4.5 }),
                })
              ),
            1100
          );
        })
    );
    const onDiagnostics = vi.fn();

    const promise = fetchDashboardSeries(
      [
        {
          key: "fedfunds",
          label: "Fed Funds",
          shortLabel: "Fed Funds",
          source: "fred",
          unit: "percent",
          description: "fred series",
          providerId: "FEDFUNDS",
          lookbackYears: 10,
          color: "#111111",
        },
      ],
      {
        fetchFredSeries: fredFetcher,
        onDiagnostics,
      }
    );

    await vi.advanceTimersByTimeAsync(1100);
    const series = await promise;

    expect(series).toHaveLength(1);
    expect(onDiagnostics).toHaveBeenCalledWith(
      expect.objectContaining({
        missingFredApiKey: true,
        slowFetches: [
          expect.objectContaining({
            key: "fedfunds",
            source: "fred",
          }),
        ],
      })
    );

    vi.useRealTimers();
  });
});

describe("summarizeProviderDiagnostics", () => {
  it("keeps yahoo-only specs free of FRED noise", () => {
    const diagnostics = summarizeProviderDiagnostics(
      [makeSeries("sp500", "index")],
      [
        {
          key: "sp500",
          label: "S&P 500",
          shortLabel: "S&P 500",
          source: "yahoo",
          unit: "index",
          description: "yahoo series",
          providerId: "^GSPC",
          lookbackYears: 3,
          color: "#222222",
        },
      ]
    );

    expect(diagnostics).toEqual([
      expect.objectContaining({
        source: "yahoo",
        requestedSpecCount: 1,
        seriesCount: 1,
      }),
    ]);
  });
});
