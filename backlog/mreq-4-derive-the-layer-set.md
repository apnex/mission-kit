---
id: MREQ-4
category: mission-required
title: Deriving the layer set rather than declaring it in the generator
status: active
fulfilment: deferred
hydrate-when: You are adding or renaming a layer and find the index generator must be edited before it will see it
revival-trigger: >
  a layer is added, renamed or retired and the generator must be edited before it
  will collect the layer's entries, OR the layer-order gate fires because one of
  the two lists was edited and the other was not
related-axioms: [A2, A11]
related: [E2, MREQ-2]
---

# MREQ-4 - deriving the layer set rather than declaring it

## What is deferred

Removing `CATEGORIES` from `tools/generate-index.mjs`, the last hand-maintained input the index generator holds.\
It is an ordered list of `[directory, prefix]` pairs naming every knowledge layer.

Both halves are now redundant.

- **The layer set** is discoverable: a knowledge layer is a top-level directory whose `README.md` declares a `category`. That predicate returns exactly the same thirteen the list names.
- **The order** is already read from the root README's layer table by the drift gate that keeps the two in agreement, so it is parsed whether or not the list exists.
- **The prefix** is derivable from the charter's own `id`, and is used only for sort ranking, where the directory would serve identically.

---

## Why it is parked rather than built

Two reasons, one principled and one about sequencing.

The principled one is a real trade.\
Deriving the order means the generator parses a hand-edited markdown table in the root charter, which turns a malformed row from a cosmetic defect into a build failure.\
`check-structure.sh` already parses that same table, so the exposure is not new, but it would be wider.

The sequencing reason is that the change that made this possible landed in the same programme.\
The layer set is only discoverable because every layer now carries a charter; before that, the same predicate would have found four of thirteen.\
Deleting the list in the same pass would have mixed a change to the generator's input model into a change about the ledger's shape, and the two fail for different reasons.

---

## What was built instead

The gate that would have caught the drift, and did.

`CATEGORIES` and the charter's layer table had already diverged into two different sequences of the same thirteen layers, unnoticed while a flat ledger kept the order invisible.\
They are now held in agreement mechanically, so the duplication is inert rather than rotting.\
That is the cheap half of this item, and it is done.

---

## On revival

Re-triage rather than resume, per [`M5`](../methodology/M5-anti-amnesia-deferral.md).

Both triggers are observable and both mean the same thing: the declaration has started costing more than it saves.\
The first is a contributor discovering that adding a layer requires editing a tool, which is the friction [`A10`](../axioms/A10-autopoietic-evolution.md) asks to be mined rather than absorbed.\
The second is the gate firing, which proves the two lists are genuinely maintained by hand and genuinely drift.
