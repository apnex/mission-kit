---
id: AR0
category: artifact
title: Artifacts - the engineering lifecycle loop, and what earns a document type
status: active
hydrate-when: You are deciding which engineering document a piece of work needs, or whether a shape deserves to be a type
supersedes: []
related: [AR1, AR2, AR3, AR4, AR5, AR6, A13, A14, W0]
---

# Artifacts - the lifecycle loop and the admission rule

## Vision

**North star.**\
Every document an engineering lifecycle produces whose shape recurs across projects has exactly one type, and the types compose into one closed control loop with a single inlet.

**What this set is, and is not.**\
It is the types that hold every position in that loop, at every altitude and transition around a system, each instantiated by a project rather than invented, so any two instances can be compared and no reviewer has to guess what is missing.\
It is not a home for instances, generated views, sections of another document or tool output, and it is not the machine-checkable contract for a shape, which [schemas](../schemas/README.md) hold.

**Succeeding.**\
Measured on four dimensions, never one score:

- **Reach of the loop** - how much of the loop a programme can run from types alone.
- **Non-overlap** - one position, one type, and no type forking a contract held elsewhere.
- **No reinvention** - no deliverable shape authored from nothing each time, or buried inside one capability.
- **Admission integrity** - every type carries its position and an acceptance falsifier, and no instance sits among the types.

**Authority.**\
The director holds this vision and ratifies any change to it, under [`M11`](../methods/M11-change-a-charter.md).

**What this vision does not authorise.**\
Citing it admits no type and licenses no change of direction; admission is by the tests under *What earns a document type*.

The document types an engineering lifecycle produces, each with a schema, so a document is instantiated rather than reinvented.

This entry is the layer's composition rule, in the shape [`W0`](../work-types/README.md) uses for work-types: it states how the types compose and what earns admission, and it does not restate any individual type.\
It is not itself an artifact type, which is why the artifact body shape declared in [`SC6`](../schemas/SC6-entry-body.md) exempts it.

The set exists so that a programme's documents compose into one loop that can be checked, instead of each team inventing shapes that cannot be compared.

---

## Territory

**Scope.**\
This set covers **every document an engineering lifecycle produces whose shape recurs across projects** - each position in the lifecycle loop, below, at the altitude of a system, and the altitudes and transitions around it.\
The claim is set by what the set is for; a position, altitude or transition with no type is a gap, not a reason to narrow the claim.

**Growth policy.**\
Uncapped.\
A member is a type, never an instance, and it holds one position in the loop at a stated altitude; a concern that belongs inside another document is a section of it, not a type.\
Members are balanced on non-overlap: one position, one type, and a type enters only with its position and after passing every admission test below, never speculatively ahead of a demonstrated need.

---

## Operation

This set is analysed by [`M12`](../methods/M12-investigate-a-set.md) and its membership changed by [`M13`](../methods/M13-change-a-set.md); this charter is changed by [`M11`](../methods/M11-change-a-charter.md).\
Its members are balanced on non-overlap: one position in the loop, one type, at a stated altitude.\
Analysis reads the population against the loop, and also searches projects for a concern that recurs without a home, because only that bottom-up pass can show the loop itself is missing a position (*The strongest evidence is an absence*).\
A misplaced candidate is routed by the neighbour table: a machine-checkable contract to schemas, a writing convention to style, a capability to skills, and a kind of work to work-types; an instance stays in the project that produced it.

---

## The loop

The types are not a list.\
They are one control loop, and each is load-bearing only because of its position in it.

```text
        vision                                 the inlet; nothing upstream of it
          |
          |  shapes the target, and outlives it
          v
   +--> architecture @ target  <--- amend ---  decisions
   |      |                                    ^
   |      |  the gap                           |  execution emits
   |      v                                    |
   |    board  <------------ open rows ------  backlog
   |      |                                    ^
   |      |  director selects                  |  execution defers
   |      v                                    |
   |    delta  --------------------------------+
   |      |
   |      |  exit criteria, gate-checked
   |      v
   +--- architecture @ now                     derived, never hand-authored
```

The architecture appears twice and is one type: the left rail is the diff between its two projections, and that diff is the only reason any of the rest exists.

Read it as a cycle with one inlet.\
The vision states what the programme is for and shapes the target.\
The gap between the architecture's two projections is what the board triages into legal moves; the director selects one, and a delta declares and gates that transition.\
Execution emits rulings that amend the target and deferrals that return to the board.

**The edge that closes the loop is the one at the bottom.**\
When a delta's exit criteria go green, the current projection is derived from them - and nothing else updates where the system is.\
That is why the architecture's `current` may not be hand-authored: writing it by hand does not add a second source of truth, it *cuts the feedback path*, and a controller with no measurement is an open loop reporting on itself.

**The inlet was missing until it was looked for from the bottom.**\
A pass that runs top-down from the loop can only find types the loop already predicts, and the loop as first drawn was closed.\
Only a bottom-up pass can falsify the loop's own completeness, which is why a missing position is a finding rather than a gap to fill.\
The architecture type's justification chain had named `north star` as a layer the whole time, with nothing owning it.

