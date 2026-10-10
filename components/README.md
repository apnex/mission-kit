---
id: C0
category: component
title: Components - sovereign shareable units to be used rather than rebuilt
status: active
hydrate-when: You are about to build a capability that may already exist as a unit you could depend on instead
supersedes: []
related: [P0, M0, A3]
---

# Components

## Vision

**North star.**\
A managed set of orthogonal duties, every one internal and each found and used rather than rebuilt, covers most of what a system needs, with configuration and glue as the remainder, so no duty is implemented twice.\
A duty is one box at architecture altitude, and internal means a sovereign unit under our own authority.\
Duties well defined at that altitude are expected to be orthogonal and to number in the tens, never the thousands; a count far beyond that is a sign that duties are being drawn below architecture altitude or drawn twice, and calls for an investigation of the set, not a decision about any one member.\
That scale describes the registry we intend - a bound, not a target and not a cap - so the count alone never admits, splits, merges, removes or refuses a member.

**What this set is, and is not.**\
It is a registry of portable definitions and references, each stating one duty, the contract it exposes, and where the implementation lives.\
It is not the implementation, not a structure you reproduce in your own code, which is a pattern, and not the obligation to search before building, which is a procedure.

**Succeeding.**\
Measured on four dimensions, never one score, and the first outranks the rest:

- **Adoption** - projects assemble from the registry, and work does not start from scratch; a registry of perfectly orthogonal components that no project assembles from has failed.
- **No duty twice** - no unit reinvented and no fork disguised as a variant.
- **Orthogonality** - no two duties intersect, and none is a composition of others already present.
- **Sovereignty** - the number of external entries falls; the end state is approached and never reached.

**Authority.**\
The director holds this vision and ratifies any change to it, under [`M11`](../methods/M11-change-a-charter.md).

**What this vision does not authorise.**\
Citing it admits no component and licenses no change of direction; admission is by the growth policy under *Territory* and the member shape below.

Sovereign, shareable units that should be **used** rather than rebuilt.

This entry is the layer's composition rule: it states what earns a component entry and how closeness of fit is judged, and it registers no component itself.\
It is not a component, which is why the component body shape declared in [`SC6`](../schemas/SC6-entry-body.md) exempts it.

A component entry is a portable definition and a reference: what the component's single duty is, what contract it exposes, and where the implementation lives.\
The definition is held here so it is citable and comparable.\
The implementation is not, because vendoring code into a cross-project corpus is how a knowledge base becomes a monorepo.

**Why the layer exists.**\
[`A3`](../axioms/A3-sovereign-composition.md) mandates that a new capability is assembled by composing existing units rather than by modifying them, and its success signals ask that new capabilities arrive by composition.\
The corpus asserted this and offered nothing to compose; every structural definition in the repository sat inside a teaching skill as an example.

Without an index, the default is to rebuild.\
Rebuilding is not merely wasted effort; it produces a second unit with the same duty and a slightly different contract, which is the coupling `A3` exists to prevent.

---

## Territory

**Scope.**\
**The scope is the duty space of the systems this organisation builds** - every concern that appears as a box in an architecture's anchored core, at the altitude where a box has one duty.\
Its extent is derivable rather than invented: the union of anchored cores across the architectures this organisation holds.

**Growth policy.**\
Uncapped.\
A member sits at architecture altitude, as one box with one duty; below that altitude a component is many concerns, and they are not members.\
Members are balanced on orthogonality: no two duties intersect and none is a composition of others already present; where orthogonality and adoption conflict, adoption wins and the overlap becomes a finding rather than a refusal.\
A component is admitted when a consumer needs it, not because a gap was named.

---

## Operation

This set is analysed by [`M12`](../methods/M12-investigate-a-set.md) and its membership changed by [`M13`](../methods/M13-change-a-set.md); this charter is changed by [`M11`](../methods/M11-change-a-charter.md).\
Its members are balanced on orthogonality at architecture altitude, and adoption outranks orthogonality: an overlap an analysis finds is recorded as a finding, never resolved by refusing or removing a member.\
Its extent is read from the union of anchored cores across the architectures this organisation holds, and one duty duplicated across projects with no component is a finding of the same kind.\
Every analysis reads the count of external entries, the measurement *Internal and external* declares.\
A misplaced candidate is routed by the neighbour table: a reproduced structure to patterns, an agent capability to skills, a composition of skills into a role to bundles, and the obligation to search before building to methods.

---

## Use before build

The registry is a catalogue, not a discipline.\
The obligation to search it, to weigh closeness of fit, and to adjust or split an existing component rather than author a new one is a procedure, and procedures live in [`methods/`](../methods/README.md).\
Folding it in here would give this layer two concerns.

