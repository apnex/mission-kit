---
name: workgraph-pr-delivery
description: "Use to move an exact WorkGraph-bound source candidate through clean branch/worktree, commit, PR, independent review, protected merge, applicable publication, deployment, and live proof without collapsing delivery layers or retry polarity."
metadata:
  prerequisite: workgraph-arc-operator
  related-skills: workgraph-arc-participant, workgraph-verification-gates, workgraph-recovery, workgraph-arc-closeout
  series: workgraph
  parent-skill: workgraph-arc-operator
  series-role: specialist
  substrate: Hub WorkGraph / GitHub PR / publication / deployment / live observation
  lifecycle-stages: implementation-sealed, source-delivered, publication-qualified, deployment-qualified
---

# workgraph-pr-delivery - exact source-to-live proof

## When to use

Use this skill for any WorkGraph arc with code, package, registry, deploy, restart, migration, or live qualification effects.\
It begins after implementation has an exact candidate and ends only at the strongest separately observed delivery layer the node authorizes.

Do not use it to decide product scope, author a design, independently judge your own work, or close the whole arc.\
Use `workgraph-verification-gates` for independent PASS/FAIL and `workgraph-arc-closeout` for terminal reconciliation.

---

---

## Lifecycle position

The canonical lifecycle is `skills/arc-lifecycle/assets/workgraph-lifecycle-v1.json`.\
This skill owns the evidence transitions:
```text
implementation-sealed
  -> source-delivered
  -> publication-qualified
  -> deployment-qualified
  -> live-qualified (only with independent live/postproduction proof)
```

A stage may be satisfied by an independently gated not-applicable result, never by omission.

---

---

## Proof layers never collapse

| Layer | Required identity | Does not prove |
|---|---|---|
| local test | command, workspace, timestamp, output | CI/review/merge |
| commit | repository + full SHA + tree/path set | PR/review/merge |
| PR open | URL/number + exact head/base/tree | approval/merge |
| reviewed | review id/actor/actual authorship + exact head | merge |
| CI green | check suite/run + exact head | merge/deploy/live |
| merged | protected merge commit + canonical base ancestry | publish/deploy/live |
| published | package/artifact/registry/version/digest + qualification | deploy/live |
| deployed | environment/runtime/image/package/migration/restart identity | target behavior observed |
| live observed | exact environment/revision + authorized observation | broader scope/environments |
| verifier attested | exact gate/requirement/evidence set | scope outside that gate |

Record the strongest true layer only.\
`merged` is not `published`.\
`published` is not `deployed`.\
`deployed` is not `live-observed`.

---

---

## Source candidate lane

The implementation node may edit, test, commit, and open a PR only when its frozen contract authorizes those effects.\
Use this sequence:

1. Fresh-read the WorkItem, references, evidence contract, scope, and active gates.
2. Re-run every participant-local exact authority/manifest rehash required by the node before source effect.
3. Confirm repository and base ref from fresh remote truth.
4. Create a separate clean worktree/branch from the authorized base.
5. Verify the worktree is clean before editing and that unrelated dirty checkout state is not copied.
6. Change only in-scope paths; preserve unrelated history.
7. Run focused and repository-wide validation required by the node.
8. Commit with the configured actual author identity and no AI attribution.
9. Record full commit SHA/tree/path matrix and test output.
10. Push the exact branch and open one reviewable PR bound to the WorkItem.

If the WorkItem says `commit and evidence only`, do not merge, publish, deploy, restart, distribute, or perform live effects.\
A PR requirement authorizes opening the PR, not merging it.

---

---

## PR identity and authorship

Before review or merge, bind:

- repository and canonical remote;
- PR URL/number;
- base branch and base SHA;
- head branch and full head SHA;
- head tree/path set;
- actual commit author/pusher and GitHub login;
- WorkItem/arc binding;
- check suite identities;
- review identity and state.

Display-agent identity is not GitHub independence.\
If two seats share a GitHub login, they are not independent source author and reviewer for a gate requiring non-author review.\
A review over old head bytes does not approve a later push.

---

---

## Source gate then protected merge

Split source production from delivery:
```text
candidate-source -> independent source gate -> protected merge
```

The candidate node proves exact source, tests, PR identity, and CI at the pre-merge layer.\
The source gate independently reviews the exact head and uses verifier-attestation when load-bearing.\
A **distinct merge WorkItem** fresh-verifies the active-valid source PASS and performs only the protected merge.

Never make a pre-merge node require a merge commit it cannot produce.\
Never let a verifier gate perform the merge.\
Never bypass branch protection, required reviews, or merge queue policy.

If the merge fails, times out, races, or returns ambiguous state:

