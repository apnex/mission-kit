---
id: C15
category: component
title: entity-graph - entities held to references and rules declared once, with dated answers and whole, undoable edits
status: draft
hydrate-when: Your entities reference one another and you are about to maintain reverse indices, cascade deletes or check cross-entity invariants by hand
sovereignty: internal
supersedes: []
related: [C0, C1, C3, C4, C5, C6, C11, C12, C13, C14, P4, E5, A1, A2, A3]
---

# C15 - entity-graph

Sovereignty is `internal`, so a fit gap here is pressure that routes upstream rather than a constraint a consumer works around.

**Status is `draft`, registered before it is usable under mission-kit's decision `0116` (`docs/DECISIONS.md`).**\
The repository `apnex/entity-graph` holds a ratified vision, a draft contract and no code; its design is owed by a separate engineering effort, and it awaits design and implementation.\
Nothing here is in force, and no consumer depends on it yet.\
Meanwhile, a project that cannot wait may build a stopgap behind its own boundary, or keep the implementation it already has, on three terms (`0117`): it records the requirement against `entity-graph`'s contract (*Adjustment policy*, step 1), it does not grow the stopgap into a variant of `entity-graph`, and it moves onto `entity-graph` once it is usable.

---

## Duty

Keep an application's entities true to the references and rules it declares once, answering who refers to what as of a known position and landing every edit, with all its consequences, whole or not at all and undoably.

That is the whole duty: answering, planning and undoing are one concern here because each works from the same declaration and the same dated view of it, and whether they stay one component is owed by the design effort.\
It does not also keep the durable record ([`C4`](C4-entity-store.md)), judge one entity's own shape ([`C3`](C3-shape-check.md)), carry edits or changes between processes ([`C6`](C6-entity-api.md), [`C5`](C5-operation-call.md), [`C1`](C1-agp.md)), decide who may make an edit (the application's policy), or own grid arithmetic ([`C11`](C11-snap-grid.md)), input ([`C12`](C12-input-binding.md), [`C13`](C13-input-capture.md)) or drawing ([`C14`](C14-vector-scene.md)).

---

## Contract

What a consumer will depend on once this draft is ratified and built, stated at the level its vision commits to, and what it may not reach past.

| surface | contract |
|---|---|
| graph declaration (`graph-declaration`) | each kind the application declares states in one place, and as data wherever data can say it, the shape of its own records (judged by [`C3`](C3-shape-check.md)), the references it holds with the rules on each, any condition over its entities as a whole, and any consequence of its own that the reference rules cannot express; every answer and every plan works from that one declaration, and no kind or rule is built in |
| dated graph view (`dated-graph-view`) | answers what an entity refers to, what refers to it, and what can be reached from it by following references, each answer stating the store `position` it reflects and true of the entities as they stood there; asking changes nothing, and an edit that has not landed never appears in an answer; what a planned edit would do is shown apart, stating the position it was planned from |
| change planner (`plan-graph-change`) | given an edit - any set of creations, changes and removals asked for together - shows everything it would do, its consequences included, or refuses it, naming the rule it would break, the entity concerned and the part of the edit that led there; the edit is judged on the state it would leave, no edit may leave a rule more broken than it found it, a partial repair is allowed, and planning changes no answer |
| reversible history (`reversible-history`) | an edit that has landed can be undone by a later edit that restores every entity it changed, its consequences included, as it was before; whether that includes an entity's identity after undoing its deletion is design owed; an undo is an edit like any other and keeps every commitment of the change planner and positioned store sync rows |
| positioned store sync (`positioned-graph-sync`) | a planned edit lands in [`C4`](C4-entity-store.md) whole or not at all, and an edit that does not land leaves every answer as it was; every change that reaches the store, by any path, is taken in from [`C4`](C4-entity-store.md) or through [`C6`](C6-entity-api.md) in `position` order, so every answer stays true at the position it reports |

**Design owed, so not yet contract.**\
How each row is achieved is the design effort's, and `entity-graph`'s `CONTRACT.md` lists what is open under *Design owed*.\
Five open points change what a consumer can plan on: how a host lands an edit whole, how a client that reaches the store only through [`C6`](C6-entity-api.md) lands one, how an entity's identity survives undoing its deletion (`C4` forms each identity from the position that created it), how concurrent conflicting edits are resolved, and whether this scope stays one component or splits into a change planner, an entity view and change undo.\
The reference options, lookup methods, invariant shape, how brokenness is measured, and the planning mechanism of the earlier draft are kept there as input to the design, not as contract.

The declaration is the extension seam: a domain rule over entities plugs in as a condition or consequence declared on its kind, as a tenant row ([`P4`](../patterns/P4-neutral-core-tenant-composition.md)), without adding a domain kind to the core.

---

