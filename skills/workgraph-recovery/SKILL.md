---
name: workgraph-recovery
description: "Use when a WorkGraph arc is hard-stopped, failed, paused, stale, drifted, lease-stuck, or delivery-blocked; restores liveness through fresh truth, immutable failure lineage, pause-revise-unpause, and distinct independently gated repair rather than replay, reset, or give-up."
metadata:
  prerequisite: workgraph-arc-operator
  related-skills: arc-lifecycle, workgraph-arc-participant, workgraph-verification-gates, workgraph-pr-delivery, workgraph-arc-closeout
  series: workgraph
  parent-skill: workgraph-arc-operator
  series-role: specialist
  substrate: Hub WorkGraph / recovery / pause-revise-unpause / failed-gate seal
  primary-verbs: get_current_stint, get_work, legal_moves, block_work, release_work, pause_work, unpause_work
  lifecycle-control-states: hard-stopped, repairing
---

# workgraph-recovery - preserve truth and restore lawful progress

## When to use

Use this skill when fresh substrate truth shows:

- an active verifier FAIL or failed-gate lease retention;
- exact authority/reference/currentness drift;
- a paused node or a contract/topology revision need;
- expired/lost lease, blocked child, WIP cap, quarantine, or stale notification;
- red CI, rejected review, failed/ambiguous merge, publish, deploy, or live attempt;
- controller/driver liveness loss;
- scope or constitutional conflict.

Do not use recovery as a euphemism for deleting evidence, replaying a failed gate, force-completing a driver, or bypassing authority.

---

## Lifecycle position

The canonical control FSM is in `skills/arc-lifecycle/assets/workgraph-lifecycle-v1.json`:
```text
running --hard-stop--> hard-stopped
hard-stopped --author-distinct-repair--> repairing
repairing --admit-distinct-repair--> running
```

The evidence-derived lifecycle stage does not rewind when control stops.\
A distinct repair resumes from the current proven stage only after independent admission.

---

## No-give-up rule

Routine implementation difficulty, red CI, verifier FAIL, rate limiting, temporary verifier unavailability, reversible infrastructure failure, and bounded delivery failure are expected autonomous conditions.\
They do not justify abandonment or a Director round trip.

Recovery order:

1. fresh-read constitution, authority, arc, WorkItem, gate, artifact, and delivery truth;
2. classify the typed stop and blocked effects;
3. persist a no-effect/block/attempt receipt;
4. preserve exact polarity, leases, evidence, history, and identities;
5. select the smallest lawful repair;
6. independently gate the repair where the failed path was gated;
7. resume only after fresh proof.

Escalate only constitutional contradiction, scope/authority conflict, destructive out-of-envelope action, unavailable reserved authority, or irreducible external blocker.

---

## Diagnose from truth, not symptoms

Start with:

1. `get_work(driverId, includeCompletionProgress:true)`;
2. `get_current_stint(driverId)`;
3. load-bearing child/gate `get_work` reads;
4. `legal_moves` for the current caller;
5. active-valid attestation checks;
6. exact GitHub/CI/delivery/live state;
7. constitution provenance and `stale` state when required;
8. pending/stale Message state only after substrate reads.

Classify the blocker as one of:

- **signal stale:** WorkGraph already advanced;
- **lease/liveness:** holder/token/expiry/WIP/quarantine;
- **ordinary dependency:** start gate not done;
- **contract/currentness:** exact reference or physical revision moved;
- **verifier FAIL:** immutable seal, same gate cannot continue;
- **artifact failure:** code/test/PR/check invalid;
- **effect failure:** merge/publish/deploy/live attempt failed or ambiguous;
- **scope/authority/constitution:** loud hard stop.

---

## Stale FYIs and crossed messages

Messages are signals only.\
For each late ready/unblocked/PASS/merge/close FYI:

1. claim it when the Message protocol applies;
2. read the bound current WorkItem/entity/PR;
3. if state is already advanced, terminal, owned elsewhere, or invalid, ack/ignore;
4. never reopen, reclaim, reply-loop, re-merge, or double-close from the FYI;
5. record stale-signal friction only when it materially affected work.

---

## Lease and driver recovery

