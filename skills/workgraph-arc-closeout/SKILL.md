---
name: workgraph-arc-closeout
description: "Use at the terminal phase of a Hub WorkGraph arc to reconcile graph state, delivery truth, verifier evidence, active surfaces, backlog/stakeholder obligations, stale FYIs, and complete the arc-driver last."
metadata:
  prerequisite: workgraph-arc-operator
  related-skills: workgraph-arc-operator, workgraph-pr-delivery, workgraph-verification-gates, workgraph-recovery
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
- axiom alignment audit ref or explicit not-required rationale for extensive planning/design arcs;
- Director qualitative walkthrough trigger/tier: whether it is required, why, and the expected decision state;
- live Director walkthrough mode: `not applicable`, `required`, `performed`, or `waived`, with the trigger/waiver ref when applicable.

If the driver id is unknown, stop.
A WorkGraph arc cannot be honestly closed from a transcript alone.

## Closeout loop

### 1. Project the arc

Read `get_current_stint(driverId)`.
Record driver status, `done/total`, pending children, in-flight children, blocked children, and failed/repair/verifier nodes.

Stop if any required child is non-terminal and there is no explicit authority accepting a limitation.

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

### 4. Reconcile active surfaces

List future-facing surfaces affected by the arc and mark each `updated`, `unaffected`, `historical`, or `residual`.

For procedure or skill arcs, this is load-bearing.
Update indexes/root pointers and retire, remove, or clearly historical-mark stale scaffolds.

For this skill family, `workgraph-arc-closeout` is the canonical terminal-phase skill name.
Do not leave active guidance pointing to the old `workgraph-closeout` scaffold.

### 5. Reconcile backlog and stakeholders

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

### 6. Write the Director qualitative walkthrough when triggered

For Tier 1–3 arcs, write a Director/operator-readable projection that translates proof into meaning without replacing proof.
It must be structured, bounded, and decision-shaped.
This durable content is necessary but not sufficient for a live Director closeout: if the Director requested or clearly expects a live walkthrough, run the live protocol in step 7 or record the explicit waiver.

Required elements for a full walkthrough:

- **what shipped / changed** — concrete delivered artifact, behavior, process, or decision, with refs;
- **why it matters** — rationale and consequence in strategic/operator terms;
- **target-state delta** — before/after movement toward the desired org/system state;
- **axiom / principle mapping** — only load-bearing or supporting axioms/tensions; no decorative filler;
- **caveats / non-claims** — proof boundaries, live-not-observed, scope not delivered, or authority downgrade;
- **residuals / revival triggers** — durable ids or explicit no-file rationale;
- **decision state** — one of `no Director decision required`, `Director awareness only`, or `Director decision required` with the single decision topic and authority boundary.

Closeout-level axiom mapping is not a full M7 audit.
It is a post-evidence translation of delivered work into constitutional meaning.
Full M7 remains a pre-implementation gate when the arc creates or changes reusable methodology, workflow, skill, template, substrate behavior, governance, coordination, lifecycle, delivery, verification, or authority patterns.
If M7 produced guardrails, the walkthrough must state how closeout re-checked them.

### 7. Deliver the live Director walkthrough when requested

Use this protocol when the Director asks to be walked through the closeout, when the closeout is being delivered live in terminal/chat for the Director, or when a Director-facing interactive closeout is clearly implied.
Do not satisfy this requirement by dumping the full packet or a long markdown wall.
The live surface is an intent interface; deliver progressive disclosure.

Default live sequence:

1. Trigger/tier and what will be covered.
2. WorkGraph/substrate truth.
3. What shipped / changed.
4. Why it matters and target-state delta.
5. Axiom/principle mapping.
6. Caveats / non-claims.
7. Residuals / revival triggers.
8. Decision state and final verdict.

Protocol rules:

- Announce the step count and current step.
- Present exactly one step at a time.
- Keep each step short enough for the Director to interrogate it immediately.
- End each step with an explicit pause, e.g. `Questions, or proceed to Step N?`.
- Do not continue until the Director answers, unless the Director has explicitly waived step-by-step mode.
- If the Director asks a question, answer it, then ask whether to proceed.
- Do not provide the whole closeout packet unless the Director asks for the full dump or waives progressive mode.
- Record the live status in the packet: `performed`, `waived`, or `not applicable`, with transcript/message refs when available.
- A waiver is acceptable only when explicit: e.g. `send the whole thing`, `skip the walkthrough`, or equivalent.

The live protocol may summarize the durable packet, but it does not replace the packet.
The packet preserves zero-loss closeout evidence; the live protocol preserves Director attention and shared sensemaking.

### 8. Handle stale FYIs without loops

Messages and FYIs are signals.
When a message conflicts with WorkGraph/GitHub/Hub entity truth, trust the substrate and ack or ignore the stale signal.
Do not reopen or double-close work because a crossed FYI arrived late.

### 9. Write the closeout packet

Use `assets/closeout-packet-template.md` or a stricter project template.
The packet must exist before completing the closeout WorkItem or driver.

At minimum it records:

- identity and authority;
- final verdict and honesty statement;
- Director qualitative walkthrough when triggered;
- live Director walkthrough status (`performed`, `waived`, or `not applicable`) and refs when live delivery was requested/triggered;
- scope delivered and not delivered;
- WorkGraph final state and child dispositions;
- delivered artifacts;
- delivery/merge/release/live truth;
- verifier evidence and failed-gate repair lineage;
- active surface updates;
- backlog/entity updates and follow-up ids;
- stakeholder/Director obligations;
- stale FYI handling;
- residuals and revival triggers;
- final close action and driver-complete-last evidence.

### 10. Complete closeout, then driver last

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
- active surfaces updated or dispositioned;
- verifier and delivery truth recorded without overclaiming;
- stale FYIs acked without loops;
- closeout WorkItem done;
- driver completed last.

If any of those cannot be satisfied, block, file follow-up, or close with an explicit authority-accepted limitation rather than silently marking the arc complete.
