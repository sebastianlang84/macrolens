import { NextResponse } from "next/server";
import { getDashboardData } from "@/lib/dashboard-data";
import { buildRsiSeries, buildWeeklyRsiSeries, buildRsiDivergenceMarkers } from "@/lib/series-analysis";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getDashboardData();
    const btcSeries = data.series.find((s) => s.key === "bitcoin");

    if (!btcSeries) {
      return NextResponse.json(
        { error: "Bitcoin series not found" },
        { status: 404 }
      );
    }

    // Calculate RSI series
    const rsi14 = buildRsiSeries(btcSeries, 14);
    const rsi14w = buildWeeklyRsiSeries(btcSeries, 14);

    // Latest RSI values
    const latestRsi14 = rsi14?.points.at(-1)?.value ?? null;
    const latestRsi14w = rsi14w?.points.at(-1)?.value ?? null;

    // Detected divergences
    const dailyDivs = rsi14 ? buildRsiDivergenceMarkers(btcSeries, rsi14) : [];
    const weeklyDivs = rsi14w ? buildRsiDivergenceMarkers(btcSeries, rsi14w) : [];

    // Latest divergences (global)
    const lastDailyDiv = dailyDivs.at(-1);
    const lastWeeklyDiv = weeklyDivs.at(-1);

    const payload = {
      generatedAt: new Date().toISOString(),
      symbol: "BTC-USD",
      latestPrice: btcSeries.points.at(-1)?.value ?? null,
      rsi: {
        daily: latestRsi14,
        weekly: latestRsi14w,
      },
      divergences: {
        daily: dailyDivs.slice(-3).map(d => ({
          date: d.date,
          direction: d.direction,
          label: d.label
        })),
        weekly: weeklyDivs.slice(-3).map(d => ({
          date: d.date,
          direction: d.direction,
          label: d.label
        })),
        latest: {
          daily: lastDailyDiv ? { date: lastDailyDiv.date, direction: lastDailyDiv.direction } : null,
          weekly: lastWeeklyDiv ? { date: lastWeeklyDiv.date, direction: lastWeeklyDiv.direction } : null,
        }
      },
      warnings: data.warnings,
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Newsletter API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: String(error) },
      { status: 500 }
    );
  }
}