What the layer does guarantee is that the search is possible: every component states its duty, its contract and its fit criteria, so closeness of fit can be judged without reading the implementation.

A miss is information.\
If a search finds nothing, that is a finding about the index before it is a licence to build.

---

## Adjustment over replacement

A component that almost fits is adjusted, and a component that has grown two duties is split into two sovereign components.\
Neither is a fork.\
Forking produces divergent contracts that both read as authoritative, which is the same failure as never having indexed the component at all.

Splitting is the expected outcome of pressure on a component, not a sign the original was wrong.\
`A3` earns a boundary by having one concern, so discovering a second concern is discovering a second component.

---

## Internal and external

Every component declares its `sovereignty`, and the value decides whether a fit gap has anywhere to go.

**Internal** is a sovereign unit under our own authority.\
A gap is pressure: the component is adjusted so that every consumer gets the change, or it is fractured into sovereign parts and recomposed.\
Either way the decision is a ruling in the component's own record, and the consuming project's measured gap is the evidence for it.

**External** is a unit we do not control.\
There is no upstream to push to, so a gap is adapted at our own boundary, replaced, or absorbed.\
Forking it is the one move that looks like a fix and is not: it makes us the owner of a copy we did not write and cannot re-merge.

An external entry therefore carries an `internalisation-trigger` - the observable condition under which it is replaced by a sovereign internal one.\
The contract requires it, so a dependency cannot be registered without its exit condition and cannot become permanent by inattention.

The intended end state is that every component is internal.\
That is a direction rather than a rule, and holding it as a declared field rather than as a preference is what makes it countable: the number of external entries is a measurement, and it is supposed to fall.

---

## Duty is singular at an altitude

A component's duty is one duty **at the altitude where it appears as a box in an architecture**.\
Descend an altitude and the same component is many concerns, each with a duty of its own.\
Both readings are correct, and the second does not refute the first.

So the "and" test applies to the box, never to the implementation beneath it.\
A component with eight internal parts has not grown eight duties; it has one duty and an anchored core.\
What the test forbids is a *box* whose purpose needs a conjunction to state.

This is what keeps the registry at the scale it intends.\
A managed set of orthogonal duties is a claim about architecture altitude; below that altitude feature counts are unbounded, and they are not what a consumer is choosing between when deciding what to assemble from.

---

## Member shape

The shape is declared in [`SC6`](../schemas/SC6-entry-body.md) and enforced by `tools/check-entry-body.sh`, so this list is a reading of the contract rather than a second copy of it.

- **Duty** - the single concern, stated so that "and" or "also" would be a violation.
- **Contract** - the interface a consumer depends on.
- **Reference** - where the implementation lives, pinned.
- **Fit criteria** - when to reach for it, and when it is the wrong tool.
- **Adjustment policy** - how it may be extended without forking.
- **Edges** - `composes` and `composed-by`, so depth is derived rather than named.

---

## Neighbours

| Neighbour | The question that separates them |
|---|---|
| [Patterns](../patterns/README.md) | Is there an artifact to depend on, or a structure you reproduce in your own code? |
| [Skills](../skills/README.md) | Is it a unit a system depends on, or a capability an agent invokes? |
| [Bundles](../bundles/README.md) | Is it a unit, or a composition of skills into an operator role? |
| [Methods](../methods/README.md) | Is it the registry, or the obligation to search it before building? The obligation is a procedure, and no method holds it yet. |
| [Entities](../entities/README.md) | Is it a registered unit, or the definition of what a component is? [`E6`](../entities/E6-component.md) defines the term; this set registers instances. |

---

## Composition

Components compose by the `composes` and `composed-by` edges each declares, so depth is derived rather than named.\
Coverage of the duty space, orthogonality between duties, and duplication of one duty across projects with no component are how members relate, and they are checked across the set because no member can hold them.

---

## Faults

- **The reinvented unit.** The same boundary drawn again because nothing named it the first time. Two implementations, two contracts, one duty.
- **The fork disguised as a variant.** A copy adjusted locally instead of the original being adjusted centrally. Both copies read as authoritative and they drift apart silently.
- **The squatting project.** Project-specific code indexed as a portable component. It fails the first time another team reaches for it.
- **The index nobody searches.** A registry that exists while work still starts from scratch. The catalogue is necessary and is not sufficient.

---

## Index

<!-- BEGIN GENERATED: entries. Run tools/generate-index.mjs; do not edit by hand. -->
| ID | Title | Hydrate when |
|---|---|---|
| [C0](README.md) | Components - sovereign shareable units to be used rather than rebuilt | You are about to build a capability that may already exist as a unit you could depend on instead |
| [C1](C1-agp.md) | AGP - name-addressed routing between application components | Parts of your application must reach each other and you are about to write the code that connects them |
<!-- END GENERATED -->
