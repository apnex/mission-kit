# SysML v2 notation — the reading legend

A model is **text**. Each construct below appears in `assets/example.sysml`. Read this once and the
notation stops being noise.

## Containers + plumbing

| You see | It means |
|---|---|
| `package Name { … }` | a namespace — the outer container holding definitions |
| `import Other::*;` | pull names from another package (so `Foo` resolves to `Other::Foo`) |
| `doc /* … */` | documentation attached to the element it precedes |
| `// …` | a comment |
| `Pkg::Thing` | a **qualified name** — `Thing` from package `Pkg` |
| `[0..*]`, `[1..*]`, `[0..1]` | **multiplicity** — how many: any, one-or-more, optional |

## The "def" you'll meet (a *def* is a DEFINITION/type; a usage — `name : Def` — is a *use/role* of it, not a runtime instance)

| Construct | Models | Read it as |
|---|---|---|
| `enum def State { a; b; c; }` | a fixed value set | "State is exactly one of a/b/c" |
| `part def Thing { … }` | a **component / kind of thing** | "a Thing has these attributes + parts" |
| `attribute x : String;` | a typed property | "Thing has an x of type String" (types: `String` `Boolean` `Integer` `Real`) |
| `ref y : Other;` | a **reference** to another thing (not ownership) | "Thing points at an Other" → a dependency edge |
| `item def Event;` | a piece of information / an event/signal | "Event is a thing that can occur or flow" |
| `requirement def R { … }` | a requirement to satisfy | "R is a constraint the system must meet" |
| `constraint def C { in p : T; <expr> }` | a reusable boolean rule | "C(p) must hold"; reused via `assert constraint c : C { in p = …; }` |
| `state def M { … }` | a **state machine** | see below |
| `action def A { … }` | an **ordered activity / workflow** | see below |

## State machines (`state def`) — the behaviour you'll query most

```
state def BuildLifecycle {
    entry; then idle;                                       // the machine STARTS in idle
    state idle;  state running;  state passed;  state failed;
    transition tStart first idle    accept Triggered  then running;
    transition tPass  first running accept TestsGreen then passed;
}
```
Read each `transition <id> first <FROM> accept <EVENT> then <TO>` as a row of a table:
**from FROM, on EVENT, go to TO.** To answer *"legal move from running?"* — scan for `first running`.

## Workflows (`action def`) — ordered steps

```
action def RunBuild {
    in repo : Repository;       // an input pin
    action checkout; then compile;     // checkout, THEN compile
    action compile;  then runTests;
    action runTests; then publish;
    action publish;
}
```
Read `action X; then Y;` as **X precedes Y**. `in`/`out` are input/output pins (the activity's I/O).

## Instance models — the two operators that trip people up

Real instance models (a specific system) lean on two operators:

| Operator | Name | Read it as |
|---|---|---|
| `myThing : Kind :> base` | **subset / specialize** | "myThing is a Kind, and *subsets* `base`" — it takes base's structure and narrows it. An is-a / narrowing relation — **not** composition (part-of). |
| `:>> attr = value` | **redefine** | "*redefine* `attr`, here pinning its value to `value`" on this usage |

So `item AE1 : Rung :> rung { :>> lifecycleState = LifecycleState::shipped; }` reads:
*"AE1 is a Rung that subsets the program's `rung` feature; its lifecycleState is redefined to shipped."*
`:>` = subsets/specializes; `:>>` = redefines a feature (often, as here, to fix its value). Practise both
on the instance at the bottom of `assets/example.sysml`.

## When in doubt
- A `def` is a **definition** (a template/type); a usage (`name : Def`) is a **use** of it (a role/feature) — not a runtime instance (that is an `individual`/snapshot).
- `ref` / `:>` / qualified names are **edges** — follow them to trace dependencies.
- The model is exhaustive: if a relationship isn't written, it isn't asserted. Don't infer beyond the text.
