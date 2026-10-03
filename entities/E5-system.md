---
id: E5
category: entity
title: system - a unit with a boundary, which traits describe and axioms bind
status: active
hydrate-when: You are deciding which systems' axioms a change answers to, or what counts as the system you are working on
supersedes: []
related: [A0, T0, A3, D0, AR1, E6]
---

# E5 - system

## Definition

A **system** is a unit of engineering with a **boundary**: what is inside it, and the contracts through which anything outside reaches it.\
The boundary separates it from a neighbour only where it is **declared and honoured** - written down, and the only way the neighbour reaches it; where one unit depends on another across a boundary nobody declared, or reaches past one that was declared, the two are one system for deciding what a change answers to.

Traits describe a system, and axioms bind it.\
A trait's test is applied to a system, never to a task, and an axiom is in force for a system rather than for a piece of work.

Systems relate in exactly two ways.

- **Contain.** A system can be made of systems. A module inside a service is a system, and the service contains it, whether or not the module's interfaces are declared. A system has every trait any part it contains has.
- **Compose.** Two systems work together through a declared contract, and neither contains the other. A launcher that hands sessions to a service through a declared interface composes with it.

---

**The organisation doing the work is a system.**\
Its agents, director, records and checks have traits like any system - it holds state in its records, and is multi-agent where work passes between actors - so axioms bind how the work is done, separately from what is built.\
A stateless product built by a team that keeps records it relies on has `A1` binding the team's records, not the product.\
The two are asked separately: which systems a change answers to is a question about the product's systems; the organisation's axioms govern how the change is made and recorded, and are not one of the systems the change alters.

---

## Discriminators

**Contains against composes.**\
Ask whether one unit is part of the other - inside its scope, so that changing it is changing the whole.\
If it is, the other contains it: changing a module changes the service it sits in.\
If the two reach each other only through a declared contract that can stay unchanged while either side changes, they compose.\
If one reaches the other with no declared contract and neither is part of the other, they do neither; see *Boundaries*.

**A declared boundary against an assumed one.**\
A declared boundary is one a reader can point at: an interface, a schema, a protocol, a published version, or an architecture that states the system's scope and its interfaces.\
Behaviour another unit depends on without any declaration is a contract in fact, not a declared boundary - and a change to it reaches across.

**Declared against honoured.**\
A declared interface separates two units only for the neighbours that use it.\
A unit that reaches past it - calling internals, parsing output the interface does not promise - stays one system with it, so declaring an interface and leaving the bypass in place separates nothing.\
The separation is per pair: a neighbour that uses the interface composes with the unit, while one that bypasses it does not.\
A bypass ends one of two ways, after the interface is evaluated against the component's duty: the consumer is moved onto the interface, or the interface is adjusted to what the consumer legitimately needs ([`A3`](../axioms/A3-sovereign-composition.md)).

**A system against a component.**\
A [component](E6-component.md) is a system seen as a part of a containing system.\
Which traits a unit has and which axioms bind it are questions about it as a system; its duty, interfaces and neighbours are questions about it as a component.\
A directory places a component's documents; it is the boundary of neither the system nor the component.

**A versioned contract changes only for the systems that adopt the new version.**\
Publishing a new version of an interface alters no consumer that has not adopted it; each adoption is a change to that consumer, and answers to that consumer's axioms; the component is not altered by being adopted.\
So a change to a shared component's interface reaches the systems that take it up, one adoption at a time - not everything that has ever depended on it.\
A declared version range - *any 2.x* - is adoption in advance: a release within it alters every consumer bound by the range, whether or not the consumer's own files change.

**A system against a domain.**\
A [domain](../domains/README.md) is the surface a piece of work lands on - the codebase, the records, the estate.\
A system is the unit that has traits.\
Work on the records of a stateful service lands on `product-data` and is bound by the service's axioms; neither fact decides the other.

---

## Boundaries

**Not a repository, a deployment unit or a process by definition.**\
One repository can hold several systems, and one system can span several.

**Not defined by size or by traits.**\
A one-shot script with no traits is a system, bound by the axioms every system carries.

**Not separated by an undeclared boundary.**\
Where one unit depends on another and nothing declares the boundary between them, nothing shows that a change to one leaves the other unchanged, so for deciding what binds a change they are **one system, with the traits of both**.\
Declaring the boundary, and moving the dependency onto it, is what makes them two again.\
This is not a third way of relating: two units that depend on each other with no declared contract, neither containing the other, cannot compose, and are treated as one.\
The undeclared dependency is itself a fault against [`A3`](../axioms/A3-sovereign-composition.md), which requires units to interact only through declared contracts.\
The merge chains only through what a change can reach: if A reaches into B and B into C, a change to A is one system with C only when it alters something B takes from C. A change that alters what an undeclared neighbour reaches into owns that boundary: declaring and honouring the interface is inside its scope, not optional.

---

## Relations

**To [`A0`](../axioms/README.md).**\
Axioms bind systems, and `A0` states which systems' axioms a change answers to.\
This entry defines the terms that rule uses and does not restate it.

**To [`T0`](../traits/README.md).**\
A trait is a characteristic of a system, and its test is applied to one.

**To [`A3`](../axioms/A3-sovereign-composition.md).**\
Composition is A3's declared contract.\
A system reaching into another without one is an A3 fault, and it collapses the two into one system for binding.

**To [`AR1`](../artifacts/AR1-system-architecture.md).**\
A system architecture states one system's scope and its interfaces, which is where its boundary is declared.

**To [`D0`](../domains/README.md).**\
Orthogonal: a domain is where work lands, a system is what has traits.

---

## Why precision matters

Which systems' axioms a change answers to depends entirely on this word.\
Asked without it, three cold readers each marked the same three cases unsettled - whether a module answers to its service's axioms, whether a change to an interface reaches the other side, and whether an undeclared dependency does - and guessed.

Conflated in one direction, a change answers to systems it cannot reach: a small shared library would carry the axioms of every system that uses it, and the most-reused code would carry the most obligations.\
Conflated in the other, a stateful system escapes its own axioms by being described as stateless modules, each of which passes on its own.
