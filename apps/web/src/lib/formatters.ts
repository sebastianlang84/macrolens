import type { SeriesUnit } from "@/types/macro";

export function formatNumber(value: number, digits = 1): string {
  return new Intl.NumberFormat("de-DE", {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  }).format(value);
}

export function formatValueByUnit(value: number, unit: SeriesUnit): string {
  if (unit === "percent") {
    return `${formatNumber(value, 2)} %`;
  }

  if (unit === "usd") {
    return `${formatNumber(value, 2)} $`;
  }

  if (unit === "thousand_persons") {
    return `${formatNumber(value / 1000, 2)} Mio`;
  }

  return formatNumber(value, 0);
}

export function formatPctDelta(value: number | null): string {
  if (value === null || Number.isNaN(value)) {
    return "n/a";
  }

  const prefix = value > 0 ? "+" : "";
  return `${prefix}${formatNumber(value, 1)} %`;
}
