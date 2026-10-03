---
id: A0
category: axiom
title: Axioms - standing commitments, what brings one into force, and how they compose
status: active
hydrate-when: You are deciding whether a principle is a standing commitment or a situated move, or which axioms bind the system in front of you
supersedes: []
related: [SC6, W0, R0, D0, E1, E5, E6, T0]
---

# Axioms - the standing-commitment layer

## Purpose

Foundational, always-in-force principles for aligned systems.\
The layer that states the limits a system is built toward, beneath the tactical entries.

This entry is the layer's composition rule, in the shape [`AR0`](../artifacts/README.md) and [`W0`](../work-types/README.md) use: it states what an axiom is, what brings one into force, and how the set composes, and it does not restate any individual axiom - its territory characterises what each protects without repeating any mandate.\
It is not itself an axiom, which is why the axiom body shape declared in [`SC6`](../schemas/SC6-entry-body.md) exempts it, and why the frontmatter contract does not ask it for `applies-to`.

**On the `A0` slot.**\
`0` is the charter slot in every layer that has one, and no entry has ever held it elsewhere.\
It was occupied here by a pre-corpus umbrella axiom, which is the anomaly rather than the precedent; that entry has been dissolved and its load-bearing content distributed to three homes.\
Its account of how the axioms compose - and its faults *Fragmented Asymptote* and *Umbrella Amnesia* - are in this charter, below.\
Its definition of sovereign hierarchy is [`E1`](../entities/E1-sovereign-hierarchy.md).\
Its vision mandate was dropped, because the corpus charter already carries one.\
This is recorded so the next reader does not rediscover the question: reclaiming a charter slot is not the ID reuse that the root charter forbids.

---

## Territory

This set covers **the limits a system is built toward to stay aligned with its own intent** - the ones where moving away makes a system wrong in a way more effort elsewhere cannot repair.

The applicability tags below say *when* an axiom binds.\
They do not say *what it protects*, and a set can be fully tagged while leaving a whole kind of failure unforbidden.\
So the territory is partitioned by what each axiom protects, read from the mandates themselves.

| Protects | The failure it forbids | Axioms |
|---|---|---|
| **Truth** | a system whose state, specification or view of itself is false or unknowable | [`A1`](A1-sovereign-state-transparency.md) [`A2`](A2-isomorphic-specification.md) [`A5`](A5-perceptual-parity.md) |
| **Structure** | boundaries that leak, and layers promoted before they hold | [`A3`](A3-sovereign-composition.md) [`A8`](A8-gated-recursive-integrity.md) [`A9`](A9-chaos-validated-deployment.md) |
| **Knowledge** | reasoning lost in transfer, compression or forgetting | [`A4`](A4-zero-loss-knowledge.md) [`A12`](A12-precision-context-engineering.md) [`A14`](A14-compounding-learning.md) |
| **Operation** | work that stalls, fails silently, or cannot repair itself | [`A6`](A6-frictionless-agentic-collaboration.md) [`A7`](A7-resilient-agentic-operations.md) [`A10`](A10-autopoietic-evolution.md) |
| **Cognition and authority** | judgement spent where a script would do, or exercised without the authority to hold it | [`A11`](A11-cognitive-minimalism.md) [`A13`](A13-director-intent-amplification.md) |

Every axiom sits in exactly one row.\
The partition is derived rather than imposed: of the thirty-five relations axioms declare to one another, fifteen fall within a row, about three times the five an arbitrary split into rows of these sizes would place there.

**A gap the territory exposes: nothing protects an agent against its own error.**\
Collaborating agents are assumed to act in good faith, so malice is out of scope.\
Accidental misalignment is not, and an organisation of one has no second actor: the agent most likely to be wrong is the agent doing the work.\
A confident inference reported as measured, a claim corroborated because it was wanted, an instrument checking its own output - each is defended in this corpus by standing doctrine and by independence that needs a second actor.\
Neither is an axiom, so the protection most load-bearing for an agent working alone has no first principle.\
Thirteen of the fourteen axioms can bind a lone agent - every one except `A6`, which concerns collaboration itself - and none states it.

