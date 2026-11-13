---
type: Reference
title: Developer acceptance environment
description: The environment a developer runs locally to accept a change in oddshawk-sdk by hand.
tags: [okf, acceptance, environment, oddshawk-sdk]
timestamp: 2026-11-13T18:31:00Z
---

# Developer acceptance environment — oddshawk-sdk

Additive to the OddsHawk developer acceptance environment standard `github:oddshawk/internal-documentation/okf-bundle/developer-acceptance-environment.md`.

## Prerequisites

| Need | Detail |
|---|---|
| Node.js | 26 or newer (`engines.node`) |
| Packages | `npm install` in the checkout, or `npm ci` for the lockfile exactly as CI installs it |
| OddsHawk account | a username, and in Node mode the account's password; in browser mode a hash the caller's own server computes from that password |
| Reached services | the REST host the `baseUrl` option selects and the customer socket API; § Running gives both addresses |

## Start

1. `npm install`
2. Export the account's username and password as `OH_USER` and `OH_SECRET` in the shell that runs the script
3. Save the script below as `accept.mjs` at the root of the checkout, where `.gitignore` keeps it out of a commit, so that the `./index.js` it imports is this checkout's own entry. It reads the credential from the environment, so what a commit may carry is [git.md](git.md)'s.
4. `node accept.mjs`

```js
import { OddsHawk } from './index.js';

const oddshawk = new OddsHawk(process.env.OH_USER, process.env.OH_SECRET, true);

try {
  const { version } = await oddshawk.rest.version();
  const odds = await oddshawk.rest.odds({ sport: 'Horse Racing', limit: 5 });
  const sports = await oddshawk.rest.sports();
  const match = await oddshawk.rest.matchEvent('Bet365', 'Some Provider Spelling', 1_700_000_000, 'Horse Racing');
  console.log({ version, odds: odds.length, sports: sports.length, match });
} catch (err) {
  console.log({ name: err.name, status: err.status, data: err.data, code: err.code, cause: err.cause, message: err.message });
}

oddshawk.ws.onInitial((data) => console.log('initial', data));
oddshawk.ws.onUpdate((data) => console.log('update', data));
oddshawk.ws.onClose(() => console.log('closed'));
oddshawk.ws.onError(() => console.log('socket error'));
oddshawk.ws.connect();
oddshawk.ws.subscribe({ sport: 'Horse Racing' });
```

To accept the change from an application that already depends on the package, `npm link` this checkout into that application's `node_modules` instead of importing `./index.js`.

## Running

The package serves no address: it is a library that runs inside the calling process, so there is no port to open and no route to request. What a developer reads is the script's own output, and what is under acceptance is:

- the resolved values — the version record, the odds rows, and one catalog sub-resource;
- a `/rest/match/*` call, which answers `false` rather than throwing when it has no record to give — in the password mode this script runs, the helper's own request is the only one that answer can come from (matching helpers, [domains/rest-transport.md](domains/rest-transport.md));
- the `OddsHawkApiError` fields on a rejected credential, `cause` among them (API error model, [domains/api-error.md](domains/api-error.md));
- the socket's initial dump and each later update, delivered to the registered callbacks.

The endpoint under acceptance is whichever `baseUrl` the constructor was given, with `https://www.odds.software` as its default; the socket connects to `wss://ws.odds.software`.
