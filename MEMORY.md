# MEMORY.md

## Current State
- Repository enthält eine Next.js-App unter `apps/web` (`App Router`, `TypeScript`, `Tailwind v4`) mit Makro-/Marktdaten aus Yahoo Finance und FRED.
- Das Dashboard wird serverseitig aggregiert; der Route Handler liegt unter `apps/web/src/app/api/dashboard/route.ts`.
- Die P0-Basis ist abgesichert: `zod`-Validierung in Providern, `vitest`-Tests für Stats/Ableitungen sowie App-Router-`error.tsx` und `loading.tsx`.
- Node-Version ist über `apps/web/.nvmrc` gepinnt; Minimal-CI für `lint`/`test`/`build` ist vorhanden.
- `apps/web` nutzt zusätzlich `Ultracite`/`Biome` für `npm run check` und `npm run fix`; `npm run lint` bleibt parallel aktiv.
- Stand 2026-03-21: `npm run check`, `npm run lint` und `npm run build` laufen in `apps/web` gruen. Bekannter Build-Hinweis bleibt die Next.js-Workspace-Root-Erkennung wegen `package-lock.json` im Root und in `apps/web`.
- Docker-Basis ist mit `apps/web/Dockerfile` und `docker-compose.yml` für stabilen Linux-Betrieb vorhanden; die App wird lokal bewusst auf `127.0.0.1:3001` veröffentlicht.
- `docker-compose.yml` setzt explizite DNS-Server (`1.1.1.1`, `8.8.8.8`), weil der Docker-Resolver zuvor externe Datenquellen zeitweise nicht sauber auflösen konnte.
- Die Workbench nutzt sechs feste Auswahl-Zeilen, synchronisierte obere/untere Charts, gemeinsamen X-Bereich (`3M`, `6M`, `1Y`, `2Y`, `Max`) und pro Reihe steuerbare Y-/Log-Achsen.
- Für Asset-Indikatoren sind aktuell nur `RSI Score` und `RSI Score W` vorgesehen; passende `RSI 14`-Companion-Reihen werden bei Score-Auswahl automatisch mitgerendert.
- `RSI Score` ist ein um `50` zentrierter Divergenz-Score aus Preis-/RSI-Regressionen mit DEMA-Glättung; `RSI Score W` basiert auf Monday-aggregierten Weekly-OHLC.
- Divergenzmarker werden auf dem Score-Indikator selbst gerendert; die Referenzfenster für BTCUSD wurden am 2026-03-11 gegen TradingView validiert.
- README, TODO, CHANGELOG und die neue Doku-Policy wurden am 2026-03-21 auf strengere Dokumentgrenzen umgestellt.
- `AGENTS.md` wurde am 2026-03-21 auf eine staerker normative Struktur umgestellt, auf ihren Policy-Zweck verengt und danach audit-orientiert nachgeschaerft: Normsprache, Verweis auf `docs/git-workflow.md`, kompakte Deny-List und ein weiterer Minimalismus-Pass; konkrete Web-/Ops-First-Checks liegen in `docs/runbooks/web-first-checks.md`, Dokumentgrenzen in `docs/policies/policy_docs_contract.md`.
- Vier Deepening-Kandidaten sind als aktive Architekturthemen in `TODO.md` festgehalten: Dashboard-Pipeline, Workbench-Indicator/Overlay-Engine, Workbench-Session-State-Grenze und Makro-Signal-Regelwerk.

## Long-Term Memory
- FRED benötigt einen lokalen API-Key in `apps/web/.env.local`.
- S&P 500 Equal Weight wird aktuell über `RSP` als Proxy modelliert.
- Ziel ist Lernen und Verständnis; Architektur und Begriffe sind Teil des Produkts, nicht nur die UI.
- Nutzerpräferenz: Prinzipienverständnis vor Code; Erklärungen ohne Coding-Beispiele bevorzugt.
- Sicherheitsregel: Bei Freischaltungen/Allowlists/Skills/Plugins nie von einzelnen Beispielen auf einen Voll-Enable schließen; es gilt nur der explizit genannte Scope.
- Repo-lokale temporaere Arbeitsdateien unter `tmp/` werden über die Root-`.gitignore` ignoriert.
- `openclaw/owui`-Hosts gehören zur separaten `ai_stack`-Topologie und sind kein stabiler MacroLens-Endpunkt.

## Open Decisions
- Ob und wann eine Datenbank für Caching/Historisierung eingeführt wird.
- Welche zusätzlichen Makroserien als Nächstes priorisiert werden.
- Ob spätere Nutzer eigene Watchlists oder Regime-Regeln konfigurieren können.
- Wie strikt MacroLens mittelfristig Runbooks/Plans aus `docs/` statt Root-Dokumente nutzen soll.

## Known Risks
- Yahoo ist keine offiziell stabil versionierte Datenquelle und kann sich ändern.
- Unterschiedliche Frequenzen (daily vs monthly) erschweren direkte Vergleiche.
- Einfache Heuristiken können in Sonderregimen irreführend sein.
- Die Workbench-Domänenlogik ist aktuell stark konzentriert und bleibt bis zu einem Refactor ein Wartungsrisiko.

## Next Steps
- `FRED_API_KEY` in `apps/web/.env.local` setzen und FRED-Serien im laufenden Setup prüfen.
- P0-A11y- und Responsive-Themen aus `TODO.md` abarbeiten.
- Architektur-Refactors aus `TODO.md` priorisieren und nacheinander vertiefen.
- Optional: Caching/DB einführen und Makro-Regeln schrittweise verfeinern.