That is recorded as a gap, not filled.\
An axiom earns its place by forbidding something the others permit, and whether this is a new axiom or a property one of the existing fourteen should state - [`A8`](A8-gated-recursive-integrity.md)'s refusal to promote unproven work and [`A4`](A4-zero-loss-knowledge.md)'s refusal to lose reasoning are nearest - is a question for the set.

**A gap tested and not found.**\
Cost looks absent from the row titles and is not: it is the whole mandate of [`A11`](A11-cognitive-minimalism.md) and [`A12`](A12-precision-context-engineering.md), and five more axioms cite it.

---

## Standing commitment, not situated move

An **axiom** is a load-bearing **asymptote** - a limit a system is built toward to stay aligned with its architecture's intent.\
Its mandate states the limit.\
Few systems reach it, and a system is not wrong for being short of it; it is wrong for moving away from it.

So an axiom binds every change in two directions at once.\
**No change may move the system away from the limit, and each change moves it toward the limit as far as the change's own scope allows.**\
Preserving and improving are one rule: never backwards, and forward with every step.\
It is not advice you weigh against deadlines; once your architecture is in scope, it is always in force.

**How far a change must move is set by its scope** - what the change was undertaken to do, and the parts of the system it touches in doing it.\
A change touches what it modifies, what it newly depends on, and any consumer whose contract it alters; code that merely sits beside it, in the same file or module, is not touched.\
Scope and binding are different sets: a component the change newly depends on through a declared interface is touched but not altered, so its gaps must not be built on, and its axioms do not bind the change.\
Inside the scope, build at the limit or nearer to it than what was there: new work never repeats a gap the axiom names, and work that touches a gap closes as much of it as the touch allows.\
**Beyond the scope, improvement is considered, never mandated.**\
A gap or friction in a component [adjacent](../entities/E6-component.md) to what the change touches - one it stands on, or one that stands on it, through a declared interface - may be closed opportunistically when compounding learning supports it ([`A14`](A14-compounding-learning.md), *tangent discipline*): the payback is near, strongest where the work stands on the component; the yield is captured; and the cost does not significantly distract from the change's own goal.\
A gap that fails that test - not adjacent, too little payback, or large enough to displace the goal - is recorded with its evidence and a revival trigger ([`RU3`](../rules/RU3-anti-amnesia-deferral.md)) rather than closed, because larger choices of what work happens next are the director's ([`R4`](../roles/R4-director.md), [`AR3`](../artifacts/AR3-board.md)).\
An opportunistic improvement is made as a change of its own, so its yield is captured and its cost is visible, and like any change it answers to every system it alters - if it changes a component's interface, its consumers are altered too, or for a versioned interface those that adopt it ([`E5`](../entities/E5-system.md)).\
Either way the gap is recorded.\
Passing it silently is what the axiom forbids; chasing the limit far from the change's goal is the *tangent sprawl* `A14` names.

A gate that passes or fails a change is consistent with this, not in tension with it.\
The gate's question is binary - may this change be promoted - and the direction rule is what it can check: that the change moved the system no further from any limit in force, and repeated no gap it touched.

This is what separates axioms from the tactical `S` / `M` / `P` / `K` entries.\
A Style, Methodology, Pattern, or Skill entry is a *situated move*: you reach for it when a specific task touches its domain, and it does not apply when no task does.\
An axiom is a *standing commitment*: it holds across every task for as long as your system claims the architectural assumptions the axiom depends on.

Where an `S`/`M`/`P`/`K` entry answers "how should I do this thing well?", an axiom answers "what must I never move this system away from, and what should every change move it toward?".

---

## What brings an axiom into force

`applies-to` is each axiom's **domain of validity** - the set of architectural assumptions under which the axiom is load-bearing.\
An axiom is in force for a system if, and only if, that system's architecture satisfies **at least one** of the axiom's `applies-to` tags.\
Tags are alternatives, not a conjunction: an axiom tagged `multi-agent` and `autonomous` binds a system that is either.\
A project does not adopt all axioms by fiat; it adopts the axioms whose tags its architecture actually satisfies.\
The more architectural commitments a system makes, the more axioms come into force for it.

