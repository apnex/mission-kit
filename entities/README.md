# Entities

What a thing **is**, never how it is done.

An entity entry fixes the meaning of one term that an engineering organisation cannot afford to leave imprecise.\
Every other layer in this corpus answers *how*: methodology how work is conducted, style how artifacts are written, skills how a capability is executed, patterns how a problem is shaped.\
This layer answers *what*, and it is the only one that does.

## Why the layer exists

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

## What earns an entry

A term earns one when imprecision about it would cost something real: a wrong gate, a mis-scoped claim, two people building to different meanings of the same word.\
Ubiquity alone does not qualify a term, and neither does jargon that only ever appears inside one skill.

The test is whether two competent readers could act differently on the same sentence.\
If they could, define it.

---

## Body shape

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

## Faults

- **The undefined noun.** A term load-bearing in dozens of documents and defined in none, so each reader reconstructs it slightly differently and no two reconstructions are compared.
- **The drifted synonym.** Two words for one concept, or one word for two, discovered only when a decision made under one reading is executed under the other.
- **The definition that is a procedure.** An entry that answers how instead of what. It belongs in methodology or skills, and it hides the absence of a real definition.
- **The glossary nobody cites.** Definitions written once and referenced nowhere, so drift resumes immediately and the layer becomes decoration.

---

## Index

<!-- BEGIN GENERATED: entries. Run tools/generate-index.mjs; do not edit by hand. -->
| ID | Title | Status | Hydrate when |
|---|---|---|---|
| [E1](E1-sovereign-hierarchy.md) | sovereign-hierarchy - layered authority where each layer holds final say over one class of decision | active | You are deciding which layer owns a decision, or an actor is about to decide something at another layer's altitude |
<!-- END GENERATED -->
