---
id: K19
category: skill
title: workgraph-blueprint-author - author valid Hub WorkGraph blueprints
status: stub
hydrate-when: You are authoring a blueprint that the substrate must accept
name: workgraph-blueprint-author
description: "Scaffold stub. Planned WorkGraph-series skill for authoring valid Hub seed_blueprint graphs: driver nodes, child nodes, start-gates, completion-gates, references, runbooks, evidence requirements, and dry-run validation. Use after workgraph-arc-operator when the next problem is blueprint shape rather than arc drive-loop operation."
metadata:
  prerequisite: workgraph-arc-operator
  related-skills: arc-lifecycle, workgraph-arc-operator
  series: workgraph
  parent-skill: workgraph-arc-operator
  series-role: specialist
  substrate: Hub WorkGraph / seed_blueprint
---

# workgraph-blueprint-author — scaffold

**Status:** scaffold stub; content intentionally pending a dedicated authoring pass.

## Planned scope

- Blueprint graph shape for Hub `seed_blueprint`.
- Controller driver node conventions.
- `dependsOn` versus `completionDependsOn` usage.
- Required `runbook`, `references`, and evidence contracts.
- Dry-run validation and idempotent `runId` discipline.
- **Axiom alignment audit gate:** extensive planning/design arcs must include a dedicated audit node before implementation approval, per `M7`.
- **Template-before-instance discipline:** when a graph shape is likely to recur, name the reusable operational pattern and express the current arc as a narrow parameterized instance.
- Pattern parameters: surface/domain name, candidate set, scope fence, authority/decision point, evidence requirements, registry/proof checks, and closeout/follow-up routing.
- Template provenance: instance blueprints should carry enough payload/reference metadata that a later operator can extract or refine the generic pattern without reverse-engineering one-off node prose.

## Seed pattern captured for authoring

`tool-surface-hygiene` is the first explicit candidate pattern for this skill series.
It generalizes a narrow tool-family cleanup into a reusable workflow:

1. bounded tool inventory and dependency survey;
2. per-tool classification;
3. authority decision packet;
4. implementation of remove / hide / retain-read-only choices;
5. registry and workflow proof;
6. closeout with residual surfaces and follow-ups.

The concrete `proptool0` blueprint should be treated as an instance of that pattern, not as a one-off Proposal workflow cleanup.

## Relationship

This will specialize `workgraph-arc-operator` for the authoring step: turning an approved arc plan into a cold-start-legible WorkGraph blueprint.
It should preserve reusable graph shapes as invested workflow templates while still instantiating them narrowly for the current arc.

When authoring an extensive arc, do not leave axiom alignment as prose in the plan.
Model it explicitly as a review/audit WorkItem, make implementation nodes depend on it, and have the arc-driver `completionDependsOn` include it.
