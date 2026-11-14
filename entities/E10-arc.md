---
id: E10
category: entity
title: arc - a bounded, multi-step initiative that advances toward a declared target across gated steps, and its two representations
status: active
hydrate-when: You are about to write or read the word arc across layers, or to reconcile its value-chain and coordination-substrate meanings
supersedes: []
related: [E7, E8, E9, R1, W17, W18, W19, W21, K6, K16, K18, K23, K24, K25, K26, AR2]
---

# E10 - arc

## Definition

An **arc** is a bounded, multi-step initiative that advances a system from its current state toward a declared target across gated steps, steered as one whole and closed only when terminal proof is reconciled across the steps that compose it.

In this corpus the word names one concept carried in two layer-specific representations:

- **As a staged value-chain tree** ([`K6`](../skills/K6-arc-lifecycle.md), [`K16`](../skills/K16-model-an-arc.md)): a fixed summit (the global target) climbed by a tree of rungs and steps, each carrying a lifecycle state, dependency edges, and anti-amnesia revival triggers for deferred rungs.
- **As a coordination-substrate execution graph** ([`E9`](E9-substrate.md), [`W17`](../work-types/W17-author-closeout-packet.md), [`W18`](../work-types/W18-seed-a-blueprint-arc.md), [`W19`](../work-types/W19-drive-an-arc.md), [`W21`](../work-types/W21-arc-repair.md), [`K18`](../skills/K18-workgraph-arc-operator.md), [`K23`](../skills/K23-workgraph-arc-closeout.md)-[`K26`](../skills/K26-workgraph-arc-planning.md)): an instantiated graph of work items and [gates](E7-gate.md) seeded from a blueprint on the coordination substrate, operated under a driver lease, and closed by a proof-level closeout packet.

Both representations describe the same entity at different stages of binding: the value-chain tree orders and gates the rungs toward a summit whether or not a coordination substrate is running, and the blueprint graph is how that staged initiative is instantiated and run on [`E9`](E9-substrate.md).

---

## Discriminators

**Against a single unit of work.**\
A unit of work is one claimable node or step - a single `(role, work-type, domain)` triple under [`W0`](../work-types/README.md) or one rung in [`K6`](../skills/K6-arc-lifecycle.md).\
An arc is the multi-unit whole that orders, gates, and reconciles several units of work toward one target; [`R1`](../roles/R1-architect.md) holds authority to seed, drive, and repair that multi-unit flow ([`W18`](../work-types/W18-seed-a-blueprint-arc.md), [`W19`](../work-types/W19-drive-an-arc.md), [`W21`](../work-types/W21-arc-repair.md)).

**Against a delta.**\
A [delta](../artifacts/AR2-delta.md) (`AR2`) is the lifecycle document type that declares and gates one architectural transition between two [`AR1`](../artifacts/AR1-system-architecture.md) states.\
An arc is the staged operational execution - across rungs or substrate work items - that carries out a transition and reconciles its terminal [evidence](E8-evidence.md) at closeout ([`W17`](../work-types/W17-author-closeout-packet.md)).

**Between its two representations.**\
When a sentence in [`skills/`](../skills/README.md) or [`work-types/`](../work-types/README.md) names rungs, a summit, or an FSM-gated JSON store without the coordination substrate, it refers to the value-chain representation ([`K6`](../skills/K6-arc-lifecycle.md), [`K16`](../skills/K16-model-an-arc.md)).\
When a sentence names blueprints, work items, driver leases, `SEAL` gates, or [`W18`](../work-types/W18-seed-a-blueprint-arc.md), [`W19`](../work-types/W19-drive-an-arc.md), or [`W21`](../work-types/W21-arc-repair.md), it refers to the coordination-substrate representation on [`E9`](E9-substrate.md) ([`K18`](../skills/K18-workgraph-arc-operator.md), [`K23`](../skills/K23-workgraph-arc-closeout.md)-[`K26`](../skills/K26-workgraph-arc-planning.md)).

---

## Boundaries

