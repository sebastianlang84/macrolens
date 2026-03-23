import { fetchYahooSeries } from './apps/web/src/lib/providers/yahoo.ts';
import { 
    buildRsiScoreSeries, 
    buildWeeklyRsiScoreSeries, 
    buildRsiDivergenceMarkers,
    buildCompanionIndicatorSeries
} from './apps/web/src/lib/series-analysis.ts';

async function main() {
  try {
    const series = await fetchYahooSeries('BTC-USD', 5);
    
    // Daily
    const dailyScore = buildRsiScoreSeries(series);
    if (!dailyScore) throw new Error("Could not build daily RSI score");
    const dailyRsiSeries = buildCompanionIndicatorSeries(series, dailyScore)[0];
    const div1d = buildRsiDivergenceMarkers(series, dailyScore);
    
    // Weekly
    const weeklyScore = buildWeeklyRsiScoreSeries(series);
    if (!weeklyScore) throw new Error("Could not build weekly RSI score");
    const weeklyRsiSeries = buildCompanionIndicatorSeries(series, weeklyScore)[0];
    const div1w = buildRsiDivergenceMarkers(series, weeklyScore);

    console.log(JSON.stringify({
        btcLatest: series.points[series.points.length - 1],
        dailyRsi: dailyRsiSeries?.stats.latestValue,
        weeklyRsi: weeklyRsiSeries?.stats.latestValue,
        div1d: div1d.slice(-3),
        div1w: div1w.slice(-3)
    }, null, 2));
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
main();
