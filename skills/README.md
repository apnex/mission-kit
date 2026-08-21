---
id: K0
category: skill
title: Skills - executable capability, the stub-and-body split, and composition by edge
status: active
hydrate-when: You are adding or invoking an executable capability, or you need to know why a skill is two files rather than one
supersedes: []
related: [M0, P0, SC3, A11]
---

# Skills - the how-you-do-it layer

Operator-level capabilities and reusable tooling.\
A skill is *invoked*, not followed: it names a procedure with inputs, steps and an output, and it is expected to be executed largely as written.

That is the boundary against [`M0`](../methodology/README.md).\
A methodology entry governs how you conduct work you are already doing; a skill is a capability you pick up to do a thing you could not otherwise do.

---

## A skill is two files, on purpose

Each skill is a directory holding a portable `SKILL.md`, with a `K*` stub beside it in this layer.

The stub is the catalogue entry.\
It carries the `id`, `status`, ledger title and hydration trigger, and it points at the body.

The body carries none of those.\
A catalogue placement is meaningless once the skill is lifted into another repository, and a skill that arrives carrying a foreign corpus's ID is unusable without editing.\
The split is what makes a skill portable and addressable at the same time, and it is why [`SC3`](../schemas/SC3-skill.md) governs the body's frontmatter separately from [`SC1`](../schemas/SC1-catalog-entry.md) governing the stub's.

---

## Composition is expressed as edges, not as names

A skill declares `prerequisite` for what must be read first, and `composes` for the primitives a specialist system is built from.

Depth is **derived** from those edges as the longest path from a root, and is never stored in a name.\
Encoding hierarchy into a name freezes it, and it rots on the first change to the graph.

[`tools/skill-graph.mjs`](../tools/skill-graph.mjs) makes the edges load-bearing rather than narrative: every target must resolve, the graph must be acyclic, each composed primitive's construct family must actually appear in the skill's assets, and every bundle's `skills` entry must name a real skill.

Skills compose into operator-facing roles through [`bundles/`](../bundles/README.md), which hold deployment composition rather than knowledge and therefore take no ID and appear in no ledger.

---

## What earns an entry

A capability earns one when it is executable, repeatable, and would otherwise be reconstructed from scratch by whoever needs it next.

A skill that only describes is a methodology entry filed in the wrong layer.\
A skill invoked once, for one system, is a runbook and belongs with that system.\
A skill whose steps a script could take should be that script, per [`A11`](../axioms/A11-cognitive-minimalism.md), with the skill reduced to when to run it.

---

## Faults

- **The stub without a body, or a body without a stub.** One is a citation resolving to nothing; the other is a capability nothing routes to.
- **The unportable skill.** A body carrying host-specific paths, catalogue IDs or tool names, so it cannot be lifted without editing.
- **The level in the name.** Hierarchy encoded into a filename, which freezes a graph that is expected to change.
- **The narrated skill.** A body that explains rather than instructs, so two operators executing it produce different work and neither has departed from it.
- **The skill that should be a tool.** A deterministic procedure written for a model to follow, spending judgement on work a script would do identically and cheaper.

---

## Index

