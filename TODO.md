# TODO.md

## P0 (Now)

- [ ] Bundle A: Workbench-Fundament fertig schneiden.
  Scope: `apps/web/src/components/series-workbench.tsx` weiter in Session-/Projection-/Rendering-Grenzen aufteilen, damit Slot-State, Persistenz, Achsenregeln und X-Domain-Logik nicht weiter in einer grossen Client-Komponente vermischt bleiben.
- [ ] Bundle A: Wochenkerzen-Ansicht fuer MacroLens-Workbench/Charts ergaenzen.
  Scope: UI-Umschaltung fuer `Daily`/`Weekly` auf Basis des Workbench-Fundaments, nicht Pine.

## P1 (Next)

- [ ] Bundle B: Strategy-Backtester analog zu TradingView in MacroLens einbauen.
- [ ] Bundle B: Backtest strikt an aktuell gewaehltes Asset und exakt denselben Zeitbereich des Charts koppeln.
- [ ] Bundle B: Renditegegenueberstellung fuer denselben Zeitraum und dasselbe Asset anzeigen: `Buy & Hold` vs. `Trading-Strategie`.

## P2 (Later)

- [ ] Bundle C: Evaluieren, wie aktuelle Makro-Eventdaten und Releases in MacroLens kommen koennen, z. B. `Core PCE MoM`, `GDP Growth QoQ`, `Durable Goods Orders`, `JOLTs Job Openings`, inklusive `actual / expected / prior` und Ueberraschung.
  Scope: direkte APIs (z. B. `FRED`, wenn verfuegbar), Webseiten/Provider wie `tradingeconomics.com`, spezialisierte Quellen wie `creditspreadalert.com`, Mail-Ingestion fuer Event-Mails sowie RSS-Feeds wie `finanznachrichten.de` nach Qualitaet, Lizenz/Scraping-Risiko, Latenz, Historie, Normalisierung und Betriebsaufwand bewerten.

## Backlog (Process / Team, erst bei Bedarf)

- [ ] `CODEOWNERS`/PR-Templates einführen (wenn mehrere Personen aktiv beitragen).
- [ ] Secret-Scanning integrieren (z. B. `gitleaks`) falls Repo wächst.
