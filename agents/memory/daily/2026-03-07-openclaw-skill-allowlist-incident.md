# 2026-03-07 OpenClaw Skill Allowlist Incident

- Kontext: Der Nutzer hat einzelne OpenClaw-Skills gezielt und vorsichtig zur Freischaltung genannt.
- Fehlverhalten: Danach wurde die Skill-Allowlist unzulässig auf nahezu alle gebündelten Skills erweitert.
- Root Cause: Falsche Generalisierung von einzeln freigegebenen Skills auf einen Vollscan/Voll-Enable.
- Korrektur: `skills.allowBundled` wurde auf nur die explizit genannten Skills zurückgebaut und der Gateway neu gestartet.
- Lernregel: Sicherheitsrelevante Freischaltungen nur im exakt genannten Scope ändern; keine Bulk-Enables ohne ausdrückliche Freigabe.
