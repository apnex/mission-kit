---
name: workgraph-recovery
description: "Scaffold stub. Planned WorkGraph-series skill for recovering stuck WorkGraph arcs: stale messages, expired leases, blocked children, failed PRs, unavailable verifiers, paused nodes, scope creep, and graph/authority drift."
metadata:
  prerequisite: workgraph-arc-operator
  related-skills: workgraph-lease-discipline, workgraph-verification-gates, workgraph-pr-delivery, workgraph-arc-operator
  series: workgraph
  parent-skill: workgraph-arc-operator
  series-role: specialist
  substrate: Hub WorkGraph / recovery playbooks
---

# workgraph-recovery — scaffold

**Status:** scaffold stub; content intentionally pending a dedicated authoring pass.

## Planned scope

- Diagnosing stuck arcs from WorkGraph truth.
- Stale FYIs and crossed-message handling.
- Expired/lost lease recovery.
- Blocked child and failed PR recovery.
- Verifier-offline and scope-creep disposition.

## Relationship

This will specialize `workgraph-arc-operator` for abnormal paths: restoring liveness and authority without hand-wavy state resets or chat-memory recovery.
