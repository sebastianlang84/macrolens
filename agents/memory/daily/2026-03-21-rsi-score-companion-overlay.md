# 2026-03-21 RSI Score Companion Overlay

## Anlass
- Nutzerwunsch: Bei `RSI Score` immer den zugrundeliegenden RSI mit ueberlagern.

## Umsetzung
- In `series-analysis.ts` eine Companion-Helferfunktion fuer `rsi-score:*` und `rsi-scorew:*` ergaenzt.
- `SeriesWorkbench` rendert fuer gewaehlte Score-Indikatoren den passenden `RSI 14` bzw. `RSI 14 W` automatisch im unteren Chart.
- Companion-Reihen uebernehmen Achsenmodus und Separate-Y-Entscheidung des gewaehlten Score-Slots.
- Test in `src/lib/__tests__/series-analysis.test.ts` fuer Daily- und Weekly-Companion hinzugefuegt.

## Verifikation
- `npm run check` gruen.
- `npm run lint` gruen.
- `npm run build` gruen.
