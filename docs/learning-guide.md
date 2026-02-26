# Learning Guide (Grundlagen)

## 1) Was ist hier gebaut?

Eine Web-App, die Daten von externen APIs lädt, auf dem Server verarbeitet und im Browser als Charts darstellt.

Datenfluss (vereinfacht):
1. Browser ruft Seite auf.
2. Next.js rendert `apps/web/src/app/page.tsx` auf dem Server.
3. Server lädt Daten von FRED/Yahoo.
4. Daten werden in ein gemeinsames Format gebracht (Normalisierung).
5. React rendert UI-Komponenten; Recharts zeichnet Liniencharts.

## 2) Wichtige Begriffe (kurz)

- `API`: Schnittstelle, über die ein Dienst Daten bereitstellt.
- `JSON`: Standardformat für strukturierte Daten (`{}` / `[]`).
- `HTTP request`: Anfrage an einen Server (z. B. `GET`).
- `Server-side`: Code läuft auf dem Server, nicht im Browser.
- `Client-side`: Code läuft im Browser des Nutzers.
- `Component`: Wiederverwendbarer UI-Baustein in React.
- `Props`: Eingabedaten für eine Komponente.
- `State`: Veränderliche Daten in einer Komponente (hier kaum nötig).
- `Route Handler`: Eigene API-Endpunkte in Next.js (`/api/...`).

## 3) React: Die Grundidee

React baut UI aus Komponenten.

Beispiel mental:
- `DashboardClient` ist eine große Komponente (Seitenlayout).
- `SeriesChart` ist eine kleinere Komponente (eine Chart-Karte).
- Die Seite entsteht durch Komposition vieler kleiner Teile.

Wichtig:
- Daten fließen normalerweise von oben nach unten.
- Komponenten sollen klar abgegrenzte Aufgaben haben.
- UI ist eine Funktion aus Daten.

## 4) Next.js: Was macht es zusätzlich zu React?

Next.js ist ein Framework um React herum und liefert:
- Routing (welche URL zeigt welche Seite)
- Server Components (Daten sicher auf dem Server laden)
- API Routes / Route Handlers
- Build/Deployment-Tooling

In diesem Projekt:
- `apps/web/src/app/page.tsx` ist eine Server Component.
- `apps/web/src/components/series-chart.tsx` ist eine Client Component (`"use client"`), weil Chart-Libraries im Browser laufen.

## 5) Warum Server Components hier wichtig sind

Dein FRED API Key soll nicht im Browser landen.

Deshalb:
- FRED/Yahoo-Fetching passiert in `apps/web/src/lib/providers/*` auf dem Server.
- Der Browser bekommt nur bereits verarbeitete Daten.

## 6) Datenbanken (einfach erklärt)

Eine Datenbank ist ein strukturierter Speicher für Daten.

Warum man sie braucht:
- Caching (schneller laden, weniger API-Calls)
- Eigene Berechnungen speichern (z. B. tägliche Signale)
- Benutzerkonten / Watchlists
- Historie unabhängig von Datenprovider-Ausfällen

Typen:
- `SQL` (z. B. PostgreSQL): Tabellen, Beziehungen, starke Struktur
- `NoSQL` (z. B. MongoDB): flexiblere Dokumente
- Zeitreihen-Datenbanken (oder Erweiterungen wie TimescaleDB): optimiert für Zeitstempel + Messwerte

Für dein Projekt wäre ein typischer Einstieg:
- PostgreSQL + Prisma (ORM)
- Optional später TimescaleDB

## 7) Webdesign-Grundlagen (praktisch)

Was eine UI schnell "gut" macht:
- klare Hierarchie (Titel -> Erklärung -> Inhalt)
- konsistente Abstände
- wenige, gezielte Farben
- wiederkehrende Karten-/Typografie-Muster
- gute Lesbarkeit auf Mobile und Desktop

In diesem Projekt sichtbar:
- Hero-Block mit klarer Einordnung
- Signal-Karten für Zusammenfassung
- Chart-Karten für Details
- Lern-Sektion für Orientierung

## 8) Nächste Lernschritte (empfohlen)

1. Lies `apps/web/src/app/page.tsx` und `apps/web/src/lib/dashboard-data.ts`.
2. Verfolge dann eine Datenquelle (`apps/web/src/lib/providers/fred.ts`).
3. Schau dir eine UI-Komponente an (`apps/web/src/components/series-chart.tsx`).
4. Ergänze eine neue Serie (z. B. `DGS10` oder `CPIAUCSL`).
5. Schreibe eine neue Ableitung in `apps/web/src/lib/macro-derivations.ts`.
