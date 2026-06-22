# Authoring a dependency graph in SysML v2

A dependency graph models **topology**: a set of nodes of one kind, joined by directed edges that mean
**order / precedence**, where the whole graph is **acyclic** (a DAG). In SysML v2 the node kind is a
**`part def`** and each edge is a **`ref`** feature pointing back at that same node kind (`ref dependsOn :
Node[0..*]`). Read `sysml-literacy` first; this is the *authoring* counterpart. (For the *states* a thing
moves through that's `model-a-state-machine`; for *ordered steps it performs* that's `model-a-workflow`. A
dependency graph is the *who-must-come-after-whom* over a population of peers.)

## The one distinction that matters: the ref-edge DAG *is* the model

This is the dependency-graph identity — and where it diverges sharply from its closest sibling:

- **In `model-a-component`, `ref` is ONE of several structural relations** (it co-exists with `part`
  composition, attributes, item flows); the distinction taught there is `ref` (depends-on) **vs** `part`
  (owns). A component is heterogeneous: many node kinds, many relation kinds.
- **HERE the `ref`-edge over a SINGLE node kind IS the whole model.** There is one `part def` (the node) and
  one self-referential `ref` (the edge). The subject is the **graph topology** — the shape of build order,
  module dependencies, a task graph — not what anything is made of.
- **A dependency edge means ORDER / precedence, and the graph must be ACYCLIC.** `b dependsOn a` means
  "b must come after a." Follow the edges and you must never return to where you started — that is the DAG
  invariant. This is **orthogonal to ownership/composition** (no node owns another; they are peers) and
  **orthogonal to any state machine** (a node has no lifecycle here — only a position in the order).

Get this right first: do not reach for `part`, and do not model a container that *owns* the nodes (see the
container pitfall below). The nodes are peers; the edges are the point.

## Anatomy (see `assets/template.sysml`)

