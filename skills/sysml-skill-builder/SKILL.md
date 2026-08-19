---
id: K11
category: skill
title: sysml-skill-builder - build a SysML-anchored modelling skill (meta)
status: active
hydrate-when: You are building a new SysML-anchored modelling skill
name: sysml-skill-builder
description: "Use when authoring a new model-a-X primitive or a composed system skill for the SysML modelling catalogue. Build a SysML-anchored modelling skill WITH SysML - assemble the fixed scaffold (thin SKILL.md + the five assets: template, example, one advanced example, the authoring procedure as an action def, the well-formedness rules as constraint defs + one reference) and declare its prerequisite/composes edges. NOT for modelling a 'skill' as a SysML system. Read sysml-literacy first; pairs with sysml-skill-tester."
metadata:
  prerequisite: sysml-literacy
  composes: model-a-component, model-a-workflow
  model-asset: skill-anatomy.sysml, build-procedure.sysml
  role: meta-authoring
---

# sysml-skill-builder - build a SysML-anchored modelling skill

## When to use

- You are authoring a **new skill in the SysML modelling catalogue** - a `model-a-X` primitive (a new SysML
  construct family) or a composed **system** skill (an L2 like `model-an-arc`).
- You want it to match the catalogue's **fixed scaffold + edges + gate discipline**, not be a bespoke one-off.

Not for: modelling a "skill" as a SysML system for its own sake (this *builds* a skill, with SysML as an ingredient); authoring non-SysML skills (use the canonical Agent Skills format directly).

**Prerequisite:** `sysml-literacy`.\
**Composes:** `model-a-component` (a skill is modelled as a component) + `model-a-workflow` (its procedure is modelled as a workflow) - so this is a level-2 node in the catalogue graph.\
**Pairs with:** `sysml-skill-tester` (the acceptance bar - never ship a skill un-tested).

---

## Author it (the short path)

1. Read **[`references/building-a-skill.md`](references/building-a-skill.md)** - the full artifact grammar
   (fixed scaffold vs. parameters) and the build procedure.
2. Study the two dogfood models: **[`assets/skill-anatomy.sysml`](assets/skill-anatomy.sysml)** (a skill modelled
   as a `part def`) and **[`assets/build-procedure.sysml`](assets/build-procedure.sysml)** (the build procedure as
   an `action def`).
3. Follow the procedure: pick the construct -> **probe the idioms against the gate first** -> write the five-asset
   scaffold + SKILL.md -> dogfood (procedure as `action def`, rules as `constraint def`s) -> declare edges + keep
   the skill-graph lint green -> hand to `sysml-skill-tester`.

---

## Watch out

- **Probe idioms against the gate BEFORE writing prose.** Intuition is unreliable; the gate accepts some
  non-idiomatic forms and rejects expected ones. **Gate-verify every "X parses / won't parse" claim** (this is
  how the catalogue avoids shipping false claims).
- **Reserved/contextual keywords can't be names** - `state`, `from`, `accept`, `to`, `then`, `entry`, `subject`,
  `fork`, `render`, `typed`, `in`, `out`, `doc`, `verify`, `decide`, `for`, `part`, `ref`, `attribute`, `item`.
- **Dogfood the doctrine** - model the procedure as an `action def`, the rules as `constraint def`s; keep prose
  for judgment only.
- **The advanced asset = "the most valuable construct-specific extension"** (not always "what the skeleton can't
  express" - that framing fits behavioral constructs, not structural ones).
- **Declare edges; level is derived.** `prerequisite: sysml-literacy` always; `composes:` the primitives an
  L2/meta skill is built from. Never write a level into a name.

---

## Validate

Every `.sysml` asset must pass the gate (**`syntaxErrors == 0`**; see **[`sysml-literacy/references/validating-sysml.md`](../sysml-literacy/references/validating-sysml.md)**), the skill-graph lint must stay green, and the finished skill must pass **`sysml-skill-tester`** (the authoring-test bar).\
The decidable build rules are a checkable spec in **[`assets/well-formedness.sysml`](assets/well-formedness.sysml)**.\
(`compatibility`: requires a SysML v2 parser + the catalogue's `skill-graph` lint.)
