---
name: workgraph-arc-closeout
description: "Use at the terminal phase of a Hub WorkGraph arc to reconcile graph state, delivery truth, verifier evidence, active surfaces, backlog/stakeholder obligations, stale FYIs, and complete the arc-driver last."
metadata:
  prerequisite: workgraph-arc-operator
  related-skills: workgraph-arc-operator, workgraph-arc-participant, workgraph-pr-delivery, workgraph-verification-gates, workgraph-recovery
  series: workgraph
  parent-skill: workgraph-arc-operator
  series-role: specialist
  substrate: Hub WorkGraph / WorkItem arc-node closeout
  primary-verbs: get_current_stint, get_work, legal_moves, complete_work, update_idea, update_bug, update_mission
---

# workgraph-arc-closeout — terminal proof reconciliation

## When to use

Use this skill when a WorkGraph-controlled arc is ready to close, or when you need to prove that it is **not** ready to close.

Use it for:

- autonomous or semi-autonomous arcs with a controller-held driver WorkItem;
- code arcs with PR, CI, review, merge, release, or live-observation claims;
- procedure/skill arcs where active surfaces may drift;
- arcs that touched missions, ideas, bugs, decisions, or stakeholder obligations;
- any arc where the driver must be completed last with durable evidence.

Do not use chat, FYIs, or memory as close authority.
WorkGraph state, GitHub/CI state, Hub entities, and durable docs are the truth surfaces.

## Closeout mode disambiguation

This skill covers two related but distinct modes:

- **Substrate closeout** — terminal proof reconciliation: write/update the durable packet, complete closeout WorkItem, complete driver last.
- **Director live closeout** — the Director/operator-facing progressive walkthrough of the packet or terminal state.

If the Director/operator says `commence closeout`, `initiate closeout`, `walk me through closeout`, or equivalent, default to **Director live closeout**. Do not respond only that the WorkGraph is already closed. A live walkthrough can be requested at the end of any arc, before or after the substrate driver is done. If substrate closeout is incomplete, say what is missing and offer Step 1 only when enough truth exists; if the packet exists, start the live protocol from it.

A `not applicable` live-walkthrough row is point-in-time, not permanent. It is valid only when no live Director delivery has been requested, triggered, or implied **as of that packet version**. If the Director later requests live closeout, update or append to the closeout record and perform/waive the walkthrough; do not cite the old `not applicable` row as a reason not to proceed.

## Required inputs

Before closing, identify:

- driver WorkItem id;
- closeout WorkItem id if one exists;
- mission/arc/run id;
- scope fence and authorizing idea/decision/Director instruction;
- relevant PRs, checks, reviews, merge commits, releases, deploys, and live observations;
- verifier gate WorkItems or attestations;
- linked ideas, bugs, decisions, and follow-up items;
- active docs/skills/indexes/prompts/templates affected by the arc;
- for skill/procedure active-surface claims: upstream source ref/path, repo manifest ref, deployed manifest ref, consumer sync/restart provenance, and live active-seat availability proof or explicit exemptions;
- axiom alignment audit ref or explicit not-required rationale for extensive planning/design arcs;
- Director qualitative walkthrough trigger/tier: whether it is required, why, and the expected decision state;
- live Director walkthrough mode: `not applicable`, `required`, `performed`, or `waived`, with the trigger/waiver ref when applicable;
- live Director walkthrough proof gate (`bug-281`): exactly one of `performed`, `waived`, or `not applicable` must be valid before closeout/driver completion when live walkthrough discipline is in scope:
  - `performed` requires transcript/message refs proving the progressive sequence, pause prompts, and Director responses;
  - `waived` requires an explicit Director waiver/ref and cannot be inferred from silence or a compact summary;
  - `not applicable` requires a point-in-time rationale showing no live Director delivery was requested, triggered, or implied as of that packet version; it must be revised/appended if the Director later requests live closeout;
