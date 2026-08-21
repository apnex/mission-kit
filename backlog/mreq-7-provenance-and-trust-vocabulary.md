---
id: MREQ-7
category: mission-required
title: A provenance and trust vocabulary for an agent-maintained corpus
status: active
fulfilment: deferred
hydrate-when: You need to know when an entry was last verified or who asserted it, and the corpus does not record either
revival-trigger: >
  an entry is found to be wrong or stale and nothing records when it was last
  checked or against what, OR a reader needs to weigh two entries differently and
  the corpus offers no basis for doing so
related-axioms: [A4, A8, A14]
related: [SC1, M4, MREQ-6]
---

# MREQ-7 - a provenance and trust vocabulary

## What is deferred

Adding a provenance model to the catalogue entry contract, so an entry records how far to trust it and when to re-check it.

Today `status` carries the entire answer, and it answers one question only: whether the entry is in force.\
It says nothing about who asserted the content, when it was last verified, what it was verified against, or when it should be presumed stale.

The vocabulary worth stealing is already identified, from Open Knowledge Format: `generated: {by, at}`, `verified: [{by, at}]`, and `stale_after` as an absolute date.\
The shape is proven elsewhere; adopting it here is the deferred work.

---

## Why it is parked rather than built

Because a provenance field that nothing maintains is worse than none.\
It reads as evidence, it is checked by nobody, and the first stale value teaches every later reader to ignore the field - which then discredits the entries that *are* current.

So the missing half is not the schema.\
It is the answer to who writes these fields and what forces them to stay true.\
A `verified` list is a claim about the world, and a claim nothing re-measures decays into decoration.\
`stale_after` is also a point-in-time value in a corpus whose own [`S5`](../style/S5-no-version-pins-in-prose.md) bars those from prose, so its placement in frontmatter needs to be argued rather than assumed.

Adding the fields before that is answered would bank the appearance of provenance and none of it.

---

## What was built instead

Nothing yet, and the gap is worth stating plainly rather than leaving implied.

This corpus is explicitly written for cold agents to read and increasingly for agents to maintain.\
Every other trust property it holds is mechanical - identity, routability, body shape, resolvable citations, derived indexes - and each is enforced by a script rather than asserted.\
Provenance is the one load-bearing trust property with no mechanism at all, which is why it belongs on the ledger rather than in a note.

---

## On revival

Re-triage rather than resume, per [`M5`](../methodology/M5-anti-amnesia-deferral.md).

The first trigger is the direct one: a wrong entry found, with no record of when it was last believed correct.\
The second is subtler and more likely to fire first.\
A reader weighing two entries that disagree has no basis for preferring either, and reaches for recency or authorship they have to infer from git rather than read from the entry.

Whoever takes it should answer the maintenance question before the schema question, and should expect the honest outcome to be a smaller vocabulary than the one above.
