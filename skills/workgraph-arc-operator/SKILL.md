---
name: workgraph-arc-operator
description: "Use to commence, execute, recover, and close a Hub WorkGraph-based arc. This is the substrate-specific companion to arc-lifecycle: arc-lifecycle reasons about value chains, payoff, deferral, and revival; workgraph-arc-operator runs the actual control loop through WorkItems, blueprints, leases, evidence, verification, PRs, and closeout. Use when an agent is driving a multi-node initiative on the Hub WorkGraph and must keep liveness, authority, evidence, and scope under control."
metadata:
  related-skills: arc-lifecycle, survey, substrate-audit, research-artefacts, workgraph-arc-closout
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

## Source-of-truth hierarchy

Prefer substrate truth in this order:

1. WorkGraph state: `get_current_stint`, `get_next_action`, `get_work`, `list_work`, `legal_moves`.
2. GitHub / CI truth: PR status, reviews, merge queue, checks, merge commits.
3. Hub entities: mission, ideas, bugs, decisions, documents.
4. Messages and FYIs.

Messages are useful signals, not authority.
A PASS note, merge FYI, or thread reply does not close an arc unless the bound WorkItem evidence and state close it.

## Commence checklist

Do not seed first and reason later.
Commence in this order:

1. **Confirm authority.** Identify the Director/operator approval, decision, mission, or backlog item that authorizes the arc.
2. **State the scope fence.** Name what is in scope, what is out of scope, and which broad temptations are explicitly deferred.
3. **Write the plan.** Persist the arc plan in a Hub document or repo doc with goal, slices, risks, evidence, and close criteria.
4. **Run an axiom alignment audit when the plan/design is extensive.** Use `M7` before implementation approval for arcs that create or change reusable methodology, workflow, skill, template, substrate behavior, governance, coordination, lifecycle, delivery, verification, or authority patterns.
5. **Write or select the blueprint.** Use a deterministic `runId`; include one controller driver and one or more child nodes. If the axiom audit is required, represent it as a WorkItem dependency before implementation nodes can start.
6. **Validate before mutation.** Run `seed_blueprint(..., dryRun:true)` when available for the whole graph.
7. **Seed the graph.** Run `seed_blueprint` with the final `runId` and blueprint.
8. **Claim/start the driver.** The controller claims and starts the driver before delegating child work.
9. **Capture the lease token.** Renew with that token throughout the arc.
10. **Project the arc.** Read `get_current_stint(driverId)` and `get_next_action(driverId)` immediately after start.

A commenced arc with no claimed driver is already partially uncontrolled.
Fix that before adding more child work.

## Blueprint shape

A healthy WorkGraph arc blueprint has these features:

- **One controller driver.** `roleEligibility` restricted to the controller role, usually `architect`; `completionDependsOn` lists every required child.
- **Cold-start child runbooks.** Every child says what to do, where to look, what to produce, and how to prove it.
- **Typed references.** Required docs/entities/git refs are listed as `references[]`, not hidden in prose.
- **Evidence contracts.** Each node names the artifacts needed to complete it; verifier gates use verifier authority where appropriate.
- **Verifier lane.** Backplane, deploy-gating, substrate, security, or high-risk arcs include explicit verifier-gate/review nodes.
- **Closeout child or driver evidence.** The arc has a documented close packet, retrospective, or delivery note as a required artifact.
- **No dangling dependencies.** Start-gates and completion-gates must resolve at seed time.
- **Axiom alignment gate for extensive planning/design.** If the arc changes reusable procedure, substrate behavior, or coordination policy, include an axiom-audit node before implementation approval.
- **No hidden manual step.** If a step is required to close, it is a WorkItem, evidence requirement, or explicit reference.

The graph should be understandable from `get_current_stint(driverId)` plus child `get_work` reads without relying on the controller's memory.

## Drive loop

At the start of every controller turn:

1. Read the driver with `get_work(driverId, includeCompletionProgress:true)`.
2. Renew the driver lease if you still control the arc and have the token.
3. Read `get_current_stint(driverId)` for whole-arc state.
4. Read `get_next_action(driverId)` for the highest-priority ready child claimable by your role.
5. Check in-flight and blocked children by targeted `get_work`, not by broad guesswork.
6. Act on the next legal move: claim/start a child, update work, review PR state, route a blocker, or close completed evidence.
7. Record durable facts in WorkItems, Hub entities, docs, or git; do not rely on chat memory.

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

## PR, review, and merge discipline

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
- explicit note separating code/CI proof from live production proof.

Do not fabricate live evidence.
If the code path is merged but no production event has been observed, say exactly that.

## Recovery playbook

### Lost or expired driver lease

Read the driver with `get_work`.
If it returned to `ready`, reclaim and restart it.
If another legitimate controller holds it, do not steal it; coordinate through the WorkGraph or Director.
If the token is lost but you still hold the lease, recover it from the WorkItem lease projection when exposed.

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

For terminal closeout, use the specialist skill `workgraph-arc-closout`.
This root skill owns the full arc control loop; `workgraph-arc-closout` owns the terminal proof reconciliation.

Minimum closeout invariant:

1. Read `get_current_stint(driverId)` and confirm all required children are done or explicitly dispositioned.
2. Read load-bearing children with `get_work` when their evidence affects close truth.
3. Reconcile delivery truth separately for local tests, PRs, reviews, CI, merge, release/publish, deploy, live observation, and verifier proof.
4. Preserve failed verifier gates and repair/rerun lineage.
5. Update active surfaces or mark them unaffected/historical/residual.
6. Update linked ideas, bugs, missions, decisions, and follow-ups.
7. Write a closeout packet before completing closeout/driver work.
8. Complete the closeout WorkItem, then complete the driver last.

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
