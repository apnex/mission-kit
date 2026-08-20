---
id: MREQ-3
category: mission-required
title: The component design and specification altitude
status: active
fulfilment: deferred
hydrate-when: You need to specify one component's configuration and implementation and find no artifact type for it
revival-trigger: >
  a second component specification is authored and the two diverge where they
  should not, OR an AR1 instance is blocked because a component's duty cannot be
  stated without implementation detail the architecture must not carry
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
The gap between them is where a component's configuration, interface specifics and construction choices belong, and both audited programmes produced documents that sat in it - two component-scope design records in one, a kernel specification in the other.

What is missing is not evidence that the altitude exists.\
It is a reasoned position on what such a document must contain, how it binds to the component's declared duty in the architecture above it, and where its boundary with code sits.\
Authoring a shape from two instances now would fix the type to the shape of those two, which is the Speculative Surface fault at document scale, and `AR0`'s own admission rule bars it.

---

## What was built instead

`AR0` records the gap under `Coverage` and cites this entry, so the absence is visible to anyone reading the layer rather than being discovered when someone needs the type.

---

## On revival

Re-triage rather than resume, per [`M5`](../methodology/M5-anti-amnesia-deferral.md).

Both triggers are observable.\
The first is the reinvention cost `AR0` requires as evidence: two instances differing where they should not.\
The second is the sharper signal - an architecture that cannot state a duty without carrying detail that does not belong to it is an architecture missing a layer below it, and that is a structural finding rather than a preference.
