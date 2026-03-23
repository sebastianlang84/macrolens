# 2026-03-20 - RSI Score gehärtet

## Anlass
- Nutzerwunsch: den bestehenden RSI-/Divergenz-Indikator weniger spaet und weniger trendanfaellig machen und die Verbesserung direkt in `MacroLens` integrieren.

## Umsetzung
- `apps/web/src/lib/series-analysis.ts`
  - Score-Glaettung von einfacher EMA auf low-lag DEMA umgestellt.
  - Divergenzmarker behalten Score-Pivots als Trigger, verlangen jetzt aber:
    - Mindestverbesserung des Scores gegenueber dem vorherigen Pivot
    - sinnvolle Mindest-/Maximalabstaende zwischen Pivot-Paaren
    - rohe RSI-Bestaetigung an den Pivot-Daten, wenn dort RSI-Werte verfuegbar sind
  - Bei starkem Score-Shift darf der Marker auch dann bleiben, wenn die RSI-Bestaetigung am zweiten Pivot nicht sauber vorliegt; damit bleiben die bereits validierten Referenzfenster erhalten.
- `apps/web/src/lib/__tests__/series-analysis.test.ts`
  - Guard gegen schwache bullish Divergence ohne ausreichende Score-Verbesserung abgedeckt.
- `apps/web/check_rsi.ts`
  - Lokales Pruefskript auf die aktuelle `rsi-score`-API gezogen, damit `next build` nicht an veralteten Scratch-Imports scheitert.

## Verifikation
- `npm test` in `apps/web`: gruen (`16/16` Tests).
- `npm run lint` in `apps/web`: gruen.
- `npm run build` in `apps/web`: gruen.
