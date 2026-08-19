---
name: workgraph-arc-participant
description: "Use when you are a participant in a Hub WorkGraph arc rather than the arc driver: arriving at assigned work, reading runbooks/references, claiming/starting/completing safely, reporting frictionReflection, handling stale notifications, and respecting verifier/SEAL boundaries."
metadata:
  related-skills: arc-lifecycle, workgraph-arc-operator, workgraph-verification-gates, workgraph-pr-delivery, workgraph-recovery, workgraph-arc-closeout
  series: workgraph
  series-role: participant
  facet: participate - execute or verify a WorkGraph node correctly
  substrate: Hub WorkGraph / WorkItem node-contract / completion evidence / frictionReflection
  primary-verbs: get_work, get_current_stint, get_next_action, legal_moves, claim_work, start_work, renew_lease, complete_work, attest_evidence, ack_message
---

# workgraph-arc-participant - act inside a WorkGraph arc

## When to use

Use this skill when you are assigned, woken, or otherwise participating in a Hub WorkGraph arc and you are **not** the arc driver/controller.

Use it for:

- engineer implementation nodes;
- verifier gates and advisory reviews;
- architect participant nodes inside another controller's arc;
- actionable WorkItem notifications, claimable-digest wakes, lease-stall prompts, or manual checks;
- completing WorkItems with evidence and `frictionReflection`.

The arc driver uses `workgraph-arc-operator` to govern the arc.\
You use this skill to act correctly at the node level so the driver can orchestrate at a higher altitude.

---

## Not for

- Choosing the arc's strategic direction - use `arc-lifecycle`, `survey`, or the arc driver's plan.
- Seeding blueprints or changing the arc graph - use `workgraph-arc-operator` / blueprint guidance unless your runbook explicitly asks you to author the graph.
- Terminal closeout reconciliation - use `workgraph-arc-closeout`.
- GitHub-only work that is not represented by a WorkItem.

---

## Lifecycle position and assignment boundary

The canonical lifecycle is `../arc-lifecycle/assets/workgraph-lifecycle-v1.json`.\
This skill governs node execution at any stage; it does not own the arc-level stage transition.\
Readiness is not assignment.\
Claim only the explicit WorkItem/role/scope assigned to you, and do not claim another ready node absent controller assignment.

A participant may perform only the effect classes frozen in the node contract.\
A code node that says commit/PR evidence does not authorize merge, publication, distribution, deploy, restart, live exercise, entity disposition, or closeout.\
A verifier seat uses `workgraph-verification-gates` and never claims the WorkItem whose verifier-attestation it supplies.

---

## Director closeout requests while participating

If the Director/operator asks to `commence closeout`, `initiate closeout`, `walk through closeout`, or similar while you are a participant, do not answer as if this is merely a stale WorkItem notification or a generic status query.

Fresh-read the arc if you know the driver id, then route by role:

- If you are the arc driver/controller, switch to `workgraph-arc-closeout` and begin or resume the Director live closeout protocol.
- If you are not the driver, do not improvise the official closeout. State the current substrate truth you can verify and notify/handoff to the driver/controller that the Director requested live closeout.
- If the substrate closeout packet already exists, the Director request still matters: it means the live walkthrough is requested now. A prior `not applicable` packet row is not a permanent refusal; it should be corrected by the driver in closeout records.

---

## Core rule - fresh WorkGraph truth beats memory

Treat messages, FYIs, and chat context as signals, not authority.\
Before acting, fresh-read the WorkItem and relevant projections.

Minimum arrival read:

1. `get_work(workId, includeCompletionProgress:true)`.
2. Read the WorkItem `runbook`, `references`, `targetRef`, `dependsOn`, `completionDependsOn`, and `evidenceRequirements`.
3. `legal_moves(workId)` to see what you can actually do from your seat.
4. If the node is inside an arc and the driver id is known, use `get_current_stint(driverId)` or `get_next_action(driverId)` for arc context.

Do not act from a notification alone.\
If a notification says a node is ready but the fresh read says terminal, paused, held by another agent, blocked, or no longer claimable, treat the notification as stale and ack/ignore it.

---

## Arrival / next-action behavior

When you receive a ready/unblocked/claimable notification:

1. Claim the Message if applicable (`claim_message`).
2. Fresh-read the WorkItem.
3. If it is terminal or not currently yours to act on, ack the message and stop.
4. If `legal_moves.claim` is true and the node is in scope, `claim_work`.
5. Immediately `start_work` before doing substantive work.
6. Save the lease token; every lease-bound verb needs it.
7. If the work will take a while, renew the lease during each active turn.

