---
type: Reference
title: Dependencies
description: Dependency classes, human pins, holds, cross-repo consumers and verification for oddshawk-sdk (`node-js-sdk`), per `github:oddshawk/internal-documentation/okf-bundle/dependencies.md`.
tags: [okf, dependencies, oddshawk-sdk]
timestamp: 2026-11-13T13:26:00Z
---

## Summary and classes

| kind | class | members |
|---|---|---|
| package | Application packages | `package.json` and `package-lock.json`: the runtime dependencies `axios`, `js-sha256` and `ws` |
| package | Application packages | the dev toolchain in `package.json`: `mocha`, `chai`, `sinon`, `sinon-chai` and `serialize-javascript`, plus `eslint` with `@eslint/eslintrc`, `eslint-config-standard`, `eslint-config-semistandard`, `eslint-plugin-import`, `eslint-plugin-n`, `eslint-plugin-promise` and `globals` |
| package | Application packages | `.npmrc` `legacy-peer-deps=true`, and the `overrides` floors `minimatch ^11.0.4` and `glob ^14.0.3` |
| package | Application packages | `.github/dependabot.yml`: weekly npm updates, `open-pull-requests-limit: 10`, majors ignored for `eslint`, `mocha` and `eslint-plugin-promise` |
| publish | Application packages | the npm registry: `@oddshawk/oddshawk-sdk` with `publishConfig.access: public`, published as its own sources (`files`: `index.js` and `src/`), with no build step and no type declarations. No container image, service, server or database is deployed from this repository |
| runtime | Language runtime | `engines.node: ">=26"`, run on the CI image `cimg/node:26.12.1` |
| ci | CI toolchain | `.circleci/config.yml`: the orbs `oddshawk/npm-audit@1.0.0` and `circleci/slack@6.1.3`, and the `test` job running `npm ci`, the audit orb and `npm test` |

## Human pins

| kind | item | repos | pinned at |
|---|---|---|---|
| package | `eslint` | `node-js-sdk` | `10` (`^10.12.0`; Dependabot ignores its majors) |
| package | `mocha` | `node-js-sdk` | `12` (`^12.0.3`; Dependabot ignores its majors) |
| package | `minimatch` override floor | `node-js-sdk` | `^11.0.4` |
| package | `glob` override floor | `node-js-sdk` | `^14.0.3` |
| package | peer resolution in `.npmrc` | `node-js-sdk` | `legacy-peer-deps=true` |
| runtime | Node.js | `node-js-sdk` | `26` (`engines.node: ">=26"`) |
| ci | CI image `cimg/node` | `node-js-sdk` | `26.12.1` |
| ci | orb `oddshawk/npm-audit` | `node-js-sdk` | `1.0.0` |
| ci | orb `circleci/slack` | `node-js-sdk` | `6.1.3` |

## Held / do-not-bump

| kind | item | repos | held at | blocking reason | unblock condition |
|---|---|---|---|---|---|
| package | `eslint-plugin-promise` | `node-js-sdk` | `^6.6.0` | `eslint-config-standard@^17.1.0` and `eslint-config-semistandard@^17.0.0` both peer `eslint-plugin-promise: ^6.0.0`, so a 7.x would run outside the declared peer range and make `npm ls` report a peer problem; it is dev-only lint currency with no advisory | either config publishes a `^7` peer |
| package | `eslint` major 11 and later | `node-js-sdk` | `10` | Dependabot ignores eslint majors. The tree resolves only with `legacy-peer-deps=true` in `.npmrc`, because declared peers are unsatisfied: `eslint-config-standard@^17.1.0` and `eslint-config-semistandard@^17.0.0` peer `eslint ^8`, both of them peer `eslint-plugin-n` below 17 against the installed `eslint-plugin-n@18.5.0`, `eslint-plugin-import@2.32.0` peers `eslint ^2`–`^9`, and `eslint-plugin-promise@^6.6.0` peers `eslint ^7`–`^9` | those peers allow `eslint 11` and `eslint-plugin-n` runs at a version the two configs peer, and the ignore is lifted |
| package | `mocha` major 13 and later | `node-js-sdk` | `12` | Dependabot ignores mocha majors | a deliberate major bump, with its tests |

## Cross-repo consumers

| kind | item | provider | consumers | version constraint |
|---|---|---|---|---|
| package | `@oddshawk/oddshawk-sdk` | `node-js-sdk` | `github:BARBITRAGE-LTD/node-server`, `github:BARBITRAGE-LTD/daily-goals`, `github:oddshawk/spreadex-scraper`, `github:oddshawk/goalbet-scraper`, `github:npfedwards/projects` | `^1.1.1` |
| package | `@oddshawk/oddshawk-sdk` | `node-js-sdk` | `github:bettermedia/whichbookie`, through its `services/pre-race-odds` package | `^1.0.17` |
| package | `@oddshawk/oddshawk-sdk` | `node-js-sdk` | `github:oddshawk/betfred-scraper` | `^1.0.16` |
| package | `@oddshawk/oddshawk-sdk` | `node-js-sdk` | `github:oddshawk/fitzdares-scraper` | `^1.0.15` |
| package | `@oddshawk/oddshawk-sdk` | `node-js-sdk` | `github:oddshawk/william-hill-scraper` | `^1.0.12` |
| package | `@oddshawk/oddshawk-sdk` | `node-js-sdk` | `github:oddshawk/boylesports-scraper`, `github:oddshawk/coolbet-scraper` | `^1.0.11` |

## Verify

| kind | item | command | expected result |
|---|---|---|---|
| package | audit gate | `npm audit --audit-level=high` | exit 0: no high or critical advisory |
| package | resolved tree | `npm ls --depth=0` | exit 0: no missing or peer problem |
| package | lint and tests | `npm test` | exit 0: `eslint --fix .` reports nothing and the full mocha suite passes |
| package | held peer | `npm ls eslint-plugin-promise` | exit 0 at `6.x`, no peer problem, while the hold stands |
| runtime | Node version of the machine the command runs on | `node --version` | `v26.x` (`engines.node` is `>=26`). A local check: it measures that machine, not CI, which the image row below reads from the manifest instead |
| ci | Node image CI runs the suite on | `grep 'image: cimg/node' .circleci/config.yml` | `- image: cimg/node:26.12.1` |
| ci | audit orb pin | `grep 'npm-audit:' .circleci/config.yml` | `npm-audit: oddshawk/npm-audit@1.0.0` |
| ci | lint and test step | `grep -A2 'lint + unit tests' .circleci/config.yml` | the step `lint + unit tests` runs `command: npm test` |
