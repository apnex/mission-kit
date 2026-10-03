---
id: D0
category: domain
title: Domains - the N axis (subject-surfaces, bimodal freedom)
status: active
hydrate-when: You are placing a piece of work on the domain axis and need the subject surfaces
related: [W0, R0, A1, A3, A5, T0]
---

# Domains - the N axis

## Purpose

Domains are **subject-surfaces**: a domain names *what a node's evidence resolves against*, and the set claims every surface work's evidence can land on, however many that proves to be.\
The work-*mode* is carried by the work-type, never by the domain - a mode-domain (e.g. `verification`) would double-count with the mode-encoding work-type (`verify-gate` *is* verification) and break orthogonality.

A domain answers one question about a unit of work: *where does its evidence land?*\
It is what makes two pieces of work comparable - a verification of the release channel and a verification of the governance substrate are the same kind of work on different surfaces, and the domain is what tells them apart.

---

## Territory

This set covers **the surfaces an engineering organisation's work lands on** - every place a unit of work's evidence can resolve.

The surfaces group by which part of the organisation they belong to, and those parts are the denominator a gap is checked against.\
Each part is an engineered product: the shipped product, and equally the organisation's own toolchain, control plane and knowledge, which are designed, built, tested and shipped like it.\
A part's domain holds its source and its live state together.\
A part splits into more than one domain only where work on one portion is proved differently and the split has been found needed - the shipped product's delivery and its records have both been split out this way, and a part not yet split may be on the same terms.\
One product's source and live state are therefore one domain's evidence, not two contracts; a domain is stretched when it holds two products, or a portion whose work has been found to need its own proof.

| Part | Where evidence resolves | Domain |
|---|---|---|
| **The product** | its source - code, changes, tests - and the data it holds, live | [`D1`](D1-delivery-code.md) delivery-code, [`D7`](D7-product-data.md) product-data |
| **Its delivery** | released artifacts, how they reach consumers, and the estate they roll out to | [`D2`](D2-distribution.md) distribution |
| **The toolchain** | the harness that builds, launches and hosts the work - its source and its live sessions | [`D3`](D3-tooling-harness.md) tooling-harness |
| **The control plane** | who holds authority, and how work is coordinated - the source of each machinery and the state it holds | [`D4`](D4-authority-governance.md) authority-governance, [`D5`](D5-coordination-substrate.md) coordination-substrate |
| **The knowledge** | what the organisation durably knows - its entries and the tools that check them | [`D6`](D6-knowledge-methodology.md) knowledge-methodology |

Every domain sits in exactly one row.\
Two rows hold two domains, for different reasons.\
The product splits because the evidence differs: its source resolves against code and CI, and its data against the records themselves, before and after.\
The control plane holds two because it is two machineries, each an engineered product: a ruling, and a change to the code that enforces rulings, resolve to authority; a coordination change, to its code or to the state of the work itself, resolves to coordination.

**The set grows when the territory finds a gap.**\
This set is not complete and is not expected to be.\
A surface work lands on that no domain resolves is closed by adding a domain with its own evidence contract, not by stretching a neighbour to cover it, because a stretched domain holds two surfaces' evidence under one name.\
Until the new domain exists, the work is recorded against the gap rather than forced into the nearest domain.\
A gap that fits none of the parts above means the parts are incomplete too, and the part is added with the domain.\
`product-data` entered this way: work on a product's records - applying a schema migration, repairing bad records - had no domain, since `delivery-code` holds the source and `distribution` the estate, and neither holds the records.

**Gaps tested and not found.**\
*Infrastructure* - provisioned machines and networks - is covered, by the same evidence rule as everything else: provisioning code in the product's codebase is `delivery-code`, in the harness it is `tooling-harness`, in the control plane or the knowledge it is that part's domain, and the rolled-out estate is `distribution`.\
That is the difference from data: applying infrastructure changes the estate, which `distribution` covers, and applying a migration changes the records, which `product-data` covers.\
*Incidents* are not a surface at all; see below.

---

## Bimodal freedom (stated, not hidden)

Orthogonality of the domain axis is **partial**, and the taxonomy says so:

- **free** - object-level build/ship/assurance work *acts on* a surface, so the
  domain is a free, discriminating choice (`verifier x audit-surface x
  distribution` != `... x authority-governance`, a role x work-type x domain triple). D1, D2, D3 and D7 are object-level surfaces, reached this way.
- **pinned** - meta/substrate work whose *type names its own surface*: the
  domain is a constant function of the work-type (N=1), so the generator does
  not vary it. A type that names its own surface is substrate work, so pinned
  work lands on the substrate domains - D4, D5 and D6. Which work-types are pinned, and to which domain, is declared on
  each work-type; each domain entry shows a generated view of it.

