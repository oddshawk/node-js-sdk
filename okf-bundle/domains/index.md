---
type: Reference
title: Domains
description: Every module of oddshawk-sdk, the source files that define it, its function and the document that describes it.
tags: [okf, domains, modules, oddshawk-sdk]
timestamp: 2026-11-14T09:20:00Z
---

# Domains — oddshawk-sdk

The modules of `@oddshawk/oddshawk-sdk`.

| Module | Source files | Function | Document |
|---|---|---|---|
| Client | `index.js`, `src/oddshawk.js` | The package root: the object a caller constructs and works through, giving the odds catalog, name matching and the live feed | [client.md](client.md) |
| REST transport | `src/rest.js` | The client over the authenticated REST API: the odds catalog and the resolution of a provider's spelling to the OddsHawk canonical record | [rest-transport.md](rest-transport.md) |
| Socket transport | `src/socket.js` | The client over the live odds feed: one authenticated session, the subscriptions a caller sends, and the callbacks the feed reaches | [socket-transport.md](socket-transport.md) |
| API error model | `src/apiError.js` | What a failed read or its browser-mode session exchange rejects with, and what that error tells a caller | [api-error.md](api-error.md) |
| Request signing | `src/generateHash.js` | The signature the API authenticates with, and the two ways a caller can hold the password it derives from | [request-signing.md](request-signing.md) |
