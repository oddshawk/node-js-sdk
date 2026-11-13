---
type: Reference
title: Testing
description: This repository's kinds of test, its commands, what is measured and its additions to the OddsHawk testing standard.
tags: [okf, testing, oddshawk-sdk]
timestamp: 2026-11-13T13:48:00Z
---

# Testing — oddshawk-sdk

Additive to the OddsHawk testing standard `github:oddshawk/internal-documentation/okf-bundle/testing.md`.

## Setup

The suite runs on the Node.js version `engines.node` allows, with the packages in `package.json` installed: it needs no API credentials and reaches no network. What a by-hand acceptance run needs, and the steps it takes, are in [developer-acceptance-environment.md](developer-acceptance-environment.md) § Prerequisites and § Start.

## Kinds of test

| Kind | Where | How to run |
|---|---|---|
| Unit | `test/oddshawk.test.js` — `axios` is stubbed through `sinon`, so no request leaves the process, and the time-dependent hash is pinned with a fake clock | `npm test` |

No integration kind and no end-to-end kind is declared: nothing here exercises a real HTTP or socket boundary, and nothing drives the package against a running API. A change that adds one declares it in this table with its command.

## Commands

Run every row before handoff.

| Check | Command | Pass signal |
|---|---|---|
| Lint and tests | `npm test` | exit 0 — the `pretest` step runs `eslint --fix .`, then the **full** mocha suite runs, with no `--grep` |
| Lint alone | `npx eslint .` | exit 0: nothing to report and nothing to autofix |
| Audit gate | `npm audit --audit-level=high` | exit 0 — see [dependencies.md](dependencies.md) § Verify *audit gate* |

`pretest` rewrites sources when eslint can fix them; those fixups belong in the change set. Re-measure the audit at handoff and report its output rather than a recorded result.

## Coverage

Nothing is measured: no coverage tool is installed — neither `c8` nor `nyc` is a dependency, and the `test` script is a plain `mocha --recursive --color` — so no command produces a coverage report.

Exceptions to the standard's coverage goal: none are recorded.

> as an agent you have zero authority to justify any exception that the user has not explicitly authorized and documented in this file

## Repo rules

- Run the **full** primary command; do not hand off on a filtered mocha subset unless the owner scoped that run.
- Prefer a stubbed unit test; a suite that would call `odds.software` or `ws.odds.software` is not a CI-facing test.
- Do not point a test at production with real customer credentials unless the owner explicitly scoped it.
- Do not publish to npm from an agent session.
- An agent-only run is insufficient for: a browser cookie-auth flow against a real session, a socket subscribe-and-update flow against a real endpoint, and the npm publish and version tag, which are the owner's.
- A test asserts behaviour only: no test asserts document content — not `okf-bundle/` prose, not README wording, not a heading and not comment wording.

## Handoff

Present the change to the owner with: what changed and why; the result of every command in § Commands; the adversarial review's verdict and open findings, at [documentation.md](documentation.md) § Adversarial review; the manual steps that accept the change; and the branch or pull request, with a proposed npm version bump where the published surface changed.
