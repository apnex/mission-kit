---
id: W18
category: work-type
title: seed-a-blueprint-arc — instantiate a WorkGraph arc
status: active
roleEligibility: [architect]
evidenceContract:
  - kind: freeform
    description: dry-run/seed result, deterministic runId, driver + child graph
evidenceAuthority: executor-evidence
domainEligibility: [coordination-substrate]
domainFreedom: pinned
parameters:
  - name: target
    fills: the arc blueprint
    bindingSource: operator-supplied
generationMode: arc-seeded
falsifier: dangling deps, missing driver, or unclaimable nodes
compositionHooks: seeds the child graph (driver + rungs) whose dependsOn/completionDependsOn edges the blueprint declares
---

# W18 — seed-a-blueprint-arc

## Definition

Instantiate a WorkGraph arc from a blueprint — mint the driver plus child graph
with a deterministic runId, so strategic intent compiles into claimable,
well-typed WorkItems the idle engine can feed.

## Evidence & closeability

The evidence contract is a single `freeform` record: the dry-run/seed result, the
deterministic runId, and the driver + child graph it produced. Authority is
`executor-evidence` — the seeding architect owns the seed act. Closeability is
governed by the canonical constraint set and the seed-time closeability preflight
authored once in `work-types/README.md`; this entry satisfies those constraints
(it does not restate them). `domainFreedom: pinned` to `coordination-substrate` —
the generator does not vary the domain. Note the immutability bar: a node's
`type` and `evidenceRequirements` are fixed at seed, so a mis-seed forces a
re-seed — get them right the first time.

## Generation

`arc-seeded`: this is the driver-level act that mints an arc inside a blueprint
rather than pooling work idly — the `target` blueprint is `operator-supplied` at
seed. idea-425/451/403 instantiate it as the `role × work-type × domain` triple
whose seed projects the composition rule onto every child node, emitting the
driver and its dependsOn/completionDependsOn child graph. The falsifier is
concrete: the seed FAILs if it produces **dangling deps, a missing driver, or
unclaimable nodes** — a graph no agent can pick up is not a seeded arc.

## Axiom alignment

- **A6** — strategic intent compiles into self-fed execution: the seed is the
  point where a blueprint becomes claimable WorkItems, not hand-routed prose.
- **A11** — well-typed generation over manual dispatch: a valid seed hands the
  idle engine a complete evidence contract per node, so the architect need not
  shepherd each item.

## Origin

Earned by the worktax0 seed and mission-107, where blueprint instantiation minted
arcs with deterministic runIds and full child graphs as the exemplar for this
type.
