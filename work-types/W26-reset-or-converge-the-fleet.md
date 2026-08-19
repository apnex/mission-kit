---
id: W26
category: work-type
title: reset-or-converge-the-fleet - restore fleet to a healthy state
status: active
hydrate-when: The fleet is unhealthy and you are restoring it to a known state
roleEligibility: [architect, engineer]
evidenceContract:
  - kind: freeform
    description: fleet health before/after, exact commands, no kill-server-class hazards
evidenceAuthority: executor-evidence
domainEligibility: [distribution, tooling-harness]
domainFreedom: free
parameters:
  - name: target
    fills: the fleet/estate to converge
    bindingSource: operator-supplied
generationMode: reactive-triggered
falsifier: hidden disruption or a live seat lost
compositionHooks: none
---

# W26 - reset-or-converge-the-fleet

## Definition

Bring a fleet/estate of live seats back to a healthy, converged state after drift or disruption - restart, re-attach, or reconcile the target without disturbing running work.

---

## Evidence & closeability

`evidenceContract`: a single `freeform` entry capturing fleet health before/after, the exact commands run, and an explicit no-kill-server-class-hazard attestation.\
`evidenceAuthority` is `executor-evidence` (the operator running the convergence is the authority).\
Closeability is governed by the canonical constraint set and seed-time preflight in `work-types/README.md` - this entry satisfies it, it does not restate it.\
Narrow/context-gated: tag the trigger that fired it.

---

## Generation

`generationMode: reactive-triggered` - instantiated by a substrate trigger (a fleet-drift signal or an incident routed to a bug), never idle-pooled.\
The generative primitives of idea-425/451/403 instantiate it by minting a claimable node bound to the operator-supplied `target` when the trigger fires; it does not enter the idle pool.\
Falsifier: a hidden disruption remains, or a live seat is lost during the convergence.

---

## Axiom alignment

- **A7** - convergence is a repair/assurance act on a live estate; the
  before/after health evidence is the closure gate, not operator say-so.
- **A11** - a well-typed convergence node lets the architect route fleet recovery
  as claimable work rather than hand-shepherding each seat.
