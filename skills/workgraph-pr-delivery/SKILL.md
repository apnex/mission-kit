---
name: workgraph-pr-delivery
description: "Scaffold stub. Planned WorkGraph-series skill for delivering code arcs through PRs while preserving WorkGraph truth: branch, PR, review, merge queue, CI, evidence binding, merge commit recording, and distinction between merged code and closed arc."
metadata:
  prerequisite: workgraph-arc-operator
  related-skills: workgraph-arc-operator
  series: workgraph
  parent-skill: workgraph-arc-operator
  series-role: specialist
  substrate: Hub WorkGraph / GitHub PR delivery
---

# workgraph-pr-delivery — scaffold

**Status:** scaffold stub; content intentionally pending a dedicated authoring pass.

## Planned scope

- Branch-to-PR workflow under WorkGraph control.
- Non-pusher review and merge-queue discipline.
- CI/check-run and review evidence binding.
- PR-to-WorkItem/arc close semantics.
- Handling merged-code proof versus live-event proof.

## Relationship

This will specialize `workgraph-arc-operator` for code delivery: making GitHub state and WorkGraph state converge without treating PR messages as authority.
