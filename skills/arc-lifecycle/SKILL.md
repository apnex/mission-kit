---
name: arc-lifecycle
description: "Use to manage a multi-step initiative as a sovereign state engine an agent operates by VERBS, instead of a prose backlog it hand-edits. The model is a fixed summit (global-max goal) + an arc (tree of rungs/steps) climbing it, each carrying a lifecycle state. Operate it through an FSM-gated API: reads (query / traverse / describe / project) answer questions without loading the whole store; writes (transition / author) are FSM-gated, delta-logged, and validate the whole store before touching disk. Terminals are reopenable, deferrals carry a revival trigger (anti-amnesia), and human/spec views are GENERATED from the one store. The agent derives understanding from the system itself, not from prose it must parse and trust."
metadata:
  related-skills: survey, substrate-audit
  facet: operate — runs an arc as a live FSM-gated engine (the operate facet of the arc model)
  see-also: sysml-literacy, model-a-state-machine
---

# arc-lifecycle — operate staged work as a sovereign state engine

## When to use

- Managing a multi-step initiative whose steps are deferrable, terminable, and interdependent over a long horizon.
- An agent (not only a human) will operate the tracker — it needs a verb API + queryable state, not a markdown file.
- Designing a roadmap / backlog / migration plan and you want the transition rules to be enforced physics, not convention.
- A prose backlog has already produced a lost-parked-item, a stale status header, or an inconsistent dependency.
- You want every deferred item to carry the condition that would revive it, and every "done" to stay reopenable.

**Not** for: a short, flat, throwaway task list (no deferral/dependencies, single human reader); capturing
open-ended stakeholder intent before a design exists (use the `survey` skill first — arc-lifecycle manages the
work once it is staged); a one-off mechanical change with one obvious outcome and no lifecycle.

## Overview

An **arc-lifecycle** manages staged work as a **sovereign state engine**:
a machine store of summits, arcs, and rungs that an operator — human or
agent — mutates through a small set of **verbs**, never by hand-editing
prose. It is NOT a document, NOT a kanban board, and NOT a planning
template. It is the smallest substrate that makes a long-running,
deferrable, interdependent body of work *machine-operable* and
*audit-honest*.

Three properties distinguish it from a prose backlog:

- **Writes are gated.** A transition that the FSM forbids is rejected;
  every write re-validates the *whole* store before it persists, so the
  store can never reach an inconsistent state.
- **Nothing is forgotten.** Every parked or terminal item carries a
  revival trigger (the condition that should resurface it), and every
  terminal state stays reopenable.
- **Views can't drift.** The human-readable status digest and any spec
  view are *generated* from the store, so they are always exactly what
  the store says.

This skill is **engine-agnostic**: it describes the model + the operating
discipline. A reference implementation is a domain-neutral JSON core a
consumer programs with its own vocabulary; see "Installing a runnable
engine."

## Where this sits — operating vs modelling an arc

An arc is a **specialist composed model**: an FSM (the lifecycle) + a dependency
DAG (`dependsOn`) + invariants (anti-amnesia, banked-substrate) + classification
axes (payoff, tier). Two facets, two skills, two substrates:

- **Operate (this skill).** Run a *live instance* through the verb API — the
  runtime engine, not the model text. This is what you need to drive real work.
- **Model / author.** Read or author the arc *model itself* with the SysML
  modelling primitives: `model-a-state-machine` (the FSM), and — as the catalogue
  fans out — `model-a-dependency-graph`, `model-a-constraint`, `model-a-classification`,
  composed into a `model-an-arc` skill, all read with `sysml-literacy`.

You can operate an arc without reading the model (so `sysml-literacy` is a
*see-also*, not a prerequisite, here); reach for the modelling skills when you
want to understand, extend, or re-author the structure the engine enforces.

## The model — summit / arc / rung

