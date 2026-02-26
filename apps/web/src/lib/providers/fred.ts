import type { MacroSeries, TimePoint } from "@/types/macro";
import { computeSeriesStats } from "@/lib/stats";
import type { SeriesSpec } from "@/lib/series-catalog";
import { z } from "zod";

const fredObservationSchema = z.object({
  date: z.string(),
  value: z.string(),
});

const fredResponseSchema = z.object({
  observations: z.array(fredObservationSchema).optional(),
});

function startDateISO(lookbackYears: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - lookbackYears);
  return d.toISOString().slice(0, 10);
}

export async function fetchFredSeries(spec: SeriesSpec): Promise<MacroSeries> {
  const apiKey = process.env.FRED_API_KEY;

  if (!apiKey) {
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
      error:
        "FRED_API_KEY fehlt. Lege den Key in .env.local an, um FRED-Daten zu laden.",
    };
  }

  const params = new URLSearchParams({
    series_id: spec.providerId,
    api_key: apiKey,
    file_type: "json",
    sort_order: "asc",
    observation_start: startDateISO(spec.lookbackYears),
  });

  try {
    const response = await fetch(
      `https://api.stlouisfed.org/fred/series/observations?${params.toString()}`,
      { cache: "no-store" },
    );

    if (!response.ok) {
      throw new Error(`FRED HTTP ${response.status}`);
    }

    const payload = fredResponseSchema.parse(await response.json());
    const points: TimePoint[] = (payload.observations ?? [])
      .map((obs) => {
        const value = Number.parseFloat(obs.value);
        if (!Number.isFinite(value)) {
          return null;
        }
        return { date: obs.date, value };
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
        ? `FRED Response-Format unerwartet (${error.issues.length} Validierungsfehler)`
        : error instanceof Error
          ? error.message
          : "Unbekannter FRED-Fehler";

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
