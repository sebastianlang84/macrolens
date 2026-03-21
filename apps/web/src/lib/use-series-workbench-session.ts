"use client";

import type { Dispatch, RefObject, SetStateAction } from "react";
import { useDeferredValue, useEffect, useRef, useState } from "react";
import type { WorkbenchSelectionSlot } from "@/lib/series-workbench-engine";
import type { MacroSeries } from "@/types/macro";

export type XRangePreset = "3m" | "6m" | "1y" | "2y" | "max";
export type ChartInterval = "daily" | "weekly";

const SLOT_COUNT = 6;
const CHART_SPLIT_STORAGE_KEY = "macrolens:workbench-chart-split";
const CHART_X_RANGE_STORAGE_KEY = "macrolens:workbench-x-range";
const CHART_INTERVAL_STORAGE_KEY = "macrolens:workbench-chart-interval";
const DEFAULT_CHART_SPLIT = 0.66;
const MIN_CHART_SPLIT = 0.35;
const MAX_CHART_SPLIT = 0.8;
const DEFAULT_X_RANGE_PRESET: XRangePreset = "max";
const DEFAULT_CHART_INTERVAL: ChartInterval = "daily";

function buildInitialSlots(series: MacroSeries[]): WorkbenchSelectionSlot[] {
  const defaultSeriesKey =
    series.find((item) => item.key === "sp500")?.key ?? "";

  return Array.from({ length: SLOT_COUNT }, (_, idx) => {
    const selectedSeries =
      idx === 0
        ? (series.find((item) => item.key === defaultSeriesKey) ?? null)
        : null;

    return {
      id: `slot-${idx + 1}`,
      seriesKey: selectedSeries?.key ?? "",
      indicatorKey: "",
      overlaySeparateYAxis: false,
      indicatorSeparateYAxis: true,
      overlayAxisMode: "linear",
      indicatorAxisMode: "linear",
    };
  });
}

export function clampChartSplit(value: number): number {
  return Math.min(MAX_CHART_SPLIT, Math.max(MIN_CHART_SPLIT, value));
}

function parseStoredChartSplit(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? clampChartSplit(parsed) : null;
}

function parseStoredXRangePreset(value: string | null): XRangePreset | null {
  if (
    value === "3m" ||
    value === "6m" ||
    value === "1y" ||
    value === "2y" ||
    value === "max"
  ) {
    return value;
  }

  return null;
}

function parseStoredChartInterval(value: string | null): ChartInterval | null {
  if (value === "daily" || value === "weekly") {
    return value;
  }

  return null;
}

export function getChartSplitFromPointer(
  container: HTMLDivElement | null,
  clientY: number
): number | null {
  const rect = container?.getBoundingClientRect();
  if (!rect || rect.height <= 0) {
    return null;
  }

  return clampChartSplit((clientY - rect.top) / rect.height);
}

export interface SeriesWorkbenchSession {
  beginResize: (clientY: number) => void;
  chartInterval: ChartInterval;
  chartSplit: number;
  chartStackRef: RefObject<HTMLDivElement | null>;
  chartsReady: boolean;
  deferredSelectableSeries: MacroSeries[];
  deferredSlots: WorkbenchSelectionSlot[];
  isResizing: boolean;
  nudgeChartSplit: (delta: number) => void;
  setChartSplit: Dispatch<SetStateAction<number>>;
  setIsResizing: Dispatch<SetStateAction<boolean>>;
  setSlots: Dispatch<SetStateAction<WorkbenchSelectionSlot[]>>;
  setChartInterval: Dispatch<SetStateAction<ChartInterval>>;
  setXRangePreset: Dispatch<SetStateAction<XRangePreset>>;
  slots: WorkbenchSelectionSlot[];
  xRangePreset: XRangePreset;
}

export function useSeriesWorkbenchSession(
  selectableSeries: MacroSeries[]
): SeriesWorkbenchSession {
  const deferredSelectableSeries = useDeferredValue(selectableSeries);
  const [slots, setSlots] = useState<WorkbenchSelectionSlot[]>(() =>
    buildInitialSlots(selectableSeries)
  );
  const deferredSlots = useDeferredValue(slots);
  const [chartSplit, setChartSplit] = useState(DEFAULT_CHART_SPLIT);
  const [chartInterval, setChartInterval] = useState<ChartInterval>(
    DEFAULT_CHART_INTERVAL
  );
  const [xRangePreset, setXRangePreset] = useState<XRangePreset>(
    DEFAULT_X_RANGE_PRESET
  );
  const [isResizing, setIsResizing] = useState(false);
  const [chartsReady, setChartsReady] = useState(false);
  const chartStackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const stored = parseStoredChartSplit(
      window.localStorage.getItem(CHART_SPLIT_STORAGE_KEY)
    );
    if (stored === null) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      setChartSplit(stored);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    const stored = parseStoredChartInterval(
      window.localStorage.getItem(CHART_INTERVAL_STORAGE_KEY)
    );
    if (stored === null) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      setChartInterval(stored);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    const stored = parseStoredXRangePreset(
      window.localStorage.getItem(CHART_X_RANGE_STORAGE_KEY)
    );
    if (stored === null) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      setXRangePreset(stored);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(CHART_SPLIT_STORAGE_KEY, chartSplit.toFixed(3));
  }, [chartSplit]);

  useEffect(() => {
    window.localStorage.setItem(CHART_INTERVAL_STORAGE_KEY, chartInterval);
  }, [chartInterval]);

  useEffect(() => {
    window.localStorage.setItem(CHART_X_RANGE_STORAGE_KEY, xRangePreset);
  }, [xRangePreset]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setChartsReady(true);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    if (!isResizing) {
      return;
    }

    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;

    const handlePointerMove = (event: PointerEvent) => {
      const nextSplit = getChartSplitFromPointer(
        chartStackRef.current,
        event.clientY
      );
      if (nextSplit !== null) {
        setChartSplit(nextSplit);
      }
    };
    const stopResize = () => setIsResizing(false);

    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopResize);

    return () => {
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopResize);
    };
  }, [isResizing]);

  return {
    beginResize(clientY) {
      const nextSplit = getChartSplitFromPointer(chartStackRef.current, clientY);
      if (nextSplit !== null) {
        setChartSplit(nextSplit);
      }
      setIsResizing(true);
    },
    chartInterval,
    chartSplit,
    chartStackRef,
    chartsReady,
    deferredSelectableSeries,
    deferredSlots,
    isResizing,
    nudgeChartSplit(delta) {
      setChartSplit((current) => clampChartSplit(current + delta));
    },
    setChartSplit,
    setChartInterval,
    setIsResizing,
    setSlots,
    setXRangePreset,
    slots,
    xRangePreset,
  };
}

export const SERIES_WORKBENCH_SLOT_COUNT = SLOT_COUNT;
