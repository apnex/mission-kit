---
name: workgraph-arc-operator
description: "Use to commence, execute, recover, and close a Hub WorkGraph-based arc. This is the substrate-specific companion to arc-lifecycle: arc-lifecycle reasons about value chains, payoff, deferral, and revival; workgraph-arc-operator runs the actual control loop through WorkItems, blueprints, leases, evidence, verification, PRs, and closeout. Use when an agent is driving a multi-node initiative on the Hub WorkGraph and must keep liveness, authority, evidence, and scope under control."
metadata:
  related-skills: arc-lifecycle, survey, workgraph-arc-planning, workgraph-arc-participant, workgraph-verification-gates, workgraph-pr-delivery, workgraph-recovery, workgraph-arc-closeout
  series: workgraph
  series-role: root
  facet: operate — concrete Hub/WorkGraph arc execution
  substrate: Hub WorkGraph / WorkItem arc-node / seed_blueprint
  primary-verbs: seed_blueprint, get_current_stint, get_next_action, get_work, legal_moves, claim_work, start_work, renew_lease, complete_work
---

# workgraph-arc-operator — execute and manage a Hub WorkGraph arc

## When to use

Use this skill when you are responsible for running a multi-step initiative on the Hub WorkGraph:

- commencing an approved arc from plan to live queue;
- turning a plan into a seeded WorkItem graph;
- holding the controller/architect liveness loop;
- coordinating engineer and verifier lanes without manual ping loops;
- binding PRs, tests, reviews, attestations, docs, and closeout to WorkItems;
- recovering a stuck or stale arc from substrate truth;
- closing an arc without losing evidence, follow-ups, or authority provenance.

This skill is **substrate-specific**.
It assumes the Hub WorkGraph is the source of truth and names the concrete verbs an operator uses.

Use `arc-lifecycle` beside it when you need to decide **what the arc means**: summit/value-chain reasoning, banked vs staked payoff, deferral economics, revival triggers, and value-contingent dependencies.
Use this skill when you need to decide **what to do next on the WorkGraph**.

## Not for

- Generic value-chain modelling detached from the Hub substrate — use `arc-lifecycle` or `model-an-arc`.
- A flat one-shot task with no child graph, evidence gate, verifier lane, or closeout burden.
- Old proposal/thread-era workflow management when WorkItems are available.
- A private checklist that bypasses WorkGraph state.

If the work is important enough to delegate, verify, merge, or close later, it is important enough to have a WorkGraph arc.

## Lifecycle position and controller authority

The canonical lifecycle is `../arc-lifecycle/assets/workgraph-lifecycle-v1.json` and skill routing is `../arc-lifecycle/assets/workgraph-skill-selection-v1.json`.
This skill owns admission coordination, `approved-for-go`, exact commencement, the controller loop, repair orchestration, and substrate handoff to closeout.
It does not independently judge gates, implement participant work, or collapse delivery/live proof.

Treat lifecycle stage as an evidence-derived projection, not a mutable status field.
A control hard stop freezes prohibited effects while preserving the proven stage.
Use `workgraph-verification-gates` for exact PASS/FAIL, `workgraph-pr-delivery` for source-to-live layers, `workgraph-recovery` for stopped/failed/revision paths, and `workgraph-arc-closeout` for terminal truth.

## Core invariant — the live arc-driver

Every autonomous or semi-autonomous WorkGraph arc has a **controller-held arc-driver WorkItem**.

The driver is the live control loop:

- it is an arc-node whose `completionDependsOn` points at the child WorkItems that make the arc complete;
- it carries the runbook, scope fence, close criteria, and evidence requirements for the controller;
- it is claimed and started by the controller at commence;
- its lease is renewed every active controller turn;
- it is completed **last**, after all children, closeout, backlog updates, and required verification evidence are complete.

For an architect-run arc, the controller is normally the architect.
A different holder is valid only when the Director or the arc charter explicitly delegates that control role.

The driver is not busywork.
It is the anti-stall mechanism, the cold-start handle, and the proof that the arc is governed rather than a set of loose tasks.

