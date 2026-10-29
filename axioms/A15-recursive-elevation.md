---
id: A15
category: axiom
title: Recursive Elevation
status: active
hydrate-when: You have completed a recurring report, review, or incident recovery and are deciding whether the mechanism itself should move one rung higher
applies-to: [any-system, autonomous, multi-agent]
related: [A6, A8, A10, A11, A13, A14]
---

# A15 - Recursive Elevation

## Mandate

Every recurring operational loop, report, or recovery is a temporary scaffold whose standing duty is to **climb one rung higher on the mechanization ladder** until the failure class is structurally unrepresentable.The everyday verb for this move is **Lift**.Whereas [A10](A10-autopoietic-evolution.md) requires that encountered friction be mined and [A11](A11-cognitive-minimalism.md) requires that deterministic code replace model cognition at a given boundary, Recursive Elevation governs the **ratchet across rungs over time**: no scheduled report, review cadence, or incident post-mortem is complete until it records what would eliminate the need for that recurring step or move it one altitude higher.

---

## Mechanics

- **The six-rung elevation ladder.** Every operational concern sits on an explicit rung and ratchets upward through reversible waypoints:
  1. *Rung 0 - Ad-hoc manual action*: an operator notices a problem and intervenes by hand.
  2. *Rung 1 - Documented runbook or checklist*: prose instructions standardize the manual response.
  3. *Rung 2 - Deterministic script or CLI*: tested code executes the procedure on demand.
  4. *Rung 3 - Scheduled or timer-driven job*: a recurring cadence runs the check without human initiation.
  5. *Rung 4 - Event-driven hook or state-transition gate*: the check fires immediately on the state change that matters, with zero polling tax.
  6. *Rung 5 - Structural schema or compiler invariant*: the underlying state store or type contract makes the violation unrepresentable at write time.
- **The opening question and four-column price list.** Every elevation inquiry opens with the exact question: *"Hypothetically, what would it take to achieve this outcome one rung higher, or to not need this step at all?"* Each candidate answer carries a four-column price list before commitment:
  1. *Implementation cost* (lines of code, complexity, and verification surface).
  2. *Maintenance and runtime cost* (steady-state compute, polling, or cognitive tax).
  3. *Blast radius on failure* (what breaks if the automated mechanism misfires and how it rolls back).
  4. *Break-even horizon* (how many recurrences or days until the one-time capital cost pays back the recurring tax).
- **Mandatory counterparty asymptote challenge.** No actor ratifies its own `Lift` proposal alone. An independent counterparty challenges every proposal against two failure modes before disposition: *under-elevation* (stopping at a scheduled check when a write-time schema guard costs the same) and *premature over-elevation* (building complex infrastructure for a one-off event whose break-even horizon will never arrive). Every challenged proposal ends in an explicit recorded disposition: `BUILD` (with owner and deadline), `DEFER` (with a falsifiable revival trigger in the backlog), or `DROP` (with rationale).
- **Universal output `Lift` invariant.** Any schedule, cadence, or interval that produces a report, log, or analysis - including engineering reports, operational logs, regular friction analyses, board sweeps, set analyses, and corpus audits - is automatically subject to Recursive Elevation once its primary output is complete. Every such output must conclude with an explicit `Lift` step stating what it would take to eliminate the need for that recurring output or elevate its mechanism one rung higher, recorded with a single `owner` and `target date`. Incident root-cause analyses cannot close without a recorded `Lift` step.
- **The human-gate filter.** Before escalating a design or operational question to the human director, collaborating agents apply a strict filter: if the question can be settled from held evidence, source truth, or standing charter invariants, the agents decide it, record the reasoning in an append-only decision record, and surface the ruling in the periodic operational log where the director may overrule. Only genuine authority calls - charter intent or trade-offs, access or production rights, external commitments, or budget - escalate to the director, and every escalation arrives pre-decided with a recommended option and default.
- **Self-application and the learning-attention guardrail.** The elevation discipline applies to its own governance cadences: periodic review loops must challenge their own schedule and mechanism, score the realized value of prior `Lift`s per [A14](A14-compounding-learning.md) (including indirect returns and forward capital: banked insights, invariants before build, and deleted friction), and bring in at least one outside-in idea from beyond the active loop. Operational toil is driven toward zero, while learning attention is structurally protected: an ideation or friction-analysis cadence is never retired merely because a single tick yielded zero immediate code changes, provided its inquiries remain adjacent to load-bearing infrastructure and its findings are durably captured.

---

## Rationale

Without a standing upward ratchet, even a disciplined engineering system stagnates at Rung 2 or Rung 3: scripts accumulate into cron jobs, cron jobs emit growing streams of status reports, and agents spend increasing fractions of their capacity reading, acknowledging, and reconciling recurring outputs.Local completion rules ([A10](A10-autopoietic-evolution.md)) ensure that a broken step is fixed, and cognitive minimalism ([A11](A11-cognitive-minimalism.md)) ensures that a step uses code rather than prose, but neither forces the system to ask why the step still exists as a recurring loop at all.Binding the `Lift` step to the completion of every scheduled report, log, analysis, and incident post-mortem turns routine operational cadence into a self-eliminating engine: every report must justify its continued existence by naming the structural move that would make its manual or scheduled form obsolete.

---

## Faults

- **Plateaued Mechanization** - a concern reaches a working script or cron job (Rung 2 or Rung 3) and stays there indefinitely when a write-time gate (Rung 5) would eliminate the entire polling and alerting loop.
- **Report Accumulation** - recurring reports, logs, and audits multiply without a closing `Lift` step; the organization measures the same friction every day instead of deleting the mechanism that produces it.
- **Solo Elevation Bias** - an author designs and ratifies their own automation without a counterparty asymptote challenge, either under-aiming at a patch or over-engineering a speculative framework.
- **Upward Delegation of Settleable Choices** - agents interrupt a context-limited human director with questions decidable from held evidence or charter rules, converting autonomous elevation into human-gated triage toil.
- **Unpriced Ambition** - a `Lift` proposal states a desirable end state without an implementation cost, blast radius, or break-even horizon, causing disruptive big-bang rewrites instead of stable, self-paying waypoints.

---

## Success signals
You'll know it holds when:
1. Every completed report, operational log, friction analysis, audit, and incident post-mortem ends with a concrete `Lift` step recorded with an explicit `owner` and `target date`.
2. Every `Lift` proposal opens with a `"Hypothetically, what would it take to...?"` question, a four-column price list, and an independent counterparty asymptote challenge before entering the build queue.
3. The count of recurring manual and scheduled administrative operations per day trends monotonically downward as checks migrate from runbooks and timers (Rungs 1-3) into event hooks and write-time schema invariants (Rungs 4-5).
4. Periodic governance reviews audit realized `Lift` payback (including banked insights, invariants before build, and deleted friction) and contribute at least one outside-in architectural challenge per review cycle.
5. Zero questions decidable from held evidence or standing charter invariants are escalated to the human director; all human escalations are true authority calls accompanied by a recommended default.
