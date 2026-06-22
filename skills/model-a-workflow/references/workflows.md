# Authoring a workflow in SysML v2

A workflow models an **ordered activity**: the steps something does, in what order, with what inputs and
outputs, and where it branches or repeats. In SysML v2 a workflow is an **`action def`**. Read `sysml-literacy`
first; this is the *authoring* counterpart. (For *states* and the events between them, that's a state machine —
`model-a-state-machine`. A workflow is the *doing*, a state machine is the *being-in-a-state*.)

## Anatomy (see `assets/template.sysml`)

```
action def Workflow {
    in source : Input;           // an input pin — what it consumes
    out result : Output;         // an output pin — what it produces
    action stepA;  then stepB;   // a succession: stepA precedes stepB
    action stepB;  then stepC;
    action stepC;                // the last step (no `then`)
}
```
- **Actions** — one `action <name>;` per step inside the `action def`.
- **Successions** — `action a; then b;` = "a precedes b." This is the unit you author the most; the chain of
  successions *is* the order.
- **Pins** — `in <name> : <Type>;` / `out <name> : <Type>;` are the workflow's typed inputs/outputs.
- **Calling another workflow** — `action c : OtherDef { in pin = arg; }` invokes `OtherDef`, binding its input
  pin; read its result as `c.<outpin>` (see the cascade). A qualified (cross-package) call just qualifies the
  type: `action k : Pkg::Def { in pin = arg; }`. (Note: `do action …` is a *state-machine transition effect*
  form, NOT an action-def-body call — using `do` inside an `action def` is a parse error here.)

## The authoring procedure

Also modelled as a workflow you can read — **[`assets/authoring-procedure.sysml`](../assets/authoring-procedure.sysml)**
(an `action def`; dogfood: read it with `sysml-literacy`, then follow it).

1. **List the steps** — the discrete actions the process performs.
2. **Order them** — wire `action a; then b;` successions into the sequence.
3. **Wire the pins** — `in`/`out` pins for what the workflow consumes/produces.
4. **Add decisions** — where the order branches, add a `decide` (next section). Optional.
5. **Check the ends** — every action reachable? any recursion intentional (not an accidental cycle)?
6. **Validate** — see `sysml-literacy/references/validating-sysml.md`.

## Decisions — branching the order (supported)

When the next step depends on a condition, branch with a `decide`:

```
action gate {
    decide outcome;
    if artifact.testsPassed then release;   // a guarded branch
    then rollback;                          // the DEFAULT branch — a bare `then`, NO `else` keyword
    action release;
    action rollback;
}
```
- Form: `decide <name>; if <cond> then <A>; then <B>; action A; action B;`. Each `if <cond> then <target>` is
  one guarded branch; the trailing bare `then <target>` is the default branch — the decision idiom has **no
  `else`**. The condition reads a pin/attribute in scope. Worked in **[`assets/example.sysml`](../assets/example.sysml)**.

## Recursion + for-each — the cascade (what a state machine can't do)

A workflow can iterate a collection and call itself — the shape an FSM transition cannot express, which is why
`model-a-state-machine` defers transition **effects** (and the arc `park` cascade) to here:

```
action def CancelCascade {
    in node : Task;
    action collect : CollectDependents { in seed = node; }   // call another action def, bind its pin
    then sweep;
    action sweep {
        for dep : Task in collect.deps {                     // iterate the called action's out pin
            decide branch;
            if dep.coupling == Coupling::hard then coCancel;
            then warn;
            action coCancel : CancelCascade { in node = dep; }   // RECURSION: cascade into the dependent
            action warn;
        }
    }
}
```
- `for <x> : <Type> in <collection> { … }` iterates; `<collection>` is usually a called action's `out` pin
  (`collect.deps`). Self-recursion is just calling the same `action def` from inside. Worked in
  **[`assets/cascade.sysml`](../assets/cascade.sysml)** (it mirrors `arc-process.sysml`'s `ParkCutCascade`).
- **This is the home for a transition's effect.** When a `model-a-state-machine` transition needs to *do*
  something (run an action, sweep dependents), model that action here and reference it from the transition.

## Patterns

- **Order is the succession chain.** Read/author the workflow by following `then` from the first action;
  an action with no inbound `then` (and not the start) is unreachable — a slip.
- **Effect = workflow.** "What a transition does" is an `action def`, not FSM vocabulary. Keep state machines
  to the transition table; put the doing here.
- **Cascade = recursion + for-each + decide.** Sweeping dependents, retrying a tree, fanning out — all the
  same shape (`for … { decide …; if … then recurse; then otherwise; }`).

## Pitfalls (gate-learned)

- **Reserved / contextual keywords can't be names** — not `action`, `state`, `from`, `accept`, `to`, `then`,
  `entry`, `subject`, `fork`, `render`, `decide`, `for`, `in`, `out`. Pick real domain names for steps + pins.
- **No `else`.** A `decide` uses guarded `if … then …` branches plus one bare `then …` default. (This
  validator silently *accepts* a stray `else` rather than rejecting it — so it won't catch the mistake for
  you; the `else` is simply not the idiom and is silently mis-modelled. Use the bare `then` default.)
- **A succession needs a target.** `then` must name a declared `action`; a `then` with no target is meaningless.
- **Bind `in` pins at a call.** Calling `OtherDef { in pin = arg; }` must bind its inputs; an unbound call is
  a slip (the parser won't always flag it — see `validating-sysml.md`).
- **Unreachable actions** — after wiring, scan: is every action the start, a `then`, or a branch target? The
  parser will NOT flag a stray action; encode the rules as `constraint def`s if you want them checkable
  (**[`assets/well-formedness.sysml`](../assets/well-formedness.sysml)**).

## Scope — deferred, but supported (add after the skeleton validates)

- **Decisions, for-each, recursion** — covered above; the common extensions, all gate-verified.
- **Parallelism / forks** (`fork`/`join` — concurrent branches) — normative SysML v2 has them; `fork` is a
  reserved word. Out of scope of this skill; model the sequential spine first.
- **Rich pin typing + flows** (item flows between actions) — model the bare `in`/`out` pins first, layer
  flows later.
