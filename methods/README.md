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

## Vision

**North star.**\
Every point in engineering work where how a result is produced decides whether it can be trusted is met by a proven procedure proportionate to it, composed from a few primitives, so no divergence between reliable and merely adequate conduct is discovered only after it has cost something.\
A proven procedure is one that has been run and shown to change the work.

**What this set is, and is not.**\
It is the set of procedures: named steps that **produce a result of their own** - a verdict, an artifact, a record - each applying only in the situation it names and binding once you are in it.\
It is not guidance that produces nothing of its own, which is a rule, in [`rules/`](../rules/README.md), or a practice, in [`practices/`](../practices/README.md); nor a convention about the artifact, which is style, nor an invocable capability, which is a skill, nor anything in force whether reached for or not, which is an axiom.

**Succeeding.**\
Measured on four dimensions, never collapsed into one score:

- **Proven** - every procedure has been run, and following it was observed to produce different work from not following it.
- **Distinct** - no two procedures differ only in the situation they name.
- **Composed** - a new situation is met by composing existing procedures before a primitive is added, and no procedure stands outside the citation graph unexamined.
- **Guarded** - no recurring failure sits at a point in the work that no procedure covers.

**Authority.**\
The director holds this vision and ratifies any change to it, under [`M11`](M11-change-a-charter.md).

**What this vision does not authorise.**\
Citing it admits no procedure and licenses no change of direction; a procedure is admitted only by the placement questions and the tests in *What earns an entry*, in this charter's operating sections.

A methodology entry is a procedure: following it yields something that would not exist otherwise, and how it is followed decides whether that result can be trusted.\
It is a *situated move* in the sense [`A0`](../axioms/README.md) draws - you reach for it when the work matches its trigger, unlike an axiom, which is in force whether you reach for it or not.\
A procedure is declined by not being in its situation, never by deciding it does not apply once you are.

The set exists because conduct is where reliable work and adequate work diverge invisibly.\
Two procedures of very different reliability can produce the same artifact, and the artifact will not say which was used.\
Without a named procedure the difference is discovered only after it has cost something.

---

## Territory

**Scope.**\
This set covers **the procedures inside a unit of engineering work** - the points where a result is produced, and how it is produced decides whether it can be trusted.\
The claim is set by that purpose and not by what the set holds: a point no procedure yet covers is still inside it.

**Growth policy.**\
Uncapped.\
A member is one procedure at the grain of the situation its trigger names, producing a result of its own.\
Members are balanced on distinct situations and on composition: a candidate differing from a member only in the situation it names strengthens that member instead, and a new situation is met by composing existing procedures before a primitive is added, as *What earns an entry* states.

---

## Operation

This set is analysed by [`M12`](M12-investigate-a-set.md) and its membership changed by [`M13`](M13-change-a-set.md); this charter is changed by [`M11`](M11-change-a-charter.md).\
Its members are balanced on distinct situations and on composition, so an analysis reads which members are primitives and which compounds from the citation graph, and takes a member with no edges as the prompt *The orphaned primitive* names.\
A candidate is placed by the questions under *What belongs here, and what does not*: one producing nothing of its own goes to [`rules/`](../rules/README.md) if it leaves a trace and to [`practices/`](../practices/README.md) if it does not, a convention about the artifact to [`style/`](../style/README.md), and an invocable capability to [`skills/`](../skills/README.md).\
The population is read against what actually went wrong in the work, not only against its members, because this set's characteristic gap is a failure no procedure covers.\
Placement is stated once in this charter and cited by `rules/` and `practices/`, so a change to it moves their boundaries too.

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
2. **Does following it produce a result of its own** - a verdict, an artifact, a record? A procedure, here. Guidance that only *requires* a record to carry something - a field, a reason - produces nothing itself, and is a rule.
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

**Primitives and compounds.**\
A member is either a primitive, a step no other member supplies, or a compound assembled from primitives for a situation they do not name alone.\
Each member declares what it cites, so which members are primitives and which compounds is read from the citation graph.

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
- **The unguarded moment.** A recurring failure at a point in the work no procedure covers. It is this set's characteristic gap, and it stays invisible until the population is read against what actually went wrong.

---

## Index

<!-- BEGIN GENERATED: entries. Run tools/generate-index.mjs; do not edit by hand. -->
| ID | Title | Hydrate when |
|---|---|---|
| [M0](README.md) | Methods - procedures that produce a result of their own | You are choosing how to run a review, an audit or another procedure, or deciding whether guidance is a procedure, a rule, a practice or style |
| [M1](M1-triangulated-review.md) | Triangulated review - minimum 4 independent inputs | You are reviewing a patch or design that ships to production or upstream |
| [M2](M2-test-drive-docs-by-execution.md) | Test-drive docs by execution - run the steps, or have a cold reader reason with it | You are about to ship a document someone will act on - an operator workflow, or a charter, axiom or other reasoning document an agent will rely on |
| [M7](M7-axiom-alignment-audit.md) | Axiom alignment audit - required gate for extensive planning/design | You are about to implement a design that changes shared procedure, governance, coordination or anything other agents will rely on |
| [M8](M8-artifact-bootstrap.md) | Artifact bootstrap - enter the loop at its inlet, one ratified type at a time | You are adopting the artifact document set in a project that does not use it yet |
| [M9](M9-history-content-scrub.md) | History content scrub | You must remove content from history that is already committed |
| [M10](M10-guided-dialogue.md) | Guided dialogue - lead a human to understanding, then to a recorded decision | You need a human with limited context to understand something or decide something |
| [M11](M11-change-a-charter.md) | Change a charter - account for every changed sentence, test before ratifying | You are about to change a charter's text, its vision, its scope or its growth policy |
| [M12](M12-investigate-a-set.md) | Investigate a set - partition the population against its charter and find the gaps | You need to know whether a set is complete, balanced or lopsided against its charter, or where its gaps are |
| [M13](M13-change-a-set.md) | Change a set's membership - admit, modify, retire or rebalance a member | You are about to add an entry to a set, substantively change one, retire one, or split, merge or replace members |
<!-- END GENERATED -->
