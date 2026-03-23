# Policy: Documentation Contract

## Purpose
Definiert die Rolle der zentralen Repo-Dokumente, reduziert Ueberschneidungen und haelt dauerhafte Regeln in Dateien statt nur im Chat.

## 1) Document Roles

### `AGENTS.md`
Purpose: Normative Regeln fuer Coding Agents.
Contains: Guardrails, Mess-/Verifikationspflichten, Routing, Definition of Done.
Does not contain: Projektstatus, laengere How-tos, laufende Historie.

### `README.md`
Purpose: Operator- und Nutzerguide.
Contains: Zweck des Repos, Setup, Run, Verify, Troubleshooting, kurze Architektur.
Does not contain: Laufende Entscheidungshistorie, aktive Tasklisten, episodische Logs.

### `INDEX.md`
Purpose: Navigation-only entry point.
Contains: Kurze Links auf Root-Dokumente, relevante Fachdocs und zentrale Code-Einstiege.
Does not contain: Lange Erklaerungen oder doppelte Guidance.

### `MEMORY.md`
Purpose: Primaeres Bootstrap-Dokument fuer Folgesessions.
Contains: Current State, Long-Term Memory, Open Decisions, Known Risks, Next Steps.
Does not contain: Tagebuchartige Historie, detaillierte Incident-Verlaeufe, How-tos, Secrets.

### `TODO.md`
Purpose: Active open work.
Contains: Nur aktive offene Aufgaben mit Prioritaet.
Does not contain: Erledigte Historie, Release-Notizen, detailreiche Umsetzungsplaene.

### `CHANGELOG.md`
Purpose: Kuratierte nutzer-/operatorrelevante Repo-Aenderungen.
Contains: Sichtbare Aenderungen mit Kategorien wie `Added`, `Changed`, `Fixed`, `Breaking`.
Does not contain: Interne Arbeitsnotizen, offene Aufgaben, dauerhafte Defaults.

### `docs/runbooks/*`
Purpose: Prozedurale SOPs und wiederverwendbare operative Schritte.

### `docs/plans/*`
Purpose: Detailplaene fuer aktive groessere Arbeiten, wenn `TODO.md` zu knapp waere.

### `agents/memory/daily/*`
Purpose: Chronologische Arbeits-, Incident- und Untersuchungsnotizen.

## 2) Routing Rules

- Stable current truth -> `MEMORY.md`
- Active open work -> `TODO.md`
- User-/operator-visible change history -> `CHANGELOG.md`
- Procedural/how-to guidance -> `docs/runbooks/*`
- Detailed execution plan -> `docs/plans/*`
- Chronological working notes -> `agents/memory/daily/*`
- Operator-facing setup/usage/troubleshooting -> `README.md`
- Navigation only -> `INDEX.md`

## 3) Boundary Rules

### `MEMORY.md` vs `agents/memory/daily/*`
- `MEMORY.md` haelt nur stabile aktuelle Wahrheit.
- Tagesnotizen duerfen Verlauf, Sackgassen und Incident-Details enthalten.
- `MEMORY.md` soll nicht zum Tagebuch werden.

### `MEMORY.md` vs `TODO.md`
- `MEMORY.md` speichert dauerhaften Zustand und offene Entscheidungen.
- `TODO.md` speichert nur aktive offene Arbeit.
- Kein Backlog oder erledigte Historie in `MEMORY.md`.

### `TODO.md` vs `docs/plans/*`
- `TODO.md` bleibt kompakt.
- Grosse Aufgaben koennen auf `docs/plans/*` verweisen.

### `README.md` vs `docs/runbooks/*`
- `README.md` enthaelt nur kurze, breit relevante Setup-/Troubleshooting-Abschnitte.
- Wiederkehrende oder laengere SOPs gehoeren in `docs/runbooks/*`.

### `CHANGELOG.md` vs `MEMORY.md`
- `CHANGELOG.md` beantwortet: Was hat sich sichtbar geaendert?
- `MEMORY.md` beantwortet: Was ist aktuell wahr und was muss die naechste Session wissen?

## 4) Maintenance Rules

- Keine Secrets in Memory-, Todo-, Daily- oder Policy-Dateien.
- Double-Injections ueber Datei-Grenzen vermeiden: Ein Steuerungs- oder Kontextinhalt soll genau ein kanonisches Zuhause haben; andere Dateien sollen ihn hoechstens knapp referenzieren, nicht erneut ausformulieren.
- `MEMORY.md` wird in place umgeschrieben statt nur angehaengt.
- `TODO.md` enthaelt nur offene Punkte; erledigte Eintraege werden entfernt.
- `INDEX.md` bleibt link-orientiert.
- `CHANGELOG.md` bleibt kuratiert und outcome-fokussiert.

## 5) Update Triggers

- Update `README.md`, wenn Setup, Betrieb oder Troubleshooting-Flows sich aendern.
- Update `TODO.md`, wenn aktive Arbeit oder Prioritaeten sich aendern.
- Update `MEMORY.md`, wenn stabiler Zustand, Defaults, Risiken oder Entscheidungen sich aendern.
- Update `CHANGELOG.md`, wenn eine nutzer-/operatorrelevante Repo-Aenderung eingefuehrt wird.
- Update `docs/runbooks/*`, wenn ein wiederkehrender Ablauf genauer beschrieben werden muss.
- Update `docs/plans/*`, wenn eine grosse aktive Aufgabe einen Detailplan braucht.

## 6) Reset Resilience

- Verbindliche Vereinbarungen leben in Repo-Dateien, nicht nur im Chat.
- `MEMORY.md` ist das primaere Bootstrap-Dokument fuer Folgesessions.
- Diese Policy ist die massgebliche Grenze fuer Root-Markdown-Dateien in MacroLens.
