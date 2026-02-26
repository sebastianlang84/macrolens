```md
# Audit-Checkliste — React + TypeScript + Next.js (Enterprise)

> Ziel: State of the art, sicher, wartbar, performant, betrieblich robust.

## 1) Repo/Projekt-Setup (Grundhygiene)
- [ ] README/Runbook: Setup, lokale Dev, ENV, Deploy, Rollback, Troubleshooting
- [ ] Klare Ordnerstruktur (app/pages, components, lib, server, tests)
- [ ] Monorepo (falls vorhanden): Boundary-Regeln, Package-Ownership, Build-Caching
- [ ] ESLint + Prettier + EditorConfig konsistent (CI enforcing)
- [ ] Pre-commit Hooks (lint-staged), Commit-Message-Konvention (optional)
- [ ] Node/PNPM/NPM/Yarn Versionen gepinnt (z. B. .nvmrc / volta)

## 2) Next.js Architektur & Rendering-Strategie
- [ ] App Router vs Pages Router bewusst gewählt und dokumentiert
- [ ] Server/Client Components sauber getrennt (Client nur wo nötig)
- [ ] Data Fetching konsistent (Server Actions / Route Handlers / API Routes)
- [ ] Caching/Invalidation bewusst (ISR/revalidate/fetch cache) — keine „zufälligen“ Stales
- [ ] Edge vs Node Runtime bewusst, dokumentierte Constraints
- [ ] Routing/Layouts/Loading/Error Boundaries konsistent und getestet

## 3) TypeScript-Qualität
- [ ] tsconfig: `strict: true` (oder klar begründet warum nicht)
- [ ] Kein Wildwuchs an `any`; `unknown` + Narrowing Pattern etabliert
- [ ] Runtime-Validation für externe Inputs (z. B. Zod/Valibot) vorhanden
- [ ] DTOs/Domain-Types getrennt (keine DB-Types im UI)
- [ ] Import-Aliases konsistent, keine zirkulären Abhängigkeiten

## 4) React Code-Qualität (State, Effects, Patterns)
- [ ] Komponenten: Single Responsibility, keine „God Components“
- [ ] State-Management bewusst gewählt (React/Context/Zustand/Redux/etc.)
- [ ] Side Effects: `useEffect` korrekt (Deps, Cleanup), kein „Effect-Spaghetti“
- [ ] Forms: konsistente Lib/Patterns, Validation + Error UX standardisiert
- [ ] Keine unkontrollierte Prop-Drilling-Kaskaden

## 5) API-Integration & Datenlayer
- [ ] Einheitlicher HTTP-Client (Timeouts, Retries, Error Mapping)
- [ ] Query-Caching/Invalidation sauber (z. B. TanStack Query), keine Race Conditions
- [ ] Pagination/Filtering/Sorting serverseitig wo nötig
- [ ] Date/Time/Timezone Handling korrekt und getestet
- [ ] Upload/Download: Limits, Content-Type, Streaming; Malware-Scan falls relevant

## 6) Security (Web + Next.js spezifisch)
- [ ] AuthN/AuthZ klar: Session/JWT, Refresh, Rotation, Logout semantics
- [ ] RBAC/ABAC serverseitig enforced (nicht nur UI)
- [ ] CSRF Schutz bei Cookies/Sessions, SameSite korrekt
- [ ] XSS Schutz: kein `dangerouslySetInnerHTML` ohne Sanitization
- [ ] CSP + Security Headers (HSTS, frame-ancestors, etc.)
- [ ] Secrets: niemals im Frontend/Repo; `NEXT_PUBLIC_*` streng geprüft
- [ ] SSRF Schutz bei serverseitigen Fetches (Allowlist/URL parsing)
- [ ] Dependency Security: Lockfile, Pinning, Renovate/Bot-Regeln, SCA

## 7) Performance & Effizienz
- [ ] Bundle-Analyse (z. B. analyzer) + Maßnahmen dokumentiert
- [ ] Code Splitting/Dynamic Imports gezielt
- [ ] Images via `next/image` (sizes, lazy), moderne Formate
- [ ] Fonts korrekt (self-host/preload), keine Layout Shifts (CLS)
- [ ] Client Rendering minimiert, Memoization sinnvoll (nicht blind)
- [ ] Web Vitals (LCP/INP/CLS) gemessen + Regression-Checks

## 8) Testing-Strategie
- [ ] Unit/Component Tests (Testing Library) für kritische Logik
- [ ] E2E Tests (Playwright/Cypress) für Kern-User-Flows
- [ ] Contract Tests für APIs (falls getrennte Teams/Services)
- [ ] Flaky Tests im Blick (Retries, Stabilisierung, Testdaten)
- [ ] Coverage als Signal: kritische Pfade priorisiert

## 9) CI/CD & DevOps
- [ ] CI Pipeline: build → typecheck → lint → tests → security scans
- [ ] SAST/DAST je nach Risikoprofil
- [ ] Reproducible Builds, Artefakt-Versionierung; SBOM falls gefordert
- [ ] Deploy Strategie (Blue/Green/Rolling) + Rollback geübt
- [ ] Container Hardening (minimal base, non-root) + vuln scanning
- [ ] Environments sauber getrennt; Feature Flags statt `if (prod)`

## 10) Observability & Betrieb
- [ ] Strukturierte Logs, keine PII in Logs
- [ ] Monitoring: Latency, Error Rate, Throughput; Alerts + SLOs
- [ ] Tracing (OpenTelemetry) für Request-Ketten
- [ ] Rate Limiting/WAF/CDN Regeln (je nach Setup)
- [ ] Incident Runbooks + klare Ownership/On-call

## 11) UX, Accessibility, Compliance
- [ ] A11y: Keyboard, Fokus, ARIA, Kontraste, Screenreader
- [ ] Konsistente Empty/Loading/Error States + Retry UX
- [ ] GDPR/Privacy: Consent, Tracking, Retention, Auskunft/Löschung Prozesse
- [ ] Drittanbieter-Risiken dokumentiert (DPAs, Datenflüsse)

## Schnelle Red Flags
- [ ] `strict` aus + viele `any`
- [ ] Auth nur im Frontend, serverseitig nicht enforced
- [ ] Secrets in Repo oder `NEXT_PUBLIC_*` missbraucht
- [ ] Keine Security Headers/CSP, keine Dependency Scans
- [ ] Überall Client Components, riesige Bundles ohne Analyse
- [ ] Kein CI Gate für typecheck/lint/tests

```