D4/D5/D6 remain first-class domains (not deletions) because they are still valid **free** targets - every one of them can be audited as a surface in its own right, and built, fixed, retired and shipped, because each is an engineered product with source of its own.\
`domainFreedom` therefore lives on the **work-type**, not the domain.

---

## Tie-break rule for cross-surface fixes

When a fix in one surface serves another (e.g. a `tooling-harness` prompt-table fix that exists to serve `distribution`), **the evidence-target wins**: the domain is the surface the work alters, not the surface whose benefit motivates it.\
That example is `tooling-harness`.\
For a code change, the surface it alters is where its diff lands.\
For an action on live state with no diff - applying infrastructure, applying a migration, restarting a fleet - it is the state the action changes.\
How the work is confirmed does not move it: if the only way to confirm a harness fix is to watch a release go out, the harness is still what was altered, and the domain is still `tooling-harness`.\
This makes cross-surface composition deterministic for two independent generators (A1), on every surface the territory covers.

---

## How domains compose

**The work-type owns the pairing.**\
Which domains a work-type may act on is declared on the work-type, and a pairing outside that list is rejected - constraint 3 of the canonical constraint set in [`W0`](../work-types/README.md), cited rather than restated.\
Whether the domain is free or pinned is also a property of the work-type.\
Each domain entry shows the work-types that act on it, generated from the work-types' own lists, so the two cannot disagree.

**Domains and traits are orthogonal.**\
A domain is where work lands; a [trait](../traits/README.md) is a characteristic of the system being worked on, which decides whether axioms bind it.\
The same domain can be worked on in a stateful system or a stateless one.\
`applies-to` decides *whether* an axiom binds, and the domain decides *what it demands on that surface*; folding one into the other collapses an axis.

**Axioms bind domains one way only.**\
A domain cites the axioms it must satisfy; no axiom names a domain, because that would couple a stable invariant to a mutable taxonomy.

---

## Not a domain: incident-recovery

The domain of an incident is the surface it *hit* - an incident is not itself a subject-surface.\
See `work-types/README.md` (recover-incident posture note).

---

## Axiom alignment

- **A1 (Sovereign State Transparency):** a domain names what a node's evidence
  resolves against, keeping work-truth queryable rather than trapped in prose.
- **A3 (Sovereign Composition):** `domainFreedom: free|pinned` states
  orthogonality honestly (partial for meta-types) instead of manufacturing false
  symmetry - an honest boundary, not a hidden coupling.

---

## Faults

Population faults - visible across the set and invisible to any one domain.

- **The mode-domain.** A domain that is really a mode of work - verification, review - double-counting with the work-type that already carries the mode.
- **The indistinct pair.** Two domains with no difference in what their evidence resolves against. A domain earns its place by a distinct evidence contract, and without one the generator produces two names for the same work.
- **The doubly-declared pairing.** The same pairing stated on both the work-type and the domain by hand, free to disagree. It once existed here - the two sides disagreed in 23 places - and the domain side is now generated from the work-types.
- **The domain named after a tool.** A surface described by one organisation's particular tools rather than by what it is, so a different team cannot place its own work. Five of the seven current members do this in their own entries - every one but `delivery-code` and `product-data` names tools in its subject surface - and it is recorded rather than corrected here.
- **The unresolved surface.** Work whose evidence lands somewhere no domain names, so two people place it differently. The territory exists to make these visible, and a visible one is closed by adding a domain; it records none today.

---

## Index

<!-- BEGIN GENERATED: entries. Run tools/generate-index.mjs; do not edit by hand. -->
| ID | Title | Hydrate when |
|---|---|---|
| [D0](README.md) | Domains - the N axis (subject-surfaces, bimodal freedom) | You are placing a piece of work on the domain axis and need the subject surfaces |
| [D1](D1-delivery-code.md) | delivery-code - the shipped product's codebase | You are changing the codebase of the product the organisation ships |
| [D2](D2-distribution.md) | distribution - release channels and the rollout plane | You are changing how a release reaches its consumers |
| [D3](D3-tooling-harness.md) | tooling-harness - the launch/runtime harness | You are changing the harness that launches or hosts the runtime |
| [D4](D4-authority-governance.md) | authority-governance - the governance/authority substrate | You are changing who holds authority or how governance is enforced |
| [D5](D5-coordination-substrate.md) | coordination-substrate - the WorkGraph/lifecycle/messaging machinery | You are changing the machinery that coordinates work between agents |
| [D6](D6-knowledge-methodology.md) | knowledge-methodology - the durable knowledge capital | You are changing the durable knowledge the organisation keeps |
| [D7](D7-product-data.md) | product-data - the data the product holds | You are changing the data a product holds - applying a schema change to it, or repairing, migrating or deleting its records |
<!-- END GENERATED -->
