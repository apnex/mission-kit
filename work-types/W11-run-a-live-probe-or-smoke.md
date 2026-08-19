---
id: W11
category: work-type
title: run-a-live-probe-or-smoke — observe live behavior at a revision
status: active
roleEligibility: [verifier, engineer]
evidenceContract:
  - kind: freeform
    description: live transcript/log/result with timestamp + target revision
evidenceAuthority: executor-evidence-provisional
domainEligibility: [delivery-code, distribution, tooling-harness]
domainFreedom: free
parameters:
  - name: target
    fills: the live surface + revision
    bindingSource: provided-by-trigger
generationMode: reactive-triggered
falsifier: not actually live, or no target revision recorded
compositionHooks: dependsOn the triggering event; bracketed by an independent verify-gate when its result is consumed as assurance
---

# W11 — run-a-live-probe-or-smoke

## Definition

Exercise a live surface at a named revision and record what it actually did —
a smoke test, resume probe, or deployment sanity check that observes real
runtime behavior rather than static or test-harness behavior.

## Evidence & closeability

Evidence contract: one `freeform` live transcript/log/result carrying a
timestamp **and** the target revision. Because it is
`evidenceAuthority: executor-evidence-provisional`, closure is provisional —
the observation does not count as assurance until an independent gate consumes
it (constraint 7). The `target` parameter binds `provided-by-trigger`, so
`targetRef` resolves to a real live surface + revision. Closeability is the
canonical seed-time projection in `work-types/README.md` — see that file's
constraint set / closeability preflight; this entry satisfies it, it does not
restate it.

## Generation

`reactive-triggered`: instantiated by a substrate trigger — a fresh deploy, a
resume event, a build landing, or a director signal to eyeball live behavior.
idea-425/451/403 instantiate it as the reactive probe a build/deploy edge fires
to confirm the live surface at the shipped revision; a **drift-probe variant is
a proactive candidate under idea-403** (proactive-poolable), not this reactive
entry. Falsifier: **not actually live, or no target revision recorded** — a
probe against a mock, or a transcript with no revision stamp, is FAIL.

## Axiom alignment

- **A7** — an executor-produced live observation is provisional assurance only;
  it must be consumed by an independent gate before it certifies anything.
- **A1** — the `target` binds to a real live surface + revision (no vacuous
  probe against nothing).