A controller turn is not successful merely because the driver lease was renewed, a message was acknowledged, or state was read. Those are support actions only. Every controller turn must end in one of: graph state advanced, a legal lane dispatched, a child/arc completed, a concrete blocker/gate recorded, or a fresh graph-local proof that no legal next action exists.

## Source-of-truth hierarchy

Prefer substrate truth in this order:

1. WorkGraph state: `get_current_stint`, `get_next_action`, `get_work`, `list_work`, `legal_moves`.
2. GitHub / CI truth: PR status, reviews, merge queue, checks, merge commits.
3. Hub entities: mission, ideas, bugs, decisions, documents.
4. Messages and FYIs.

Messages are useful signals, not authority.
A PASS note, merge FYI, or thread reply does not close an arc unless the bound WorkItem evidence and state close it.

## Commence checklist — admission before effect

Do not seed first and reason later.
A planning design PASS is not approved-for-go.
Commence in this order:

1. **Fresh constitution.** Read authenticated constitution/charter/axiom provenance. If required content is unavailable, `stale=true`, or M7 delta invalidates the design, hard-stop with no effect.
2. **Exact intent/design authority.** Bind the survey or fixed-intent bypass, scope fence, M7 audit/not-required rationale, exact design candidate, and fresh `verify_attestation(valid=true)` result for the independent design PASS.
3. **Exact blueprint candidate.** Freeze path/resourceVersion/UTF-8 bytes/SHA-256/runId, roles, references, evidence contracts, effect nodes, repair policy, and controller driver.
4. **Independent blueprint pre-seed gate.** Require a distinct active-valid PASS over exact blueprint bytes, SHA-bound `dryRun:true`, all deterministic IDs absent before/after, and zero create. A dry-run or dependency is not authority.
5. **Exact authority envelope.** Bind actor, repository, environment, effect classes, credential names only, anti-scope, negative lineage, retry/idempotency, and prohibitions. The envelope grants no effect by itself.
6. **Independent final admission.** Require a distinct active-valid final PASS exact-binding design, blueprint, blueprint PASS, envelope, constitution, full graph/effect coverage, and every preserved FAIL. Fresh-run `verify_attestation`.
7. **Approved-for-go receipt.** Record the one strategic approval transition and its exact effect scope. PASS/approval performs no seed or source effect.
8. **Participant-local pre-effect rehash.** Before seed, fetch and independently rehash every frozen manifest/authority input required by the controller contract. Mismatch or unreadability means no effect.
9. **Exact-once seed.** Seed only the independently passed blueprint/runId/SHA once. Ambiguous result requires fresh ID/state reads, never blind replay.
10. **Claim/start the driver immediately.** Capture the token, project `get_current_stint` and `get_next_action`, then wake lanes from graph truth.

Use `../arc-lifecycle/templates/implementation-admission-envelope.md.tmpl` for the admission record.
A commenced arc with no claimed driver is partially uncontrolled.
Fix that before adding or dispatching child work.

### Authority continuity — do not re-ask inside the envelope

At commence, read the arc-start authority as a bounded **outcome envelope**: outcome, scope/anti-scope, mutation classes, risk ceiling, mandatory safeguards, and any authorized successor-selection rule.

During execution, classify every repair or identity change before seeking more authority:

- **Within envelope:** ordinary refinement or a reviewed corrective successor required to satisfy an existing gate, with unchanged outcome, mutation class, risk ceiling, safeguards, and anti-scope. Continue without asking the Director/operator again. Bind the new exact commit/tree/PR at the fresh admission and mutation gates.
- **Material expansion:** changed outcome/audience, broader or new irreversible mutation, higher risk, relaxed safeguards, new external side effects, anti-scope breach, or expired/revoked authority. Stop and obtain new authority.
- **Ambiguous boundary:** ask one focused clarification; do not replay already-settled choices.

Exact artifact binding and stakeholder consent are separate axes. Fail closed if the mutation gate lacks exact identity proof, but do not turn every corrective commit or successor PR into a new consent ceremony. Conversely, never stretch an approval that explicitly named one artifact unless its original authority record also contains a bounded successor-selection rule covering the replacement.

