# Building a SysML-anchored modelling skill

This is the **artifact grammar**: how to build a new skill in the SysML modelling catalogue (a `model-a-X`
primitive, or a composed/meta skill). It builds a skill **with** SysML — it does not model "a skill" in SysML
for its own sake. What is **level-invariant is the DOCTRINE**, not the literal asset list: every skill keeps the
dogfood (its procedure as an `action def`, its rules as `constraint def`s, one reference, declared edges, and
every "X parses" claim gate-verified). The **asset set itself varies** — a primitive uses the fixed five below;
a composed/meta skill varies them (see "Composed + meta skills" below — this very skill is the proof).

## A skill is a composite ARTIFACT, not a model

The catalogue's modelling hierarchy levels the **subject** (L0 read → L1 construct → L2 system). A **skill** is
the *artifact* that packages a subject — prose (judgment) + SysML assets (structure/logic) + a reference +
declared edges. A skill's level = its subject's level; the artifact anatomy is the same at every level. See
**[`assets/skill-anatomy.sysml`](../assets/skill-anatomy.sysml)** — a skill modelled as a `part def` (built with
`model-a-component` idioms), which is why this skill `composes` `model-a-component` + `model-a-workflow`.

## The primitive scaffold (a `model-a-X`)

A `model-a-X` primitive skill is exactly:

- **`SKILL.md`** — thin, with fixed sections: YAML frontmatter (`name` = folder; `description` = what + when;
  `metadata.prerequisite: sysml-literacy`, `metadata.models: <construct>`) · **When to use** (with "Not for:"
  pointers to the sibling primitives) · **Author it** (copy template → follow the procedure → compare examples) ·
  a canonical-shape code block · **Watch out** · **Validate** (link the shared reference, don't repeat it) ·
  **Note for skill authors**.
- **Five assets**: `template.sysml` (skeleton) · `example.sysml` (worked) · **one advanced** example (the most
  valuable construct-specific extension) · `authoring-procedure.sysml` (the procedure as an `action def`) ·
  `well-formedness.sysml` (the decidable rules as `constraint def`s).
- **One** `references/<construct>.md` — Anatomy · the-one-distinction-that-matters · the authoring procedure ·
  the advanced feature · Patterns · Pitfalls · Scope.

All assets pass the gate (`syntaxErrors == 0`); everything links the shared
`sysml-literacy/references/validating-sysml.md`.

## What varies (the parameters)

| Parameter | Example (state-machine / workflow / component) |
|---|---|
| `construct` + `def` keyword | `state def` / `action def` / `part def` |
| unit + core relation | state + transition / action + succession / part + ref·part |
| the one distinction that matters | reopenable terminals / effect-is-a-workflow / **ref vs part** |
| the advanced asset | `guarded.sysml` / `cascade.sysml` / `specialization.sysml` |
| deferred scope | nested states / fork-join / ports+connections |
| cross-skill edges | (FSM effect → workflow), … |

Only `prerequisite` + `composes` are **lint-checked** edges. **Construct-level cross-skill links** (an FSM
effect → workflow, a requirement's satisfy/verify) are **prose/reference-only** — name them in the construct
reference so they aren't silently dropped; they are not enforced by the skill-graph lint.

The **advanced asset** is "the most valuable construct-specific extension" — for a *behavioral* construct that is
often "a feature the bare skeleton can't express" (guards, recursion); for a *structural* construct it is a
deepening of the same skeleton (subtyping). Don't force the "can't express" framing. **Heuristic for the
advanced asset:** the single extension a real user reaches for *next* after the skeleton (decomposition for a
requirement, allocation for ports). **Heuristic for the review step:** it checks the one-distinction-that-matters
is honored (ownership for component, terminals for FSM, testability for a requirement). These two are
author-judgment slots — give each a one-line rationale in the skill.

## Composed + meta skills vary the asset set

The five-asset scaffold is for **primitives**. A composed **system** skill (an L2 like `model-an-arc`) or a
**meta** skill (like `sysml-skill-builder`/`sysml-skill-tester`) keeps the **doctrine** but varies the assets:

- **Keep (the invariant):** the procedure as an `action def`, the rules as `constraint def`s, one
  `references/<topic>.md`, declared `prerequisite`/`composes` edges, every "X parses" claim gate-verified, and
  the **review-before-handoff** step in the procedure.
- **Vary:** usually no `template.sysml`/`example.sysml` (nothing single-construct to template) — instead ship the
  dogfood models the skill is *about* (this skill's `skill-anatomy.sysml` `part def` + `build-procedure.sysml`
  `action def`). A composed skill's central asset is the **composition** itself.
- **Frontmatter:** a primitive declares `metadata.models: <construct>`; a meta/L2 skill uses `role:` /
  `composes:` / `see-also:` and may **omit** the "Note for skill authors" section (it is not a template for
  others). `composes:` makes it a derived L2 in the skill-graph (this skill composes `model-a-component` +
  `model-a-workflow`).

## The build procedure (see `assets/build-procedure.sysml`)

1. **Pick the construct** — one SysML construct family.
2. **Probe the idioms FIRST** — write tiny probes, run them through the gate, learn the gate-true forms. Intuition
   is unreliable (the gate accepts non-idiomatic forms and rejects expected ones). **Reserved words that can't be
   feature names** — the catalogue GATE's set, every one verified to fail: `state` `from` `accept` `to` `then`
   `entry` `subject` `fork` `render` `typed` `in` `out` `doc` `verify` `decide` `for` `part` `ref` `attribute`
   `item` `disjoint` `alias`. A new-domain skill will reach for vocabulary the existing examples never exercised
   (the arc example dodged every reserved word by luck of vocabulary, not design) — so **re-probe each
   feature/role name against the gate**. This set is *validator-specific* (e.g. `render`/`decide` may not be reserved in every conformant SysML
   v2 parser) and *not exhaustive* for new constructs — so **probe, don't trust the list**; the gate is the authority.
3. **Write the assets** — the five-asset scaffold + the SKILL.md sections.
4. **Dogfood** — model the skill's own *procedure* as an `action def` and its *well-formedness* rules as
   `constraint def`s. Prose for judgment, SysML for structure/logic.
5. **Declare edges + keep the lint green** — `prerequisite: sysml-literacy` (+ `composes:` the primitives an L2/meta
   skill is built from). Run `tools/skill-graph.mjs`; "level" is derived, never named.
6. **Review (the mandatory gate)** — before handoff, self-audit: scaffold complete? edges resolve? every
   "X parses" claim gate-verified? This is the **penultimate review step every procedure must carry** — the
   structural skills' `checkOwnership`, the behavioral skills' `checkTerminals`/`checkEnds`, this skill's
   `reviewScaffold`. (The dogfood `build-procedure.sysml` honors it; so must yours.)
7. **Hand to `sysml-skill-tester`** — the acceptance bar (author a fresh model from the skill alone → gate →
   audit → gate-verify every claim). Do NOT ship un-tested.

## Well-formedness (see `assets/well-formedness.sysml`)

A well-formed skill: scaffold complete · edges declared + resolving · procedure-as-`action def` + rules-as-`constraint def`
· **the procedure carries a review-before-handoff step** · every asset `syntaxErrors==0` · every "X parses" prose
claim gate-verified. These are the contract `sysml-skill-tester` checks.
