---
name: workgraph-arc-closout
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

# workgraph-arc-closout — terminal proof reconciliation

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
- active docs/skills/indexes/prompts/templates affected by the arc.

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

For this skill family, `workgraph-arc-closout` is the canonical terminal-phase skill name.
Do not leave active guidance pointing to the old `workgraph-closeout` scaffold.

### 5. Reconcile backlog and stakeholders

Update or disposition linked missions, ideas, bugs, decisions, and follow-up WorkItems.

Every residual expected to matter later needs an id.
A residual paragraph without an Idea/Bug/WorkItem/Decision id is context, not routed work.

For stakeholder lanes, record `satisfied`, `not required`, `deferred with follow-up`, or `blocked`.
Consider architect/controller, engineer/operator, verifier, and Director/operator lanes.
Director/operator-facing summary is required when the Director/operator requested the arc, the arc changes org operating procedure/tooling, or material limitations remain.

### 6. Handle stale FYIs without loops

Messages and FYIs are signals.
When a message conflicts with WorkGraph/GitHub/Hub entity truth, trust the substrate and ack or ignore the stale signal.
Do not reopen or double-close work because a crossed FYI arrived late.

### 7. Write the closeout packet

Use `assets/closeout-packet-template.md` or a stricter project template.
The packet must exist before completing the closeout WorkItem or driver.

At minimum it records:

- identity and authority;
- final verdict and honesty statement;
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

### 8. Complete closeout, then driver last

Complete the closeout WorkItem with the packet as evidence.
Then re-read `get_current_stint(driverId)`.
Complete the driver only when the completion gate is open and the packet remains current.

Driver evidence should include the closeout packet path, final child progress, delivery truth summary, verification refs, entity updates, and accepted limitations.

## Hard stop conditions

Do not complete the closeout WorkItem or driver if any are true:

- the driver id is missing or is not the controlling arc node;
- required children are non-terminal without accepted limitation;
- the closeout packet is missing;
- an unmerged/red/unknown PR is claimed as delivered;
- CI/build/package proof is claimed as live observation;
- a failed verifier gate is hidden or unresolved;
- active future-facing guidance still points to stale behavior or a retired scaffold;
- residual work exists only in prose;
- stakeholder or Director/operator obligations are skipped without rationale;
- mission/idea/bug state contradicts the closeout claim;
- stale chat/FYI is treated as stronger than WorkGraph/GitHub/Hub entity truth;
- scope expands during closeout without authority;
- the driver would complete before closeout evidence.

## Output

A successful closeout leaves:

- a durable closeout packet;
- updated Hub entities and backlog follow-ups;
- active surfaces updated or dispositioned;
- verifier and delivery truth recorded without overclaiming;
- stale FYIs acked without loops;
- closeout WorkItem done;
- driver completed last.

If any of those cannot be satisfied, block, file follow-up, or close with an explicit authority-accepted limitation rather than silently marking the arc complete.