The frame is the controller pattern applied to an engineering programme: observe current, diff against target, derive the work, reconcile.\
It is deliberately isomorphic to what it governs - the organisation itself - which is [`A2`](../axioms/A2-isomorphic-specification.md) turned inward.

**No project observed runs the whole loop.**\
Two audited programmes each held one half and left the other homeless, which is the evidence that the loop had never been codified rather than that either team was careless.\
Codifying it is this layer's purpose.

---

## Why the loop, and not a document list

Each position answers a question no other position can.

| Position | Answers | Without it |
| --- | --- | --- |
| **Vision** | what is this for, and what will it not become | the target is derived from nothing, and the board has no axis to rank against |
| **Architecture** | where we are, where we are going | drift is undetectable, because there is no target to diff against |
| **Board** | what may we do next, and what is it worth | the next move is chosen implicitly under local pressure |
| **Delta** | what exactly changes, and how do we know it landed | progress is reported rather than measured |
| **Decisions** | what was ruled, by whom, and what it affects | rulings are re-litigated, and their reasons are gone |
| **Backlog** | what did we consciously not do, and when does it return | deferral is indistinguishable from forgetting |

The board's position is the one most often missing and the least obviously load-bearing.\
[`A14`](../axioms/A14-compounding-learning.md) requires the organisation to engineer the path of greatest learning rather than the shortest path, and names **Shortest-Path Myopia** as its fault.\
An architecture states a destination but chooses nothing; the board is the only artifact where the investment decision is actually taken.\
A programme without one does not risk that fault, it exhibits it by default.

The board is also the surface [`A13`](../axioms/A13-director-intent-amplification.md) governs.\
Director attention is the scarcest input, and a board spends it only on moves that are genuinely gated, each stating what it blocks.

---

## What earns a document type

Five tests, all of which must pass.

1. **Recurrence.** The shape would be produced again, by a different team, on an unrelated project.
2. **Reinvention cost.** Its absence demonstrably causes someone to invent a shape. Two instances differing where they should not is the evidence.
3. **An acceptance falsifier.** A named observation that makes an instance unacceptable. A type whose acceptance can only be described as prose about quality is vacuous and must not be admitted.
4. **A consumer who acts.** It serves a decision or a handover. A document nobody acts on is a record, not a type.
5. **Not already governed.** Contracts in [`schemas/`](../schemas/README.md) already own some shapes, and promoting one here would fork it.

**Recurrence is a judgement made at admission, and it is not recorded as a field afterwards.**\
An entry once carried a two-tier `recurrence` value - *demonstrated* for a shape observed in two or more independent projects, *argued* for one instance plus a reasoned case.\
The field is gone, and the reason it went is worth keeping, because the obvious instinct is to add it back.

**A corpus cannot count adoption of itself as evidence for itself.**\
This corpus sits upstream of the projects that read it.\
A project that adopts a type and produces an instance has demonstrated compliance, not recurrence - it wrote that document *because this said to* - and counting it promotes the entry on evidence the entry caused.\
The failure is not hypothetical: a type was admitted here on one instance and a second instance appeared in a downstream project inside the hour, phrased in the new entry's own words.

The trap has no clean escape.\
Excluding downstream instances leaves nothing to count, since every project in reach is downstream.\
Admitting them makes the tier a measure of the corpus's own influence wearing the language of independent evidence, which is worse than silence because it reads as proof.

So the tier is not tracked at all.\
Test 1 above still asks whether a different team would produce the shape - as a judgement the author makes and argues at admission, where a reader can weigh the argument.\
What is not kept is a durable field asserting the answer, because the field outlives the reasoning that set it and nothing re-checks it.

### Disqualifiers

- **The instance.** A completed project document rather than a shape. It dates immediately and fails the cross-project test.
- **The generated view.** A document whose shape is owned by its generator. There is no type to define; the generator is the definition.
- **The section.** A concern that belongs inside another artifact. Promoting it produces two documents that must be read together.
- **The tool output.** A log or report emitted by a run. Its shape is the tool's contract.

### The strongest evidence is an absence

A concern that recurs across a corpus **without a home** is a better signal than one that recurs with a home.\
Scattered sections, cross-references reaching into another document because there is nowhere to point, and per-host restatement are all the same finding: the need survived without an artifact to carry it.

Both types this layer opened with were found that way, and an inventory of what exists cannot find them.\
Admission therefore runs top-down from the loop, not bottom-up from a file listing.

---

## Type, not instance

This layer holds types.\
Instances live in the project that produced them, and no completed document belongs here.

That is the corpus admission test doing its work: a delta's required shape is cross-project, while any particular delta is the most point-in-time artifact a project owns.

---

## Where instances live

The layer prescribes no section list for several of its types, and it does prescribe **placement**, because the two answer different questions.\
A shape imposed on an unlike system produces empty headings; an address left unstated produces a document nobody can find without being told where to look.

