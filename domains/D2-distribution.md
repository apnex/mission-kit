---
id: D2
category: domain
title: distribution — release channels and the rollout plane
status: active
subjectSurface: release channels — npm, containers, the estate/fleet rollout plane
evidenceResolvesAgainst: published artifacts, version/digest/SHA, deploy logs, rollback anchors, live-estate state
freeForTypes: [publish-deploy-or-canonicalize, retire-or-hard-cut, run-a-live-probe-or-smoke, audit-a-surface, verify-gate-reactive, reset-or-converge-the-fleet]
pinnedForTypes: []
related: [D0]
---

# D2 — distribution

## Subject-surface
The release/rollout plane: npm channels, container images, and the estate/fleet.
Evidence resolves against published artifacts, version/digest/SHAs, deploy logs,
rollback anchors, and live-estate state.

## Freedom
A **free** domain — distinct from `delivery-code` (git plane) by a different
evidence contract (artifact/live plane). `merge-and-land` (D1 git plane) vs
`publish-deploy` (D2 artifact plane) is the canonical two-plane split.

## Axiom alignment
- **A1 / A9:** live-artifact truth (digest/SHA, deploy log, rollback anchor) is
  the load-bearing evidence; A9's chaos/rollback posture lives here.
