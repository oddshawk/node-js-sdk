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

`odds` filter keys include: `fromNow`, `eventTime`, `eventName`, `sport`, `provider`, `selectionStatus`, `market`, `updatedBefore`, `competition`, `competitionName`, `sortField`, `sortDirection`, `limit`, `skip`. To pin a single event, pass `eventName` together with `eventTime`.

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

- `status` — HTTP status when a response was received (`403`, `400`, `429`, `500`, …)
- `data` — response body when present
- `code` — the body's `code` field when present. The live failures below put their machine-readable code in `error` instead (e.g. `coverage_not_entitled`, `throttled`), so read `data.error` for it.

Live statuses:

| Status | When |
|--------|------|
| **403** | Missing/invalid hash or session (plain-text body); or the request is outside your account's coverage grant — `{"error":"coverage_not_entitled"}` |
| **400** | Invalid odds query (empty `eventTime` or `eventName`) |
| **429** | A capped account is already over this hour's data-point limit — `{"error":"throttled",…}`, including `retry_after_seconds` |
| **404** | No match on `/rest/match/*` |

Metering is live too: successful responses on the metered routes (`GET /rest/odds` and `/rest/match/*`) carry your current usage in the `X-Data-Points-This-Hour`, `X-Data-Points-Limit` and `X-Hour-Resets-At` headers, and `GET /rest/account` reports the same limit plus your coverage grant. This SDK returns response bodies only, so read those headers from a direct HTTP call if you need them.

The following codes are **planned and not emitted yet**: `feed_down`, `catalog_dropped`, `payment_required` — do not depend on them.

Guides: https://odds.software/guides/errors.md and https://odds.software/guides/coverage.md.

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
- Some lookups resolve to just the canonical name (for example `{ event: { name } }`) instead of a
  dictionary record — treat those as successful resolutions.

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
