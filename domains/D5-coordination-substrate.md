---
id: D5
category: domain
title: coordination-substrate - the WorkGraph/lifecycle/messaging machinery
status: active
hydrate-when: You are changing the machinery that coordinates work between agents
subjectSurface: the WorkGraph / lifecycle / messaging machinery as subject - blueprints, gates, leases, the queue
evidenceResolvesAgainst: WorkItem/blueprint state, driver leases, stint projections, gate/completion state, before/after graph topology
related: [D0]
---

# D5 - coordination-substrate

## Subject-surface
The WorkGraph/lifecycle/messaging machinery treated as a subject: blueprints, gates, leases, the queue.\
Evidence resolves against WorkItem/blueprint state, driver leases, stint projections, gate/completion state, and before/after graph topology.

---

## Freedom
**Pinned** for coordination-mode types (`seed`, `drive-an-arc`, `reconcile- ledger`, `arc-repair`, `convene-council`, `author-closeout`, `backstop`) - the type names this surface.\
Still a **free** target of `audit-a-surface` / `verify-gate` (you can audit the graph itself).

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
