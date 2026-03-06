# TODO.md

## P0 (Now)

- [x] `zod`-Validierung für FRED-Responses in `apps/web/src/lib/providers/fred.ts` einbauen.
- [x] `zod`-Validierung für Yahoo-Responses in `apps/web/src/lib/providers/yahoo.ts` einbauen (mindestens relevante Felder).
- [x] Unit-Tests für `apps/web/src/lib/stats.ts` hinzufügen (Änderungsraten, leere Reihen, Randfälle).
- [x] Unit-Tests für `apps/web/src/lib/macro-derivations.ts` hinzufügen (Trend/Breadth/VIX/Öl-Regeln).
- [x] `apps/web/src/app/error.tsx` ergänzen (saubere Fehlerdarstellung im App Router).
- [x] `apps/web/src/app/loading.tsx` ergänzen (besseres UX beim Laden).

## P1 (Next)

- [x] `apps/web/.nvmrc` oder `.node-version` hinzufügen und unterstützte Node-Version in `README.md` dokumentieren.
- [x] Minimal-CI einrichten (z. B. GitHub Actions mit `npm ci`, `npm run lint`, `npm run build`).
- [x] `README.md` um Voraussetzungen (Node/NPM) ergänzen.
- [x] `README.md` um Screenshot oder kleines Architekturdiagramm ergänzen.
- [x] Caching-Strategie dokumentieren (welche Daten `no-store`, welche cachebar wären).
- [x] Rate-Limit/Abuse-Schutz für `GET /api/dashboard` planen (mindestens Doku-Entscheidung).

## P2 (Later)

- [x] Weitere FRED-Serien hinzufügen (z. B. `CPIAUCSL`, `UNRATE`, `DGS10`, `DGS2`).
- [x] Yield-Curve- und Inflations-/Arbeitsmarkt-Signale in `apps/web/src/lib/macro-derivations.ts` ergänzen.
- [x] Credit-Signale ergänzen (z. B. HY-/IG-Spreads oder Credit-Spread-Proxies).
- [x] Datenbank/Caching evaluieren (`PostgreSQL + Prisma`, optional TimescaleDB) – *Evaluation in docs/evaluation-db-caching.md*.
- [x] Observability planen (strukturierte Logs, Fehlertracking, Metriken) – *Basis-Timing-Logging integriert*.
- [x] Accessibility-Review durchführen (Kontraste, Keyboard, Screenreader-Basis) – *Schriftgrößen & ARIA-Roles optimiert*.
- [x] Deployment-Dokumentation ergänzen (Docker Compose Basis für stabilen Betrieb).

## Backlog (Process / Team, erst bei Bedarf)

- [x] Git-Workflow dokumentieren (Branching, PR-Regeln, Commit-Konvention) – *In docs/git-workflow.md*.
- [ ] `CODEOWNERS`/PR-Templates einführen (wenn mehrere Personen aktiv beitragen).
- [ ] Secret-Scanning integrieren (z. B. `gitleaks`) falls Repo wächst.
