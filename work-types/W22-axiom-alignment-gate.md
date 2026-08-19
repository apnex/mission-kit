---
id: W22
category: work-type
title: axiom-alignment-gate - per-item axiom-alignment check
status: active
roleEligibility: [verifier]
evidenceContract:
  - kind: review
    description: per-item axiom-alignment record with load-bearing citations
evidenceAuthority: verifier-attestation
domainEligibility: [authority-governance]
domainFreedom: pinned
parameters:
  - name: target
    fills: the design/items to axiom-test
    bindingSource: provided-by-trigger
generationMode: arc-seeded
falsifier: speculative or laundered axiom citations
compositionHooks: seeded as a verifier-held gate over the target items (plain kind:review, not verifier-attestation per README constraint 2)
---

# W22 — axiom-alignment-gate

## Definition

Test a design or a set of items against the constitution axioms one item at a
time, recording per-item whether each cited axiom is genuinely load-bearing
rather than decorative, speculative, or laundered.

## Evidence & closeability

`evidenceContract`: one `review` input — a per-item axiom-alignment record whose
citations are each load-bearing. `evidenceAuthority: verifier-attestation`, held
by the verifier. Because this is a verifier-*held* gate, it seeds as a plain
`kind:review` node, never a self-attestation (README constraint 2, the bug-249
fix). `domainFreedom: pinned` to `authority-governance`; the sole parameter
`target` binds `provided-by-trigger`. The seed must satisfy the canonical
closeability preflight in `work-types/README.md` — do not restate the constraint
set here.

## Generation

`generationMode: arc-seeded` — a blueprint driver mints it as a gate over the
items an arc produces. idea-425/451 instantiate it as the standing per-item
axiom-test rung a design arc carries before ratification; idea-403 does not
idle-pool it (it is not `proactive-poolable` — it needs a target to gate).
Falsifier: speculative or laundered axiom citations — a citation that does not
survive the load-bearing test fails the gate rather than passing on prose.

## Axiom alignment

- **A7/A8** — this is an assurance act: it holds the design's own axiom claims
  to the same falsifiable evidence bar the rest of the substrate is held to, so
  a decorative citation cannot be laundered into ratification.
