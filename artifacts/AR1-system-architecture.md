---
id: AR1
category: artifact
title: System architecture - one system, one altitude, one instant
status: active
hydrate-when: You need to state where a system is or where it is going, and have the two be comparable
recurrence: demonstrated
supersedes: []
related: [AR0, AR2, AR3, A2, A3, A4]
---

# AR1 - system architecture

## Purpose

State a whole system at one altitude, at one instant, so that two instants can be diffed and the difference becomes work.

A system architecture has **no concept of time within it** - it is a photograph, not a film.\
Time enters by which instant the document describes, and by nothing else.\
Sequencing belongs to [`AR2`](AR2-delta.md); an architecture carrying build order has absorbed transition content and stopped being an instant.

**Its subject is the system, never the endeavour.**\
An architecture at either projection states structure - components, duties, interfaces, state, run time.\
Why the programme exists is [`AR6`](AR6-vision.md) and is cited from here rather than restated, which is the discriminator when the two are hard to tell apart: a document that states purpose and names no component is not an architecture at any instant.

**Two temporal projections of one architecture**, declared in frontmatter as `instant: current | target`, conventionally named **CSSA** and **TSSA**:

- **`current`** - where the system is. **Derived, never hand-authored.** A hand-written statement of where we are is a second representation of the running system, and it drifts. It is evidenced instead: from delta exit criteria that are binary and gate-checked, and from what the verification harness proves. At most a thin generated summary sits on top.
- **`target`** - where the system is going. Authored, and **living**: it tracks the ratified ruling corpus continuously rather than being frozen and revised.

They are the same type because they carry the same structure, scope and content - the same components, the same duties, the same tables and diagrams.\
Conceptually they converge as the target is reached.\
In practice the target keeps moving further out while the current state and the deltas reconcile toward it, and that gap is the programme.

---

## Lifecycle stage

Anchor.\
Everything else in the loop cites it: the board proposes moves against the gap between the two instants, deltas route between them, decisions amend the target, and the backlog records what the gap will not close yet.

---

## Required sections

Not a fixed table of contents.\
An architecture is organised as its system is organised, and a shape imposed on an unlike system produces empty headings.\
What is required is that these devices are present and findable.

- **Identity, scope and non-goals.** What the system is, and what it is explicitly not. Non-goals are required, because a scope with no stated exclusions has not been bounded.
- **The justification chain.** Domain, axioms, north star, principles, decisions, model - each layer citing only layers above it. A boundary that cites none of them is not a boundary, it is a preference. The upper layers are **cited and not contained**: the north star is held by [`AR6`](AR6-vision.md) and the rulings by [`AR4`](AR4-decision-record.md), and an architecture that absorbs either has taken on a duty that is not its own.
- **Axiom alignment, including unresolved tension.** Where the architecture stands against the standing commitments it claims, with contradictions named and either discharged by citation or left open. Compliance everywhere is a result an honest audit rarely earns, and claiming it is the finding.
- **The anchored core.** Sovereign components, one duty each, with what each exposes and what it consumes. This is the load-bearing section; everything else elaborates, registers or proves around it.
- **The entity or data model**, and the interfaces between components.
- **Run time.** Lifecycles, state machines, and what happens when.
- **Verification.** How a claim about this system is proved rather than asserted.
- **Risks, divergence, and an owed-and-open register.** What is not designed yet, held as a register rather than as prose.

Two properties govern the whole document rather than any section.

**Per-section maturity.**\
Each section carries a state - approved, provisional, not yet designed - and approval is aggregate-only.\
A section is certified enough to build on, never frozen, and reopens on a named trigger.\
A document with one status for all of it is either lying about its weakest section or blocked by it.

**Generated where generable.**\
Any table or diagram derivable from a declaration is generated from it.\
The measured failure is exact: a hand-drawn diagram carried a stale label past the ruling that changed it, and only a manual audit caught it.\
A generated diagram cannot disagree with the declaration it is drawn from.

---

## Authority

Authored by the architect.\
Ratified by the director, per section and aggregate-only.

The `current` instant carries no author, by construction.\
It is derived, and anyone who hand-edits it has created the drift the type exists to prevent.

---

## Acceptance falsifier

An instance is unacceptable if any of these is observed:

- a component in the anchored core whose duty needs "and" to state;
- a `current` instance with a hand-authored section;
- a section with no maturity state, or a document with a single global one;
- a boundary that cites no layer of the justification chain;
- a ratified decision that names this document in its `affects` list and is not reflected in the section it affects - registration in an index is not absorption;
- build order or sequencing present anywhere in the document.

The last two are mechanical.\
A drift gate that walks ratified decisions and checks absorption is what makes "living" a property of machinery rather than an aspiration, and without one this type is a shape.

---

## Template

No template ships with this entry, deliberately - a fillable skeleton would defeat the "organised as the system is organised" rule and produce empty headings.

Author from a peer instance instead, per [`M6`](../methodology/M6-author-from-exemplar.md).\
Take the devices, not the table of contents.
