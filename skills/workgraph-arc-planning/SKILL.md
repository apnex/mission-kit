---
id: K26
category: skill
title: workgraph-arc-planning - bounded intent-to-design-seal planning arc
status: active
hydrate-when: You are planning from intent to a sealed design under a bounded arc
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

## Lifecycle position and authority boundary

The canonical lifecycle is `../arc-lifecycle/assets/workgraph-lifecycle-v1.json`.
This skill owns `intent-captured -> planning -> design-sealed`.
It produces exact admission inputs but performs no implementation seed, source, PR, merge, publication, deployment, live, entity, or closeout effect for the later implementation arc.

The forward handoff is evidence-gated:

```text
intent envelope
  -> bounded planning driver
  -> friction intake + scope fence + M7
  -> exact design candidate
  -> independent design_seal PASS
  -> design-sealed admission packet
```

A design memo, completed dependency, architect instruction, or planning driver completion is not an independent design PASS.
The design gate is mechanically staged by the architect and judged by a non-claiming independent verifier through `attest_evidence` plus `verify_attestation`.
An immutable FAIL requires a distinct repair candidate/gate/runId and remains negative evidence forever.

## Core invariant

A planning arc must produce executable structure and durable evidence, not merely a persuasive design memo.

The minimum successful output is:

1. a final design packet naming the recommended implementation arc;
2. an implementation blueprint outline with roles, dependencies, evidence, verifier gates, and anti-scope;
3. a closeout packet recording decisions, caveats, deferred items, friction, and entity disposition;
4. enough WorkGraph evidence that a cold-start architect, engineer, or verifier can reconstruct why this implementation arc is next;
5. an explicit past-friction intake/triage record showing which friction learnings were included, deferred, no-actioned, or split into separate arcs;
6. for arcs that affect operating guidance, methodology, skills, authority, proof discipline, lifecycle, delivery, verification, governance, coordination, or reusable organizational process: a direct axiom alignment audit against the current constitutional corpus (`get_constitution` / `get_axiom` provenance, A0-A14 as applicable), or an explicit not-required rationale before implementation authority is requested;
7. exact design candidate identity and an active-valid independent design PASS, with all prior FAILs preserved;
8. an admission-ready handoff naming exact blueprint requirements, authority envelope fields, effect classes, repositories/environments, anti-scope, repair policy, and non-effects without claiming approved-for-go.

## Arc-start authority envelope

A planning arc must shape implementation authority around the **bounded outcome**, not accidentally around the first provisional artifact identity.

Before requesting approval, the final design should state an authority envelope containing:

- the intended outcome and target audience;
- scope and anti-scope;
- allowed mutation classes and the irreversibility/risk ceiling;
- required safety, review, admission, rollback/disposition, and observation gates;
- which ordinary refinements are expected inside the arc, including reviewed corrective commits, replacement heads, or successor PRs produced to satisfy those gates;
- the concrete conditions that would count as material scope expansion and require new authority.

Once the Director/operator authorizes that envelope, do **not** ask again merely because implementation, review, or a failed gate produces a new exact commit, tree, branch, or successor PR within it. Bind the final exact identity at the WorkGraph admission/mutation gate and preserve fresh independent verification; exact artifact binding is proof of what will execute, not automatically a new consent ceremony.

Re-authorization is required only when the proposed successor exceeds the envelope: a different outcome or audience, a broader mutation class, higher irreversibility or risk, relaxed safeguards, new external side effects, explicit expiry/revocation, or another material anti-scope breach. If the boundary is ambiguous, request one focused clarification rather than replaying the whole approval.

When exact identity is not knowable at planning time, write a machine-checkable successor-selection rule into the design and authority request (for example: reviewed descendants of an admitted source head that only repair named gate failures and must pass fresh exact-head admission). Never reinterpret an artifact-specific approval as a standing envelope after the fact.

## Canonical blueprint asset

This skill ships a reusable template and structural proof assets:

```text
skills/workgraph-arc-planning/assets/planning-blueprint-template.json
skills/workgraph-arc-planning/assets/dependency-matrix.md
skills/workgraph-arc-planning/assets/validate-planning-blueprint.mjs
```

The mission-kit asset is the canonical source.
For live use, copy the JSON into a Hub Document or pass its `nodes` inline to `seed_blueprint` after replacing placeholders such as the run id, target entity, charter text, and evidence paths.
When copying into Hub storage, cite the mission-kit source ref and this path so the Hub document does not become anonymous forked truth.
Before promoting or reusing a changed template, run the validation fixture from the mission-kit root:

