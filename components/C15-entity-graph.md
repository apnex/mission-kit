---
id: C15
category: component
title: entity-graph - synchronous in-memory reference indices and atomic cascade planning over entity-store
status: draft
hydrate-when: Your entities reference one another and you are about to maintain reverse indices, cascade deletes or check cross-entity invariants by hand
sovereignty: internal
supersedes: []
related: [C0, C3, C4, C6, P4, A1, A2, A3]
---

# C15 - entity-graph

Sovereignty is `internal`, so a fit gap here is pressure that routes upstream rather than a constraint a consumer works around.\
**Status is `draft`:** the repository `apnex/entity-graph` is scaffolded with its draft vision and contract, and awaits cold reading, director ratification and implementation before it is in force.

---

## Duty

Maintain an in-memory graph of declared references between typed entities, dated by the store position it reflects, and plan every edit with its cascades, reactions, result invariants and inverse into one atomic change.

That is the whole duty.\
It does not also persist an append-only log on disk, validate a single entity's own schema in isolation, route network messages, decide who is authorised to act, or compute domain geometry - each of those belongs to [`C4`](C4-entity-store.md), [`C3`](C3-shape-check.md), [`C1`](C1-agp.md), the application's policy, or [`C11`](C11-snap-grid.md) to [`C14`](C14-vector-scene.md).

---

## Contract

What a consumer will depend on once this draft is ratified and built, and what it may not reach past.

| surface | contract |
|---|---|
| graph declaration (`graph-declaration`) | each entity kind declares its closed-record shape (validated by [`C3`](C3-shape-check.md)) alongside its reference fields (`targetKinds`, `cardinality: "one" \| "many" \| "ordered"`, `onTargetDelete: "refuse" \| "cascade-delete" \| "unlink"`, optional `exclusivity: "refuse" \| "steal"`, optional `minTargets` with `onBelowMin: "refuse" \| "cascade-delete"`, and optional `acyclicity: true`) plus optional pure `reactions` and `{ key, measure, sentence }` result `invariants`; no kind is built in |
| dated graph view (`dated-graph-view`) | synchronous, side-effect-free in-memory lookup of entities and reverse incidence indices stamped with the store `position` they reflect: `position()`, `get(kind, id)`, `all(kind)`, `referrersOf(targetId, filter?)`, `targetsOf(id, field?)`, `ownerOf(memberId, containerKind)`, and `reachable(fromId, filter?)` |
| cascade and invariant planner (`plan-graph-change`) | `plan(intent)` runs purely on a scratch projection without mutating the live view: it expands declarative cascades (`cascade-delete`, `unlink`, `steal`, `onBelowMin`) and pure kind `reactions` to a fixed point, narrows update patches to changed keys, evaluates referential integrity and kind `invariants` on the resulting post-cascade state (refusing any edit that introduces a violation or increases an existing violation's `measure`, while permitting partial repairs), and returns `{ ok: true, position, writes, inverse }` or `{ ok: false, refusal }` |
| reversible history (`reversible-history`) | each planned transaction produces its exact `inverse` batch derived from the pre-state immediately before each forward write, and an optional bounded in-memory undo/redo stack (`undo`, `redo`) plans and applies the inverse through the same pipeline |
| positioned store sync (`positioned-graph-sync`) | `commit(intent, options)` submits `plan(intent)`'s expanded `writes` to [`C4`](C4-entity-store.md)'s atomic multi-entity `change` with `expectedRevision` guards and advances the in-memory graph to the committed `position`; `applyChange(changeRecord)` incrementally updates the in-memory entities and reverse indices from a [`C4`](C4-entity-store.md) or [`C6`](C6-entity-api.md) change stream in monotonic `position` order |

The declarative reference table and the pure per-kind `reactions` and result-`invariants` hooks are the extension seams: domain-specific graph constraints plug into `plan(intent)` as pure tenant rows ([`P4`](../patterns/P4-neutral-core-tenant-composition.md)) without adding domain kinds to the core.

---

## Reference

The sovereign repository `apnex/entity-graph` (`@apnex/entity-graph`), with its draft vision in `VISION.md`, its draft contract in `CONTRACT.md`, and its decision log in `docs/DECISIONS.md`.

Do not read the implementation to judge fit.\
If duty, contract and fit criteria are insufficient to decide, that is a defect in this entry.

---

## Fit criteria

### Does my project want this at all

Read this half first, before knowing anything about `entity-graph`.\
If none of it describes you, stop here.

- Your application stores typed entities that reference one another (links between nodes and waypoints, groups containing members, tasks depending on tasks), and callers need fast synchronous reverse lookups (`referrersOf`, `ownerOf`, `reachable`).
- Deleting or updating one entity must cascade to others (deleting incident links, stripping a waypoint from routes, stealing a member from a previous exclusive group, or dissolving a group whose members drop below two) in a single atomic change.
- You want the exact same pure `plan(intent)` function to drive both optimistic in-memory previews (and undo/redo) in a client and atomic commits on a host.

### Does it meet my requirement

- All graph traversals and cascade planning run synchronously in memory at a known store `position`.
- Referential integrity and custom invariants are checked once on the **resulting** state of a transaction (so a multi-op batch can pass through a transient state and end valid, and partial repairs are accepted).
- Every committed batch lands as one positioned `change` in [`C4`](C4-entity-store.md).

**It is the wrong tool when**

| you need | reach elsewhere, because `entity-graph` is |
|---|---|
| durable append-only log storage and history compaction on disk | not a durable store - it layers over [`C4`](C4-entity-store.md) |
| validating a single record's JSON fields against a schema | not a schema validator - it uses [`C3`](C3-shape-check.md) for per-record shapes |
| 2D grid snapping, pointer gesture recognition, or SVG scene rendering | not a geometry or rendering engine - reach for [`C11`](C11-snap-grid.md), [`C12`](C12-input-binding.md), [`C13`](C13-input-capture.md), or [`C14`](C14-vector-scene.md) |
| per-user or per-resource access-control grants | not an authorisation engine - enforce access policy in the application |

---

## Adjustment policy

Internal and sovereign, so a fit gap has somewhere to go.

1. **Record the gap where both sides can see it.** A reference-cascade or traversal requirement that `graph-declaration` and `plan-graph-change` cannot express is recorded against `entity-graph`'s contract while its design is being settled.
2. **Close it at a seam where one exists.** Domain rules that depend on non-reference fields (such as straight-link capacity between two nodes) plug in as pure `reactions` and `{ key, measure }` `invariants` on the kind's declaration row ([`P4`](../patterns/P4-neutral-core-tenant-composition.md)).
3. **Never fork.** Hand-rolling separate incremental reverse indices and cascade planners in client and server code re-creates the client/server drift this component eliminates.

---

## Edges

**Contains** - draft scaffold (`src/index.ts`); internal units (incremental index maintainer, dated graph view, scratch cascade planner, inverse builder, and store sync adapter) will be listed here once built and certified.

**Contained-by** - nothing; `entity-graph` is a top-level registered component.

**Consumes** - [`C3`](C3-shape-check.md) (`shape-check`) for declared shape validation and plain-data reading, and [`C4`](C4-entity-store.md) (`entity-store`) for atomic positioned multi-entity writes, expected-revision guards and ordered change streams ([`E5`](../entities/E5-system.md)).

**Consumed-by** - candidate for `drawv2` and `zorg` (`BL33`), which will use `entity-graph` through its declared contract once built ([`E5`](../entities/E5-system.md)).
