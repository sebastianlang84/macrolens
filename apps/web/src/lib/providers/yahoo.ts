import YahooFinance from "yahoo-finance2";
import { computeSeriesStats } from "@/lib/stats";
import type { SeriesSpec } from "@/lib/series-catalog";
import type { MacroSeries, TimePoint } from "@/types/macro";
import { z } from "zod";

const yahooFinance = new YahooFinance();

const yahooQuoteSchema = z.object({
  date: z.date().optional(),
  close: z.number().nullable().optional(),
});

const yahooChartSchema = z.object({
  quotes: z.array(yahooQuoteSchema).optional(),
});

function periodStart(lookbackYears: number): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() - lookbackYears);
  return d;
}

export async function fetchYahooSeries(spec: SeriesSpec): Promise<MacroSeries> {
  try {
    const chartResult = yahooChartSchema.parse(await yahooFinance.chart(spec.providerId, {
      period1: periodStart(spec.lookbackYears),
      interval: "1d",
    }));

    const points: TimePoint[] = (chartResult.quotes ?? [])
      .map((quote) => {
        if (!quote.date || !Number.isFinite(quote.close ?? Number.NaN)) {
          return null;
        }

        return {
          date: quote.date.toISOString().slice(0, 10),
          value: Number(quote.close),
        };
      })
      .filter((point): point is TimePoint => point !== null);

    return {
      key: spec.key,
      label: spec.label,
      shortLabel: spec.shortLabel,
      source: spec.source,
      unit: spec.unit,
      description: spec.description,
      proxyNote: spec.proxyNote,
      color: spec.color,
      points,
      stats: computeSeriesStats(points),
    };
  } catch (error) {
    const errorMessage =
      error instanceof z.ZodError
        ? `Yahoo Response-Format unerwartet (${error.issues.length} Validierungsfehler)`
        : error instanceof Error
          ? error.message
          : "Unbekannter Yahoo-Fehler";

    return {
      key: spec.key,
      label: spec.label,
      shortLabel: spec.shortLabel,
      source: spec.source,
      unit: spec.unit,
      description: spec.description,
      proxyNote: spec.proxyNote,
      color: spec.color,
      points: [],
      stats: computeSeriesStats([]),
      error: errorMessage,
    };
  }
}
