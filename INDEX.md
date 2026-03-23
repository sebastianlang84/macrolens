# INDEX.md

## Core Docs
- `README.md` -> Projektüberblick, Setup, Architektur, Lernpfad
- `MEMORY.md` -> Stabiler Snapshot / Entscheidungen / Risiken
- `TODO.md` -> Aktive offene Arbeiten
- `CHANGELOG.md` -> Nutzer-/operatorrelevante Repo-Aenderungen
- `AGENTS.md` -> Arbeitsregeln für Coding Agents
- `docs/README.md` -> Doku-Katalog und Abgrenzung unter `docs/`
- `docs/policies/policy_docs_contract.md` -> Rollen, Routing und Update-Trigger fuer Repo-Dokumente
- `docs/evaluation-db-caching.md` -> Datenbank- & Caching-Strategie
- `docs/git-workflow.md` -> Git-Branching & Commit-Konventionen
- `docs/runbooks/web-first-checks.md` -> First-Checks und Incident-Grundablauf fuer Web-/Ops-Themen

## App Code (Startpunkte)
- `docker-compose.yml` -> Docker-Orchestrierung fuer stabilen Betrieb auf Linux
- `apps/web/Dockerfile` -> Container-Build der Next.js-App
- `apps/web/src/app/page.tsx` -> Server-Komponente, lädt Dashboard-Daten
- `apps/web/src/app/api/dashboard/route.ts` -> JSON API des Dashboards
- `apps/web/src/lib/dashboard-data.ts` -> Aggregation aller Datenquellen
- `apps/web/src/lib/providers/fred.ts` -> FRED Fetch + Parsing
- `apps/web/src/lib/providers/yahoo.ts` -> Yahoo Fetch + Parsing
- `apps/web/src/lib/macro-derivations.ts` -> Heuristiken / Makro-Signale
- `apps/web/src/components/dashboard-client.tsx` -> UI-Layout und Lernsektion
- `apps/web/src/components/series-chart.tsx` -> Chart-Komponente (Recharts)

## Optional / Lern-Docs
- `docs/learning-guide.md` -> Begriffe, React/Next.js/DB/Webdesign Grundlagen
- `docs/audits/README.md` -> Audit-Checklisten + Reports Index

## Docs Routing
- `docs/runbooks/*` -> Prozeduren / Runbooks / SOPs
- `docs/plans/*` -> Detailplaene fuer aktive groessere Arbeiten
- `agents/memory/daily/*` -> Chronologische Arbeits- und Incident-Notizen
