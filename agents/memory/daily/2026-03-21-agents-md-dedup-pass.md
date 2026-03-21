# 2026-03-21 AGENTS.md Dedup Pass

## Anlass
- `AGENTS.md` sollte nicht nur besser sein, sondern strikt ihren Policy-Zweck erfuellen und keine Dokument-Rollen aus anderen Dateien wiederholen.

## Ergebnis
- `AGENTS.md` von dokumentarischer Doppelung bereinigt.
- Eigenes Dokument-Routing und implizite Rollen-Erklaerungen entfernt.
- Verbleibend sind nur noch normative Agentenregeln, Gates, Verifikationspflicht und knappe Verweise auf die kanonische Docs-Policy sowie das Ops-Runbook.

## Verifikation
- Doku-Dateien angepasst.
- `npm run lint` in `apps/web` nachgezogen.
