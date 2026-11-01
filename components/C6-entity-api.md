---
id: C6
category: component
title: entity-api - host and client halves of the versioned entity protocol over operation-call
status: active
hydrate-when: You have an entity-store in one process and need callers in other processes to query, mutate or follow it by name without losing its guarantees
sovereignty: internal
supersedes: []
related: [C0, C3, C4, C5, A1, A3]
---

# C6 - entity-api

Sovereignty is `internal`, so a fit gap here is pressure that routes upstream rather than a constraint a consumer works around.

---

## Duty

Serve an [`entity-store`](C4-entity-store.md) as named operations and present a remote client with the same store guarantees across the network.

That is the whole duty.\
It does not also store entities itself, pair low-level call messages, decide who is authorised to act, define application entity kinds, or replicate between stores - each of those belongs to [`C4`](C4-entity-store.md), [`C5`](C5-operation-call.md), [`C7`](C7-caller-identity.md), or the application.

At the altitude below this one it is three units in its anchored core, listed under `Edges`.\
That is the anchored core of one box, per [`C0`](README.md#duty-is-singular-at-an-altitude), not three duties.

---

## Contract

What a consumer depends on, and what it may not reach past.

| surface | contract |
|---|---|
| host half (`serveStore`) | exposes a [`C4`](C4-entity-store.md) store over [`C5`](C5-operation-call.md) as named operations (`create`, `read`, `find`, `update`, `delete`, `history-bound`, `changes`, `follow`) under the application's store name, asks the application's `policy` before every operation with the caller's identity evidence from [`C7`](C7-caller-identity.md), stamps every write with the `writer` the policy named (never one the client claimed), and closes any active `follow` stream as soon as its call ends |
| client half (`createStoreClient`) | gives application logic a store client (`create`, `read`, `find`, `update`, `delete`, `historyBound`, `changes`, `follow`) addressed by store name and optional host instance, keeping one caller-chosen deadline across all pages of a multi-page `find`, forwarding the caller's `invocation` identity as the store's `writeId` so repeated writes are recognised end to end, and returning [`C4`](C4-entity-store.md)'s positions and refusals intact |
| deferred surface | `dated-local-view` (an optional client-side cached projection that states the position it reflects) is declared in `CONTRACT.md` and recorded as deferred in `export-map.json` until a long-lived stateful client needs it |

The policy callback and the kind table are the two seams: a new application supplies its own `kinds` and its own `policy` to `serveStore` and `createStoreClient` with zero changes to `entity-api`.

---

## Reference

The sovereign repository `apnex/entity-api` (`@apnex/entity-api`), with its vision in `VISION.md`, its contract in `CONTRACT.md`, and its machine-checked surface in `export-map.json`.

The contract and export map state what is served now, so this reference stays true without a version recorded here.\
Where `export-map.json` lists a deferred row under `deferred`, that row and the ruling that parked it are explicit in the file.

Do not read the implementation to judge fit.\
If duty, contract and fit criteria are insufficient to decide, that is a defect in this entry.

---

## Fit criteria

### Does my project want this at all

Read this half first, before knowing anything about `entity-api`.\
If none of it describes you, stop here.

- You keep state in [`C4`](C4-entity-store.md) and processes other than the host need to read, write, query or follow that store over [`C5`](C5-operation-call.md) and [`C1`](C1-agp.md).
- You are about to write RPC operation declarations, pagination loops, stream teardown, or policy hooks around an entity store by hand.

### Does it meet my requirement

- Every remote read, find, change page and follow event must preserve the store's `position`, revision conflict checks, repeat recognition, and `"left"` notifications when an entity leaves a followed filter.
- The host application decides who may call each operation and what writer name is recorded, based on peer evidence rather than client self-assertion.

**It is the wrong tool when**

| you need | reach elsewhere, because `entity-api` is |
|---|---|
| an in-process store with no remote callers | not needed - embed [`C4`](C4-entity-store.md) directly |
| general RPC operations that are not entity-store actions | not a general RPC layer - declare them directly on [`C5`](C5-operation-call.md) |
| proving who a remote caller is | not an identity verifier - compose `serveStore`'s policy with [`C7`](C7-caller-identity.md) |
| a command-line interface for human or agent shell use | not a CLI - build the CLI on [`C9`](C9-operation-command.md) calling `createStoreClient` |

---

## Adjustment policy

Internal and sovereign, so a fit gap has somewhere to go.

1. **Record the gap where both sides can see it.** Any store guarantee that fails to survive `serveStore` and `createStoreClient` is a defect against `entity-api`'s contract.
2. **Close it at a seam where one exists.** Application kinds, store names and authorisation policies are injected at construction; `dated-local-view` is already designed and parked in `CONTRACT.md` for when a long-lived client needs it.
3. **Never fork.** Writing a project-specific RPC wrapper around [`C4`](C4-entity-store.md) is the duplication this component replaces.

---

## Edges

**Contains** - three internal units in its anchored core: store operation declarations and schemas (`store-operations`), the host half (`host`), and the client half (`client`).

**Contained-by** - nothing; `entity-api` is a top-level registered component.

**Consumes** - [`C4`](C4-entity-store.md) (`entity-store`), [`C5`](C5-operation-call.md) (`operation-call`), and [`C3`](C3-shape-check.md) (`shape-check`) through their declared contracts ([`E5`](../entities/E5-system.md)).

**Consumed-by** - `zorg` (`@apnex/zorg-hub` and `@apnex/zorg-sdk`), which uses `entity-api` through its declared contract without containing it ([`E5`](../entities/E5-system.md)).
