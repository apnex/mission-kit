---
id: M3
category: methodology
title: Default-reject discipline + honest yield reporting
status: active
supersedes: []
related: [M1, M4]
---

# M3 — Default-reject discipline + honest yield reporting

## Rule

Two paired disciplines for any triage / improvement-sweep / review
program where candidates are evaluated against a current state:

1. **Default-reject.** The default disposition for a candidate is
   *reject*. The bar for *land* is *"delivers more value than it
   costs, measured concretely against the current state."*
   Marginal improvements, stylistic preferences, and "wouldn't it
   be nicer if…" candidates are rejected by default. A program
   where most candidates are accepted is a program with a lax bar
   — not a productive one.

2. **Honest yield reporting.** Lead every summary with the
   **actual delivered outcome**: how many candidates considered,
   how many landed, what concrete bugs were fixed, what was
   verified vs. asserted. Architecture descriptions, philosophy,
   and process narrative come *after* the yield line, not before.
   "We considered 86 candidates and landed 1 substantive code fix"
   is the honest opening of a sweep that found 1 real bug.

## Rationale

A high acceptance rate is a smell, not a virtue. It signals the
triage either (a) wasn't selective, (b) was generating
self-justifying candidates, or (c) didn't have a real bar in the
first place. Programs without default-reject discipline tend to
land cosmetic churn that adds review surface without reducing real
defect density.

Honest yield reporting is the antidote to "looks like progress"
narratives. A sweep that ran for two weeks, generated 40 PRs, and
fixed one real bug is a sweep that fixed one real bug — the
process narrative shouldn't reframe that into a triumph. Leading
with yield forces the work to be evaluated on what it actually
delivered, which is the only thing downstream readers care about.

The two disciplines reinforce each other: default-reject makes
yield numbers honest (because the bar is real); honest yield
reporting makes default-reject visible (because the numbers prove
the bar was held).

## Examples

**Bad:**

> "Refactor sweep complete. We applied a new layering convention
> across the codebase, improving consistency. 23 PRs landed.
> Detailed methodology and rationale follows." (No yield. No
> defect numbers. Reader can't tell if anything was actually
> fixed.)

**Good:**

> "Sweep complete. **Yield: 1 real bug fix, 2 doc precision
> improvements, 86 candidates rejected.** The one fix was a
> register-offset error; the rejected candidates included
> 30 stylistic preferences, 40 marginal refactors, and 16
> overlapping suggestions. Methodology follows." (Yield first;
> reader knows immediately what shipped.)

## When to apply

- Running any improvement sweep, refactor program, or audit cycle.
- Reviewing candidate changes proposed by AI-assisted analysis
  (which tends to over-generate plausible candidates).
- Writing the summary section of a review program's close-out —
  resist leading with process; lead with delivered outcome.
- Self-checking your own change list: if you accepted most of what
  you generated, the bar was probably too low.

## Origin

A multi-cycle patch-review program where sub-cycle 3 explicitly
held the default-reject bar across ~86 candidate improvements,
landing 1 substantive code fix + a handful of doc-precision
edits. The close-out summary's "honest yield assessment" section
was what made the program legible to outside readers; see project
memory `project_patch_v3_improvements_complete_2026_05_23`.
