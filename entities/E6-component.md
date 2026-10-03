---
id: E6
category: entity
title: component - a system seen as a part of a containing system, with one duty at its altitude
status: active
hydrate-when: You are deciding what a change can reach, what a part of a system owes its neighbours, or which neighbouring parts count as adjacent
supersedes: []
related: [E5, AR1, C0, A3, A0]
---

# E6 - component

## Definition

A **component** is a [system](E5-system.md) seen as a part of a larger system that contains it.\
It has **one duty** at the altitude where it appears as a part, and it **exposes and consumes interfaces** - what it offers the parts around it, and what it relies on them for.\
Its boundary is those interfaces, and it separates the component from a neighbour only where they are declared and that neighbour uses them.\
A part whose interfaces are undeclared is still a component, but nothing separates it yet: for deciding what a change answers to, it is one system with whatever reaches into it or it reaches into ([`E5`](E5-system.md)).\
Declaring its interfaces, and its neighbours using them, is what separates it.

Every component is a system; *component* names its place in a containing system, not a different kind of thing.\
The same unit is a system when the question is which traits it has and which axioms bind it, and a component when the question is what it owes the whole it sits in.

A component is **adjacent** to another component, or to a system it composes with, when the two share a declared interface - one consumes what the other exposes - whether inside one containing system or across systems.

---

## Discriminators

**Component against system.**\
Ask what question is being answered.\
Traits, axioms and what a change answers to are questions about a system.\
Duty, interfaces, neighbours and blast radius are questions about a component - they only have answers relative to the whole it is part of.\
A system nobody contains, such as a whole product seen from outside, is not a component of anything until it is part of some larger whole.

**One duty, at an altitude.**\
A component's duty is one duty as a box in its containing system's architecture.\
Descend an altitude and it is a containing system in turn, made of components with duties of their own; both readings are correct.\
The test for a second duty applies to the box: a purpose that needs "and" to state is two components.

**Boundary against directory.**\
A component's directory addresses it - where its code and documents live.\
Its boundary is its declared interfaces - what other parts may reach.\
Code in another directory that reaches past the interface is not kept out by the directory; it has crossed the boundary, and it stays one system with the component until it uses the interface.\
A detected crossing is a signal about the interface as well as a fault in the consumer: [`A3`](../axioms/A3-sovereign-composition.md) states what it triggers.

**A component against a registered component.**\
The [`components/`](../components/README.md) layer registers components shareable enough to be used across systems rather than rebuilt.\
Most components are never registered; registration is a property of a few, not part of what a component is.

**Adjacent against nearby.**\
Adjacency is a shared declared interface, in either direction.\
Two components in the same directory or file with no interface between them are nearby and not adjacent.\
Of two adjacent components, the one the other stands on is the closer for compounding learning: payback from improving a part scales with how much the work stands on it.\
That closer direction is what [`A14`](../axioms/A14-compounding-learning.md)'s tangent discipline calls adjacency; the other direction is adjacency with less payback, not none.

---

## Boundaries

**Not a file, module, package, repository or deployable by definition.**\
Any of these is a component when it is a part of a containing system with interfaces of its own, and none is one merely by being that kind of thing.\
One duty and declared interfaces are the limit a component is built toward ([`A3`](../axioms/A3-sovereign-composition.md)), not the price of being one.

**Not a SysML part.**\
A modelling skill represents components as parts; the representation is not the definition.

**Not necessarily shareable.**\
A component of one system with one consumer is still a component.

---

## Relations

**To [`E5`](E5-system.md).**\
A component is a system in a containing system.\
`E5` defines system, contain and compose; this entry defines the part's view of containment.

**To [`AR1`](../artifacts/AR1-system-architecture.md).**\
An architecture's anchored core is its components - one duty each, with what each exposes and consumes.

**To [`C0`](../components/README.md).**\
The registry of shareable components, and the source of *duty is singular at an altitude*.

**To [`A3`](../axioms/A3-sovereign-composition.md).**\
A3 is the limit a component is built toward: one concern, declared interfaces, no reaching into another's internals.

**To [`A0`](../axioms/README.md).**\
A0 states which systems a change answers to and how far improvement reaches; it uses *component* and *adjacent* as defined here.

---

## Why precision matters

Between them, *system* and *component* set the scope of four things.

| Concern | Set by |
|---|---|
| **Duty** | the component - one per box, at its altitude |
| **Interfaces** | the component's declared exposes and consumes - the only legitimate crossings |
| **Blast radius** | a change reaches the component, every system containing it, and an adjacent component only if the interface between them changes - for a versioned interface, only on adoption; and any unit that reaches it, or that it reaches, with no declared interface |
| **Change** | what a change must improve is what it touches; what it may improve opportunistically is adjacent |

Undefined, the word had four senses in this corpus: a box in an architecture, a shareable registered unit, a directory that places documents, and a modelling part.\
Read as a directory, a component's boundary is wherever its folder ends, and code reaching across it from next door looks contained.\
Read as a registered unit, most parts of a system are not components at all, and their duties go unstated.
