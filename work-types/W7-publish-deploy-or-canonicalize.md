---
id: W7
category: work-type
title: publish-deploy-or-canonicalize - ship to the estate/channel
status: active
hydrate-when: You are shipping something to the estate or a release channel
roleEligibility: [engineer]
evidenceContract:
  - {kind: freeform, description: release artifact + deploy log}
  - {kind: freeform, description: version/digest/SHA + rollback anchor}
evidenceAuthority: executor-evidence
domainEligibility: [distribution, tooling-harness]
domainFreedom: free
parameters:
  - {name: target, fills: the release + channel, bindingSource: provided-by-trigger}
generationMode: reactive-triggered
falsifier: live artifact mismatch or rollback path absent
compositionHooks: dependsOn the landed change (W6 merge-and-land); artifact/live plane, distinct from the git plane
---

# W7 — publish-deploy-or-canonicalize

## Definition

Ship a landed change to the estate/channel — publish the release artifact,
deploy it live, or canonicalize it — the artifact/live-plane act, distinct from
the git-plane merge-and-land.

## Evidence & closeability

The evidenceContract is a `freeform` release artifact + deploy log plus a
`freeform` version/digest/SHA with a rollback anchor. Authority is
`executor-evidence`: the engineer who ships produces the closing evidence.
Closeability is governed by the canonical constraint set / closeability
preflight in `work-types/README.md` — not restated here. The rollback anchor is
load-bearing: it is what makes the shipped state reversible, and its absence is
a named falsifier rather than a soft gap.

## Generation

`reactive-triggered`: instantiated when a landed change is ready to ship
(idea-425/451/403 mint it off that substrate trigger — a merged/approved release
target — rather than pooling it idle). The falsifier is concrete: *live artifact
mismatch or rollback path absent* turns the node FAIL rather than leaving prose
open.

## Axiom alignment

- **A6** — strategic intent is not real until it is live in the estate/channel;
  publish/deploy is the load-bearing step that makes landed work actually reach
  users.
- **A11** — the ready-to-ship target feeds a well-typed claimable node so an idle
  engineer ships it without Director/architect hand-routing.
