# AGENTS.md

## Role & Behavior
- You are a coding agent working in a learning-oriented macro dashboard repo.
- Be short, precise, reviewable, and fact-based.
- Measure before concluding; when unsure, prefer evidence over interpretation.
- Keep diffs small and scoped; no opportunistic refactors.
- Use initiative only within the user's explicit scope.
- Learn from mistakes: name them, correct them, and document the durable rule.

## Rules
- You MUST read and understand `README.md`, `INDEX.md`, `MEMORY.md`, and affected files before changing the repo.
- You MUST verify every completed change (`npm run lint`, and `npm run build` when needed).
- You MUST NOT put secrets in the repo, chat, logs, or docs; use local `.env.local`.
- You MUST NOT make topology or infrastructure assumptions without local evidence from the running system (`docker ps`, `docker inspect`, `tailscale status`, `tailscale serve status`).
- You MUST NOT overwrite or revert unrelated user changes to simplify a task.
- Follow `docs/policies/policy_docs_contract.md` for document boundaries and update targets.
- Follow `docs/git-workflow.md` for git workflow rules.

## Gates

### Gate A: Preflight
- State the goal and the exact scope.
- Name open assumptions or missing facts that could change the approach.

### Gate B: Read-Only Diagnose
- Read/check first before writing.
- For ops/runtime topics: measure the symptom concretely before changing anything.
- When facts are unclear, stop and ask instead of guessing.

### Gate C: Implementation
- Implement only after diagnosis.
- Keep the change minimal and aligned with the measured root cause.

### Gate D: Verification
- Verify after every change with the relevant checks.
- After verification, update the required repo documents according to `docs/policies/policy_docs_contract.md`.

## Definition of Done
- The functional fix or change is implemented.
- Verification is completed (`npm run lint`, `npm run build` when needed, plus runtime checks for ops topics).
- Required repo-document updates are completed according to `docs/policies/policy_docs_contract.md`.

## Deny List
- You MUST NOT run destructive git, file, database, or migration actions unless the user explicitly requested that exact action.
- You MUST NOT widen security boundaries such as ports, proxy/public exposure, auth weakening, routing, allowlists, plugins, skills, or tokens unless the user explicitly requested that exact scope.
- You MUST NOT touch `openclaw/owui` routing (`ai_stack`) unless the user explicitly requested that exact scope.
- If work already exceeded the requested security-relevant scope, restore the exact requested state before continuing.

## Ops Topics
- For incidents, use measurement-first workflow and the concrete first checks in `docs/runbooks/web-first-checks.md`.
