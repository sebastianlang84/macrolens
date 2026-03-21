# 2026-03-21 AGENTS.md Minimalism Pass

## Anlass
- Nach dem Audit sollte `AGENTS.md` nicht nur korrekt, sondern moeglichst gate-zentriert und frei von schwach zusaetzlichen Sektionen werden.

## Ergebnis
- Stil- und Guardrail-Wiederholungen entfernt, soweit sie bereits durch `Rules`, `Gates` oder `Deny List` getragen wurden.
- `openclaw/owui`-Scope-Verbot in die `Deny List` gezogen.
- Ops-Hinweis auf einen knappen Verweis zum Runbook reduziert.

## Verifikation
- Doku-Dateien angepasst.
- `npm run lint` in `apps/web` nachgezogen.