**The document tree lives at the root of the scope of the component it describes.**

**Every instance has one fixed name and location, in upper case.**\
A reader arriving at any component finds each document at the same path without searching, and two projects cannot name one type two ways.

```text
<component root>/
  VISION.md                      AR6 vision - the enduring purpose of THIS component
  docs/
    ARCHITECTURE.md              AR1 system architecture, instant current
    ARCHITECTURE-TARGET.md       AR1 system architecture, instant target
    BOARD.md                     AR3 board
    BACKLOG.md                   AR5 backlog
    DECISIONS.md                 AR4 decision register
    DECISIONS/<NNNN>.md          AR4, where a programme keeps one file per ruling instead of a register
    DELTAS/DELTA-<N>.md          AR2 delta; N counts up from 1 and is never reused
```

A component holds the documents it needs and omits the rest; a document it does hold is at this path, under this name.\
The title inside the document carries the component's name and the delta's subject; the filename carries neither.

Three consequences of placement, and the first is the point of the rule.

**Placement is scope-relative, never repository-relative.**\
A sovereign repository and a nested subsystem take the same rule, because both are systems and the document tree is addressed by the directory at the system's root.\
The directory addresses the documents; it is not the system's boundary, which its declared interfaces set ([`E5`](../entities/E5-system.md), [`E6`](../entities/E6-component.md)).\
A component at `<root>/parts/thing/` carries `<root>/parts/thing/VISION.md`, and that vision governs that directory and nothing above or below it.\
Two visions in one repository are not a conflict; they are two systems, and the path states which documents belong to which.

**The vision anchors at the root and the rest live under `docs/`.**\
The vision is the one document an arriving reader needs before they know anything about the project, including where its documentation is kept, so it is the one that cannot be behind a directory they would have to guess.\
Everything else is reachable once that is found.

**Arrangement of anything else inside `docs/` is the component's own.**\
Flat or subdivided by concern are both conformant for documents this layer defines no type for.\
What the rule fixes is the anchor, the tree root and the instance names above; below that, a component organises as it is organised, which is the same principle that keeps templates out of several of these entries.

**Why prescribe here at all.**\
Discoverability is not a convention that can be left to each adopter, because its whole value is being true before you have read anything.\
Given a box in an anchored core, a reader reaches that component's vision by construction rather than by search - which is what makes the recursion in [`C0`](../components/README.md) navigable rather than merely true.

---

## Neighbours

| Neighbour | The question that separates them |
|---|---|
| [Schemas](../schemas/README.md) | Is it the machine-checkable contract for a shape, or the shape a lifecycle document takes? A type here must not fork a contract there. |
| [Style](../style/README.md) | Does it govern how a document is written, or which document a lifecycle produces and what it must carry to do its job in the loop? |
| [Skills](../skills/README.md) | Is it a capability, or a deliverable? A skill may use a template, but a deliverable shape held only inside one skill is a type waiting to be admitted here. |
| [Work-types](../work-types/README.md) | Is it a kind of work, or the document a kind of work produces? A work-type may name the artifact it produces. |

---

## Faults

- **The template in the toolbox.** A deliverable shape buried inside one capability, so the next consumer forks a copy instead of finding it.
- **The style rule wearing an architecture.** Document structure enforced as a writing convention, invisible to anyone choosing what to produce.
- **The reinvented deliverable.** The same document authored from nothing each time, so no two instances can be compared and no reviewer knows what is missing.
- **The instance in the type layer.** A completed project document admitted as though it were a shape.
- **The broken loop.** A type admitted without its position, so it composes with nothing and the loop it belonged to stays unclosed.

---

## Index

<!-- BEGIN GENERATED: entries. Run tools/generate-index.mjs; do not edit by hand. -->
| ID | Title | Hydrate when |
|---|---|---|
| [AR0](README.md) | Artifacts - the engineering lifecycle loop, and what earns a document type | You are deciding which engineering document a piece of work needs, or whether a shape deserves to be a type |
| [AR1](AR1-system-architecture.md) | System architecture - one system, one altitude, one instant | You need to state where a system is or where it is going, and have the two be comparable |
| [AR2](AR2-delta.md) | Delta - a declared, gated transition between two architecture states | You are about to change a system and need the change declared and its landing provable |
| [AR3](AR3-board.md) | Board - the triaged graph of legal next moves, for director selection | You are deciding what to do next and want the choice reasoned rather than taken under local pressure |
| [AR4](AR4-decision-record.md) | Decision record - one ruling, append-only, with what it affects | You are ruling on something that later work will be built on and must not be re-litigated |
| [AR5](AR5-backlog.md) | Backlog - the durable record of what was not done, each row with a trigger | You are deferring, cutting or parking work and it must not become forgetting |
| [AR6](AR6-vision.md) | Vision - the enduring purpose a programme is measured against | You need to say why a programme exists and what it must never become, and no document holds it |
<!-- END GENERATED -->
