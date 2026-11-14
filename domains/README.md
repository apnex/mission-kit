---
id: D0
category: domain
title: Domains - the N axis (subject-surfaces, bimodal freedom)
status: active
hydrate-when: You are placing a piece of work on the domain axis and need the subject surfaces
related: [W0, R0, A1, A3, A5, T0]
---

# Domains - the N axis

## Vision

**North star.**\
One domain for every surface an engineering organisation's work lands on, each with an evidence contract no other shares, so every unit of work resolves to exactly one of them by a rule two independent placers apply alike.\
A *surface* is what a unit of work's evidence resolves against, and its *evidence contract* is how work on it is proved.

**What this set is, and is not.**\
This set is the subject surfaces work lands on - the shipped product, and as fully the organisation's own toolchain, control plane and knowledge.\
It is not a set of work modes, which the work-type carries; not the characteristics of the system being worked on, which are [traits](../traits/README.md); and not incidents, whose domain is the surface they hit.

**Succeeding.**\
Measured on these dimensions, never collapsed into one score:

- **Distinctness** - every domain has an evidence contract no other shares, and none is a mode of work.
- **Determinism** - two independent placers resolve the same unit of work to the same domain.
- **Coverage** - no work is forced into the nearest name; a surface no domain resolves is recorded as a gap until a domain closes it.
- **Portability** - each surface is named by what it is rather than by one organisation's tools, so any team can place its own work.

**Authority.**\
The director holds this vision and ratifies any change to it, under [`M11`](../methods/M11-change-a-charter.md).

**What this vision does not authorise.**\
Citing it admits no member and licenses no change of direction; admission is by the tests in this charter's operating sections.

Domains are **subject-surfaces**: a domain names *what a node's evidence resolves against*, and the set claims every surface work's evidence can land on, however many that proves to be.\
The work-*mode* is carried by the work-type, never by the domain - a mode-domain (e.g. `verification`) would double-count with the mode-encoding work-type (`verify-gate` *is* verification) and break orthogonality.

A domain answers one question about a unit of work: *where does its evidence land?*\
It is what makes two pieces of work comparable - a verification of the release channel and a verification of the governance machinery are the same kind of work on different surfaces, and the domain is what tells them apart.

---

## Territory

**Scope.**\
This set covers **the surfaces an engineering organisation's work lands on** - every place a unit of work's evidence can resolve.\
The organisation's own toolchain, control plane and knowledge are such surfaces as fully as the shipped product, because each is designed, built, tested and shipped like it.

**Growth policy.**\
Uncapped.\
This set is not complete and is not expected to be.\
A member sits at the grain of one evidence contract: one product's source and live state are one domain's evidence, and a product splits into more than one domain only where work on one portion is proved differently and the split has been found needed.\
Members are balanced on distinct evidence contracts, never on modes of work: a surface no domain resolves is closed by adding a domain with its own contract, not by stretching a neighbour, and until then the work is recorded against the gap rather than forced into the nearest domain.

---

## Operation

This set is analysed by [`M12`](../methods/M12-investigate-a-set.md) and its membership changed by [`M13`](../methods/M13-change-a-set.md); this charter is changed by [`M11`](../methods/M11-change-a-charter.md).\
Its members are balanced on distinct evidence contracts, never on modes of work, so an analysis tests each pair of domains for a difference in what their evidence resolves against, and places each unit of work by the tie-break rule below rather than by the surface its benefit lands on.\
A candidate that is a mode of work is routed to [`work-types/`](../work-types/README.md), a characteristic of the system being worked on to [`traits/`](../traits/README.md), and an incident to the surface it hit.\
Which work-types act on which domains is analysed and changed on the work-types, because the domain side of every pairing is generated from them.\
To stress the territory against the surfaces an organisation's work alters, an analysis partitions the domains across the product and its state, the delivery and runtime plane, the control plane, and durable knowledge, samples real changes - including cross-surface fixes and tool-neutral external projects - to verify that two independent placers resolve each change to one domain under the tie-break rule, and audits each member's subject surface for tool-bound naming that would block portability.

---

## Bimodal freedom (stated, not hidden)

Orthogonality of the domain axis is **partial**, and the taxonomy says so:

- **free** - object-level build/ship/assurance work *acts on* a surface, so the
  domain is a free, discriminating choice (`verifier x audit-surface x
  distribution` != `... x authority-governance`, a role x work-type x domain triple).
- **pinned** - meta work whose *type names its own surface*: the
  domain is a constant function of the work-type (N=1), so the generator does
  not vary it. A type that names its own surface is meta work, so pinned
  work lands on the organisation's own domains. Which work-types are pinned, and to which domain, is declared on
  each work-type; each domain entry shows a generated view of it.

The organisation's own domains remain first-class domains (not deletions) because they are still valid **free** targets - every one of them can be audited as a surface in its own right, and built, fixed, retired and shipped, because each is an engineered product with source of its own.\
`domainFreedom` therefore lives on the **work-type**, not the domain.

---

## Tie-break rule for cross-surface fixes

When a fix in one surface serves another (e.g. a `tooling-harness` prompt-table fix that exists to serve `distribution`), **the evidence-target wins**: the domain is the surface the work alters, not the surface whose benefit motivates it.\
That example is `tooling-harness`.\
For a code change, the surface it alters is where its diff lands.\
For an action on live state with no diff - applying infrastructure, applying a migration, restarting a fleet - it is the state the action changes.\
How the work is confirmed does not move it: if the only way to confirm a harness fix is to watch a release go out, the harness is still what was altered, and the domain is still `tooling-harness`.\
This makes cross-surface composition deterministic for two independent generators (A1), on every surface in the set's scope.

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
- **The unresolved surface.** Work whose evidence lands somewhere no domain names, so two people place it differently. Once visible, one is closed by adding a domain.

---

## Index

<!-- BEGIN GENERATED: entries. Run tools/generate-index.mjs; do not edit by hand. -->
| ID | Title | Hydrate when |
|---|---|---|
| [D0](README.md) | Domains - the N axis (subject-surfaces, bimodal freedom) | You are placing a piece of work on the domain axis and need the subject surfaces |
| [D1](D1-delivery-code.md) | delivery-code - the shipped product's codebase | You are changing the codebase of the product the organisation ships |
| [D2](D2-distribution.md) | distribution - release channels and the rollout plane | You are changing how a release reaches its consumers |
| [D3](D3-tooling-harness.md) | tooling-harness - the launch/runtime harness | You are changing the harness that launches or hosts the runtime |
| [D4](D4-authority-governance.md) | authority-governance - the governance/authority machinery | You are changing who holds authority or how governance is enforced |
| [D5](D5-coordination-substrate.md) | coordination-substrate - the WorkGraph/lifecycle/messaging machinery | You are changing the machinery that coordinates work between agents |
| [D6](D6-knowledge-methodology.md) | knowledge-methodology - the durable knowledge capital | You are changing the durable knowledge the organisation keeps |
| [D7](D7-product-data.md) | product-data - the data the product holds | You are changing the data a product holds - applying a schema change to it, or repairing, migrating or deleting its records |
<!-- END GENERATED -->
