---
id: E0
category: entity
title: Entities - precise definitions of load-bearing terms, and what earns one
status: active
hydrate-when: You are about to define a term the corpus leans on, or two readers could act differently on the same sentence
supersedes: []
related: [E1, M0, SC6, A4, AR5]
---

# Entities

## Vision

**North star.**\
Every term the corpus leans on across layers resolves to one definition in one home, so no word carries two meanings and no concept answers to two words.\
A term is *leaned on* when two competent readers could act differently on the same sentence that uses it.

**What this set is, and is not.**\
It is the definitions of what load-bearing terms are, each stating what its term is and what it is not.\
It is not how anything is done, which belongs in [methods](../methods/README.md) or [skills](../skills/README.md), nor the machine-checkable shape of an instance, which belongs in [schemas](../schemas/README.md).

**Succeeding.**\
The set is measured on four dimensions, never collapsed into one score:

- **One home** - no term is defined both here and in a charter or member, and no concept has two entries.
- **Cited** - each definition is cited wherever its term carries weight.
- **Bounded** - each definition states what its term is not, as well as what it is.
- **Coverage** - no load-bearing noun is left for a cold reader to reconstruct.

**Authority.**\
The director holds this vision and ratifies any change to it, under [`M11`](../methods/M11-change-a-charter.md).

**What this vision does not authorise.**\
Citing this vision admits no term and licenses no change of direction; a term is admitted only by the test under *What earns an entry*.

What a thing **is**, never how it is done.

An entity entry fixes the meaning of one term that an engineering organisation cannot afford to leave imprecise.\
This entry is the layer's charter: it states what earns a definition and what shape one takes, and it defines no term itself.\
It is not an entity, which is why the entity body shape declared in [`SC6`](../schemas/SC6-entry-body.md) exempts it.

**Why the layer exists.**\
The corpus runs on terms it has never defined.\
Measured across the entries and skill bodies at the time this layer was created:

| Term | Files using it | Times defined |
| --- | --- | --- |
| `gate` | 91 | 0 |
| `evidence` | 80 | 0 |
| `substrate` | 79 | 0 |
| `sovereign` | 30 | 0 |
| `seal` | 23 | 0 |
| `closeout` | 23 | 0 |
| `lease` | 18 | 0 |
| `arc` | 57 | 13, scattered |

`sovereign` titles three axioms and is defined in none of them.\
`arc` is the worse case: thirteen partial definitions in thirteen places is not a definition, it is drift that has already happened.

A cold agent is the corpus's stated reader, and it cannot instantiate an organisation whose load-bearing nouns resolve to nothing.\
That is the mandate failing on vocabulary rather than on content.

---

## Territory

**Scope.**\
This set covers **every term the corpus leans on across layers where two competent readers could act differently on the same sentence**.\
The claim is set by what the set is for, not by what it holds today.

**Growth policy.**\
Uncapped.\
A member is one term, defined at the grain of a single meaning, earned by what imprecision about it would cost rather than by how often it appears.\
Members are balanced on one home per term - no term defined here and in a charter or member, and no two entries for one concept - and on being cited, so that each definition is reached where its term carries weight.

---

## Operation

This set is analysed by [`M12`](../methods/M12-investigate-a-set.md) and its membership changed by [`M13`](../methods/M13-change-a-set.md); this charter is changed by [`M11`](../methods/M11-change-a-charter.md).\
Its members are balanced on one home per term and on being cited, so an analysis searches the corpus for a term defined both here and elsewhere, and for places a term carries weight without citing its definition.\
A gap is a term that passes the two-readers test under *What earns an entry*, never one that is merely frequent.\
A candidate that names one layer's members is routed to that layer's charter, one that answers how rather than what to [methods](../methods/README.md) or [skills](../skills/README.md), and the shape of an instance to [schemas](../schemas/README.md).\
To stress the territory across layers, an analysis partitions the defined entities across the subjects the corpus leans on - authority, corpus structure, what is engineered, work and its proof, and coordination - scans across knowledge layers for recurring nouns leaned on across two or more layers without an entity entry or with divergent local definitions, and applies the two-readers test to each candidate while recording the dated partition and any gaps in the project's record (in this corpus, `docs/investigations/`) and backlog ([`AR5`](../artifacts/AR5-backlog.md)).

---

## What earns an entry

A term earns one when imprecision about it would cost something real: a wrong gate, a mis-scoped claim, two people building to different meanings of the same word.\
Ubiquity alone does not qualify a term, and neither does jargon that only ever appears inside one skill.

The test is whether two competent readers could act differently on the same sentence.\
If they could, define it.

---

## Neighbours

