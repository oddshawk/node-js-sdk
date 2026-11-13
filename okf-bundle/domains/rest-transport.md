---
type: Reference
title: REST transport
description: The client over the authenticated REST API — the authentication each mode needs, the session of browser mode, the catalog reads and name resolution.
tags: [okf, domains, rest-transport, oddshawk-sdk]
timestamp: 2026-11-13T18:51:00Z
---

# REST transport

`src/rest.js`: the client over the authenticated REST API that the Client object holds, covering the odds catalog, the helpers that resolve a provider's spelling to the OddsHawk canonical record, and the authentication each mode needs.

## Function

Every request it makes is a `GET` under the origin a caller gave Client, and every request but the browser-mode session exchange times out rather than hanging.

The two modes authenticate differently, and both are the module's own work: in password mode a request is authenticated by a signature the client makes as it sends the request ([request-signing.md](request-signing.md)); in browser mode the client exchanges the caller's hash for a session and the session authenticates the requests that follow, so a read made while no session is held establishes one itself and a caller calls only the read it wants.

A `filter` a caller passes becomes the request's query string in whichever form the caller gives it, each value encoded by the client. Which keys a sub-resource honours is the API's contract.

A matching helper answers the canonical record when there is one, and `false` for a lookup that resolves nothing or for a failure of its own request, so a caller reads `false` as either outcome. Passing `init` registers a name the API has not resolved, for curation, and what such a call answers is the API's contract.

A catalog read that fails rejects with `OddsHawkApiError`, and a browser-mode exchange that fails rejects from whichever call needed the session, the matching helpers included (API error model, [api-error.md](api-error.md)).

## Place in the application

REST transport is the reading half of what Client holds: a caller reaches the version record, the odds rows and name resolution through it, while live updates arrive through the sibling Socket transport ([socket-transport.md](socket-transport.md)).

The endpoints, their query surface and the matching contract are the API's, served by `github:oddshawk/rest-api`.
