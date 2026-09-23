---
type: Reference
title: Application
description: JavaScript SDK for the OddsHawk data feed (`@oddshawk/oddshawk-sdk`)
tags: [oddshawk-sdk, oddshawk, sdk, javascript]
timestamp: 2026-08-06T00:00:00Z
---

# Application

Published npm package `@oddshawk/oddshawk-sdk` — client library for the OddsHawk customer odds feed. Wraps REST catalog calls against `oddshawk-rest` and a WebSocket client against `oddshawk-socket`, using HMAC header auth (`X-OH-User` / `X-OH-Hash`).

## Runtime flow

1. Construct `OddsHawk(username, hashOrPassword, isPassword, baseUrl)`.
2. REST: optional `/authenticate` (browser / pre-hashed cookie path), then catalog GETs under `/rest/odds*`, plus the `/rest/match/*` matching helpers (authenticated like the rest of the API).
3. WebSocket: connect to `wss://ws.odds.software`, send auth + ping, subscribe with sport/filter payloads, receive `initial` / update messages.
4. Node (`isPassword: true`): SDK derives time-based HMAC via `generateHash` on each request. Browser (`isPassword: false`): caller supplies a precomputed hash; cookie session after first auth.

## Key modules

| Path | Role |
|------|------|
| `index.js` | Package exports: `OddsHawk`, `generateHash` |
| `src/oddshawk.js` | Facade: wires `Rest` + `Socket` |
| `src/rest.js` | Axios REST client (auth, odds catalog, match helpers) |
| `src/socket.js` | WebSocket client (Node `ws` or browser `WebSocket`) |
| `src/generateHash.js` | HMAC-SHA256 time-window hash for Node password mode |
| `test/oddshawk.test.js` | Mocha unit tests |

## Environment variables

None required. Optional constructor `baseUrl` defaults to `https://www.odds.software`. Credentials are constructor arguments, not env.

## Deployment

Library only — no service deploy. Publish to npm (`publishConfig.access: public`). GitHub: `oddshawk/node-js-sdk`. Local: `npm ci` then `npm test`. CI: CircleCI Node 26 + `oddshawk/npm-audit@1.0.0`. Nathan-only `npm publish` after green merge (cn-123).

## Related systems

- `oddshawk-rest` — REST auth + odds catalog (`/authenticate`, `/rest`, `/rest/odds*`, `/rest/account`); the `/rest/match/*` matching helpers live in the OpenAPI `Matching` section
- `oddshawk-socket` — live odds WebSocket (`wss://ws.odds.software`)
- Sibling: `oddshawk-python-sdk` (Python client; separate packaging)

## Public-docs policy (what must not ship)

The npm README and the shipped sources are customer-facing, so they name providers only as examples
(`Bet365`) and never describe feed composition or the API's per-provider branches — that material is
maintainer-only and lives in `oddshawk-rest`'s `okf-bundle/application.md` § *Internal-only details*.
They also carry no internal task references, no "reserved / forthcoming" wording for the metering
headers (live since cn-124/cn-125: `X-Data-Points-*`, `403 coverage_not_entitled`, `429 throttled`),
and no `eventId` (an internal key, not part of the documented query surface — use `eventName` +
`eventTime`). `test/publicDocs.test.js` fails the suite if any of that reappears.

`GET /rest/account-usage` (the current-hour metering snapshot) is deliberately outside the public
catalog and is not wrapped here: usage is already live on every metered response (`X-Data-Points-*`),
in the `429` body, and via `GET /rest/account`'s `throttle` block.
