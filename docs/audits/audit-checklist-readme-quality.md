```md
# README.md Audit-Checkliste (Vorlage)

> Ziel: Schnell beurteilen, ob eine README **nützlich, aktuell, konsistent, sicher** und **leicht konsumierbar** ist.
> Bewertungslogik (optional): ✅ erfüllt / ⚠️ teilweise / ❌ fehlt + Notiz.

---

## 0) Meta: Kontext & Zielgruppe
- [ ] **Zielgruppe klar** (Nutzer, Contributor, Ops, Security, Management) + README adressiert sie.
- [ ] **Scope klar**: Was ist in README, was ist in `docs/` (und Link dorthin).
- [ ] **Projektstatus**: aktiv/maintenance/deprecated/archived + Hinweis.
- [ ] **Sprache** konsistent (DE/EN), Terminologie konsistent.

## 1) Top-of-File: „In 30 Sekunden verstehen“
- [ ] **Name + kurzer One-liner** (was es ist).
- [ ] **Kurzbeschreibung (2–6 Sätze)**: Problem, Lösung, für wen, Abgrenzung.
- [ ] **Quickstart** vorhanden (minimales Beispiel in <5 Minuten).
- [ ] **Badges** (optional, nicht überladen): Build, Test, Coverage, Release, License.
- [ ] **Visuelle Orientierung** (optional): Screenshot/Diagramm, wenn UI/Architektur relevant.

## 2) Inhalt & Struktur (Lesbarkeit)
- [ ] **Logische Reihenfolge** (Konzept → Install → Usage → Dev → Ops).
- [ ] **Konsistente Überschriften-Hierarchie** (H1/H2/H3), keine Sprünge.
- [ ] **Table of Contents** (TOC) bei längeren READMEs (z. B. > ~2–3 Bildschirmseiten).
- [ ] **Kurze Absätze**, Listen statt Fließtext, klare Labels.
- [ ] **Codeblöcke klein & lauffähig** (copy/paste), mit Sprache getaggt.
- [ ] **Beispiele** zeigen „happy path“ + häufige Varianten.
- [ ] **Fachbegriffe erklärt** (oder Glossar/Links).

## 3) Installation / Setup
- [ ] **Voraussetzungen** explizit: OS, Runtime, Versionen, Tools.
- [ ] **Installationswege** getrennt:
  - [ ] End-User (Binary/Package)
  - [ ] Dev (Source)
  - [ ] Container (Docker/Compose)
- [ ] **Deterministisch**: genaue Versionen/Lockfiles/Tags wo sinnvoll.
- [ ] **Plattform-Varianten** klar (Linux/macOS/Windows) oder ausdrücklich nicht unterstützt.
- [ ] **Deinstallation / Cleanup** (optional, wenn relevant).

## 4) Usage / Beispiele
- [ ] **Minimal-Example** (Input → Output) vorhanden.
- [ ] **CLI**: Beispiele für häufige Commands + `--help` Hinweis.
- [ ] **API/Library**: Ein kurzes „Hello World“ Snippet + Link zur API-Doku.
- [ ] **Konfiguration**: Beispiel-Config + Erklärung wichtiger Keys.
- [ ] **Erwartete Outputs** (Beispielausgabe, Screenshots, Response-Schema).
- [ ] **Error Cases**: Top 3 häufige Fehler + Fix.

## 5) Architektur & Konzepte (wenn Projekt nicht trivial)
- [ ] **High-Level Architektur** (Diagramm oder Bullet-Flow).
- [ ] **Komponenten** + Verantwortung (Module/Services).
- [ ] **Datenflüsse** (Inputs/Outputs), Persistenz, Caches.
- [ ] **Dependencies**: externe Services, Ports, Credentials.
- [ ] **Limits/Non-Goals** klar (was es absichtlich nicht kann).

## 6) Konfiguration, Secrets & Sicherheit
- [ ] **Keine Secrets in README** (keine echten Tokens/Keys, keine internen URLs, keine privaten IPs).
- [ ] **Secret-Handling erklärt**: `.env.example`, Secret Manager, Vault, K8s Secrets.
- [ ] **Minimal Permissions**: welche Rechte/API Scopes nötig sind.
- [ ] **Security-Hinweise**:
  - [ ] Threats/Trust boundary kurz erwähnt
  - [ ] sichere Defaults (TLS, Auth, CORS, CSP, etc. falls relevant)
- [ ] **Responsible disclosure / Security Policy** (`SECURITY.md`) verlinkt.

## 7) Development (Contributor Onboarding)
- [ ] **Dev-Setup**: Schrittfolge (clone → install → run → test).
- [ ] **Testen**: `unit`, `integration`, `e2e` + Kommandos.
- [ ] **Lint/Format** + Kommandos.
- [ ] **Build/Release**: lokal bauen, Artefakte, Versioning.
- [ ] **Project Structure**: kurzer Überblick über Ordner.
- [ ] **Coding Standards** / Links (`CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`).
- [ ] **Commit/PR Konventionen** (optional): Conventional Commits, PR Template.

## 8) Betrieb (Ops) / Deployment (falls relevant)
- [ ] **Deployment Optionen**: Docker, systemd, K8s, Cloud.
- [ ] **Konfig für Prod** getrennt von Dev (Profile/Environments).
- [ ] **Observability**: Logging, Metrics, Tracing + wo man sie findet.
- [ ] **Healthchecks**: endpoints/commands.
- [ ] **Backups/Migrations** (DB) + Rollback.
- [ ] **Resource Requirements**: CPU/RAM/Storage grob.

## 9) Dokumentations-Ökosystem
- [ ] README verlinkt **tiefergehende Doku**: `docs/`, ADRs, API-Docs, Runbooks.
- [ ] **Changelog** vorhanden (`CHANGELOG.md`) oder Releases/Release Notes verlinkt.
- [ ] **Roadmap** (optional) oder Issue-Tracker Link.
- [ ] **FAQ** (optional) für wiederkehrende Fragen.

## 10) Qualität: Aktualität & Wahrheitsgehalt
- [ ] **Alle Commands funktionieren** (mind. einmal verifiziert).
- [ ] **Versionen stimmen** (Node/Python/Go/etc.).
- [ ] **Links funktionieren** (keine 404), relative Links korrekt.
- [ ] **Screenshots aktuell** (UI), nicht irreführend.
- [ ] **Keine Widersprüche** (README vs Code/Config vs CI).
- [ ] **Dokumentation wird mit Code geändert** (Policy/Prozess vorhanden).

## 11) Rechtliches & Ownership
- [ ] **License** klar (SPDX/`LICENSE` verlinkt).
- [ ] **Copyright**/Autorenschaft (wenn nötig).
- [ ] **Support/Ownership**: Maintainer, Team, Kontaktweg.
- [ ] **Third-party Notices** (optional) bei sensiblen Abhängigkeiten.

## 12) Markdown- und GitHub-Rendering Checks
- [ ] **Markdown korrekt gerendert** auf GitHub (Listen, Tabellen, Code).
- [ ] **Keine riesigen Tabellen** ohne Alternativen (link auf docs).
- [ ] **Images**: sinnvolle Größe, Alt-Text, relative Pfade.
- [ ] **Anchor Links** korrekt (TOC/Section links).
- [ ] **Line length** lesbar (keine extrem langen Zeilen).

---

# Audit-Output (zum Ausfüllen)

## Summary
- Gesamturteil: ✅ / ⚠️ / ❌
- Top 3 Stärken:
  1.
  2.
  3.
- Top 3 Risiken/Gaps:
  1.
  2.
  3.

## Findings (Tabelle)
| Bereich | Status | Evidence/Beispiel | Fix (kurz) | Owner | Due |
|---|---|---|---|---|---|
|  |  |  |  |  |  |

## Quick-Wins (<= 30 min)
- [ ]
- [ ]
- [ ]

## Größere Maßnahmen
- [ ]
- [ ]

```

