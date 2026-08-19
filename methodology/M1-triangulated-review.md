---
id: M1
category: methodology
title: Triangulated review — minimum 4 independent inputs
status: active
supersedes: []
related: [M2, M3]
---

# M1 — Triangulated review

## Rule

When auditing a piece of work (a patch, a design, a contract, a
doc) for correctness, require **at least four genuinely
independent inputs** before reaching a verdict. For a code patch
the canonical four are:

1. **Upstream / vanilla baseline** — what does the unmodified
   reference look like for the same surface? What did the change
   actually change?
2. **Prior-version intent + review** — what was the author trying
   to do, and what did the previous review pass find? Read both,
   in their original form.
3. **Archaeology of the design's ancestors** — commits, removed
   approaches, parallel patches in the same series. What was tried
   and discarded? What's the same class of bug elsewhere?
4. **Community signal** — existing bug reports, upstream
   discussions, third-party write-ups of the same problem class.

Fewer than four inputs and the auditor's own pattern-matching
becomes the bottleneck. Four is the empirical floor that defeats
single-source confirmation bias on non-trivial reviews.

## Rationale

A reviewer reading only their own prior intent confirms it. A
reviewer reading only the diff confirms the diff is consistent
with itself. A reviewer reading only upstream confirms the change
diverges from upstream in the documented ways. None of those is a
correctness audit; each one feels like one.

Four genuinely independent inputs — none of which were produced by
the reviewer in the loop being audited — force the reviewer to
reconcile multiple framings of the same surface. The
reconciliation is where real bugs surface.

The number isn't sacred (sometimes 3 is enough; sometimes 5 is
needed) but the floor matters because below 3 the failure mode is
predictable: you write a confident review that's a restatement of
the author's confident intent, and the bug class lives on
undetected.

## Examples

**Bad:**

> Reviewer reads the patch + the patch's own commit message + the
> author's design doc. Verdict: looks good. (Three inputs, all
> produced by the author; reviewer is auditing the author's
> coherence, not the code's correctness.)

**Good:**

> Reviewer reads (a) the unmodified upstream file the patch
> touches, (b) the patch's prior-version intent + review, (c) `git
> log -p` over neighboring patches in the series to find related
> design decisions, (d) the upstream project's bug tracker for the
> same subsystem. Verdict draws on tensions surfaced between those
> four; flags a one-byte offset bug that an author-only read would
> have confirmed past.

## When to apply

- Reviewing patches or designs that ship to production or
  upstream.
- Self-reviewing your own work after a long authoring session —
  treat your own prior intent as input (2), not as ground truth.
- Adjudicating a disagreement between two reviewers — pull in
  inputs (3) and (4) to break the tie objectively.
- Any review where the cost of a missed bug is high enough to
  warrant deliberate work.