1. perform no blind retry;
2. fresh-read PR, base, head, queue, checks, and canonical ancestry;
3. preserve the original attempt polarity;
4. retry only under the node's bounded idempotency/retry authority or create a distinct repair attempt.

---

---

## Publication is authority-separated

Do not assume publication because a package/versioned artifact changed.\
Represent the chain explicitly:
```text
applicability -> independent applicability gate
             -> preflight or exact not-applicable receipt
             -> independent preflight gate
             -> bounded publication execution or no-effect receipt
             -> independent public qualification
```

Preflight binds package/artifact, version, registry, credential **name**, vacancy/conflict, exact source/merge digest, retry/idempotency bound, and rollback/non-rollback policy.\
Never record secret values.

A publication attempt retains its original outcome.\
A failed or partially consumed version/identity is not silently reused.\
A distinct repair uses a new attempt identity and, when necessary, a new version/artifact.

Deployment cannot start until publication is independently qualified or an independently qualified not-applicable branch exists.

---

---

## Deployment and activation

A deployment node fresh-verifies:

- exact protected merge ancestry;
- publication qualification or valid not-applicable result;
- active-valid effect-specific gates;
- environment/cluster/project and credential names;
- image/package/plugin/migration/runtime revisions;
- rollout, restart, health, rollback, and idempotency bounds;
- current authority and absence of pause/recall/FAIL/currentness prohibition.

Record the exact deployment attempt and returned runtime identity.\
A successful command without target revision proof is not a qualified deploy.\
A failed attempt remains failed even when a later attempt succeeds.

---

---

## Live and postproduction proof

Live qualification uses the authorized production/native surface named by the node.\
Do not substitute local tests, CI, logs from another environment, direct database access, curl, or an out-of-band fallback when the gate requires a native user/agent path.

Bind:

- environment and exact runtime/build revision;
- actor/seat/tool surface;
- observation time/window;
- raw before/after identity or returned durable entity;
- restart/reconnect/migration behavior where relevant;
- one real read and purpose-created/reversible write when required;
- persistence/history/no-amplification evidence;
- limitations and unobserved scope.

An engineer may stage live evidence mechanically.\
An independent verifier owns postproduction polarity and calls `verify_attestation` after attesting.\
Only active-valid postproduction PASS unlocks entity disposition or terminal closeout when the graph requires it.

---

---

## Failed delivery recovery

Use `workgraph-recovery` and preserve every attempt:

- branch/commit/PR/check/review/merge attempt;
- package/version/publication attempt;
- deploy/migration/restart attempt;
- live observation attempt;
- gate verdict and exact failure evidence.

Do not force-push a reviewed head unless exact authority permits a distinct reviewed replacement.\
Do not rewrite a red check, failed merge, failed publish, or failed deploy as success.\
Do not unpublish, roll back a topology pointer, delete history, or reuse consumed identities without separate authority.

Routine red CI and reversible delivery failures stay autonomous: diagnose, repair on a distinct candidate/attempt, re-run independent gates, and continue.\
Escalate only authority/constitutional conflict, destructive out-of-scope action, unavailable reserved authority, or irreducible external blocker.

---

---

## Evidence packet

Every delivery WorkItem completion should report:
```text
WorkItem:
Repository/worktree/branch:
Base SHA:
Commit/head/tree:
Changed paths:
Tests/checks:
PR/review:
Merge commit (or not performed):
Publication (or not applicable/not performed):
Deployment (or not performed):
Live observation (or not observed):
Independent gates + verify_attestation results:
Failed attempts retained:
Non-claims:
```

Bind each artifact to the correct immutable evidence requirement.\
Do not use one ref for multiple requirements unless the contract permits it.\
Include `frictionReflection` when completing the WorkItem.

---

---

## Hard stops

Perform no affected delivery effect when any is true:

- exact authority/manifest/target binding mismatches;
- source or effect gate is missing, FAIL, stale, invalid, or self-attested;
- PR head differs from reviewed head;
- required checks/reviews/branch protection are red, absent, or bypassed;
- publication applicability/preflight/qualification is absent;
- deployment target or artifact identity is ambiguous;
- a retry may duplicate an irreversible effect;
- live proof requires a forbidden fallback;
- scope expands beyond the WorkItem;
- constitution is stale/unavailable where the effect fence requires it.

Stop with a typed no-effect receipt and a concrete repair route.\
Do not convert a hard stop into a vague chat warning.

---

---

## Acceptance bar

A cold-start reviewer can reconstruct the exact candidate and strongest proof layer from WorkGraph + GitHub/delivery refs alone.\
No merge, publication, deployment, live, or entity claim depends on memory or an FYI.\
Every failed attempt remains visible, and each later success has a distinct identity and gate lineage.
