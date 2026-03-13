import YahooFinance from "yahoo-finance2";
import { computeSeriesStats } from "@/lib/stats";
import type { SeriesSpec } from "@/lib/series-catalog";
import type { CandlePoint, MacroSeries, TimePoint } from "@/types/macro";
import { z } from "zod";

const yahooFinance = new YahooFinance();

const yahooQuoteSchema = z.object({
  date: z.date().optional(),
  open: z.number().nullable().optional(),
  high: z.number().nullable().optional(),
  low: z.number().nullable().optional(),
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

    const candles: CandlePoint[] = (chartResult.quotes ?? [])
      .map((quote) => {
        if (
          !quote.date ||
          !Number.isFinite(quote.open ?? Number.NaN) ||
          !Number.isFinite(quote.high ?? Number.NaN) ||
          !Number.isFinite(quote.low ?? Number.NaN) ||
          !Number.isFinite(quote.close ?? Number.NaN)
        ) {
          return null;
        }

        return {
          date: quote.date.toISOString().slice(0, 10),
          open: Number(quote.open),
          high: Number(quote.high),
          low: Number(quote.low),
          close: Number(quote.close),
        };
      })
      .filter((point): point is CandlePoint => point !== null);

    const points: TimePoint[] = candles.map((candle) => ({
      date: candle.date,
      value: candle.close,
    }));

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
      candles,
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
