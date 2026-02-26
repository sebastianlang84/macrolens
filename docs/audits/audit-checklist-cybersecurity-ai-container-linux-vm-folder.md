```md
# Cybersecurity Audit Checkliste (Linux VM Ordner mit vielen AI-Tools in Docker/Containern)

> Ziel: Risiken im **Repo/Folder** (Compose/Configs/Volumes/Logs/Skripte) + **Runtime** (Docker/Host) finden.

## 0) Preflight (Scope & Beweissicherung)
- [ ] Welche Services laufen genau (docker compose ps / docker ps)?
- [ ] Welche Ports sind von außen erreichbar (ss -tulpn / firewall rules)?
- [ ] Welche Daten sind sensitiv (PII, API-Keys, Firmen-IP, Modelle, Logs)?
- [ ] Snapshot/Backup vor Änderungen (VM Snapshot + compose/configs sichern).

## 1) Ordner-/Repo-Hygiene (das, was du mir „zeigst“)
### 1.1 Dateien, Rechte, Ownership
- [ ] Keine World-writable Bereiche (find . -perm -0002 -type f -o -perm -0002 -type d)
- [ ] Keine unerwarteten SUID/SGID Dateien (find . -perm -4000 -o -perm -2000)
- [ ] Saubere Owner/Group (kein root:root für App-Config, wenn nicht nötig).
- [ ] Trennung: `prod/` vs `test/` vs `dev/` Konfig klar.

### 1.2 Secrets-Handling
- [ ] **Keine Secrets im Git** (API Keys, Tokens, Passwörter, private Keys, .env).
- [ ] `.env`/`*.env` geprüft: nur Referenzen, keine echten Secrets (oder mindestens chmod 600).
- [ ] Docker Secrets / mounted secret files statt env vars für kritische Secrets.
- [ ] Kein Klartext in Logs (Tokens in request logs / headers).
- [ ] Rotation/Revocation Plan vorhanden.

### 1.3 Compose / Stack Definition
- [ ] Compose Files: keine `privileged: true` ohne zwingenden Grund.
- [ ] Keine unnötigen `cap_add` (NET_ADMIN, SYS_ADMIN etc.).
- [ ] `read_only: true` wo möglich; `tmpfs` für /tmp.
- [ ] `user: "1000:1000"` (nicht root) wo möglich.
- [ ] `no-new-privileges: true` (security_opt).
- [ ] Ressourcenlimits (cpu/mem/pids) gesetzt.
- [ ] Healthchecks vorhanden.
- [ ] `restart:` Policy sinnvoll (nicht loop bei Crash).
- [ ] Volumes minimal, nur benötigte Pfade; keine Mounts von `/` oder Docker Socket.
- [ ] **Kein** `/var/run/docker.sock` Mount (oder streng begründet + isoliert).

### 1.4 Images / Supply Chain
- [ ] Images gepinnt (Digest oder konkrete Version, nicht `latest`).
- [ ] Herkunft klar (offizielle Registry/Publisher, Signaturen wenn möglich).
- [ ] SBOM/Scan (Trivy/Grype) für Images + Host Pakete.
- [ ] Update-Prozess: wie schnell werden CVEs gepatcht?
- [ ] Eigene Builds reproduzierbar (Dockerfile minimal, multi-stage, keine Secrets im Build).

### 1.5 Skripte / Automation
- [ ] Cronjobs/entrypoints geprüft: keine `curl | sh`, keine unsignierten Downloads.
- [ ] Idempotenz + Least Privilege.
- [ ] Keine Hardcoded Credentials.

## 2) Host Hardening (Linux VM)
- [ ] Patchlevel (Kernel + Docker + OpenSSL + libc) aktuell.
- [ ] SSH: Key-only, root-login off, MFA/jump host wenn möglich.
- [ ] Firewall: default deny inbound; nur notwendige Ports offen.
- [ ] Fail2ban / Rate limits für exposed Services.
- [ ] Zeit/NTP korrekt (Audit-Logs).
- [ ] Disk Encryption / sichere Storage (wenn laptop/portable oder Cloud).

## 3) Docker Runtime Security
- [ ] Docker daemon: nicht öffentlich erreichbar; TLS falls remote.
- [ ] Rootless Docker oder user namespaces (wenn möglich).
- [ ] seccomp/apparmor/selinux aktiv; keine `unconfined` Profile.
- [ ] Logging driver / Log rotation (kein Disk-Fill DoS).
- [ ] Netzwerk: getrennte Docker Networks; interne Services nicht published.
- [ ] Keine Container laufen im host network mode (außer zwingend).

## 4) Netzwerk- & Service-Exposure
- [ ] Exposed Ports inventarisieren (reverse proxy, webui, db, vector db, dashboards).
- [ ] TLS überall (auch intern, wenn möglich) + HSTS am Edge.
- [ ] Admin UIs nicht öffentlich (IP allowlist / VPN / Tailscale / SSO).
- [ ] Rate limiting + WAF/Reverse-Proxy Regeln (Basic Auth ist nicht genug).
- [ ] CORS/CSRF korrekt für Web-UIs.

## 5) Identity & Access (Users, AuthN/Z)
- [ ] Jeder Dienst: eigene Credentials, starke Passwörter, MFA wo möglich.
- [ ] SSO/OIDC für Web-UIs (z.B. Keycloak/Authentik) statt lokale Accounts.
- [ ] RBAC: Rollen trennen (Admin vs User vs Service account).
- [ ] API Keys minimal berechtigt (Scopes), getrennt pro Service.

## 6) Daten- & Privacy-Audit (AI-spezifisch)
- [ ] Welche Prompts/Docs/Transkripte werden gespeichert? Wo (Volumes/DB)?
- [ ] Retention/Deletion Policy (Logs, Chat-History, Uploads, Embeddings).
- [ ] PII/Secrets-Redaction vor Indexing (RAG).
- [ ] Model/Provider Routing: welche Requests gehen extern? (ZDR/No-Training/Region).
- [ ] Egress Kontrolle: nur erlaubte Domains/Ports (Firewall/Proxy).

## 7) RAG/Tools/Agentic Attack Surface (Prompt-Injection)
- [ ] Tool-Calling: allowlist der Tools, parameter validation, output escaping.
- [ ] Retrieval: Quellen-Trust (keine untrusted web pages direkt als Anweisung ausführen).
- [ ] „System Prompt“ / Policies versioniert, reviewbar, nicht im UI edit-only.
- [ ] Uploads/Attachments: AV-Scan + file type allowlist.
- [ ] SSRF Schutz bei fetcher tools (kein Zugriff auf metadata IPs / internal nets).

## 8) Datenbanken & Storage
- [ ] DB Ports nicht öffentlich; nur im internen Network.
- [ ] Auth aktiv (keine default creds), TLS wenn möglich.
- [ ] Backups verschlüsselt + Restore getestet.
- [ ] Migrations/Schema: least privilege DB user (keine superuser in Apps).

## 9) Observability & Detection
- [ ] Zentralisierte Logs (host + container) + Zugriffsschutz.
- [ ] Audit Logs für Auth/Config/Secrets Zugriff.
- [ ] Alerts: ungewöhnliche egress spikes, auth failures, container restarts.
- [ ] Integrity Monitoring für Compose/Configs (git + CI checks).

## 10) Incident Response (IR) & Recovery
- [ ] Runbook: Isolation (Netz weg), Credentials rotation, Forensic snapshot.
- [ ] Disaster Recovery: Wiederherstellungszeit (RTO) + Datenverlust (RPO) definiert.
- [ ] Key/Token Inventar + Notfall-Rotation.

## 11) Konkrete „Red Flags“ (sofort anschauen)
- [ ] Docker socket gemountet in einem Web-exposed Container.
- [ ] `privileged: true`, `cap_add: SYS_ADMIN`, `network_mode: host` ohne harten Grund.
- [ ] `.env` mit echten Keys im Repo; offene Leserechte.
- [ ] Ports von DB/VectorDB/Redis/MinIO direkt ins Internet published.
- [ ] Images `latest` + keine Scans + keine Update-Routine.
- [ ] UI ohne Auth oder nur Basic Auth ohne IP/VPN Einschränkung.
- [ ] Logs enthalten Authorization-Header, JWTs, API Keys.

## 12) Minimal-Commandset für einen schnellen Check
- [ ] `docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Ports}}\t{{.Status}}'`
- [ ] `docker inspect <container> | jq '.[0].HostConfig | {Privileged,CapAdd,SecurityOpt,NetworkMode,ReadonlyRootfs,Binds}'`
- [ ] `ss -tulpn`
- [ ] `ufw status` / `iptables -S` / `nft list ruleset`
- [ ] `find . -maxdepth 4 -type f \( -name "*.env" -o -name "*secret*" -o -name "id_rsa" \) -print`
- [ ] `trivy image <image>` (oder grype)

---

### Ergebnis-Template (für dein Audit-Protokoll)
- Assets/Services:
- Exposed Ports:
- Kritische Findings (P0):
- Hohe Findings (P1):
- Mittlere Findings (P2):
- Quick Wins (24h):
- Hardening Maßnahmen (1–2 Wochen):
- Langfristig (Architektur):
```

