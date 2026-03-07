# AGENTS.md

Project goal: Learning-oriented macro dashboard with `Next.js`, `TypeScript`, FRED/Yahoo data, and charts.

## Non-Negotiables
- Read and understand first before making changes (`README.md`, `INDEX.md`, `MEMORY.md`, affected files).
- Keep diffs small and reviewable; avoid unnecessary refactors.
- Never commit API keys; use local `.env.local`.
- Always verify changes (`npm run lint`, and `npm run build` when needed).
- Do not make topology or infrastructure assumptions without local evidence from the running system (`docker ps`, `docker inspect`, `tailscale status`, `tailscale serve status`).

## Memory Routing
- Stable project state and open decisions: `MEMORY.md`
- Usage and setup: `README.md`
- Navigation: `INDEX.md`
- Daily notes and history: `agents/memory/daily/*`

## Definition of Done
- The functional fix or change is implemented.
- Verification is completed (`npm run lint`, `npm run build` when needed, plus runtime checks for ops topics).
- Stable state or rule is documented in `MEMORY.md`.
- Time-based history or incident is documented in `agents/memory/daily/<YYYY-MM-DD>-*.md`.
- For recurring ops issues, add or update a short runbook in `README.md` or `MEMORY.md`.

## Incident Workflow
1. Measure the symptom concretely (for example `curl -I` with status code).
2. Run first checks in the affected runtime context.
3. Name the root cause; do not blind-fix.
4. Implement the fix.
5. Verify externally and internally.
6. Write back to memory (`MEMORY.md` and daily note).

## First Checks for This Setup
- Run `docker compose ps` in the repo and inspect the state of `web`.
- Verify locally with `curl -I http://127.0.0.1:3001`.
- If needed, inspect logs with `docker compose logs --tail=200 web`.
- Only after that, pursue further hypotheses such as DNS, clients, or tunnels.
- Do not touch `openclaw/owui` routing (`ai_stack`) unless the user explicitly asks for it.

## Assumption Guardrails
- Do not claim things like "Host X is external / another machine" before checking `tailscale status --json` and container or network data.
- When unsure, provide measurements first and conclusions second.
- Actively correct earlier false assumptions in the same turn and record them in memory.

## Safety Guardrails
- Change allowlists, plugins, skills, tokens, routing, and other security-relevant settings only within the exact scope explicitly named by the user.
- No bulk enabling, no generalization from examples, and no expansion to similar entries without explicit approval.
- If changes already exceeded the allowed scope, stop immediately, name the error precisely, restore the exact requested state, and only then continue.

## Behavior and Character
- Be short, precise, and reviewable.
- When unsure, measure instead of guessing.
- Learn from mistakes: name them, roll them back, derive a rule, document it.
- Use initiative only within the user's explicit scope.

## Working Style
- Prefer server-side data fetching when secrets are involved.
- Normalize new data sources first, then build UI.
- Express macro inferences as understandable heuristics, not black boxes.
