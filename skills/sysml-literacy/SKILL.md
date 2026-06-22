---
name: sysml-literacy
description: "Read and understand SysML v2 model text — packages, enum/part/item/requirement/state/action defs, attributes and refs, state transitions, action successions, and the :> (specialize) and :>> (bind) operators. Use BEFORE reading, reasoning over, or answering questions about any SysML v2 model, and as the prerequisite literacy base that other SysML-anchored skills build on."
metadata:
  role: literacy-base
  prerequisite-for: sysml-modelling skills (model-a-state-machine, model-a-workflow, model-a-component, …)
---

# sysml-literacy — read and understand SysML v2

## When to use

- Before reading, querying, or answering structural/logic questions about **any** SysML v2 model.
- As the **base layer** another SysML-anchored skill declares as a prerequisite — once you have this,
  later skills can be expressed largely *in* SysML rather than prose.
- When a model (a state machine, a component breakdown, a workflow, a requirement set) is handed to you
  as `.sysml` text and you need to act on it precisely.

Not for: *authoring* SysML from scratch (that is the per-thing `model-a-X` skills) — this skill is about
**reading**. And not for prose docs: if there's no model, there's nothing to read here.

## What a SysML model is (and why bother)

A SysML v2 model is **structured text with a grammar.** Unlike prose, every relationship is explicit and
typed, so you can answer questions by *tracing* the model rather than *interpreting* a paragraph. The win
is not fewer tokens — it's **unambiguity and queryability**: "what's the legal move from state X", "what
depends on Y", "what's the step order" are lookups, not guesses.

One rule of thumb runs through the notation: **a `def` is a DEFINITION (a type); a usage `name : SomeDef`
is a *use* of it (a role/feature).** `part def Builder` defines what a builder is; `myBuilder : Builder`
is a builder used in some context. (A concrete runtime instance is an `individual`/snapshot — rarely needed
just to *read* a model.)

## The constructs at a glance

| You see | It is | Read as |
|---|---|---|
| `package P { … }` / `import Q::*;` | namespace / name import | the container; names from Q are in scope |
| `enum def S { a; b; }` | a fixed value set | "S is exactly one of a, b" |
| `part def T { attribute x : String; ref y : U; }` | a component kind | "a T has data x and points at a U" |
| `item def E;` | information / event | "E is a thing that occurs or flows" |
| `requirement def R` / `constraint def C` | a rule to satisfy | a requirement / a reusable boolean |
| `state def M { entry; then s0; transition t first A accept E then B; }` | a state machine | "starts in s0; from A on E → B" |
| `action def W { action x; then y; }` | an ordered workflow | "x precedes y" (`in`/`out` = I/O pins) |
| `c : Kind :> base` / `:>> attr = v` | subset/specialize / **redefine** | "c is a Kind, subsets base" / "redefine attr to v" |

Full legend with snippets: **[`references/notation.md`](references/notation.md)** — load it when a construct
is unfamiliar.

## How to read a model (the six-step pass)

1. **Orient** — read the `package` `doc` + the `enum def`s (the vocabulary).
2. **Components** — `part def`s: their `attribute`s (data) and `ref`s (dependency edges).
3. **Behaviour** — `state def`s: each `transition … first FROM accept EVENT then TO` is one table row; `entry; then X;` is the start.
4. **Workflow** — `action def`s: chain `action X; then Y;` into the order.
5. **Relations** — follow `ref` / `:>` / `:>>` / qualified names to trace dependencies + instance→type links.
6. **Answer — only from the text.** If it isn't written or derivable, it isn't asserted; say "not specified."

Worked questions + a step-by-step example: **[`references/reading-a-model.md`](references/reading-a-model.md)**.

## Practise

- **[`assets/example.sysml`](assets/example.sysml)** — a small, complete, syntax-checked model (components +
  a state machine + a workflow + a requirement + an instance using `:>`/`:>>`). Read it, then answer the
  questions in `reading-a-model.md`.
- **[`assets/reading-procedure.sysml`](assets/reading-procedure.sysml)** — the six-step pass itself,
  modelled as an `action def`. The capstone: read the method *as a model*, using the method.

## For skill authors (the composition base)

This is the literacy floor. A SysML-anchored skill should: (1) declare `sysml-literacy` as a prerequisite
in its `metadata`; (2) keep its SysML spine (the workflow/state-machine/component it teaches or operates)
in `references/` or `assets/`, loaded on demand; (3) keep prose for judgment + rationale, model the
structure. With the decode-tax paid here once, later skills can be expressed largely in SysML.