```bash
node skills/workgraph-arc-planning/assets/validate-planning-blueprint.mjs
```

## Planning sequence

A standard planning arc uses these nodes:

| Node | Role | Start dependencies | Output |
|---|---|---|---|
| `driver` | architect | none | final closeout; completion-gated on all children |
| `target_space_mapping` | architect | none | related backlog / target-space map |
| `friction_intake` | architect | target map | prior/recent friction candidates, ranking, and included/companion/deferred/no-action/separate-arc dispositions |
| `value_unlock_triage` | architect | target map + friction intake/section | value, learning, bootstrap capital, friction, risk, sequence ranking |
| `scope_fence` | architect | triage | selected candidate, in-scope, deferred, anti-scope, open design questions |
| `axiom_alignment_audit` | architect | scope fence | direct A0-A14 constitutional mapping with provenance, implementation invariants, or explicit not-required rationale |
| `current_state_inventory` | engineer | scope fence | factual implementation-surface inventory |
| `failure_mode_audit` | verifier | scope fence | proof needs, red lines, failure modes, gate criteria |
| `design_options` | architect | scope fence + inventory + audit | compared options and recommended shape |
| `feasibility_sketch` | engineer | design options + inventory | feasibility, surfaces, small/large cuts, operational risk |
| `design_gate` | architect stages; independent verifier attests without claiming | options + feasibility + audit + M7 | exact pass/fail `design_seal` |
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
- `axiom_alignment_audit` depends on `scope_fence`.
- `current_state_inventory` and `failure_mode_audit` depend on `scope_fence`.
- `design_options` depends on `scope_fence`, `axiom_alignment_audit`, `current_state_inventory`, and `failure_mode_audit`.
- `feasibility_sketch` depends on `design_options` and `current_state_inventory`.
- `design_gate` depends on `design_options`, `feasibility_sketch`, `failure_mode_audit`, and `axiom_alignment_audit`.
- `final_design_packet` depends on `design_gate`, `design_options`, `feasibility_sketch`, and `axiom_alignment_audit`.
- `planning_closeout` depends on `final_design_packet`.
- `driver.completionDependsOn` covers every child and the driver completes last.

If a planning graph violates these assertions, fix the graph before implementation authority is requested.
The canonical dependency matrix records how each runbook-required input is represented by `dependsOn`, required references, or an explicit compensating gate check; the validation fixture asserts the structural edges and includes negative checks for the prior early-gate/runbook mismatch class.

## Past-friction intake and value triage

Every planning arc must explicitly review past/recent friction before final scope is chosen. This is separate from whether the primary target is itself a friction defect.

Minimum friction intake:

- recent closeout friction reflections and Director live-closeout notes;
- duplicate/late notification noise, tool-affordance issues, coordination drag, evidence pain, stale-context, authority/SEAL friction, and lease/liveness issues relevant to the target;
- related open friction ideas/bugs/work items;
- disposition for each candidate: `included`, `companion`, `deferred`, `no-action`, or `separate-arc`;
- rationale for why included friction belongs in this arc rather than broadening it.

The target-space and triage nodes should score candidate clusters on:

- banked durable value;
- staked learning;
- bootstrap capital / forward unlock;
- recurring friction removed;
- risk retired;
- sequencing leverage;
- scope containment.

Every implementation arc should explicitly consider prior friction points.
This does not mean every arc becomes a platform project.
It means friction candidates are ranked beside capability work, then the smallest bounded arc that maximizes learning/capital/unlock is chosen.
If no friction is included, the planning packet must say why and record whether the candidates were deferred, no-actioned, or split into separate arcs.


## Direct axiom alignment

Planning arcs that affect operating guidance, methodology, skills, authority, proof discipline, lifecycle, delivery, verification, governance, coordination, or reusable organizational process must include direct constitutional alignment before implementation authority. Do not satisfy this with a vague principle summary.

The axiom alignment record must include:

- constitution provenance from `get_constitution` and/or `get_axiom` (`sourceRepo`, `sha`, `syncedAt`, `manifestHash`, and `stale` flag);
- direct mapping against A0-A14 as applicable, citing the load-bearing content of each relevant axiom;
- implementation invariants derived from the mapping;
- explicit tensions, risks, or non-applicability rationale;
- verifier/design-gate checks that the final design consumes the alignment.

