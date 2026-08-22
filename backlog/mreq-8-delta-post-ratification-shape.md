---
id: MREQ-8
category: mission-required
title: The post-ratification half of a delta, and whether its required sections are two shapes
status: active
fulfilment: deferred
hydrate-when: You are recording what a delta produced after it was ratified and find the type specifies only its opening
revival-trigger: >
  a second programme is observed carrying standalone delta documents through to
  closeout, OR a delta is closed and a reader cannot tell from the type whether
  its to-state was reached, OR two deltas in one programme are found to bind to
  each other such that one inherits the other's fence
related-axioms: [A4, A8, A14]
related: [AR0, AR1, AR2, MREQ-3]
---

# MREQ-8 - the post-ratification half of a delta

## What is deferred

Two things, both surfaced by auditing [`AR2`](../artifacts/AR2-delta.md) against real delta documents for the first time.

**The sections a delta grows after it is ratified.**\
`AR2` specifies the plan - from-state and to-state, the fence, the anti-scope fence, build order, binary exit criteria, the coverage map, verification targets, named costs.\
Observed deltas carry all of that and then keep going: the evidence that each criterion was met and who countersigned it, what the work left behind that was not designed, what friction it produced, what was amended after ratification and under whose authority, and a terminal statement of whether the to-state was reached.\
None of that is specified.

**Whether the required-section list describes one shape or two.**\
In the programme examined, deltas that declare their own scope carry the full section set, and deltas bound to another delta carry almost none of it - no fence, no from-state - because they inherit both from the delta they are paired to.\
If that pairing is a real composition rather than a local convention, `AR2`'s list is correct for one shape and wrong for the other.

---

## Why it is parked rather than built

The evidence is one programme.

That programme's delta corpus is deep enough to be persuasive and narrow enough to be misleading, and the two failure modes point in opposite directions.\
Specifying the post-ratification sections from it would fix the type to one team's practice, which is the Speculative Surface fault at document scale and is exactly the objection [`MREQ-3`](mreq-3-component-design-spec-altitude.md) is parked on.\
Leaving `AR2` claiming a delta is only a plan is the opposite error, and that half has been corrected already - the correction states the gap without inventing a shape to fill it.

The section-list question is worse than unanswered, because three readings survive the evidence and nothing available separates them.\
The divergence tracks recency, so it is equally consistent with drift from a template that still holds, with a template that practice has outgrown, and with two genuine sub-types that were never distinguished.\
Choosing between those by argument would manufacture a position; they are separated by observation or not at all.

---

## What was built instead

`AR2`'s false characterisation was withdrawn under a correction banner, and its `Lifecycle stage` now states that a delta opens before execution and closes after it, citing this entry.

That is deliberately the smaller half of the fix.\
It removes a claim the corpus could not support without adding one it cannot support either.

---

## On revival

Re-triage rather than resume, per [`M5`](../methodology/M5-anti-amnesia-deferral.md).

The first trigger is the one that settles the section question, because a second independent corpus is the only thing that can distinguish drift from evolution from a genuine second shape.\
A further instance from the same programme cannot, however many there are - which is the lesson `MREQ-3` records under `AR0`'s `Coverage`, met here a second time.

The second trigger is the sharper one and needs no second programme.\
A delta that closed, and a reader who cannot tell from the type whether it succeeded, is a type that specifies a plan and no outcome - and that is a structural finding rather than a preference.

Two devices are worth carrying into whoever takes this, because both were observed and neither requires a new section to adopt:

- **Exit criteria stop changing at ratification.** `AR2` requires that criteria be binary and never says when they freeze, which leaves the goalposts movable by the party the criteria are meant to bind.
- **The closeout is checked against the from-to statement clause by clause.** The to-state authored at ratification is the checklist the closeout answers, which makes the opening of the document falsifiable by its own ending. `AR2` requires both halves today and connects them not at all.