<!-- BEGIN GENERATED: entries. Run tools/generate-index.mjs; do not edit by hand. -->
| ID | Title | Status | Hydrate when |
|---|---|---|---|
| [K0](README.md) | Skills - executable capability, the stub-and-body split, and composition by edge | active | You are adding or invoking an executable capability, or you need to know why a skill is two files rather than one |
| [K1](K1-history-content-scrub.md) | History content scrub | active | You must remove content from history that is already committed |
| [K2](K2-publishing-rewritten-history.md) | Publishing rewritten history | active | You are about to force-push rewritten history that others may have consumed |
| [K3](K3-substrate-audit.md) | substrate-audit - code-grounded substrate audit | active | You are auditing a substrate and must ground every claim in its source |
| [K4](K4-research-artefacts.md) | research-artefacts - discipline for producing persistent research outputs | active | You are producing a research output that must survive the session that made it |
| [K5](K5-survey.md) | survey - stakeholder-intent capture before design commitment | active | Direction is still open and you are about to commit to a design |
| [K6](K6-arc-lifecycle.md) | arc-lifecycle - operate staged work as a sovereign FSM-gated state engine | active | You are operating staged work whose gates must hold rather than be trusted |
| [K7](K7-sysml-literacy.md) | sysml-literacy - read + understand SysML v2 (literacy base for SysML-anchored skills) | active | You are about to read a SysML v2 model and cannot yet parse it |
| [K8](K8-model-a-state-machine.md) | model-a-state-machine - author an FSM/lifecycle in SysML v2 | active | You are modelling a lifecycle or state machine in SysML v2 |
| [K9](K9-model-a-workflow.md) | model-a-workflow - author an ordered activity / workflow in SysML v2 | active | You are modelling an ordered activity or workflow in SysML v2 |
| [K10](K10-model-a-component.md) | model-a-component - author a structural breakdown in SysML v2 | active | You are modelling a structural breakdown in SysML v2 |
| [K11](K11-sysml-skill-builder.md) | sysml-skill-builder - build a SysML-anchored modelling skill (meta) | active | You are building a new SysML-anchored modelling skill |
| [K12](K12-sysml-skill-tester.md) | sysml-skill-tester - verify a SysML-anchored modelling skill (meta) | active | You are verifying that a SysML-anchored modelling skill actually works |
| [K13](K13-model-a-dependency-graph.md) | model-a-dependency-graph - author a DAG of typed nodes (ref edges) in SysML v2 | active | You are modelling a dependency graph of typed nodes in SysML v2 |
| [K14](K14-model-a-constraint.md) | model-a-constraint - author a reusable boolean rule (constraint def) in SysML v2 | active | You are modelling a reusable boolean rule in SysML v2 |
| [K15](K15-model-a-classification.md) | model-a-classification - author orthogonal enum classification axes in SysML v2 | active | You are modelling orthogonal classification axes in SysML v2 |
| [K16](K16-model-an-arc.md) | model-an-arc - model an arc as a composed L2 system (composes the six primitives) | active | You are modelling a whole arc as a composed system rather than a single construct |
| [K17](K17-sysml-skill-evaluator.md) | sysml-skill-evaluator - measure a SysML skill's leverage vs the base model (meta) | active | You need to know whether a SysML skill beats the base model, and by how much |
| [K18](K18-workgraph-arc-operator.md) | workgraph-arc-operator - execute and manage a Hub WorkGraph arc | active | You are executing or managing an arc on the coordination substrate |
| [K19](K19-workgraph-blueprint-author.md) | workgraph-blueprint-author - author valid Hub WorkGraph blueprints | draft | You are authoring a blueprint that the substrate must accept |
| [K20](K20-workgraph-lease-discipline.md) | workgraph-lease-discipline - operate WorkGraph leases and liveness | draft | You are holding a lease and must keep liveness rather than assume it |
| [K21](K21-workgraph-verification-gates.md) | workgraph-verification-gates - exact independent WorkGraph PASS/FAIL gates | active | You are gating a build and the pass or fail must be exact and independent |
| [K22](K22-workgraph-pr-delivery.md) | workgraph-pr-delivery - exact source-to-live proof under WorkGraph control | active | You must prove a change reached live, not merely that it merged |
| [K23](K23-workgraph-arc-closeout.md) | workgraph-arc-closeout - terminal proof reconciliation for WorkGraph arc closeout | active | You are closing an arc and must reconcile terminal proof |
| [K24](K24-workgraph-recovery.md) | workgraph-recovery - immutable-lineage recovery for stopped/failed/revised arcs | active | An arc has stopped, failed or been revised and you are recovering it |
| [K25](K25-workgraph-arc-participant.md) | workgraph-arc-participant - act inside a Hub WorkGraph arc | active | You are acting inside an arc someone else is driving |
| [K26](K26-workgraph-arc-planning.md) | workgraph-arc-planning - bounded intent-to-design-seal planning arc | active | You are planning from intent to a sealed design under a bounded arc |
| [K27](K27-write-discoverable-code.md) | write-discoverable-code - name and structure code so plain-text search resolves it in one hit (vendored, MIT) | active | You are naming anything another agent must find by plain-text search |
| [K28](K28-asd-ste100-verifier.md) | asd-ste100-verifier - audit and enforce ASD-STE100 Simplified Technical English, with a runnable engine | active | You are writing documentation that must be readable by a non-native English speaker |
<!-- END GENERATED -->
