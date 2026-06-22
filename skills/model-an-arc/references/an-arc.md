# Modelling an arc (a composed system) in SysML v2

An **arc** is a staged-work methodology modelled as a *system*: a tree of **rungs** climbing one **summit**,
each rung carrying a lifecycle, a place in a dependency order, and classification on independent axes — held
honest by a few invariants. It is the worked **L2** of the catalogue: it does not introduce a new SysML
construct, it **composes** the six L1 primitives into one model. Read `sysml-literacy` first, and ideally the
six primitives; this skill shows how they fit together. (To *operate* a running arc as an engine — verbs,
transitions, deltas — that is the `arc-lifecycle` skill, the operate facet; this skill is the *model* facet.)

## The composition (see `assets/arc-model.sysml`)

The whole arc model is one gate-valid file; each primitive supplies one construct family:

| Ingredient of an arc | Primitive | Construct in `arc-model.sysml` |
|---|---|---|
| Summit / Arc / Rung + reified cross-arc edges (BuildsOn, ReCashes) | `model-a-component` | `part def` (+ `ref`/`part`) |
| payoff / tier / risk — independent axes | `model-a-classification` | `enum def` carried as attributes |
| `dependsOn` build-order DAG over rungs | `model-a-dependency-graph` | a self-`ref` edge `Rung[0..*]` |
| anti-amnesia, buildsOn-banked, acyclic-deps | `model-a-constraint` | `constraint def` |
| the lifecycle — reopenable terminals, revive through `candidate` | `model-a-state-machine` | `state def` |
| the park/cut cascade — co-park payoff-dependents | `model-a-workflow` | `action def` (recursion + `for` + `decide`) |

**The two-axes discipline shows up twice:** a rung's *dependency* (`dependsOn`, ordering) is orthogonal to its
*payoff* (the deferral economics, a classification axis) — park/cut keys off payoff, not dependency. Modelling
them as a dependency-graph edge and a classification enum respectively keeps them from being conflated.

## How to author one (see `assets/composition-procedure.sysml`)

The order generalizes to **any** composed system: **entities → axes → relations → lifecycle → behavior →
invariants → review → validate**. The arc nouns below are one instantiation — for a different L2 (an
incident-response system, a release train) keep the *order*, swap the nouns.

1. **Entities** — `part def Summit`, `Arc`, `Rung`, and the reified cross-arc edges (`BuildsOn`, `ReCashes`).
2. **Axes** — the `enum def`s (payoff/tier/risk) carried as `Rung` attributes.
3. **Dependencies** — the `ref dependsOn : Rung[0..*]` DAG (acyclic — the author-owned check).
4. **Lifecycle** — the `state def` with reopenable terminals, every revive routed back through `candidate`.
5. **Cascade** — the `action def` park cascade (recursion + `for` + `decide`), the effect a transition can't carry.
6. **Invariants** — the `constraint def`s (anti-amnesia, buildsOn-banked, acyclic).
7. **Review (the gate)** — are all six primitives present? does the composes-vs-model lint pass? (next section)
8. **Validate** — `syntaxErrors == 0`, then the composes-vs-model gate.

## The composes-vs-model gate (turns the claim into a test)

A composed skill *declares* `composes:` in its frontmatter. The catalogue's `tools/skill-graph.mjs` lint
checks that declaration **against the model**: for each composed primitive, the primitive's construct family
must actually appear in the skill's assets (e.g. `composes: model-a-constraint` ⟺ a `constraint def` is
present). A composes edge with no backing construct **fails the lint** — so the composition can't be a paper
claim. (This is *twin-parity*: a declared edge and the model it claims must agree — the same generate-and-gate
discipline the catalogue uses for its other twins.) **Caveat:** the gate checks *presence of the construct
family*, not its meaning — the dependency-graph check matches any multi-valued `ref`, so confirm by hand the
edge is a genuine same-type ordering edge (acyclicity is author-owned regardless).

## Patterns

- **Compose, don't reinvent.** Each part of the arc is a primitive you already know; the skill's value is the
  *assembly* + the invariants that tie them together.
- **Reified edges for cross-arc relations.** `buildsOn`/`reCashes` are first-class `part def`s (not bare
  refs), so they can carry their own rule (buildsOn rests on shipped+banked).
- **Model facet vs operate facet.** This skill models the arc; `arc-lifecycle` operates a live one. Keep them
  distinct — one is SysML, the other is a runtime engine.

## Pitfalls (gate-learned)

- **The reified edges + `Arc`-owns-`Rung` containment trip a spurious "circular containment" advisory**
  (error-severity, NOT gated — `syntaxErrors` stays 0). Same false positive `model-a-component` documents; do
  not distort the model to silence it.
- **Reserved words** — `subject` (the procedure uses `domain`), `state`/`fork` etc.; see `validating-sysml.md`.
- **Acyclicity + anti-amnesia are author-owned** — the gate parses them, the `constraint def`s *spec* them, but
  nothing auto-evaluates them; they are the composes-vs-model review's job.

## Scope — deferred

- **A larger model-definition library** (reusable archetypes systems compose from) — `model-a-library` territory.
- **The runtime engine** (verbs, deltas, the gate that enforces these invariants on write) — `arc-lifecycle`.
