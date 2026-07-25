---
name: arc-lifecycle
description: "Use to manage a multi-step initiative as a sovereign state engine an agent operates by VERBS, instead of a prose backlog it hand-edits. The model is a fixed summit (global-max goal) + an arc (tree of rungs/steps) climbing it, each carrying a lifecycle state. Operate it through an FSM-gated API: reads (query / traverse / describe / project) answer questions without loading the whole store; writes (transition / author) are FSM-gated, delta-logged, and validate the whole store before touching disk. Terminals are reopenable, deferrals carry a revival trigger (anti-amnesia), and human/spec views are GENERATED from the one store. The agent derives understanding from the system itself, not from prose it must parse and trust."
metadata:
  related-skills: survey, workgraph-arc-planning, workgraph-arc-operator, workgraph-arc-participant, workgraph-verification-gates, workgraph-pr-delivery, workgraph-recovery, workgraph-arc-closeout
  facet: operate — owns value/deferral/revival semantics plus the canonical evidence-derived WorkGraph lifecycle projection
  see-also: sysml-literacy, model-a-state-machine
  canonical-lifecycle: assets/workgraph-lifecycle-v1.json
  skill-selection: assets/workgraph-skill-selection-v1.json
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

This skill is **engine-agnostic** for summit/rung value semantics: it describes the model + the operating discipline.
A reference implementation is a domain-neutral JSON core a consumer programs with its own vocabulary; see "Installing a runnable engine."

For a Hub WorkGraph initiative, this skill also owns the canonical **evidence-derived lifecycle projection** at `assets/workgraph-lifecycle-v1.json` and its skill router at `assets/workgraph-skill-selection-v1.json`.
Those manifests do not create a second truth store.
They derive the current lifecycle stage and legal authority transition from fresh WorkGraph, exact artifact, GitHub, delivery, live, constitution, and entity evidence.

## Two nested state machines — never conflate them

A serious WorkGraph arc has two distinct state concerns:

| Concern | Canonical owner | What changes it |
|---|---|---|
| Value lifecycle | this skill's summit/arc/rung FSM | value commitment, payoff, deferral, retirement, revival |
| Operational lifecycle | `assets/workgraph-lifecycle-v1.json` | fresh evidence satisfying an authority/effect transition |
| Node execution state | Hub WorkItem FSM | legal WorkGraph verbs such as claim/start/block/complete/pause/unpause |

Do not use a WorkItem phase as proof that an arc is design-sealed, approved-for-go, delivered, live-qualified, or closed.
Do not hand-edit an operational lifecycle stage.
Project it from the required evidence, and keep control state (`running`, `hard-stopped`, `repairing`, `closed`) orthogonal to the stage.
A hard stop freezes prohibited effects without erasing completed stages; a distinct repair can restore `running` only after independent admission while the original FAIL remains immutable.

## Canonical end-to-end WorkGraph lifecycle

The canonical forward path is:

```text
intent-open
  -> intent-captured
  -> planning
  -> design-sealed
  -> admission
  -> approved-for-go
  -> executing
  -> implementation-sealed
  -> source-delivered
  -> publication-qualified
  -> deployment-qualified
  -> live-qualified
  -> substrate-closing
  -> substrate-closed
  -> director-closing
  -> closed
```

Optional delivery layers are never silently skipped.
A non-code, non-publication, non-deployment, or non-live arc advances through the same stage only with an independently gated `not applicable` receipt or exemption.
This keeps "not required" distinct from "forgotten".

The stage boundaries are authority boundaries:

