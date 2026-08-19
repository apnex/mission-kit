---
id: W1
category: work-type
title: build-a-slice - implement a scoped increment
status: active
roleEligibility: [engineer]
evidenceContract:
  - {kind: pr, description: the change as a PR}
  - {kind: commit, description: merged commit SHA}
  - {kind: test-run, description: CI / tests green}
  - {kind: freeform, description: linked runbook refs}
evidenceAuthority: executor-evidence
domainEligibility: [delivery-code, tooling-harness, distribution]
domainFreedom: free
parameters:
  - {name: target, fills: the slice/design spec, bindingSource: provided-by-trigger}
generationMode: arc-seeded
falsifier: CI red, scope drift, or unreviewed code merged
compositionHooks: bracketed by a verify-gate on the produced evidence; dependsOn its design/spec node
---

# W1 — build-a-slice

## Definition

An engineer implements one scoped increment against a given slice/design spec —
the change lands as reviewed, tested, merged code. Not open-ended engineering:
the `target` bounds it.

## Evidence & closeability

Closes on `executor-evidence`: a PR, its merged commit SHA, green CI, and linked
runbook refs. Because this is executor-produced evidence, closeability is gated
by the canonical constraint set in `work-types/README.md` — in particular
constraint 7 (a mandatory bracketing `verify-gate` consumes the self-produced
evidence before it counts as assurance) and constraint 8 (author ≠ approver on
the independence gate). This entry **satisfies**, does not restate, that
preflight.

## Generation

`arc-seeded` — a driver mints it inside a blueprint against a resolved design
spec. idea-425/451/403 instantiate it as the canonical `role=engineer ×
build-a-slice × domain` compose: the triple compiles to a claimable WorkItem
whose `evidenceRequirements[]` is the contract above, fed to an idle engineer
without hand-routing. Falsifier: CI red, scope drift, or unreviewed code merged.

## Axiom alignment

- **A6** — a well-typed slice lets strategic intent compile into self-fed
  execution; the engine feeds the engineer without the architect hand-routing.
- **A11** — the bracketing verify-gate keeps the executor's own green from
  standing as assurance, holding the independence line.