The vocabulary is defined in [`traits/`](../traits/README.md), one entry per trait, each with an observable test a reader can apply to their own system: [`T1`](../traits/T1-stateful.md) stateful, [`T2`](../traits/T2-declarative.md) declarative, [`T3`](../traits/T3-multi-agent.md) multi-agent, [`T4`](../traits/T4-autonomous.md) autonomous, [`T5`](../traits/T5-llm-in-the-loop.md) llm-in-the-loop.\
`any-system` is the floor rather than a trait: an axiom tagged with it binds every system.\
The contract accepts only these values, so an undefined tag is refused rather than silently binding nothing.

`applies-to` answers *whether* an axiom binds, and it is the only field that does.\
What the axiom then demands on a particular subject surface is a question for the [`domains/`](../domains/README.md) axis.\
The two stack rather than compete, and the direction is one-way: a domain entry cites the axioms it must satisfy, and no axiom names a domain.\
An axiom that named domains would couple a stable invariant to a mutable taxonomy.

**An axiom binds a system, and a change answers to every system it alters.**\
That is the system it modifies, every system containing it, and any system whose contract with it the change alters.\
A system it only composes with, through a contract the change leaves as it was, is not altered, and its axioms do not bind.\
Where one unit depends on another and no boundary between them is declared and honoured - none written, or one written and reached past - nothing shows the change is contained, so the two are one system with the traits of both, and the axioms either unit would bring all bind - and the undeclared dependency is itself a fault under [`A3`](A3-sovereign-composition.md).\
*System*, *contain* and *compose* are defined in [`E5`](../entities/E5-system.md).

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

Adopt the rows your architecture satisfies: a plain library takes `any-system`; a system carrying every tag takes all fourteen.

---

## How the set composes

The axioms are **orthogonal in statement and conjunctive in force**.\
Orthogonal means no axiom is derivable from another, so each earns its place by forbidding something the others permit.\
Conjunctive means every axiom in force binds every change at once: a change that moves the system toward thirteen limits and away from the fourteenth is a regression with thirteen consolations, not partial progress.

> **CORRECTION - axioms were described here as invariants that hold or fail.**\
> This sentence read: *the set holds only when every axiom in force holds simultaneously; satisfying thirteen of fourteen is not partial compliance, it is a violated system with thirteen consolations.*\
> Read as pass or fail, nearly every real system fails nearly every axiom, and the rule gives no direction.\
> Three blind readers took the charter at its word and defined an axiom as a test a change must not fail; none read it as a limit to advance toward.\
> The director ruled the asymptote reading, and the conjunctive claim is kept in that form: no axiom may be traded against another.

Composition therefore runs through the tags, not through a hierarchy.\
There is deliberately **no apex axiom**.\
A single umbrella under which the others are sub-conditions reads as a synthesis and behaves as a duplicate: it restates its constituents, so it can never fail independently of them, and an axiom that cannot fail on its own is not one.\
The set's coherence is a property to be checked rather than an entry to be written, and [`M7`](../methods/M7-axiom-alignment-audit.md) is where that check lives.

**Weight is uneven, and the unevenness is information.**\
Measured across the corpus, the most-cited axiom is referenced from about six times as many files as the least.

| Most cited | Files | | Least cited | Files |
|---|---|---|---|---|
| `A8` Gated Recursive Integrity | 31 | | `A9` Chaos-Validated Deployment | 5 |
| `A3` Sovereign Composition | 26 | | `A5` Perceptual Parity | 8 |
| `A11` Cognitive Minimalism | 23 | | `A10` Autopoietic Evolution | 9 |

Citation count is not importance, and both readings of a low count are legitimate.\
An axiom cited by nothing may be dead weight, or may be holding a boundary nobody tests; one cited by everything may be load-bearing, or too vague to fail.\
The pointed case is `A9`: tagged `any-system`, so binding every system unconditionally, and the least exercised axiom in the set.

What a whole-design question needs is a *procedure* that walks the set, not a *principle* that claims to summarise it.

---

## Entry shape

Frontmatter is governed by [`SC1`](../schemas/SC1-catalog-entry.md), which requires `applies-to` and `related` of every axiom, and the body by [`SC6`](../schemas/SC6-entry-body.md), enforced by `tools/check-entry-body.sh`.\
The list below is a reading of those contracts rather than a second copy of them.

