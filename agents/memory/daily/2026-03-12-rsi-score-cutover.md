# 2026-03-12 - RSI-Score als einziger RSI-Indikator

## Anlass
- Nutzerentscheidung: bisherige RSI-Ableitungen gelten nicht mehr; nur noch der RSI-Score-Pfad soll im Produkt verbleiben.

## Aenderung
- `apps/web/src/lib/series-analysis.ts` auf `RSI Score` / `RSI Score W` umgestellt.
- Alte oeffentliche RSI-Pfade entfernt: `RSI 14`, `RSI 14W`, `RSI Consensus`, `RSI Breadth`, `RSI Overheat`, `RSI Dispersion`, `RSI Short-Long`.
- Workbench-Indikatorauswahl, Newsletter-API und lokale RSI-Pruefskripte auf `rsi-score` / `rsi-scorew` umgestellt.
- Divergenzmarker laufen jetzt auf dem Score-Indikator und nutzen 50-zentrierte Bull/Bear-Schwellen.

## Verifikation
- `npm run lint`
- `npm test`
- `npm run build`
