# MEMORY.md

## Current State
- Repository enthält eine Next.js-App unter `apps/web` (`App Router`, `TypeScript`, `Tailwind v4`).
- MVP-Dashboard lädt Markt-/Makrodaten aus Yahoo Finance und FRED (FRED nur mit `FRED_API_KEY`).
- Charts werden mit `Recharts` gerendert.
- Route Handler verfügbar unter `apps/web/src/app/api/dashboard/route.ts`.
- P0-Basis abgesichert: Runtime-Validierung (`zod`) in Providern, `vitest`-Tests für Stats/Ableitungen, App Router `error.tsx` + `loading.tsx`.
- Node-Version gepinnt via `apps/web/.nvmrc` und Minimal-CI (`.github/workflows/ci.yml`) für `lint`/`test`/`build` hinzugefügt.
- README erweitert um Mermaid-Architekturdiagramm, MVP-Caching-Strategie und Rate-Limit-/Abuse-Schutz-Plan.
- P2-Ausbau erweitert: zusätzliche FRED-Serien (`CPI`, `UNRATE`, `UST 2Y/10Y`, `IG OAS`, `HY OAS`) und neue Signale (Yield Curve, Inflation, Arbeitslosenquote, Credit-Regime) integriert.
- Dashboard-Workbench nutzt jetzt sechs feste Auswahl-Zeilen ohne Slot-Label. Oberhalb der beiden Dropdown-Spalten stehen einmalig `Chart` und `Indicator`. Jede einzelne Zeile hat rechts neben dem linken bzw. rechten Dropdown einen eigenen Y-Schalter; damit kann jede Reihe separat zwischen gemeinsamer und entkoppelter Y-Achse laufen. Das fruehere globale Top-Menue fuer Skalierung/Y-Achsen ist entfernt. Die Hoehenaufteilung zwischen oberem und unterem Chart bleibt direkt im UI verstellbar und wird per `localStorage` (`macrolens:workbench-chart-split`) persistiert. Die Recharts-Panels initialisieren erst nach dem ersten Client-Frame, damit das Split-Layout nicht mit Null-Dimensionen mountet.
- Der untere Chart nutzt jetzt einen RSI-Sweep ueber log-spaced Lookbacks (`5, 7, 10, 14, 20, 30, 45, 70, 100, 150, 200, 300`) und leitet daraus `RSI 14`, `RSI Consensus`, `RSI Breadth > 50`, `RSI Overheat > 70`, `RSI Dispersion` und `RSI Short-Long` fuer das Main Asset ab. Das Panel rendert bewusst immer in `raw` mit getrennten Y-Achsen, damit Oszillatoren und Sweep-Metriken nicht durch Asset-Skalierung verzerrt werden.
- Der Indikatorpfad enthaelt jetzt zusaetzlich einen echten `RSI 14W`, berechnet aus resampleten Wochen-Schlusskursen statt aus Daily-Proxys. Dasselbe Asset kann ueber mehrere Zeilen mehrfach als Basisreihe gewaehlt werden, sodass z. B. `RSI 14` und `RSI 14W` gleichzeitig im unteren Chart liegen, waehrend der obere Asset-Chart die Basisreihe nur einmal zeigt.
- Die Achsenlogik ist jetzt ebenfalls pro Zeile steuerbar: Neben jedem linken und rechten Dropdown gibt es einen eigenen `L`-Schalter. Eine Reihe mit aktivem `L` laeuft automatisch auf eigener Y-Achse; lineare Reihen koennen weiter gemeinsam oder separat laufen. Log wird nur angeboten, wenn die jeweilige Reihe strikt positive Werte hat.
- Oberer und unterer Chart teilen sich jetzt denselben Hover-/Tooltip-Sync ueber das Datum. Der vertikale Marker laeuft dadurch in beiden Panels gleichzeitig mit, auch wenn oben Assets und unten Indikatoren geplottet werden.
- Beide Charts teilen sich jetzt auch dieselbe X-Zeitdomäne. Dadurch bleibt die zeitliche Distanz/Skalenlaenge identisch; wenn der untere Chart spaeter beginnt, erscheint links einfach Leerraum statt einer gestauchten Zeitachse.
- Fuer `RSI 14` und `RSI 14W` werden im unteren Chart jetzt ausserdem bullische und baerische Divergenzen direkt auf der RSI-Linie angezeigt, aber ohne permanente Textlabels im Plot. Stattdessen werden ruhige gestrichelte Divergenzsegmente plus Endpunktmarker gerendert.
- Beide Charts haben jetzt zusaetzlich einen gemeinsamen X-Zeitfenster-Schalter (`3M`, `6M`, `1Y`, `2Y`, `Max`), der per `localStorage` (`macrolens:workbench-x-range`) gespeichert wird. Die Y-Achsen skalieren dabei immer nur auf den jeweils sichtbaren Bereich.
- Der Hover-Readout liegt jetzt nicht mehr als Floating-Tooltip ueber dem Plot, sondern fest rechts unten unter der X-Achse im Panel-Footer. Der vertikale Marker bleibt synchron, aber der Text verdeckt die Linien nicht mehr.
- Korrektur 2026-03-06: Der erste Footer-Readout-Ansatz ueber eine `Tooltip`-Content-Bridge verursachte clientseitig einen React-Runtime-Fehler (`Minified React error #185`), obwohl HTTP und Container gesund waren. Der Hover-State wird deshalb jetzt direkt ueber `LineChart onMouseMove/onMouseLeave` gespeist; der Recharts-`Tooltip` rendert nur noch den Cursor.
- Die Y-Checkbox zeigt jetzt auch erzwungene Entkopplung durch `L` an und wird in diesem Fall gesperrt, damit der Zustand sichtbar konsistent bleibt. Rechts kann ausserdem bewusst `Kein Indikator` gesetzt bleiben; ein linker Slot erzwingt nicht mehr automatisch einen unteren Indikator.
- Default-Startzustand der Workbench: genau ein aktiver oberer Slot mit `S&P 500`, kein vorausgewaehlter Indikator und alle restlichen Slots leer.
- Docker-Basis ergänzt (`apps/web/Dockerfile`, `docker-compose.yml`) mit `restart: unless-stopped` für stabilen Linux-Betrieb.
- Korrektur 2026-03-05: `docker-compose.yml` setzt explizite DNS-Server (`1.1.1.1`, `8.8.8.8`), weil der Docker-Resolver zuvor auf `100.100.100.100` zeigte und Provider-Fetches im Container mit `getaddrinfo EAI_AGAIN` ausfielen.
- Korrektur 2026-03-05: Der Windows-Debug-Tunnel nutzt fuer den Reverse-DevTools-Port jetzt `9445` statt `9444`, weil `127.0.0.1:9444` auf dem Linux-Host bereits belegt war und der SSH-Reverse-Tunnel dadurch sofort scheiterte.
- Audit-Checklisten in `docs/audits/` wurden auf konsistentes Namensschema umgestellt; umsetzbare Findings sind in `TODO.md` priorisiert.
- Korrektur 2026-02-27: `openclaw/owui` Tailscale-Hosts sind Teil der separaten `ai_stack`-Dienste (OpenClaw/Open WebUI) und nicht der stabile Zugangsweg fuer MacroLens.
- Korrektur 2026-03-06: Wenn `openclaw.tail027324.ts.net` lokal nicht aufloest, zuerst `tailscale debug prefs` pruefen. Mit `CorpDNS: false` ist MagicDNS deaktiviert; `tailscale set --accept-dns=true` stellt die Namensaufloesung fuer die Tailnet-Hosts wieder her. Verifiziert mit `getent hosts` und `curl -I https://openclaw.tail027324.ts.net` = `HTTP/2 200`.
- Observability 2026-03-06: Performance-Logging in `lib/dashboard-data.ts` hinzugefuegt, um Fetch-Zeiten pro Serie und insgesamt zu tracken. Langsame API-Antworten (> 1s) werden jetzt explizit als Warnung im Server-Log ausgegeben.
- Accessibility 2026-03-06: Barrierefreiheit in `SeriesWorkbench` und `DashboardClient` verbessert. Sehr kleine Schriftarten (10px/11px) wurden auf mindestens `text-xs` (12px) erhoeht. Charts haben jetzt `role="img"` und `aria-label`, und der Hover-Readout nutzt `aria-live="polite"`, damit Screenreader die Werte bei Mausbewegung ansaegen koennen.

