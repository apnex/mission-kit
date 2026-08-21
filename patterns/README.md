---
id: P0
category: pattern
title: Patterns - recurring solution shapes, and what separates one from a single good design
status: active
hydrate-when: You are reaching for a known solution shape, or you are deciding whether a design you just built recurs widely enough to be one
supersedes: []
related: [M0, S0, C0, A3]
---

# Patterns - the how-you-shape-it layer

Recurring designs.\
A pattern names the shape of a solution and the forces that make it the right shape, so the next occurrence is recognised rather than rediscovered.

A pattern is not a component.\
[`C0`](../components/README.md) holds units you *use*; this layer holds shapes you *build to*.\
The test is whether there is an artifact to depend on: if the answer is a dependency, it is a component, and if the answer is a structure you reproduce in your own code, it is a pattern.

---

## What earns an entry

Three tests, all of which must pass.

1. **Recurrence across contexts.** The shape has appeared at least twice in situations that do not share an author or a codebase. One occurrence is a design, however good.
2. **Named forces.** The entry states what pressures make the shape correct, not merely what the shape is. Without them the reader cannot tell whether their situation is the one the pattern serves.
3. **A stated cost.** Every pattern trades something. An entry claiming only benefits has not been applied under pressure, and it will be reached for where it does not fit.

The strongest signal is a shape that keeps being rebuilt slightly differently.\
Two implementations that should agree and do not are evidence that the shape is real and that nobody has written it down.

---

## Pattern against anti-pattern

This layer holds shapes to build, and it deliberately does not hold shapes to avoid.\
A failure mode belongs in the `Faults` section of whichever entry owns the invariant it breaks, where the reader meets it while doing the thing that risks it.\
Collected separately, failure modes are read only by people already looking for them, which is never the people about to commit one.

---

## Faults

- **The pattern of one.** A single project's design promoted for elegance. It carries that project's assumptions invisibly, and the second adopter inherits them.
- **The forceless shape.** A structure described without the pressures that justify it, so it is applied by resemblance rather than by fit.
- **The costless claim.** A pattern with no stated trade-off, which reads as a default and is adopted without deliberation.
- **The pattern that should be a component.** A shape reproduced by hand in every consumer when one artifact could have been depended on. Each copy is then free to drift.

---

## Index

<!-- BEGIN GENERATED: entries. Run tools/generate-index.mjs; do not edit by hand. -->
| ID | Title | Status | Hydrate when |
|---|---|---|---|
| [P0](README.md) | Patterns - recurring solution shapes, and what separates one from a single good design | active | You are reaching for a known solution shape, or you are deciding whether a design you just built recurs widely enough to be one |
| [P1](P1-path-a-path-b-dual-substrate.md) | Path A / Path B labeling for dual-substrate workflows | active | You are authoring a workflow document that supports more than one execution path |
| [P2](P2-node-label-gate-cross-component-contracts.md) | Node-label gate for cross-component contracts | active | You have producer and consumer components co-scheduled onto the same nodes |
| [P3](P3-twin-parity-by-generation.md) | Twin-parity by generation - one master, generate the other, gate the round-trip | active | You have a spec and data, or a view and source, that must not disagree |
| [P4](P4-neutral-core-tenant-composition.md) | Neutral core + tenant composition - shared mechanism, injected semantics, promote down by evidence | active | A second domain is about to grow a mechanism the first already has |
| [P5](P5-verbs-as-data-surface.md) | Verbs-as-data surface - one manifest drives dispatch, docs, and validation | active | You are designing a tool surface where each operation needs its own contract |
<!-- END GENERATED -->
