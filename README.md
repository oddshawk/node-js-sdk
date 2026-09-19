# OddsHawk JavaScript SDK

Client for the OddsHawk public odds catalog (REST) and live WebSocket feed.

- **Package:** `@oddshawk/oddshawk-sdk`
- **API docs:** https://odds.software/docs/ (OpenAPI **0.3.0**)
- **Auth:** `X-OH-USER` + `X-OH-HASH` (HMAC), or session cookie `oh-id` after `/authenticate`

## Installation

```bash
npm install @oddshawk/oddshawk-sdk
```

## Authentication

| Mode | Constructor | Behaviour |
|------|-------------|-----------|
| **Node (password)** | `new OddsHawk(user, password, true)` | SDK derives a time-based SHA-256 hash on each REST call via `generateHash` |
| **Browser (pre-hash)** | `new OddsHawk(user, hash, false)` | Caller supplies a server-side hash; call `rest.authenticate()` once to set the `oh-id` cookie, then cookie + `X-OH-USER` |

Hash algorithm (same as OpenAPI): SHA-256 hex of `password + unixSeconds`, then append `unixSeconds` as 8 lowercase hex digits. Use exported `generateHash(password)` in Node when needed.

Optional 4th argument: `baseUrl` (default `https://www.odds.software`).

## REST — public catalog

Aligned with OpenAPI public paths:

| Method | Path |
|--------|------|
| `rest.authenticate()` | `GET /authenticate` |
| `rest.version()` | `GET /rest` |
| `rest.odds(filter)` | `GET /rest/odds` |
| `rest.events(fromNow, filter)` | `GET /rest/odds/events` |
| `rest.sports(fromNow)` | `GET /rest/odds/sports` |
| `rest.markets(fromNow, filter)` | `GET /rest/odds/markets` |
| `rest.providers(fromNow, filter)` | `GET /rest/odds/providers` |
| `rest.competitions(fromNow, filter)` | `GET /rest/odds/competitions` |

`odds` filter keys include: `fromNow`, `eventTime`, `eventName`, `eventId`, `sport`, `provider`, `selectionStatus`, `market`, `updatedBefore`, `competition`, `competitionName`, `sortField`, `sortDirection`, `limit`, `skip`.

The `/rest/match/*` helpers are documented separately under [Matching](#matching) — a separate surface, authenticated like the rest of the API.

### Node.js

```js
import { OddsHawk, OddsHawkApiError } from '@oddshawk/oddshawk-sdk';

const oddshawk = new OddsHawk(username, password, true);

try {
  const { version } = await oddshawk.rest.version();
  const rows = await oddshawk.rest.odds({ sport: 'Horse Racing', limit: 50 });
  console.log(version, rows.length);
} catch (err) {
  if (err instanceof OddsHawkApiError) {
    console.error(err.status, err.message, err.data);
  }
  throw err;
}
```

### Browser

```js
import { OddsHawk } from '@oddshawk/oddshawk-sdk';

const oddshawk = new OddsHawk(username, hash, false); // hash generated server-side

await oddshawk.rest.authenticate();
const sports = await oddshawk.rest.sports();
const events = await oddshawk.rest.events(true, { sport: 'Horse Racing' });
```

## Errors

Catalog REST methods throw `OddsHawkApiError` on HTTP/transport failure:

- `status` — HTTP status when a response was received (`403`, `400`, `500`, …)
- `data` — response body when present
- `code` — optional server `code` string if the body includes one

Today’s live statuses include **403** (not authenticated) and **400** (invalid odds query). Codes such as `feed_down`, `catalog_dropped`, `payment_required`, and usage/metering response headers are **reserved / forthcoming** (T1/T2) — this SDK does not require them.

## Matching

`/rest/match/*` resolves provider-supplied names to OddsHawk canonical entities. It is documented
in the OpenAPI `Matching` section and, like every other `/rest` endpoint — `/rest/odds` included —
it is available to any **authenticated** account (the same auth headers as every other call).

| Method | Path |
|--------|------|
| `rest.matchEvent(provider, name, time, sport, init = false)` | `GET /rest/match/event` |
| `rest.matchSelection(provider, name, time, sport, eventName, init = false)` | `GET /rest/match/selection` |
| `rest.matchTeam(provider, name, time, sport, init = false)` | `GET /rest/match/team` |
| `rest.matchCompetition(provider, name, time, sport, init = false)` | `GET /rest/match/competition` |

- `name` is the name to resolve (a canonical name, provider spelling, or known alias); `time` is the
  event start in unix seconds; `sport` is required.
- `init: true` registers an unresolved name for curation — the call that registers it still resolves to `false`.
- Unlike catalog methods, these return `false` on no match / error instead of throwing.
- `provider: 'Betfair Exchange'` uses an exact stored-odds lookup instead of the canonical dictionary
  (except `matchTeam`, which has no Betfair Exchange branch).

Full guide: https://odds.software/guides/matching.md

## WebSocket

```js
oddshawk.ws.connect();
oddshawk.ws.onUpdate((data) => { console.log(data); });
oddshawk.ws.onInitial((data) => { console.log(data); });
oddshawk.ws.onClose(() => { console.log('closed'); });
oddshawk.ws.subscribe({ sport: 'Horse Racing' });
```

Default endpoint: `wss://ws.odds.software`.

## Exports

```js
import { OddsHawk, generateHash, OddsHawkApiError } from '@oddshawk/oddshawk-sdk';
```
