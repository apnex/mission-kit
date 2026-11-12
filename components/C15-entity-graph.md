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
The repository `apnex/entity-graph` holds a ratified vision, a draft contract, and code on `main` built through the first four milestones of its build plan (`docs/BUILD-PLAN.md`): `dated-graph-view`, `graph-declaration` and `plan-graph-change` are served, in memory, and `reversible-history` and `positioned-graph-sync` are deferred to later milestones, as its `export-map.json` records (`entity-graph`'s `D10`, `D15`, `D20`, `D26`).\
Nothing is released, so no consumer can take it yet, and what its design still owes is listed in its contract under *Design owed*.\
Nothing here is in force, and no consumer depends on it yet.\
Meanwhile, a project that cannot wait may build a stopgap behind its own boundary, or keep the implementation it already has, on three terms (`0117`): it records the requirement against `entity-graph`'s contract (*Adjustment policy*, step 1), it does not grow the stopgap into a variant of `entity-graph`, and it moves onto `entity-graph` once it is usable.\
`drawv2`, keeping its own planner on those terms, has recorded its requirements in `entity-graph`'s contract, ruled by the director and co-signed with zorg (`entity-graph`'s `D8` and `D9`); the rows below state them at this entry's level.

---

## Duty

Keep an application's entities true to the references and rules it declares once, answering who refers to what as of a known position and landing every edit, with all its consequences, whole or not at all and undoably.

That is the whole duty: answering, planning and undoing are one concern here because each works from the same declaration and the same dated view of it, and whether they stay one component is owed by the design effort.\
It does not also keep the durable record ([`C4`](C4-entity-store.md)), judge one entity's own shape ([`C3`](C3-shape-check.md)), carry edits or changes between processes ([`C6`](C6-entity-api.md), [`C5`](C5-operation-call.md), [`C1`](C1-agp.md)), decide who may make an edit (the application's policy), or own grid arithmetic ([`C11`](C11-snap-grid.md)), input ([`C12`](C12-input-binding.md), [`C13`](C13-input-capture.md)) or drawing ([`C14`](C14-vector-scene.md)).

---

## Contract

What a consumer will depend on once this draft is ratified, built and released, stated at the level its vision commits to, and what it may not reach past.

| surface | contract |
|---|---|
| graph declaration (`graph-declaration`) | each kind the application declares states in one place, and as data wherever data can say it, the shape of its own records (judged by [`C3`](C3-shape-check.md)), the references it holds with the rules on each - including what becomes of a target once nothing refers to it (`onUnreferenced`) - any condition over its entities that a shape cannot state, any consequence of its own that the reference rules cannot express, each with a trigger stated as data and one of the phases the application declares, and optionally a resolver that rewrites a requested item against the edit so far (`intentResolver`); every answer and every plan works from that one declaration, and no kind, rule or phase is built in |
| dated graph view (`dated-graph-view`) | answers what an entity refers to, what refers to it, and what can be reached from it by following references, each answer stating the store `position` it reflects and true of the entities as they stood there; asking changes nothing, and an edit that has not landed never appears in an answer; what a planned edit would do is shown apart, stating the position it was planned from |
| change planner (`plan-graph-change`) | given an edit - any set of creations, changes and removals asked for together, with an optional plain-JSON `context` its consequences may read - shows everything it would do, its consequences included, or refuses it in the shared refusal form, naming the rule it would break, the entity concerned and the part of the edit that led there, its `details` being `{ ruleKey, subject, measure, opIndex, sentence, writers? }`, where `writers` names the two consequences of a conflict, the consequence or reference rule whose write a breach of a reference rule or a shape follows from, and the consequences and rules that wrote a broken condition's subject, and is omitted when a requested item alone wrote the entity concerned (`entity-graph`'s `D23`, `D25`, `D30`); consequences follow one stopping rule - the reference rules to a fixed point, then each declared phase once in order with the reference rules again after it, a finished phase never re-entered - and two consequences writing one entity in one phase is a fault; every entity a consequence writes is held to the rules a requested write of it meets; the edit is judged on the state it would leave, no edit may leave a rule more broken than it found it, a partial repair is allowed, and planning changes no answer |
| reversible history (`reversible-history`) | an edit that has landed can be undone by a later edit that restores every entity it changed, its consequences included, as it was before; undo and redo replay the reversal recorded when the edit landed, without working its consequences out again, and are judged and land like any other edit, keeping every commitment of the change planner and positioned store sync rows; the undo record is kept in the note on the store's change, an edit whose record would not fit that note is refused, and the history is bounded as the application states, by count, bytes and a pinning predicate; whether restoring includes an entity's identity after undoing its deletion is design owed |
| positioned store sync (`positioned-graph-sync`) | a planned edit lands in [`C4`](C4-entity-store.md), or in any store behind a port shaped by [`C4`](C4-entity-store.md)'s capabilities, whole or not at all, guarded by the position it was planned from, and an edit that does not land leaves every answer as it was; every change that reaches the store, by any path, is taken in from the store or through [`C6`](C6-entity-api.md) in `position` order, so every answer stays true at the position it reports |

