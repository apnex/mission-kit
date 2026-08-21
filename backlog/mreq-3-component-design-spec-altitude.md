---
id: MREQ-3
category: mission-required
title: The component design and specification altitude
status: active
fulfilment: deferred
hydrate-when: You need to specify one component's configuration and implementation and find no artifact type for it
revival-trigger: >
  a programme states how a component specification binds upward to the duty its
  architecture declares, OR two programmes agree on where the boundary with code
  sits, OR an AR1 instance is blocked because a component's duty cannot be stated
  without implementation detail the architecture must not carry
related-axioms: [A3, A4]
related: [AR0, AR1]
---

# MREQ-3 - the component design and specification altitude

## What is deferred

An artifact type between [`AR1`](../artifacts/AR1-system-architecture.md) and code: the design and specification of **one component or duty** named in an architecture's anchored core, carrying its configuration and implementation specifics.

---

## Why it is parked rather than built

The altitude is real and the shape is not yet known.

`AR1` states a system at one altitude and deliberately excludes implementation detail; code carries the detail and none of the reasoning.\
The gap between them is where a component's configuration, interface specifics and construction choices belong.

What is missing is not evidence that the altitude exists.\
It is a reasoned position on three things: what such a document must contain, how it binds to the component's declared duty in the architecture above it, and where its boundary with code sits.\
Authoring a shape before those are answered would fix the type to whatever instances happened to be in hand, which is the Speculative Surface fault at document scale, and `AR0`'s own admission rule bars it.

---

## Re-triage - the first trigger fired, and the entry stays deferred

The original first trigger read *a second component specification is authored and the two diverge where they should not*.\
It fired, and by a wide margin.

A bottom-up excavation of three programmes measured **25 documents at this altitude**: thirteen in one, ten in a second, two in a third.\
They diverge exactly as predicted - one programme's thirteen share a spine enforced by a test, and another programme's ten share no spine at all.

**Re-triage returned the same verdict for a sharper reason, and the reason is worth more than the count.**

Divergence at scale proves the need and says nothing about the shape.\
It was the same observation read two ways, and only the favourable reading was reported the first time.\
Measured against the three questions above:

- **What it must contain.** Across the 25, no section appears in a majority. The most frequent is carried by thirteen documents, and all thirteen are one programme's, because that programme enforces it with a test. Strip that one enforced convention and the next most common section appears in five of 25.
- **How it binds upward.** One programme binds through a machine-readable sibling artifact rather than through the prose, so one of its thirteen documents cites the architecture at all. A second programme has **no whole-system architecture document**, so its ten specifications bind upward to nothing.
- **Where the code boundary sits.** One programme admits no measured code state into any of its thirteen. A second deliberately carries it, in sections named for the distinction between the system as designed and the system as audited. **Two programmes, opposite answers.**

Two of the three questions are now answered incompatibly rather than merely unanswered.\
That is a better-informed deferral than the original, and it is what re-triage is for.

---

## What was built instead

`AR0` records the gap under `Coverage` and cites this entry, so the absence is visible to anyone reading the layer rather than being discovered when someone needs the type.

---

## On revival

Re-triage rather than resume, per [`M5`](../methodology/M5-anti-amnesia-deferral.md).

The revival trigger is now narrower, because the count of instances has been shown not to settle the question.\
It names the two answers that are missing rather than the evidence that is abundant.

All three conditions are observable.\
The first two would each close one of the questions the re-triage measured open; either alone is enough to re-examine, because a stated binding rule or an agreed code boundary is the kind of evidence a further instance cannot supply.\
The third is the sharper signal and is unchanged - an architecture that cannot state a duty without carrying detail that does not belong to it is an architecture missing a layer below it, and that is a structural finding rather than a preference.
