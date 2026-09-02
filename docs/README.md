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
  VISION.md          the enduring purpose, when it is ratified
  docs/
    BACKLOG.md       an AR5 instance - findings about this corpus
```

Flat, until there is reason to subdivide.

---

## Contents

| file | type | holds |
|---|---|---|
| [`BACKLOG.md`](BACKLOG.md) | [`AR5`](../artifacts/AR5-backlog.md) | findings about this corpus, each with evidence and a revival trigger |

Absent, and known to be: the vision, an architecture, a board.\
Their absence is row `B1` in the backlog rather than an omission here.

---

## Not the `backlog/` layer

[`backlog/`](../backlog/README.md) holds `MREQ` entries - addressable, routable catalogue entries requesting a future mission, citable from anywhere in the corpus.\
[`BACKLOG.md`](BACKLOG.md) holds project-local findings about mission-kit that are addressable nowhere else.

Two different objects wearing one word.\
Whether they should remain separate is tracked as row `B14`.
