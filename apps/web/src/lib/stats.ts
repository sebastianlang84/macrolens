import type { SeriesStats, TimePoint } from "@/types/macro";

function pctChange(from: number, to: number): number {
  if (!Number.isFinite(from) || from === 0 || !Number.isFinite(to)) {
    return Number.NaN;
  }

  return ((to - from) / from) * 100;
}

function pickPointNearEnd(
  points: TimePoint[],
  daysBack: number
): TimePoint | null {
  const latestPoint = points.at(-1);
  if (!latestPoint) {
    return null;
  }

  const latestDate = new Date(latestPoint.date).getTime();
  const target = latestDate - daysBack * 24 * 60 * 60 * 1000;

  let best: TimePoint | null = null;

  for (const point of points) {
    const ts = new Date(point.date).getTime();
    if (ts <= target) {
      best = point;
    } else {
      break;
    }
  }

  return best;
}

export function computeSeriesStats(points: TimePoint[]): SeriesStats {
  const latest = points.at(-1);
  if (!latest) {
    return {
      latestValue: null,
      change1mPct: null,
      change3mPct: null,
      change1yPct: null,
    };
  }

  const p1m = pickPointNearEnd(points, 30);
  const p3m = pickPointNearEnd(points, 90);
  const p1y = pickPointNearEnd(points, 365);

  const safePct = (ref: TimePoint | null) => {
    if (!ref) {
      return null;
    }
    const value = pctChange(ref.value, latest.value);
    return Number.isFinite(value) ? value : null;
  };

  return {
    latestValue: latest.value,
    change1mPct: safePct(p1m),
    change3mPct: safePct(p3m),
    change1yPct: safePct(p1y),
  };
}
