import { fetchYahooSeries } from './apps/web/src/lib/providers/yahoo';
import {
  buildRsiDivergenceMarkers,
  buildRsiScoreSeries,
  buildWeeklyRsiScoreSeries,
} from './apps/web/src/lib/series-analysis';

async function main() {
  try {
    const btc = await fetchYahooSeries('BTC-USD', 'bitcoin', 'Bitcoin', 2);
    const score1d = buildRsiScoreSeries(btc);
    if (!score1d) throw new Error("Failed to build 1D RSI score");
    const div1d = buildRsiDivergenceMarkers(btc, score1d);
    
    const score1w = buildWeeklyRsiScoreSeries(btc);
    if (!score1w) throw new Error("Failed to build 1W RSI score");
    const div1w = buildRsiDivergenceMarkers(btc, score1w);

    console.log(JSON.stringify({
      status: "success",
      btc1d_latest: btc.points[btc.points.length - 1],
      score1d_latest: score1d.points[score1d.points.length - 1],
      div1d: div1d.slice(-5),
      score1w_latest: score1w.points[score1w.points.length - 1],
      div1w: div1w.slice(-5)
    }, null, 2));
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
main();
