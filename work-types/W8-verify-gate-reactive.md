---
id: W8
category: work-type
title: verify-gate-reactive - independently gate a build/change
status: active
hydrate-when: You are gating a build or change that you did not author
roleEligibility: [verifier]
evidenceContract:
  - kind: review
    description: the verifier's verdict, recorded in the evidence slot as a review doc citing the evidence examined (or a SEAL attestation when structurally valid)
evidenceAuthority: verifier-attestation
domainEligibility: [delivery-code, distribution, tooling-harness, authority-governance, coordination-substrate, knowledge-methodology, product-data]
domainFreedom: free
parameters:
  - name: target
    fills: the build/change to gate
    bindingSource: provided-by-trigger
generationMode: reactive-triggered
falsifier: self-attestation, targetRef null with an attestation citing no evidence, or no load-bearing ref
compositionHooks: brackets the target node; generative-on-FAIL - a FAIL grows a repair subgraph routing through arc-repair's supersession path (never bare-abandon a completion-gated child)
methods: [M1]
---

# W8 - verify-gate-reactive

## Definition

A verifier independently gates a specific build or change, producing an attested PASS/FAIL verdict on evidence the verifier did not author.\
Reactive to a substrate trigger (a completed build, an approved PR, a FAILed/trapped child).

---

## Evidence & closeability

The evidence contract is a single `kind: review` slot holding the verifier's verdict - a review doc citing the evidence examined, or a structurally-valid SEAL attestation; the verdict is not itself evidence ([`E8`](../entities/E8-evidence.md)).\
Authority is `verifier-attestation`.\
Closeability is governed by the canonical constraint set / closeability preflight in [`W0`](README.md) (do not restate it here).\
Load-bearing here: constraint 2 (independence is structural + roster-aware) - a verifier-*held* gate uses **plain `kind:review`, never verifier-attestation-on-its-own-work** (the bug-249 fix); what follows when the live roster collapses attester and executor is authored once in constraints 2 and 9 of [`W0`](README.md), with how a lone agent's roles compose under it in [`R0`](../roles/README.md#how-the-roles-compose) (*When there is no second agent*).

---

## Generation

`generationMode: reactive-triggered` - instantiated by a substrate trigger, never idle-pooled or auto-minted against a bare surface. idea-425/451/403 instantiate it as the bracketing gate an executor node's completion depends on: idea-451's conditional-edge primitive makes it generative-on-FAIL (a FAIL grows a repair subgraph via `arc-repair`), while idea-403's idle engine relies on this gate to consume executor-evidence-provisional closures before they count as assurance.\
Falsifier: self-attestation, a null `targetRef` with an attestation citing no evidence, or no load-bearing ref - any of these fails the seed, the generator's machine check, and the gate itself is never validly run.

---

## Axiom alignment

- **A7 / A8** - independent assurance is the load-bearing purpose: an attested
  gate on evidence the attester did not produce is what makes autonomous closure
  safe rather than self-certified.
