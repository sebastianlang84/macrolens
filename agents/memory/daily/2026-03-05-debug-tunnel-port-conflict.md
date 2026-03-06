# 2026-03-05 Windows-Debug-Tunnel scheitert durch Portkonflikt

## Symptom
- Windows-Batch `scripts/start-macrolens-debug-tunnel.bat` fragte nach dem SSH-Passwort und brach danach direkt ab:
  - `client_loop: send disconnect: Connection reset`
- Der Tunnel blieb nicht offen.

## Messung
- Linux-Host-IP im Repo-Kontext: `192.168.0.188`.
- `sshd` aktiv auf Port `22`.
- MacroLens aktiv auf `127.0.0.1:3001`.
- Portpruefung auf dem Linux-Host:
  - `127.0.0.1:9444` war bereits belegt.
  - `127.0.0.1:9445` war frei.
- Skript und MCP-Konfiguration nutzten beide noch `9444` als Remote-DevTools-Port.

## Root Cause
- Der Reverse-Tunnel aus dem Windows-Skript wollte `-R 127.0.0.1:9444:127.0.0.1:9333` aufbauen.
- Weil `9444` lokal auf dem Linux-Host bereits belegt war, konnte der Remote-Forward nicht stabil hochkommen.

## Fix
- `scripts/start-macrolens-debug-tunnel.bat` auf `REMOTE_DEVTOOLS_PORT=9445` umgestellt.
- `config/mcporter.json` auf `http://127.0.0.1:9445` umgestellt.

## Verifikation
- `rg` zeigt beide Dateien jetzt konsistent auf `9445`.
- Porttest bestaetigt:
  - `9444 busy`
  - `9445 free`
- Vollstaendiger Windows-SSH-Login wurde in dieser Session nicht erneut durchgespielt, weil das SSH-Passwort hier nicht verfuegbar ist.
