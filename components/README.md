---
id: C0
category: component
title: Components - sovereign shareable substrates to be used rather than rebuilt
status: active
hydrate-when: You are about to build a capability that may already exist as a unit you could depend on instead
supersedes: []
related: [P0, M0, A3]
---

# Components

Sovereign, shareable substrates that should be **used** rather than rebuilt.

This entry is the layer's composition rule: it states what earns a component entry and how closeness of fit is judged, and it registers no component itself.\
It is not a component, which is why the component body shape declared in [`SC6`](../schemas/SC6-entry-body.md) exempts it.

A component entry is a portable definition and a reference: what the component's single duty is, what contract it exposes, and where the implementation lives.\
The definition is held here so it is citable and comparable.\
The implementation is not, because vendoring code into a cross-project corpus is how a knowledge base becomes a monorepo.

## Why the layer exists

[`A3`](../axioms/A3-sovereign-composition.md) mandates that a new capability is assembled by composing existing units rather than by modifying them, and its success signals ask that new capabilities arrive by composition.\
The corpus asserted this and offered nothing to compose.\
`patterns/` holds solution shapes rather than units, `bundles/` composes skills rather than substrate, and every structural definition in the repository sat inside a teaching skill as an example.

Without an index, the default is to rebuild.\
Rebuilding is not merely wasted effort; it produces a second unit with the same duty and a slightly different contract, which is the coupling `A3` exists to prevent.

---

## Use before build

The registry is a catalogue, not a discipline.\
The obligation to search it, to weigh closeness of fit, and to adjust or split an existing component rather than author a new one is a procedure, and procedures live in [`methodology/`](../methodology/README.md).\
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

This is what makes the registry's target reachable.\
A managed set of orthogonal duties is a claim about architecture altitude; below that altitude feature counts are unbounded, and they are not what a consumer is choosing between when deciding what to assemble from.

---

## Body shape

The shape is declared in [`SC6`](../schemas/SC6-entry-body.md) and enforced by `tools/check-entry-body.sh`, so this list is a reading of the contract rather than a second copy of it.

- **Duty** - the single concern, stated so that "and" or "also" would be a violation.
- **Contract** - the interface a consumer depends on.
- **Reference** - where the implementation lives, pinned.
- **Fit criteria** - when to reach for it, and when it is the wrong tool.
- **Adjustment policy** - how it may be extended without forking.
- **Edges** - `composes` and `composed-by`, so depth is derived rather than named.

---

## Faults

- **The reinvented unit.** The same boundary drawn again because nothing named it the first time. Two implementations, two contracts, one duty.
- **The fork disguised as a variant.** A copy adjusted locally instead of the original being adjusted centrally. Both copies read as authoritative and they drift apart silently.
- **The dual-duty component.** A unit that accreted a second concern and was never split, so consumers depend on it for unrelated reasons and it can no longer change.
- **The squatting project.** Project-specific code indexed as a portable component. It fails the first time another team reaches for it.
- **The index nobody searches.** A registry that exists while work still starts from scratch. The catalogue is necessary and is not sufficient.

---

## Index

<!-- BEGIN GENERATED: entries. Run tools/generate-index.mjs; do not edit by hand. -->
| ID | Title | Hydrate when |
|---|---|---|
| [C0](README.md) | Components - sovereign shareable substrates to be used rather than rebuilt | You are about to build a capability that may already exist as a unit you could depend on instead |
| [C1](C1-agp.md) | AGP - name-addressed routing between application components | Parts of your application must reach each other and you are about to write the code that connects them |
<!-- END GENERATED -->
