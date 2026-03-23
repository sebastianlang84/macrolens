# 2026-03-21 Ultracite Cleanup

## Anlass
- Nutzerwunsch: bestehende `Ultracite`-Findings in `apps/web` bereinigen.

## Befund
- `npm run check` meldete initial zahlreiche Stil-/Format- und Konsistenzfehler, plus einige nicht automatisch fixbare Themen (`noNestedTernary`, `noArrayIndexKey`, `noExcessiveCognitiveComplexity`, A11y-Rolle am Chart-Splitter).

## Umsetzung
- `npm run fix` ausgefuehrt und verbleibende Regeln manuell bereinigt.
- `check_rsi.ts` zu `check-rsi.ts` umbenannt.
- Typdefinitionen auf die repo-weite `interface`-Konvention gezogen.
- `SeriesWorkbench` in kleinere Hilfsfunktionen/Teilkomponenten zerlegt, um verschachtelte Ternaries und Komplexitaet zu senken.
- Provider-Fehlerpfade und Makro-Ableitungen von verschachtelten Ternaries auf explizite Branches umgestellt.
- `loading.tsx` auf stabile Skeleton-Keys umgestellt.
- Split-Handle semantisch von `div[role=\"separator\"]` auf `button` umgestellt.

## Verifikation
- `npm run check` gruen.
- `npm run lint` gruen.
- `npm run build` gruen.
- Build zeigt weiterhin nur den bekannten Next.js-Hinweis wegen zweier `package-lock.json`-Dateien.