| Noun | Meaning |
|---|---|
| **summit** | A fixed global-maximum goal. It does not move; arcs climb *toward* it. A summit is reached (committed) or still future. |
| **arc** | A tree of rungs climbing exactly one summit. The arc carries an `arcState` (its lifecycle). |
| **rung** | A single step. Carries a lifecycle state, a **payoff** class, a **tier** (the consumer's vocabulary), an optional `dependsOn` (other rungs), and a `cashesInto` (the summit it advances). |

Cross-arc edges express how arcs relate: **buildsOn** (an arc rests on
another arc's *shipped + banked* rungs — never on a bet) and **reCashes**
(an arc revives a *dormant* concept from a parked/retired rung elsewhere).

## The FSM — reopenable terminals

```
candidate ──commit──▶ active ──┬─ ladder-empty ─▶ forwardComplete ─▶ closed
                               ├─ park ─────────▶ parked
                               └─ retire ───────▶ retired
forwardComplete | closed | parked | retired ──revival-trigger-fired──▶ candidate
```

Two rules make the FSM honest:

- **All terminals are reopenable.** "Done", "won't do", and "parked" are
  states, not graves — each keeps an outgoing edge back to `candidate`.
- **Revival re-triages.** Reviving routes back through `candidate` (the
  intake state), so a revived item's old assumptions are re-examined, not
  silently resumed.

A write that names an event illegal from the current state is rejected
with the legal-move set; it never half-applies.

## The two orthogonal axes

A rung sits on two *independent* axes — conflating them is the classic
backlog bug:

- **Dependency DAG** — `dependsOn`: what must precede what. Governs
  *ordering*.
- **Payoff** — governs *deferral economics*:
  - `banked` — no-regret; valuable whether or not anything downstream
    cashes it.
  - `staked` — only cashed by a dependent; if the dependent dies, the
    stake is lost.
  - `mixed` — partly each.

Park/cut keys off **payoff, not dependency**. Parking a rung runs a
**cascade** over its payoff-dependents (the rungs that share its summit
and depend on its payoff): staked peers are co-parked or re-justified;
banked peers are left live. A dependency-only mental model gets this
wrong — a rung can be a payoff-dependent of another without being a build
prerequisite.

## Anti-amnesia (required)

Deferral is rejected unless it records a **revival trigger**: the
observable condition under which the item should be reconsidered. This is
a schema requirement on every non-active state and every deferral delta,
not an optional note. It is the single rule that keeps the backlog from
becoming a graveyard. The complement is that every terminal stays
reopenable, so an armed trigger always has a path back.

## The verb surface

Operate the engine through verbs over data — never by editing a rendered
view. Reads are free (no mutation); writes are gated.

**Reads:**

- `get <id>` / `query <kind> <field>=<value>` — fetch an item / filter.
- `traverse <id> <edge> [--dir in|out] [--depth N]` — a bounded,
  cycle-guarded walk of an edge relation (`dependsOn`, `cashesInto`,
  `buildsOn`, `reCashes`, payoff-dependents).
- `describe` — the self-documenting surface: the verbs, the vocabulary,
  and the legal events, derived from the schema + manifest (so an agent
  learns the system from the system, not from prose it must trust).
- `project <view>` — a generated view: a status digest, a per-arc
  hydration envelope (a bounded context pack for an agent), or a spec
  projection. Views are generated, never authoritative.

**Writes** (dry-run by default; persist only on an explicit apply flag):

- `transition --<arc|rung> <id> --to/--event <e> --rationale "…"
  [--trigger "…"]` — an FSM move. Logs a delta carrying its rationale;
  park/retire requires `--trigger` and runs the payoff cascade.
- `author --create <summit|arc|rung|edge> --spec <json> --rationale "…"`
  — create a new entity. Rejected unless well-formed + unique.

Every write re-validates the whole store (shape + cross-references +
anti-amnesia) *before* it persists. On reject: it returns the legal-move
set / the violations and writes nothing.

## Operating discipline

- **Operate the engine, don't wrangle prose.** Mutate state through
  verbs; never hand-edit the generated status/spec views.
- **Dry-run, read the effect, then apply.** A write prints its would-be
  result + delta + cascade; inspect it, then re-run with the apply flag.
- **Record the why on every write.** `rationale` is required; deferrals
  also require the revival trigger. The delta log is the audit trail.
- **Regenerate views after any change**, then run the parity gate so the
  generated views can't drift from the store.
- **Let the gate be the acceptance bar.** "Did the whole-store validation
  pass?" — not "did a human eyeball it?" The store enforces its own
  integrity on write.
- **Dogfood it.** Track the engine's own development as an arc in the same
  engine — the lifecycle that manages the work also manages itself.

## Installing a runnable engine

The skill is engine-agnostic, but a runnable instance needs three seams
wired (keep the core domain-neutral; inject the rest):

1. **A domain-neutral core** providing the verbs (graph walk, FSM step,
   transactional commit, the gate). The reference is the `@apnex/arc-core`
   JSON core; any equivalent works.
2. **A tenant config** supplying *this* project's vocabulary + store
   path — see `templates/arc.config.json.tmpl`. The core bakes no
   vocabulary; it enforces what the config injects.
3. **An instance store** — the catalog of your summits/arcs/rungs, the
   one machine master. Human/spec views are generated from it.

The core ships the generic schema + FSM; the consumer owns only the
config + the instance store. Writes go through the core's commit (load →
mutate → validate → atomic save, or reject writing nothing).

## References

- `templates/arc.config.json.tmpl` — the tenant config seam (vocabulary +
  store path) a consumer fills to wire a runnable engine.

This SKILL.md is self-contained: the model, the FSM, the two axes, the
anti-amnesia rule, the verb surface, and the install seams are all
described above with no dependency on any external document.
