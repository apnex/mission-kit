---
name: model-a-state-machine
description: "Author a state machine (a lifecycle / FSM) in SysML v2 — states, events, transitions (first/accept/then), and an initial state. Use when modelling the stateful lifecycle or behavior of a thing (an order, a subscription, a connection, a build, a process) as states and the transitions between them. Read the sysml-literacy skill first; this is the authoring counterpart."
metadata:
  prerequisite: sysml-literacy
  models: state-machine
---

# model-a-state-machine — author an FSM in SysML v2

## When to use

- You are modelling the **lifecycle** of a thing — the distinct states it moves through and what triggers
  each move (an order, a subscription, a connection, a deployment, a request, a document).
- You want the behaviour to be **enforceable + queryable** ("what's the legal move from X?"), not prose.
- You are about to hand an agent or a tool a behaviour spec and want it unambiguous.

Not for: ordered *activities/steps* with no states (that's `model-a-workflow` — an `action def`); or static
structure with no behaviour (that's `model-a-component` — a `part def`).

**Prerequisite:** `sysml-literacy` (you must be able to *read* a `state def` before you author one).

## Author it (the short path)

1. Copy **[`assets/template.sysml`](assets/template.sysml)** and rename the generic names.
2. Follow the six-step procedure in **[`references/state-machines.md`](references/state-machines.md)**:
   list states → pick the initial (`entry; then …;`) → list events (`item def`) → wire transitions
   (`transition t first FROM accept EVENT then TO`) → decide which terminals are reopenable → validate.
3. Compare against the worked **[`assets/example.sysml`](assets/example.sysml)** (a subscription lifecycle
   with a recovery loop and a reopenable terminal).

The canonical shape (from the template):

```
state def Machine {
    entry; then stateA;                                     // initial
    state stateA;  state stateB;
    transition t1 first stateA accept EventOne then stateB; // (stateA, EventOne) -> stateB
}
```

## Watch out (see references for the full list)

- `state` is a reserved word — don't name a state `state`. Use `item def` for events (the community validator's grammar doesn't implement `signal def`, though normative SysML v2 has it).
- Every transition needs both `accept <Event>` and `then <Target>`. Declare the initial with `entry; then …`.
- Scan for unreachable states + unused events. A terminal with no way back is a *choice* — make it deliberately.

## Validate

Authoring SysML is the error-prone direction — **always validate before you trust the model.** Run it
through a SysML v2 parser / LSP and require **`syntaxErrors == 0`**; then eyeball the semantic notes. (Until
the engine-backed authoring path exists, this validate-after-author loop is how you catch fragile-write
slips. `compatibility`: requires a SysML v2 parser to validate.)

## Note for skill authors (the model-X template)

This skill is the **template for the rest of the catalogue** (`model-a-workflow`, `model-a-component`, …):
thin `SKILL.md` (prerequisite `sysml-literacy` · when · author-it · pitfalls · validate) + `assets/template.sysml`
+ `assets/example.sysml` + `references/<construct>.md`. Copy this shape per thing — prose for judgment,
SysML for the structure.
