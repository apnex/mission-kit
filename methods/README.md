---
id: M0
category: method
title: Methods - procedures that produce a result of their own
status: active
hydrate-when: You are choosing how to run a review, an audit or another procedure, or deciding whether guidance is a procedure, a rule, a practice or style
supersedes: []
related: [S0, P0, K0, W0, E4, RU0, PC0]
---

# Methods - the how-you-operate layer

## Purpose

Procedures.\
Named steps that **produce a result of their own** - a verdict, an artifact, a record - each applying only in the situation it names and binding once you are in it.

A methodology entry is a procedure: following it yields something that would not exist otherwise, and how it is followed decides whether that result can be trusted.\
Guidance that governs how work is done and produces nothing of its own is a rule, in [`rules/`](../rules/README.md), or a practice, in [`practices/`](../practices/README.md).\
It is a *situated move* in the sense [`A0`](../axioms/README.md) draws - you reach for it when the work matches its trigger, unlike an axiom, which is in force whether you reach for it or not.\
A procedure is declined by not being in its situation, never by deciding it does not apply once you are.

The set exists because conduct is where reliable work and adequate work diverge invisibly.\
Two procedures of very different reliability can produce the same artifact, and the artifact will not say which was used.\
Without a named procedure the difference is discovered only after it has cost something.

---

## Territory

This set covers **the procedures inside a unit of engineering work** - the points where a result is produced, and how it is produced decides whether it can be trusted.

A unit of work has six moments, and they are the denominator for this set and for `rules/` and `practices/`, which use the same names: **entering**, **committing to a design**, **verifying**, **deciding what to keep**, **treating the record**, and **handing over**.\
Every member is placed by its own trigger, in exactly one moment; procedures sit at four of the six.

| Moment | The decision | Members |
|---|---|---|
| **Entering** | how to begin in an unfamiliar collection or system | [`M8`](M8-artifact-bootstrap.md) |
| **Committing to a design** | whether a design is anchored before it is built | [`M7`](M7-axiom-alignment-audit.md) |
| **Verifying** | what evidence is enough to believe the work is correct | [`M1`](M1-triangulated-review.md), [`M2`](M2-test-drive-docs-by-execution.md) |
| **Treating the record** | how content that must not remain in history is removed, with proof | [`M9`](M9-history-content-scrub.md) |

Delta-1 moved the rules that sat here to [`rules/`](../rules/README.md) and a practice to [`practices/`](../practices/README.md), and brought `M9` in from `skills/`; the entries that moved remain here as superseded entries pointing to their successors.

**Two thin moments, recorded rather than filled.**\
*Handing over* - passing work in progress to another agent or a later session - has no procedure at all.\
Every reader of this corpus starts cold, so handover is the moment that condition bites hardest, and it applies to an agent working alone as much as to many: a lone agent hands over to its own next session.\
*Committing to a design* holds only `M7`, which is scoped to extensive design and excludes a short local fix; a decision between those two has nothing proportionate.\
Neither is a defect until something fails there, and both are where to look first when something does.

---

## What belongs here, and what does not

The boundary of this set is the object the rule acts on.

| If the rule governs | It belongs in | Because |
| --- | --- | --- |
| steps that produce a result of their own | `methods/` | the object is the result, and how it is produced |
| how work is done, leaving a trace a check could test | [`rules/`](../rules/README.md) | it produces nothing, and its record shows whether it was kept |
| how work is done, leaving no trace | [`practices/`](../practices/README.md) | it produces nothing, and nothing afterwards shows whether it was followed |
| the artifact you produce | [`style/`](../style/README.md) | the object is the text, and a reader judges it without watching you work |
| the shape of a solution | [`patterns/`](../patterns/README.md) | the object is a design, reusable across processes |
| a capability you execute | [`skills/`](../skills/README.md) | the object is a procedure with inputs and outputs, invoked rather than followed |
| what must always hold | [`axioms/`](../axioms/README.md) | it is not declinable, so it is not a move |

**Placement**, the one statement of it, which `rules/` and `practices/` cite.\
Ask in order, and stop at the first yes:

1. **Is it a limit a system is built toward, in force for every system with the traits it names?** An axiom, in `axioms/`.
2. **Does following it produce a result of its own** - a verdict, an artifact, a record? A procedure, here.
3. **Does it govern how an artifact is written - its form, whatever the work was?** Style, in `style/`.
4. **Does it leave a trace in the record of the work that a check could test?** A rule, in `rules/`.
5. **Otherwise** a practice, in `practices/`.