- minimal `bug-281` live walkthrough row when live walkthrough discipline is in scope: `performed`, `waived`, or `not applicable`, with proof/waiver/ref;
- friction rollup source: `get_current_stint` rollup and any child `frictionReflections`, including whether zero friction is credible or a dogfood caveat;
- dedicated friction section source: observed friction themes, disposition/follow-up/no-action rationale, accepted residual friction, and by-construction opportunities for both the durable packet and any live Director walkthrough;
- minimal `bug-283` / `idea-550` qualitative friction-assessment row when friction/triage discipline is in scope: dominant themes, triaged vs untriaged status, and follow-up id or no-file rationale.

If the driver id is unknown, stop.
A WorkGraph arc cannot be honestly closed from a transcript alone.

## Closeout loop

### 1. Project the arc

Read `get_current_stint(driverId)`.
Record driver status, `done/total`, pending children, in-flight children, blocked children, and failed/repair/verifier nodes.

Stop if any required child is non-terminal and there is no explicit authority accepting a limitation.

If the arc is already terminal and the current task is an audit, packet refresh, or historical verification, switch to **post-terminal audit mode**: do not attempt to re-complete terminal WorkItems; read substrate truth, record the audit scope, and make clear that evidence refresh is not a new close claim.

### 2. Inspect load-bearing evidence

Read `get_work` for children whose evidence affects close truth.
Check that evidence belongs to the current WorkItem/PR/branch and is fresh enough for the evidence requirement.

For extensive planning/design arcs, verify the `M7` axiom alignment audit exists before implementation approval, or record the explicit not-required rationale.
If the audit produced guardrails, confirm validation and closeout re-check them.

A failed verifier gate remains part of history.
A later pass must have repair/rerun evidence; it does not erase the earlier fail.

### 3. Reconcile delivery truth

Separate proof levels:

| Proof level | What it proves | What it does not prove |
|---|---|---|
| local | a command or inspection passed in one workspace | CI, review, merge, release, live behavior |
| PR opened | a proposed change exists | approval or delivery |
| reviewed | review happened | merge or deployment |
| CI green | checks passed | live runtime behavior |
| merged | mainline contains the change | package publish or deploy |
| published/deployed | artifact/environment updated | target behavior observed |
| live-observed | target behavior was actually observed | unrelated environments |
| verifier-attested | independent verifier passed the gate | broader scope than the gate |

Use the strongest true label only.
If live behavior was not observed, write `live not observed` rather than implying it.

For active skill availability, treat proof as a ladder, not a synonym set:

| Active-surface layer | What it proves | What it does not prove |
|---|---|---|
| upstream source | the skill/bundle exists at `source_repo` / `source_ref` | repo manifest intent, deployed manifest, sync, active seat availability |
| repo manifest | intended fleet configuration in the repository/ref | deployed fleet config, consumer execution, live active skill dirs |
| deployed manifest | the fleet manifest on the target host/config root matches intended fields | that the consumer ran/restarted or that seats loaded the skills |
| consumer sync/restart | the sync/seed/launcher path consumed the deployed manifest at a time/ref | every relevant live seat has the expected active files |
| live active-seat availability | each relevant live prod seat's active skill directory contains the expected skills/hashes, or has an explicit exemption | unrelated seats or future restarts |

Do not claim active skill availability from upstream source, repo manifest, or deployed manifest proof alone. A closeout may claim only the strongest observed layer; otherwise record `live not observed`, `not deployed`, `sync not proven`, or the explicit seat exemption.

### 4. Reconcile active surfaces

List future-facing surfaces affected by the arc and mark each `updated`, `unaffected`, `historical`, or `residual`.

For procedure or skill arcs, this is load-bearing.
Update indexes/root pointers and retire, remove, or clearly historical-mark stale scaffolds.

For skill availability or fleet-skill arcs, complete an active-surface proof chain before claiming availability:

| Layer | Required closeout evidence |
|---|---|
| Upstream source | `source_repo`, `source_ref`, bundle/skill path, and hash or commit proof. |
| Repo manifest intent | repository/ref manifest path and fields (`source_repo`, `source_ref`, `bundles`, `extra_skills`) that intend the delivery. |
| Deployed manifest | deployed config path/root and comparison showing those fields match the intended repo/ref. |
| Consumer sync/restart | command/log/provenance showing the skill-sync/seed/launch consumer read the deployed manifest after the intended change. |
| Live active-seat availability | per relevant live prod seat: agent/seat id, harness/config root, active skill dir, expected skills present/missing, hashes where practical, and exemption rationale if not checked. |

If any layer is missing, mark the surface `residual` or write the exact non-claim; do not collapse lower-layer proof into a higher-layer claim.

For this skill family, `workgraph-arc-closeout` is the canonical terminal-phase skill name.
Do not leave active guidance pointing to the old `workgraph-closeout` scaffold.

### 5. Reconcile friction and A10 learning

Inspect the arc friction rollup and child `frictionReflections`.
For each reflection, preserve the summary, category, producer, source WorkItem, and suggested follow-up.
Route concrete follow-ups to ideas, bugs, WorkItems, skill updates, or doc updates.

If `friction.total=0` or no child records friction, do not silently celebrate.
Record one of:

- `credible zero friction` — the arc had few/no completions or every completion explicitly used `observed:false`;
- `dogfood caveat` — the arc should have exercised friction capture but produced no records;
- `exempt` — explain why A10 friction capture did not apply.

A zero-friction arc with missing reflections is a learning failure, not proof that the process was frictionless.

When `bug-283` / `idea-550` friction-assessment discipline is in scope, add a qualitative row even if no new substrate exists yet: dominant themes, whether each theme is triaged or untriaged, and the follow-up id or explicit no-file rationale. Keep this minimum qualitative assessment separate from broad friction-platform work.

### 6. Reconcile backlog and stakeholders

Update or disposition linked missions, ideas, bugs, decisions, and follow-up WorkItems.

Every residual expected to matter later needs an id.
A residual paragraph without an Idea/Bug/WorkItem/Decision id is context, not routed work.

For stakeholder lanes, record `satisfied`, `not required`, `deferred with follow-up`, or `blocked`.
Consider architect/controller, engineer/operator, verifier, and Director/operator lanes.
Director/operator-facing sensemaking is required when the Director/operator requested or authorized the arc, the arc changes org operating procedure/tooling/skill/template/methodology/governance/coordination/lifecycle/delivery/verification/authority patterns, future agents/operators will treat the result as operating guidance, material limitations or residuals remain, or the closeout packet is the organizational memory artifact.

Use tiers to avoid ceremony bloat:

| Tier | Use when | Director-facing output |
|---|---|---|
| 0 — evidence-only local close | small local work with no Director/material procedure impact | normal evidence and close note; no qualitative walkthrough required |
| 1 — sensemaking capsule | stakeholder relevance but no broad operating change | short bullets: shipped, why, caveat, decision state |
| 2 — full Director walkthrough | Director-requested/authorized arc, WorkGraph arc with closeout burden, procedure/tooling/skill/template/org-operating change, or material residual/caveat | dedicated walkthrough covering all required elements |
| 3 — M7 + full walkthrough | extensive planning/design or reusable methodology/substrate/governance change | pre-implementation M7 audit plus closeout walkthrough re-checking guardrails |

### 7. Write the Director qualitative walkthrough when triggered

For Tier 1–3 arcs, write a Director/operator-readable projection that translates proof into meaning without replacing proof.
It must be structured, bounded, and decision-shaped.
This durable content is necessary but not sufficient for a live Director closeout: if the Director requested or clearly expects a live walkthrough, run the live protocol in step 7 or record the explicit waiver.

Required elements for a full walkthrough:

