# Evaluation: Datenbank & Caching Strategie für MacroLens

## Aktueller Stand (MVP)
- **Status:** Kein persistenter Storage.
- **Workflow:** UI-Request -> Server Component -> Fetch von FRED/Yahoo -> Compute -> Render.
- **Caching:** `no-store` (FRED) bzw. Standard-Server-Caching von Next.js (Yahoo via Package).
- **Vorteile:** Keine DB-Migrationen, keine Cache-Invalidierungsprobleme, maximale Transparenz des Datenflusses.
- **Nachteile:** Langsame UI bei vielen Serien, Rate-Limit-Risiko bei Providern, keine Historisierung von abgeleiteten Signalen.

## Zielsetzung
1. **Performance:** Schnellere Page-Loads durch lokale Kopien der Daten.
2. **Robustheit:** Dashboard funktioniert auch bei kurzzeitigen API-Ausfällen.
3. **Historisierung:** Abgeleitete Werte (RSI Consensus, Divergenzen) über Zeit speichern, um Trends in der Historie zu analysieren (aktuell nur im X-Fenster der Rohdaten berechnet).

## Technologie-Optionen

### 1. SQLite + Drizzle (Leichtgewicht)
- **Vorteil:** Keine externe Infrastruktur nötig, Datei im Repo oder Docker-Volume. Sehr schnell.
- **Einsatz:** Ideal für einen Lern-MVP, der auf einem einzelnen Linux-Host läuft.
- **Nachteil:** Nicht horizontal skalierbar (hier egal).

### 2. PostgreSQL + Prisma (Standard Enterprise)
- **Vorteil:** Robuste Typisierung, mächtiges Ökosystem, bereit für Cloud-Deployment.
- **Einsatz:** Wenn das Projekt wächst und mehrere Nutzer/Instanzen geplant sind.
- **Zusatz:** TimescaleDB-Erweiterung für Zeitreihen-Optimierung (Hyper-Tables).

### 3. Redis (Reiner Cache)
- **Vorteil:** Extrem schnell für Key-Value (z. B. fertige Dashboard-JSONs).
- **Nachteil:** Keine einfache Abfrage über SQL für Analysen.

## Empfehlung: PostgreSQL + Prisma + Docker

Da bereits eine `docker-compose.yml` existiert, ist das Hinzufügen einer `postgres`-Instanz der logische nächste Schritt.

### Architektur-Vorschlag
1. **Cron-Job / Background Task:** Lädt einmal täglich (oder stündlich) die Daten der `SERIES_CATALOG` in die DB.
2. **API Route:** Liest primär aus der DB.
3. **Cache-Layer:** Nutzt Next.js `unstable_cache` um DB-Queries für das Dashboard zu puffern.

### Datenmodell (Skizze)
- `Series`: Metadaten (key, label, source).
- `DataPoint`: (series_id, date, value).
- `DerivedSignal`: (type, asset_id, date, metadata_json).

## Nächste Schritte
1. `docker-compose.yml` um `postgres` erweitern.
2. `prisma` in `apps/web` initialisieren.
3. Script zum initialen "Backfill" der Historie schreiben.