## Reference

The sovereign repository `apnex/entity-graph` (`@apnex/entity-graph`), with its vision in `VISION.md`, ratified under its ruling `D7`, its draft contract of record in `CONTRACT.md`, and its rulings in `docs/DECISIONS.md`.

Nothing is released and the repository holds no code, so there is no `export-map.json` and nothing to pin.\
Once built, its contract and export map state what is served, as for [`C4`](C4-entity-store.md), and this reference stays true without a version recorded here.

Do not read the implementation, once there is one, to judge fit.\
If duty, contract and fit criteria are insufficient to decide what they do commit to, that is a defect in this entry; what is design owed is listed as such, not missing.

---

## Fit criteria

### Does my project want this at all

Read this half first, before knowing anything about `entity-graph`.\
If none of it describes you, stop here.

- Your application keeps entities that point at one another - links at the nodes they join, groups at their members, tasks at the tasks they wait on - and parts of it must ask what points at an entity without reading every record.
- An edit to one entity must carry its consequences to others - removing the links that join a deleted node, taking a member from the group it leaves, dissolving a group left too small - and a reader must never see those consequences land apart from the edit.
- The same rule is about to be written in more than one place: into each operation, once for single edits and again for loading a whole set, or once for a preview and again for the commit.

### Does it meet my requirement

- Every answer about who refers to what states the store position it reflects.
- An edit is judged on the state it would leave, so a set of changes may pass through a state that would be wrong on its own and still be allowed, and a partial repair is accepted.
- An edit lands whole or not at all, and a refusal names the rule, the entity and the part of the edit that led there.
- An edit that landed can be undone, and the undo is held to the same rules.

**It is the wrong tool when**

| you need | reach elsewhere, because `entity-graph` is |
|---|---|
| durable storage of entities, positions and history | not the record - it sits over [`C4`](C4-entity-store.md) |
| judging one record's own fields against its kind's shape | not a judge of one entity's shape - that is [`C3`](C3-shape-check.md)'s |
| carrying edits, changes or calls between processes | not a network service - reach for [`C6`](C6-entity-api.md), [`C5`](C5-operation-call.md) or [`C1`](C1-agp.md) |
| a query language, pattern matching, ranking, or deciding what to do first | not a query engine or scheduler - build those in the application from its answers |
| refusing writes that reach the store without passing through it | not a gate on other writers - route every write through it, or guard the store |
| grid arithmetic, input meaning or capture, or drawing | not the owner of geometry, input or drawing - reach for [`C11`](C11-snap-grid.md) for grid arithmetic, [`C12`](C12-input-binding.md) and [`C13`](C13-input-capture.md) for input, or [`C14`](C14-vector-scene.md) for drawing |
| deciding who may make an edit | not an authority - the application's policy decides before it asks |

---

## Adjustment policy

Internal and sovereign, so a fit gap has somewhere to go.

1. **Record the gap where both sides can see it.** A requirement the contract does not yet state is recorded in `entity-graph`'s `CONTRACT.md` under *Design owed* while its design is being settled, and as a ruling in its `docs/DECISIONS.md` once decided.
2. **Close it at a seam where one exists.** A domain rule that spans entities and depends on what the reference rules do not model - such as straight-link capacity between two nodes, which counts the links between them and may read where the nodes sit, with any grid arithmetic left to [`C11`](C11-snap-grid.md) - plugs in as a condition or consequence declared on the kind ([`P4`](../patterns/P4-neutral-core-tenant-composition.md)); a rule on one record's own fields belongs to its kind's shape, judged by [`C3`](C3-shape-check.md), or to the application where a shape cannot state it.
3. **Never fork.** A stopgap built while `entity-graph` is unusable is recorded and retired, never grown into a variant of it (`0117`), and every project moves onto `entity-graph` once it is usable; copies in client and server code re-create the drift between copies that this component exists to remove.

---

## Edges

**Contains** - nothing yet; its internal units are listed here once designed, built and certified.

**Contained-by** - nothing; `entity-graph` is a top-level registered component.

**Consumes** - [`C3`](C3-shape-check.md) (`shape-check`) for declared shape validation and plain-data reading, [`C4`](C4-entity-store.md) (`entity-store`) for positioned writes, expected-revision guards and the ordered change stream, and [`C6`](C6-entity-api.md) (`entity-api`) for the change stream of a view kept in a client ([`E5`](../entities/E5-system.md)).\
Its dated view may overlap `C6`'s deferred `dated-local-view`, an open finding for the registry recorded as `B106` in mission-kit's `docs/BACKLOG.md`.

**Consumed-by** - candidates `drawv2` and `zorg` (`zorg`'s `BL33`), which will use `entity-graph` through its declared contract once it is built ([`E5`](../entities/E5-system.md)).
