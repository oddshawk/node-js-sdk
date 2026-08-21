---
type: Reference
title: Testing
description: How agents and humans verify changes in oddshawk-sdk.
tags: [okf, testing]
---

# Testing — oddshawk-sdk

Implements workspace [testing-policy.md](../../okf-bundle/testing-policy.md).

## Agent testing

### Prerequisites

- Node.js with `npm install` completed (devDeps: mocha, chai, sinon, eslint)
- No live API credentials required for the current unit suite
- Do **not** point tests at production with real customer credentials unless Nathan explicitly scoped it

### Commands

| Check | Command | Pass signal |
|-------|---------|-------------|
| Lint + unit tests | `npm test` | Exit 0 — eslint (pretest, `--fix`) then **full** mocha suite (no `--grep`) |
| High+ audit | `npm audit --audit-level=high` | Exit 0 (CI uses `oddshawk/npm-audit@1.0.0`; same gate locally) |

Agents must run **all** rows before handoff. `pretest` may rewrite sources via `eslint --fix`; include those fixes in the change set if they appear.

### Agent constraints

- Run the **full** primary test command; do not hand off on a filtered mocha subset unless Nathan scoped a focused run
- Do not publish to npm (`npm publish`) from an agent session
- Do not commit secrets or customer credentials
- Prefer stubbed/unit tests; avoid live calls to `odds.software` / `ws.odds.software` in CI-facing suites

### Agent-only insufficient when

- Verifying browser cookie-auth flows against a real staging session
- Confirming WebSocket subscribe/update behaviour end-to-end against staging
- npm publish / version tag cut (Nathan)

## Adversarial review

### Required when

- Any change under `src/` or public exports in `index.js`
- Auth / hash generation changes (`generateHash`, REST headers, WS auth payload)
- More than five files changed in one handoff

### Subagent and brief

- Subagent: `bugbot` or fresh `generalPurpose` (review-only)
- Provide: diff/branch, changed files, this doc's agent commands
- Block handoff on: critical/high findings (credential leakage, broken auth header contract, publish misconfig)

Primary agent must not self-review in the same context that wrote the code.

## Human handoff

Present to Nathan:

1. **Summary** — what changed and why (durable wording)
2. **Agent test results** — `npm test` pass/fail
3. **Adversarial review** — verdict + open items
4. **Manual test steps** — if REST/WS surface changed: install from branch, run README Node snippet against staging with a test user
5. **Artifacts** — branch, PR URL, proposed npm version bump
6. **Ask** — checklist (publish? version pin? staging smoke?)
