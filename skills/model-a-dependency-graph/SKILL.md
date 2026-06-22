---
name: model-a-dependency-graph
description: "Author a dependency graph (a DAG of typed nodes) in SysML v2 — one part def for the node kind joined to itself by a `ref` edge that means order/precedence, with the graph kept acyclic. Use when the graph TOPOLOGY is the subject: a build/task graph, module or package dependencies, a precedence order. The ref-edge DAG over a single node kind IS the whole model — distinct from model-a-component, where ref is just one structural relation among ownership and data. Read the sysml-literacy skill first; this is the authoring counterpart."
metadata:
  prerequisite: sysml-literacy
  models: dependency-graph
---

# model-a-dependency-graph — author a DAG in SysML v2

## When to use

- You are modelling **topology** — a set of like nodes joined by **precedence** edges, where the shape of
  the graph is the point (a build/task graph, module/package dependencies, a "must-come-after" order).
- You want the order **enforceable + queryable** ("what depends on X?", "what are the roots?", "is it
  acyclic?"), not prose.
- You are handing an agent or a tool a dependency spec and want order vs. ownership unambiguous.

Not for: what a system is **made of** (heterogeneous parts, ownership, data — that's `model-a-component`, a
`part def` with `part`/`ref`/`attribute`); the *states* a thing moves through (that's `model-a-state-machine`);
ordered *steps it performs* (that's `model-a-workflow`). A dependency graph is the *who-must-come-after-whom*
over a population of peers — one node kind, one edge kind.

**Prerequisite:** `sysml-literacy` (you must be able to *read* a `part def` and a `ref` before you author one).

## Author it (the short path)

1. Copy **[`assets/template.sysml`](assets/template.sysml)** and rename the generic names (`Node`, `dependsOn`).
2. Follow the six-step procedure in **[`references/dependency-graphs.md`](references/dependency-graphs.md)** —
   also modelled as a workflow you can read in **[`assets/authoring-procedure.sysml`](assets/authoring-procedure.sysml)**:
   list nodes → define the node kind → wire the edges → (optional) add edge kinds/layers → check acyclic
   (review) → validate.
3. Compare against the worked examples: **[`assets/example.sysml`](assets/example.sysml)** (a build/task DAG —
   nodes wired into an order) and **[`assets/layered.sysml`](assets/layered.sysml)** (a layered graph — the
   "depend downward only" invariant).

The canonical shape (from the template):

```
part def Node {
    attribute name : String;        // data the node carries
    ref dependsOn : Node[0..*];     // the DEPENDENCY EDGE: this node comes AFTER each target. Acyclic.
}

part a : Node;                                            // a root — depends on nothing
part b : Node { ref dependsOn :>> dependsOn = (a); }      // b after a
part c : Node { ref dependsOn :>> dependsOn = (a, b); }   // c after a and b
```

## Watch out (see references for the full list)

- **The one distinction that matters: the `ref`-edge DAG over a SINGLE node kind IS the model.** Unlike
  `model-a-component` (where `ref` is one relation among `part`/`attribute`), here there is one `part def`
  and one self-`ref` edge meaning **order/precedence**; the graph must be **acyclic**. Don't reach for `part`
  composition and don't model a container that owns the nodes — the nodes are peers, the edges are the point.
- **The gate does NOT check acyclicity.** A cycle parses (`syntaxErrors == 0`). Acyclicity is a hand-scan /
  a `constraint def` (`IsAcyclic`), never a parse error — the chief semantic check the author owns.
- **A container + self-ref trips a spurious "circular containment" advisory** (`Graph -> Node -> Graph`) —
  error-severity but NOT gated. Verified: the self-ref alone is clean; the part-owning container trips it.
  Prefer peer instances; if you must own the nodes it's a known false positive. Documented inline in
  `assets/example.sysml` (mirrors `model-a-component/assets/example.sysml`).
- **Reserved/contextual keywords can't be edge names** — not `to`, `from`, `in`, `out`, `for`, `then`,
  `part`, `ref`, `attribute`, `item`, `state`, `accept`, `subject`, `fork`, `render`, `typed`. (`ref to :
  Node;` parse-fails.) Gate-clean edge names: `dependsOn`, `requires`, `needs`, `before`, `hardDeps`/`softDeps`.
- **`import ScalarValues::*;` before `String`**; **`:>>`** redefines an instance's edge set, **`:>`**
  specializes the node kind (layered subtypes) — don't swap them.

## Validate

Authoring SysML is the error-prone direction — **always validate before you trust the model.** The discipline
is shared across all model-a-X skills: **[`sysml-literacy/references/validating-sysml.md`](../sysml-literacy/references/validating-sysml.md)**.
In short: run a SysML v2 parser, require **`syntaxErrors == 0`** (necessary, not sufficient), then scan the
semantics by hand — the parser is **silent on cycles** (acyclicity is the author's check), on a missing
`import ScalarValues::*;`, and on an edge that should/shouldn't be `ref`. The decidable rules are a checkable
spec in **[`assets/well-formedness.sysml`](assets/well-formedness.sysml)** (`IsAcyclic`, `EveryEdgeResolves`,
`EdgeMultiplicitySane`, `EdgesPointDownward`). (`compatibility`: requires a SysML v2 parser. Note: a
`part`-owned container over a self-`ref` node kind trips this validator's spurious "circular containment"
advisory — not gated, `syntaxErrors` stays 0; see `assets/example.sysml` and `validating-sysml.md`.)

## Note for skill authors

This skill follows the **model-X template** — the fixed scaffold codified by `sysml-skill-builder`: a thin
`SKILL.md` (frontmatter `prerequisite: sysml-literacy` + `models: <construct>` · when · author-it ·
watch-out · validate · this note) + **five assets** — `template.sysml`, `example.sysml`, one focused
*advanced* example (the construct's most valuable extension — here `layered.sysml`, which adds a *checkable
invariant*, not just a label), `authoring-procedure.sysml` (the procedure as an `action def`, whose
penultimate step is the `checkAcyclic` review-before-validate), `well-formedness.sysml` (the decidable rules
as `constraint def`s) — + one `references/<construct>.md`, all linking the shared `validating-sysml`
reference. A primitive declares `prerequisite: sysml-literacy` and composes nothing; "level" is derived from
the edges.
