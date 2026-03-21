# CHANGELOG.md

All notable user- or operator-relevant changes to this repository will be documented in this file.

The format is based on Keep a Changelog.

## [Unreleased]

### Added
- Dokumentations-Governance mit `docs/policies/policy_docs_contract.md`, `docs/README.md`, `docs/runbooks/` und `docs/plans/` eingefuehrt.
- `CHANGELOG.md` als kuratierte Aenderungshistorie fuer nutzer-/operatorrelevante Repo-Aenderungen hinzugefuegt.
- `docs/runbooks/web-first-checks.md` als explizites First-Checks-Runbook fuer Web-/Ops-Themen hinzugefuegt.
- Dashboard-Pipeline-Tests hinzugefuegt, die Provider-Dispatch sowie Warning-/Signal-Assembly ueber eine Boundary absichern.

### Fixed
- Workbench-Layout auf kleinen Viewports entkoppelt: das Dashboard erzwingt kein globales `100dvh`-One-Screen-Layout mehr, Slot-Konfiguration und Charts stapeln sich mobil/tabletfaehig und der manuelle Chart-Splitter ist auf Desktop begrenzt.
- Workbench-A11y fuer Slot-Steuerung und Hover-Readout verbessert: Y-Checkboxen und `L`-Buttons haben eindeutige zugaengliche Namen, und der visuelle Chart-Readout spammt Screenreader nicht mehr ueber `aria-live`.

### Changed
- `AGENTS.md` verweist auf Root-Dokumente jetzt nur noch ueber eine eigene `Key Files`-Sektion ohne Lesebefehl; welche Dateien tatsaechlich gelesen werden muessen, ergibt sich taskbezogen aus Diagnose und Verifikation.
- Dashboard-Datenfluss hinter `apps/web/src/lib/dashboard-pipeline.ts` als explizite Boundary gekapselt; `dashboard-data.ts` ist nur noch der schmale Einstieg.
- Makro-Signal-Ableitung in ein eigenes Regelmodul `apps/web/src/lib/macro-signal-rules.ts` geschnitten, sodass die Signalreihenfolge ueber eine explizite Registry statt ueber verteilte Aufrufe laeuft.
- Root-Dokumente (`AGENTS.md`, `README.md`, `INDEX.md`, `MEMORY.md`, `TODO.md`) auf klarere Abgrenzung zwischen Setup, stabilem Zustand, aktiver Arbeit, Historie und Policy ausgerichtet.
- `TODO.md` auf aktive offene Arbeit reduziert; erledigte Historie wurde daraus entfernt.
- `AGENTS.md` auf eine staerker normative Struktur mit Role/Rules/Key Files/Gates reduziert und von prozeduralen Ops-Details entlastet.
- `AGENTS.md` weiter auf ihren eigentlichen Zweck verengt: keine eigene Dokument-Routing-Erklaerung mehr, sondern nur noch Verweis auf die kanonische Docs-Policy.
- `AGENTS.md` weiter geschaerft: freistehende Zielzeile entfernt, Normsprache (`MUST`/`MUST NOT`) eingefuehrt, Git-Regeln auf `docs/git-workflow.md` verwiesen und die Sicherheitsverbote in eine kompakte Deny-List zusammengezogen.
- `AGENTS.md` nochmals minimalisiert: schwach zusaetzliche Stil-/Guardrail-Sektionen entfernt, verbleibende Ops- und Scope-Regeln noch enger an Gates und Deny-List angebunden.
- `AGENTS.md` ergaenzt, dass der sinnvolle Einsatz von Subagents in diesem Projekt ausdruecklich gewuenscht ist.