For small/local planning arcs where this is not required, the planning packet must say why the arc does not affect reusable guidance, authority, proof discipline, or operating methodology.

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

## Fully-in-scope entity realization contract

When a planning arc marks a Bug or Idea `fully-in-scope`, the implementation arc must be accountable for one explicit disposition for that entity: resolved/incorporated with proof, accepted-deferred with authority, blocked with a durable blocker/revival trigger, or reclassified with a replacement ref.

Planning artifacts must include an `entityRealizationPlan` for every fully-in-scope Bug/Idea:

- canonical entity ref;
- scope role (`fully-in-scope`, `partial`, `deferred`, or `related-only`);
- closure/incorporation standard;
- required proof layers;
- realization gates in the implementation blueprint;
- disposition gate that updates the entity or records the accepted limitation;
- allowed non-closure condition.

A planning output that leaves a fully-in-scope entity to prose closeout, or lets the implementation driver complete while the entity remains open only because realization gates were omitted, is invalid.

## Design gate posture

The verifier design gate must not be claimable until the artifacts it evaluates exist.
Use the Model-B gate shape from `workgraph-verification-gates`:

- `roleEligibility: [architect]` for mechanical staging;
- exact candidate/binding/evidence-matrix executor requirements;
- a `review` requirement with `evidenceAuthority: verifier-attestation`;
- architect completes to `review` without judgment and retains the lease;
- verifier never claims or executes the WorkItem;
- verifier rehashes/reproduces checks, attests PASS/FAIL, then runs `verify_attestation`.

The gate should check:

- the recommended arc ships concrete artifacts, not prose-only methodology;
- dependencies and references match runbook-required inputs;
- validation includes a structural/negative check, not only a happy-path dry-run;
- direct axiom alignment is present for qualifying arcs, or a clear not-required rationale exists;
- closeout and survey proof requirements are load-bearing;
- active-surface claims are bounded to the strongest proven layer;
- every fully-in-scope Bug/Idea has an entityRealizationPlan row, realization gates, a disposition gate, and an allowed non-closure condition;
- anti-scope remains out of the implementation blueprint;
- exact candidate path/resourceVersion/UTF-8 bytes/SHA-256 is bound when admission requires byte-exact authority;
- the later blueprint must receive a distinct exact pre-seed PASS and final admission PASS before any seed/effect;
- a FAIL retains original candidate, evidence, lease before-state, verdict, and downstream prohibition; repair is a distinct graph.

A planning design PASS unlocks only exact blueprint/admission authoring.
It does not approve implementation.

## Planning hard stops

Stop with no implementation-authority claim when any is true:

- constitution is unavailable or `stale=true` for an M7-required arc;
- intent authority/survey handoff is missing or contradictory;
- scope fence or fully-in-scope entity realization is incomplete;
- candidate bytes/state cannot be frozen and re-read;
- design gate is absent, vacuous, self-attested, stale, or FAIL;
- blueprint/delivery/live/entity/closeout obligations are left as implicit prose;
- anti-scope is pulled into the candidate without authority.

A routine design FAIL is not a Director escalation.
Preserve it, author a distinct bounded repair, independently re-gate, and continue.

## Closeout requirements

Use `workgraph-arc-closeout` for terminal reconciliation.
A planning closeout packet should include:

- authority and target set;
- selected implementation arc and rationale;
- rejected alternatives and deferred items;
- final design refs;
- implementation blueprint outline;
- direct axiom alignment audit/provenance and implementation invariants, or explicit not-required rationale;
- entityRealizationPlan and disposition gates for every fully-in-scope Bug/Idea;
- verifier gate result;
- live Director walkthrough status: `performed`, `waived`, or `not applicable`, with ref/rationale;
- explicit friction section and follow-up routing/no-file rationale, including which related friction was included in this or the next arc and why;
- linked idea/bug/entity disposition ledger covering definitively complete, partially satisfied, deferred, deliberately not-complete/remains-open, superseded/no-action, and not-claimed items;
- final non-claims and revival triggers;
- evidence-derived lifecycle stage `design-sealed` only when the independent design PASS is fresh-valid;
- admission-ready but explicitly non-authorizing exact candidate/blueprint/authority requirements.

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