- **Not a standing backlog or board.** A [backlog](../artifacts/AR5-backlog.md) (`AR5`) holds deferred findings with revival triggers, and a [board](../artifacts/AR3-board.md) (`AR3`) triages legal next moves; an arc is bounded work under active or parked execution toward a specific target, and it closes when that target is proved.
- **Not the coordination substrate itself.** The [substrate](E9-substrate.md) (`E9`) is the persistent machinery that hands out, runs, and gates work; an arc is one bounded initiative running on it or managed through [`K6`](../skills/K6-arc-lifecycle.md).
- **Not an open-ended cadence.** A recurring review or scheduled job has no terminal summit or closeout proof; an arc exists to reach a stated target and close.

---

## Relations

| Edge | Target | Reading |
|---|---|---|
| gated by | [`E7`](E7-gate.md) | each rung or work item in an arc advances only when its gates pass |
| closed on | [`E8`](E8-evidence.md) | terminal closeout reconciles verifier and machine evidence across the arc's steps |
| runs on | [`E9`](E9-substrate.md) | when executed on the coordination substrate, an arc is an instantiated blueprint graph of work items |
| steered by | [`R1`](../roles/R1-architect.md) | the architect seeds (`W18`), drives (`W19`), and repairs (`W21`) multi-unit arcs |
| closed by | [`W17`](../work-types/W17-author-closeout-packet.md) | proof-level arc closeout reconciles terminal truth across the arc |
| instantiated by | [`W18`](../work-types/W18-seed-a-blueprint-arc.md) | seeds a staged arc from a blueprint on the coordination substrate |
| operated by | [`W19`](../work-types/W19-drive-an-arc.md) | drives an arc across its lifetime above a single work item |
| repaired by | [`W21`](../work-types/W21-arc-repair.md) | repairs an arc's topology in place when a gate fails or scope changes |
| value-chain form in | [`K6`](../skills/K6-arc-lifecycle.md) | operates an arc as a sovereign FSM-gated tree of rungs climbing a summit |
| modelled in | [`K16`](../skills/K16-model-an-arc.md) | composes the six SysML v2 primitives to model an arc |
| substrate form in | [`K18`](../skills/K18-workgraph-arc-operator.md), [`K23`](../skills/K23-workgraph-arc-closeout.md)-[`K26`](../skills/K26-workgraph-arc-planning.md) | operates, closes out, recovers, participates in, and plans a WorkGraph arc on the coordination substrate |
| not to be read as | [`AR2`](../artifacts/AR2-delta.md) | a delta declares one architectural transition; an arc is the staged multi-unit initiative that executes and closes work |

---

## Why precision matters

The word appeared across [`roles/`](../roles/README.md), [`work-types/`](../work-types/README.md), [`domains/`](../domains/README.md), and [`skills/`](../skills/README.md) with thirteen primary arc-operating and arc-modelling entries (among twenty-seven member entries naming `arc` across seven layers) and two distinct structural shapes: [`K6`](../skills/K6-arc-lifecycle.md) and [`K16`](../skills/K16-model-an-arc.md) defined an arc as a tree of rungs climbing a fixed summit without a coordination substrate, while [`W17`](../work-types/W17-author-closeout-packet.md), [`W18`](../work-types/W18-seed-a-blueprint-arc.md), [`W19`](../work-types/W19-drive-an-arc.md), [`W21`](../work-types/W21-arc-repair.md), [`K18`](../skills/K18-workgraph-arc-operator.md), and [`K23`](../skills/K23-workgraph-arc-closeout.md)-[`K26`](../skills/K26-workgraph-arc-planning.md) defined it as a WorkGraph blueprint instance on [`E9`](E9-substrate.md).\
A reader arriving from `work-types/` or `roles/` had no entity entry stating what an arc is above a single unit of work or how the two skill families relate.\
Fixing the shared meaning and naming both representations in one home lets every layer cite one definition without conflating a value-chain rung tree, a substrate blueprint graph, and an `AR2` architectural delta.
