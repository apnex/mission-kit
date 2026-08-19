---
id: D5
category: domain
title: coordination-substrate - the WorkGraph/lifecycle/messaging machinery
status: active
hydrate-when: You are changing the machinery that coordinates work between agents
subjectSurface: the WorkGraph / lifecycle / messaging machinery as subject — blueprints, gates, leases, the queue
evidenceResolvesAgainst: WorkItem/blueprint state, driver leases, stint projections, gate/completion state, before/after graph topology
pinnedForTypes: [seed-a-blueprint-arc, drive-an-arc, reconcile-ledger, arc-repair, convene-a-council, author-closeout-packet, backstop-a-prod-window]
freeForTypes: [audit-a-surface, verify-gate-reactive]
related: [D0]
---

# D5 — coordination-substrate

## Subject-surface
The WorkGraph/lifecycle/messaging machinery treated as a subject: blueprints,
gates, leases, the queue. Evidence resolves against WorkItem/blueprint state,
driver leases, stint projections, gate/completion state, and before/after graph
topology.

## Freedom
**Pinned** for coordination-mode types (`seed`, `drive-an-arc`, `reconcile-
ledger`, `arc-repair`, `convene-council`, `author-closeout`, `backstop`) — the
type names this surface. Still a **free** target of `audit-a-surface` /
`verify-gate` (you can audit the graph itself).

## Axiom alignment
- **A7 (Resilient Agentic Operations):** arc-repair and completion-gate
  integrity (bug-250) resolve against this surface.
- **A8 (Gated Recursive Integrity):** the gate/completion machinery lives here.
