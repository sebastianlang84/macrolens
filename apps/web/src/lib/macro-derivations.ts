import { MACRO_SIGNAL_RULES } from "@/lib/macro-signal-rules";
import type { DashboardData, MacroSeries, MacroSignal } from "@/types/macro";

function addSignal(signals: MacroSignal[], signal: MacroSignal | null): void {
  if (signal) {
    signals.push(signal);
  }
}

export function deriveMacroSignals(series: MacroSeries[]): MacroSignal[] {
  const signals: MacroSignal[] = [];

  for (const rule of MACRO_SIGNAL_RULES) {
    addSignal(signals, rule(series));
  }

  return signals;
}

export function attachWarnings(
  baseWarnings: string[],
  data: DashboardData
): string[] {
  const warnings = [...baseWarnings];

  const missing = data.series
    .filter((series) => series.error)
    .map((series) => series.label);
  if (missing.length > 0) {
    warnings.push(
      `Einige Serien konnten nicht geladen werden: ${missing.join(", ")}.`
    );
  }

  const proxies = data.series
    .filter((series) => series.proxyNote)
    .map((series) => `${series.shortLabel}: ${series.proxyNote}`);

  warnings.push(...proxies);

  return warnings;
}
