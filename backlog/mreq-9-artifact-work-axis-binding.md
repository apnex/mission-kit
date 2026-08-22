---
id: MREQ-9
category: mission-required
title: The binding between the work axes and the artifact layer
status: active
fulfilment: deferred
hydrate-when: You are composing a unit of work and cannot tell from the corpus which document type it is supposed to produce
revival-trigger: >
  a work-type is authored or revised and its author cannot state which artifact
  type the work produces, OR an artifact type is admitted that no work-type can
  be composed to produce, OR the artifacts layer is found to have grown a second
  entry that duplicates a work-type's evidence contract
related-axioms: [A3, A8]
related: [AR0, W0, MREQ-2]
---

# MREQ-9 - the binding between the work axes and the artifact layer

## What is deferred

Deciding whether the artifact layer composes with the work axes, and if it does, which layer owns the relation.

Measured: **no work-type cites an artifact type.**\
The reverse is one thin reference - the artifact charter cites `W0` twice, and only to borrow its section shape, not to compose with it.

So a reader holding a work-type learns what evidence closes the work and nothing about what document the work produces, and a reader holding an artifact type learns the document's shape and nothing about which unit of work emits it.\
The two layers describe the same activity from two sides and do not meet.

This is the charter's own **broken axis** fault, worded there as a layer that stops composing so work is hand-authored instead of generated.

---

## Why it is parked rather than built

Three readings survive the evidence, and they imply different mechanisms.

**The artifact could be an output of a work-type**, declared as a field beside `evidenceContract`.\
The difficulty is that `evidenceContract` already states what closes a node, and for several work-types the closing evidence *is* the document - so the field would either duplicate the contract or contradict it, and neither is discovered until both exist.

**The artifact could be a fourth axis.**\
`W0`'s composition rule is role x work-type x domain, and a document type is a plausible fourth term for the work that produces documents.\
But most of the twenty-six work-types produce no artifact-typed document at all, so a fourth axis would be mostly empty, and an axis that is usually null is a field wearing an axis's name.

**The two layers could be correctly independent.**\
A work-type governs how work is claimed, evidenced and closed; an artifact governs how a document is shaped.\
That a closeout packet has no artifact type may be a fact about the artifact layer's coverage rather than a missing edge.\
On this reading the absence of citations is correct and nothing is owed.

Nothing currently available separates the three.\
Choosing by argument would manufacture a position and dress it as a finding, and the cost of choosing wrong is a schema field that every later work-type must fill and no reader uses.

---

## What was built instead

Nothing, and the omission is worth stating rather than leaving to be rediscovered.

Every other layer pair in this corpus that composes says so somewhere.\
Roles, domains and work-types compose through a rule stated once in `W0`.\
Skills compose by declared edge.\
Axioms are cited by the entries they bind.\
The artifact layer is the only ID-bearing layer with no stated relation to any other except by prose reference, and it was admitted without anyone asking for one.

---

## On revival

Re-triage rather than resume, per [`M5`](../methodology/M5-anti-amnesia-deferral.md).

The first trigger is the cheapest and most likely: an author writing a work-type, reaching for the document it produces, and finding the corpus silent.\
That moment distinguishes the three readings better than any amount of reasoning about them, because it produces a real case where the edge is either needed or not.

The third trigger is the one that would settle it against the first reading.\
If an artifact entry is ever found restating what a work-type's evidence contract already says, the two layers are already coupled informally and the only question left is where the statement belongs.

Whoever takes it should test the third reading first, since it is the only one that costs nothing to adopt and the other two are irreversible once a schema field exists.
