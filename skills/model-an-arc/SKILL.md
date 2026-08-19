---
id: K16
category: skill
title: model-an-arc - model an arc as a composed L2 system (composes the six primitives)
status: active
hydrate-when: You are modelling a whole arc as a composed system rather than a single construct
name: model-an-arc
description: "Use when modelling an arc/roadmap/backlog as a system, or as the worked example of composing primitives into an L2. Model an arc - a staged-work methodology - as a COMPOSED system in SysML v2, by composing the six L1 primitives: components (summit/arc/rung), classification axes (payoff/tier/risk), a dependency-graph (dependsOn DAG), constraints (anti-amnesia, buildsOn-banked), a state machine (the reopenable lifecycle), and a workflow (the park cascade). Read sysml-literacy + the model-a-X primitives first; the operate facet is the arc-lifecycle skill."
metadata:
  prerequisite: sysml-literacy
  composes: model-a-state-machine, model-a-workflow, model-a-component, model-a-dependency-graph, model-a-constraint, model-a-classification
  model-asset: arc-model.sysml
  role: composed-system (L2)
  see-also: arc-lifecycle
---

# model-an-arc - model an arc as a composed system

## When to use

- You are modelling an **arc** - a staged-work methodology (a roadmap, a backlog, a migration plan) as a
  *system*: summits, arcs, rungs, a lifecycle, a dependency order, classification axes, and invariants.
- You want the **worked example of composing primitives into an L2** - how the six `model-a-X` primitives fit
  together into one coherent model (and how the composition is *gated*, not just asserted).

Not for: *operating* a live arc (verbs, transitions, deltas, the FSM-gated engine) - that's `arc-lifecycle`, the **operate facet**; this is the **model facet** (read/author the arc model in SysML).\
Not for a single construct - reach for the relevant `model-a-X` primitive.

**Prerequisite:** `sysml-literacy`.\
**Composes** the six L1 primitives (so this is an L2 in the skill graph - the composes-vs-model lint checks each one's construct actually appears in the model).\
**See also:** `arc-lifecycle` (operate the running engine).

---

## Read / author it (the short path)

1. Read **[`references/an-arc.md`](references/an-arc.md)** - the composition table (which primitive supplies
   which part), the authoring procedure, and the composes-vs-model gate.
2. Study the central asset, **[`assets/arc-model.sysml`](assets/arc-model.sysml)** - the whole arc methodology
   in one gate-valid model, all six primitives composed. The composition *is* the deliverable.
3. Author your own by following **[`assets/composition-procedure.sysml`](assets/composition-procedure.sysml)**:
   entities -> axes -> dependencies -> lifecycle -> cascade -> invariants -> review (composes-vs-model) -> validate.

---

## Watch out

- **Compose the primitives - don't reinvent.** Each part is a primitive you know; the value is the assembly +
  the invariants. The two-axes discipline recurs: a rung's `dependsOn` (ordering) is orthogonal to its
  `payoff` (deferral economics) - a dependency-graph edge vs a classification enum.
- **The composes-vs-model gate is real.** Your `composes:` frontmatter must match the model: each composed
  primitive's construct family must appear in the assets, or `tools/skill-graph.mjs` fails. Composition is a
  test, not a paper claim.
- **The reified edges + Arc-owns-Rung trip the spurious circular-containment advisory** (error-severity, NOT
  gated; `syntaxErrors` stays 0) - a known false positive (see `validating-sysml.md`); don't distort the model.
- **Model facet, not operate facet.** This is the SysML model of an arc; `arc-lifecycle` is the runtime engine.

---

## Validate

`syntaxErrors == 0` on every asset (see **[`sysml-literacy/references/validating-sysml.md`](../sysml-literacy/references/validating-sysml.md)**), the **composes-vs-model lint green** (`tools/skill-graph.mjs` - every composed primitive's construct present), and the skill passes `sysml-skill-tester`.\
The decidable arc-model rules are a checkable spec in **[`assets/well-formedness.sysml`](assets/well-formedness.sysml)**.\
(`compatibility`: requires a SysML v2 parser
+ the catalogue's `skill-graph` lint with the composes-vs-model check.)

---

## Note for skill authors (this is the L2 template)

This is the first **composed (L2)** skill - the meta/L2 variant of the model-X grammar (`sysml-skill-builder`): it keeps the doctrine (procedure as an `action def` with a review step, rules as `constraint def`s, one reference, declared edges, gate-verified claims) but **varies the asset set** - there is no `template`/`example` pair; the **composition itself** (`arc-model.sysml`) is the central asset, and the frontmatter uses `composes:`/`role:`/`see-also:` instead of `models:`.\
"Level" is derived: `composes:` the six primitives => L2.
