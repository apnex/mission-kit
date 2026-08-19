---
id: W20
category: work-type
title: reconcile-ledger - reconcile entity/backlog state vs truth
status: active
hydrate-when: Entity or backlog state has diverged from truth and you are reconciling it
roleEligibility: [architect, verifier]
evidenceContract:
  - kind: freeform
    description: before/after entity states, script/query output, reopen reasons
evidenceAuthority: executor-evidence
domainEligibility: [coordination-substrate]
domainFreedom: pinned
parameters:
  - name: target
    fills: the ledger/backlog to reconcile
    bindingSource: discover-from-substrate
generationMode: proactive-poolable
falsifier: ledger state contradicts git/live truth
compositionHooks: proactive-poolable under constraint 7 — executor-evidence, so it carries a mandatory bracketing verify-gate the idle engine instantiates alongside it; its closure does not count as assurance until that independent gate consumes the before/after evidence. Reopens/state-corrections it emits seed follow-up nodes via a reactive-triggered edge.
---

# W20 — reconcile-ledger

## Definition

A sweep that walks a ledger or backlog and reconciles each recorded entity state
against live truth — git, the running substrate, `get_backlog_health` — correcting
drift (stale-open, wrongly-closed, orphaned) and recording the reopen reasons. The
value is the truth-grounded delta, not a "ledger looks fine" assertion.

## Evidence & closeability

The evidence contract is a single `freeform`: **before/after entity states,
script/query output, and reopen reasons**. The closeability preflight is the
canonical constraint set in `work-types/README.md` — satisfied, not restated. As a
`proactive-poolable` **executor-evidence** type, **constraint 7** is load-bearing:
it may only enter the idle pool carrying its mandatory bracketing `verify-gate`
compositionHook, so no self-produced reconciliation reaches terminal `done` on an
unevaluated falsifier. **Constraint 3** binds the `target` param's
`discover-from-substrate` bindingSource (and `domainFreedom: pinned` fixes the
domain to `coordination-substrate`) so the reconciled ledger resolves to a real
entity. **Constraint 5** binds via the falsifier.

## Generation

`proactive-poolable` — mintable against the existing substrate with no trigger, so
it enters the idle-QoS pool (idea-403/404) as idle-poolable reconciliation work.
idea-425/451/403 instantiate it as an idle architect/verifier discovering a ledger
from substrate, binding `target`, diffing recorded state against git/live truth,
and emitting a corrected before/after with reopen reasons — bracketed by the
constraint-7 verify-gate. The falsifier is **ledger state contradicts git/live
truth**: an entity whose recorded state cannot be squared with the ground truth
fires it, driving a correction rather than a clean close. This falsifier must be
able to fire — a reconciliation that never checks against truth is not closeable.

## Axiom alignment

- **A1** — Sovereign State Transparency: all system truth lives in one backplane
  and any drift between a ledger's recorded state and the ground truth is a
  transparency fault; this work-type is the mechanism that keeps the perceived
  state equal to the real state.
- **A8** — Law of Fallback: reconciliation grounds each entity against the base
  layer of truth (git/live substrate), never patching the ledger row where the
  symptom shows without auditing the state that actually diverged.
