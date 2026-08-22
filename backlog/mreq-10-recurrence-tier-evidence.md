---
id: MREQ-10
category: mission-required
title: The evidence a recurrence tier rests on, in a corpus that bars naming it
status: active
fulfilment: wont-do
hydrate-when: You are about to add a field that counts how widely something outside this corpus has adopted something inside it
revival-trigger: >
  a field is proposed that states a verdict about the world without stating what
  was examined, OR someone outside this estate adopts the corpus and independent
  evidence becomes obtainable for the first time
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

## Why it could not be built as specified

Because the obvious fix was barred by another rule this corpus holds, and the conflict was real rather than an oversight.

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

## Resolved by removal - `wont-do`

**The field was deleted rather than repaired, and this entry is kept as the record of why.**

The problem turned out to be worse than a missing sample.\
This corpus sits *upstream* of every project that could supply evidence for it, so a downstream instance demonstrates that the corpus was followed rather than that a shape recurs.\
That failure occurred in practice: a type was admitted on one instance and a second appeared in a consuming project inside the hour, phrased in the new entry's own words, and was nearly counted.

There is no clean escape.\
Excluding downstream instances leaves nothing to count.\
Admitting them makes the field a measure of the corpus's own influence dressed as independent evidence, which is worse than no field, because it reads as proof.

So adoption is not tracked at all.\
Recurrence survives as a judgement argued at admission, where a reader can weigh the argument, and not as a durable verdict that outlives the reasoning behind it.\
[`AR0`](../artifacts/README.md) carries the reasoning where a reader meets the absence.

**What generalises past this field.**\
A corpus cannot measure its own uptake from inside itself.\
Any future field that counts how widely something here has been adopted elsewhere will have the same defect, whatever it is named - which is what the revival trigger watches for.

---

## What the gap cost before it was closed

Both directions of error have now occurred in this layer, in a single working session.\
A tier was downgraded on a sample too narrow to support the conclusion and had to be restored.\
Separately, claims of the form *no observed programme does X* were written from the same narrow sample and were false.\
In both cases the sample was never stated, so nothing in the entry could have caught it, and nothing in the corpus recorded that the tier had been re-examined at all.

The entries carry correction banners for the specific claims.\
The mechanism that let both happen is untouched.

---

## On revival

Re-triage rather than resume, per [`M5`](../methodology/M5-anti-amnesia-deferral.md).

This entry closed at the outcome its own last paragraph named as the cheapest honest one - no field at all - and it is worth noting that the option was written down before it was taken, because the analysis reached the answer one pass before the decision did.

The first trigger is the general one and is why a `wont-do` record is kept rather than deleted.\
The defect was never specific to recurrence: **a corpus cannot measure its own uptake from inside itself.**\
Any later field that counts how widely something here has been adopted elsewhere inherits it, whatever the field is called, and the argument against it is already written above rather than needing rediscovery.

The second trigger is the only condition that would make the original question answerable.\
Independent evidence requires someone outside this estate, reading this corpus and producing instances without being told to.\
Until that exists, every instance available is downstream, and downstream instances measure influence rather than recurrence.

[`MREQ-7`](mreq-7-provenance-and-trust-vocabulary.md) remains open and is **not** resolved by this.\
It asks who asserted an entry and when it was last verified - claims about *this corpus*, answerable from inside it.\
This asked about the world outside, which is the part that could not be reached.\
Whoever takes `MREQ-7` should not treat this closure as precedent for closing that one.