Record the classification and supporting authority ref in the WorkItem/closeout so a verifier can distinguish continuity from scope expansion.

### Approved-for-go handoff from a planning arc

When a planning/design arc ends with the Director/operator saying the next implementation arc is **approved for go**, first prove that the exact design, blueprint, authority envelope, blueprint gate, final admission gate, and commencement receipt satisfy the admission fence.
A phrase in chat cannot replace those predicates.
Once the exact receipt exists, treat it as authority to commence only the frozen implementation arc, not permission to improvise beyond the final design.

Bounded handoff sequence:

1. **Consume the final design and closeout addenda.** Read the final design packet, implementation arc plan, verifier/design-gate notes, and any live closeout addendum that changed the handoff conditions.
2. **Restate scope and anti-scope in the implementation plan.** Copy the selected spine, acceptance criteria, verifier gates, active-surface proof boundaries, and explicit deferred items into the implementation arc plan.
3. **Translate the design into a blueprint.** Seed only the nodes authorized by the final design. If new questions appear, route them as planning/clarification work rather than silently expanding the implementation graph.
4. **Validate then seed.** Dry-run or otherwise inspect the graph before mutation; ensure the guardrail/verifier node gates implementation nodes when the design requires it.
5. **Claim/start the driver immediately.** The architect/controller claims and starts the driver before waking lanes. A seeded but uncontrolled implementation arc is a partial failure.
6. **Notify lanes from WorkGraph truth.** Tell engineers/verifiers the driver id, source design refs, and anti-scope. Do not rely on chat alone; the runbooks and references must carry the cold-start contract.
7. **Preserve anti-scope throughout execution.** If participants try to pull deferred platform work into scope, stop at the WorkGraph boundary and create/link a future idea or blocker rather than broadening the arc.

This handoff guidance is deliberately narrow. It does not replace the commence checklist, blueprint-shape rules, or closeout procedure; it only bridges an approved planning result into a controlled implementation arc.

## Blueprint shape

A healthy WorkGraph arc blueprint has these features:

- **One controller driver.** `roleEligibility` restricted to the controller role, usually `architect`; `completionDependsOn` lists every required child.
- **Cold-start child runbooks.** Every child says what to do, where to look, what to produce, and how to prove it.
- **Participant expectations.** Child runbooks tell claimants to read `workgraph-arc-participant` when acting inside the arc and to include `frictionReflection` on completion (`observed:false` is an explicit valid no-friction answer).
- **Typed references.** Required docs/entities/git refs are listed as `references[]`, not hidden in prose.
- **Evidence contracts.** Each node names the artifacts needed to complete it; verifier gates use verifier authority where appropriate.
- **Verifier lane.** Backplane, deploy-gating, substrate, security, or high-risk arcs include explicit verifier-gate/review nodes.
- **Closeout child or driver evidence.** The arc has a documented close packet, retrospective, or delivery note as a required artifact.
- **No dangling dependencies.** Start-gates and completion-gates must resolve at seed time.
- **Axiom alignment gate for extensive planning/design.** If the arc changes reusable procedure, substrate behavior, or coordination policy, include an axiom-audit node before implementation approval.
- **No hidden manual step.** If a step is required to close, it is a WorkItem, evidence requirement, or explicit reference.
- **Claims carry their derivation.** Every factual assertion in a runbook says where it came from, or is re-derived before it is written. See below.

### Claims in runbooks carry their derivation

A runbook is an instruction document, and a factual claim inside one is read as established.
It is not. It arrived from somewhere — a source read, a probe, an inference, a recollection — and
the runbook is usually the last place that origin is still visible.

**Copying launders an inference into a premise.** A claim gains apparent authority at every hop
while acquiring no new evidence. By the third document it reads as fact, and nobody is positioned
to check it, because nothing in the text says there is anything to check.

So: **a claim entering a runbook carries its derivation, or is re-derived at the boundary.**

Cheap, and it costs a clause:

> `create_work` stores payload as a JSON string, so that path is defended.

becomes

