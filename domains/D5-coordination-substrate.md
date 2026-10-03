---
id: D5
category: domain
title: coordination-substrate - the WorkGraph/lifecycle/messaging machinery
status: active
hydrate-when: You are changing the machinery that coordinates work between agents
subjectSurface: the WorkGraph / lifecycle / messaging machinery as subject - its source, and the blueprints, gates, leases and queue it runs
evidenceResolvesAgainst: the machinery's source files, PRs, commits and CI; WorkItem/blueprint state, driver leases, stint projections, gate/completion state, before/after graph topology
related: [D0]
---

# D5 - coordination-substrate

## Subject-surface
The WorkGraph/lifecycle/messaging machinery treated as a subject: its source, and the blueprints, gates, leases and queue it runs.\
Evidence resolves against the machinery's source files, PRs, commits and CI, and against WorkItem/blueprint state, driver leases, stint projections, gate/completion state, and before/after graph topology.

---

## Freedom
**Pinned** for the coordination-mode types, whose type names this surface; **free** for the types that act on any surface, including those that build and ship the machinery's source.\
Which work-types act on this surface, pinned or free, is declared on each work-type, and the table below is generated from those declarations; this section does not repeat the list.

---

## Axiom alignment
- **A7 (Resilient Agentic Operations):** arc-repair and completion-gate
  integrity (bug-250) resolve against this surface.
- **A8 (Gated Recursive Integrity):** the gate/completion machinery lives here.

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
| [W12](../work-types/W12-meta-validate-dogfood.md) | meta-validate-dogfood - use the deliverable as its own test | You are using a deliverable as its own test |
| [W14](../work-types/W14-design-a-contract-or-invariant.md) | design-a-contract-or-invariant - author a design-of-record | You are authoring a design of record, a contract or an invariant |
| [W15](../work-types/W15-convene-a-council.md) | convene-a-council - multi-lens deliberation + synthesis | You need several lenses deliberated and synthesised before deciding |
| [W17](../work-types/W17-author-closeout-packet.md) | author-closeout-packet - proof-level arc closeout | You are closing an arc and must assemble proof rather than narrative |
| [W18](../work-types/W18-seed-a-blueprint-arc.md) | seed-a-blueprint-arc - instantiate a WorkGraph arc | You are instantiating a staged arc from a blueprint |
| [W19](../work-types/W19-drive-an-arc.md) | drive-an-arc - operate an arc over its lifetime | You are operating an arc across its lifetime rather than a single node |
| [W20](../work-types/W20-reconcile-ledger.md) | reconcile-ledger - reconcile entity/backlog state vs truth | Entity or backlog state has diverged from truth and you are reconciling it |
| [W21](../work-types/W21-arc-repair.md) | arc-repair - repair a WorkGraph arc topology | An arc topology is wrong and you are repairing it in place |
| [W25](../work-types/W25-backstop-a-prod-window.md) | backstop-a-prod-window - hold abort/rollback over a risk window | You are holding abort or rollback authority across a risk window |
<!-- END GENERATED -->
