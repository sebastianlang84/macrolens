# CHANGELOG.md

All notable user- or operator-relevant changes to this repository will be documented in this file.

The format is based on Keep a Changelog.

## [Unreleased]

### Added
- Dokumentations-Governance mit `docs/policies/policy_docs_contract.md`, `docs/README.md`, `docs/runbooks/` und `docs/plans/` eingefuehrt.
- `CHANGELOG.md` als kuratierte Aenderungshistorie fuer nutzer-/operatorrelevante Repo-Aenderungen hinzugefuegt.
- `docs/runbooks/web-first-checks.md` als explizites First-Checks-Runbook fuer Web-/Ops-Themen hinzugefuegt.
- Dashboard-Pipeline-Tests hinzugefuegt, die Provider-Dispatch sowie Warning-/Signal-Assembly ueber eine Boundary absichern.
- Boundary-Tests fuer neutrale Grenzfaelle der Makro-Signalregeln hinzugefuegt, damit deklarative Schwellenwerte gegen Verhaltensdrift abgesichert bleiben.
- Dashboard-Pipeline-Tests fuer strukturierte Provider-Diagnostik, Slow-Fetch-Erkennung und No-Data-Boundaries hinzugefuegt.

### Fixed
- Workbench-Layout auf kleinen Viewports entkoppelt: das Dashboard erzwingt kein globales `100dvh`-One-Screen-Layout mehr, Slot-Konfiguration und Charts stapeln sich mobil/tabletfaehig und der manuelle Chart-Splitter ist auf Desktop begrenzt.
- Workbench-A11y fuer Slot-Steuerung und Hover-Readout verbessert: Y-Checkboxen und `L`-Buttons haben eindeutige zugaengliche Namen, und der visuelle Chart-Readout spammt Screenreader nicht mehr ueber `aria-live`.
- Desktop-Chart-Splitter bewegt die sichtbare Trennlinie wieder konsistent: der Workbench-Container hat auf `lg` nun wieder eine definite Hoehe, sodass die `fr`-Grid-Zeilen des oberen/unteren Charts tatsaechlich auf Drag-Aenderungen reagieren statt nur den Prozentwert zu aktualisieren.
- Workbench-Y-Achsen runden vierstellige Kursbereiche nicht mehr auf identische `7k`-Ticks zusammen; S&P-500-nahe Werte wie `6.9k`, `7.0k`, `7.1k` bleiben auf der auto-skalierten Achse unterscheidbar.
- Workbench-RSI-/RSI-Score-Charts nutzen wieder die fachlich uebliche feste `0..100`-Skala; `30` und `70` sind als visuelle Leitlinien fuer ueberverkauft/ueberkauft markiert, wenn das sichtbare Panel ausschliesslich aus RSI-/RSI-Score-Reihen besteht.
- Workbench kennzeichnet den `RSI Score` jetzt explizit als um `50` zentrierten Divergenz-Score; im Chart-Hinweis wird klargestellt, dass `30/70` nur fuer den klassischen `RSI 14` gelten.

### Changed
- `AGENTS.md` verweist auf Root-Dokumente jetzt nur noch ueber eine eigene `Key Files`-Sektion ohne Lesebefehl; welche Dateien tatsaechlich gelesen werden muessen, ergibt sich taskbezogen aus Diagnose und Verifikation.
- Dashboard-Datenfluss hinter `apps/web/src/lib/dashboard-pipeline.ts` als explizite Boundary gekapselt; `dashboard-data.ts` ist nur noch der schmale Einstieg.
- Dashboard-Pipeline weiter vertieft: Provider-Zusammenfassungen, Slow-Fetch-Erkennung und Missing-FRED-Diagnostik laufen nun ueber einen optionalen, testbaren Diagnostik-Hook statt nur ueber direkte `console`-Sideeffects.
- Makro-Signal-Ableitung in ein eigenes Regelmodul `apps/web/src/lib/macro-signal-rules.ts` geschnitten, sodass die Signalreihenfolge ueber eine explizite Registry statt ueber verteilte Aufrufe laeuft.
- Makro-Signal-Regeln weiter vertieft: Schwellenwerte, Inputs und Standardtexte laufen nun ueber gemeinsame deklarative Rule-Definitionen statt ueber einzelne Regel-Funktionen.
- Root-Dokumente (`AGENTS.md`, `README.md`, `INDEX.md`, `MEMORY.md`, `TODO.md`) auf klarere Abgrenzung zwischen Setup, stabilem Zustand, aktiver Arbeit, Historie und Policy ausgerichtet.
- `TODO.md` auf aktive offene Arbeit reduziert; erledigte Historie wurde daraus entfernt.
- `AGENTS.md` auf eine staerker normative Struktur mit Role/Rules/Key Files/Gates reduziert und von prozeduralen Ops-Details entlastet.
- `AGENTS.md` weiter auf ihren eigentlichen Zweck verengt: keine eigene Dokument-Routing-Erklaerung mehr, sondern nur noch Verweis auf die kanonische Docs-Policy.
- `AGENTS.md` weiter geschaerft: freistehende Zielzeile entfernt, Normsprache (`MUST`/`MUST NOT`) eingefuehrt, Git-Regeln auf `docs/git-workflow.md` verwiesen und die Sicherheitsverbote in eine kompakte Deny-List zusammengezogen.
- `AGENTS.md` nochmals minimalisiert: schwach zusaetzliche Stil-/Guardrail-Sektionen entfernt, verbleibende Ops- und Scope-Regeln noch enger an Gates und Deny-List angebunden.
- `AGENTS.md` ergaenzt, dass der sinnvolle Einsatz von Subagents in diesem Projekt ausdruecklich gewuenscht ist.
