# Authoring a state machine in SysML v2

A state machine models a thing's **lifecycle**: the states it can be in, the events it reacts to, and the
transitions between them. Read `sysml-literacy` first; this is the *authoring* counterpart.

## Anatomy (see `assets/template.sysml`)

```
state def Machine {
    entry; then stateA;                                     // the INITIAL TRANSITION (starts the machine in stateA)
    state stateA;  state stateB;                            // the states
    transition t1 first stateA accept EventOne then stateB; // a transition row
}
```
- **States** — one `state <name>;` per state, inside the `state def`.
- **Initial transition** — `entry; then <state>;` is the *initial transition*; it names where the machine
  starts. The `entry` is the transition, the *state* is its target (the one named after `then`). This matters
  for the reachability scan: the initial state is reached *via this transition*, not via another `then`.
- **Events** — one `item def <Event>;` per trigger (declared in the package, outside the `state def`).
  (Normatively events are `signal def`; we use `item def` because the gate validator rejects `signal def` —
  see `sysml-literacy/references/validating-sysml.md`.)
- **Transitions** — `transition <id> first <FROM> accept <EVENT> then <TO>;` = "from FROM, on EVENT, go to
  TO." This is the unit you author the most; each is one row of the transition table.

## The authoring procedure

The procedure is also modelled as a workflow you can read — **[`assets/authoring-procedure.sysml`](../assets/authoring-procedure.sysml)** (an `action def`).
Dogfood: read it with `sysml-literacy`, then follow it.

1. **List the states** — the distinct conditions the thing can be in. Keep them mutually exclusive.
2. **Pick the initial** — write `entry; then <initial>;`.
3. **List the events** — one `item def` per trigger that causes a change.
4. **Wire the transitions** — one `transition … first … accept … then …` per legal (state, event) → state.
   Need to *choose* between two transitions on the same event? Add a **guard** (next section).
5. **Check the terminals** — for any "end" state, decide: is it truly final, or **reopenable**? If it can
   come back, give it an outgoing transition (see `assets/example.sysml`: `cancelled → trialing` via
   `Reactivate`). A terminal with no way back is a deliberate dead-end — make that a choice, not an oversight.
6. **Validate** — see `sysml-literacy/references/validating-sysml.md` (run the parser; `syntaxErrors==0` is
   necessary, not sufficient; then scan reachability/unused by hand).

## Guards — choosing between transitions (supported; layer on after the skeleton)

When one event can lead to different states depending on a condition, add a **guard**:

```
transition wOk first idle accept Withdraw if funded     then dispensing;
transition wNo first idle accept Withdraw if not funded then idle;
```
- Form: `transition <id> first <FROM> accept <EVENT> if <condition> then <TO>;`. The condition reads an
  attribute/value **in scope** (here `funded : Boolean` on the `state def`). `not <cond>` negates.
- This is the construct most lifecycles actually need — it is **fully supported by the language and the gate
  validator** (worked + validated in **[`assets/guarded.sysml`](../assets/guarded.sysml)**). It is deferred to
  *after* the skeleton only for pedagogy (model the bare `accept … then …` first, validate, then add guards),
  not because it is unavailable.

## Effects — what a transition *does* belongs to a workflow

A transition can carry an **effect** (run an action when it fires). But an effect is *behaviour*, not state —
model the action with **`model-a-workflow`** (`action def`) and reference it from the transition. Two reasons to
keep effects out of the bare state machine: (1) it keeps the FSM a clean transition table; (2) the arc
lifecycle's `park` "cascade" — co-parking payoff-dependents — is exactly an effect, and it is a *recursive
workflow*, not anything the `accept … then …` vocabulary can express. When a transition does more than move
state, that "more" is a workflow. (Note: the inline `do action x : Op then …` form trips a spurious validator
warning — the `: Type then` greedy-parse artifact in `validating-sysml.md` — another reason to model the action
separately and keep transitions clean.)

## Patterns

- **Transition-table thinking.** The *skeleton* of a state machine is a table: (from, event) → to. Author and
  review it that way — one row per cell you allow; absent rows mean "that event is ignored / illegal in that
  state." (Guards make a single (from, event) map to more than one row; effects and nesting make it more than
  a table — so "is a table" holds for the skeleton, not the full model.)
- **Reopenable terminals.** "Done / cancelled / closed" are usually states, not graves. If revival is
  possible, model the edge back (the `Subscription` example reopens `cancelled` to `trialing`). This is the
  same anti-amnesia discipline the `arc-lifecycle` skill enforces.
- **Recovery loops.** Model failure + recovery as a pair (`active → pastDue → active`), not a one-way drop.
- **Branch on a guard.** Two outcomes from one event = two guarded transitions (see `assets/guarded.sysml`).

## Pitfalls (gate-learned)

- **Reserved / contextual keywords can't be names.** You cannot name a state, event, or member `state`,
  `from`, `accept`, `to`, `then`, `entry`, `subject`, `fork`, or `render` — they are grammar keywords and the
  parser will choke (`no viable alternative at input '…'`). Pick real domain names.
- **Use `item def` for events** — the gate validator's grammar doesn't implement `signal def` (the normative
  choice), so `item def` is the portable form here. See `validating-sysml.md`.
- **A transition needs a target (`then`); a trigger (`accept`) is usual but optional.** Most transitions are
  `accept <EVENT> then <TO>`. A transition with **no `accept`** is a legal **completion transition**
  (`transition t first A then B;`) — it fires when state `A` completes. Don't write a transition with no
  `then` (no target = nothing happens).
- **Declare the initial** — a `state def` with no `entry; then …;` has no defined start.
- **Unreachable / dead states** — after wiring, scan: is every state reachable (some transition `then`s it)?
  Is every declared event used? The **initial** state is exempt (reached via `entry`). The parser will NOT
  flag these — they are your manual check (or encode them as `constraint def`s; see
  **[`assets/well-formedness.sysml`](../assets/well-formedness.sysml)**).
- **Don't over-state** — only add a transition you actually intend; absent edges are meaningful (illegal).

## Scope — deferred, but supported (add after the skeleton validates)

These exist in the language + gate validator; defer them only so you build on a known-good skeleton:
- **Guards** (`if <cond>`) — covered above; the common, do-it-early extension.
- **Entry / exit / `do` actions** on a state, and transition **effects** — behaviour; model with
  `model-a-workflow` and reference it (above). On this validator, inline-typed effects bind loosely — keep the
  action in a workflow.
- **Composite (nested) states and parallel regions** — normative SysML v2 has them (a state whose body is
  itself a `state def`, and concurrent regions). They are out of scope of this skill; if a lifecycle is
  genuinely nested, model the top level here and note the nesting for a later pass.
