# 2026-03-21 AGENTS.md Audit Closure

## Anlass
- Offene Findings aus dem `agentic-coding`-`audit-agents-md` sollten ohne neue Policy-Dopplung geschlossen werden.

## Ergebnis
- Freistehende Zielzeile aus `AGENTS.md` entfernt.
- Kritische Regeln auf `MUST`/`MUST NOT` umgestellt.
- Git-Workflow nicht in `AGENTS.md` dupliziert, sondern auf `docs/git-workflow.md` verwiesen.
- Sicherheits- und Destruktionsverbote in eine kompakte Deny-List gebuendelt.
- Keine Reporting-Regel, kein Conflict-Model und kein separates Stop-&-Ask-Regime eingefuehrt.

## Verifikation
- Doku-Dateien angepasst.
- `npm run lint` in `apps/web` nachgezogen.
