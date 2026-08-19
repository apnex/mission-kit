---
id: K10
category: skill
title: model-a-component - author a structural breakdown in SysML v2
status: active
hydrate-when: You are modelling a structural breakdown in SysML v2
name: model-a-component
description: "Use when modelling what a system is MADE OF: its components, the data they carry, what they own, and what they depend on (a service breakdown, a data model, a device, a subsystem). Author a component / structural breakdown in SysML v2 - part defs and item defs, attributes (data), refs (dependencies), parts (composition/ownership), multiplicity, and subtyping (:> / :>>). Read the sysml-literacy skill first; this is the authoring counterpart."
metadata:
  prerequisite: sysml-literacy
  models: component
---

# model-a-component - author a structural breakdown in SysML v2

## When to use

- You are modelling **static structure** - the things a system is made of, their data, what they own, and what
  they depend on (a service breakdown, a data/domain model, a device, a subsystem).
- You want the structure **enforceable + queryable** ("what depends on X?", "what does Y own?"), not prose.
- You are handing an agent or a tool a structural spec and want ownership vs. dependency unambiguous.

Not for: the *states* a thing moves through (that's `model-a-state-machine`); ordered *steps* it performs (that's `model-a-workflow`).\
A component is the *being-made-of*.

**Prerequisite:** `sysml-literacy` (you must be able to *read* a `part def` before you author one).

---

## Author it (the short path)

1. Copy **[`assets/template.sysml`](assets/template.sysml)** and rename the generic names.
2. Follow the six-step procedure in **[`references/components.md`](references/components.md)** - also modelled
   as a workflow you can read in **[`assets/authoring-procedure.sysml`](assets/authoring-procedure.sysml)**:
   list parts -> add attributes -> wire the structure (refs for dependencies, parts for composition) -> add
   subtypes -> check ownership (review) -> validate.
3. Compare against the worked examples: **[`assets/example.sysml`](assets/example.sysml)** (a service system -
   the ref-vs-part distinction) and **[`assets/specialization.sysml`](assets/specialization.sysml)** (subtyping
   `:>` + redefinition `:>>`).

The canonical shape (from the template):
```
part def Component {
    attribute name : String;       // data
    ref uses  : Dependency[0..*];  // a DEPENDENCY (points at, does not own)
    part parts : Subpart[*];       // COMPOSITION (owns)
}
```

---

## Watch out (see references for the full list)

- **The one distinction that matters: `ref` = dependency (points at), `part` = composition (owns).** Getting
  this wrong is the classic structure bug; the parser will not catch it.
- **Reserved/contextual keywords can't be names** - not `part`, `ref`, `attribute`, `item`, `state`, `from`,
  `accept`, `to`, `then`, `entry`, `subject`, `fork`, `render`, `typed`, `in`, `out`. (`typed`/`in` parse-fail.)
- **`:>` (specialize / is-a) vs `:>>` (redefine a value)** - a type relationship vs setting an attribute value.
- **`import ScalarValues::*;`** before `String`/`Boolean`/`Integer`; **multiplicity** (`[1]`/`[0..*]`/`[1..*]`)
  is a deliberate contract.
- A typo'd type IS flagged (a non-gated `Type 'X' is not defined` warning); the gate is *silent* on a missing
  `import ScalarValues::*;` and on a `ref`-vs-`part` mistake - scan for those two by hand.

---

## Validate

Authoring SysML is the error-prone direction - **always validate before you trust the model.** The discipline is shared across all model-a-X skills: **[`sysml-literacy/references/validating-sysml.md`](../sysml-literacy/references/validating-sysml.md)**.\
In short: run a SysML v2 parser, require **`syntaxErrors == 0`** (necessary, not sufficient), then scan the semantics by hand - the parser flags a typo'd type (a warning) but is *silent* on a missing `import ScalarValues::*;` and on a `ref`-vs-`part` mistake.\
The decidable rules are a checkable spec in **[`assets/well-formedness.sysml`](assets/well-formedness.sysml)**.\
(`compatibility`: requires a SysML v2 parser.\
Note: a `ref` edge pointing back at a type that is also `part`-owned trips this validator's spurious "circular containment" advisory - `example.sysml`'s `ref dependsOn : Service` does so; not gated, `syntaxErrors` stays 0.\
The gate conflating `ref`/`part` there is exactly the bug this skill prevents; see `validating-sysml.md`.)

---

## Note for skill authors

This skill follows the **model-X template** - the fixed scaffold a future `sysml-skill-builder` will codify: a thin `SKILL.md` (frontmatter `prerequisite: sysml-literacy` + `models: <construct>` - when - author-it - watch-out - validate - this note) + **five assets** - `template.sysml`, `example.sysml`, one focused *advanced* example (the construct's most valuable extension - here `specialization.sysml`), `authoring-procedure.sysml` (the procedure as an `action def`), `well-formedness.sysml` (the decidable rules as `constraint def`s) - + one `references/<construct>.md`, all linking the shared `validating-sysml` reference.\
A primitive declares `prerequisite: sysml-literacy` and composes nothing; "level" is derived from the edges.
