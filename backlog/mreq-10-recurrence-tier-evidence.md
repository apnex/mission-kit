---
id: MREQ-10
category: mission-required
title: The evidence a recurrence tier rests on, in a corpus that bars naming it
status: active
fulfilment: deferred
hydrate-when: You need to know whether an artifact type's recurrence tier rests on wide evidence or on one instance, and the entry does not say
revival-trigger: >
  a recurrence tier is found to be wrong in either direction and nothing recorded
  what it rested on, OR a second field in this corpus is proposed that states a
  verdict about the world without stating what was examined, OR MREQ-7 is taken
  up, since the maintenance question is the same one
related-axioms: [A4, A8, A14]
related: [AR0, SC1, MREQ-7]
---

# MREQ-10 - the evidence a recurrence tier rests on

## What is deferred

Giving `recurrence` a way to say what it was measured against.

Today the field is a bare enum, `demonstrated` or `argued`, defined as observed in two or more independent projects versus one instance plus a reasoned case.\
It is a claim about a population, recorded as a single word, with no record of what was examined to produce it or when.

Two consequences, and the second is the one that bites.

**The tiers are unfalsifiable.**\
A reader cannot tell whether `demonstrated` rests on six programmes or on two plus enthusiasm, nor whether it was ever re-checked after the entry was written.

**The same word carries two different meanings.**\
An `argued` tier can mean the shape is genuinely rare, or it can mean whoever set it examined a small sample.\
Those are opposite situations - one is a fact about the world and one is a fact about the search - and the field renders them identically.

---

## Why it is parked rather than built

Because the obvious fix is barred by another rule this corpus holds, and the conflict is real rather than an oversight.

A tier that named its evidence would name projects.\
Naming projects in an entry is citing downstream consumers, which the charter bars twice - under no point-in-time content, and under examples are generic, write the shape not the incident - and names as a fault, project-specific content wearing a cross-project ID.\
So the sample cannot be listed.

A count without names is no better.\
`demonstrated: 4` is unfalsifiable in exactly the way the bare enum is, and adds a number that looks like evidence.

**This is the corpus's portability rule and its checkability rule meeting head-on**, and the recurrence tier is where they touch.\
Portability says an entry must carry nothing local.\
Checkability says what can be verified by a script is verified by a script.\
A claim whose evidence may not be written down cannot be checked, and this is the only field in the corpus that makes the tension visible.

Resolving it needs a position on that tension, not a schema edit.\
Adding a field first would bank the appearance of evidence and none of it, which is the same failure [`MREQ-7`](mreq-7-provenance-and-trust-vocabulary.md) is parked on one level up.

---

## What was built instead

Nothing, and the gap has already cost something, which is why it is banked rather than noted.

Both directions of error have now occurred in this layer, in a single working session.\
A tier was downgraded on a sample too narrow to support the conclusion and had to be restored.\
Separately, claims of the form *no observed programme does X* were written from the same narrow sample and were false.\
In both cases the sample was never stated, so nothing in the entry could have caught it, and nothing in the corpus recorded that the tier had been re-examined at all.

The entries carry correction banners for the specific claims.\
The mechanism that let both happen is untouched.

---

## On revival

Re-triage rather than resume, per [`M5`](../methodology/M5-anti-amnesia-deferral.md).

The third trigger is the one to watch, because this is probably not an independent problem.\
`MREQ-7` defers a provenance vocabulary for the whole corpus - who asserted an entry, when it was last verified, against what - and a recurrence tier is one claim that vocabulary would cover.\
Taking either alone risks solving half a problem twice.

They are filed separately because they can be told apart and might be answered apart.\
`MREQ-7` is about **staleness and authorship** of an entry as a whole.\
This is about **the sample behind one claim**, and it carries a constraint `MREQ-7` does not: the evidence may not be named, so the answer cannot simply be a list.\
Whoever takes either should read both first and may reasonably fold this one in.

The cheapest honest outcome may be no field at all.\
A tier that stated its own limits in prose - what kind of evidence it rests on, without naming the sources - would be weaker than a schema and stronger than a bare word, and it is the option to rule out before building a mechanism.
