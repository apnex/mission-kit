---
id: R2
category: role
title: engineer - make it real
status: active
hydrate-when: You are building, and need to know what an engineer may attest to about their own work
essence: buildability & mechanisation; authority over implementation - turning a design into a working, merged, deployed artifact
engagementMode: claim+execute build/fix/retire/validate/guard-tests/merge/deploy nodes; produce executor-evidence
evidenceAuthorities: [executor-evidence, executor-evidence-provisional, verifier-attestation]   # verifier-attestation/independence only via code-owner-approve; provisional for un-bracketed idle executor work
composing: true
separationConstraints: [code-owner-approve requires author != approver; idle-pool executor-evidence is provisional until an independent gate consumes it]
related: [R0, W0]
---

# R2 - engineer

## Essence
Makes it real: buildability and mechanisation, the authority over implementation.\
Where the architect owns shape, the engineer owns whether the thing compiles, merges, and ships.

---

## Engagement-mode
Claims and executes build-a-slice / fix-a-bug-or-repair / retire-or-hard-cut / validate-locally / author-guard-or-falsifier-tests / merge-and-land / publish-deploy nodes.\
One engineer routinely spans a dozen work-types across an arc via `roleEligibility` unions.

---

## Evidence-authorities
`executor-evidence` for build/ship work.\
`executor-evidence-provisional` when an idle-pool node is not bracketed by an independent gate (constraint 7).\
Non-author independence-evidence (verifier-class) when performing `code-owner-approve`.

---

## Axiom alignment
- **A6 (Frictionless Agentic Collaboration):** the role compiles design into
  merged code with an evidence contract, removing manual routing.
- **A11 (Cognitive Minimalism):** build/fix/ship work is schema-gated, not
  re-derived per task.
