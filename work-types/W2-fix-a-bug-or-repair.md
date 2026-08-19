---
id: W2
category: work-type
title: fix-a-bug-or-repair - resolve a filed defect
status: active
hydrate-when: You are resolving a defect that has already been filed
roleEligibility: [engineer]
evidenceContract:
  - {kind: freeform, description: repro}
  - {kind: pr, description: fix PR}
  - {kind: test-run, description: regression test}
  - {kind: freeform, description: bug-state update}
evidenceAuthority: executor-evidence
domainEligibility: [delivery-code, tooling-harness, distribution]
domainFreedom: free
parameters:
  - {name: bug, fills: the bug id, bindingSource: provided-by-trigger}
generationMode: reactive-triggered
falsifier: bug still reproduces or fix not in main
compositionHooks: dependsOn a filed bug entity; brackets under a verify-gate that re-runs the regression
---

# W2 - fix-a-bug-or-repair

## Definition

Resolve a filed defect: reproduce it, land a fix, and prove the fix holds with a regression test.\
Trigger is a `bug` substrate entity.

---

## Evidence & closeability

The evidence contract is four requirements: a `freeform` repro, a `pr` carrying the fix, a `test-run` regression, and a `freeform` bug-state update.\
`evidenceAuthority: executor-evidence` - the engineer's own evidence satisfies the node.\
Closeability follows the canonical constraint set / closeability preflight in `work-types/README.md` (referenced, not restated); note the `bug` parameter's `provided-by-trigger` binding keeps `targetRef` resolving to a real defect (no vacuous repair), and constraint 5's falsifier is stated below.

---

## Generation

`generationMode: reactive-triggered` - instantiated when a bug entity is filed, never idle-pooled.\
This is the `fix-a-bug-or-repair` path idea-425/451/403 reference for the reactive branch of the composition rule (a substrate trigger mints a well-typed claimable node with a complete evidence contract).\
Falsifier: **bug still reproduces or fix not in main**.

---

## Axiom alignment

- **A7** - assurance is earned by a re-run regression, not by assertion; the fix
  is not closed until the defect is demonstrably gone.
- **A8** - repair carries an independent gate (the regression test-run) so
  closure means the failing observation is consumed, not merely edited away.
