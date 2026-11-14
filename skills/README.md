---
id: K0
category: skill
title: Skills - executable capability, the stub-and-body split, and composition by edge
status: active
hydrate-when: You are adding or invoking an executable capability, or you need to know why a skill is two files rather than one
supersedes: []
related: [M0, RU0, PC0, P0, SC3, A11]
---

# Skills - the how-you-do-it layer

## Vision

**North star.**\
Every capability an engineering agent invokes is built once, installed, and executed the same way each time, whether or not a [coordination substrate](../entities/E9-substrate.md) is running.\
A *capability* here is a procedure with inputs, steps and an output, run largely as written.

**What this set is, and is not.**\
It is the packaged, executable capabilities an agent invokes rather than reconstructs.\
It is not guidance a reader follows, which belongs in [methods](../methods/README.md), [rules](../rules/README.md) or [practices](../practices/README.md), nor a procedure a script could take whole, which is a [tool](../tools/README.md), nor a runbook for one system, which belongs with that system.

**Succeeding.**\
The set is measured on four dimensions, never collapsed into one score:

- **Built once** - each skill packages one capability that would otherwise be reconstructed by whoever needs it next.
- **Declared dependencies** - every dependency is an edge a script can check, and none lives only in prose.
- **Minimal judgement** - every step a script could take is left to a script.
- **Balance** - no kind of capability grows while another holds none, and none exists only for one coordination system.

**Authority.**\
The director holds this vision and ratifies any change to it, under [`M11`](../methods/M11-change-a-charter.md).

**What this vision does not authorise.**\
Citing this vision admits no skill and licenses no change of direction; a skill is admitted only by the tests under *What earns an entry*.

Operator-level capabilities and reusable tooling.\
A skill is *invoked*, not followed: it names a procedure with inputs, steps and an output, and it is expected to be executed largely as written.

The set exists so that a capability built once is installed and invoked rather than reconstructed by whoever needs it next, and executed the same way each time.

---

## Territory

**Scope.**\
This set covers **every capability an engineering agent invokes to do its work**, whether or not the coordination substrate is running.\
The claim is set by what the set is for, not by what it holds today.

**Growth policy.**\
Uncapped.\
A member is one executable, repeatable capability, invoked and run largely as written, at the grain of a procedure with inputs, steps and an output that would otherwise be reconstructed by whoever needs it next.\
Members are balanced on what the capability does, so that no family grows while whole kinds of capability hold none, and none exists only for one coordination system without a counterpart for work done without it.

---

## Operation

This set is analysed by [`M12`](../methods/M12-investigate-a-set.md) and its membership changed by [`M13`](../methods/M13-change-a-set.md); this charter is changed by [`M11`](../methods/M11-change-a-charter.md).\
Its members are balanced on what the capability does, and an analysis also checks each family for a counterpart that serves work done without its coordination system.\
Dependencies between members are the `prerequisite` and `composes` edges declared in each body's frontmatter, so an analysis reads them from those edges and [`tools/skill-graph.mjs`](../tools/skill-graph.mjs), never from names or prose.\
A candidate that only describes is routed to methods, rules or practices, one a script could take whole to [tools](../tools/README.md), and a composition of capabilities into an operator role to [bundles](../bundles/README.md).\
To stress the territory across the capabilities an agent invokes, an analysis partitions the population by capability family - research and audit, intent capture, modelling, staged-work and arc operation, code and documentation authoring, and corpus self-maintenance - checks each family for undeclared prose dependencies against [`tools/skill-graph.mjs`](../tools/skill-graph.mjs), tests whether any coordination-substrate family lacks a substrate-independent counterpart, and checks whether any multi-step operator workflow in [`methods/`](../methods/README.md) or [`tools/`](../tools/README.md) is being reconstructed by hand for want of a packaged skill.

---

## What earns an entry

A capability earns one when it is executable, repeatable, and would otherwise be reconstructed from scratch by whoever needs it next.

A skill that only describes is a method, rule or practice filed in the wrong layer, as `M9` was before it moved.\
A skill invoked once, for one system, is a runbook and belongs with that system.\
A skill whose steps a script could take should be that script, per [`A11`](../axioms/A11-cognitive-minimalism.md), with the skill reduced to when to run it.

---

## Neighbours

| Neighbour | The question that separates them |
|---|---|
| [Methods](../methods/README.md) | Is it packaged to be installed and invoked, or held as guidance a reader follows? A method is the single source of a procedure's content; a skill packages a procedure and earns its packaging where scripts or assets make it necessary. |
| [Rules](../rules/README.md) and [practices](../practices/README.md) | Does it produce anything? Guidance that governs how work is done without producing anything is a rule or a practice, never a skill. |
| [Tools](../tools/README.md) | Could a script take every step? Then it is a tool, and a skill at most says when to run it. |
| [Bundles](../bundles/README.md) | Is it a capability, or a composition of capabilities into an operator role? Bundles hold deployment composition, take no ID and appear in no ledger. |
| [Work-types](../work-types/README.md) | Is it how a capability is executed, or a kind of work that can be claimed and closed? A work-type may be performed using a skill. |

---

## Member shape

**A skill is two files, on purpose.**\
Each skill is a directory holding a portable `SKILL.md`, with a `K*` stub beside it in this layer.

The stub is the catalogue entry.\
It carries the `id`, `status`, ledger title and hydration trigger, and it points at the body.

The body carries none of those.\
A catalogue placement is meaningless once the skill is lifted into another repository, and a skill that arrives carrying a foreign corpus's ID is unusable without editing.\
The split is what makes a skill portable and addressable at the same time, and it is why [`SC3`](../schemas/SC3-skill.md) governs the body's frontmatter separately from [`SC1`](../schemas/SC1-catalog-entry.md) governing the stub's.

---

## Composition

**Composition is expressed as edges, not as names.**\
A skill declares `prerequisite` for what must be read first, and `composes` for the primitives a specialist system is built from.

Depth is **derived** from those edges as the longest path from a root, and is never stored in a name.\
Encoding hierarchy into a name freezes it, and it rots on the first change to the graph.

[`tools/skill-graph.mjs`](../tools/skill-graph.mjs) makes the edges load-bearing rather than narrative: every target must resolve, the graph must be acyclic, each composed primitive's construct family must actually appear in the skill's assets, and every bundle's `skills` entry must name a real skill.

Skills compose into operator-facing roles through bundles.

---

## Faults

- **The stub without a body, or a body without a stub.** One is a citation resolving to nothing; the other is a capability nothing routes to.
- **The level in the name.** Hierarchy encoded into a filename, which freezes a graph that is expected to change.
- **The dependency in prose.** One skill relying on another without a declared edge, so the graph and the bundles disagree about what must be installed together.
- **The host-bound family.** A family of capabilities that exists only for one coordination system, with no counterpart for work done without it.
- **The crowded family.** One family growing while whole kinds of capability hold none, so the set reads as complete to anyone who only meets the crowded kind.
- **The skill that should be a tool.** A deterministic procedure written for a model to follow, spending judgement on work a script would do identically and cheaper.

---

## Index

<!-- BEGIN GENERATED: entries. Run tools/generate-index.mjs; do not edit by hand. -->
| ID | Title | Status | Hydrate when |
|---|---|---|---|
| [K0](README.md) | Skills - executable capability, the stub-and-body split, and composition by edge | active | You are adding or invoking an executable capability, or you need to know why a skill is two files rather than one |
| [K3](K3-repo-audit.md) | repo-audit - code-grounded repo audit | active | You are auditing a project and must ground every claim in its source |
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
