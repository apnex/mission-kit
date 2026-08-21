---
id: E2
category: entity
title: layer - a top-level directory owning one concern, and the three names a knowledge layer answers to
status: active
hydrate-when: You are deciding which layer owns an entry, or you have met the words layer, category and prefix and cannot tell whether they name one thing or three
supersedes: []
related: [E0, E1, A3, SC1]
---

# E2 - layer

## Definition

A **layer** is a top-level directory of the corpus owning exactly one concern.

Layers come in two species, and the split is what most of the confusion around the term rests on.

- A **knowledge layer** holds entries: units of authored, curated content that state what must be true. It carries an ID prefix, and its contents appear in the ledger.
- A **mechanism layer** holds things that *do* something rather than state something. It carries no prefix, and nothing in it appears in the ledger.

The admission rule that decides which a new directory is, and what admission costs, is the corpus charter's and is not restated here.\
This entry fixes what the word denotes; the charter governs when one may be minted.

---

## Discriminators

**Layer against category.**\
Every category names a knowledge layer, and no category names a mechanism layer.\
`category` is the entry-side projection of a knowledge layer: the value an entry writes in its own frontmatter to declare which layer owns it.\
A layer is a place; a category is an entry's claim about that place.\
The three mechanism layers are layers with no category, which is why the terms cannot be swapped.

**Layer against prefix.**\
The prefix is the layer's identity inside an ID.\
It is how a citation resolves to a layer without a lookup, and it is the only one of the three names that appears in a reference.

**The three names do not derive from one another.**\
For a knowledge layer the directory, the prefix and the category value stand in a fixed 1:1:1 correspondence, but the correspondence is irregular and must be read, never computed.

| Directory | Prefix | Category | Regular? |
| --- | --- | --- | --- |
| `axioms/` | `A` | `axiom` | singularised |
| `skills/` | `K` | `skill` | prefix irregular; `S` was taken |
| `schemas/` | `SC` | `contract` | category is a different word |
| `backlog/` | `MREQ` | `mission-required` | both a different word |
| `work-types/` | `W` | `work-type` | singularised; charter is `WT0` |

Singularising a directory name yields the category for most layers and is wrong for two, which is precisely the kind of near-rule that produces a confident error.

**The altitude test.**\
A layer owns a concern, not a topic.\
If two directories could each plausibly hold the same entry, they are one layer wearing two names.

---

## Boundaries

It is **not** a category.\
A category is a value an entry declares.\
A layer exists whether or not any entry declares it, and three of them cannot be declared at all.

It is **not** a module or a component.\
[`A3`](../axioms/A3-sovereign-composition.md) governs units of running software, each owning one concern behind an interface.\
A layer is a unit of *corpus* organisation and exposes no interface.\
The one-concern rule is shared; nothing else is.

It is **not** an altitude.\
Layers do not sit above or below one another, and no layer overrules another.\
The ordered-authority reading belongs to [`E1`](E1-sovereign-hierarchy.md), and a reader who imports it here will look for a hierarchy among layers that does not exist.

It is **not** a taxonomy of subject matter.\
[`D0`](../domains/README.md) holds the subject axis.\
A layer says what *kind of statement* an entry makes; a domain says what surface the work acts on.\
An entry has exactly one layer and may speak to any number of domains.

---

## Relations

| Edge | Target | Reading |
| --- | --- | --- |
| declared by | [`SC1`](../schemas/SC1-catalog-entry.md) | the `category` field carries an entry's layer, and its enum is the closed list of knowledge layers |
| chartered by | the `0` entry of each prefix | every knowledge layer's charter states what that layer holds and what earns an entry in it |
| shares one-concern with | [`A3`](../axioms/A3-sovereign-composition.md) | the same rule applied to corpus structure rather than to software |
| not to be read as | [`E1`](E1-sovereign-hierarchy.md) | layers are peers; altitudes are ordered |
| distinct from | [`D0`](../domains/README.md) | kind of statement, against subject surface |

---

## Why precision matters

The three names are used interchangeably in prose and are not interchangeable in fact, and the failure is silent in both directions.

A reader who treats `category` as a synonym for `layer` concludes that every layer has one, and then cannot explain `bundles/`.\
A reader who derives a category by singularising a directory writes `schema` or `backlog`, which fails validation immediately - the harmless case - or writes prose asserting a category that does not exist, which fails nothing and is repeated.

The costly version is neither.\
`Category` is a common English word for any grouping, and the corpus also uses it loosely for friction categories, feature taxonomies and survey classifications.\
A structural fact wearing a generic label reads as a loose one, so a reader meets a `Category` column and does not register that it names the directory owning the entry and the prefix its ID must carry.\
The term was ambiguous enough that settling this question required opening the schema, which is the observation that earned this entry.
