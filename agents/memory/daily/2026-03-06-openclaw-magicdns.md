# 2026-03-06 - OpenClaw antwortet nicht wegen deaktiviertem Tailscale-DNS

## Symptom
- `curl -I https://openclaw.tail027324.ts.net` schlug am 2026-03-06 zunaechst mit `Could not resolve host` fehl.

## First Checks
- `docker compose ps` im MacroLens-Repo: `macrolens-web` war gesund (`Up ... healthy`), also kein MacroLens-HTTP-Ausfall.
- `curl -I http://127.0.0.1:3001`: `HTTP/1.1 200 OK`.
- `tailscale status --json`: Tailnet lief, meldete aber DNS-Gesundheitswarnung.
- `tailscale serve status`: lokaler OpenClaw-Serve zeigte einen Proxy auf `http://127.0.0.1:18789`.
- `curl -I http://127.0.0.1:18789`: `HTTP/1.1 200 OK`.

## Root Cause
- Auf dem Host war Tailscale mit deaktiviertem CorpDNS/MagicDNS konfiguriert (`tailscale debug prefs` zeigte `CorpDNS: false`).
- Dadurch wurden `*.tail027324.ts.net` lokal nicht ueber MagicDNS aufgeloest, obwohl die OpenClaw-Dienste selbst liefen.

## Fix
- `tailscale set --accept-dns=true`

## Verification
- `tailscale debug prefs`: danach `CorpDNS: true`.
- `getent hosts openclaw.tail027324.ts.net`: aufloesbar zu `100.92.217.62`.
- `curl -I https://openclaw.tail027324.ts.net`: `HTTP/2 200`.
