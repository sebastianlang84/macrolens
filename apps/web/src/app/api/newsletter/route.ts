import { NextResponse } from "next/server";
import { getDashboardData } from "@/lib/dashboard-data";
import {
  buildRsiDivergenceMarkers,
  buildRsiScoreSeries,
  buildWeeklyRsiScoreSeries,
} from "@/lib/series-analysis";

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

    const score1d = buildRsiScoreSeries(btcSeries);
    const score1w = buildWeeklyRsiScoreSeries(btcSeries);

    const latestScore1d = score1d?.points.at(-1)?.value ?? null;
    const latestScore1w = score1w?.points.at(-1)?.value ?? null;

    const dailyDivs = score1d ? buildRsiDivergenceMarkers(btcSeries, score1d) : [];
    const weeklyDivs = score1w ? buildRsiDivergenceMarkers(btcSeries, score1w) : [];

    // Latest divergences (global)
    const lastDailyDiv = dailyDivs.at(-1);
    const lastWeeklyDiv = weeklyDivs.at(-1);

    const payload = {
      generatedAt: new Date().toISOString(),
      symbol: "BTC-USD",
      latestPrice: btcSeries.points.at(-1)?.value ?? null,
      rsiScore: {
        daily: latestScore1d,
        weekly: latestScore1w,
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
