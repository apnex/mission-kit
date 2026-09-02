# docs

This corpus's own [artifact](../artifacts/README.md) instances.

Every other layer here holds **types** - shapes any project instantiates.\
This directory holds **instances**, and they are instances about mission-kit itself.

It exists because a corpus that prescribes a document set and does not hold one is the fault its own charter names: the drifted specification, where the corpus and the running system disagree and the corpus is the one nobody checks.\
Publishing a placement rule while sitting outside it is the same defect at one remove.

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

The vision is not in this directory by design - [`AR0`](../artifacts/README.md) anchors it at the component root, which for this corpus is [`../VISION.md`](../VISION.md).

Absent, and known to be: a decision register, which is row `B15`.\
This corpus prescribes [`AR4`](../artifacts/AR4-decision-record.md) to its adopters and keeps its own rulings in commit messages, which is the same defect `B1` recorded one altitude up.

---

## Not the `backlog/` layer

[`backlog/`](../backlog/README.md) holds `MREQ` entries - addressable, routable catalogue entries requesting a future mission, citable from anywhere in the corpus.\
[`BACKLOG.md`](BACKLOG.md) holds project-local findings about mission-kit that are addressable nowhere else.

Two different objects wearing one word.\
Whether they should remain separate is tracked as row `B14`.
