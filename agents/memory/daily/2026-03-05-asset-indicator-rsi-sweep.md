# 2026-03-05 - Asset/Indicator Split + RSI Sweep

## Anlass
- Die Workbench sollte fachlich getrennt werden: oberer Chart nur fuer Assets, mit genau einem Main Asset plus Compare Assets; unterer Chart nur fuer Indikatoren.
- Fuer den unteren Chart sollte statt einzelner RSI-Serien ein RSI-Sweep-Ansatz ausprobiert werden.

## Umsetzung
- `apps/web/src/components/series-workbench.tsx` auf Main-Asset-/Compare-Asset-Logik umgestellt. Der obere Chart zeigt jetzt nur Asset-Serien, die linke Sidebar trennt `Main Asset`, `Compare Assets` und `Indikatoren`.
- Der untere Chart rendert ausschliesslich aus dem Main Asset abgeleitete RSI-Sweep-Indikatoren; Asset-Serien koennen dort nicht mehr selektiert werden.
- `apps/web/src/lib/series-analysis.ts` um Asset-Erkennung (`sp500`, `nasdaq100`, `sp500_equal_weight`, `gold`, `bitcoin`, `oil`) und Sweep-Ableitungen erweitert.
- Sweep-Fenster: `5, 7, 10, 14, 20, 30, 45, 70, 100, 150, 200, 300`.
- Abgeleitete Serien:
  - `RSI 14`
  - `RSI Consensus`
  - `RSI Breadth > 50`
  - `RSI Overheat > 70`
  - `RSI Dispersion`
  - `RSI Short-Long`
- `apps/web/src/lib/series-catalog.ts` um Yahoo-Assets `gold` (`GC=F`) und `bitcoin` (`BTC-USD`) erweitert, damit die Asset-Auswahl im oberen Chart breiter wird.

## Verifikation
- `npm run lint` in `apps/web`: gruen.
- `npm test` in `apps/web`: 11/11 Tests gruen.
- `npm run build` in `apps/web`: gruen.
- `docker compose up -d --build web`: erfolgreich.
- `docker compose ps`: `web` healthy.
- `curl -I http://127.0.0.1:3001`: `HTTP/1.1 200 OK`.
- Gerendertes HTML enthaelt die neuen UI-Texte `Main Asset`, `Compare Assets`, `Indikatoren`, `Asset-Chart`, `Indikator-Chart`, `RSI Consensus`, `Gold`, `Bitcoin`.

## Hinweise
- Die Compare-/Indikator-Selektion wird jetzt deterministisch aus dem aktuellen Main Asset abgeleitet, statt per `setState`-Korrektur in `useEffect`. Das vermeidet React-Lint-Fehler wegen kaskadierender Renders.
