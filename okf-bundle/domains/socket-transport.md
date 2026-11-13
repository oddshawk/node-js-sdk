---
type: Reference
title: Socket transport
description: The client over the live odds feed — the session a caller opens, the subscriptions it sends, and the callbacks the feed reaches.
tags: [okf, domains, socket-transport, oddshawk-sdk]
timestamp: 2026-11-13T18:02:00Z
---

# Socket transport

`src/socket.js`: the client over the live odds feed that the Client object holds — the session a caller opens, the subscriptions it sends, and the callbacks the feed reaches.

## Function

A caller opens the connection, sends the subscriptions and registers the callbacks; the session authenticates with the credential the client presents ([request-signing.md](request-signing.md)).

Once `connect()` opens the session it stays open for as long as the connection does, and a session opened again after a close is a further `connect()`. A subscription made before the session has confirmed still reaches the feed.

The feed reaches a caller through the four callbacks it registers: the initial dump, each later update, the connection's close, and a transport error.

A subscription on a connection that has closed is refused with an `Error`, and one made before `connect()` is refused with a `TypeError`.

The same surface serves a browser and Node.

## Place in the application

Socket transport is the live half of what Client holds: live odds reach a caller through it, while catalog reads and name resolution go through the sibling REST transport ([rest-transport.md](rest-transport.md)).

The socket protocol and its endpoint are the socket API's, served by `github:oddshawk/socket-api`.