## Long-Term Memory
- FRED benötigt lokalen API-Key in `apps/web/.env.local`.
- S&P 500 Equal Weight wird aktuell über `RSP` (ETF) als Proxy modelliert.
- Ziel ist Lernen + Verständnis: Architektur und Begriffe sind Teil des Outputs, nicht nur UI.
- Nutzerpräferenz: Prinzipienverständnis vor Code; Erklärungen ohne Coding-Beispiele bevorzugt.

## Open Decisions
- Datenbank ja/nein (Caching/Historisierung) in späterem Schritt.
- Welche zusätzlichen Serien als Nächstes rein sollen (z. B. CPI, ISM, HY Spreads, DXY, 10Y Yield).
- Ob Nutzer später eigene Watchlists / Regime-Regeln konfigurieren können.

## Known Risks
- Yahoo-Datenquelle ist nicht offiziell stabil versioniert und kann sich ändern.
- Unterschiedliche Frequenzen (daily vs monthly) erschweren direkte Vergleiche.
- Einfache Heuristiken können in Sonderregimen irreführend sein.

## Next Steps
- `FRED_API_KEY` in `apps/web/.env.local` setzen und FRED-Serien prüfen.
- `TODO.md` P2 weiter abarbeiten (DB/Caching, Observability, A11y, Deployment-Doku).
- Optional: Caching/DB einführen (Postgres + Prisma).
- Weitere Makro-Ableitungen/Regeln iterativ verfeinern (Schwellenwerte, Regime-Definitionen).
