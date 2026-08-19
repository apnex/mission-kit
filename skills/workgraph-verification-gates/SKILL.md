---
id: K21
category: skill
title: workgraph-verification-gates - exact independent WorkGraph PASS/FAIL gates
status: active
name: workgraph-verification-gates
description: "Use to author, stage, independently judge, verify, and recover exact WorkGraph PASS/FAIL gates without self-attestation, vacuous evidence, mutable-byte drift, or failed-gate replay."
metadata:
  prerequisite: workgraph-arc-operator
  related-skills: workgraph-arc-planning, workgraph-arc-participant, workgraph-pr-delivery, workgraph-recovery, workgraph-arc-closeout
  series: workgraph
  parent-skill: workgraph-arc-operator
  series-role: specialist
  substrate: Hub WorkGraph / verifier-gate / verifier-attestation / verify_attestation
  primary-verbs: get_work, complete_work, attest_evidence, verify_attestation
  lifecycle-stages: planning, admission, executing, implementation-sealed, publication-qualified, live-qualified, substrate-closing
---

# workgraph-verification-gates — exact independent PASS/FAIL

## When to use

Use this skill whenever an arc transition depends on independent proof:

- design or M7 admission;
- exact blueprint pre-seed review;
- implementation/semantic/source review;
- publication applicability, preflight, or qualification;
- deployment/live/postproduction qualification;
- terminal closeout.

Do not use a verifier note as a substitute for a load-bearing gate.
Do not ask a verifier to claim or execute the WorkItem whose requirement they attest.
Use `workgraph-arc-participant` for ordinary node behavior and this skill for the independent judgment boundary.

## Lifecycle position

The canonical lifecycle is `skills/arc-lifecycle/assets/workgraph-lifecycle-v1.json`.
This skill owns independent transitions such as `seal-design`, `approve-for-go`, `seal-implementation`, effect qualification, and closeout PASS.
A PASS proves only the exact requirement, target, evidence set, and effect scope it binds.
It performs no seed, merge, publication, deployment, entity, live, or closeout effect.

## Gate model — stage mechanically, judge independently

Use Model B for a load-bearing verifier-attestation requirement:

1. A non-verifier executor claims/starts the gate WorkItem.
2. The executor mechanically stages every exact artifact/binding required by the immutable evidence contract.
3. The executor calls `complete_work`; valid executor evidence parks the node in `review` with its lease retained.
4. An independent verifier **does not claim the WorkItem**.
5. The verifier fresh-reads target, executor/creator/holder history, requirements, evidence, current artifact identities, and negative lineage.
6. The verifier reproduces the substantive checks and calls `attest_evidence(PASS|FAIL)` with load-bearing related evidence refs.
7. Every consumer calls `verify_attestation` fresh before relying on the verdict.

The gate requirement must use:

```json
{
  "id": "<seal-id>",
  "kind": "review",
  "evidenceAuthority": "verifier-attestation"
}
```

Do not combine it with executor-supplied review evidence as a verdict.
Do not use `kind: review` plus `refResolvable:true` for a verifier-created WorkItem that cannot exist.
The executor may stage reports and exact bindings, but only the server-stamped verifier attestation supplies polarity.

## Gate classes and exact predicates

| Gate | Minimum bound evidence | PASS unlocks | PASS does not do |
|---|---|---|---|
| Design | exact candidate bytes/state, M7 audit or explicit not-required rationale, prior negatives, feasibility/failure-mode evidence | exact blueprint/admission authoring | implementation |
| Blueprint pre-seed | exact blueprint path/RV/bytes/SHA/runId, exact authority manifest, all deterministic IDs absent, dry-run valid/zero-create, scope/driver/gate coverage | distinct final admission | seed |
| Final admission | exact design PASS, blueprint PASS, authority envelope, manifest, constitution `stale=false`, scope/effect/actor, negatives | approved-for-go receipt | seed/effect |
| Implementation/semantic | exact commit/tree, tests/traces, invariant matrix, current scope and target | source candidate/delivery node | merge |
| Source | exact PR head/base/tree/path set, CI/checks, actual authorship and independent review | protected merge node | merge/deploy |
| Publication/deploy | applicability/preflight/attempt identity, protected merge, artifact/environment, retry/idempotency, independent qualification | bounded effect node | the effect itself |
| Live/postproduction | exact runtime/deploy identity, authorized live surface, raw observations, no forbidden fallback, persistence/restart evidence | entity disposition/closeout | broader environments |
| Closeout | graph state, every gate/attempt, delivery/live/entity/friction/stakeholder/surface ledger, Director proof state | closeout then driver-last | rewrite history |

A mutable input is exact only when its current identity is frozen and rechecked.
For Hub documents use one authoritative identity `{path, resourceVersion, utf8Bytes, sha256}`.
For Git use repository, full commit, path/tree/blob identity.
For entities use kind/id/resourceVersion/state hash.
A path, branch, tag, dependency, message, or remembered content is not exact proof.

