# Axioms

Foundational, always-in-force principles for aligned systems.\
The "what must always hold" layer beneath the tactical entries.

An **axiom** is a load-bearing invariant - a property a system must preserve to stay aligned with its architecture's intent.\
It is not advice you weigh against deadlines; it is a constraint that, once your architecture is in scope, is always in force.\
This is what separates axioms from the tactical `S` / `M` / `P` / `K` entries.\
A Style, Methodology, Pattern, or Skill entry is a *situated move*: you reach for it when a specific task touches its domain, and you can reasonably decline it.\
An axiom is a *standing commitment*: it holds across every task for as long as your system claims the architectural assumptions the axiom depends on.\
Where an `S`/`M`/`P`/`K` entry answers "how should I do this thing well?", an axiom answers "what must remain true no matter what I do?".

---

## Entry shape

Axioms carry their own body shape rather than the standard `S`/`M`/`P`/`K` skeleton, because an axiom states an invariant and its consequences rather than a situated move.

**Frontmatter** (machine-parseable):
```yaml
id: A0                    # stable ID, prefix A
category: axiom
title: One-line title - imperative or noun-phrase, no period
status: active            # see schemas/catalog-entry for the vocabulary
applies-to: [any-system]  # domain of validity - see Applicability model
related: [A1, A2]         # cross-links to other axioms
```

**Body sections**, in order:

- **Mandate** - the invariant itself, stated as a standing commitment. The thing that must always hold.
- **Mechanics** - how the invariant is realized and enforced in a real system. The structural means by which the mandate becomes true rather than aspirational.
- **Rationale** - why the invariant is load-bearing. What architectural intent it protects.
- **Faults** - the failure modes that appear when the axiom is violated. The named pathologies you observe when the invariant lapses.
- **Success signals** - the observable evidence that the axiom is being upheld. What you can point at to claim conformance.

---


## Applicability model

`applies-to` is each axiom's **domain of validity** - the set of architectural assumptions under which the axiom is load-bearing.\
An axiom is in force for a system if, and only if, that system's architecture satisfies the axiom's `applies-to` tags.\
A project does not adopt all axioms by fiat; it adopts the axioms whose tags its architecture actually satisfies.\
The more architectural commitments a system makes (state, declarative specs, multiple agents, autonomy, an LLM in the loop), the more axioms come into force for it.

The vocabulary:

- **`any-system`** - holds for every system in scope, with no further architectural precondition. The universal floor.
- **`stateful`** - holds for systems that own and mutate persistent state (a store, a backplane, a ledger). In force the moment the system has authoritative state worth being transparent about.
- **`declarative`** - holds for systems whose desired behavior is expressed as specifications reconciled toward, rather than imperative steps executed once.
- **`multi-agent`** - holds for systems where two or more autonomous actors coordinate over shared substrate. In force as soon as collaboration crosses an agent boundary.
- **`autonomous`** - holds for systems that operate and recover without a human in the synchronous loop. In force when the system is expected to keep running unattended.
- **`llm-in-the-loop`** - holds for systems where a language model participates in perception, reasoning, or action. In force whenever model cognition is on the critical path.
- **`umbrella`** - the top-level synthesis axiom. It does not add an independent architectural precondition; it binds the other thirteen into a single coherent intent and is in force whenever any of them are.

---


## Applicability matrix

Axioms grouped by `applies-to` tag, broad to narrow.\
An axiom with multiple tags appears under each tag it carries.

| Tag | Axioms in force |
|---|---|
| `any-system` | A3 Sovereign Composition - A4 Zero-Loss Knowledge - A8 Gated Recursive Integrity - A9 Chaos-Validated Deployment - A14 Compounding Learning |
| `stateful` | A1 Sovereign State Transparency |
| `declarative` | A2 Isomorphic Specification |
| `multi-agent` | A5 Perceptual Parity - A6 Frictionless Agentic Collaboration - A7 Resilient Agentic Operations - A10 Autopoietic Evolution - A13 Director Intent Amplification |
| `autonomous` | A7 Resilient Agentic Operations - A10 Autopoietic Evolution - A13 Director Intent Amplification |
| `llm-in-the-loop` | A5 Perceptual Parity - A11 Cognitive Minimalism - A12 Precision Context Engineering |
| `umbrella` | A0 Sovereign Intelligence Engine |

---


## Adoption guide

Adopt the rows your architecture satisfies: a plain library takes `any-system`; a full agentic-LLM system takes nearly all.

---


## Index

<!-- BEGIN GENERATED: entries. Run tools/generate-index.mjs; do not edit by hand. -->
| ID | Title | Status | Hydrate when |
|---|---|---|---|
| [A0](A0-sovereign-intelligence-engine.md) | Sovereign Intelligence Engine | active | You are justifying a decision against the composing vision rather than a single principle |
| [A1](A1-sovereign-state-transparency.md) | Sovereign State Transparency | active | You cannot see the current state of the system from one place and are about to infer it |
| [A2](A2-isomorphic-specification.md) | Isomorphic Specification | active | Declared intent and running reality have drifted, or you are about to change one without the other |
| [A3](A3-sovereign-composition.md) | Sovereign Composition | active | You are deciding whether a concern belongs behind a new boundary or an existing one |
| [A4](A4-zero-loss-knowledge.md) | Zero-Loss Knowledge | active | You are about to summarise an artifact rather than carry it forward whole |
| [A5](A5-perceptual-parity.md) | Perceptual Parity | active | An agent is about to act on state it derived rather than state it was given |
| [A6](A6-frictionless-agentic-collaboration.md) | Frictionless Agentic Collaboration | active | You are designing a seam between two agents that must collaborate without a human relay |
| [A7](A7-resilient-agentic-operations.md) | Resilient Agentic Operations | active | You are deciding how the system should behave when a unit of work fails or a thread stalls |
| [A8](A8-gated-recursive-integrity.md) | Gated Recursive Integrity | active | You are about to promote something past a gate, or deciding what the gate must prove |
| [A9](A9-chaos-validated-deployment.md) | Chaos-Validated Deployment | active | You are about to trust a deployment you have not seen survive failure |
| [A10](A10-autopoietic-evolution.md) | Autopoietic Evolution | active | Friction has surfaced during work and you are deciding whether to route around it or fix its cause |
| [A11](A11-cognitive-minimalism.md) | Cognitive Minimalism | active | You are about to have an agent do work that deterministic code could do instead |
| [A12](A12-precision-context-engineering.md) | Precision Context Engineering | active | You are assembling the context for an invocation and deciding what earns its place |
| [A13](A13-director-intent-amplification.md) | Director Intent Amplification | active | You are about to consume the director's attention, or to decide something in their absence |
| [A14](A14-compounding-learning.md) | Compounding Learning | active | You have learned something during work and are deciding whether to capture it |
<!-- END GENERATED -->
