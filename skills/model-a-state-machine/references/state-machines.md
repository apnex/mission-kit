# Authoring a state machine in SysML v2

A state machine models a thing's **lifecycle**: the states it can be in, the events it reacts to, and the
transitions between them. Read `sysml-literacy` first; this is the *authoring* counterpart.

## Anatomy (see `assets/template.sysml`)

```
state def Machine {
    entry; then stateA;                                     // the INITIAL state
    state stateA;  state stateB;                            // the states
    transition t1 first stateA accept EventOne then stateB; // a transition row
}
```
- **States** — one `state <name>;` per state, inside the `state def`.
- **Initial** — `entry; then <state>;` names where the machine starts.
- **Events** — one `item def <Event>;` per trigger (declared in the package, outside the `state def`).
- **Transitions** — `transition <id> first <FROM> accept <EVENT> then <TO>;` = "from FROM, on EVENT, go to
  TO." This is the unit you author the most; each is one row of the transition table.

## The authoring procedure

1. **List the states** — the distinct conditions the thing can be in. Keep them mutually exclusive.
2. **Pick the initial** — write `entry; then <initial>;`.
3. **List the events** — one `item def` per trigger that causes a change.
4. **Wire the transitions** — one `transition … first … accept … then …` per legal (state, event) → state.
5. **Check the terminals** — for any "end" state, decide: is it truly final, or **reopenable**? If it can
   come back, give it an outgoing transition (see `assets/example.sysml`: `cancelled → trialing` via
   `Reactivate`). A terminal with no way back is a deliberate dead-end — make that a choice, not an oversight.
6. **Validate** (see SKILL.md "Validate").

## Patterns

- **Transition-table thinking.** A state machine *is* a table: (from, event) → to. Author and review it
  that way — one row per cell you allow; absent rows mean "that event is ignored / illegal in that state."
- **Reopenable terminals.** "Done / cancelled / closed" are usually states, not graves. If revival is
  possible, model the edge back (the `Subscription` example reopens `cancelled` to `trialing`). This is the
  same anti-amnesia discipline the `arc-lifecycle` skill enforces.
- **Recovery loops.** Model failure + recovery as a pair (`active → pastDue → active`), not a one-way drop.

## Pitfalls (gate-learned)

- **`state` is a reserved word** — you cannot name a state literally `state`; pick a real name.
- **Use `item def` for events** — normative SysML v2 also has `signal def`, but the community validator's
  grammar doesn't implement it, so `item def` is the portable choice for events here.
- **Every transition needs both `accept` and `then`** — an event and a target. A transition with no `accept`
  or no `then` won't parse / won't mean anything.
- **Declare the initial** — a `state def` with no `entry; then …;` has no defined start.
- **Unreachable / dead states** — after wiring, scan: is every state reachable (some transition `then`s
  it)? Is every declared event used? Flag strays; they're usually a modelling slip. (The **initial** state
  is exempt — it is reached via `entry`, not a `then`.)
- **Don't over-state** — only add a transition you actually intend; absent edges are meaningful (illegal).

## Scope + legal shapes worth knowing

- **One source state can have many outgoing transitions** — one per event it reacts to (the example's
  `active` goes to both `pastDue` and `cancelled`). And a transition may target its **own** state (a
  self-transition). Both are legal and common.
- **Out of scope of this skill (add after the skeleton validates):** transition **guards** (`if <cond>`)
  and **entry/exit actions**. Model the bare `accept … then …` skeleton first, validate it, then layer
  guards/effects on — they are the error-prone part and easiest to add against a known-good base.
