---
id: T0
category: trait
title: Traits - characteristics of a system that decide which axioms bind it
status: active
hydrate-when: You need to know whether an axiom applies to the system you are working on, or you are tagging an axiom with the systems it governs
supersedes: []
related: [A0, D0, E3, E4, E5]
---

# Traits

## Vision

**North star.**\
One observable test for every architectural characteristic that changes what a system owes to stay aligned with its intent, so two readers holding the same system reach the same axioms in force.\
What a system *owes* is the set of axioms in force for it, and every axiom's binding is decided by these traits alone.

**What this set is, and is not.**\
This set is the characteristics of a whole system that decide which axioms bind it, each stated as a test a reader can apply to their own system.\
It is not the surface work lands on, which is a domain; not a definition that decides no binding, which is an entity; and not the obligation itself, which is an axiom - and the floor, `any-system`, is not a trait.

**Succeeding.**\
Measured on these dimensions, never collapsed into one score:

- **Agreement** - two readers applying the tests to one system reach the same traits, and so the same axioms.
- **Binding** - every trait is named by an axiom, or would be, and every `applies-to` value other than the floor has a trait behind it.
- **Coverage** - no condition that brings an obligation goes uncaptured, its absence included.
- **Non-overlap** - no two traits settle the same question.

**Authority.**\
The director holds this vision and ratifies any change to it, under [`M11`](../methods/M11-change-a-charter.md).

**What this vision does not authorise.**\
Citing it admits no member and licenses no change of direction; admission is by the tests in this charter's operating sections.

A **trait** is a characteristic of the [system](../entities/E5-system.md) an organisation is working on - stateful, declarative, autonomous - that brings a set of axioms into force.\
An axiom names the traits it governs in its `applies-to` field, and it binds a system that has at least one of them.

The layer exists because a binding decision is only as precise as the words it is made in.\
Before this layer, the six applicability tags were defined in one bullet each inside the axiom charter, and the most-used of them appeared in seventeen files with no definition anything could cite.\
Two readers could reasonably disagree on whether a system was `autonomous`, and the disagreement would decide whether three axioms applied.

---

## Territory

**Scope.**\
This set covers **the architectural characteristics of a system that change what must hold for it to stay aligned with its intent.**\
A characteristic belongs here when its presence brings an obligation that its absence does not - a system with persistent state owes transparency about it, and a system without one owes nothing.\
A characteristic that changes no obligation is not a trait, however real it is.

**Growth policy.**\
Uncapped.\
A member sits at the grain of one characteristic of the whole system, stated as an observable test, that an axiom binds on or would.\
Members are balanced on non-overlap of the question each settles: traits do not exclude one another on a system, no two settle the same question, and a condition whose absence brings an obligation is as eligible as one whose presence does.\
A characteristic that would bring an obligation no trait captures is closed by adding a trait, as `domains/` and `work-types/` grow.

---

## Operation

This set is analysed by [`M12`](../methods/M12-investigate-a-set.md) and its membership changed by [`M13`](../methods/M13-change-a-set.md); this charter is changed by [`M11`](../methods/M11-change-a-charter.md).\
Its members are balanced on non-overlap of the question each settles, so an analysis asks of each pair whether they settle the same question, and of each trait defined by a presence whether the matching absence brings an obligation no trait captures.\
A candidate no axiom binds on, or would, is routed to [`entities/`](../entities/README.md); a surface work lands on is routed to [`domains/`](../domains/README.md); a statement of what must hold is routed to [`axioms/`](../axioms/README.md), all as *What belongs here, and what does not* sets out.\
Because the contract accepts only declared traits as `applies-to` values, adding or retiring a trait changes which axioms bind which systems, so the change is read against every axiom that names it.\
To stress the territory against the systems the corpus governs, an analysis partitions the traits by the architectural question each settles - state and how behaviour is specified, who acts and who is in the loop, and what reasons on the critical path - tests every axiom's `applies-to` tags for floor exclusivity (`any-system` never combined with a trait) and for traits named by only one axiom or none, and tests each trait's absence complement against the axioms, roles, and work-types to confirm whether any uncaptured absence brings an axiom obligation of its own.

---

## The floor

