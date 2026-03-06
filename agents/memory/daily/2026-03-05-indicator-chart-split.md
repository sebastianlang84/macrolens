# 2026-03-05 Zweite Chart-Ebene fuer Indikatoren

## Anlass
- Nutzerwunsch: unter dem bestehenden Overlay-Chart eine zweite Chart fuer Indikatoren platzieren.
- Die Hoehenverteilung zwischen beiden Charts soll interaktiv anpassbar sein und nach Reload erhalten bleiben.

## Umsetzung
- `apps/web/src/components/series-workbench.tsx` erweitert:
  - eigener Multi-Select fuer `Overlay-Serien`
  - eigener Multi-Select fuer `Indikatoren`
  - rechter Content-Bereich als vertikaler Split mit zwei Chart-Panels
  - Drag-Separator zwischen beiden Charts
- Persistenz:
  - Split-Verhaeltnis wird in `localStorage` unter `macrolens:workbench-chart-split` gespeichert
  - gespeicherter Wert wird beim Laden wieder angewendet

## Verifikation
- `npm run lint` erfolgreich.
- `npm run build` erfolgreich.
- Laufendes Docker-Deployment danach neu gebaut, damit die UI-Aenderung auf `127.0.0.1:3001` verfuegbar ist.

## Hotfix nach erstem Rollout
- Symptom:
  - Seite wirkte fuer den Nutzer "tot", obwohl `docker compose ps` healthy und `curl -I http://127.0.0.1:3001` weiterhin `200 OK` lieferte.
- Root Cause:
  - Das neue vertikale Split-Layout liess `ResponsiveContainer` zu frueh gegen noch nicht stabile Hoehen anlaufen.
  - Recharts loggte daraufhin `width(-1)` / `height(-1)` im Container und die Chart-Flaechen kollabierten.
- Fix:
  - rechter Chart-Bereich von Flex-Basis auf explizite Grid-Zeilen umgestellt
  - Chart-Panels rendern Recharts erst nach dem ersten Client-Frame; davor erscheint bewusst ein Platzhalter `Chart wird initialisiert...`
- Verifikation:
  - `npm run lint` erneut erfolgreich.
  - `npm run build` erneut erfolgreich.
  - `docker compose logs --tail=120 web` zeigt nach dem Redeploy keine `width(-1)` / `height(-1)`-Warnungen mehr.
