import { fetchYahooSeries } from "./src/lib/providers/yahoo";
import {
  buildRsiDivergenceMarkers,
  buildRsiScoreIndicators,
} from "./src/lib/series-analysis";
import { SERIES_CATALOG } from "./src/lib/series-catalog";

async function main() {
  const btcItem = SERIES_CATALOG.find((i) => i.key === "bitcoin");
  if (!btcItem) {
    throw new Error("Bitcoin missing in catalog");
  }

  const btcSeries = await fetchYahooSeries(btcItem);
  const indicators = buildRsiScoreIndicators(btcSeries);
  const rsi1d = indicators.find((indicator) =>
    indicator.key.startsWith("rsi-score:")
  );
  const rsi1w = indicators.find((indicator) =>
    indicator.key.startsWith("rsi-scorew:")
  );
  const div1d = rsi1d ? buildRsiDivergenceMarkers(btcSeries, rsi1d) : [];
  const div1w = rsi1w ? buildRsiDivergenceMarkers(btcSeries, rsi1w) : [];

  console.log(
    JSON.stringify(
      {
        "1d": { rsi: rsi1d?.points.at(-1) ?? null, div: div1d.slice(-3) },
        "1w": { rsi: rsi1w?.points.at(-1) ?? null, div: div1w.slice(-3) },
      },
      null,
      2
    )
  );
}

main().catch(console.error);
