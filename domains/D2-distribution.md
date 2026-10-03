---
id: D2
category: domain
title: distribution - release channels and the rollout plane
status: active
hydrate-when: You are changing how a release reaches its consumers
subjectSurface: release channels - npm, containers, the estate/fleet rollout plane
evidenceResolvesAgainst: published artifacts, version/digest/SHA, deploy logs, rollback anchors, live-estate state
related: [D0]
---

# D2 - distribution

## Subject-surface
The release/rollout plane: npm channels, container images, and the estate/fleet.\
Evidence resolves against published artifacts, version/digest/SHAs, deploy logs, rollback anchors, and live-estate state.

---

## Freedom
A **free** domain - distinct from `delivery-code` (git plane) by a different evidence contract (artifact/live plane).\
`merge-and-land` (D1 git plane) vs `publish-deploy` (D2 artifact plane) is the canonical two-plane split.

---

## Axiom alignment
- **A1 / A9:** live-artifact truth (digest/SHA, deploy log, rollback anchor) is
  the load-bearing evidence; A9's chaos/rollback posture lives here.

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
| [W6](../work-types/W6-merge-and-land.md) | merge-and-land - land an approved change on canonical main | You are landing an approved change on the canonical branch |
| [W7](../work-types/W7-publish-deploy-or-canonicalize.md) | publish-deploy-or-canonicalize - ship to the estate/channel | You are shipping something to the estate or a release channel |
| [W8](../work-types/W8-verify-gate-reactive.md) | verify-gate-reactive - independently gate a build/change | You are gating a build or change that you did not author |
| [W9](../work-types/W9-audit-a-surface.md) | audit-a-surface - bounded adversarial sweep of a surface | You are sweeping a bounded surface adversarially rather than reviewing a diff |
| [W10](../work-types/W10-adversarial-design-review-upstream.md) | adversarial-design-review-upstream - critique a design before build/merge | You are critiquing a design before it is built or merged |
| [W11](../work-types/W11-run-a-live-probe-or-smoke.md) | run-a-live-probe-or-smoke - observe live behavior at a revision | You need to observe live behaviour at a specific revision |
| [W12](../work-types/W12-meta-validate-dogfood.md) | meta-validate-dogfood - use the deliverable as its own test | You are using a deliverable as its own test |
| [W14](../work-types/W14-design-a-contract-or-invariant.md) | design-a-contract-or-invariant - author a design-of-record | You are authoring a design of record, a contract or an invariant |
| [W26](../work-types/W26-reset-or-converge-the-fleet.md) | reset-or-converge-the-fleet - restore fleet to a healthy state | The fleet is unhealthy and you are restoring it to a known state |
<!-- END GENERATED -->
