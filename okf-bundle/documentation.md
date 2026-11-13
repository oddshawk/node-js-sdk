---
type: Reference
title: Documentation
description: oddshawk-sdk's additions to the OddsHawk documentation standard.
tags: [okf, documentation, docblocks, oddshawk-sdk]
timestamp: 2026-11-14T09:55:00Z
---

# Documentation — oddshawk-sdk

The OddsHawk documentation standard `github:oddshawk/internal-documentation/okf-bundle/documentation.md` applies here. The additions below are all this repository makes to it.

## Additions

No generated reference is produced or published: no generator is configured and the package carries no generated artefact.

This repository is public and the applications that consume it are private, so no document here names a consumer. `dependencies.md` therefore carries no cross-repo consumers table: its rows name the consumer repositories, and a roster of who uses this package MUST NOT be published from this repository. Who consumes it is checked where that roster is already held.

## Consumer-facing documents

A customer reads the npm README ([../README.md](../README.md)) and the shipped sources their own program imports. Both name a provider only generically — the `provider` filter key and the matching helpers' `provider` argument — and name no bookmaker, and neither describes the feed's composition nor any per-provider branch of the API, which is maintainer-only material recorded in `github:oddshawk/rest-api/okf-bundle/application.md`. Neither carries an internal work reference. The README MUST carry the fields that pin a single event, the metered routes with an account's own usage and limits, and a marking of anything the API has not begun emitting as planned.

## Adversarial review

Additive to the acceptance bar in `github:oddshawk/internal-documentation/okf-bundle/documentation.md` § 3:

- The diff goes to a review subagent (`bugbot`, or a fresh review-only agent) when it touches `src/` or the public exports in `index.js`, when it changes authentication or hash generation (`generateHash`, the REST headers, the socket auth payload), or when a handoff changes more than five files.
- The reviewer receives the branch, the changed files and [testing.md](testing.md) § Commands.
- A critical or high finding blocks the handoff until it is resolved.
- The author does not review the diff in the same context that wrote it.
