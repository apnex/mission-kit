---
id: D3
category: domain
title: tooling-harness - the launch/runtime harness
status: active
hydrate-when: You are changing the harness that launches or hosts the runtime
subjectSurface: the launch/runtime harness - ois/pi/claude launchers, prompt-handlers, the developer tooling that launches and hosts the work
evidenceResolvesAgainst: harness source/config, launcher behavior, prompt-handler tables, live seat/session state
related: [D0]
---

# D3 - tooling-harness

## Subject-surface
The launch/runtime harness: ois/pi/claude launchers, prompt-handlers, and the developer tooling that launches and hosts the work.\
Evidence resolves against harness source/config, launcher behavior, prompt-handler tables, and live seat/session state.

---

## Freedom
A **free** domain.\
Note the tie-break rule (`domains/README.md`): a `tooling-harness` fix that serves `distribution` (e.g. bug-247's transport- neutral prompt-table) is filed here - where its diff/evidence resolves - not under the surface it ultimately serves.

---

## Axiom alignment
- **A7 (Resilient Agentic Operations):** harness robustness (resume-by-default,
  transport-neutral handlers) is assured against this surface.

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
| [W11](../work-types/W11-run-a-live-probe-or-smoke.md) | run-a-live-probe-or-smoke - observe live behavior at a revision | You need to observe live behaviour at a specific revision |
| [W12](../work-types/W12-meta-validate-dogfood.md) | meta-validate-dogfood - use the deliverable as its own test | You are using a deliverable as its own test |
| [W14](../work-types/W14-design-a-contract-or-invariant.md) | design-a-contract-or-invariant - author a design-of-record | You are authoring a design of record, a contract or an invariant |
| [W26](../work-types/W26-reset-or-converge-the-fleet.md) | reset-or-converge-the-fleet - restore fleet to a healthy state | The fleet is unhealthy and you are restoring it to a known state |
<!-- END GENERATED -->
