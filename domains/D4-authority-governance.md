---
id: D4
category: domain
title: authority-governance - the governance/authority substrate
status: active
hydrate-when: You are changing who holds authority or how governance is enforced
subjectSurface: the governance/authority substrate as subject - SEAL, CODEOWNERS, decisions, class-grants, axioms-as-law
evidenceResolvesAgainst: Decision/Confirmation/Signal entities, class-grants, CODEOWNERS approvals, axiom-alignment records
related: [D0]
---

# D4 - authority-governance

## Subject-surface
The governance/authority machinery treated as a subject: SEAL, CODEOWNERS, decisions, class-grants, and axioms-as-law.\
Evidence resolves against Decision/ Confirmation/Signal entities, class-grants, CODEOWNERS approvals, and axiom-alignment records.

---

## Freedom
**Pinned** for governance-mode types (`capture-decision-and-ratify`, `axiom-alignment-gate`, `director-walkthrough`, `code-owner-approve`) - their type names this surface, so the generator does not vary the domain.\
Still a **free** target of `audit-a-surface` / `verify-gate` / `design-a-contract` (you can audit or design the governance substrate).

---

## Axiom alignment
- **A13 (Director Intent Amplification):** director-ratification evidence
  resolves here; non-delegable authority is protected on this surface.

---

## Work-types that act on this domain

Generated from each work-type's `domainEligibility`, the list that governs.

<!-- BEGIN GENERATED: entries. Run tools/generate-index.mjs; do not edit by hand. -->
| ID | Title | Hydrate when |
|---|---|---|
| [W8](../work-types/W8-verify-gate-reactive.md) | verify-gate-reactive - independently gate a build/change | You are gating a build or change that you did not author |
| [W9](../work-types/W9-audit-a-surface.md) | audit-a-surface - bounded adversarial sweep of a surface | You are sweeping a bounded surface adversarially rather than reviewing a diff |
| [W10](../work-types/W10-adversarial-design-review-upstream.md) | adversarial-design-review-upstream - critique a design before build/merge | You are critiquing a design before it is built or merged |
| [W13](../work-types/W13-code-owner-approve.md) | code-owner-approve - non-author independence approval | You are approving as a code owner who did not write the change |
| [W14](../work-types/W14-design-a-contract-or-invariant.md) | design-a-contract-or-invariant - author a design-of-record | You are authoring a design of record, a contract or an invariant |
| [W22](../work-types/W22-axiom-alignment-gate.md) | axiom-alignment-gate - per-item axiom-alignment check | You are checking a single item against the axioms it claims to satisfy |
| [W23](../work-types/W23-capture-decision-and-ratify.md) | capture-decision-and-ratify - record + ratify a decision | You are recording a decision and having it ratified |
| [W24](../work-types/W24-director-walkthrough.md) | director-walkthrough - live Director sensemaking walkthrough | You are walking the director through something live for sensemaking |
<!-- END GENERATED -->
