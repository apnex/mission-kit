---
id: D3
category: domain
title: tooling-harness — the launch/runtime harness
added: 2026-07-13
status: active
subjectSurface: the launch/runtime harness — ois/pi/claude launchers, prompt-handlers, dev tooling
evidenceResolvesAgainst: harness source/config, launcher behavior, prompt-handler tables, live seat/session state
freeForTypes: [build-a-slice, fix-a-bug-or-repair, retire-or-hard-cut, validate-locally, run-a-live-probe-or-smoke, audit-a-surface, verify-gate-reactive]
provenance: [bug-247, idea-494, resfix0, mission-122]
related: [D0]
---

# D3 — tooling-harness

## Subject-surface
The launch/runtime harness: ois/pi/claude launchers, prompt-handlers, and dev
tooling. Evidence resolves against harness source/config, launcher behavior,
prompt-handler tables, and live seat/session state.

## Freedom
A **free** domain. Note the tie-break rule (`domains/README.md`): a
`tooling-harness` fix that serves `distribution` (e.g. bug-247's transport-
neutral prompt-table) is filed here — where its diff/evidence resolves — not
under the surface it ultimately serves.

## Axiom alignment
- **A7 (Resilient Agentic Operations):** harness robustness (resume-by-default,
  transport-neutral handlers) is assured against this surface.
