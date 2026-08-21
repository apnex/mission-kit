---
id: MREQ-5
category: mission-required
title: Retiring the legacy style debt that keeps the whole-corpus gate red
status: active
fulfilment: deferred
hydrate-when: You need the whole-corpus style gate to be green rather than known-red before you can trust it
revival-trigger: >
  a contributor or CI needs `check-all.sh --all` as a real gate rather than a
  known-red one, OR the remaining debt falls small enough to clear in a diff a
  reviewer can actually read
related-axioms: [A8, A10]
related: [S0, M3]
---

# MREQ-5 - retiring the legacy style debt

## What is deferred

Converting the style debt that predates the checkers, so `tools/check-all.sh --all` passes.

Measured at the time of writing: 1,029 findings across roughly forty files, every one of them under `skills/`.

| Rule | Findings | Files |
| --- | --- | --- |
| `S13` plain ASCII | 956 | 28 |
| `S6` one sentence per line | 36 | 36 |
| `S10` rule between sections | 24 | 24 |
| `S12` code-block introducer | 13 | 9 |

All four have a `--fix`, so the conversion is mechanical rather than editorial.

---

## Why it is parked rather than built

Not because it is hard, but because doing it in one pass produces a diff nobody can review, and an unreviewable diff is where an unrelated change hides.\
The charter names that fault directly, and `check-all` is explicit that style gates the diff rather than the corpus for exactly this reason.

The current policy is not neutral about the debt: touching a file obliges you to convert it, so the total only falls.\
That makes this a question of when to spend one deliberate effort, not whether the debt is under control.

---

## What was built instead

The opportunistic-conversion rule, which is already load-bearing and already fires.\
One file was converted during this programme because a one-character edit pulled it into the gate.

The cost of leaving the rest is not untidiness.\
It is that `--all` is known-red, and a gate that always fails is a gate nobody reads, so any *new* whole-corpus finding it reports arrives invisible among the old ones.

---

## On revival

Re-triage rather than resume, per [`M5`](../methodology/M5-anti-amnesia-deferral.md).

Whoever takes it should convert one rule per commit rather than one sweep, so each diff is reviewable on its own terms and a bad autofix is attributable.\
`S13` is the bulk and the least risky; `S6` changes line structure and deserves the closest reading.