- **Mandate** - the limit, stated as a standing commitment. The state the system is built toward.
- **Mechanics** - how the limit is approached and held in a real system. The structural means by which the mandate becomes true rather than aspirational.
- **Rationale** - why the limit is load-bearing. What architectural intent it protects.
- **Faults** - the failure modes of a system short of the limit or moving away from it. The named pathologies you observe, and the gaps a change must not repeat.
- **Success signals** - the observable evidence of where a system stands against the limit. What you measure to show a change moved toward it.

Axioms carry this shape rather than the `S`/`M`/`P`/`K` skeleton because an axiom states a limit and its consequences rather than a situated move.

---

## Faults

- **Fragmented Asymptote.** Contributors optimise locally without knowing the global target, and local maxima diverge from the system's intended limit. The remedy is a traversable set plus a procedure that walks it, never a summary entry.
- **The conformance reading.** An axiom treated as a pass-or-fail test. A system short of the limit reads either as already failed, so nothing is owed, or as passing because the change added no new violation, so nothing moves. Either way no change advances the system, and the gaps the axioms name become permanent.
- **Umbrella Amnesia.** An addition that contradicts the set is proposed and accepted because nothing tested it against the set. The set is only a constitution if something reads it at admission time.
- **The restated axiom.** An entry that is true because its neighbours are true. It cannot fail independently, so it cannot be violated, so it constrains nothing.
- **The situated move in axiom clothing.** A tactical rule promoted for importance rather than for being always-in-force. It is declinable in practice, and its presence teaches that axioms are declinable.
- **The ungated adoption.** A project claiming an axiom whose `applies-to` tags its architecture does not satisfy. The claim is unfalsifiable, and it dilutes the tags for every project that reads them.

---

## Index

<!-- BEGIN GENERATED: entries. Run tools/generate-index.mjs; do not edit by hand. -->
| ID | Title | Hydrate when |
|---|---|---|
| [A0](README.md) | Axioms - standing commitments, what brings one into force, and how they compose | You are deciding whether a principle is a standing commitment or a situated move, or which axioms bind the system in front of you |
| [A1](A1-sovereign-state-transparency.md) | Sovereign State Transparency | You cannot see the current state of the system from one place and are about to infer it |
| [A2](A2-isomorphic-specification.md) | Isomorphic Specification | Declared intent and running reality have drifted, or you are about to change one without the other |
| [A3](A3-sovereign-composition.md) | Sovereign Composition | You are deciding whether a concern belongs behind a new boundary or an existing one |
| [A4](A4-zero-loss-knowledge.md) | Zero-Loss Knowledge | You are about to summarise an artifact rather than carry it forward whole |
| [A5](A5-perceptual-parity.md) | Perceptual Parity | An agent is about to act on state it derived rather than state it was given |
| [A6](A6-frictionless-agentic-collaboration.md) | Frictionless Agentic Collaboration | You are designing a seam between two agents that must collaborate without a human relay |
| [A7](A7-resilient-agentic-operations.md) | Resilient Agentic Operations | You are deciding how the system should behave when a unit of work fails or a thread stalls |
| [A8](A8-gated-recursive-integrity.md) | Gated Recursive Integrity | You are about to promote something past a gate, or deciding what the gate must prove |
| [A9](A9-chaos-validated-deployment.md) | Chaos-Validated Deployment | You are about to trust a deployment you have not seen survive failure |
| [A10](A10-autopoietic-evolution.md) | Autopoietic Evolution | Friction has surfaced during work and you are deciding whether to route around it or fix its cause |
| [A11](A11-cognitive-minimalism.md) | Cognitive Minimalism | You are about to have an agent do work that deterministic code could do instead |
| [A12](A12-precision-context-engineering.md) | Precision Context Engineering | You are assembling the context for an invocation and deciding what earns its place |
| [A13](A13-director-intent-amplification.md) | Director Intent Amplification | You are about to consume the director's attention, or to decide something in their absence |
| [A14](A14-compounding-learning.md) | Compounding Learning | You have learned something during work and are deciding whether to capture it |
<!-- END GENERATED -->
