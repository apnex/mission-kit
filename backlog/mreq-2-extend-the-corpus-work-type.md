---
id: MREQ-2
category: mission-required
title: Work-type for extending the corpus itself
status: active
fulfilment: deferred
hydrate-when: You are adding or retiring a layer and want the work claimable rather than hand-run
revival-trigger: >
  a third layer is added or retired, OR corpus-extension work needs to be
  claimed on the coordination substrate rather than performed by hand
related-axioms: [A3, A10]
related: [W0, MREQ-1]
---

# MREQ-2 - work-type for extending the corpus itself

## What is deferred

A `W` entry for corpus extension, so that adding or retiring a layer compiles to a claimable node with an evidence contract rather than being performed by hand.

---

## Why it is parked rather than built

Two reasons, and the second is the stronger.

The taxonomy has one worked instance.\
A work-type carries `roleEligibility`, an `evidenceContract`, a `falsifier` and `compositionHooks`, and each of those is a generalisation.\
Authoring them from a single case would fix the shape of the work to the shape of the one time it was done, which is [`A3`](../axioms/A3-sovereign-composition.md) Speculative Surface at the taxonomy layer.

The work-types axis compiles against a coordination substrate whose coupling to this corpus is undecided.\
Building a work-type now would commit that question by implication rather than by ruling.

---

## What was built instead

The charter section `Adding and retiring a layer` states the rule, and `check-structure.sh` holds the prefix column to the ledger.\
That covers the correctness of a layer once it exists.\
It does not make the work claimable, which is the whole of what remains.

---

## On revival

Re-triage rather than resume, per [`M5`](../methodology/M5-anti-amnesia-deferral.md).\
By the time a third layer moves there will be three instances to generalise from, and the substrate question will have been ruled on either way.\
Both are inputs this entry does not have.
