# AGENTS.md

Projektziel: Lernorientiertes Makro-Dashboard mit `Next.js`, `TypeScript`, FRED/Yahoo-Daten und Charts.

## Non-Negotiables
- Vor Änderungen zuerst lesen/verstehen (`README.md`, `INDEX.md`, `MEMORY.md`, betroffene Dateien).
- Kleine, reviewbare Diffs; keine unnötigen Refactors.
- API-Keys nie committen (`.env.local` lokal verwenden).
- Änderungen immer verifizieren (`npm run lint`, ggf. `npm run build`).
- Keine Topologie-/Infrastruktur-Annahmen ohne lokalen Nachweis aus laufendem System (`docker ps`, `docker inspect`, `tailscale status`, `tailscale serve status`).

## Memory Routing
- Stabiler Projektstatus / offene Entscheidungen: `MEMORY.md`
- Bedienung / Setup: `README.md`
- Navigation: `INDEX.md`
- Tägliche Notizen / Verlauf: `agents/memory/daily/*`

## Definition of Done (Pflicht)
- Ein Task gilt erst als abgeschlossen, wenn alle zutreffenden Punkte erledigt sind:
- Fachlicher Fix/Änderung ist umgesetzt.
- Verifikation ist durchgeführt (`npm run lint`, bei Bedarf `npm run build`, plus Laufzeitcheck bei Ops-Themen).
- Erkenntnisse sind persistent dokumentiert:
- Stabiler Stand/Regel in `MEMORY.md`.
- Zeitlicher Verlauf/Incident in `agents/memory/daily/<YYYY-MM-DD>-*.md`.
- Bei wiederkehrenden Ops-Problemen ist ein kurzes Runbook in `README.md` oder `MEMORY.md` ergänzt/aktualisiert.

## Incident Workflow (Pflicht bei 4xx/5xx/Ops-Ausfällen)
- Immer in dieser Reihenfolge arbeiten:
1. Symptom konkret messen (z. B. `curl -I` mit Statuscode).
2. First Checks im betroffenen Laufzeitkontext ausführen.
3. Root Cause benennen (kein Blind-Fix).
4. Fix umsetzen.
5. Extern und intern verifizieren.
6. Memory-Writeback durchführen (`MEMORY.md` + Daily Note).

## First Checks fuer dieses Setup (Pflicht bei MacroLens-HTTP-Fehlern)
- `docker compose ps` im Repo ausführen und Zustand von `web` prüfen.
- Lokal verifizieren: `curl -I http://127.0.0.1:3001`.
- Bei Bedarf Logs: `docker compose logs --tail=200 web`.
- Erst danach weitere Hypothesen (DNS, Clients, Tunnel) verfolgen.
- `openclaw/owui`-Routing (ai_stack) nicht anfassen, ausser der User fordert es explizit.

## Assumption Guardrails
- Keine Aussagen wie "Host X ist extern/anderer Rechner", bevor `tailscale status --json` und Container-/Netzwerkdaten geprüft sind.
- Bei Unsicherheit zuerst Messdaten liefern, dann Schlussfolgerung.
- Frühere Fehlannahmen im selben Turn aktiv korrigieren und in Memory festhalten.

## Working Style
- Server-seitiges Daten-Fetching bevorzugen, wenn Secrets beteiligt sind.
- Neue Datenquellen erst normalisieren, dann UI bauen.
- Makro-Ableitungen als nachvollziehbare Heuristiken formulieren (keine Blackbox).