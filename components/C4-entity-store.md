---
id: C4
category: component
title: entity-store - versioned typed entity storage on an append-only change log
status: active
hydrate-when: You are about to store typed records that multiple writers update and readers query or follow by position since they last looked
sovereignty: internal
supersedes: []
related: [C0, C3, C6, A1, A3]
---

# C4 - entity-store

Sovereignty is `internal`, so a fit gap here is pressure that routes upstream rather than a constraint a consumer works around.

---

## Duty

Keep a shared set of typed, tagged entities in a single monotonic change order so any reader can query current state or catch up from a position.

That is the whole duty.\
It does not also listen on a network, push notifications to unasked parties, track reader cursors, join across entities, rank free-text search, or decide who may write - each of those belongs to another component or to the embedding application.

At the altitude below this one it is nine units in its anchored core, listed under `Edges`.\
That is the anchored core of one box, per [`C0`](README.md#duty-is-singular-at-an-altitude), not nine duties.

---

## Contract

What a consumer depends on, and what it may not reach past.

| surface | contract |
|---|---|
| construction and kinds | `openEntityStore(options)` opens a store over caller-supplied `kinds` (each validated as a closed-record shape by [`C3`](C3-shape-check.md)), a `historyBound` (count of changes or duration), and a storage port |
| positioned writes | `create`, `update` and `delete`, and `change` for a change of many writes, validate each body against its kind, assign each committed change one strictly increasing integer `position`, stamp `created` and `changed` provenance (`position`, UTC millisecond `at`, and the application-supplied `writer`), and return the committed envelope(s) with that position |
| change of many writes | `change({ writes, expectedPosition?, note? }, { writer, writeId })` applies 1 to 2,000 writes, each `{ operation, input }` - a create, an update or a delete with the input its single operation takes - all or nothing at one position; no two writes may target one entity, by identity or by kind and name (`duplicate-target`); each write is judged as its single operation judges it, against the state the writes before it leave, and one refusal refuses the whole change, naming the write by its `index`, counting from 0; an entity it creates takes the identity `e<position>.<place>`, `place` counting from 1; its change record is at most 8,388,608 bytes (8 MiB) of canonical JSON (`change-too-large`); it answers `{ position, writes }`, one `{ entity }` or `{ deleted }` per write in the order given; and `changes` and `follow` give one item per write, a page holding such a change can be far larger than its record, each delete's item repeating the writer, and is calculated at worst to stay within the 16 MiB a carrier admits |
| optimistic concurrency | an `update` or `delete` naming `expectedRevision` succeeds only when the entity's current revision matches, refusing a concurrent move with `revision-conflict` and the current envelope; a unique `name` collision refuses with `name-taken`; a `change` naming `expectedPosition`, the store position its writer last saw, is refused as `position-moved`, naming the position expected and the store's, when the store's position is any other, repeat recognition being decided first |
| repeat recognition | a write carrying a caller-supplied `writeId` (`repeat-recognition`) repeated within `historyBound` with the same digest returns the original answer and takes no second position; reusing a `writeId` with different input refuses with `write-id-conflict`; a `change` is one request, its note included, and `checkRepeat("change", input, write)` asks without making the change |
| note on a change | a `change` may carry a `note`, plain JSON the store never interprets, read through [`C3`](C3-shape-check.md)'s `readPlainJson`, nesting at most 16 levels (`note-too-deep`) and at most 524,288 bytes (512 KiB) of canonical UTF-8 JSON (`note-too-large`), refused as `note-not-plain` when it is not plain JSON and as `note-unsafe-number`, naming where, when it holds an integer more than 9007199254740991 from zero; it is kept in canonical form in the change record and its digest, forgotten with the change once the history bound passes it, and carried once, on the first of the change's items, in `changes` and `follow` |
| reads and paged find | `read` looks up by `id` (`e<position>.<place>`) or `name` and reports the store `position` it reflects; `find` filters by `kind` and all required `tags` in deterministic identity order with cursor pagination |
| catch-up and follow | `historyBound()` reports the earliest position still held and the current position; `changes(since, filter?)` returns ordered change pages (including `"left"` notifications when an updated or deleted entity leaves a narrowed kind/tag set) or refuses with `position-evicted` when `since` has fallen behind the bound; `follow(since, filter?)` yields existing and live changes as an async iterable |
| bounded compaction and storage port | changes older than `historyBound` are compacted out of active memory and the active log into a base snapshot (with optional archive rotation on the storage port) so memory, active log size and restart work follow live entities plus `historyBound` rather than total store age; `createMemoryStoragePort` and `@apnex/entity-store/file-storage`'s `createFileStoragePort` implement the storage port; a change record holds a `note` only when its change has one, so a log or archive written before the note reads unchanged, while a log holding a record `change` wrote is refused as `log-corrupt` by any release before `change`, so a store goes back to such a release only from a log no `change` has written to |
| contract suite | `@apnex/entity-store/contract-suite` exports `registerEntityStoreSuite`, which runs the store's guarantee checks against any `EntityStore` or remote client projection; it holds no case of `change`, `expectedPosition` or the note, which are this component's own tests |

The storage port and the kind table are the two extension seams: new durability backends implement the storage port, and new record shapes are passed as `kinds` data at `openEntityStore`.

---

## Reference

The sovereign repository `apnex/entity-store` (`@apnex/entity-store`), with its vision in `VISION.md`, its contract in `CONTRACT.md`, and its machine-checked surface in `export-map.json`.

Releases are published only by its own CI, as a tarball attached to a GitHub release at `https://github.com/apnex/entity-store/releases`, and a published release is never replaced, so a fix is a new version.\
A consumer names the release file in its `package.json`, and its lockfile pins the file's hash.

The contract and export map state what is served now, so this reference stays true without a version recorded here.\
Where `export-map.json` records `deferred: {}`, current and target have not diverged.

Do not read the implementation to judge fit.\
If duty, contract and fit criteria are insufficient to decide, that is a defect in this entry.

---

## Fit criteria

### Does my project want this at all

Read this half first, before knowing anything about `entity-store`.\
If none of it describes you, stop here.

- Your application keeps a shared collection of small typed records that multiple agents or processes read and write.
- Readers need to know how current their view is (`position`) and ask *"what changed since position N?"* without missing an entity that was deleted or retagged out of their filter.
- Writers retrying after a lost network reply must not apply the same write twice, and concurrent writers must not silently overwrite each other's changes.

### Does it meet my requirement

- Lookup is by identity, unique name, or kind and tags.
- Every kind's body is a closed-record JSON shape that [`C3`](C3-shape-check.md) can validate.
- History retention is bounded by a configured window (`historyBound`), and readers behind that window are told `position-evicted` rather than handed partial state.

**It is the wrong tool when**

| you need | reach elsewhere, because `entity-store` is |
|---|---|
| serving the store to callers in other processes over a network | not a network service - compose it with [`C6`](C6-entity-api.md) over [`C5`](C5-operation-call.md); `C6` carries `change` and `expectedPosition` to remote callers only once it adds them, while a note reaches remote readers on the `changes` and `follow` it serves once it runs a release that has the note |
| relational joins, graph traversal, or free-text ranking | not a relational, graph, or search engine |
| large blobs or document files | not a blob store - keep large payloads elsewhere and store pointers |
| deciding which principal is allowed to write | not an authority - check policy before calling and pass the verified writer name in |

---

## Adjustment policy

Internal and sovereign, so a fit gap has somewhere to go.

1. **Record the gap where both sides can see it.** A storage or query requirement that cannot be expressed through `openEntityStore` is recorded against `entity-store`'s contract.
2. **Close it at a seam where one exists.** A new persistence backend implements the storage port and is proved by `@apnex/entity-store/contract-suite`; a new record type is a kind declaration. Neither changes the store core.
3. **Otherwise adjust upstream, or fracture.** Never fork a local store copy.

---

## Edges

**Contains** - nine internal units in its anchored core: store engine (`entity-store`), change log and compaction (`change-log`), input validator (`operation-inputs`), refusal builder (`store-refusal`), SHA-256 digest (`sha256`), store types (`store-types`), storage port with memory implementation (`memory-storage`), file-log adapter (`file-storage-adapter`, which `implements` the storage port), and the reusable contract suite (`contract-suite`).

**Contained-by** - nothing; `entity-store` is a top-level registered component.

**Consumes** - [`C3`](C3-shape-check.md) (`shape-check`), for closed-record validation of entity bodies and plain-data reading of caller inputs and storage records ([`E5`](../entities/E5-system.md)).

**Consumed-by** - [`C6`](C6-entity-api.md) (`entity-api`), [`C15`](C15-entity-graph.md) (`entity-graph`, a draft not yet released, whose store port, the part that uses `entity-store`, is not yet built), and `zorg` (`@apnex/zorg-hub`), which use `entity-store` through its declared contract without containing it ([`E5`](../entities/E5-system.md)).