If `legal_moves` says no, do not force a path from memory.\
Use the reason: WIP-capped, quarantined, dependency-gated, not holder, not creator, paused, completion-gated, or terminal.

---

## Read the node-contract

A WorkItem node-contract has three load-bearing legs:

| Leg | Field | What you do |
|---|---|---|
| Start gate | `dependsOn` | tells when the node may be claimed |
| Inputs | `runbook` + `references` + `targetRef` | tells what to read and what the node is about |
| Outputs | `evidenceRequirements` + `frictionReflection` | tells what must be produced to complete |

Read `references` before improvising.\
A `mode: triangulate-against` reference is not background color; it is an explicit cross-check input.

Before **every effect**, satisfy the node's authority fence locally:

1. fetch every frozen authority/manifest reference;
2. independently compute exact UTF-8 bytes/hash or storage-specific identity;
3. match path/resourceVersion/bytes/hash to the inline binding and fresh listing/currentness evidence;
4. fresh-verify required design/blueprint/final/effect gates with `verify_attestation`;
5. require constitution `stale=false` when the fence says so;
6. confirm actor, repository, environment, effect class, scope, and assignment are explicitly authorized;
7. require no active FAIL, pause, recall, currentness mismatch, protected-delivery denial, or P0/readiness prohibition.

Dependencies, instructions, a controller message, and a completed commencement node are not proof substitutes.\
Unreadable or mismatched authority means block with **no effect**.

If a required reference is inaccessible, stale, ambiguous, or points at a missing artifact, do not paper over it.\
Block or ask through the WorkGraph, and report `runbook_confusion` or `stale_context` friction if it affected the work.

---

## Claim/start/lease discipline

- Claim only the explicitly assigned, ready, dependency-met, role-eligible WorkItem.
- Start the claimed work before doing it; a long `claimed` gap is limbo.
- Renew while you are actively working.
- If blocked, use `block_work` with a concrete blocker reference and reason.
- If you cannot continue and the work should be picked up by another eligible agent, use `release_work`.
- If the work is invalid or superseded and you have authority, use the legal terminal path; otherwise surface it.
- Never release, abandon, expire, prune, or migrate a mandatory failed-gate lease to free WIP; retain it until deployed failed-seal mechanics lawfully clear live authority while preserving before-state.
- Never keep an ordinary lease just to avoid admitting uncertainty.

A paused WorkItem is dormant, not an instruction to act.\
Only act on it after an explicit unpause/update and a fresh legal move.

---

## Evidence discipline

Complete WorkItems with artifacts, not vibes.

Good evidence includes:

- PR URL or merge commit for code;
- CI/check-run URL or command output for tests;
- Hub document path for designs, audits, traces, and packets;
- review or verifier attestation id for independent proof;
- bug/idea/mission ids for backlog changes;
- explicit note separating code proof, CI proof, merge proof, deploy proof, and live observation.

Bind every evidence item to the correct `evidenceRequirements[].id`.\
Do not double-count one artifact for two requirements unless the evidence contract permits it.\
Do not claim live behavior if you only observed local/CI/merge truth.\
Write `live not observed` when that is the truth.\
For source work, report repository, clean worktree, branch, base SHA, commit/tree, changed paths, tests, PR/head/base, and explicit non-effects.\
Use `workgraph-pr-delivery` before opening a PR or claiming any delivery layer.

---

## Friction reflection is part of completion

Every `complete_work` call should include a conscious `frictionReflection`.\
This is not an essay requirement; it is how the org learns where WorkGraph, runbooks, tools, and coordination are still awkward.

Use `observed:false` when no friction was observed:
```json
{
  "observed": false,
  "summary": "no friction observed",
  "suggestedFollowUp": { "kind": "none" }
}
```

Use `observed:true` when friction affected the work:
```json
{
  "observed": true,
  "summary": "required reference pointed at an unpushed local path; I had to recover it from chat",
  "categories": ["runbook_confusion", "stale_context"],
  "suggestedFollowUp": {
    "kind": "skill_update",
    "text": "Add seed-time/accessibility check guidance to blueprint authoring."
  }
}
```

### Friction categories

Use the closest category or categories:

| Category | Use when |
|---|---|
| `tool_affordance` | the tool made the correct action awkward, impossible, or misleading |
| `runbook_confusion` | instructions were unclear, stale, incomplete, or contradicted the node-contract |
| `evidence_pain` | evidence was hard to produce, bind, freshness-prove, or make resolvable |
| `coordination_drag` | ownership, wait state, handoff, or crossed-message friction slowed the work |
| `lease_or_liveness` | lease expiry, heartbeat, session, quota, WIP-cap, or liveness got in the way |
| `authority_or_seal` | verifier, SEAL, self-attestation, approval, or authority boundary was unclear |
| `stale_context` | old notifications, wrong branch/head, compacted memory, or stale docs misled the work |
| `manual_step` | success depended on manual choreography or remembered operator behavior |
| `scope_drift` | pressure to expand beyond the runbook or current slice appeared |
| `other` | only when none of the above fits |

Keep the reflection short and concrete.\
Name the mechanism or missing mechanism, not just the feeling.

### Follow-up routing

Pick the follow-up kind honestly:

| Follow-up | Use when |
|---|---|
| `none` | no routed follow-up is needed |
| `bug` | a defect/regression/wrong behavior exists |
| `idea` | a future enhancement or mechanization should be considered |
| `work` | authorized executable follow-up is immediately needed |
| `skill_update` | the guidance should change |
| `doc_update` | a durable doc/runbook should change |

If you choose `bug`, `idea`, or `work` but cannot create it yourself, include enough text for the arc driver to route it.

---

## Completing work

Before `complete_work`:

1. Re-read `get_work` if your context may be stale.
2. Check `legal_moves.complete`.
3. Confirm evidence covers every requirement.
4. Confirm any completion gate is open (`includeCompletionProgress` helps on arc nodes).
5. Include `frictionReflection`.

If evidence is ready but friction reflection is missing, add the reflection rather than trying to bypass completion.\
If the Hub policy stores evidence but blocks terminal advance until reflection is present, treat that as designed steering, not a failure.

---

## Verifier posture

If you are verifying:

- Do not self-attest work you authored, held, or executed when SEAL forbids it.
- Check `targetRef`, requirement authority, executor history, and related evidence before stamping.
- Use `attest_evidence` only for `evidenceAuthority: verifier-attestation` requirements.
- A passing verifier note is not a WorkGraph completion unless the requirement is actually satisfied and the WorkItem advances through the legal path.
- Do not terminalize stale gates merely to clean up; preserve failed/abandoned lineage.

If a gate shape is unclosable without violating authority, surface the structural issue instead of laundering a pass through prose.

---

## Notification and stale-event handling

For each WorkGraph notification:

1. Claim the message if possible.
2. Fresh-read the bound WorkItem/entity.
3. Compare event state with current state.
4. If current state is terminal or already advanced, ack/ignore; do not reopen or double-act.
5. If actionable and legal, act through WorkGraph verbs.
6. Ack the message after you have acted, deliberately deferred, or determined it is stale.

Common stale cases:

- unpause->ready event arrives after the item was abandoned;
- work-unblocked arrives after another agent claimed it;
- pass/merge FYI arrives after the WorkItem is done;
- old paused residual work becomes visible after a cleanup wave.

Substrate truth wins.

---

## Hard stops and repair behavior

Stop the affected effect when authority/bytes/currentness mismatch, constitution is stale/unavailable, a required attestation is absent/invalid/FAIL, scope expands, verifier independence fails, protected delivery is denied, a live proof fallback is forbidden, or completion would overclaim a proof layer.

Use `block_work` with the exact blocker when you hold the node.\
Preserve local artifacts and attempt polarity.\
Do not edit/replay a failed gate or self-author a PASS.\
The controller uses `workgraph-recovery` to create a distinct repair node/gate/runId.\
Routine technical failure is not a reason to abandon the arc or escalate to the Director.

For contract/topology drift, do not work around the frozen node.\
The authorized controller must `pause -> revise -> unpause/recommit`; successors require fresh evidence and attestations.

---

## When to ask or block

Ask/block rather than guessing when:

- the runbook and evidence requirement disagree;
- required refs do not resolve;
- the target branch/PR/head SHA is ambiguous;
- completing would overclaim proof level;
- verifier authority would be self-attestation;
- the work appears superseded but is not terminal;
- scope has expanded beyond the node.

Use `block_work` when the blocker is concrete and the node holder cannot proceed.\
Use an idea/bug/skill/doc follow-up when the issue is future-facing rather than an immediate blocker.

---

## Participant acceptance bar

A participant acting under this skill should leave the WorkGraph clearer than they found it:

- the WorkItem state matches reality;
- evidence is bound and proof-labeled honestly;
- leases are not stranded;
- stale notifications are acked without loops;
- friction is consciously recorded as `observed:false` or `observed:true`;
- follow-ups have durable ids or clear routed text;
- the arc driver can close from substrate truth, not from your memory.
