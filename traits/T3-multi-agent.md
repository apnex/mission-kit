---
id: T3
category: trait
title: multi-agent - two or more independent actors coordinate over shared work
status: active
hydrate-when: You are deciding whether more than one actor's work meets in your system
supersedes: []
related: [T0, A16, W0, R0]
---

# T3 - multi-agent

## Definition

A system is **multi-agent** when two or more independent actors - agents, people, or both - coordinate over shared state, so that one actor's output becomes another's input.

---

## Test

Does work cross from one independent actor to another, inside the system?\
If yes, it is multi-agent.\
One actor using several tools is not multi-agent; the tools are not independent actors.

---

## Boundaries

- **Multi-agent:** agents handing work along a pipeline; a human reviewing an agent's output; several agents claiming tasks from a shared queue.
- **Not multi-agent:** a single agent working alone, however many tools or sessions it uses. An agent handing work to its own next session is one actor across time, not two actors.
- **Its complement is not a trait.** In an organisation of one, the obligation to check one's own work by means the author's reasoning cannot bias binds on the floor ([`A16`](../axioms/A16-unbiased-self-check.md)), and when a gate requires an independent agent and none exists, the gate waits or the director decides it ([`W0`](../work-types/README.md), [`R0`](../roles/README.md)); neither obligation needs a solo-agent trait.

---

## Axioms it brings into force

Generated from each axiom's `applies-to`, the field that decides binding.

<!-- BEGIN GENERATED: entries. Run tools/generate-index.mjs; do not edit by hand. -->
| ID | Title | Hydrate when |
|---|---|---|
| [A5](../axioms/A5-perceptual-parity.md) | Perceptual Parity | An agent is about to act on state it derived rather than state it was given |
| [A6](../axioms/A6-frictionless-agentic-collaboration.md) | Frictionless Agentic Collaboration | You are designing a seam between two agents that must collaborate without a human relay |
| [A7](../axioms/A7-resilient-agentic-operations.md) | Resilient Agentic Operations | You are deciding how the system should behave when a unit of work fails or a thread stalls |
| [A10](../axioms/A10-autopoietic-evolution.md) | Autopoietic Evolution | Friction has surfaced during work and you are deciding whether to route around it or fix its cause |
| [A13](../axioms/A13-director-intent-amplification.md) | Director Intent Amplification | You are about to consume the director's attention, or to decide something in their absence |
<!-- END GENERATED -->

An axiom binds a system that has *any one* of its traits, so each axiom above also binds systems that have none of this trait but one of its others.

---

## Why the obligation follows

Every boundary between actors is a place where meaning can be lost, work can be redone, and one actor's error becomes another's premise.\
The obligations this trait brings are all about what must survive a crossing.
