---
id: W10
category: work-type
title: adversarial-design-review-upstream — critique a design before build/merge
status: active
roleEligibility: [verifier]
evidenceContract:
  - kind: review
    description: critique doc before build/merge with specific failure hypotheses
evidenceAuthority: verifier-attestation
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
    fills: the design under review
    bindingSource: provided-by-trigger
generationMode: reactive-triggered
falsifier: review after the decision, or no falsifiable concerns raised
compositionHooks: dependsOn the design under review; brackets build/merge as an upstream gate
---

# W10 — adversarial-design-review-upstream

## Definition

A verifier red-teams a design **before** build or merge, producing a critique
doc that raises specific, falsifiable failure hypotheses against it — not an
after-the-fact assurance pass.

## Evidence & closeability

The evidenceContract is a single `kind:review` — a critique doc that names
concrete failure hypotheses against `target` before the build/merge decision.
`evidenceAuthority: verifier-attestation` requires an attesting verifier that
**cannot be the executor** given the live roster (constraint 2); with a
collapsed roster this falls back to plain `kind:review`. The full closeability
preflight (the nine canonical constraints + independence/authority rules) lives
in `work-types/README.md` and is satisfied here, not restated.

## Generation

`reactive-triggered`: instantiated by a substrate trigger — a design doc reaching
the pre-build/pre-merge point. idea-425/451/403 instantiate the composition rule
(`role × work-type × domain → closeable node`) by minting this node as an
upstream gate bracketing the build, with `target` bound `provided-by-trigger`.
Falsifier: **the review lands after the decision, or raises no falsifiable
concerns** — an assurance pass that only ratifies is not this work-type.

## Axiom alignment

- **A8 (Gated Recursive Integrity)** — the critique is an upstream gate before
  build/merge; a design whose named failure hypotheses go unanswered does not
  pass. Upstream placement + a non-executor reviewer are what make the gate real.
- **A7 (Resilient Agentic Operations)** — surfacing specific, falsifiable failure
  modes before build is what keeps operations resilient; an after-the-fact pass
  would have ratified them.

## Origin

Earned by the worktax0 red-team and mission-107, where critiquing a design
before build/merge caught failure classes an after-the-fact pass would have
ratified.
