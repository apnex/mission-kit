---
id: T4
category: trait
title: autonomous - the system operates and recovers without a human in the synchronous loop
status: active
hydrate-when: You are deciding whether your system is expected to keep running unattended
supersedes: []
related: [T0]
---

# T4 - autonomous

## Definition

A system is **autonomous** when it is expected to operate, and to recover from failure, without a human in the synchronous loop - so that no person is watching when something goes wrong.

---

## Test

If an operation failed right now, would a human see it before the system acted on the failure?\
If not, it is autonomous.

---

## Boundaries

- **Autonomous:** an agent running a task to completion unattended; a scheduled job; a controller that self-heals.
- **Not autonomous:** an interactive session where a person approves each consequential step.
- **Autonomous for part of its life:** a system supervised while it is built and unattended once deployed carries this trait, because the obligations apply wherever no human is watching.

---

## Axioms it brings into force

Generated from each axiom's `applies-to`, the field that decides binding.

<!-- BEGIN GENERATED: entries. Run tools/generate-index.mjs; do not edit by hand. -->
| ID | Title | Hydrate when |
|---|---|---|
| [A7](../axioms/A7-resilient-agentic-operations.md) | Resilient Agentic Operations | You are deciding how the system should behave when a unit of work fails or a thread stalls |
| [A10](../axioms/A10-autopoietic-evolution.md) | Autopoietic Evolution | Friction has surfaced during work and you are deciding whether to route around it or fix its cause |
| [A13](../axioms/A13-director-intent-amplification.md) | Director Intent Amplification | You are about to consume the director's attention, or to decide something in their absence |
<!-- END GENERATED -->

An axiom binds a system that has *any one* of its traits, so each axiom above also binds systems that have none of this trait but one of its others.

---

## Why the obligation follows

Without a human in the loop, a silent failure has no witness.\
The obligations this trait brings exist because the usual remedy - someone notices - is unavailable.