```
part def Node {
    attribute name : String;        // data the node carries
    ref dependsOn : Node[0..*];     // the DEPENDENCY EDGE: this node comes AFTER each target. Acyclic.
}

part a : Node;                      // a root — depends on nothing
part b : Node { ref dependsOn :>> dependsOn = (a); }      // b after a
part c : Node { ref dependsOn :>> dependsOn = (a, b); }   // c after a and b (a fan-in)
```
- **`part def Node`** — the one node kind (the graph's schema). Give it a `name`/id attribute.
- **`ref dependsOn : Node[0..*]`** — the self-edge. `ref` (a node points at peers it does **not** own),
  `[0..*]` (a root depends on zero; multiplicity is the edge's contract).
- **The wired graph** — present the actual topology as **node instances** (`part a : Node;`) whose out-edges
  are redefined with **`ref dependsOn :>> dependsOn = (x, y);`** (a tuple of targets). A node with no
  `dependsOn` (or `= ()`) is a **root**; a node nothing depends on is a **sink**.
- **`:>>`** redefines the inherited `dependsOn` value on that instance — the same redefinition idiom
  `model-a-component` uses for attribute values, applied here to the edge set.

## The authoring procedure

Also modelled as a workflow you can read — **[`assets/authoring-procedure.sysml`](../assets/authoring-procedure.sysml)**
(an `action def`; dogfood: read it with `sysml-literacy`, then follow it).

1. **List the nodes** — the things that depend on each other (build tasks, modules, packages).
2. **Define the node kind** — ONE `part def` with `ref dependsOn : Node[0..*]`.
3. **Wire the edges** — node instances, each with `ref dependsOn :>> dependsOn = (…)`.
4. **Add edge kinds** (optional) — distinguish hard vs soft deps, or add layers (the advanced form).
5. **Check acyclic (review)** — follow `dependsOn` from each node; does any path return to its origin? does
   every edge resolve to a declared node? is the multiplicity `[0..*]`? (cross-walks to
   `assets/well-formedness.sysml`.) **This is the mandatory review step — cycles are NOT a parse error.**
6. **Validate** — see `sysml-literacy/references/validating-sysml.md`.

## The advanced feature — layered graphs (see `assets/layered.sysml`)

The single extension a real user reaches for next: the plain DAG says "X after Y"; a **layered** graph adds a
directional **invariant** on the edges. Each node sits in a `Layer` (an `enum`-typed attribute, pinned per
subtype with `:>> layer = Layer::…`), and an edge may only point at the **same or a lower** layer — the
"depend downward only" architecture rule. It is still **one node kind + a self `ref` edge**; layering is a
refinement of the same skeleton, expressed as the `EdgesPointDownward` constraint (a hand-scan, not a parse
check). (The alternative advanced cut — distinguishing edge **kinds** via two refs, `ref hardDeps` /
`ref softDeps`, or a `Strength` enum — is mentioned in Patterns; layering is the more valuable extension
because it adds a *checkable invariant*, not just a label.)

## Patterns

- **One node kind, one self-edge — resist adding more.** If you find yourself reaching for `part`
  composition or a second node kind, you may actually be modelling a *component* (use `model-a-component`).
  A dependency graph stays minimal on purpose: the topology is the whole content.
- **Roots and sinks read off the edges.** A node with no `dependsOn` is a root (a starting point); a node no
  other node names is a sink (an end). Topological order = repeatedly take a node whose deps are all done.
- **Edge kinds by a second ref or an enum.** Hard vs soft / required vs optional deps: either two edge
  features (`ref hardDeps : Node[0..*]; ref softDeps : Node[0..*];`) or one edge plus a strength attribute.
  Both gate-clean; pick the one your queries need.
- **Layer to encode "depend downward".** When the graph is an architecture, the layered form turns the
  informal rule into a checkable constraint (`EdgesPointDownward`).

## Pitfalls (gate-learned)

- **The container + self-ref trips a spurious "circular containment" advisory.** Wrapping the nodes in a
  `part def Graph { part nodes : Node[1..*]; }` while `Node` also has `ref dependsOn : Node` makes this
  validator report `Circular containment: Graph -> Node -> Graph` — **error-severity but NOT gated**
  (`syntaxErrors` stays 0). Verified: the *self-ref alone* (no container) is advisory-clean; adding the
  part-owning container is what trips it (the analyzer conflates the `ref` edge with the `part`
  containment — exactly the `ref`/`part` conflation `model-a-component` warns about). So **prefer the
  peer-instance form** (node instances, no owning container); it is advisory-clean. If you must own the
  nodes, the advisory is a known false positive — do not distort the model. Documented inline in
  `assets/example.sysml`; see `model-a-component/assets/example.sysml` for the same note.
- **Reserved / contextual keywords can't be edge names — but in two distinct ways (both gate-verified).**
  (a) `to`, `from`, `in`, `out`, `for`, `then`, `ref`, `accept`, `subject`, `fork`, `render`, `typed` fail
  **even as a bare `ref` decl** — `ref to : Node;` is a syntax error (`no viable alternative at input 'refto'`).
  (b) `part`, `attribute`, `item`, `state` **parse as a bare `ref` decl** (`ref part : Node[0..*];` is
  `syntaxErrors=0`) but **break the `:>>` wiring idiom** this skill uses — `ref part :>> part = (a)` →
  `mismatched input 'part'` — so you still cannot use them as edge names in practice. Safe domain edge names
  that gate-verify clean: `dependsOn`, `requires`, `needs`, `before`, `hardDeps`, `softDeps`. The list is
  gate-derived and NOT exhaustive vs a normative parser — **probe, don't trust the list**.
- **The gate does NOT check acyclicity.** A cycle (`a dependsOn b; b dependsOn a;`) parses with
  `syntaxErrors == 0`. Acyclicity is **deferred from the gate** — it is a hand-scan or a `constraint def`
  (`IsAcyclic` in `well-formedness.sysml`), never a parse error. This is the single most important
  semantic check the author owns.
- **`import ScalarValues::*;` before `String`** — the gate does NOT warn if you forget it (the name
  resolves to nothing silently). Same blind spot as `model-a-component`.
- **`:>>` (redefine the edge value) vs `:>` (specialize the node kind).** Use `:>` to make `AppModule :>
  Module` (a node subtype); use `:>>` to set an instance's `dependsOn` edge set. Don't swap them.

## Scope — deferred, but exists (add after the skeleton validates)

- **Cycle DETECTION** — checking acyclicity is a hand-scan / a `constraint def` (`IsAcyclic`), **not a parse
  error**; the gate is silent on cycles. A future linter could evaluate it; out of scope here.
- **Weighted / richly-typed edges** beyond hard/soft or a layer attribute — model the plain edge first;
  layer weights/costs later.
- **Transitive closure / reachability queries** ("everything X depends on, directly or not") — a query over
  the topology, not part of the structural model; deferred.
