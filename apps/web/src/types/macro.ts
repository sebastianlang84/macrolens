export type DataSource = "fred" | "yahoo";

export type SeriesUnit = "index" | "usd" | "percent" | "thousand_persons";

export interface TimePoint {
  date: string;
  value: number;
}

export interface CandlePoint {
  close: number;
  date: string;
  high: number;
  low: number;
  open: number;
}

export interface SeriesStats {
  change1mPct: number | null;
  change1yPct: number | null;
  change3mPct: number | null;
  latestValue: number | null;
}

export interface MacroSeries {
  candles?: CandlePoint[];
  color: string;
  description: string;
  error?: string;
  key: string;
  label: string;
  points: TimePoint[];
  proxyNote?: string;
  shortLabel: string;
  source: DataSource;
  stats: SeriesStats;
  unit: SeriesUnit;
}

export type SignalTone = "positive" | "neutral" | "negative";

export interface MacroSignal {
  id: string;
  label: string;
  summary: string;
  tone: SignalTone;
  value: string;
}

export interface DashboardData {
  generatedAt: string;
  series: MacroSeries[];
  signals: MacroSignal[];
  warnings: string[];
}
