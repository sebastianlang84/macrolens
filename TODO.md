# TODO.md

## P0 (Now)

## P1 (Next)

- [ ] Dashboard-Pipeline weiter vertiefen: nach Extraktion von `apps/web/src/lib/dashboard-pipeline.ts` Provider-Diagnostik und Boundary-Szenarien weiter ausbauen, damit `apps/web/src/lib/dashboard-data.ts` dauerhaft nur der schmale Einstieg bleibt.
- [ ] Architektur-Refactor vorbereiten: Workbench-Indikator-/Overlay-Logik aus `apps/web/src/components/series-workbench.tsx` und `apps/web/src/lib/series-analysis.ts` in ein tieferes Engine-Modul schneiden, das Slot-Auswahl, Companion-Reihen, Divergenzmarker, Overlays und Korrelationen als zusammenhaengendes Datenpaket liefert.
- [ ] Architektur-Refactor vorbereiten: `apps/web/src/components/series-workbench.tsx` in ein Session-/Projection-Modul plus Rendering aufteilen, damit Slot-State, Persistenz, Achsenregeln und X-Domain-Logik nicht weiter in einer 1200-Zeilen-Client-Komponente vermischt bleiben.

## P2 (Later)

- [ ] Evaluieren, wie aktuelle Makro-Eventdaten und Releases in MacroLens kommen koennen, z. B. `Core PCE MoM`, `GDP Growth QoQ`, `Durable Goods Orders`, `JOLTs Job Openings`, inklusive `actual / expected / prior` und Ueberraschung. Diskutieren und bewerten: direkte APIs (z. B. `FRED`, wenn verfuegbar), Webseiten/Provider wie `tradingeconomics.com`, spezialisierte Quellen wie `creditspreadalert.com`, Mail-Ingestion fuer Event-Mails, sowie RSS-Feeds wie `finanznachrichten.de`. Fuer jede Option Qualitaet, Lizenz/Scraping-Risiko, Latenz, Historie, Normalisierung und Betriebsaufwand bewerten.
- [ ] Wochenkerzen-Ansicht fuer MacroLens-Workbench/Charts ergaenzen (UI-Umschaltung fuer Daily/Weekly, nicht Pine).
- [ ] Strategy-Backtester analog zu TradingView in MacroLens einbauen.
- [ ] Sicherstellen, dass der Backtest immer auf genau demselben Zeitbereich laeuft, der im BTC-Chart oder aktuell gewaehlten Asset-Chart eingestellt ist.
- [ ] Renditegegenueberstellung fuer denselben Zeitraum und dasselbe Asset anzeigen: `Buy & Hold` vs. `Trading-Strategie`.

## Backlog (Process / Team, erst bei Bedarf)

- [ ] `CODEOWNERS`/PR-Templates einführen (wenn mehrere Personen aktiv beitragen).
- [ ] Secret-Scanning integrieren (z. B. `gitleaks`) falls Repo wächst.