`any-system` is a valid `applies-to` value and is **not** a trait.\
It is the absence of a precondition: an axiom tagged with it binds every system, whatever its traits.\
A system does not have `any-system` the way it has state; it binds by being a system at all.\
It is never combined with a trait, because combining it would add nothing - an axiom binding everything also binds everything with a trait.

---

## What belongs here, and what does not

| If it describes | It belongs in | Because |
|---|---|---|
| a characteristic of the system that changes what must hold | `traits/` | it decides whether an axiom binds |
| the surface the work lands on - the codebase, the channel | [`domains/`](../domains/README.md) | a domain is where evidence resolves, independent of what kind of system it is |
| what a term means, without deciding any binding | [`entities/`](../entities/README.md) | a definition fixes meaning; a trait fixes meaning *and* decides obligation |
| what must hold, given the traits | [`axioms/`](../axioms/README.md) | an axiom is the obligation; a trait is its precondition |

**Traits and domains are orthogonal, and the corpus depends on it.**\
The same domain can be worked on in a stateful system or a stateless one; the same trait can appear on any domain.\
`applies-to` decides *whether* an axiom binds, and the domain decides *what it demands on that surface*.\
Folding one into the other collapses an axis.

---

## What earns an entry

A characteristic earns a trait when an axiom binds on it, or would.\
A trait that no axiom names brings no obligation and is a definition wearing a trait's clothes; it belongs in `entities/`, if anywhere.

A trait states an observable test, not a description.\
*"Owns and mutates persistent state"* is a test a reader can apply to their system; *"is complex"* is not, and a trait no one can apply decides nothing.

---

## How traits compose

**A system has as many traits as it has, and they do not exclude one another.**\
It has every trait any part it contains has: a service with one stateful module is stateful, so a stateful system cannot escape its axioms by being described as stateless parts ([`E5`](../entities/E5-system.md)).\
A single agent that persists memory, runs unattended, and reasons with a model has three traits.

**Traits bind by union.**\
An axiom binds a system that has *any one* of its traits.\
Tags on an axiom are alternatives, never a conjunction - an axiom tagged `multi-agent` and `autonomous` binds a system that is either.\
This is a director ruling, made when six evaluators independently found the binding rule had been ambiguous in every revision of the axiom charter.

**So a system's obligations are the union of every axiom any of its traits brings into force, plus every axiom on the floor.**\
Adding a trait to a system can only add obligations, never remove one.\
Adding a trait to an *axiom* widens the systems it binds.

---

## Faults

Population faults - visible across the set and invisible to any one trait.

- **The undefined tag.** An `applies-to` value with no trait entry behind it. It validates, decides binding, and means whatever its reader assumes. Held by the contract, which accepts only declared traits.
- **The trait that binds nothing.** A characteristic no axiom names. It reads as an obligation and imposes none.
- **The untestable trait.** A characteristic stated so vaguely that a reader cannot tell whether their system has it. It turns every binding decision into an argument.
- **The domain wearing a trait's name.** A surface or subject promoted into this set, coupling a stable obligation to a mutable taxonomy.
- **The missing complement.** A trait defined by the presence of something, whose absence is itself a condition with obligations, and which no trait captures.

---

## Index

<!-- BEGIN GENERATED: entries. Run tools/generate-index.mjs; do not edit by hand. -->
| ID | Title | Hydrate when |
|---|---|---|
| [T0](README.md) | Traits - characteristics of a system that decide which axioms bind it | You need to know whether an axiom applies to the system you are working on, or you are tagging an axiom with the systems it governs |
| [T1](T1-stateful.md) | stateful - the system owns and mutates persistent state | You are deciding whether your system holds state that something else depends on being true |
| [T2](T2-declarative.md) | declarative - the system's behaviour is declared and reconciled toward, not scripted | You are deciding whether your system is driven by a specification it reconciles toward |
| [T3](T3-multi-agent.md) | multi-agent - two or more independent actors coordinate over shared work | You are deciding whether more than one actor's work meets in your system |
| [T4](T4-autonomous.md) | autonomous - the system operates and recovers without a human in the synchronous loop | You are deciding whether your system is expected to keep running unattended |
| [T5](T5-llm-in-the-loop.md) | llm-in-the-loop - a language model reasons on the system's critical path | You are deciding whether model cognition is part of how your system decides or acts |
<!-- END GENERATED -->