> `create_work` appears to store payload as a JSON string — VERIFIER INFERENCE FROM OBSERVED ROWS,
> NOT READ FROM THE SCHEMA. Verify before relying on it.

The annotation is the whole mechanism. A claim carrying its origin catches itself for a *normally*
skeptical reader; requiring an unusually skeptical one is not a control, it is a staffing assumption.

Annotate at minimum: **anything asserting what a verb, guard, or schema does**; **any claim about a
defence existing**; **any characterisation of scope written from memory rather than from source**;
and **any count or enumeration** (say what was searched and how).

**Carrying the derivation is necessary and NOT sufficient. A derivation expires.**

> **A first-party measurement of a mutable source becomes recollection the moment the tree can move
> under it. The date-stamp is an EXPIRY, not a provenance badge.**

An engineer recorded a config value from disk, correctly, with the sha and the timestamp. A ruling
changed that file **the same afternoon**. Hours later the note read as authoritative — it had a
first-party derivation and a date — and it was wrong. The architect then "corrected" it as
recollection **without checking either**, and was wrong in the same way, one turn later, in the
opposite direction. Nobody was careless. **A correctly-derived, correctly-stamped fact still rots,
and the stamp is exactly what makes it look like it hasn't.**

So the annotation must say **what could change it**, not only where it came from:

> skills-sync pins to `bd4117d` — READ FROM `manifests/skill-sync/wanted-bundles.yaml` 2026-07-25T11:37Z.
> **MUTABLE CONFIG: re-read before relying on it.**

