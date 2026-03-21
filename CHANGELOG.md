# CHANGELOG.md

All notable user- or operator-relevant changes to this repository will be documented in this file.

The format is based on Keep a Changelog.

## [Unreleased]

### Added
- Dokumentations-Governance mit `docs/policies/policy_docs_contract.md`, `docs/README.md`, `docs/runbooks/` und `docs/plans/` eingefuehrt.
- `CHANGELOG.md` als kuratierte Aenderungshistorie fuer nutzer-/operatorrelevante Repo-Aenderungen hinzugefuegt.
- `docs/runbooks/web-first-checks.md` als explizites First-Checks-Runbook fuer Web-/Ops-Themen hinzugefuegt.

### Changed
- Root-Dokumente (`AGENTS.md`, `README.md`, `INDEX.md`, `MEMORY.md`, `TODO.md`) auf klarere Abgrenzung zwischen Setup, stabilem Zustand, aktiver Arbeit, Historie und Policy ausgerichtet.
- `TODO.md` auf aktive offene Arbeit reduziert; erledigte Historie wurde daraus entfernt.
- `AGENTS.md` auf eine staerker normative Struktur mit Role/Rules/Key Files/Gates reduziert und von prozeduralen Ops-Details entlastet.
- `AGENTS.md` weiter auf ihren eigentlichen Zweck verengt: keine eigene Dokument-Routing-Erklaerung mehr, sondern nur noch Verweis auf die kanonische Docs-Policy.
- `AGENTS.md` weiter geschaerft: freistehende Zielzeile entfernt, Normsprache (`MUST`/`MUST NOT`) eingefuehrt, Git-Regeln auf `docs/git-workflow.md` verwiesen und die Sicherheitsverbote in eine kompakte Deny-List zusammengezogen.
- `AGENTS.md` nochmals minimalisiert: schwach zusaetzliche Stil-/Guardrail-Sektionen entfernt, verbleibende Ops- und Scope-Regeln noch enger an Gates und Deny-List angebunden.
