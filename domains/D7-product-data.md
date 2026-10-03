---
id: D7
category: domain
title: product-data - the data the product holds
status: active
hydrate-when: You are changing the data a product holds - applying a schema change to it, or repairing, migrating or deleting its records
subjectSurface: the product's own stored data - the records it holds and the schema they are held in, as they exist live
evidenceResolvesAgainst: the records before and after, migration and repair logs, row counts and integrity checks, backups and restore points
related: [D0, D1, D2]
---

# D7 - product-data

## Subject-surface
The data a product holds: its records, and the schema they are held in, as they exist live.\
Evidence resolves against the records themselves - before and after - and against migration and repair logs, row counts, integrity checks, backups and restore points.

---

## Freedom
A **free** domain, distinct from its two neighbours by a different evidence contract.\
`delivery-code` holds the product's source; this domain holds what that source has written.\
`distribution` holds the estate the product runs on; this domain holds the records on it.\
A schema migration is the canonical split: writing it is `delivery-code`, and applying it to the records is `product-data` - as `merge-and-land` and `publish-deploy` split the git plane from the artifact plane.

---

## Axiom alignment
- **A1 (Sovereign State Transparency):** structure changes only through a formal,
  declared refactor - a schema migration is that refactor, and its truth is the
  records before and after, not the migration's description of itself.
- **A9 (Chaos-Validated Deployment):** a migration applied to production is a change
  promoted to production; it is proven against interruption and concurrent writes
  in a sandbox, with a restore point, before it touches real records.

---

## Work-types that act on this domain

Generated from each work-type's `domainEligibility`, the list that governs.

<!-- BEGIN GENERATED: entries. Run tools/generate-index.mjs; do not edit by hand. -->
| ID | Title | Hydrate when |
|---|---|---|
| [W2](../work-types/W2-fix-a-bug-or-repair.md) | fix-a-bug-or-repair - resolve a filed defect | You are resolving a defect that has already been filed |
| [W3](../work-types/W3-retire-or-hard-cut.md) | retire-or-hard-cut - delete a surface with disposition | You are deleting a surface and must say what happens to what depended on it |
| [W7](../work-types/W7-publish-deploy-or-canonicalize.md) | publish-deploy-or-canonicalize - ship to the estate/channel | You are shipping something to the estate or a release channel |
| [W8](../work-types/W8-verify-gate-reactive.md) | verify-gate-reactive - independently gate a build/change | You are gating a build or change that you did not author |
| [W9](../work-types/W9-audit-a-surface.md) | audit-a-surface - bounded adversarial sweep of a surface | You are sweeping a bounded surface adversarially rather than reviewing a diff |
| [W10](../work-types/W10-adversarial-design-review-upstream.md) | adversarial-design-review-upstream - critique a design before build/merge | You are critiquing a design before it is built or merged |
| [W11](../work-types/W11-run-a-live-probe-or-smoke.md) | run-a-live-probe-or-smoke - observe live behavior at a revision | You need to observe live behaviour at a specific revision |
| [W14](../work-types/W14-design-a-contract-or-invariant.md) | design-a-contract-or-invariant - author a design-of-record | You are authoring a design of record, a contract or an invariant |
<!-- END GENERATED -->