**Design owed, so not yet contract.**\
How each row is achieved is the design effort's, and `entity-graph`'s `CONTRACT.md` lists what is open under *Design owed*.\
Five open points change what a consumer can plan on: how a host lands an edit whole, how a client that reaches the store only through [`C6`](C6-entity-api.md) lands one, how an entity's identity survives undoing its deletion (`C4` forms each identity from the position that created it), how concurrent conflicting edits are resolved, and whether this scope stays one component or splits into a change planner, an entity view and change undo.\
The draft proposes answers to four of them, each awaiting a ruling: an edit lands through `C4`'s change of many writes; an application that names its own entities keeps their identity across undo; the position an edit was planned from refuses it once the store has moved, and its caller plans it again; and the scope stays one component.\
The lookup methods and the rest of the earlier draft's mechanism are kept there as input to the design, not as contract; the reference options, the refusal record and how brokenness is measured are drafted in its *Terms of the rows*, with its *Acceptance* stating what an implementation must pass.

The declaration is the extension seam: a domain rule over entities plugs in as a condition or consequence declared on its kind, as a tenant row ([`P4`](../patterns/P4-neutral-core-tenant-composition.md)), without adding a domain kind to the core.

---

## Reference

The sovereign repository `apnex/entity-graph` (`@apnex/entity-graph`), with its vision in `VISION.md`, ratified under its ruling `D7`, its draft contract of record in `CONTRACT.md`, its rulings in `docs/DECISIONS.md`, its build plan in `docs/BUILD-PLAN.md`, and its machine-checked surface in `export-map.json`, which records what is served and what is deferred.

Nothing is released, so there is no release to take and nothing to pin.\
Once released, its contract and export map state what is served, as for [`C4`](C4-entity-store.md), and this reference stays true without a version recorded here.

Do not read the implementation to judge fit.\
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

**Contains** - the units built so far, in its anchored core: declaration checker (`declaration`), dated view and the scratch layer an edit is planned on (`view`, `scratch`), reference index (`references`), reference rules (`reference-rules`), planner and the item it applies (`planner`, `items`), the application's consequences and conditions (`phases`), intent resolvers (`resolvers`), the reader handed to consequences and conditions (`reader`), refusal builder (`refusal`), plain-member reader (`plain-members`), and the graph itself (`entity-graph`).\
The build plan's `history` and `sync` modules and its `entity-store` adapter, which serve the deferred rows, are not built.

**Contained-by** - nothing; `entity-graph` is a top-level registered component.

**Consumes** - [`C3`](C3-shape-check.md) (`shape-check`) for declared shape validation and plain-data reading, taken as its release file; and, through the deferred rows, not yet built, [`C4`](C4-entity-store.md) (`entity-store`) for positioned writes, expected-revision guards, the ordered change stream and the note on a change that keeps undo's records, through a store port of which it is the reference provider, and [`C6`](C6-entity-api.md) (`entity-api`) for the change stream of a view kept in a client ([`E5`](../entities/E5-system.md)).\
Its dated view may overlap `C6`'s deferred `dated-local-view`, an open finding for the registry recorded as `B106` in mission-kit's `docs/BACKLOG.md`.

**Consumed-by** - candidates `drawv2` and `zorg` (`zorg`'s `BL33`), which will use `entity-graph` through its declared contract once it is released ([`E5`](../entities/E5-system.md)).
