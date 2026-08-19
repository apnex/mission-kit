---
id: W19
category: work-type
title: drive-an-arc — operate an arc over its lifetime
status: active
roleEligibility: [architect]
evidenceContract:
  - kind: freeform
    description: driver lease, stint projection, renewals, close decisions
evidenceAuthority: executor-evidence
domainEligibility: [coordination-substrate]
domainFreedom: pinned
parameters:
  - name: arc
    fills: the arc to drive
    bindingSource: provided-by-trigger
generationMode: arc-seeded
falsifier: driver unheld/stale, or hidden manual steps
compositionHooks: dependsOn the arc's live rungs; the driver lease is renewed across the stint and released at close
---

# W19 — drive-an-arc

## Definition

Operate an arc over its lifetime — hold the driver lease, project the stint,
renew across the run, and take the close decisions — so the arc advances as a
live control loop rather than a hand-shepherded backlog.

## Evidence & closeability

The evidence contract is a single `freeform` record: the driver lease, the stint
projection, the renewals, and the close decisions. Authority is
`executor-evidence` — the driving architect owns the control-loop record.
Closeability is governed by the canonical constraint set and the seed-time
closeability preflight authored once in `work-types/README.md`; this entry
satisfies those constraints (it does not restate them). `domainFreedom: pinned`
to `coordination-substrate` — the generator does not vary the domain.

## Generation

`arc-seeded`: the driver is minted by the blueprint the moment an arc is stood
up, with the `arc` `provided-by-trigger` at seed. Birth (seed) and control-loop
(drive) are distinct types — seeding sets an arc up, driving keeps it running.
idea-425/451/403 instantiate it as a `role × work-type × domain` triple whose
lease is `dependsOn` the arc's live rungs. The falsifier is concrete: the node
FAILs if the **driver is unheld or stale, or if the arc advances through hidden
manual steps** — a control loop that runs off-substrate is not a driven arc.

## Axiom alignment

- **A0** — strategic intent compiling into self-fed WorkGraph execution: driving
  an arc is the operation that keeps that self-feeding loop live over the stint.
- **A11** — manage via the substrate, not by shepherding: the driver renews and
  closes through leased state, so no hidden manual step substitutes for the loop
  (this is the falsifier).

## Origin

Earned across all cited arcs, each of which was operated by a held driver over
its stint — the recurring control-loop pattern this type names.