- If a normal lease expired and the current item is `ready`, an eligible assigned actor may reclaim/start it.
- If another legitimate holder owns it, do not steal it.
- If the current holder cannot continue, use the legal `release_work` or `block_work` path.
- If WIP-capped or quarantined, clear/finish existing work through authorized control; do not churn claims.
- If the controller driver returned to `ready`, the authorized controller reclaims/starts it before dispatching lanes.
- If an active FAIL retains a lease because failed-seal cleanup is not deployed, **retain it**. Do not release, abandon, expire, prune, or migrate it to free capacity.

Failed-gate WIP pressure is a capacity/planning fact, not permission to destroy negative lineage.

---

## Immutable FAIL repair

For an active verifier FAIL:

- preserve the physical WorkItem, phase, lease before-state, staged evidence, attestation history, verifier/time, candidate/attempt identity, and failure report;
- treat it as nonclaimable, nonreplayable, and non-re-attestable;
- retire downstream nodes whose start gates can never pass, preserving them as failed/superseded lineage;
- author a distinct candidate and distinct repair gate;
- use a distinct runId/WorkItem IDs/downstream tail when graph structure changes;
- re-run the same or stronger independent checks;
- cite old FAIL as negative evidence in the repair gate;
- never call the old FAIL superseded in the sense of no longer true.

A later PASS means the distinct repair passed.\
It does not mean the original attempt passed.

---

## Pause -> revise -> unpause

Use semantic WorkGraph revision, not prose or in-place mutation, when a current node contract or topology must change.

1. **Pause/recall.** Authorized architect/Director pauses affected ready or leased work; exact holder receives durable recall and old lease tokens become invalid.
2. **Revise.** Server derives the complete affected reverse closure over both start and completion edges, creates immutable successor physical revisions, validates exact references/contracts, and activates one complete topology generation by atomic head CAS.
3. **Unpause/recommit.** Atomically recommit the exact revision set to `ready`; start-gate satisfaction remains a later `claim_work` predicate.
4. **Reprove.** Evidence and attestations do not migrate. New physical revisions obtain fresh evidence and independent gates.

Never mutate an active FAIL, terminal/evidence-bearing row, or old physical revision into new meaning.\
Never roll back the topology head.\
If revision verbs are not deployed, stop and author a distinct blueprint/repair graph under current capabilities.

---

## Code and delivery recovery

For red tests/CI/review:

- keep the candidate node open or blocked;
- preserve the failing run/review;
- repair on a distinct commit/head;
- re-run checks and independent source review over the new exact head.

For ambiguous merge/publish/deploy/live calls:

- do not blind retry;
- fresh-read canonical target state and ancestry;
- if committed, record the exact returned/canonical identity;
- if failed, retain the attempt and use bounded idempotent retry or a distinct attempt;
- never reuse a consumed irreversible version/identity without explicit authority.

See `workgraph-pr-delivery` for the layer-specific evidence contract.

---

## Scope and authority drift

If recovery discovers required in-scope work, add/append a WorkItem or distinct repair graph under architect authority.\
If it is valuable but outside the fence, create a durable Idea/Bug/follow-up with a revival trigger and keep the current arc narrow.

Stop loud when:

- constitution is stale/unavailable and the fence requires freshness;
- authority actor/effect/repository/environment does not match;
- exact bytes/resource versions/hashes drifted;
- repair would be destructive, cross-scope, or history-erasing;
- required independent authority is unavailable and no lawful fallback exists.

---

## Recovery receipt

Record:
```text
Arc/driver:
Evidence-derived lifecycle stage:
Control state: hard-stopped | repairing | running
Typed stop reason:
Fresh truth reads:
Blocked effects:
No-effect receipt:
Original failed/ambiguous identity and polarity:
Preserved lease/evidence/attestation/history:
Distinct repair id/runId/candidate:
Independent repair gate and verify_attestation result:
Resume predicate:
Residual/revival trigger:
```

---

## Acceptance bar

Recovery is complete only when one is true:

- the original signal was stale and safely acked with no duplicate effect;
- a normal lease/blocker was lawfully restored;
- a distinct independently passed repair restored `running` while preserving the old FAIL;
- the arc remains hard-stopped with a precise durable blocker and authority owner.

"We tried" or "manual cleanup" is not a recovery state.
