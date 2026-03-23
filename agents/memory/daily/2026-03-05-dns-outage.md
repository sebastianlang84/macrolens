# 2026-03-05 DNS outage im `web`-Container

## Symptom
- Web-UI unter `http://127.0.0.1:3001` war erreichbar, zeigte aber keine Marktdaten.
- `curl http://127.0.0.1:3001/api/dashboard` lieferte fuer alle Serien leere `points` und `error: "fetch failed"`.

## Messung
- `docker compose ps`: `web` war `Up ... (healthy)`.
- `curl -I http://127.0.0.1:3001`: `HTTP/1.1 200 OK`.
- Laufzeitcheck im Container:
  - `fetch('https://api.stlouisfed.org/...')` schlug mit `getaddrinfo EAI_AGAIN api.stlouisfed.org` fehl.
  - `yahoo-finance2` schlug mit `getaddrinfo EAI_AGAIN query2.finance.yahoo.com` fehl.
- `docker exec macrolens-web cat /etc/resolv.conf` zeigte:
  - `ExtServers: [host(100.100.100.100)]`

## Root Cause
- Docker uebernahm fuer den internen Resolver einen unpassenden externen DNS-Upstream (`100.100.100.100`).
- Dadurch scheiterte die Namensaufloesung im Container, obwohl die Next.js-App selbst healthy blieb.

## Fix
- In `docker-compose.yml` fuer Service `web` explizite DNS-Server gesetzt:
  - `1.1.1.1`
  - `8.8.8.8`
- Danach `docker compose up -d web` ausgefuehrt.

## Verifikation
- `docker exec macrolens-web cat /etc/resolv.conf` zeigt jetzt:
  - `ExtServers: [1.1.1.1 8.8.8.8]`
- `docker exec macrolens-web getent hosts api.stlouisfed.org query2.finance.yahoo.com` erfolgreich.
- `curl http://127.0.0.1:3001/api/dashboard` liefert wieder befuellte Serien und Signale.
- `npm run lint` erfolgreich.
- `npm run build` erfolgreich.
