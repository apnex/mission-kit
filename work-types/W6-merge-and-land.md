---
id: W6
category: work-type
title: merge-and-land — land an approved change on canonical main
status: active
roleEligibility: [engineer]
evidenceContract:
  - {kind: commit, description: merge commit}
  - {kind: freeform, description: branch-protection / review status}
evidenceAuthority: executor-evidence
domainEligibility: [delivery-code, tooling-harness, distribution]
domainFreedom: free
parameters:
  - {name: pr, fills: the approved PR, bindingSource: provided-by-trigger}
generationMode: reactive-triggered
falsifier: branch not merged to canonical main
compositionHooks: dependsOn the approving review/gate on the PR; distinct from publish-deploy (git plane, not release plane)
---

# W6 — merge-and-land

## Definition

Land an already-approved PR onto canonical `main` — the git-plane act of
integrating a reviewed branch, distinct from the publish/deploy release plane.

## Evidence & closeability

The evidenceContract is a `commit` (the merge commit) plus a `freeform`
attestation of branch-protection / review status at merge time. Authority is
`executor-evidence`: the engineer who merges produces the closing evidence.
Closeability is governed by the canonical constraint set / closeability
preflight in `work-types/README.md` — not restated here. Because this is
`executor-evidence`, the trigger is a *pre-approved* PR (the independent review
gate is upstream of the merge, satisfying separation-of-duties before W6 fires),
so W6 does not itself carry an independence attestation.

## Generation

`reactive-triggered`: instantiated when a PR reaches approved/mergeable state
(idea-425/451/403 mint it off that substrate trigger — an approved PR — rather
than pooling it idle). The falsifier is concrete: *branch not merged to
canonical main* turns the node FAIL rather than leaving prose open.

## Axiom alignment

- **A6** — strategic intent must reach canonical main to become real; merge is
  the load-bearing integration step that makes reviewed work live.
- **A11** — the approved PR feeds a well-typed claimable node so an idle engineer
  lands it without Director/architect hand-routing.

## Origin

Earned by resfix0 / mission-121, where the git-plane land was the recurring act
distinct from publish-deploy.
