---
id: W14
category: work-type
title: design-a-contract-or-invariant - author a design-of-record
status: active
roleEligibility: [architect]
evidenceContract:
  - kind: doc
    description: design doc with explicit invariants + adversarial-review/M7 when extensive
evidenceAuthority: executor-evidence
domainEligibility:
  - delivery-code
  - distribution
  - tooling-harness
  - authority-governance
  - coordination-substrate
  - knowledge-methodology
domainFreedom: free
parameters:
  - name: target
    fills: the concern to design
    bindingSource: operator-supplied
generationMode: arc-seeded
falsifier: no acceptance tests/invariants, or axioms cited as decoration
compositionHooks: >-
  bracketing M7 axiom-alignment-gate on completionDependsOn for extensive
  designs before any downstream build node claims against the design-of-record
---

# W14 — design-a-contract-or-invariant

## Definition

An architect authors a design-of-record for a named concern (`target`): the
contract, invariants, and acceptance tests a downstream build/verify must honor.

## Evidence & closeability

Evidence contract is a single `doc` node — a design doc carrying **explicit
invariants + acceptance tests**, escalating to adversarial-review/M7 when the
design is extensive. Authority is `executor-evidence` (the architect's authored
design-of-record is the evidence). Closeability is governed by the canonical
constraint set / closeability preflight in `work-types/README.md` — this entry
satisfies it, does not restate it. Per constraint 6, the bracketing M7
axiom-alignment-gate on `completionDependsOn` carries the repair/supersession
disposition so an extensive design cannot land un-vetted.

## Generation

`arc-seeded` — a driver mints it inside a blueprint (a design rung ahead of
build). idea-425/451/403 instantiate the `architect × design-a-contract-or-
invariant × <domain>` triple into a claimable WorkItem whose `targetRef`
resolves the operator-supplied `target`. **Falsifier:** no acceptance
tests/invariants in the doc, or axioms cited as decoration — either turns the
node FAIL rather than done.

## Axiom alignment

- **A6** — design compiles strategic intent into self-fed, well-typed downstream
  build/verify work rather than hand-routed prose.
- **A11** — the design-of-record is the load-bearing contract a mechanized
  engine executes against without per-node architect shepherding.