- **what shipped / changed** — concrete delivered artifact, behavior, process, or decision, with refs;
- **why it matters** — rationale and consequence in strategic/operator terms;
- **target-state delta** — before/after movement toward the desired org/system state;
- **axiom / principle mapping** — only load-bearing or supporting axioms/tensions; no decorative filler;
- **caveats / non-claims** — proof boundaries, live-not-observed, scope not delivered, or authority downgrade;
- **friction assessment** — observed friction, disposition/follow-up/no-action rationale, accepted residual friction, and by-construction opportunities;
- **residuals / revival triggers** — durable ids or explicit no-file rationale;
- **decision state** — one of `no Director decision required`, `Director awareness only`, or `Director decision required` with the single decision topic and authority boundary.

Closeout-level axiom mapping is not a full M7 audit.
It is a post-evidence translation of delivered work into constitutional meaning.
Full M7 remains a pre-implementation gate when the arc creates or changes reusable methodology, workflow, skill, template, substrate behavior, governance, coordination, lifecycle, delivery, verification, or authority patterns.
If M7 produced guardrails, the walkthrough must state how closeout re-checked them.

### 8. Deliver the live Director walkthrough when requested

Use this protocol when the Director asks to be walked through the closeout, when the closeout is being delivered live in terminal/chat for the Director, or when a Director-facing interactive closeout is clearly implied. Phrases like `commence closeout`, `initiate closeout procedure`, `start closeout`, or `walk me through the closeout` from the Director are live-walkthrough triggers unless they explicitly ask only for substrate status.

Do not satisfy this requirement by dumping the full packet or a long markdown wall. Do not answer `already done` just because the WorkGraph driver is terminal; substrate closeout and live closeout are different modes.
The live surface is an intent interface; deliver progressive disclosure.

Default live sequence:

1. Trigger/tier and what will be covered.
2. WorkGraph/substrate truth.
3. What shipped / changed.
4. Why it matters and target-state delta.
5. Axiom/principle mapping.
6. Caveats / non-claims.
7. Friction assessment.
8. Residuals / revival triggers.
9. Decision state and final verdict.

Protocol rules:

- Announce the step count and current step.
- Present exactly one step at a time.
- Keep each step short enough for the Director to interrogate it immediately.
- End each step with an explicit pause, e.g. `Questions, or proceed to Step N?`.
- Do not continue until the Director answers, unless the Director has explicitly waived step-by-step mode.
- If the Director asks a question, answer it, then ask whether to proceed.
- Do not provide the whole closeout packet unless the Director asks for the full dump or waives progressive mode.
- Record the live status in the packet: `performed`, `waived`, or `not applicable`, with transcript/message refs when available.
- Do not mark live status `performed` unless the packet cites transcript/message refs showing the progressive steps, pause prompts, and Director responses.
- Do not mark live status `not applicable` merely because the packet was written before a live request arrived; if the Director later requests live closeout, append/revise the row and perform or explicitly waive the walkthrough.
- A compact summary, full packet dump, or non-progressive closeout note is **not** `performed`; it is valid only if the Director explicitly waived progressive mode, in which case record `waived` with the waiver ref.
- A waiver is acceptable only when explicit: e.g. `send the whole thing`, `skip the walkthrough`, or equivalent.

The live protocol may summarize the durable packet, but it does not replace the packet.
The packet preserves zero-loss closeout evidence; the live protocol preserves Director attention and shared sensemaking.

### 9. Handle stale FYIs without loops

Messages and FYIs are signals.
When a message conflicts with WorkGraph/GitHub/Hub entity truth, trust the substrate and ack or ignore the stale signal.
Do not reopen or double-close work because a crossed FYI arrived late.

### 10. Write the closeout packet

Use `assets/closeout-packet-template.md` or a stricter project template.
The packet must exist before completing the closeout WorkItem or driver.

At minimum it records:

- identity and authority;
- final verdict and honesty statement;
- Director qualitative walkthrough when triggered;
- live Director walkthrough proof gate (`performed` with transcript/message ref, `waived` with explicit waiver ref, or `not applicable` with rationale) when live delivery was requested/triggered or live walkthrough discipline is in scope;
- scope delivered and not delivered;
- WorkGraph final state and child dispositions;
- delivered artifacts;
- delivery/merge/release/live truth;
- verifier evidence and failed-gate repair lineage;
- active surface updates;
- for active skill availability claims: upstream source, repo manifest, deployed manifest, consumer sync/restart, and live active-seat proof/exemptions as separate rows;
- backlog/entity updates and follow-up ids;
- stakeholder/Director obligations;
- stale FYI handling;
- friction rollup, categories, follow-up routing, and zero-friction caveat/exemption if applicable;
- `bug-281` live walkthrough proof/waiver/not-applicable row when in scope;
- `bug-283` / `idea-550` qualitative friction-assessment row when in scope;
- residuals and revival triggers;
- final close action and driver-complete-last evidence.

### 11. Complete closeout, then driver last

Complete the closeout WorkItem with the packet as evidence.
Then re-read `get_current_stint(driverId)`.
Complete the driver only when the completion gate is open and the packet remains current.

Driver evidence should include the closeout packet path, final child progress, delivery truth summary, verification refs, entity updates, Director qualitative walkthrough status, live Director walkthrough performed/waived/not-applicable status, and accepted limitations.

## Hard stop conditions

Do not complete the closeout WorkItem or driver if any are true:

- the driver id is missing or is not the controlling arc node;
- required children are non-terminal without accepted limitation;
- the closeout packet is missing;
- an unmerged/red/unknown PR is claimed as delivered;
- CI/build/package proof is claimed as live observation;
- a failed verifier gate is hidden or unresolved;
- an extensive planning/design arc lacks an axiom alignment audit or explicit not-required rationale;
- active future-facing guidance still points to stale behavior or a retired scaffold;
- active skill availability is claimed from upstream/repo/deployed proof without consumer sync/restart provenance and live active-seat proof or explicit exemption;
- friction rollup is not inspected, or zero-friction is treated as success without explicit no-friction records, exemption, or dogfood caveat;
- `bug-281` live walkthrough proof/waiver/not-applicable row is missing when live walkthrough discipline is in scope;
- `bug-281` row marks `performed` without transcript/message refs proving progressive delivery, pause prompts, and Director responses;
- compact summary or packet dump is treated as performed live walkthrough without an explicit Director waiver;
- dedicated friction section is absent from the durable walkthrough/packet, or from the live sequence when live Director delivery is triggered;
- `bug-283` / `idea-550` qualitative friction-assessment row is missing when friction/triage discipline is in scope;
- residual work exists only in prose;
- stakeholder or Director/operator obligations are skipped without rationale;
- a required Director qualitative walkthrough is absent, lacks decision state, or omits material caveats/non-claims;
- a live Director walkthrough was requested/triggered but was not performed, explicitly waived, or recorded;
- a full closeout dump is used as a substitute for the progressive live walkthrough without Director waiver;
- mission/idea/bug state contradicts the closeout claim;
- stale chat/FYI is treated as stronger than WorkGraph/GitHub/Hub entity truth;
- scope expands during closeout without authority;
- the driver would complete before closeout evidence.

## Output

A successful closeout leaves:

- a durable closeout packet;
- a Director-readable qualitative walkthrough when triggered, including decision state;
- a progressive live Director walkthrough performed or explicitly waived when live delivery was requested/triggered;
- updated Hub entities and backlog follow-ups;
- active surfaces updated or dispositioned, with active skill availability separated into upstream source, repo manifest, deployed manifest, consumer sync/restart, and live active-seat proof where claimed;
- verifier and delivery truth recorded without overclaiming;
- `bug-281` live walkthrough and `bug-283` / `idea-550` friction minimums recorded when in scope;
- stale FYIs acked without loops;
- friction records summarized and routed, with zero-friction honestly classified;
- closeout WorkItem done;
- driver completed last.

If any of those cannot be satisfied, block, file follow-up, or close with an explicit authority-accepted limitation rather than silently marking the arc complete.
