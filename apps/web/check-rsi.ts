import { fetchYahooSeries } from './src/lib/providers/yahoo';
import { buildRsiDivergenceMarkers, buildRsiScoreSeries, buildWeeklyRsiScoreSeries } from './src/lib/series-analysis';

async function main() {
  const btcSeries = await fetchYahooSeries({
    key: 'bitcoin',
    label: 'Bitcoin',
    shortLabel: 'BTC',
    source: 'yahoo',
    unit: 'usd',
    description: 'Bitcoin Spotpreis',
    color: '#f59e0b',
    providerId: 'BTC-USD',
    lookbackYears: 2,
  });
  const score1d = buildRsiScoreSeries(btcSeries);
  if (!score1d) {
    throw new Error('Failed to build 1D RSI score');
  }
  const score1w = buildWeeklyRsiScoreSeries(btcSeries);
  if (!score1w) {
    throw new Error('Failed to build 1W RSI score');
  }
  
  const div1d = buildRsiDivergenceMarkers(btcSeries, score1d);
  const div1w = buildRsiDivergenceMarkers(btcSeries, score1w);
  
  console.log('--- 1D Divergences ---');
  console.log(JSON.stringify((div1d || []).slice(-5), null, 2)); 
  
  console.log('--- 1W Divergences ---');
  console.log(JSON.stringify((div1w || []).slice(-5), null, 2)); 
  
  console.log('--- Current RSI Score ---');
  console.log('1D Score:', score1d.points?.[score1d.points.length - 1]?.value);
  console.log('1W Score:', score1w.points?.[score1w.points.length - 1]?.value);
}

main().catch(console.error);
