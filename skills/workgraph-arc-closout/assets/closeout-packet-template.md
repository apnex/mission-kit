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
| Axiom alignment audit ref or not-required rationale | `TBD` |

## Final verdict

Verdict: `<complete | complete-with-limitation | blocked | abandoned>`

Honesty statement:

> `TBD — what is proved, what is not proved, and what limitation remains.`

## Director qualitative walkthrough

Required? `<yes/no>`
Trigger/rationale: `<Director-requested | procedure/tooling/skill/template/methodology change | material residual/caveat | operating-guidance artifact | not-required rationale>`
Tier: `<0 evidence-only | 1 sensemaking capsule | 2 full walkthrough | 3 M7 + full walkthrough>`

Use this section when the Director/operator requested or authorized the arc, the arc changes org operating procedure/tooling/skill/template/methodology/governance/coordination/lifecycle/delivery/verification/authority patterns, future agents/operators will treat the result as operating guidance, material limitations or residuals remain, or this packet is the organizational memory artifact.

### What shipped / changed

- `TBD — concrete delivered artifact, behavior, process, or decision, with evidence refs.`

### Why it matters

- `TBD — rationale and consequence in strategic/operator terms.`

### Target-state delta

| Before | After | Delta |
|---|---|---|
| `TBD` | `TBD` | `TBD` |

### Axiom / principle mapping

Closeout-level axiom mapping is not a full M7 audit. It translates delivered work into constitutional meaning and records material tensions. Full M7 remains required before implementation for extensive methodology/design arcs.

| Axiom/principle | Load (`load-bearing/supporting/tension`) | How the arc served or strained it |
|---|---|---|
| `TBD` | `TBD` | `TBD` |

### Caveats / non-claims

- `TBD — proof boundary, live-not-observed, scope not delivered, authority downgrade, or other material caveat.`

### Residuals / revival triggers

| Residual/trigger | Durable id or no-file rationale | Owner/next surface |
|---|---|---|
| `TBD` | `TBD` | `TBD` |

### Decision state

Decision required? `<no | awareness-only | yes>`

If yes:

| Decision topic | Options / authority boundary | Target ref |
|---|---|---|
| `TBD` | `TBD` | `TBD` |

If no or awareness-only: `TBD — why no Director action is required, or why awareness alone is sufficient.`

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

## Axiom alignment audit

Required for extensive planning/design? `yes/no`

| Field | Value |
|---|---|
| Audit ref | `TBD / not required` |
| Verdict | `pass/pass-with-guardrails/revise-before-implementation/blocked/not-required` |
| Implementation started after audit? | `yes/no/n-a` |
| Guardrails carried into validation/closeout | `TBD` |
| Follow-up methodology/work ids | `TBD` |

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

Director qualitative walkthrough required? `yes/no`

Rationale/ref: `TBD — if yes, the dedicated walkthrough section above is complete; if no, explain why the trigger did not apply.`

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
Director walkthrough: <not-required | capsule | full; decision-state summary>
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
| Extensive planning/design lacks axiom alignment audit or not-required rationale | `yes/no` | `TBD` |
| Active future-facing surface still stale | `yes/no` | `TBD` |
| Residual exists only in prose | `yes/no` | `TBD` |
| Stakeholder/Director obligation skipped | `yes/no` | `TBD` |
| Required Director qualitative walkthrough absent/incomplete | `yes/no` | `TBD` |
| Stale FYI/chat treated as authority | `yes/no` | `TBD` |
| Driver would complete before closeout evidence | `yes/no` | `TBD` |
