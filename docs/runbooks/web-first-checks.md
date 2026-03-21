# Web First Checks

Zweck: Standardisierte erste Mess- und Diagnose-Schritte fuer Web-/Ops-Themen in MacroLens.

## Workflow
1. Symptom konkret messen.
2. Zustand des lokalen Runtime-Kontexts pruefen.
3. Root Cause benennen; nicht blind fixen.
4. Fix implementieren.
5. Extern und intern verifizieren.
6. Stabilen Zustand und Verlauf in die passenden Doku-Ziele zurueckschreiben.

## First Checks for This Setup
1. `docker compose ps` im Repo ausfuehren und den Zustand von `web` pruefen.
2. `curl -I http://127.0.0.1:3001` ausfuehren. Erwartet: `HTTP/1.1 200 OK`.
3. Falls noetig: `docker compose logs --tail=200 web` pruefen.
4. Nur danach weitere Hypothesen wie DNS, Clients, Tunnel oder Remote-Zugriff verfolgen.

## Notes
- `openclaw/owui` gehoert zur separaten `ai_stack`-Topologie und ist kein standardmaessiger MacroLens-First-Check.
- Netzwerk- oder Topologieaussagen erst nach lokaler Evidenz aus Container-, Docker- oder Tailscale-Daten treffen.
