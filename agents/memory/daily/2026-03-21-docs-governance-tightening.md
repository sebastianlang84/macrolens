# 2026-03-21 Docs Governance Tightening

## Anlass
- Vergleich der Doku-Policy in `/home/wasti/agentic-coding` mit MacroLens.

## Ergebnis
- MacroLens hat jetzt einen expliziten Dokumentenvertrag in `docs/policies/policy_docs_contract.md`.
- `CHANGELOG.md` wurde eingefuehrt.
- `TODO.md` wurde auf aktive offene Arbeit reduziert.
- `MEMORY.md` wurde von verlaufsartiger Historie auf stabilen Zustand zurueckgeschnitten.
- `README.md`, `INDEX.md` und `AGENTS.md` referenzieren die neuen Grenzen und Routing-Regeln.

## Verifikation
- Root- und Docs-Dateien angepasst.
- `npm run lint` in `apps/web` nachgezogen.
