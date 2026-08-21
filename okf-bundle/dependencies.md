---
type: Reference
title: Dependencies
description: Dependency locations, human pins, and check/update cadence for oddshawk-sdk.
tags: [okf, dependencies, oddshawk-sdk]
timestamp: 2026-08-21T00:00:00Z
---

# Dependencies — oddshawk-sdk

cn-123 SDK wave (Phase 3). Published npm package `@oddshawk/oddshawk-sdk` (`oddshawk/node-js-sdk`).

## Summary

| Class | Locations | Human pins | Check | Owner |
|-------|-----------|------------|-------|-------|
| npm | `package.json`, lockfile | `.npmrc` legacy-peer-deps (eslint 10); mocha 11 + serialize override | weekly | agent → nathan |
| Node CI | `.circleci/config.yml` | LTS **26** (`cimg/node:26.4`); `engines.node: ">=26"` | monthly | agent → nathan |
| CI audit | `oddshawk/npm-audit@1.0.0` | orb pin | monthly | agent |
| Publish | npm registry | Nathan-only `npm publish` | on merge | nathan |

## (a) Locations and pins

- Dependabot weekly npm (no Docker — no Dockerfile)
- CircleCI `test`: `npm ci` + `oddshawk/npm-audit@1.0.0` + `npm test` (eslint + mocha)
- **Human pins:** eslint 10 + FlatCompat + `legacy-peer-deps`; mocha **11** + `serialize-javascript` override; `brace-expansion` override (high CVE clear); Node 26 on CI
- **Highlights:** `axios@^1`, `ws@^8`, `js-sha256@^0.11`, `chai@^6` / `sinon@^22` / `sinon-chai@^4`
- **Known low (accepted under high+ gate):** mocha 11 nests `diff` advisory (low) — same as platform Wave 1/2; do not force mocha downgrade via `npm audit fix --force`

## (b) Cadence

Weekly Dependabot + audit CI; Node LTS hop monthly; publish handoff after green merge (Nathan).

## (c) Host stack

| Layer | Detail |
|-------|--------|
| Deploy | Library only — no VM/K8s deploy from this repo |
| Runtime | Consumer Node ≥26 (engines); CI image `cimg/node:26.4` |

## Inherited / out-of-repo

- Credentials rotation: cn-37
- Catalog / OpenAPI surface refresh: cn-127 (parallel SDK product work)
- Direct consumers (Phase 4 bumps after npm publish): `node-server`, `daily-goals`, plus scrapers with a direct `@oddshawk/oddshawk-sdk` dep (`betfred-scraper`, `oddshawk-spreadex-scraper`, `goalbet-scraper`, `coolbet-scraper`, `williamhill-scraper`, `boylesports-scraper`, www `oddschecker-scraper`; `fitzdares-scraper` excluded from cn-123 v1)
