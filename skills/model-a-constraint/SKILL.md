---
id: K14
category: skill
title: model-a-constraint - author a reusable boolean rule (constraint def) in SysML v2
status: active
name: model-a-constraint
description: "Author a constraint (a reusable boolean rule) in SysML v2 — constraint defs with in parameters and a boolean expression (== and or not implies xor), asserted on a part's attributes (assert constraint), and composed into higher-level invariants. Use when modelling a CHECKABLE rule over data — an invariant, a bound, a validity condition — as a spec, distinct from prose intent (a requirement). Read the sysml-literacy skill first; this is the authoring counterpart."
metadata:
  prerequisite: sysml-literacy
  models: constraint
---

# model-a-constraint — author a constraint in SysML v2

## When to use

- You are modelling a **checkable rule over data** — an invariant, a bound, a validity/consistency
  condition (a value in range, a positive quantity, "empty implies charge is zero").
- You want the rule **reusable + composable + queryable** ("what asserts this rule?", "what governs this
  attribute?"), authored once and asserted on every part it governs — not restated in prose.
- You are handing an agent or a tool a **spec** and want the check unambiguous and decidable.

Not for: *prose intent* about what is wanted (that's a requirement — `satisfy`/`verify`, not yet authored;
a constraint can be its checkable backing); static structure (that's `model-a-component`); the *states* a
thing moves through (that's `model-a-state-machine`); ordered *steps* (that's `model-a-workflow`). A
constraint is the *must-hold rule over the data*.

**Prerequisite:** `sysml-literacy` (you must be able to *read* a `constraint def` before you author one).

## Author it (the short path)

1. Copy **[`assets/template.sysml`](assets/template.sysml)** and rename the generic names.
2. Follow the six-step procedure in **[`references/constraints.md`](references/constraints.md)** — also
   modelled as a workflow you can read in **[`assets/authoring-procedure.sysml`](assets/authoring-procedure.sysml)**:
   name the rule → declare `in` parameters → write the boolean expression → assert it on a part's
   attributes → check it is assertable (review) → validate.
3. Compare against the worked examples: **[`assets/example.sysml`](assets/example.sysml)** (battery-pack
   invariants — reusable rules asserted on a part) and **[`assets/composition.sysml`](assets/composition.sysml)**
   (composing two atoms into a named invariant).

The canonical shape (from the template):

```
constraint def Rule {
    in x : Integer;  in cap : Integer;       // parameters
    x > 0 and x <= cap                       // ONE boolean expression (== not =)
}
part def Subject {
    attribute amount : Integer;  attribute limit : Integer;
    assert constraint amountValid : Rule {   // ASSERT on the part's attributes
        in x = amount;  in cap = limit;      // bind each parameter
    }
}
```

## Watch out (see references for the full list)

- **The one distinction that matters: a constraint is a CHECKABLE boolean SPEC over data — not prose
  intent (a requirement) and not a doc/pitfall.** If you can't write it as a boolean over named
  parameters, it is a requirement, not a constraint. This is the spec/test substrate in miniature.
- **The gate PARSES constraints; it does NOT evaluate them.** `syntaxErrors==0` says it is well-formed
  SysML, not that it holds — a constraint here is a *spec*, exactly like every `well-formedness.sysml`.
- **Equality is `==`, never `=`** — `x = 0` in a body **parse-FAILS** (`=` is binding, not comparison).
- **The gate accepts a body-less constraint** — `constraint def C { in x : Integer; }` (no boolean
  expression) parses clean but asserts nothing; the silent bug. Scan for a missing body.
- **Reserved/contextual keywords can't be names** — not `in`, `attribute`, `subject`, `state`, `from`,
  `accept`, `to`, `then`, `entry`, `fork`, `render`, `typed`, `out`, `doc`, `verify`, `decide`, `for`,
  `part`, `ref`, `item`. (`in`/`attribute` parse-fail as parameter names; **lowercase** `subject` parse-fails
  as a pin — the capitalized type name `Subject` in the examples is a distinct token and is fine.)
- **Prefer a named `constraint def` over an inline anonymous assert** — both parse, but only the named def
  is reusable + composable. Compose atoms into invariants (`assets/composition.sysml`).

## Validate

Authoring SysML is the error-prone direction — **always validate before you trust the model.** The
discipline is shared across all model-a-X skills: **[`sysml-literacy/references/validating-sysml.md`](../sysml-literacy/references/validating-sysml.md)**.
In short: run a SysML v2 parser, require **`syntaxErrors == 0`** (necessary, not sufficient), then scan the
semantics by hand — the parser will *not* catch a body-less rule, an unused/unbound parameter, an
always-false rule, or a missing `import ScalarValues::*;`, and it will *not* evaluate whether the rule
holds (it is parse-only). The decidable constraint rules are written as a checkable spec in
**[`assets/well-formedness.sysml`](assets/well-formedness.sysml)** — which also dogfoods the construct (the
rules *about* constraints are themselves `constraint def`s). (`compatibility`: requires a SysML v2 parser to
validate; it parses but does not evaluate constraints.)

## Note for skill authors

This skill follows the **model-X template** — the fixed scaffold `sysml-skill-builder` codifies: a thin
`SKILL.md` (frontmatter `prerequisite: sysml-literacy` + `models: <construct>` · when · author-it ·
watch-out · validate · this note) + **five assets** — `template.sysml`, `example.sysml`, one focused
*advanced* example (the construct's most valuable extension — here `composition.sysml`),
`authoring-procedure.sysml` (the procedure as an `action def`, its penultimate step a REVIEW before
validate), `well-formedness.sysml` (the decidable rules as `constraint def`s) — + one
`references/<construct>.md`, all linking the shared `validating-sysml` reference. A primitive declares
`prerequisite: sysml-literacy` and composes nothing; "level" is derived from the edges. The advanced-asset
slot is composition (the extension a real user reaches for next — a reusable spec library); the review-step
slot (`checkAssertable`) checks the one-distinction-that-matters: that the rule is a checkable boolean spec,
not prose. **Gate-verify every "X parses" claim** before you write it (every claim here was probed against
the gate).
