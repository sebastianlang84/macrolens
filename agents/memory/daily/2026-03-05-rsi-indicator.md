# 2026-03-05 RSI als Indikatorserie ergaenzt

## Anlass
- Nutzerhinweis: In der unteren Indikator-Chart fehlte RSI.

## Umsetzung
- `apps/web/src/lib/series-analysis.ts`
  - `buildRsiSeries()` ergaenzt
  - RSI wird als 14-Perioden-Serie per Wilder-Glattung aus der jeweiligen Basisserie berechnet
- `apps/web/src/components/series-workbench.tsx`
  - Indikatorauswahl um abgeleitete `RSI 14 (...)`-Optionen fuer die aktuell selektierten Overlay-Serien erweitert
  - untere Indikator-Chart rendert nun bewusst mit `scaleMode="raw"`
- `apps/web/src/lib/__tests__/series-analysis.test.ts`
  - Test fuer erzeugte und sauber begrenzte RSI-Serie hinzugefuegt

## Verifikation
- `npm run lint` erfolgreich
- `npm test` erfolgreich
- `npm run build` erfolgreich
