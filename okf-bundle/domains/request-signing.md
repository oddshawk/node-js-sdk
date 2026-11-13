---
type: Reference
title: Request signing
description: The signature the API authenticates with — what it names, where the clients carry it, and the two ways a caller can hold the password it derives from.
tags: [okf, domains, request-signing, oddshawk-sdk]
timestamp: 2026-11-14T09:20:00Z
---

# Request signing

`src/generateHash.js`: the signature the API authenticates with. The package root exports the function, so a caller that signs a request of its own alongside this package signs it the same way (Client, [client.md](client.md)).

## Function

The value names the moment it was made to the nearest whole second, so a reader reads that second from the value itself.

In password mode the REST client signs each request, so requests whose values name the same second carry the same signature and values naming different seconds carry different ones (REST transport, [rest-transport.md](rest-transport.md)). A password-mode construction gives the socket a signature made the same way, so the live feed authenticates on the same scheme (Socket transport, [socket-transport.md](socket-transport.md)).

## The credential a caller holds

The signature is derived from the account password, so the password MUST NOT reach a browser. A caller has two options, and both authenticate the same reads:

1. **On a server, in password mode.** The construction holds the password and the SDK signs every REST request and the socket handshake as it sends them, so a caller holds only the password and each signature stays current.
2. **In a browser, in browser mode.** Either proxy the calls through the caller's own servers, so the password stays on those servers and the browser works from the signature, or give each authorised user a pre-generated hash those servers produce from the password. A pre-generated hash also sets the browser's session, so one signature covers the reads that follow; a hash long-lived enough to be issued to a browser is a credential held in a browser.

Neither option is a weaker form of the other: the signature the API receives is the same in each, and which one a caller takes follows from where the password may live.

## Place in the application

Request signing is a platform contract: `github:oddshawk/rest-api`'s OpenAPI (`github:oddshawk/rest-api/spec/oddshawk2.yaml`) documents the recipe that API serves, and each service's acceptance of a signature is that service's own contract.
