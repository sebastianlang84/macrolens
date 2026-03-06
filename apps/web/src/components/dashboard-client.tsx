"use client";

import { format, parseISO } from "date-fns";
import { SeriesWorkbench } from "@/components/series-workbench";
import type { DashboardData } from "@/types/macro";

type Props = {
  data: DashboardData;
};

export function DashboardClient({ data }: Props) {
  const generatedLabel = format(parseISO(data.generatedAt), "dd.MM.yyyy HH:mm");

  return (
    <main className="h-[100dvh] overflow-hidden px-2 py-2 md:px-3 md:py-3">
      <div className="mx-auto flex h-full max-w-7xl flex-col gap-2">
        <section className="relative overflow-hidden rounded-2xl border border-white/20 bg-slate-950 px-4 py-3 text-white shadow-lg">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(56,189,248,0.22),transparent_36%),radial-gradient(circle_at_90%_20%,rgba(16,185,129,0.18),transparent_32%)]" />
          <div className="relative flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-sky-200">MacroLens</p>
              <h1 className="text-base font-semibold tracking-tight md:text-lg">
                One-Screen Overlay Dashboard
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5">
                Update: {generatedLabel}
              </span>
              {data.warnings.length > 0 ? (
                <span className="rounded-full border border-amber-300/40 bg-amber-300/15 px-2 py-0.5 text-amber-100">
                  Hinweise: {data.warnings.length}
                </span>
              ) : null}
            </div>
          </div>
        </section>

        <div className="min-h-0 flex-1">
          <SeriesWorkbench series={data.series} className="h-full" />
        </div>
      </div>
    </main>
  );
}
