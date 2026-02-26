```md
# AI-Agent Audit — Linux VM (Enterprise) — RooCode für große Codebases

## 0) Zielbild (Definition von „optimal“)
- [ ] Agent liefert **kleine, reviewbare Diffs** (≤ ~200 LoC) mit Tests/Build grün.
- [ ] Änderungen sind **lokalisiert** (klare Scope-Grenzen, keine Repo-weiten Refactors ohne Auftrag).
- [ ] **Reproduzierbar**: jede Änderung lässt sich via Commands/CI nachvollziehen.
- [ ] **Sicher**: keine Secrets/PII-Leaks, keine unkontrollierte Netz-Exfiltration.

## 1) VM-/Enterprise-Setup (Grundlagen, die Agent-Qualität massiv beeinflussen)
- [ ] Paketstand (OS, Kernel, OpenSSL, Git, Node/Python/Java etc.) aktuell; Security-Updates aktiv.
- [ ] Benutzer/Privileges: getrennte Dev-User, **kein unnötiges sudo**, least privilege.
- [ ] SSH/Keys: key-basierte Auth, key-rotation, kein Shared-Account.
- [ ] Netzwerk: Proxy/Firewall-Regeln klar; outbound nur wo nötig (Tool-Calling/LLM-Endpunkte).
- [ ] Zertifikate/CA: Enterprise-CA sauber integriert (Git, Package Manager, LLM endpoints).
- [ ] Storage/FS: ausreichend IOPS/Space; repo auf SSD; inode limits ok.
- [ ] Time/Locale: korrekte TZ/NTP (wichtig für CI, Logs, Signaturen).

## 2) Provider-/Modell-Policy (Datenabfluss & Compliance)
- [ ] Festgelegt: **welche Modelle/Provider** sind erlaubt (z.B. lokal vs. Cloud, ZDR/non-training).
- [ ] Logging/Telemetry: was wird geloggt (Prompts/Code)? wo liegen Logs? retention?
- [ ] Data classification: welche Repo-Teile dürfen raus (open source) vs. strikt intern.
- [ ] Tool-Policy: Internetzugriff für Agent? wenn ja: Domains allowlist.

## 3) Repo-Readiness: „Agent muss das Projekt bauen/testen können“
- [ ] One-command bootstrap: `make setup` / `devbox` / `nix` / `docker compose`.
- [ ] One-command test: `make test` / `pnpm test` / `pytest` / `go test ./...`.
- [ ] One-command lint/format: `make lint` + fixer.
- [ ] Reproduzierbare Envs: lockfiles (pnpm-lock/yarn.lock/poetry.lock/etc.), pinned toolchains.
- [ ] CI spiegelt lokal: gleiche Commands/Container Images.

## 4) Kontext-Steuerung für große Codebases (sonst „RooCode ertrinkt“)
- [ ] **Ignore-Regeln**: `.gitignore` + agent-spezifisch (`.rooignore`/ähnlich) für:
  - build artifacts (`dist/`, `build/`, `target/`), vendored deps, generated code, large binaries
  - Logs, node_modules, caches
- [ ] Repo-Doku als „Index“: `README`, `ARCHITECTURE.md`, `docs/`, ADRs, Runbooks.
- [ ] „Golden paths“ dokumentiert: Einstiegspunkte, Hauptmodule, Datenfluss, boundaries.
- [ ] Such-/Navigations-Tooling vorhanden: `rg` (ripgrep), `fd`, `ctags`, `tree`, `jq`.
- [ ] LSP/Language Servers installiert (TS/Go/Python/Java etc.) → bessere Symbolauflösung.

## 5) Agent-Governance (damit Tasks planbar & sicher bleiben)
- [ ] Projektweite Regeln in **AGENTS.md**:
  - Scope-Regeln (max Diff, keine Repo-weiten Refactors)
  - „Tests first / Tests always“ (mindestens passende Unit/Integration Tests)
  - „No secrets“ + Umgang mit .env
  - Review-Gates (CI muss grün, Format/Lint)
- [ ] Memory/Continuity: `MEMORY.md`/`CHANGELOG.md`/`ADR/` für Entscheidungen.
- [ ] Definition of Done (DoD): Build, Tests, Lint, Docs/Changelog wenn nötig.

## 6) Task-Zerlegung & Workflow (Agent-Produktivität)
- [ ] Standard-Workflow:
  1) Repro/Problemstatement
  2) Minimaler Plan (3–7 Schritte)
  3) Änderungen in kleinem Slice
  4) Tests/CI
  5) Review-Notizen + Rollback-Hinweis
- [ ] „Find the owner“: klare Ownership-Metadaten (CODEOWNERS, module owners).
- [ ] Dependency-Map: Monorepo tools (Nx/Turbo/Bazel) oder zumindest Diagramm.
- [ ] Large refactors nur über RFC/ADR + staged PRs.

## 7) RAG / Wissensbasis (wenn Codebase zu groß für reinen Kontext)
- [ ] Knowledge-Basis aus:
  - Architektur-Dokus, ADRs, API Specs (OpenAPI), DB-Schema, Runbooks, Onboarding
- [ ] Chunking/Tagging: pro Modul/Service getrennt; „recency“ für aktuelle Änderungen.
- [ ] Build-Outputs ausgeschlossen (sonst RAG-Müll).

## 8) DB/Infra & Secrets (häufige Agent-Fallen)
- [ ] Secrets: nur in Secret-Store (Vault/1Password/sops), nicht im Repo.
- [ ] Secret-Scanning: gitleaks/trufflehog + pre-commit.
- [ ] DB-Migrations: versioniert (Flyway/Liquibase/alembic/etc.), keine manuellen Prod-Edits.
- [ ] Staging/Dev DB: sichere Dummy-Daten, keine echten Kundendaten.

## 9) Observability & Kostenkontrolle
- [ ] Agent-Actions auditiert: welche Files gelesen/geändert, welche Commands ausgeführt.
- [ ] Token-/Kosten-Tracking pro Task/PR.
- [ ] Failure-Modes dokumentiert: typische Halluzinationen/Fehlpfade + Gegenmaßnahmen.

## 10) Praktische RooCode/IDE Checks (damit es „flutscht“)
- [ ] VS Code Remote/SSH stabil; Terminal-Commands identisch wie in CI.
- [ ] RooCode so konfiguriert, dass es:
  - nur relevante Workspaces/Root erkennt
  - Tests/Lint automatisch ausführt (oder per „runbook“)
  - bei Multi-Service repos die **richtige** CWD/Env nutzt
- [ ] „Quick context“ Snippets: Pfade zu wichtigsten Dateien (entrypoints, configs, schema, router).

## 11) Red Flags (sofort adressieren)
- [ ] Kein deterministischer Build/Test ("works on my machine").
- [ ] Riesige generated/vendor trees im Repo ohne ignore.
- [ ] Fehlende Architektur-Doku/ADRs → Agent verliert Zeit.
- [ ] Unklare Boundary zwischen Services/Modulen → Agent macht invasive Änderungen.
- [ ] Geheimnisse in `.env`/Configs im Repo.

## 12) Minimum-Setup (wenn du nur 5 Dinge fixen willst)
- [ ] `make setup && make test && make lint` (oder äquivalent) bereitstellen.
- [ ] `.rooignore`/ignore für build/vendor/generated.
- [ ] `AGENTS.md` mit Scope+DoD+Secrets+Tests.
- [ ] `ARCHITECTURE.md` (Datenfluss + Module + Entry Points).
- [ ] Secret-Scanning + CI Gate.
```

