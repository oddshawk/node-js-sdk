---
type: Reference
title: Request signing
description: The signature password mode authenticates with — the moment it names, and where the clients carry it.
tags: [okf, domains, request-signing, oddshawk-sdk]
timestamp: 2026-11-13T17:07:00Z
---

# Request signing

`src/generateHash.js`: the signature password mode authenticates with. The package root exports the function, so a caller that signs a request of its own alongside this package signs it the same way (Client, [client.md](client.md)).

## Function

The value names the moment it was made to the nearest whole second, so a reader reads that second from the value itself.

In password mode the REST client signs each request, so requests whose values name the same second carry the same signature and values naming different seconds carry different ones (REST transport, [rest-transport.md](rest-transport.md)). A password-mode construction gives the socket a signature made the same way, so the live feed authenticates on the same scheme (Socket transport, [socket-transport.md](socket-transport.md)).

## Place in the application

Request signing is a platform contract: `github:oddshawk/rest-api`'s OpenAPI (`github:oddshawk/rest-api/spec/oddshawk2.yaml`) documents the recipe that API serves, and each service's acceptance of a signature is that service's own contract.
