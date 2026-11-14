---
id: E3
category: entity
title: set - a bounded population whose charter states what its members owe each other
status: active
hydrate-when: You are writing a charter, adding a member to a curated population, or asking whether a population is complete
supersedes: []
related: [E2, E4, A3, A14, C0, AR0, ST0, S0]
---

# E3 - set

## Definition

A **set** is a bounded population of related items, governed by a **charter** that states what the members owe each other and what the population as a whole must satisfy.

The split that makes the term useful is between **member** and **set**, and it is a split of *duty*, not of location.

A member states what it is, why it exists, and how to apply it.\
It has no standing to describe its siblings, and no way to know whether the population is complete.

A set states what a member cannot: the end state it approaches, the scope it claims and the growth policy by which it grows, how members relate to one another, what admits a new member and what retires one, where members live and what they are called, and what a healthy population looks like as against a merely valid one.

A charter is a set's only voice.\
A set with no charter is a directory listing, because nothing states what the collection is for or when it is wrong.

---

## Discriminators

**Set against layer.**\
[`E2`](E2-layer.md) defines a layer as a top-level directory owning one concern.\
Every knowledge layer **is** a set, and the converse does not hold.\
Two properties separate them, and both are load-bearing rather than pedantic.

- **A layer is flat; a set nests.** A layer is top-level by definition, so a population inside a population cannot be a layer. A set can contain sets.
- **A layer is a directory; a set need not be.** A population can span directories - several entries across two layers governing one concern between them are a set with no folder - and a directory can hold several sets.

Where a set happens to be a layer, both terms apply and neither is redundant: `layer` fixes the directory, prefix and category correspondence, while `set` fixes the population's territory and admission.

**The corpus forms a recursive hierarchy of four set structures across three levels.**\
At the root, the corpus itself is a set chartered by the root [`README.md`](../README.md) and [`VISION.md`](../VISION.md), whose members are the top-level layers ([`E2`](E2-layer.md)).\
At the next level, each knowledge layer is a child set voiced by its `<prefix>0` charter ([`E4`](E4-charter.md)) at `<directory>/README.md`, while [`sets/`](../sets/README.md) (`ST0`) charters spanning sets (`ST1`, and so on) whose members sit across two or more layers.\
Within any layer, a sub-population whose territory, admission, naming or placement differs from its parent's forms a nested sub-set registered in the parent charter's `Sub-sets` (as [`S0`](../style/README.md) registers medium sub-sets).

**Set against collection.**\
A collection is items in one place.\
A set is a collection with a charter, which means it can be asked a question a collection cannot answer: *is anything missing?*\
Without a stated end state and scope a gap is invisible, so an uncharted population can be audited for validity and never for completeness; an investigation against them is what finds the gap.

**Set against category.**\
`category` is the member-side declaration of set membership - the value an entry writes to name the population that governs it.\
The set is the population; the category is the member's claim about it.\
They are not interchangeable for the same reason a layer and a category are not: a set may exist that no category names.

> **AMENDED - a set spanning layers is the exception.** A layer's member names its set in `category`, without a lookup. A set whose members live in several layers declares them itself, in `sets/`, and a member reaches it through the ledger. The rule below holds for layers.

**The charter is resolvable from the member, without a lookup.**\
A knowledge layer's charter is the entry whose id is that set's prefix followed by zero, held at `<directory>/README.md`.\
So an entry read in isolation names its set in `category`, and the rules that govern its population are one hop away rather than somewhere the reader must already know about.\
That regularity is load-bearing rather than tidy: it is what lets a member be self-describing without every member restating what its set owns.\
It is an address, not knowledge: a member need not know its siblings or how its set is governed, only reach the charter that aggregates both ([`E4`](E4-charter.md)).

**A member's row in a parent's index is not a member.**\
When a set contains a set, the child appears in the parent's index carrying a purpose and a description, indistinguishable at that altitude from an entry.\
It is a pointer to a population, not an item, and a reader should be able to tell which without opening it.

---

## Boundaries

**A set does not govern the internals of its members.**\
It fixes what they owe each other; what each *is* remains the member's own.\
A charter that specifies a member's content has absorbed the member's duty and left the member with nothing to state.

**A parent set does not govern a child set's population.**\
Nesting is **delegation, not inheritance.**\
A parent registers a child and states what it is for; the child charter is sovereign over its own territory, admission, naming and placement, and inherits none of the parent's.\
This is what keeps nesting cheap: there is no precedence question, because governance stops at the boundary.

**A set is not its enforcement.**\
Where a set property can be held by a machine it should be, and the charter reads that declaration rather than restating it.\
A charter that copies a machine-held rule creates a second authoritative statement free to drift.

**A population without differing rules is not a sub-set.**\
If a group inside a set needs no territory, admission, naming or placement of its own, it is a group of members and minting a charter for it teaches a distinction the corpus does not make.

---

## Relations

**To [`E2`](E2-layer.md).**\
Every knowledge layer is a set; its charter is the `<prefix>0` entry.\
Not every set is a layer.

**To [`A3`](../axioms/A3-sovereign-composition.md).**\
A set is the unit at which Earned Exposure is judged.\
A concern earns a charter by being one population with its own rules, and a sub-set minted before its rules differ from its parent's is Speculative Surface at population scale.

**To [`A14`](../axioms/A14-compounding-learning.md).**\
A stated territory is what converts a miss into a finding.\
Searching an uncharted population and finding nothing says nothing; searching a charted one and finding nothing is a gap against a stated end state, which an investigation can place.

**To [`C0`](../components/README.md).**\
The components registry is the clearest case of a set whose value is entirely set-level - orthogonality and coverage are properties no single component can hold or assess.

**To [`AR0`](../artifacts/README.md).**\
The artifact types are a set related by a loop rather than by a shared shape, which is why their charter carries a diagram where others carry an admission list.

---

## Why precision matters

Thirteen charters in this corpus, thirteen different shapes.\
An admission rule appears in five of them, a fault list in eight, and a statement of member body shape in none.\
That divergence is not carelessness: each author reasonably invented what a charter covers, because nothing said.

The cost is not untidiness.\
It is that **no population here can currently be asked whether it is complete.**\
Orthogonality tells you whether members overlap and never whether they span, so a set can be perfectly non-redundant and still leave whole territories unaddressed with nothing to detect it.\
Answering *is anything missing* requires a denominator - the end state and scope, against which an investigation partitions the population - and that is a set property no member can supply.

The second cost compounds.\
Where a set's naming and placement go unstated, every adopter chooses and every choice is defensible, so the population fragments while each member passes review.\
A member read in isolation can then state what it is and not what it is called or where its governance is reached - which is exactly the failure a portable corpus cannot afford, because isolation is the normal reading condition rather than the degraded one.
