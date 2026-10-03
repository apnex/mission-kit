---
id: D4
category: domain
title: authority-governance - the governance/authority substrate
status: active
hydrate-when: You are changing who holds authority or how governance is enforced
subjectSurface: the governance/authority substrate as subject - the source of the machinery that enforces it, and SEAL, CODEOWNERS, decisions, class-grants, axioms-as-law
evidenceResolvesAgainst: the governance machinery's source files, PRs, commits and CI; Decision/Confirmation/Signal entities, class-grants, CODEOWNERS approvals, axiom-alignment records
related: [D0]
---

# D4 - authority-governance

## Subject-surface
The governance/authority machinery treated as a subject: the source of the machinery that enforces it, and SEAL, CODEOWNERS, decisions, class-grants, and axioms-as-law.\
Evidence resolves against the governance machinery's source files, PRs, commits and CI, and against Decision/ Confirmation/Signal entities, class-grants, CODEOWNERS approvals, and axiom-alignment records.

---

## Freedom
**Pinned** for the governance-mode types, whose type names this surface, so the generator does not vary the domain; **free** for the types that act on any surface, including those that build and ship the governance machinery's source.\
Which work-types act on this surface, pinned or free, is declared on each work-type, and the table below is generated from those declarations; this section does not repeat the list.

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
| [W1](../work-types/W1-build-a-slice.md) | build-a-slice - implement a scoped increment | You are scoping the implementation of a bounded increment |
| [W2](../work-types/W2-fix-a-bug-or-repair.md) | fix-a-bug-or-repair - resolve a filed defect | You are resolving a defect that has already been filed |
| [W3](../work-types/W3-retire-or-hard-cut.md) | retire-or-hard-cut - delete a surface with disposition | You are deleting a surface and must say what happens to what depended on it |
| [W4](../work-types/W4-validate-locally.md) | validate-locally - self-check a fresh artifact | You have a fresh artifact and are self-checking it before anyone else sees it |
| [W5](../work-types/W5-author-guard-or-falsifier-tests.md) | author-guard-or-falsifier-tests - add a test that can fail | You are adding a test that is able to fail |
| [W6](../work-types/W6-merge-and-land.md) | merge-and-land - land an approved change on canonical main | You are landing an approved change on the canonical branch |
| [W7](../work-types/W7-publish-deploy-or-canonicalize.md) | publish-deploy-or-canonicalize - ship to the estate/channel | You are shipping something to the estate or a release channel |
| [W8](../work-types/W8-verify-gate-reactive.md) | verify-gate-reactive - independently gate a build/change | You are gating a build or change that you did not author |
| [W9](../work-types/W9-audit-a-surface.md) | audit-a-surface - bounded adversarial sweep of a surface | You are sweeping a bounded surface adversarially rather than reviewing a diff |
| [W10](../work-types/W10-adversarial-design-review-upstream.md) | adversarial-design-review-upstream - critique a design before build/merge | You are critiquing a design before it is built or merged |
| [W13](../work-types/W13-code-owner-approve.md) | code-owner-approve - non-author independence approval | You are approving as a code owner who did not write the change |
| [W14](../work-types/W14-design-a-contract-or-invariant.md) | design-a-contract-or-invariant - author a design-of-record | You are authoring a design of record, a contract or an invariant |
| [W22](../work-types/W22-axiom-alignment-gate.md) | axiom-alignment-gate - per-item axiom-alignment check | You are checking a single item against the axioms it claims to satisfy |
| [W23](../work-types/W23-capture-decision-and-ratify.md) | capture-decision-and-ratify - record + ratify a decision | You are recording a decision and having it ratified |
| [W24](../work-types/W24-director-walkthrough.md) | director-walkthrough - live Director sensemaking walkthrough | You are walking the director through something live for sensemaking |
<!-- END GENERATED -->