The first question is about a system's properties, not about how universal a ban sounds: *credentials are never committed* binds an action in a situation, and is a rule.\
The style question is about the object, not checkability: *every deferral records its revival trigger* is visible in text and is still a rule, because it governs what the work records.

---

## What earns an entry

A procedure earns one when following it and not following it produce measurably different work, and the difference has actually been observed.\
A named procedure that everyone already follows codifies nothing.\
A procedure nobody has run is a proposal, not a methodology.

Prefer strengthening an existing entry to adding a neighbour.\
Two procedures differing only in the situation they name will be applied interchangeably, and the distinction they were minted for is lost on first use.\
Before adding one, ask whether it is a new primitive or a new composition of existing members - the second is usually right, and cheaper.

---

## How the procedures compose

Members cite each other and the rules and practices around them.

**One primitive carries the set.**\
[`M1`](M1-triangulated-review.md) - independent inputs before a verdict - is the independence the verifying procedures specialise.

**Two members are compound.**\
[`M7`](M7-axiom-alignment-audit.md) and [`M8`](M8-artifact-bootstrap.md) cite primitives and are cited by none.\
They are assembled from other procedures rather than new primitives.

**Rules hold what procedures record.**\
The discipline about work that does not land - reject it deliberately, record it with a condition for its return, and never rewrite the record - was a cluster here, and is now rules: [`RU1`](../rules/RU1-default-reject-honest-yield.md), [`RU3`](../rules/RU3-anti-amnesia-deferral.md) and [`RU2`](../rules/RU2-frozen-history-rule.md).\
A procedure that cuts or defers anything is held by them.
---

## Faults

Population faults only - each is visible across the set and invisible to any single procedure.\
A failure mode of one procedure belongs in that procedure.

- **The procedure that produces nothing.** Guidance filed here that yields no result of its own; it is a rule if it leaves a trace, and a practice if it does not.
- **The style rule in process clothing.** A convention about the artifact filed here, where the people who write artifacts do not look for it.
- **The procedure that is really a skill.** A named capability with inputs and outputs, filed as a way of working. It belongs in `skills/`, where it can be invoked.
- **The ceremony.** A step retained because it is in the procedure, after the failure it guarded against became impossible. Procedures accrete; nothing prunes them unless the entry says what it is protecting against.
- **The orphaned primitive.** A procedure that composes with nothing and is cited by nothing. It may be load-bearing and unrecognised, or a habit wearing a methodology's name; the graph cannot tell which, and the absence of edges is the prompt to ask.
- **The unguarded moment.** A recurring failure at a point in the work no procedure covers. It is this set's characteristic gap, and it stays invisible until the territory is read against what actually went wrong.

---

## Index

<!-- BEGIN GENERATED: entries. Run tools/generate-index.mjs; do not edit by hand. -->
| ID | Title | Status | Hydrate when |
|---|---|---|---|
| [M0](README.md) | Methods - procedures that produce a result of their own | active | You are choosing how to run a review, an audit or another procedure, or deciding whether guidance is a procedure, a rule, a practice or style |
| [M1](M1-triangulated-review.md) | Triangulated review - minimum 4 independent inputs | active | You are reviewing a patch or design that ships to production or upstream |
| [M2](M2-test-drive-docs-by-execution.md) | Test-drive docs by execution - run the steps, or have a cold reader reason with it | active | You are about to ship a document someone will act on - an operator workflow, or a charter, axiom or other reasoning document an agent will rely on |
| [M3](M3-default-reject-honest-yield.md) | Default-reject discipline + honest yield reporting | superseded | You have arrived by an old reference to M3, which has moved and is superseded by RU1 |
| [M4](M4-frozen-history-rule.md) | Frozen-history rule | superseded | You have arrived by an old reference to M4, which has moved and is superseded by RU2 |
| [M5](M5-anti-amnesia-deferral.md) | Anti-amnesia deferral - every parked or cut item carries a revival trigger | superseded | You have arrived by an old reference to M5, which has moved and is superseded by RU3 |
| [M6](M6-author-from-exemplar.md) | Author from exemplar - read a peer instance before adding to a collection | superseded | You have arrived by an old reference to M6, which has moved and is superseded by PC1 |
| [M7](M7-axiom-alignment-audit.md) | Axiom alignment audit - required gate for extensive planning/design | active | You are judging whether a design decision is anchored to a first principle |
| [M8](M8-artifact-bootstrap.md) | Artifact bootstrap - enter the loop at its inlet, one ratified type at a time | active | You are adopting the artifact document set in a project that does not use it yet |
| [M9](M9-history-content-scrub.md) | History content scrub | active | You must remove content from history that is already committed |
<!-- END GENERATED -->
