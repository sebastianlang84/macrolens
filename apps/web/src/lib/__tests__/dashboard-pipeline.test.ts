import { describe, expect, it, vi } from "vitest";
import type { MacroSeries, SeriesStats, SeriesUnit } from "@/types/macro";
import {
  buildDashboardData,
  runDashboardPipeline,
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
});

describe("runDashboardPipeline", () => {
  it("dispatches specs to the matching provider fetchers", async () => {
    const fredFetcher = vi.fn(async () => makeSeries("fedfunds", "percent"));
    const yahooFetcher = vi.fn(async () => makeSeries("sp500", "index"));

    const data = await runDashboardPipeline({
      fredApiKey: "test-key",
      generatedAt: "2026-03-21T12:00:00.000Z",
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
  });
});
