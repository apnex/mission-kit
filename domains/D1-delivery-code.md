---
id: D1
category: domain
title: delivery-code - the shipped product's codebase
status: active
hydrate-when: You are changing the codebase of the product the organisation ships
subjectSurface: the shipped product's codebase - features, fixes, the delivered artifact; not the organisation's own harness, control plane or knowledge, which are domains of their own
evidenceResolvesAgainst: source files, PRs, commits, CI/test runs on the product repo
related: [D0]
---

# D1 - delivery-code

## Subject-surface
The codebase of the product the organisation ships: the features, fixes, and shipped artifact.\
The organisation's own harness, control plane and knowledge are engineered products too, and each is its own domain.\
Evidence resolves against source files, PRs, commits, and CI/test runs on the product repo.

---

## Freedom
A **free** discriminating domain for object-level build/ship/assurance types - a `build-a-slice` or `verify-gate` genuinely chooses this surface vs distribution, tooling, or the organisation's own control plane and knowledge.

---

## Axiom alignment
- **A1 (Sovereign State Transparency):** node truth binds to real code artifacts
  (PR/commit/CI), not prose.

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
| [W8](../work-types/W8-verify-gate-reactive.md) | verify-gate-reactive - independently gate a build/change | You are gating a build or change that you did not author |
| [W9](../work-types/W9-audit-a-surface.md) | audit-a-surface - bounded adversarial sweep of a surface | You are sweeping a bounded surface adversarially rather than reviewing a diff |
| [W10](../work-types/W10-adversarial-design-review-upstream.md) | adversarial-design-review-upstream - critique a design before build/merge | You are critiquing a design before it is built or merged |
| [W11](../work-types/W11-run-a-live-probe-or-smoke.md) | run-a-live-probe-or-smoke - observe live behavior at a revision | You need to observe live behaviour at a specific revision |
| [W12](../work-types/W12-meta-validate-dogfood.md) | meta-validate-dogfood - use the deliverable as its own test | You are using a deliverable as its own test |
| [W14](../work-types/W14-design-a-contract-or-invariant.md) | design-a-contract-or-invariant - author a design-of-record | You are authoring a design of record, a contract or an invariant |
<!-- END GENERATED -->
