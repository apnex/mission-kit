---
id: W17
category: work-type
title: author-closeout-packet - proof-level arc closeout
status: active
roleEligibility: [architect]
evidenceContract:
  - {kind: doc, description: closeout doc separating PR/CI/deploy/live proof}
evidenceAuthority: executor-evidence
domainEligibility: [coordination-substrate]
domainFreedom: pinned
parameters:
  - {name: arc, fills: the arc to close, bindingSource: provided-by-trigger}
generationMode: arc-seeded
falsifier: future observation claimed as done, or pending work hidden
compositionHooks: completionDependsOn the arc's landed/shipped nodes; the stands-last closeout that binds their proof planes together
---

# W17 — author-closeout-packet

## Definition

Author the proof-level closeout for a completed arc — a single doc that
separates and pins the distinct proof planes (PR merged / CI green / deploy
succeeded / live-verified) so the arc's "done" is evidenced, not asserted.

## Evidence & closeability

The evidenceContract is one `doc`: a closeout that separates PR/CI/deploy/live
proof. Authority is `executor-evidence` — the architect who closes the arc
produces the closing doc. Closeability is governed by the canonical constraint
set / closeability preflight in `work-types/README.md` — not restated here. The
separation of proof planes is load-bearing: it is what keeps a green CI from
standing in for a live check, and its collapse (or a still-pending node folded
into the doc) is the named falsifier rather than a soft gap.

## Generation

`arc-seeded`: minted by the closing driver inside a blueprint, stands last, and
binds the arc's landed/shipped nodes via a `completionDependsOn` hook
(idea-425/451/403 instantiate it off the arc-completion trigger rather than
pooling it idle — the arc must be substantively done before it can be closed).
The falsifier is concrete: *a future observation claimed as done, or pending
work hidden* turns the node FAIL rather than leaving the closeout to read as
finished.

## Axiom alignment

- **A1** (sovereign state transparency) — the closeout must reflect the actual
  live state; a future-claimed-as-done or a hidden-pending node makes the
  substrate lie, which is exactly what the falsifier catches.
- **A8** (gated recursive integrity) — separating PR/CI/deploy/live is the
  proof-plane gate on arc closure; each plane is evidenced independently before
  the arc is called done.
- **A13** (director intent amplification) — a proof-level closeout is the
  Director's trustworthy touchpoint on an arc's completion, so no per-node
  shepherding is required to know an arc truly landed.
