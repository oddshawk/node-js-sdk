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

- `oddshawk-rest` — REST auth + odds catalog (`/authenticate`, `/rest/odds*`); the `/rest/match/*` matching helpers live in the OpenAPI `Matching` section
- `oddshawk-socket` — live odds WebSocket (`wss://ws.odds.software`)
- Sibling: `oddshawk-python-sdk` (Python client; separate packaging)
