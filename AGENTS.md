# AGENTS.md

Projektziel: Lernorientiertes Makro-Dashboard mit `Next.js`, `TypeScript`, FRED/Yahoo-Daten und Charts.

## Non-Negotiables
- Vor Änderungen zuerst lesen/verstehen (`README.md`, `INDEX.md`, `MEMORY.md`, betroffene Dateien).
- Kleine, reviewbare Diffs; keine unnötigen Refactors.
- API-Keys nie committen (`.env.local` lokal verwenden).
- Änderungen immer verifizieren (`npm run lint`, ggf. `npm run build`).

## Memory Routing
- Stabiler Projektstatus / offene Entscheidungen: `MEMORY.md`
- Bedienung / Setup: `README.md`
- Navigation: `INDEX.md`
- Tägliche Notizen / Verlauf: `agents/memory/daily/*`

## Working Style
- Server-seitiges Daten-Fetching bevorzugen, wenn Secrets beteiligt sind.
- Neue Datenquellen erst normalisieren, dann UI bauen.
- Makro-Ableitungen als nachvollziehbare Heuristiken formulieren (keine Blackbox).

