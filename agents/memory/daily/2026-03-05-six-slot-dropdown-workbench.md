# 2026-03-05 - Sechs Slot-Dropdowns fuer Overlay und Indikatoren

## Anlass
- Die linke Workbench-Steuerung sollte von Main/Compare-Auswahl auf sechs feste Dropdown-Paare umgestellt werden.
- Pro Zeile sollte links die Reihe fuer den oberen Chart und rechts der zugehoerige Indikator fuer den unteren Chart gewaehlt werden koennen.

## Umsetzung
- `apps/web/src/components/series-workbench.tsx` auf sechs feste `SelectionSlot`s umgestellt.
- Jeder Slot hat:
  - links ein Dropdown fuer die obere Overlay-Reihe
  - rechts ein Dropdown fuer den zugehoerigen Indikator
- Die Beschriftungen `Slot 1` bis `Slot 6` wurden wieder entfernt; stattdessen gibt es nur noch einmalig die Spaltenkoepfe `Chart` und `Indicator`.
- Linke Dropdowns bieten aktuell alle verfuegbaren Reihen mit `optgroup`-Trennung zwischen `Assets` und `Makro`.
- Rechte Dropdowns bieten aktuell die RSI-Sweep-Ableitungen der links gewaehlten Reihe; der untere Chart plottet weiterhin nur Indikatoren.
- Doppelte Reihen/Indikatoren werden vor dem Plotten im jeweiligen Chart per Key dedupliziert.
- Die Korrelationskarten wurden auf generische Overlay-Korrelationen der im oberen Chart selektierten Reihen umgestellt.
- Das fruehere globale Top-Menue wurde entfernt.
- Die Y-Achsen-Entkopplung ist jetzt nicht mehr global pro Chart, sondern pro Zeile:
  - links je Dropdown eine eigene Checkbox fuer die obere Reihe
  - rechts je Dropdown eine eigene Checkbox fuer den zugehoerigen Indikator
- Im Chart koennen damit jetzt gemischte Modi gleichzeitig laufen: einige Reihen teilen sich die `shared`-Achse, andere bekommen eine eigene unsichtbare Skala.
- Der `L`-Schalter sitzt jetzt ebenfalls pro Dropdown-Zeile, nicht mehr pro Chart.
- Eine Reihe mit aktivem `L` bekommt automatisch eine eigene Y-Achse, damit lineare und logarithmische Skalen gleichzeitig im selben Panel funktionieren koennen.
- Log wird nur angeboten, wenn die jeweilige Reihe strikt positive Werte hat; ungueltige Log-Faelle bleiben linear.
- Oberer und unterer Chart sind jetzt per gemeinsamem Recharts-Sync ueber das `date`-Feld gekoppelt, damit Hover, Tooltip und vertikaler Marker in beiden Panels gleichzeitig laufen.
- Die X-Achse beider Charts nutzt jetzt dieselbe gemeinsame Zeitdomäne ueber `dateTs`; dadurch bleibt die Zeitdistanz in beiden Panels gleich und fruehe fehlende Indikator-Daten erscheinen als Leerraum.
- `buildRsiSweepSeries` liefert jetzt zusaetzlich einen echten `RSI 14W` aus resampleten Wochen-Schlusskursen.
- Dasselbe Asset kann fuer mehrere Zeilen erneut ausgewaehlt werden; dadurch sind z. B. `RSI 14 (S&P 500)` und `RSI 14W (S&P 500)` parallel im unteren Chart moeglich, waehrend der obere Chart die Asset-Reihe weiterhin dedupliziert.
- Fuer `RSI 14` und `RSI 14W` werden bullische/baerische Divergenzen im unteren Chart jetzt ohne stoerende Dauerlabels angezeigt: statt Text im Plot werden ruhige gestrichelte Segmente zwischen den Pivot-Paaren plus Endpunktmarker auf dem RSI gerendert.
- Beide Charts haben jetzt einen gemeinsamen X-Zeitfenster-Schalter (`3M`, `6M`, `1Y`, `2Y`, `Max`). Das Fenster gilt synchron fuer oben und unten, wird in `localStorage` gespeichert und sorgt zusammen mit gefilterten sichtbaren Rows dafuer, dass die Y-Achsen immer nur auf dem aktuell sichtbaren Bereich autoskalieren.
- Der Hover-Readout sitzt jetzt fest rechts unten unter der X-Achse statt als schwebender Tooltip ueber dem Plot. Der Marker im Chart bleibt erhalten, aber Datum und Serienwerte verdecken die Linie nicht mehr.
- Nach dem ersten Umbau trat clientseitig `Minified React error #185` auf, obwohl `docker compose ps` healthy und `curl -I http://127.0.0.1:3001` weiter `200 OK` lief. Root Cause war ein State-Update aus einer `Tooltip`-Content-Bridge. Der Footer-Readout wird deshalb jetzt direkt aus `LineChart onMouseMove/onMouseLeave` befuellt; der eigentliche `Tooltip` rendert nur noch den Cursor fuer den Sync-Marker.
- Wenn `L` eine eigene Y-Achse erzwingt, zeigt die zugehoerige Y-Checkbox diesen Zustand jetzt sichtbar an und ist waehrenddessen gesperrt.
- Rechte Dropdowns koennen jetzt stabil auf `Kein Indikator` stehen; die Auswahl eines linken Werts erzwingt keinen unteren Indikator mehr.
- Der Default beim ersten Laden wurde auf einen minimalistischen Startzustand umgestellt: nur einmal `S&P 500` links, rechts kein Indikator, alle weiteren Zeilen leer.

## Verifikation
- `npm run lint` in `apps/web`: gruen.
- `npm test` in `apps/web`: 13/13 Tests gruen.
- `npm run build` in `apps/web`: gruen.
- `docker compose up -d --build web`: erfolgreich.
- `docker compose ps`: `web` healthy.
- `curl -I http://127.0.0.1:3001`: `HTTP/1.1 200 OK`.
- Gerendertes HTML enthaelt `Chart`, `Indicator`, `Y`, `L`, `Keine Reihe`, `Kein Indikator`, `Oberer Chart`, `Unterer Chart`.

## Hinweise
- Obwohl der User von Assets gesprochen hat, akzeptieren die linken Dropdowns vorerst bewusst auch Makro-Reihen wie `Arbeitslosenquote`, weil das explizit als Beispiel genannt wurde.
- Der aktuelle Stand bleibt fachlich asymmetrisch: oben Rohreihen, unten nur Indikatoren. Ob die Zuordnung spaeter erweitert oder vereinheitlicht wird, ist noch offen.