- **Intent capture:** use a survey envelope when direction is open, or an explicit existing-intent bypass with authority and rationale when it is already fixed.
- **Planning/design:** map the target, run M7 when applicable, author an exact candidate, and obtain an independent design PASS.
- **Admission:** exact-bind the design, blueprint, authority envelope, negative lineage, constitution, effect scope, and final independent admission PASS.
- **Approved-for-go:** one strategic authority action authorizes only the frozen graph/effects; it is not a seed or source mutation.
- **Execution/repair:** the controller holds the driver, participants act only on assigned nodes, and FAIL repairs use distinct identities.
- **Delivery/live:** commit, PR, review, CI, merge, publication, deployment, live observation, and postproduction attestation remain separate proof layers.
- **Closeout:** reconcile substrate truth and complete the driver last, then deliver the progressive Director walkthrough or capture an explicit waiver/valid point-in-time not-applicable result.
- **Post-terminal audit:** append a correction linked to the original terminal record; never rewrite history or pretend the original claim was always correct.

## Skill selection — one cold-start mental model

Read `assets/workgraph-skill-selection-v1.json` rather than choosing from memory.
The short form is:

| Question | Primary skill |
|---|---|
| Is stakeholder intent still open? | `survey` |
| What is the summit, payoff, deferral, or revival trigger? | `arc-lifecycle` |
| Are we mapping/fencing/designing/M7-gating? | `workgraph-arc-planning` |
| Am I the controller commencing or driving? | `workgraph-arc-operator` |
| Am I executing an assigned node? | `workgraph-arc-participant` |
| Am I independently judging a PASS/FAIL gate? | `workgraph-verification-gates` |
| Am I moving exact source through PR/merge/publish/deploy? | `workgraph-pr-delivery` |
| Is the arc stopped, failed, paused, or drifted? | `workgraph-recovery` |
| Am I reconciling terminal truth or walking the Director through it? | `workgraph-arc-closeout` |

Stage ownership selects the arc-level playbook.
It never authorizes a participant to claim outside an explicit assignment.

## Hard stops and no-give-up recovery

Before an effect, evaluate the typed hard stops in the lifecycle manifest.
Stale/unavailable constitution, missing or mismatched authority, exact-byte drift, active verifier FAIL, invalid effect gate, scope conflict, verifier self-attestation, protected-delivery denial, forbidden live fallback, early driver completion, and unresolved Director walkthrough proof all stop the affected effect.

A hard stop is not permission to give up or improvise:

1. persist a typed no-effect receipt;
2. preserve the exact failed attempt, lease, evidence, attestation, and polarity;
3. consult current constitution and scope authority;
4. author a distinct bounded repair identity when allowed;
5. obtain fresh independent proof;
6. resume from the same evidence-derived stage only after the repair is admitted.

Escalate only a constitutional contradiction, authority/scope conflict, destructive out-of-envelope action, unavailable reserved authority, or irreducible external blocker.
Routine implementation difficulty, red CI, verifier FAIL, rate limiting, and reversible infrastructure recovery stay autonomous.

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

- `assets/workgraph-lifecycle-v1.json` — canonical evidence-derived lifecycle stages, transitions, hard stops, control-state repair FSM, invariants, and proof ladder.
- `assets/workgraph-skill-selection-v1.json` — stage/situation-to-skill routing rules.
- `assets/validate-workgraph-lifecycle.mjs` — lifecycle, selection, template, and bundle validator.
- `assets/workgraph-lifecycle.conformance.test.mjs` — executable negative conformance scenarios for exact gates, repair, driver-last, stale FYIs, walkthroughs, corrections, and proof layers.
- `templates/arc.config.json.tmpl` — the tenant config seam for value vocabulary, store path, and canonical lifecycle projection paths.
- `templates/lifecycle-checkpoint.md.tmpl` — evidence-derived stage/control-state checkpoint.
- `templates/implementation-admission-envelope.md.tmpl` — exact design/blueprint/authority/admission fence.
- `templates/post-terminal-correction.md.tmpl` — append-only terminal correction.

Run the lifecycle checks from the mission-kit root:

```bash
node skills/arc-lifecycle/assets/validate-workgraph-lifecycle.mjs
node skills/arc-lifecycle/assets/workgraph-lifecycle.conformance.test.mjs
```

This SKILL.md is self-contained for the value model and points to executable canonical assets for the operational lifecycle so skill prose, selection, templates, bundles, and conformance cannot drift independently.
