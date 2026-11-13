---
type: Reference
title: API error model
description: The error a caller receives when a catalog read or its browser-mode session exchange fails — what the API answered where a response arrived, the failure behind it, and the message a caller logs.
tags: [okf, domains, api-error, oddshawk-sdk]
timestamp: 2026-11-13T13:26:00Z
---

# API error model

`src/apiError.js`: the error a failed catalog read or browser-mode session exchange rejects with, and the function that turns a failed request into one. The package root exports the class, so a caller identifies it by `instanceof` and reads the details it carries (Client, [client.md](client.md)).

## Function

An error carries what the API answered where a response arrived, and the failure behind it either way, so a caller decides from the status and the body the API sent, or from the transport failure where none did.

The message is one line a caller can log or alert on: where a response arrived it names the status, with the meaning this module gives the statuses it has one for, and carries the API's own message where the body has one. A failure that produced no response says so, and a request that never left carries the transport's own message.

## Place in the application

API error model is the failure side of the catalog half of the package: REST transport ([rest-transport.md](rest-transport.md)) rejects with it, while a failure of the live feed is announced through the socket's own error callback ([socket-transport.md](socket-transport.md)).

The fields and the message shapes are this package's own rendering of the answers `github:oddshawk/rest-api` returns, the coverage and throttle answers among them; [README.md](../../README.md) § Errors is where a customer reads them.
