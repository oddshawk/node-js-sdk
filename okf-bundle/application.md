---
type: Reference
title: Application
description: What oddshawk-sdk is, its function in the OddsHawk business, and how it relates to the organisation's other repositories.
tags: [okf, oddshawk-sdk, node-js-sdk, oddshawk]
timestamp: 2026-11-13T18:51:00Z
---

# Application

## What it is

`github:oddshawk/node-js-sdk`, published to npm as `@oddshawk/oddshawk-sdk`: the JavaScript client for the OddsHawk customer odds feed, written as ESM JavaScript. Its module index is [domains/index.md](domains/index.md); the artefact it publishes and the toolchain around it are [dependencies.md](dependencies.md).

## Function in the business

This package is the JavaScript side of the OddsHawk contract: a customer's Node or browser application reads the odds catalog and resolves provider-supplied names through it, and subscribes to live odds, leaving the authentication, the query surface and the socket protocol to the library. The capabilities it gives a caller, and the module that owns each, are [domains/index.md](domains/index.md)'s.

## Relation to other repositories

`github:oddshawk/internal-documentation/okf-bundle/architecture.md` shows the product these repositories serve and how the feed's components join together; this section is only this repository's place in it. Repositories are named as their organisation repository, which `github:oddshawk/internal-documentation/okf-bundle/repositories.md` lists.

| Repository | Relation |
|---|---|
| `github:oddshawk/rest-api` | serves the authenticated REST API this client's REST transport calls |
| `github:oddshawk/socket-api` | serves the customer WebSocket this client's socket transport connects to |
| `github:oddshawk/python-sdk` | the Python client library over the same REST API |
| `github:oddshawk/internal-documentation` | the organisation bundle this repository's documents point at |
