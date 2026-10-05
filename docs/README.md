# docs

This corpus's own [artifact](../artifacts/README.md) instances.

Every other layer here holds **types** - shapes any project instantiates.\
This directory holds **instances**, and they are instances about mission-kit itself.

It exists because a corpus that prescribes a document set and does not hold one is the fault its own charter names: the drifted specification, where the corpus and the running system disagree and the corpus is the one nobody checks.\
Publishing a placement rule while sitting outside it is the same defect at one remove.

---

## Type, not instance - and the converse

[`AR3`](../artifacts/AR3-board.md) is product: the definition of what any project's board must be.\
[`BOARD.md`](BOARD.md) is an instance: mission-kit's own board, planning changes to the product.\
The same holds for every file here against the type it instantiates.

`AR0` states one direction - completed instances do not belong in the type layers.\
**This directory holds the other: content intended for the benefit of every project does not belong in an instance.**

The test is the intended reader, not the kind of content.\
An instance may hold rules, procedures and definitions that govern only itself - this board's contract with its record and its triage scale are both rules, and both belong here, because no other project is meant to follow them.\
An instance may cite anything in the corpus, which is one of its main uses.\
What it may not hold is content meant to reach every project: that belongs in the corpus, where it is reachable from the ledger, citable by ID, governed by a charter, and outlives the milestone that produced it.\
Written into an instance, it is none of those things, and the projects it was meant for never find it.

This was learned by breaking it: the charter-editing rule and the evaluation protocol were both first written inside this directory's board, though both were meant for every project that keeps a charter or evaluates a reasoning document.\
Both moved into the corpus once their home was clear.

---

## Why these are not entries

Nothing here carries an ID, appears in [`INDEX.md`](../INDEX.md), or is citable from another project.\
Instances are project-local by construction - [`AR0`](../artifacts/README.md) is explicit that instances live in the project that produced them and no completed document belongs in the type layer.

mission-kit is that project for these files.\
A reader looking for the *shape* of a backlog wants [`AR5`](../artifacts/AR5-backlog.md); a reader looking for *what this corpus has found about itself and not yet done* wants the backlog here.

---

## Layout

The tree is not this directory's to choose.\
[`AR0`](../artifacts/README.md) fixes it: the vision anchors at the component root and every other instance lives under `docs/`, arranged as the component sees fit.

```text
mission-kit/
  VISION.md          an AR6 instance - the enduring purpose, ratified
  docs/
    ARCHITECTURE.md  an AR1 instance - instant: current
    BOARD.md         an AR3 instance - the plan
    BACKLOG.md       an AR5 instance - the record
```

Flat, until there is reason to subdivide.

---

## Contents

| file | type | holds |
|---|---|---|
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | [`AR1`](../artifacts/AR1-system-architecture.md) | this corpus stated at one altitude, instant `current` |
| [`BOARD.md`](BOARD.md) | [`AR3`](../artifacts/AR3-board.md) | the triaged legal next moves, for director selection |
| [`BACKLOG.md`](BACKLOG.md) | [`AR5`](../artifacts/AR5-backlog.md) | findings about this corpus, each with evidence and a revival trigger |
| [`DECISIONS.md`](DECISIONS.md) | [`AR4`](../artifacts/AR4-decision-record.md) | the director's rulings, each classified general or project, with the entries a general ruling must be stated in |
| [`DELTAS/`](DELTAS/) | [`AR2`](../artifacts/AR2-delta.md) | each declared, gated transition, `DELTA-<N>.md` |
| [`audits/`](audits/) | - | evidence produced by auditing this corpus against its own standards, cited from the board |
| [`investigations/`](investigations/) | - | dated analyses of a set's population against its charter's end state, scope and growth policy: a proposed partition, where members sit, and the gaps found, each gap carried to the backlog |

The vision is not in this directory by design - [`AR0`](../artifacts/README.md) anchors it at the component root, which for this corpus is [`../VISION.md`](../VISION.md).



---

## Not the `backlog/` layer

[`backlog/`](../backlog/README.md) holds `MREQ` entries - addressable, routable catalogue entries requesting a future mission, citable from anywhere in the corpus.\
[`BACKLOG.md`](BACKLOG.md) holds project-local findings about mission-kit that are addressable nowhere else.

Two different objects wearing one word.\
Whether they should remain separate is tracked as row `B14`.
