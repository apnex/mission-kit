---
name: workgraph-arc-planning
description: "Use before an implementation arc is committed, to run a bounded WorkGraph planning/design arc that maps the target space, ranks value/unlock/friction, fences scope, gathers engineer/verifier inputs, gates the design, and closes with reusable evidence rather than chat memory."
metadata:
  related-skills: workgraph-arc-operator, workgraph-arc-participant, workgraph-arc-closeout, survey, arc-lifecycle
  series: workgraph
  series-role: planning
  facet: plan — reusable WorkGraph planning/design arc methodology
  substrate: Hub WorkGraph / seed_blueprint / WorkItem planning arc
  primary-verbs: seed_blueprint, get_current_stint, get_next_action, get_work, complete_work
---

# workgraph-arc-planning — plan a bounded implementation arc through WorkGraph

## When to use

Use this skill before committing to an implementation arc when the target is still open enough that the organization needs structured planning/design rather than immediate code.

Use it for:

- selecting the next bounded strategic-unlock arc from a target set;
- turning backlog/survey/friction signals into a scoped implementation blueprint;
- running target-space mapping, value/unlock triage, scope fencing, engineer inventory, verifier audit, design options, feasibility, design gate, final design, and closeout as WorkItems;
- banking a reusable planning packet so later implementation agents start from captured intent and substrate truth.

Do not use it to implement the selected arc.
The planning arc chooses and specifies an implementation arc; the implementation arc is separately seeded after authority approves the final design.

## Core invariant

A planning arc must produce executable structure and durable evidence, not merely a persuasive design memo.

The minimum successful output is:

1. a final design packet naming the recommended implementation arc;
2. an implementation blueprint outline with roles, dependencies, evidence, verifier gates, and anti-scope;
3. a closeout packet recording decisions, caveats, deferred items, friction, and entity disposition;
4. enough WorkGraph evidence that a cold-start architect, engineer, or verifier can reconstruct why this implementation arc is next.

## Canonical blueprint asset

This skill ships a reusable template at:

```text
skills/workgraph-arc-planning/assets/planning-blueprint-template.json
```

The mission-kit asset is the canonical source.
For live use, copy the JSON into a Hub Document or pass its `nodes` inline to `seed_blueprint` after replacing placeholders such as the run id, target entity, charter text, and evidence paths.
When copying into Hub storage, cite the mission-kit source ref and this path so the Hub document does not become anonymous forked truth.

## Planning sequence

A standard planning arc uses these nodes:

| Node | Role | Start dependencies | Output |
|---|---|---|---|
| `driver` | architect | none | final closeout; completion-gated on all children |
| `target_space_mapping` | architect | none | related backlog / target-space map |
| `value_unlock_triage` | architect | target map | value, learning, bootstrap capital, friction, risk, sequence ranking |
| `scope_fence` | architect | triage | selected candidate, in-scope, deferred, anti-scope, open design questions |
| `current_state_inventory` | engineer | scope fence | factual implementation-surface inventory |
| `failure_mode_audit` | verifier | scope fence | proof needs, red lines, failure modes, gate criteria |
| `design_options` | architect | scope fence + inventory + audit | compared options and recommended shape |
| `feasibility_sketch` | engineer | design options + inventory | feasibility, surfaces, small/large cuts, operational risk |
| `design_gate` | verifier | options + feasibility + audit | pass/fail design gate |
| `final_design_packet` | architect | gate + options + feasibility | implementation arc design packet |
| `planning_closeout` | architect | final design packet | planning closeout and entity disposition |

The sequence is intentionally redundant across roles: the architect frames, the engineer grounds feasibility in current surfaces, and the verifier attacks false confidence before implementation starts.

## Dependency discipline

Every runbook-required input must be represented structurally when possible.
Use `dependsOn` when the input is another WorkItem's output.
Use required `references` when the input already exists at seed time.
Use a compensating gate check only when the input is a future sibling artifact that cannot exist yet at seed time.

Minimum structural assertions:

- `value_unlock_triage` depends on `target_space_mapping`.
- `scope_fence` depends on `value_unlock_triage`.
- `current_state_inventory` and `failure_mode_audit` depend on `scope_fence`.
- `design_options` depends on `scope_fence`, `current_state_inventory`, and `failure_mode_audit`.
- `feasibility_sketch` depends on `design_options` and `current_state_inventory`.
- `design_gate` depends on `design_options`, `feasibility_sketch`, and `failure_mode_audit`.
- `final_design_packet` depends on `design_gate`, `design_options`, and `feasibility_sketch`.
- `planning_closeout` depends on `final_design_packet`.
- `driver.completionDependsOn` covers every child and the driver completes last.

If a planning graph violates these assertions, fix the graph before implementation authority is requested.

## Value and friction triage

The target-space and triage nodes should score candidate clusters on:

- banked durable value;
- staked learning;
- bootstrap capital / forward unlock;
- recurring friction removed;
- risk retired;
- sequencing leverage;
- scope containment.

Every implementation arc should explicitly consider at least one prior friction point.
This does not mean every arc becomes a platform project.
It means friction candidates are ranked beside capability work, then the smallest bounded arc that maximizes learning/capital/unlock is chosen.

## Survey inputs

If a survey informs the planning arc, treat the survey envelope as load-bearing input.
The design must consume:

- per-question interpretations;
- per-round aggregate interpretations;
- Round 2 anchoring against Round 1;
- final composed intent;
- axiom/principle anchoring;
- calibration notes.

If those fields are missing, record the gap and either repair the survey artifact or make the limitation explicit in the design packet.

## Design gate posture

The verifier design gate must not be claimable until the artifacts it evaluates exist.
The gate should check:

- the recommended arc ships concrete artifacts, not prose-only methodology;
- dependencies and references match runbook-required inputs;
- validation includes a structural/negative check, not only a happy-path dry-run;
- closeout and survey proof requirements are load-bearing;
- active-surface claims are bounded to the strongest proven layer;
- anti-scope remains out of the implementation blueprint.

## Closeout requirements

Use `workgraph-arc-closeout` for terminal reconciliation.
A planning closeout packet should include:

- authority and target set;
- selected implementation arc and rationale;
- rejected alternatives and deferred items;
- final design refs;
- implementation blueprint outline;
- verifier gate result;
- live Director walkthrough status: `performed`, `waived`, or `not applicable`, with ref/rationale;
- explicit friction section and follow-up routing/no-file rationale;
- linked idea/bug disposition or residual status;
- final non-claims and revival triggers.

Do not mark a live walkthrough as `performed` unless there is a transcript/message ref for progressive walkthrough, or the Director explicitly waived progressive mode.

## Active-surface truth boundary

If a planning or implementation arc changes skills/templates and claims active availability, prove the whole chain:

1. upstream source ref/path;
2. repo manifest intent;
3. deployed manifest ref/pin;
4. consumer sync/materialization evidence;
5. live seat skill directory / ledger / hash proof;
6. reload/relaunch boundary for running prompt contexts.

If only source/repo artifacts changed, say source/repo only.
Do not imply running agents loaded new guidance unless reload/relaunch or equivalent runtime evidence exists.

## Anti-scope guard

A planning arc may identify future platform work, but must not smuggle it into the implementation arc.
Common anti-scope examples:

- live runtime reload hooks;
- unified actuator architecture;
- Hub-native skill telemetry;
- new Survey entity/substrate;
- SEAL/verifier-attestation repair;
- PR lifecycle or merge-queue repair;
- full friction triage substrate.

Record these as deferred candidates with revival triggers rather than implementing them inside the planning-standardization arc.
