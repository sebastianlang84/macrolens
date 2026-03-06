# Git Workflow Guide (MacroLens)

## Branching-Strategie
- **Main Branch:** Stabiler Produktiv-Zweig. Nur funktionierende, getestete Features.
- **Feature Branches:** `feat/feature-name`, `fix/bug-name`, `docs/doc-name`.
- **Merge-Flow:** Alle Änderungen über Pull Requests (PRs).

## PR-Regeln
1. **Lokal testen:** `npm run lint` und `npm test` müssen grün sein.
2. **Build prüfen:** `npm run build` muss erfolgreich durchlaufen.
3. **Review:** PRs sollten (wenn mehrere Personen beitragen) von mindestens einer Person gesichtet werden.
4. **Dokumentation:** Wenn die Architektur betroffen ist, `README.md` und `MEMORY.md` aktualisieren.

## Commit-Konventionen (Conventional Commits)
Struktur: `type(scope): description`

- `feat`: Ein neues Feature (z. B. `feat(dashboard): add yield curve signal`).
- `fix`: Ein Bugfix (z. B. `fix(yahoo): correct price parsing for RSP`).
- `docs`: Reine Doku-Änderungen (z. B. `docs: update deployment steps`).
- `refactor`: Code-Umbau ohne Verhaltensänderung.
- `perf`: Performance-Verbesserungen.
- `test`: Hinzufügen oder Korrigieren von Tests.
- `chore`: Hilfsarbeiten (z. B. npm dependencies aktualisieren).

## Workflow (Schritte)
1. `git checkout main && git pull` (Basis aktualisieren).
2. `git checkout -b feat/mein-neues-feature`.
3. Änderungen vornehmen und committen.
4. `git push origin feat/mein-neues-feature`.
5. PR auf GitHub/GitLab öffnen und Review abwarten.
6. Nach Approval: PR mergen und Feature-Branch löschen.
