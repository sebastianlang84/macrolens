import { fetchYahooSeries } from "./providers/yahoo";
import {
  buildRsiDivergenceMarkers,
  buildRsiScoreIndicators,
} from "./series-analysis";
import { SERIES_CATALOG } from "./series-catalog";

async function main() {
  const btcConfig = SERIES_CATALOG.find((s) => s.key === "bitcoin");
  if (!btcConfig) {
    throw new Error("BTC config not found");
  }

  const btcSeries = await fetchYahooSeries(btcConfig);
  if (!btcSeries || btcSeries.points.length === 0) {
    throw new Error("No BTC data");
  }

  const indicators = buildRsiScoreIndicators(btcSeries);
  const dailyIndicator = indicators.find((i) => i.key.startsWith("rsi-score:"));
  const weeklyIndicator = indicators.find((i) =>
    i.key.startsWith("rsi-scorew:")
  );

  const dailyDivergences = dailyIndicator
    ? buildRsiDivergenceMarkers(btcSeries, dailyIndicator)
    : [];
  const weeklyDivergences = weeklyIndicator
    ? buildRsiDivergenceMarkers(btcSeries, weeklyIndicator)
    : [];

  const latestDailyRsi = dailyIndicator?.points.at(-1);
  const latestWeeklyRsi = weeklyIndicator?.points.at(-1);

  console.log(
    JSON.stringify(
      {
        latestPrice: btcSeries.points.at(-1),
        daily: {
          rsi: latestDailyRsi,
          divergences: dailyDivergences.slice(-3),
        },
        weekly: {
          rsi: latestWeeklyRsi,
          divergences: weeklyDivergences.slice(-3),
        },
      },
      null,
      2
    )
  );
}
main().catch(console.error);
