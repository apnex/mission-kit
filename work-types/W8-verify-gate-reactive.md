---
id: W8
category: work-type
title: verify-gate-reactive — independently gate a build/change
status: active
roleEligibility: [verifier]
evidenceContract:
  - kind: review
    description: verifier-authored review doc (or SEAL attestation when structurally valid)
evidenceAuthority: verifier-attestation
domainEligibility: [delivery-code, distribution, tooling-harness, authority-governance, coordination-substrate, knowledge-methodology]
domainFreedom: free
parameters:
  - name: target
    fills: the build/change to gate
    bindingSource: provided-by-trigger
generationMode: reactive-triggered
falsifier: self-attestation, targetRef null with attestation-only evidence, or no load-bearing ref
compositionHooks: brackets the target node; generative-on-FAIL — a FAIL grows a repair subgraph routing through arc-repair's supersession path (never bare-abandon a completion-gated child)
---

# W8 — verify-gate-reactive

## Definition

A verifier independently gates a specific build or change, producing an attested
PASS/FAIL verdict on evidence the verifier did not author. Reactive to a
substrate trigger (a completed build, an approved PR, a FAILed/trapped child).

## Evidence & closeability

The evidence contract is a single `kind: review` — a verifier-authored review
doc (or a structurally-valid SEAL attestation). Authority is
`verifier-attestation`. Closeability is governed by the canonical constraint set
/ closeability preflight in `work-types/README.md` (do not restate it here).
Load-bearing here: constraint 2 (independence is structural + roster-aware) — a
verifier-*held* gate uses **plain `kind:review`, never
verifier-attestation-on-its-own-work** (the bug-249 fix); if the live roster
collapses attester and executor, the seed fails or downgrades to `kind:review`.

## Generation

`generationMode: reactive-triggered` — instantiated by a substrate trigger, never
idle-pooled or auto-minted against a bare surface. idea-425/451/403 instantiate
it as the bracketing gate an executor node's completion depends on: idea-451's
conditional-edge primitive makes it generative-on-FAIL (a FAIL grows a repair
subgraph via `arc-repair`), while idea-403's idle engine relies on this gate to
consume executor-evidence-provisional closures before they count as assurance.
Falsifier: self-attestation, a null `targetRef` carrying attestation-only
evidence, or no load-bearing ref — any of these turns the node FAIL at seed.

## Axiom alignment

- **A7 / A8** — independent assurance is the load-bearing purpose: an attested
  gate on evidence the attester did not produce is what makes autonomous closure
  safe rather than self-certified.
