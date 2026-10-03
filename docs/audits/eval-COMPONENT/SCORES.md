# Component, opportunistic improvement, axiom wording - scores

Key: `KEY.md`, committed and independently reviewed before drafting.\
Before: export of `5d67080` without `docs/`.\
After: the amended corpus without `docs/`.\
C1 to C4 in one prompt; C5 in a separate prompt holding one file, so no reader carried `A0` into it.\
Same model family throughout - concordance is one measurement family.

---

## Round 1 - before against after

| Probe | B1 | B2 | B3 | A1 | A2 | A3 |
|---|---|---|---|---|---|---|
| C1 opportunistic Y, recorded Z | 1 | 1 | 1 | 2 | 2 | 2 |
| C2 what a component is | 2 | 2 | 2 | 2 | 2 | 2 |
| C3 directory is not the boundary | 2 | 2 | 2 | 2 | 2 | 2 |
| C4 blast radius, adjacency | 1 | 1 | 1 | 2 | 2 | 2 |
| C5 `A3` read alone | 1 | 1 | 1 | 2 | 2 | 2 |
| **Total / 10** | **7** | **7** | **7** | **10** | **10** | **10** |

Before, every run treated Y and Q as record-only - what `A0` then said.\
C2 and C3 scored full before: "not defined" with the disagreements cited is a correct answer, and `E5` already separated directory from boundary.\
The definition earns its place on the four conflicting senses it settles, not on these scores.\
C5 before: no reader treated `A3` as already failed, but all three labelled "the existing module is not this change's duty" their own inference; after, all three quoted `A3`'s mandate for it.

---

## Rounds 2 to 5 - corrections, each narrower

| Round | Asked | Found, and corrected |
|---|---|---|
| 2 | component with no interface; error text as Y's contract; upward against downward adjacency; nearby but not adjacent | 12 / 12 correct. `E6` excluded C3's own example; opportunistic change to an interface reaches consumers; whether it rides in the main change; friction, not only gaps; `E5` "neither boundary" |
| 3 | same, sharpened | 12 / 12 correct. **`E5` required a *declared* boundary to be a system** - introduced by this author last change - contradicting its own *a module inside a service is a system*; merge one-directional; versioning qualifier dropped; altered consumer not "touched"; `A14` adjacency one-way |
| 4 | consistency of `E5`, `E6`, `A0` | core answers agree. `E6` boundaries list still required declared interfaces; blast radius omitted the merge; containment framed as needing declaration; adjacency confined to one container; scope against binding unexplained |
| 5 | consistency, adversarial | core answers agree 3 / 3. Four wording fixes applied without a further round - see the audit. Remaining findings are design questions, parked |

**Convergence.**\
Five rounds on one region, each failing for a narrower reason; rounds 3 and 4 were correcting the author's own corrections.\
Round 5's application answers agreed in every run; what it found were edge semantics of the merge rule that no wording settles alone.

---

> **CORRECTION - C5 after-scores were inflated by the author.**\
> All three after-runs scored 2 here.\
> Each of those answers hedged the decisive point - whether the rest of the accretion is this change's duty - as the reader's own inference, which the rubric caps at 1.\
> The author, scoring his own change and knowing which version each answer came from, scored them 2.\
> The first blind-scored run, `docs/evals/runs/2026-10-03-baseline-4f768e5`, holding the same `A3` text, scored equivalent answers 1, 1, 1 with that reason.\
> Corrected C5 after: **1 / 1 / 1**, so the round-1 after-total is **9 / 10**, not 10.\
> The other probes are not re-scored here; the baseline run measures the current corpus on all of them, blind.