## Blueprint pre-seed gate

Before live seed, independently prove all of:

- the candidate blueprint bytes and runId are frozen;
- the authority manifest is exact-bound by every effect-bearing node when required;
- the design PASS is active-valid and exact enough for the blueprint scope;
- the blueprint validates as a finite DAG with no dangling/self/cyclic edges;
- runbooks, references, target refs, role eligibility, evidence requirements, and node pulses are cold-start complete;
- verifier gates use authority-separated requirements and are not claimed by the verifier;
- every source, merge, publish, deploy, live, entity, closeout, and driver effect has an explicit claimant node and ordering;
- driver `completionDependsOn` covers every required non-driver node and driver-last is structurally enforced;
- every deterministic ID is absent before and after a SHA-bound `dryRun:true` result;
- dry-run created zero WorkItems;
- every prior FAIL remains separately queryable and non-authorizing.

The blueprint cannot approve itself.
A dry-run cannot substitute for independent PASS.
A PASS over V1 cannot authorize V2 bytes or a larger scope.

## Verifier independence and non-vacuity

Reject or FAIL when any is true:

- verifier appears in creator, holder, or executor history for the target work;
- the verifier authored the source/PR under review or shares the actual GitHub author identity where independence matters;
- evidence refs do not resolve or are unrelated to the target;
- a report merely repeats the runbook without reproducing checks;
- mutation/negative/adversarial checks are missing where the claim could pass vacuously;
- targetRef, requirement hash, evidence set, or mutable artifact identity moved;
- the claimed PASS is broader than the reviewed scope;
- local/CI/merge evidence is presented as deployment/live proof;
- a forbidden fallback is used for live proof;
- an active FAIL already seals this physical gate.

A meaningful review tries to falsify the claim.
For code, reproduce focused tests and inspect exact diffs.
For graphs, mutate required edges/gates/driver coverage and prove validation rejects.
For live gates, execute only the authorized live path and preserve raw observations.

## PASS consumption

Never consume a remembered PASS.
Before each dependent effect:

1. `get_work(gateId)` and require the expected target, requirement, evidence, current status, and active verdict.
2. `verify_attestation(gateId, requirementId)`.
3. Require `valid=true`, `invalidReasons=[]`, correct verifier/target, and no legacy executor review evidence pretending to be SEAL-grade.
4. Rehash/re-resolve the exact artifacts the gate is supposed to bind.
5. Recheck constitution, scope, effect-specific currentness, and absence of a newer FAIL/pause/recall/prohibition.

Dependency completion and instructions are not proof.
An authority envelope cannot widen a gate.
A gate cannot invent missing evidence.

## FAIL is immutable and effectively terminal

A verifier FAIL is not an invitation to edit evidence and re-attest the same physical gate.
Preserve:

- original WorkItem and phase;
- lease/holder before-state or failed-seal receipt;
- executor evidence;
- attestation history and active FAIL polarity;
- verifier identity/time;
- exact candidate/attempt identity;
- failure report.

The failed gate is nonclaimable, nonreplayable, and non-re-attestable.
Lease expiry, sweeper, restart, pause, or later PASS must not requeue it.
Use `workgraph-recovery` to author a **distinct repair graph** with a new gate, candidate/attempt identity, runId where applicable, and downstream tail.
The repair may pass; it never changes the old FAIL.

If the deployed substrate does not yet clear a failed-gate lease safely, retain it.
Do not release, abandon, expire, prune, or terminalize it merely to free WIP.

## Advisory versus load-bearing review

Use advisory review only when the arc can lawfully continue without it and the WorkItem contract says so.
Record the authority downgrade at closeout.
Do not describe advisory feedback as `PASS`, `sealed`, or independently authorized.

Use verifier-attestation when the gate controls seed, merge, publication, deployment, live qualification, entity disposition, or driver completion.
If verifier capacity is unavailable, the correct result is blocked/awaiting-verifier unless exact authority explicitly accepts a weaker path.
Controller self-review never silently upgrades itself.

## Gate completion checklist

Before issuing a verdict, confirm:

- [ ] exact gate WorkItem and requirement;
- [ ] target/currentness unchanged;
- [ ] verifier independent from creator/holder/executor/source author;
- [ ] all required staged evidence present and related;
- [ ] mutable bytes/entities re-resolved;
- [ ] positive, negative, and adversarial checks reproduced;
- [ ] scope and non-claims explicit;
- [ ] prior FAIL/attempt lineage preserved;
- [ ] PASS or FAIL recorded with load-bearing refs;
- [ ] `verify_attestation` returns valid;
- [ ] downstream actor told to fresh-verify rather than trust a message.

## Output

A correct gate leaves one unambiguous result:

- active-valid exact `PASS` with a bounded unlock;
- immutable exact `FAIL` with a distinct repair path; or
- no verdict because evidence, independence, target currentness, or authority is invalid.

It never leaves a prose verdict that downstream effects must interpret from memory.
