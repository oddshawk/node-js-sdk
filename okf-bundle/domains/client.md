---
type: Reference
title: Client
description: The package entry point — the object a caller constructs and works through, and the two transports it reaches.
tags: [okf, domains, client, oddshawk-sdk]
timestamp: 2026-11-14T09:20:00Z
---

# Client

`index.js`, the package's `main`, and the class `src/oddshawk.js` defines: the object a caller constructs and works through.

## Function

One construction gives a caller the odds catalog and the matching helpers through the REST transport ([rest-transport.md](rest-transport.md)), plus the live odds feed through the socket transport ([socket-transport.md](socket-transport.md)).

A rebuild gives the object a caller already holds a new credential and REST origin, and the reads made after it use that pair.

A caller's credential authenticates the catalog reads and the live feed whichever mode it holds, a password or a hash the caller's own server computed, so one construction covers either mode. Which of the two ways to run — a server that holds the password, or a browser behind a proxy or a pre-generated hash — is [request-signing.md](request-signing.md)'s (Request signing).

A username or credential that is missing or not a string is refused with a `TypeError`, at construction and at every rebuild.

## Place in the application

Client is where a caller starts: the package root exports the class a caller constructs, beside the signing function and the error class that each have their own document ([request-signing.md](request-signing.md), [api-error.md](api-error.md)).
