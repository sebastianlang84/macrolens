# 2026-03-21 Architecture Analysis TODO

## Anlass
- Architektur-Analyse mit dem installierten Skill `improve-codebase-architecture` fuer MacroLens durchgefuehrt.

## Ergebnis
- Vier Refactor-Kandidaten als Deepening-Themen in `TODO.md` aufgenommen:
- Dashboard-Pipeline als stabile Boundary statt flacher Orchestrierung in `dashboard-data.ts`.
- Workbench-Indicator/Overlay-Engine als gemeinsames Domänenmodul statt UI-seitiger Komposition aus vielen kleinen Exports.
- Workbench-Session-/Projection-Modul zur Trennung von State-Logik und Rendering in `series-workbench.tsx`.
- Makro-Signal-Regelwerk als tieferes Regelmodul statt wachsender Sammlung paralleler Spezialfunktionen.

## Verifikation
- Dokumentationsaenderung lokal eingetragen.
- `npm run lint` in `apps/web` nachgezogen.
