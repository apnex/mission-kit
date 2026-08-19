---
id: W24
category: work-type
title: director-walkthrough - live Director sensemaking walkthrough
status: active
hydrate-when: You are walking the director through something live for sensemaking
roleEligibility: [director]
evidenceContract:
  - {kind: freeform, description: walkthrough record + Director disposition}
evidenceAuthority: director-ratification
domainEligibility: [authority-governance]
domainFreedom: pinned
parameters:
  - {name: target, fills: the arc/decision to walk through, bindingSource: provided-by-trigger}
generationMode: externally-triggered
falsifier: Director authority inferred from architect prose only
compositionHooks: none
---

# W24 - director-walkthrough

## Definition

A live Director sensemaking walkthrough of a target arc or decision, where the Director themselves is talked through the state and renders a disposition on the record.\
It is a director-mode ceremony, not an agent-executable task.

---

## Evidence & closeability

Evidence contract: a single `freeform` record capturing the walkthrough plus the Director's disposition, satisfied only via `evidenceAuthority: director-ratification`
- the disposition IS the closing evidence. The node compiles to a closeable
claimable node only against the canonical closeability preflight in `work-types/README.md` (the nine-constraint set authored there once, not restated here).\
`domainFreedom: pinned` to `authority-governance`: the generator never varies the domain, and the `target` parameter's `provided-by-trigger` binding resolves `targetRef` to a real arc/decision entity (no vacuous walkthrough).

---

## Generation

`generationMode: externally-triggered` - gated on out-of-band Director availability the engine cannot schedule; never idle-pooled or auto-minted, it waits for the external signal. idea-425/451/403 instantiate work-types by compiling a `role x work-type x domain` triple into a claimable node with a complete evidence contract; here that triple resolves to `director x director-walkthrough x authority-governance`, minted only when the Director signals availability against a named target.\
Falsifier: **Director authority inferred from architect prose only** - if the disposition is reconstructed from an architect's narration rather than ratified live by the Director, the node is FAIL, not done.

---

## Axiom alignment

- **A13** - director authority is a distinct, non-delegable evidence path;
  walkthrough disposition must originate with the Director, load-bearing here
  because the falsifier fails exactly when that authority is inferred rather than
  exercised.
