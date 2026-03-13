# 2026-03-11 - RSI-/Divergenz-Abgleich mit TradingView

## Anlass
- Offene Frage aus `TODO.md`: Ob unsere BTCUSD-RSI-Divergenzlogik die aus TradingView uebernommenen Referenzfenster wirklich reproduziert.
- Der bisherige Stand verfehlte die Referenzfaelle, obwohl die RSI-Formel selbst plausibel war.

## Messung / Root Cause
- Gegenprobe mit Live-`BTC-USD`-Yahoo-Daten zeigte zunaechst keinen Treffer fuer die vier TradingView-Fenster.
- Der Bruch lag nicht primaer in der Wilder-RSI-Berechnung, sondern in zwei methodischen Abweichungen:
  - Weekly-Daten waren nicht deterministisch genug, solange `1wk`-Antworten oder einfache resamplete Schlusskurse genutzt wurden.
  - Divergenzen wurden ueber Preis-Pivots auf `close` gesucht; TradingView-nahe Treffer entstehen hier ueber RSI-Pivots plus Preisvergleich auf Candle-Extrema.

## Umsetzung
- `apps/web/src/lib/providers/yahoo.ts`
  - Yahoo-Serien liefern jetzt optional echte OHLC-Candles (`open/high/low/close`) statt nur Close-Punkte.
- `apps/web/src/lib/series-analysis.ts`
  - Weekly-Serien werden jetzt deterministisch aus taeglichen Candles zu Monday-aggregierten Wochenkerzen gebaut.
  - `buildWeeklyRsiSeries()` basiert auf diesen Monday-Weekly-Closes.
  - `buildRsiDivergenceMarkers()` sucht Pivots jetzt auf der RSI-Serie selbst.
  - Preisvergleich laeuft fuer bullische Divergenzen ueber Candle-`low`, fuer baerische ueber Candle-`high`.
  - Bestaetigte Pivot-Radien:
    - daily: `left/right = 3/5`
    - weekly: `left/right = 3/3`
- Tests in `apps/web/src/lib/__tests__/series-analysis.test.ts` erweitert:
  - Monday-Weekly-Aggregation
  - bullish daily divergence
  - bearish weekly divergences fuer die drei TradingView-Weekly-Fenster

## Verifikation
- Live-Gegenprobe am `2026-03-11` mit `BTC-USD`:
  - Daily bullish: `2026-02-12 -> 2026-02-24` = Treffer
  - Weekly bearish: `2024-12-09 -> 2025-01-20` = Treffer
  - Weekly bearish: `2025-01-20 -> 2025-05-19` = Treffer
  - Weekly bearish: `2025-07-07 -> 2025-09-29` = Treffer
- `npm test` in `apps/web`: gruen (`15/15` Tests).
- `npm run lint` in `apps/web`: gruen.
- `npm run build` in `apps/web`: gruen.

## Regel fuer spaeter
- Bei Weekly-RSI/Divergenzen in diesem Repo nicht Yahoo-`1wk` als Wahrheitsquelle behandeln.
- Fuer BTCUSD/TradingView-Abgleiche zuerst taegliche OHLC laden, dann Wochen deterministisch auf Monday-Basis aggregieren.
