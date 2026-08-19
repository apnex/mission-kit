---
id: W21
category: work-type
title: arc-repair - repair a WorkGraph arc topology
status: active
hydrate-when: An arc topology is wrong and you are repairing it in place
roleEligibility: [architect]
evidenceContract:
  - kind: freeform
    description: graph repair plan, affected deps/completion gates, before/after stint projection
evidenceAuthority: executor-evidence
domainEligibility: [coordination-substrate]
domainFreedom: pinned
parameters:
  - name: arc
    fills: the trapped/failed arc
    bindingSource: provided-by-trigger
generationMode: reactive-triggered
falsifier: an abandoned/blocked child still blocks the parent completion gate (bug-250 class)
compositionHooks: seeded as an external successor-driver OUTSIDE the target completion gate (never inside it); never bare-abandon; also arc-seeded
---

# W21 - arc-repair

## Definition

Repair the topology of a trapped or failed WorkGraph arc - rewiring dependencies, superseding trapped children, and re-projecting the stint - so a parent completion gate that can no longer close is made closeable again.

---

## Evidence & closeability

`evidenceContract`: one `freeform` input - the graph repair plan, the affected `dependsOn`/`completionDependsOn` gates, and a before/after stint projection.\
`evidenceAuthority: executor-evidence` (the repairing architect produces and satisfies it).\
`domainFreedom: pinned` to `coordination-substrate`; the sole parameter `arc` binds `provided-by-trigger`.\
The seed must satisfy the canonical closeability preflight in `work-types/README.md` - do not restate the constraint set here.\
Constraint 6 is load-bearing: this work-type MUST be seeded as an external successor-driver **outside** the target completion gate, never as a child inside it, or the repair node itself becomes trappable.

---

## Generation

`generationMode: reactive-triggered` - a FAILed/trapped completion child (or a `verify-gate` FAIL edge, per README section "generative-on-FAIL") mints it; it also has an `arc-seeded` path so a blueprint driver can instantiate it. idea-451's conditional FAIL->repair edge routes through this type instead of bare-abandon; idea-425/403 treat it as the standing supersession path a completion-gated child must carry.\
Falsifier: an abandoned/blocked child still blocks the parent completion gate (the bug-250 class it was earned to defeat).

---

## Axiom alignment

- **A7/A8** - repair is an assurance act on the substrate: an abandoned child
  must be superseded, not silently dropped, so closure remains honest.
- **A11** - self-fed execution depends on completion gates that actually close;
  a trapped gate stalls the idle engine until topology is repaired.
