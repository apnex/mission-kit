# WorkGraph Arc Closeout Packet — `<arc-or-mission>`

Fill this before completing the closeout WorkItem or driver.
Every material claim needs a ref or an explicit `not observed` / `not applicable` rationale.

## Identity and authority

| Field | Value |
|---|---|
| Mission | `TBD` |
| Arc / runId | `TBD` |
| Driver WorkItem | `TBD` |
| Closeout WorkItem | `TBD` |
| Controller | `TBD` |
| Authorizing idea/decision/Director instruction | `TBD` |
| Scope fence ref | `TBD` |

## Final verdict

Verdict: `<complete | complete-with-limitation | blocked | abandoned>`

Honesty statement:

> `TBD — what is proved, what is not proved, and what limitation remains.`

## Scope fence

Delivered:

- `TBD`

Not delivered / out of scope:

- `TBD`

Scope additions with authority:

| Addition | Authority/ref | Status |
|---|---|---|
| `TBD` | `TBD` | `TBD` |

## WorkGraph final state

Latest `get_current_stint(driver)` observed at: `TBD`

| Field | Value |
|---|---|
| Driver status before final completion | `TBD` |
| Completion progress | `TBD/N` |
| Gate open? | `yes/no` |
| Pending children | `TBD` |
| In-flight children | `TBD` |
| Blocked children | `TBD` |

| Child WorkItem | Final state | Evidence/ref | Notes |
|---|---|---|---|
| `TBD` | `TBD` | `TBD` | `TBD` |

| Failed gate/review | Verdict | Repair/rerun ref | Final disposition |
|---|---|---|---|
| `TBD` | `PASS/FAIL/CHANGES_REQUESTED` | `TBD` | `TBD` |

| Non-terminal child | State | Authority accepting limitation | Follow-up id |
|---|---|---|---|
| `TBD` | `TBD` | `TBD` | `TBD` |

## Delivered artifacts and proof strength

| Artifact/claim | Ref | State | Proof strength | Limits |
|---|---|---|---|---|
| Local command | `TBD` | `pass/fail/not-run/n-a` | `local` | `TBD` |
| Commit | `TBD` | `present/not-present/n-a` | `committed` | `TBD` |
| PR | `TBD` | `open/approved/merged/n-a` | `pr-open/reviewed/merged` | `TBD` |
| CI/checks | `TBD` | `green/red/not-run/n-a` | `ci-green` | `TBD` |
| Release/publish | `TBD` | `published/not-published/n-a` | `published` | `TBD` |
| Deploy/live | `TBD` | `observed/not-observed/n-a` | `deployed/live-observed/not-observed` | `TBD` |
| Verifier gate | `TBD` | `PASS/FAIL/CHANGES_REQUESTED` | `verifier-attested/reviewed` | `TBD` |

## Active surfaces

| Surface | Ref/path | Status (`updated/unaffected/historical/residual`) | Notes |
|---|---|---|---|
| Skill | `TBD` | `TBD` | `TBD` |
| Index/readme | `TBD` | `TBD` | `TBD` |
| Prompt/runtime guidance | `TBD` | `TBD` | `TBD` |
| Template/blueprint | `TBD` | `TBD` | `TBD` |

Stale surfaces intentionally left historical:

| Surface | Reason safe | Follow-up id if needed |
|---|---|---|
| `TBD` | `TBD` | `TBD` |

## Hub entities, backlog, and residuals

| Entity | Action taken | Final state/ref |
|---|---|---|
| Mission | `TBD` | `TBD` |
| Idea | `TBD` | `TBD` |
| Bug | `TBD` | `TBD` |
| Decision/grant | `TBD` | `TBD` |
| Follow-up WorkItem | `TBD` | `TBD` |

Every material residual has an id or explicit no-file rationale: `yes/no`.

Known limitations:

- `TBD`

Revival/reopen triggers:

- `TBD`

## Stakeholder / Director / org obligations

| Lane | Required? | Status (`satisfied/not-required/deferred/blocked`) | Ref/rationale |
|---|---|---|---|
| Architect/controller | `yes/no` | `TBD` | `TBD` |
| Engineer/operator | `yes/no` | `TBD` | `TBD` |
| Verifier | `yes/no` | `TBD` | `TBD` |
| Director/operator | `yes/no` | `TBD` | `TBD` |

Director/operator-facing summary required? `yes/no`

Rationale or ref: `TBD`

## Stale FYIs / messages

Were stale or crossed messages observed? `yes/no`

| Message/ref | How handled | Substrate truth used |
|---|---|---|
| `TBD` | `acked/ignored/replied/routed` | `TBD` |

## Final close actions

| Action | Ref | Status |
|---|---|---|
| Packet exists before closeout WorkItem completion | this doc | `yes/no` |
| Closeout WorkItem completed with packet evidence | `TBD` | `yes/no` |
| Final `get_current_stint(driver)` checked | `TBD` | `yes/no` |
| Driver completed last | `TBD` | `yes/no` |
| Mission/entity status updated | `TBD` | `yes/no` |

Driver completion evidence:

```text
Closeout packet: <path>
Final child progress: <N/N>, pending: <none or explicit dispositions>
Delivery truth: <merged/published/live/not-applicable/not-observed summary>
Verification: <verifier refs and final verdict>
Entity updates: <mission/ideas/bugs/follow-ups>
Limitations: <none or accepted limitations>
```

## Stop-condition checklist

| Stop condition | Clear? | Ref/rationale |
|---|---|---|
| Required child non-terminal without accepted limitation | `yes/no` | `TBD` |
| Delivery claimed without PR/CI/merge/release/live truth | `yes/no` | `TBD` |
| Live behavior claimed from CI/build only | `yes/no` | `TBD` |
| Failed verifier gate hidden or unresolved | `yes/no` | `TBD` |
| Active future-facing surface still stale | `yes/no` | `TBD` |
| Residual exists only in prose | `yes/no` | `TBD` |
| Stakeholder/Director obligation skipped | `yes/no` | `TBD` |
| Stale FYI/chat treated as authority | `yes/no` | `TBD` |
| Driver would complete before closeout evidence | `yes/no` | `TBD` |
