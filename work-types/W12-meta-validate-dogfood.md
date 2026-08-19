---
id: W12
category: work-type
title: meta-validate-dogfood — use the deliverable as its own test
status: active
roleEligibility: [verifier, engineer]
evidenceContract:
  - kind: freeform
    description: actual dogfood use trace + result
evidenceAuthority: executor-evidence-provisional
domainEligibility: [delivery-code, distribution, tooling-harness, coordination-substrate, knowledge-methodology]
domainFreedom: free
parameters:
  - name: target
    fills: the just-shipped deliverable
    bindingSource: provided-by-trigger
generationMode: arc-seeded
falsifier: self-report without an observable use trace
compositionHooks: dependsOn the ship node that produced target; provisional closure does not count as assurance until an independent gate consumes the trace
---

# W12 — meta-validate-dogfood

## Definition

Exercise a just-shipped deliverable by actually using it for real work, so the
deliverable becomes its own end-to-end test rather than being validated only by
proxy checks.

## Evidence & closeability

The evidence contract is a single `freeform` item: an **actual dogfood use trace
+ result** — an observable record that `target` was used in anger, not a claim
that it works. Closeability is governed by the canonical constraint set /
closeability preflight in `work-types/README.md` (referenced, not restated). Two
constraints bind hardest here: constraint 5 (the falsifier below is the concrete
FAIL observation) and constraint 7 — this type is `executor-evidence-provisional`,
so its closure does **not** count as assurance until an independent gate consumes
the trace.

## Generation

`generationMode: arc-seeded` — a driver seeds it inside a blueprint against a
`target` bound `provided-by-trigger` from the ship node it dependsOn. idea-425/451/403
instantiate it as a `role × W12 × domain` triple that compiles to a claimable
WorkItem whose evidenceRequirements carry the use-trace contract, minted by the
closeout/verify driver rather than entering the idle pool. Falsifier:
**self-report without an observable use trace** — a bare "I used it, works" with
no trace turns the node FAIL.

## Axiom alignment

- **A7 / A8** — dogfooding is assurance-by-real-use; provisional authority plus a
  consuming independent gate keeps executor self-evidence from self-certifying.
