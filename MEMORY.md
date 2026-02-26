# MEMORY.md

## Current State
- Repository enthält eine Next.js-App unter `apps/web` (`App Router`, `TypeScript`, `Tailwind v4`).
- MVP-Dashboard lädt Markt-/Makrodaten aus Yahoo Finance und FRED (FRED nur mit `FRED_API_KEY`).
- Charts werden mit `Recharts` gerendert.
- Route Handler verfügbar unter `apps/web/src/app/api/dashboard/route.ts`.
- P0-Basis abgesichert: Runtime-Validierung (`zod`) in Providern, `vitest`-Tests für Stats/Ableitungen, App Router `error.tsx` + `loading.tsx`.
- Node-Version gepinnt via `apps/web/.nvmrc` und Minimal-CI (`.github/workflows/ci.yml`) für `lint`/`test`/`build` hinzugefügt.
- README erweitert um Mermaid-Architekturdiagramm, MVP-Caching-Strategie und Rate-Limit-/Abuse-Schutz-Plan.
- P2-Ausbau erweitert: zusätzliche FRED-Serien (`CPI`, `UNRATE`, `UST 2Y/10Y`, `IG OAS`, `HY OAS`) und neue Signale (Yield Curve, Inflation, Arbeitslosenquote, Credit-Regime) integriert.
- Docker-Basis ergänzt (`apps/web/Dockerfile`, `docker-compose.yml`) mit `restart: unless-stopped` für stabilen Linux-Betrieb.
- Audit-Checklisten in `docs/audits/` wurden auf konsistentes Namensschema umgestellt; umsetzbare Findings sind in `TODO.md` priorisiert.

## Long-Term Memory
- FRED benötigt lokalen API-Key in `apps/web/.env.local`.
- S&P 500 Equal Weight wird aktuell über `RSP` (ETF) als Proxy modelliert.
- Ziel ist Lernen + Verständnis: Architektur und Begriffe sind Teil des Outputs, nicht nur UI.
- Nutzerpräferenz: Prinzipienverständnis vor Code; Erklärungen ohne Coding-Beispiele bevorzugt.

## Open Decisions
- Datenbank ja/nein (Caching/Historisierung) in späterem Schritt.
- Welche zusätzlichen Serien als Nächstes rein sollen (z. B. CPI, ISM, HY Spreads, DXY, 10Y Yield).
- Ob Nutzer später eigene Watchlists / Regime-Regeln konfigurieren können.

## Known Risks
- Yahoo-Datenquelle ist nicht offiziell stabil versioniert und kann sich ändern.
- Unterschiedliche Frequenzen (daily vs monthly) erschweren direkte Vergleiche.
- Einfache Heuristiken können in Sonderregimen irreführend sein.

## Next Steps
- `FRED_API_KEY` in `apps/web/.env.local` setzen und FRED-Serien prüfen.
- `TODO.md` P2 weiter abarbeiten (DB/Caching, Observability, A11y, Deployment-Doku).
- Optional: Caching/DB einführen (Postgres + Prisma).
- Weitere Makro-Ableitungen/Regeln iterativ verfeinern (Schwellenwerte, Regime-Definitionen).