| Neighbour | The question that separates them |
|---|---|
| A layer's own charter | Does the term name one layer's members, or is it leaned on across layers? A charter states what its members are; an entity for the same word is earned only by the two-readers test across layers, and then it fixes the word's meaning and cites the charter's admission rule rather than restating it. |
| [Schemas](../schemas/README.md) | Is it what a term means, or the machine-checkable shape of an instance? An entity fixes what a word means; a schema field such as [`SC1`](../schemas/SC1-catalog-entry.md)'s `category` carries the value one instance holds. |
| [Methods](../methods/README.md) and [skills](../skills/README.md) | Does it say what a thing is, or how to do something? A procedure belongs in a method, or a skill if it is executable. |
| [Traits](../traits/README.md) | Is it a term the corpus leans on, or a characteristic of a system that decides which axioms bind it? |
| [Artifacts](../artifacts/README.md) | Is it a term, or a document type a lifecycle produces? |

---

## Member shape

Fixed, so definitions can be compared and evaluated rather than merely read.\
The shape is declared in [`SC6`](../schemas/SC6-entry-body.md) and enforced by `tools/check-entry-body.sh`, so this list is a reading of the contract rather than a second copy of it.

- **Definition** - what it is, stated once, without mechanism.
- **Discriminators** - the tests that separate it from its near neighbours.
- **Boundaries** - what it explicitly is not.
- **Relations** - typed edges to other entities.
- **Why precision matters** - what breaks when it is conflated.

The `Boundaries` section is load-bearing rather than decorative.\
A definition that only says what a thing is leaves every adjacent case undecided, which is how one term becomes thirteen.

---

## Composition

Entities compose through the typed edges in each member's `Relations`, and form chains and terms that stand apart.

- **A chain** runs from a term to the one it is a kind of, or a part of; not every instance of the broader term is one of the narrower.
- **A term that stands apart** is ordered by a different relation, and a member a reader could confuse with it says so as a relation, *not to be read as*.
- Entities meet the rest of the corpus by citation, from the layers whose vocabulary they fix.

---

## Faults

- **The undefined noun.** A term load-bearing in dozens of documents and defined in none, so each reader reconstructs it slightly differently and no two reconstructions are compared.
- **The drifted synonym.** Two words for one concept, or one word for two, discovered only when a decision made under one reading is executed under the other.
- **The procedure filed as a definition.** An entry here that answers how instead of what; it belongs in methods or skills, and it hides the absence of a real definition.
- **The glossary nobody cites.** Definitions written once and referenced nowhere, so drift resumes immediately and the layer becomes decoration.
- **The double home.** A term defined both here and in a charter or member, free to disagree.

---

## Index

<!-- BEGIN GENERATED: entries. Run tools/generate-index.mjs; do not edit by hand. -->
| ID | Title | Hydrate when |
|---|---|---|
| [E0](README.md) | Entities - precise definitions of load-bearing terms, and what earns one | You are about to define a term the corpus leans on, or two readers could act differently on the same sentence |
| [E1](E1-sovereign-hierarchy.md) | sovereign-hierarchy - layered authority where each layer holds final say over one class of decision | You are deciding which layer owns a decision, or an actor is about to decide something at another layer's altitude |
| [E2](E2-layer.md) | layer - a top-level directory owning one concern, and the three names a knowledge layer answers to | You are deciding which layer owns an entry, or you have met the words layer, category and prefix and cannot tell whether they name one thing or three |
| [E3](E3-set.md) | set - a bounded population whose charter states what its members owe each other | You are writing a charter, adding a member to a curated population, or asking whether a population is complete |
| [E4](E4-charter.md) | charter - the document that voices a set, and the questions only it can answer | You are writing or revising a charter, or deciding whether a section belongs in one |
| [E5](E5-system.md) | system - a unit with a boundary, which traits describe and axioms bind | You are deciding which systems' axioms a change answers to, or what counts as the system you are working on |
| [E6](E6-component.md) | component - a system seen as a part of a containing system, with one duty at its altitude | You are deciding what a change can reach, what a part of a system owes its neighbours, or which neighbouring parts count as adjacent |
| [E7](E7-gate.md) | gate - a point past which work proceeds only if a stated condition is shown to hold, decided by a machine, an independent agent or the director | You are about to say work passed, failed or is waiting at a gate, or to decide who may judge one |
| [E8](E8-evidence.md) | evidence - something offered to show that a claim holds, which a gate's judge receives and never decides | You are about to record, cite or weigh evidence, or you have met a verdict stored where evidence goes |
| [E9](E9-substrate.md) | substrate - the coordination substrate, the system that hands out, runs and gates work, and nothing else | You are about to write or read the word substrate, or describe the system that coordinates work between agents |
| [E10](E10-arc.md) | arc - a bounded, multi-step initiative that advances toward a declared target across gated steps, and its two representations | You are about to write or read the word arc across layers, or to reconcile its value-chain and coordination-substrate meanings |
<!-- END GENERATED -->
