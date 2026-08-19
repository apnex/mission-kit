---
name: model-a-state-machine
description: "Use when modelling the stateful lifecycle or behavior of a thing (an order, a subscription, a connection, a build, a process) as states and the transitions between them. Author a state machine (a lifecycle / FSM) in SysML v2 - states, events, transitions (first/accept/then), guards (if), and an initial state. Read the sysml-literacy skill first; this is the authoring counterpart."
metadata:
  prerequisite: sysml-literacy
  models: state-machine
---

# model-a-state-machine - author an FSM in SysML v2

## When to use

- You are modelling the **lifecycle** of a thing - the distinct states it moves through and what triggers
  each move (an order, a subscription, a connection, a deployment, a request, a document).
- You want the behaviour to be **enforceable + queryable** ("what's the legal move from X?"), not prose.
- You are about to hand an agent or a tool a behaviour spec and want it unambiguous.

Not for: ordered *activities/steps* with no states (that's `model-a-workflow` - an `action def`); or static structure with no behaviour (that's `model-a-component` - a `part def`).\
A transition's **effect** (what it *does*) is also a workflow concern - see "Effects" below.

**Prerequisite:** `sysml-literacy` (you must be able to *read* a `state def` before you author one).

---


## Author it (the short path)

1. Copy **[`assets/template.sysml`](assets/template.sysml)** and rename the generic names.
2. Follow the six-step procedure in **[`references/state-machines.md`](references/state-machines.md)** - also
   modelled as a workflow you can read in **[`assets/authoring-procedure.sysml`](assets/authoring-procedure.sysml)**:
   list states -> pick the initial (`entry; then ...;`) -> list events (`item def`) -> wire transitions
   (`transition t first FROM accept EVENT then TO`) -> decide which terminals are reopenable -> validate.
3. Compare against the worked examples: **[`assets/example.sysml`](assets/example.sysml)** (a subscription
   lifecycle with a recovery loop and a reopenable terminal) and **[`assets/guarded.sysml`](assets/guarded.sysml)**
   (branching on a guard).

The canonical shape (from the template):
```
state def Machine {
    entry; then stateA;                                     // the initial transition (starts in stateA)
    state stateA;  state stateB;
    transition t1 first stateA accept EventOne then stateB; // (stateA, EventOne) -> stateB
    transition t2 first stateA accept EventOne if guard then stateC; // a guard splits one event two ways
}
```

---


## Watch out (see references for the full list)

- **Reserved/contextual keywords can't be names** - not `state`, `from`, `accept`, `to`, `then`, `entry`,
  `subject`, `fork`, `render`. Use `item def` for events (the gate validator lacks the normative `signal def`).
- **Every transition needs a target (`then`).** A trigger (`accept`) is usual but optional - a transition with
  no `accept` is a legal **completion transition** (fires when the source state completes).
- **Guards are supported** - `accept EVENT if <cond> then TO` chooses between transitions; layer them on after
  the skeleton validates (worked in `assets/guarded.sysml`).
- **Effects belong to a workflow** - what a transition *does* is an `action def` (`model-a-workflow`), not part
  of the FSM. The arc `park` cascade is exactly this: a recursive workflow, not a transition.
- Scan for unreachable states + unused events. A terminal with no way back is a *choice* - make it deliberately.

---


## Validate

Authoring SysML is the error-prone direction - **always validate before you trust the model.** The discipline is shared across all model-a-X skills: **[`sysml-literacy/references/validating-sysml.md`](../sysml-literacy/references/validating-sysml.md)**.\
In short: run a SysML v2 parser, require **`syntaxErrors == 0`** (necessary, not sufficient), then scan the semantics by hand - the parser will *not* catch an unreachable state, an unused event, or an unbound effect.\
The decidable FSM rules are also written as a checkable spec in **[`assets/well-formedness.sysml`](assets/well-formedness.sysml)**.\
(`compatibility`: requires a SysML v2 parser to validate.)

---


## Note for skill authors (the model-X template)

This skill is the **template for the rest of the L1 modelling-primitive catalogue** - the fixed scaffold a future `sysml-skill-builder` will codify.\
Copy this shape per construct:

- a thin `SKILL.md` (frontmatter `prerequisite: sysml-literacy` + `models: <construct>` - when - author-it -
  watch-out - validate - this note);
- **five assets**: `template.sysml`, `example.sysml`, one focused *advanced* example (the construct's most
  valuable extension - here `guarded.sysml`), `authoring-procedure.sysml` (the procedure as an `action def`),
  `well-formedness.sysml` (the decidable rules as `constraint def`s) - dogfood the doctrine: prose for judgment,
  SysML for structure/logic;
- one `references/<construct>.md`, linking the shared **`validating-sysml`** reference (don't repeat the
  validate discipline); and **gate-verify every "X parses" claim** before you write it.

A primitive declares `prerequisite: sysml-literacy` and composes nothing; a specialist (L2) system skill declares a `composes:` edge over the primitives it is built from.\
"Level" is *derived* from those edges, never stored in a name - see the catalogue framework.
