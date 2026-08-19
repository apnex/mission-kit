---
id: K6
category: skill
title: arc-lifecycle - operate staged work as a sovereign FSM-gated state engine
status: active
supersedes: []
related: [M5, M7, P3, P4, P5]
---

# K6 — arc-lifecycle

Canonical operational body: [`arc-lifecycle/SKILL.md`](arc-lifecycle/SKILL.md).
Its machine-checked WorkGraph lifecycle and selection manifests are `arc-lifecycle/assets/workgraph-lifecycle-v1.json` and `arc-lifecycle/assets/workgraph-skill-selection-v1.json`.
This ledger entry summarizes the value/deferral engine; it must not be used to bypass exact WorkGraph admission, delivery, recovery, driver-last, progressive Director closeout, or append-only correction rules in the canonical body.

## Rule

Manage a multi-step initiative as a **sovereign state engine an agent
operates by verbs**, not as prose an agent re-reads and hand-edits. The
model is three nouns: a **summit** (a fixed global-maximum goal that does
not move), an **arc** (a tree of **rungs** — the steps — climbing one
summit), and the lifecycle **state** each carries. Operate it through a
small, FSM-gated API:

- **Reads** answer questions without loading the whole store: `get` /
  `query` (by field), `traverse` (walk the dependency / payoff / build
  graph, bounded + cycle-guarded), `describe` (the self-documenting verb
  surface), `project` (generated views — status digest, per-item
  hydration envelope).
- **Writes** are gated and audited: `transition` (an FSM move — rejected
  if illegal, logging a delta with its rationale) and `author` (create a
  new summit / arc / rung / edge). Every write re-validates the *whole*
  store before it touches disk; an illegal write returns the legal-move
  set and changes nothing.

Four disciplines are load-bearing:

- **FSM with reopenable terminals.** States are `candidate → active →
  {forwardComplete | closed}` for success and `{parked | retired}` for
  deferral; *all* terminals are reopenable and every revival routes back
  through `candidate` (re-triage, not silent resume).
- **Two orthogonal axes per rung.** The dependency DAG (what must precede
  what) is separate from the **payoff** axis — `banked` (no-regret),
  `staked` (only cashed by a dependent), or `mixed`. Park/cut keys off
  payoff and runs a cascade over payoff-dependents; banked work is left
  live, staked peers are re-justified or co-parked.
- **Anti-amnesia** (see [M5]): every parked/terminal item carries a
  schema-required revival trigger.
- **Operate the engine, don't wrangle prose.** The store is a machine
  artifact; human/spec views are *generated* from it (see [P3]), so an
  agent mutates state through verbs and never edits the rendered view.

## Rationale

A backlog kept as prose decays in three predictable ways: parked items
lose the record of *why* and *what-would-revive-them* (amnesia); the
"current view" drifts from reality because it's hand-maintained; and the
logic that should govern transitions (you can't ship before your
dependency; you can't park banked work for free) lives only in a human's
head, so it's applied inconsistently. The cost lands later as
re-litigation and silent loss.

A sovereign state engine fixes each at the root. FSM-gated writes make
the transition rules *physics* — an illegal move is rejected, not merely
discouraged. Validate-on-write means the store can never reach an
inconsistent state, even by a buggy mutation. Generated views dissolve
the drift (the view is a pure function of the store). Anti-amnesia turns
the backlog from a graveyard into a set of armed conditions. And because
the surface is verbs over data, the primary operator can be an agent:
it queries, traverses, and transitions directly, deriving understanding
from the system rather than from prose it has to parse and trust.

The deeper payoff is that the engine becomes self-describing and
dogfooding: the same engine that tracks the work can track its own
development, and `describe` lets a fresh operator (human or agent) learn
the whole surface from the system itself.

## Examples

**Bad:**

> An initiative is tracked in a hand-maintained markdown file. A step is
> parked with a one-word "later"; months on, no one knows what "later"
> meant. The status header says three items are done, but two regressed
> and the header was never updated. A new step is added that depends on a
> parked one — nothing catches the contradiction, because the file is
> just text.

**Good:**

> The initiative is a store the agent operates by verbs. `author` adds a
> rung (rejected unless it's well-formed); `transition` parks it *only*
> with a revival trigger and runs the payoff cascade; the status view is
> regenerated from the store after each change, so it can't lie. Asking
> "what's blocked, and what's the legal next move?" is a `traverse` + a
> `describe`, not a careful re-read. A parked item with its trigger
> condition met surfaces itself at the next review.

## When to apply

- Managing a multi-step initiative whose steps are deferrable,
  terminable, and interdependent over a long horizon — especially when
  an agent will operate the tracker.
- Designing a roadmap / backlog / migration plan as a state machine
  rather than a document: bake the FSM, the validate-on-write gate, and
  the anti-amnesia constraint into the store. If the design is extensive,
  gate implementation with an `M7` axiom alignment audit.
- Replacing a prose backlog that has already produced a lost-parked-item,
  a stale-status, or an inconsistent-dependency failure.

Skip it for a short, flat, throwaway task list with no deferral, no
dependencies, and a single human reader — the engine's structure costs
more than it returns there.

## Tooling

If shipping an executable instance, keep the engine domain-neutral and
expose every tenant binding as a configuration seam — do not bake one
domain's vocabulary into the core (see [P4]):

- **Vocabulary** — the step/tier classification set is consumer-supplied
  via config (e.g. an `arc.config.json` with a `tiers` list), injected at
  validation time; the core enforces membership but defines no values.
- **Store paths** — the instance catalog path is consumer-supplied;
  resolve it against the consumer's repo root (or working directory), and
  keep the generic schema + FSM bundled with the engine.
- **Surface as data** — declare the verbs in one manifest that drives the
  dispatcher, the help/`describe` output, and input validation (see
  [P5]); guard the manifest↔handler lockstep with a real check, not a
  source grep.
- **Writes dry-run by default** — a write verb prints its would-be result
  + delta + cascade and changes nothing unless an explicit `--apply` (or
  equivalent) is passed; on reject it returns the legal-move set.
- **Regenerate views after any change** — the status digest + any spec
  projection are generated from the store and gated for parity (see
  [P3]); never hand-edit a generated view.

The reference engine is JSON-only (no modeling-language dependency); an
optional spec profile can be layered as a generated projection but must
not be load-bearing for the core gate.
