---
id: W9
category: work-type
title: audit-a-surface - bounded adversarial sweep of a surface
status: active
hydrate-when: You are sweeping a bounded surface adversarially rather than reviewing a diff
roleEligibility: [verifier]
evidenceContract:
  - kind: review
    description: scope statement + findings table + follow-up bugs/ideas
evidenceAuthority: verifier-attestation
domainEligibility: [delivery-code, distribution, tooling-harness, authority-governance, coordination-substrate, knowledge-methodology]
domainFreedom: free
parameters:
  - name: target
    fills: the surface to audit
    bindingSource: discover-from-substrate
generationMode: proactive-poolable
falsifier: audit scope not falsifiable or findings not bound to refs
compositionHooks: proactive-poolable under constraint 7 — verifier-attestation carries its own independent authority, so closure stands on the attesting verifier being roster-distinct from any executor (constraint 2); findings that turn up defects seed follow-up bug/idea nodes via a reactive-triggered edge.
---

# W9 — audit-a-surface

## Definition

A bounded, adversarial sweep of a named surface — code, distribution, a tool
plane, a governance boundary — that states its scope up front and returns a
findings table, each finding bound to a concrete ref (a bug, an idea, a
line/entity). The value is the falsifiable scope and the ref-bound findings, not
a "looks clean" attestation.

## Evidence & closeability

The evidence contract is a single `review`: **scope statement + findings table +
follow-up bugs/ideas**. The closeability preflight is the canonical constraint
set in `work-types/README.md` — satisfied, not restated. The load-bearing gate
is **constraint 2** (independence): `verifier-attestation` requires the attesting
verifier to be roster-distinct from any executor of the audited surface; a thin
roster that collapses attester and executor to one agent fails the seed or
downgrades to plain `kind:review`. **Constraint 5** binds via the falsifier, and
**constraint 3** binds the `target` param's `discover-from-substrate`
bindingSource so the audited surface resolves to a real entity (no vacuous sweep).

## Generation

`proactive-poolable` — mintable against the existing substrate with no trigger,
so it enters the idle-QoS pool (idea-403/404) as idle-poolable verifier work.
idea-425/451/403 instantiate it as an idle verifier discovering a surface from
substrate, binding `target`, stating a falsifiable scope, and attesting a findings
table whose defects seed follow-up bug/idea nodes via a reactive-triggered edge.
The falsifier is **audit scope not falsifiable or findings not bound to refs** —
a sweep whose scope cannot be made to fail, or whose findings float free of any
ref, fails the seed's constraint-2/5 preflight rather than closing as assurance.
This falsifier must be able to fire: a findings-not-bound sweep is not closeable.

## Axiom alignment

- **A9** — the sweep is the adversarial proof that a sealed surface stays sealed
  under stress; an audit that cannot be made to fail is a happy-path caricature,
  not assurance.
- **A8** — Law of Fallback: findings route the audit downward toward the base
  (ref-bound to the layer that actually failed), never a surface patch where the
  symptom appeared.
