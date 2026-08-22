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

The document types an engineering lifecycle produces, each with a schema, so a document is instantiated rather than reinvented.

This entry is the layer's composition rule, in the shape [`W0`](../work-types/README.md) uses for work-types: it states how the types compose and what earns admission, and it does not restate any individual type.\
It is not itself an artifact type, which is why the artifact body shape declared in [`SC6`](../schemas/SC6-entry-body.md) exempts it.

---

## The loop

The types are not a list.\
They are one control loop, and each is load-bearing only because of its position in it.

```text
   vision  --------------------------------------->  shapes the target
                                                     the inlet; nothing upstream of it
       |
       v
   SA @ now  ------------------>  SA @ target        one architecture, two projections
       |                              |              converging; the target keeps moving
       +---------- delta ------------ +              the routing points between them
                     ^
                     | director selects
                  board                              the triaged legal moves
                     ^
     decisions ------+------ backlog                 rulings in, deferrals out
```

Read as a cycle with one inlet: the vision states what the programme is for, the architecture states where the system is and where it is going, the board proposes and triages the legal moves between those two points, the director selects, a delta declares and gates the chosen transition, execution produces rulings that amend the architecture and the intent, and deferrals that return to the board.

**The inlet was missing until it was looked for from the bottom.**\
A pass that runs top-down from the loop can only find types the loop already predicts, and the loop as first drawn was closed.\
Only a bottom-up pass can falsify the loop's own completeness, which is why `Coverage` below treats a missing position as a finding rather than a gap to fill.\
`AR1`'s justification chain had named `north star` as a layer the whole time, with nothing owning it.

The frame is the controller pattern applied to an engineering programme: observe current, diff against target, derive the work, reconcile.\
It is deliberately isomorphic to the substrate it governs, which is [`A2`](../axioms/A2-isomorphic-specification.md) turned on the organisation itself.

**No project observed runs the whole loop.**\
Two audited programmes each held one half and left the other homeless, which is the evidence that the loop had never been codified rather than that either team was careless.\
Codifying it is this layer's purpose.

---

## Why the loop, and not a document list

Each position answers a question no other position can.

| Position | Answers | Without it |
| --- | --- | --- |
| [`AR6`](AR6-vision.md) | what is this for, and what will it not become | the target is derived from nothing, and the board has no axis to rank against |
| [`AR1`](AR1-system-architecture.md) | where we are, where we are going | drift is undetectable, because there is no target to diff against |
| [`AR3`](AR3-board.md) | what may we do next, and what is it worth | the next move is chosen implicitly under local pressure |
| [`AR2`](AR2-delta.md) | what exactly changes, and how do we know it landed | progress is reported rather than measured |
| [`AR4`](AR4-decision-record.md) | what was ruled, by whom, and what it affects | rulings are re-litigated, and their reasons are gone |
| [`AR5`](AR5-backlog.md) | what did we consciously not do, and when does it return | deferral is indistinguishable from forgetting |

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

**Recurrence has two tiers, and the entry records which it holds.**\
*Demonstrated* means observed in two or more independent projects.\
*Argued* means one instance plus a reasoned case.\
The distinction is kept because a single project can only show that a shape was produced, never that another team would produce it, and hiding that behind a single verdict would overstate the evidence.

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

## Coverage

The layer is complete when every position in the loop has a type and no author must invent a shape.\
Gaps are recorded as gaps rather than filled speculatively, which would be Speculative Surface at document scale.

**Known gap: the component altitude.**\
`AR1` is one system at one instant.\
The configuration and implementation detail of a single component or duty inside it sits below that altitude and above code, and has no type.\
It is deferred rather than guessed, under [`MREQ-3`](../backlog/mreq-3-component-design-spec-altitude.md).

That deferral has since been re-triaged and **held**, which is the more instructive outcome.\
**Instance count is not shape evidence.**\
A concern can recur widely, and diverge widely, while no section appears in a majority of its instances - and divergence at scale proves the need without settling the shape, because it is the same observation read two ways.\
The two questions that would settle this type - how a component specification binds upward to the duty its architecture declares, and where its boundary with code sits - are currently answered *incompatibly* rather than merely left open, and that is a stronger reason to wait than silence would be.\
Abundant evidence of a need is routinely mistaken for evidence of a shape.

---

## Faults

- **The template in the toolbox.** A deliverable shape buried inside one capability, so the next consumer forks a copy instead of finding it.
- **The style rule wearing an architecture.** Document structure enforced as a writing convention, invisible to anyone choosing what to produce.
- **The reinvented deliverable.** The same document authored from nothing each time, so no two instances can be compared and no reviewer knows what is missing.
- **The instance in the type layer.** A completed project document admitted as though it were a shape.
- **The unacceptable acceptance.** A type whose acceptance criterion is prose about quality rather than an observation, so nothing can fail it.
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
