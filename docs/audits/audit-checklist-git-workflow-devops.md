```md
# Git-Workflow Audit (Unternehmen) – Checkliste

## 1) Ziele & Governance
- Gibt es einen dokumentierten Git-Workflow (1–2 Seiten) inkl. Rollen/Verantwortungen?
- Passt der Workflow zur Produkt-/Team-Realität (Trunk-based vs GitFlow vs Hybrid)?
- Klarer Definition-of-Done für Code (Review, Tests, Security, Docs).

## 2) Repos & Struktur
- Repo-Strategie: Monorepo vs Polyrepo – begründet, konsistent, skalierbar.
- Standard-Layout (src/, docs/, infra/, scripts/, .github/.gitlab/…)
- Ownership klar: CODEOWNERS/Teams je Bereich/Service.
- Abhängigkeiten/Shared-Libs: Versionierung, Release-Prozess, Breaking-Change-Handling.

## 3) Branching-Strategie
- Standard-Branch (main/master) + klare Namenskonventionen (feature/*, bugfix/*, hotfix/*, release/*).
- Lebensdauer von Branches kurz; keine „ewigen“ Feature-Branches.
- Merge-Strategie definiert (merge commit vs squash vs rebase) + rationale.
- Umgang mit Backports/Hotfixes klar (Cherry-pick Policy).

## 4) Pull Requests / Merge Requests
- PR-Template: Problem, Lösung, Risiko, Tests, Rollback, Tickets.
- Review-Regeln: min. Reviewer-Anzahl, Senior-Review für kritische Bereiche.
- CODEOWNERS enforced (required reviewers).
- PR-Größe: klein & häufig; klare Policy gegen „Mega-PRs“.
- Draft-PRs/Stacked PRs: erlaubt? Regeln/Tooling.
- Automatisches Linking zu Issue/Task (Jira/GitHub Issues) verpflichtend.

## 5) Commit-Qualität & Historie
- Commit-Messages: Convention (z.B. Conventional Commits) oder klarer Standard.
- Kleine atomare Commits; saubere Historie (kein „fix fix fix“ im main).
- Signed commits / DCO (Developer Certificate of Origin) – falls Compliance relevant.
- Policy für Rewrites (force-push) strikt geregelt (idealerweise verboten auf shared branches).

## 6) Branch Protection & Access Control
- Branch protection: required reviews, required status checks, no direct pushes.
- Force-push & delete branch: restriktiv.
- SSO/2FA verpflichtend; Rollenmodell (least privilege).
- SSH keys/PATs: Rotation, Scopes minimal, kein Shared-Account.
- Audit-Logs: aktiviert, Aufbewahrung/Export geregelt.

## 7) CI/CD Integration (Build, Test, Deploy)
- Jeder PR triggert: lint/format, unit tests, integration tests (wo sinnvoll).
- Tests sind deterministisch (keine flakiness toleriert ohne Maßnahmen).
- Quality Gates: Coverage/Mindestanforderungen (mit Augenmaß), SAST/Dependency Scan.
- Artifacts reproduzierbar (Lockfiles, pinned toolchains, Build-Cache kontrolliert).
- Environments: klare Promotion (dev → staging → prod) + Approval/Change-Management.
- Rollback-Strategie: dokumentiert und regelmäßig geübt.

## 8) Release- & Versionierungsprozess
- Versioning: SemVer oder alternatives Schema – konsistent.
- Releases: Tags, Release Notes, Changelog-Generierung (automatisiert wenn möglich).
- Release-Branches nur wenn nötig; Release-Cut, Freeze, Hotfix-Flow definiert.
- Reproducible builds + Release-Provenance (z.B. SBOM) bei Bedarf.

## 9) Security & Supply Chain
- Secret-Scanning (pre-commit + server-side) + Incident-Prozess für Leaks.
- Dependency-Management: Renovate/Dependabot, Review-Policy, SLA für CVEs.
- SAST/DAST (je nach Produkt), IaC-Scanning (Terraform/K8s), Container Scans.
- Third-party Git Apps/Webhooks: erlaubt? review/allowlist.

## 10) Tooling & Developer Experience
- Pre-commit hooks (format/lint, secret scan) + einheitliche Toolchain.
- Standardisierte Dev-Container/Bootstrap-Scripts (schnelles Onboarding).
- IDE-Empfehlungen, EditorConfig, formatter/linter settings im Repo.
- Git LFS nur wenn nötig; Kontrolle von Repo-Bloat (große Dateien, History).

## 11) Ops, Backup, DR, Compliance
- Backup/Restore getestet (Repo-Mirroring, Git host export, Schlüsselmanagement).
- Retention/Legal Hold (falls nötig).
- Zugriffe bei Offboarding: sofort entzogen, Schlüssel/Token invalidiert.

## 12) Metriken & kontinuierliche Verbesserung
- DORA-Metriken (Deployment Frequency, Lead Time, Change Failure Rate, MTTR).
- PR Cycle Time, Review-Wartezeit, offene PR-Alter, Rework-Rate.
- Häufige Ursachen für Konflikte/Flakes/Hotfixes werden systematisch abgestellt.

## 13) Typische Red Flags
- Direkte Pushes in main, fehlende Status-Checks.
- Große PRs, lange lebende Branches, seltene Integrationen.
- „Works on my machine“ (fehlende reproduzierbare Builds/Lockfiles).
- Keine Ownership (niemand fühlt sich zuständig), keine Audit-Logs.
- Secrets im Git-Verlauf, keine Rotation, keine Scans.

## 14) Minimaler Soll-Zustand (Quick Wins)
- Branch protection + required checks + CODEOWNERS.
- PR-Template + Review-Regeln.
- CI: lint+unit in PR, deploy nur via pipeline.
- Secret scanning + dependency updates.
- Release tags + changelog.
```

