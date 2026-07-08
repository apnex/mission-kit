---
name: workgraph-lease-discipline
description: "Scaffold stub. Planned WorkGraph-series skill for lease-based control of active arcs and WorkItems: driver lease heartbeat, renew/reclaim/release behavior, no-idle/no-manual-ping discipline, and recovery from expired or lost leases."
metadata:
  prerequisite: workgraph-arc-operator
  related-skills: workgraph-arc-operator
  series: workgraph
  parent-skill: workgraph-arc-operator
  series-role: specialist
  substrate: Hub WorkGraph / WorkItem lease FSM
---

# workgraph-lease-discipline — scaffold

**Status:** scaffold stub; content intentionally pending a dedicated authoring pass.

## Planned scope

- Driver lease heartbeat discipline.
- Renewal cadence and lease-token handling.
- Reclaiming expired driver or child leases.
- When to release, block, abandon, pause, or complete.
- No-idle and no-manual-ping operation through WorkGraph truth.

## Relationship

This will specialize `workgraph-arc-operator` for the liveness/control layer: keeping an arc governed without blind sleeps, stale FYIs, or manual wake pings.