Rule of thumb: **immutable sources** (a merge commit, a released artifact, a closed PR's diff) keep
their derivation indefinitely. **Mutable ones** (config files, `main`, a live registry, another
agent's node state) carry an expiry, and the older the stamp the *less* the citation is worth —
the opposite of how a dated measurement reads.

Corollaries, all of which have cost real arc time:

- **A constraint must be read from the enforcing path** — not from the declaration, and not from the
  values that happen to have gone through it. Observed data cannot establish a control; the values
  may have been produced by the very habit that is the confound.
- **A reader list is a claim about a tree, and the tree changes.** Re-run enumerations against the
  current sha before relying on them.
- **A scope characterisation written from a summary is recollection, not evidence.** Say so, and tell
  the claimant to establish current behaviour from source and print the operand before building. If
  the item turns out smaller, larger, already fixed, or not a defect, **that finding is the deliverable.**

**Runbooks freeze at claim.** `update_work` refuses `runbook` once a node is `in_progress` — the
claimant's contract froze when they claimed it. A false claim discovered mid-node cannot be withdrawn
from the document the claimant is building to; the correction has to travel by message and hope it
arrives first. That asymmetry is why the annotation must be there at authoring time. The freeze is
defensible; **its cost is paid by whoever happens not to already know.**

Suggested child-runbook sentence for ordinary participant nodes:

> On completion, include `frictionReflection`: `observed:false` if no friction was observed; otherwise include a concise summary, category, and suggested follow-up. Use `workgraph-arc-participant` for node-level WorkGraph behavior.

The graph should be understandable from `get_current_stint(driverId)` plus child `get_work` reads without relying on the controller's memory.

## Blueprint references & evidence contracts

Blueprint authoring is where authority and re-seed failures originate.
Use these rules:

- **References to OWNED upstream are LIVING pointers — never SHA-pinned.** A node's `references[]` to our own upstream (design docs, mission-kit) are living Hub/repo *paths*. The whole value of a reference is that the upstream can improve without re-authoring every blueprint that points at it — **skills-sync tracks `apnex/mission-kit` main, not a commit**. Pinning a SHA turns a living pointer into a frozen copy and throws that away. Reserve content-addressing and immutable git pins (`SHA:path` + blob hash) for **irreversible EXTERNAL artifacts** — npm publishes, releases, deploy artifacts — where a later mutation is genuinely dangerous. Do **not** tamper-evidence-freeze owned design/spec docs, and do not pin a fleet-wide guidance source: a pin with no owner and no trigger silently ages into fleet-wide drift, which is exactly how this rule was lost for six days. Exact identity still binds *what a gate judged* at attestation time; that is a point-in-time record, not a frozen dependency.
- **Exact gates are non-circular.** The candidate does not approve itself. A gate exact-binds candidate bytes and prior authority; an authority envelope cannot widen them; dependencies and instructions are not proof. Every consumer fresh-runs `verify_attestation` and participant-local rehash before effect.
- **Evidence contracts are immutable and satisfiable.** Pick kinds the node can actually produce. A Model-B gate is mechanically driven by a non-verifier to `review`; its `review` requirement uses `evidenceAuthority: verifier-attestation`; the verifier never claims/executes. Do not use executor review prose as verdict.
- **A node contract matches one proof layer/effect.** Candidate source proves commit/head/tests, not merge. Merge, publication applicability, preflight, publication, qualification, deployment, live, postproduction, entity disposition, closeout, and driver-last are distinct claimant nodes when applicable.
- **Every claimant is cold-start complete.** Directly carry required runbook, exact references, target, authority/manifest binding, effect gate, evidence requirements, exclusions, and pre-effect rehash instruction. Dependency ancestry and controller memory do not transmit scope or authority.
- **Fail-forward uses distinct lineage.** An active FAIL remains immutable and effectively terminal. Retain its lease/history as required; never replay, re-attest, release for convenience, or reinterpret. A repair gets a new candidate, WorkItems, gate, runId/downstream tail, and independent PASS.
- **Driver-last is structural.** The driver directly completion-gates every required child or an explicitly validated complete closure. No hidden tail, generic closeout wording, or manually remembered obligation may sit outside its completion gate.

Substantive verification and exact identity serve different purposes and both are required at effect boundaries: exact identity proves *what* was judged; adversarial review proves *whether it is sufficient*.

## Pause → revise → unpause

When a live WorkItem contract/topology must change, do not edit semantic fields in place or patch prose around the graph:

1. pause/recall affected work under authorized control; invalidate old lease tokens and durably notify the exact holder;
2. invoke semantic revision so the server derives the full affected reverse closure, creates immutable successor physical revisions, validates exact refs/contracts, and publishes one complete topology generation by CAS;
3. atomically unpause/recommit the exact successor set to `ready`; start gates remain claim-time predicates;
4. collect fresh evidence and independent attestations on successors; never migrate evidence/verdicts;
5. preserve old physical rows, attempts, and FAIL polarity.

If revision verbs are unavailable, hard-stop and author a distinct blueprint/repair graph.
Never roll back a topology head or mutate a terminal/failed/evidence-bearing row into new meaning.

## Correcting a seeded node — what `update_work` can actually change

**This does not weaken the section above it.** Semantic/topology change to a *live* node still goes through pause → revise → unpause, and the substrate enforces that: the claimant-significant fields below reject with `workgraph.currentness.revision_required` while paused or under an active topology generation. What follows is the **pre-claim, legacy-mode** correction surface — a different situation, not a shortcut around the protocol.

Within that situation, a seeded node is **not frozen**. Most correction does not need a re-seed, an abandon, or a semantic revision. Know the real surface before routing a fix through chat or destroying a row.

**`update_work` mutates an existing node.** Authority is the item's **author or the architect** — not the lease-holder.

| Path | Fields | When |
|---|---|---|
| `set{}` (replace) | `runbook` · `payload` · `priority` · `roleEligibility` · `targetRef` | pre-claim in legacy ready state; `priority` is scalar pre-terminal metadata |
| `appendDependsOn` | claim-gate deps | while `ready`; existence + cycle checked |
| `appendCompletionDependsOn` | completion-gate children | legacy non-paused, until `done` |
| `appendReferences` | node-contract inputs | pre-claim; required refs must resolve |

**Immutable forever: `type` and `evidenceRequirements`.** Those are the genuine invariant — a mis-seeded evidence contract still forces a re-seed. Everything else in the table is reachable.

**Edges are append-only, in both directions.** You can *extend* a contract; you cannot *retract* one. A driver whose `completionDependsOn` names a superseded scope can have the new nodes appended — the stale entries stay. Plan for that when re-scoping mid-arc: appending is cheap, removing is a new graph.

### 🔴 The failure mode that makes this look impossible

**Passing a settable field at the top level instead of inside `set{}` returns `empty mutation (no set fields, no appends)`.** That message describes a *different* problem than the one you have, and it reads as *"this field cannot be changed."*

```
update_work { workId, runbook: "..." }          -> empty mutation   (field ignored)
update_work { workId, set: { runbook: "..." } } -> changed: ["runbook"]
```

**A rejection that answers a question you did not ask is how an operator builds a wrong model of the substrate and keeps it.** If a mutation is refused, **probe it on a disposable node before concluding the capability is absent** — create, mutate, read `changed[]`, abandon. It costs thirty seconds and it is the difference between a defect report and a usage error.

**Claimant-significant fields** (`targetRef` / `runbook` / `payload` / `roleEligibility` and all appends) reject with `workgraph.currentness.revision_required` **while paused, or whenever a topology generation is active** — that is when the semantic revision protocol is required, and only then.

**Do not route contract corrections through chat.** A runbook amendment sent as a message is invisible to a cold-start claimant, to the closeout, and to every later reader of the node. If the field is reachable, change the node.

## Drive loop

At the start of every controller turn:

1. Read the driver with `get_work(driverId, includeCompletionProgress:true)`.
2. Renew the driver lease if you still control the arc and have the token.
3. Read `get_current_stint(driverId)` for whole-arc state.
4. Read `get_next_action(driverId)` for the highest-priority ready child claimable by your role.
5. Check in-flight and blocked children by targeted `get_work`, not by broad guesswork.
6. Act on the next legal move: claim/start a child, update work, review PR state, route a blocker, or close completed evidence.
7. Record durable facts in WorkItems, Hub entities, docs, or git; do not rely on chat memory.
8. Before ending the turn, classify the outcome: `advanced`, `lane-dispatched`, `completed`, `blocked`, or `no-legal-action-proven`. If the only actions were renew/ack/read/stale-FYI handling, the controller has not made progress; continue the loop or record the real gate.

Do not use blind sleeps or poll loops as the primary control mechanism.
Let leases, WorkGraph projections, queue events, and GitHub/CI state drive the next action.

## Engineer and verifier lanes

Keep lanes explicit:

- Engineer nodes produce implementation, designs, tests, docs, traces, or audits.
- Verifier nodes independently assess evidence, invariants, CI, substrate behavior, or release readiness.
- The controller integrates both into the WorkGraph close decision.

A verifier verdict is not a substitute for controller judgment unless the WorkItem evidence contract explicitly requires verifier-attestation authority.
An engineer's completion note is not a substitute for CI, PR, or evidence refs.

When an agent is idle while the arc has ready work for that role, seed or expose the next node through the graph rather than manually pinging the agent.
When there is no legal ready work, the projection should say why: dependency blocked, WIP-capped, quarantined, paused, review-gated, or genuinely complete.

Repeated participant confusion is an orchestration-design failure, not merely a participant failure. If engineers or verifiers repeatedly miss evidence shape, friction reporting, stale-notification handling, or authority boundaries, improve the blueprint/runbooks/skill bundle or seed follow-up substrate work rather than relying on memory.

## PR, review, and merge discipline

Use `workgraph-pr-delivery` for the complete exact source-to-live ladder and `workgraph-verification-gates` for independent source/effect gates.
For code arcs:

- Branch before editing.
- Open a PR for reviewable deltas.
- Require non-pusher/code-owner review when branch protection or discipline requires it.
- Use the merge queue when configured.
- Treat GitHub checks and merge commits as ground truth.
- Bind PR URLs, check runs, review IDs, commit SHAs, and merge commits into WorkItem evidence or closeout docs.
- Keep commit messages free of AI attribution.

A PR being merged is not the same as the arc being closed.
After merge, update or complete the relevant WorkItems, verify deployed/runtime claims only if they were actually observed, and record any unproven live-event claims as unproven.

## Evidence discipline

Complete WorkItems with artifacts, not vibes.

Good evidence includes:

- commit SHA or PR URL for code;
- CI/check-run URL or test command output for validation;
- review or verifier-attestation ID for independent assessment;
- Hub document path for plans, audits, closeouts, and traces;
- bug/idea/mission IDs for backlog changes;
- explicit note separating code/CI proof from live production proof;
- explicit `frictionReflection` on completion, either `observed:false` or a concise observed-friction summary with category and follow-up routing.

Do not fabricate live evidence.
If the code path is merged but no production event has been observed, say exactly that.
If no friction was observed, say so explicitly with `observed:false`; a missing reflection is ambiguous and weakens A10 learning.

## Typed hard stops and constitution-guided recovery

Evaluate canonical hard stops before every effect.
Stop the affected lane with no effect when constitution is stale/unavailable, authority or exact binding mismatches, an active FAIL exists, an effect gate is missing/invalid, scope conflicts, verifier independence fails, protected delivery is denied, live proof uses forbidden fallback, driver would complete early, or Director walkthrough proof is unresolved.

A hard stop changes control state, not historical stage truth.
Persist the reason, blocked effects, and no-effect receipt.
Then use `workgraph-recovery`:

- routine implementation, CI, verifier, capacity, or reversible infrastructure failure stays autonomous;
- preserve every candidate/attempt/gate polarity and failed-gate lease containment;
- author a distinct bounded repair and independently gate it;
- resume only after current authority and active-valid repair proof;
- escalate only constitutional/authority/destructive/irreducible external conflicts.

Never "clean up" WIP by releasing or terminalizing a mandatory failed-gate lease.
Capacity is solved by another explicitly assigned seat or by deployed failed-seal mechanics, not by deleting negative authority.

## Recovery playbook

### Lost or expired driver lease

Read the driver with `get_work`.
If it returned to `ready`, reclaim and restart it.
If another legitimate controller holds it, do not steal it; coordinate through the WorkGraph or Director.
If the token is lost but you still hold the lease, recover it from the WorkItem lease projection when exposed.

### 🔴 Destroyed or unclosable driver — this is a STOP, not a degraded mode

Distinct from a lost lease. The lease case is recoverable by reclaiming; **this one is not recoverable at all**, and the arc will keep looking normal while it runs.

A driver is destroyed or unclosable when it has been abandoned, or when children its `completionDependsOn` names have been terminalised — including by an authorised cleanup sweep. **Sweeping a superseded scope can destroy the driver's own close path**, because closeout/disposition children look exactly like stale scaffolding from outside.

**On discovering it:**

1. **STOP DISPATCHING.** Do not seed, claim, or route further child work. An arc with no driver has no completion contract, no `k/N`, and no definition of done — every node after this point is ungoverned regardless of how well it is executed.
2. **Re-seed a driver before anything else**, carrying the surviving scope fence and close criteria. Note in its runbook that it succeeds a destroyed driver and why, so the gap is legible at closeout rather than inferred.
3. **If the arc genuinely cannot be re-driven, close it and re-cut.** That is a real outcome, not a failure to persevere.

**Do not continue in "executor mode with authority."** Driving nodes competently is not governing an arc, and the difference is invisible from inside — the work still ships, the gates still pass, and nothing reports that the contract is gone.

**Detection is the hard part, so check it explicitly rather than waiting to notice.** A query scoped to `status=ready` cannot see an `in_progress` driver; a sweep of dead scaffolding will report a clean, confident, complete-looking result while the driver sits outside its scope. **Before any cleanup sweep, enumerate the drivers you intend to keep, and re-read them after.**

> **A query's scope is part of its result. A finding from `status=ready` is a finding ABOUT `status=ready`, never about the graph — and the author of a sweep is the worst-placed person to notice which rows the sweep cannot see.**

### Stale FYI or crossed message

Do not reply-loop.
Read the bound WorkItem, PR, mission, or thread.
If the state is already advanced, ignore or ack only if required by the message protocol.

### Blocked child

Use `block_work` with a concrete blocker reference when the holder cannot proceed.
If the blocker is structural, create or link the missing WorkItem rather than leaving the reason in prose.
If the child is no longer needed, use the legal terminal path and update the driver/closeout rationale.

### Failed PR or red CI

Keep the implementation node open or blocked.
Record the failing check and remediation path.
Do not close verifier or driver nodes until the repaired artifact is merged or explicitly abandoned.

### Verifier offline

Do not silently drop the gate.
Options are, in order:

1. wait if the verifier gate is required and the arc is not urgent;
2. seed a fresh verifier-capable node if another verifier is available;
3. use controller-run adversarial verification only if the charter permits advisory substitution;
4. record the authority downgrade clearly in closeout.

Never turn a required verifier-attestation evidence requirement into executor evidence by prose.

### Scope creep

Check the scope fence.
If the new work is necessary for close, add it as a WorkItem or append a completion dependency.
If it is valuable but outside the fence, file an idea/bug/follow-up and keep the current arc narrow.

## Closeout procedure

For terminal closeout, use the specialist skill `workgraph-arc-closeout`.
This root skill owns the full arc control loop; `workgraph-arc-closeout` owns the terminal proof reconciliation.

Disambiguate two closeout modes:

- **Substrate closeout** — reconcile evidence, write the packet, complete the closeout WorkItem, then complete the driver last.
- **Director live closeout** — a progressive Director/operator walkthrough of the completed or nearly-completed packet, with pauses and decision-state. This can be requested before or after substrate closeout.

If the Director/operator says `commence closeout`, `initiate closeout`, `walk me through the closeout`, or equivalent, do **not** answer only with WorkGraph status or "already done". Treat it as a request for Director live closeout unless they explicitly ask only for substrate state. If a packet already exists, start the live walkthrough from that packet; if no packet exists, say the substrate closeout is not ready and name the missing gates. If a packet previously marked live walkthrough `not applicable`, and the Director later requests it, correct the record with a follow-up note/doc revision rather than insisting the earlier row is final.

Minimum closeout invariant:

1. Read `get_current_stint(driverId)` and confirm all required children are done or explicitly dispositioned.
2. Read load-bearing children with `get_work` when their evidence affects close truth.
3. Reconcile delivery truth separately for local tests, PRs, reviews, CI, merge, release/publish, deploy, live observation, and verifier proof.
4. Preserve failed verifier gates and repair/rerun lineage.
5. Update active surfaces or mark them unaffected/historical/residual.
6. Update linked ideas, bugs, missions, decisions, and follow-ups.
7. Write a closeout packet before completing closeout/driver work.
8. Complete the closeout WorkItem, then complete the driver last.
9. Evaluate and deliver progressive Director closeout (or capture explicit waiver/valid point-in-time not-applicable) as a distinct terminal interface.
10. After terminal state, correct later-discovered claim drift only through an append-only correction linked to the original record; never re-complete or rewrite terminal WorkItems.

Do not call a future observation done.
If code is merged but live behavior was not observed, record `live not observed` and file follow-up if the live claim matters.

## Relationship to arc-lifecycle

`arc-lifecycle` and `workgraph-arc-operator` answer different questions.

| Question | Use |
|---|---|
| What is the summit, value chain, payoff class, or revival trigger? | `arc-lifecycle` |
| How do I seed, claim, drive, recover, verify, merge, and close this on the Hub? | `workgraph-arc-operator` |
| Is a deferred item banked, staked, or mixed? | `arc-lifecycle` |
| Which WorkItem is next, who holds the lease, and what evidence closes it? | `workgraph-arc-operator` |

Use them together for serious arcs: `arc-lifecycle` keeps the value model honest; this skill keeps the execution substrate honest.

## Acceptance bar for using this skill

An arc operated under this skill should be cold-start legible to another agent.
Given only the driver WorkItem ID, that agent should be able to answer:

- what the arc is trying to deliver;
- what is in and out of scope;
- which children block close;
- who holds active leases;
- what the next legal action is;
- what evidence exists;
- what remains unproven;
- how to close or recover the arc.

If those answers live only in the controller's memory, the arc is not yet WorkGraph-operated.
