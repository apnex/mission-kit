---
name: model-a-workflow
description: "Use when modelling what something DOES as ordered steps (a pipeline, a procedure, a cascade, an algorithm, a transition's effect), not the states it is in. Author a workflow (an ordered activity / process) in SysML v2 - actions, successions (then), in/out pins, decisions (decide/if), and recursion. Read the sysml-literacy skill first; this is the authoring counterpart, and the home for a state machine's effects."
metadata:
  prerequisite: sysml-literacy
  models: workflow
---

# model-a-workflow - author a workflow in SysML v2

## When to use

- You are modelling an **ordered activity** - the steps a process performs and their order (a deploy
  pipeline, a build, an algorithm, an approval flow, a cascade).
- You need **branching** (do X or Y on a condition), **iteration** (do this for each of those), or
  **recursion** (sweep a tree / cascade into dependents).
- You are modelling **what a state machine transition does** - the *effect*. State machines defer effects
  here (an effect is behaviour, not a state).

Not for: the *states* a thing is in and the events between them (that's `model-a-state-machine` - a `state def`); or static structure with no behaviour (that's `model-a-component` - a `part def`).

**Prerequisite:** `sysml-literacy` (you must be able to *read* an `action def` before you author one).

---


## Author it (the short path)

1. Copy **[`assets/template.sysml`](assets/template.sysml)** and rename the generic names.
2. Follow the six-step procedure in **[`references/workflows.md`](references/workflows.md)** - also modelled
   as a workflow you can read in **[`assets/authoring-procedure.sysml`](assets/authoring-procedure.sysml)**:
   list steps -> order them (`action a; then b;`) -> wire pins (`in`/`out`) -> add decisions (`decide`) ->
   check the ends -> validate.
3. Compare against the worked examples: **[`assets/example.sysml`](assets/example.sysml)** (a deploy pipeline
   with a decision) and **[`assets/cascade.sysml`](assets/cascade.sysml)** (recursion + for-each - the cascade).

The canonical shape (from the template):
```
action def Workflow {
    in source : Input;  out result : Output;   // typed pins
    action stepA;  then stepB;                  // a succession: stepA precedes stepB
    action stepB;  then stepC;
    action stepC;
}
```

---


## Watch out (see references for the full list)

- **Reserved/contextual keywords can't be names** - not `action`, `state`, `from`, `accept`, `to`, `then`,
  `entry`, `subject`, `fork`, `render`, `decide`, `for`, `in`, `out`. Use real domain names for steps + pins.
- **No `else`** - a `decide` is guarded `if <cond> then <A>` branches plus one bare `then <B>` default.
- **A succession needs a target** (`then <action>`); **bind `in` pins** when you call another `action def`.
- **Recursion + for-each is the cascade** - `for x : T in coll { decide ...; if ... then recurse; then otherwise; }`.
  This is where a state machine's effect lives (the arc `park` cascade is exactly this).
- Scan for unreachable actions - the parser will not.

---


## Validate

Authoring SysML is the error-prone direction - **always validate before you trust the model.** The discipline is shared across all model-a-X skills: **[`sysml-literacy/references/validating-sysml.md`](../sysml-literacy/references/validating-sysml.md)**.\
In short: run a SysML v2 parser, require **`syntaxErrors == 0`** (necessary, not sufficient), then scan the semantics by hand - the parser will *not* catch an unreachable action or an unbound pin.\
The decidable workflow rules are written as a checkable spec in **[`assets/well-formedness.sysml`](assets/well-formedness.sysml)**.\
(`compatibility`: requires a SysML v2 parser to validate.)

---


## Note for skill authors

This skill follows the **model-X template** - the fixed scaffold a future `sysml-skill-builder` will codify: a thin `SKILL.md` (frontmatter `prerequisite: sysml-literacy` + `models: <construct>` - when - author-it - watch-out - validate - this note) + **five assets** - `template.sysml`, `example.sysml`, one focused *advanced* example (the construct's most valuable extension - here `cascade.sysml`), `authoring-procedure.sysml` (the procedure as an `action def`), `well-formedness.sysml` (the decidable rules as `constraint def`s) - + one `references/<construct>.md`, all linking the shared `validating-sysml` reference.\
A primitive declares `prerequisite: sysml-literacy` and composes nothing; "level" is derived from the edges.
