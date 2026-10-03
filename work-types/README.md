---
id: W0
category: work-type
title: Work-types - the composition rule, the canonical closeability preflight, and the entry schema
status: active
hydrate-when: You are classifying a unit of work and need the composition rule or the closeability preflight
related: [R0, D0, T0, E5, A3, A6, A7, A11]
---

# Work-types - composition, closeability, and schema

## Purpose

This is the **canonical** cross-axis reference for the work-taxonomy.\
Every `work-types/W*.md` entry references this file for its composition rule and its closeability preflight - **the constraint set is authored here once and never forked per entry** (M7 guardrail #2).\
Read `roles/README.md` (the M role axis) and `domains/README.md` (the N domain axis) alongside this.

The taxonomy exists to let strategic intent compile into self-fed WorkGraph execution (A13): a `role x work-type x domain` triple **generates** a claimable WorkItem with a complete evidence contract, so idle agents can be fed well-typed work and the Director/architect need not hand-route it (A6, A11).

---

## Territory

This set covers **the kinds of work an engineering organisation does**, each a verb-family that compiles to a closeable claimable node.\
The kinds group by what the work does, and the groups are the denominator.

| Group | What the work does | Members |
|---|---|---|
| **Build** | changes a system - the product, the harness, or the organisation's own machinery and knowledge | `W1` build a slice, `W2` fix a bug, `W3` retire or hard-cut, `W5` author guard or falsifier tests |
| **Check** | produces evidence about work, its own or another's | `W4` validate locally, `W8` verify gate, `W9` audit a surface, `W10` adversarial design review, `W11` live probe, `W12` meta-validate by dogfooding, `W22` axiom-alignment gate |
| **Land and ship** | moves a change to where it runs or is read | `W6` merge and land, `W7` publish or deploy, `W26` reset or converge the fleet |
| **Approve and decide** | exercises authority over work | `W13` code-owner approve, `W23` capture and ratify a decision, `W24` director walkthrough |
| **Design** | shapes work before it is built | `W14` design a contract or invariant, `W15` convene a council |
| **Keep knowledge** | captures what work taught | `W16` bank an idea, `W17` author a closeout packet |
| **Coordinate** | runs the arcs work happens inside | `W18` seed an arc, `W19` drive an arc, `W20` reconcile a ledger, `W21` repair an arc, `W25` backstop a production window |

Every work-type sits in one row.

**The set grows when the territory finds a gap.**\
This set is not complete and is not expected to be.\
A recurring kind of work that compiles to a closeable claimable node and fits no work-type is closed by adding one, not by stretching a neighbour to cover it, because a stretched work-type carries two evidence contracts under one name; until it exists, the work is recorded against the gap, as a row in the project's backlog ([`AR5`](../artifacts/AR5-backlog.md)).\
Work that cannot compile to a node - no trigger, nothing to close - is recorded as a routing note instead, as incident recovery is below.\
A new work-type is authored like any entry: from a peer exemplar ([`PC1`](../practices/PC1-author-from-exemplar.md)), against the entry schema below, landing through the gate; adding one changes how work is generated, so it is ratified by the director.

**Gaps recorded.**\
*Changing the knowledge corpus* has no work-type for building, fixing, retiring or landing: every work-type in those groups excludes the knowledge domain, and `W16` only captures new capital.\
Extending the corpus - adding or retiring a layer - is the recurring case.\
*Changing the governance or coordination machinery* is covered only if the machinery's own codebase counts as the product codebase under the domains' rule that a change belongs where its diff lands; if it counts as its own domain, building and landing there is a gap too.\
The domains set has not said which, and its answer settles this.\
The domains charter's tie-break, applied to one such change, settles which.\
Procedures that conduct work are cited by only some work-types, and artifacts by fewer; a work-type cites what it can name, and the rest are recorded rather than guessed.

---

## Two structural concepts, three pure axes

The model is **axes + composition** - there is no separate overlay layer, and no enumerated `MxNxK` table.

- **ROLES (M=4)** - `architect, engineer, verifier, director`. Pure on
  *essence*; the authority component of engagement-mode is *type-determined*.
  See `roles/`.
- **DOMAINS (N=7)** - subject-surfaces (what a node's evidence resolves
  against). Orthogonality is **bimodal**: `free` for object-level build/ship/
  assurance work, `pinned` for meta/substrate work. See `domains/`.
- **WORK-TYPES (K~=26)** - verb-families carrying the *mode* + *shape* of work.
  This directory.

Definitions stay linear (M+N+K); richness is computed at compose-time.\
The `aggregate > sum` claim holds fully for the free build/ship/assurance third (where the idle engine is most active) and is honestly `pinned` for the meta third - stated, not over-claimed (A3: honest boundaries over false symmetry).

---

## The composition rule (generative-with-constraints)

```
role x work-type x domain
   -> WorkItem template (type, roleEligibility, priority, dependsOn,
                        completionDependsOn, references, targetRef,
                        evidenceRequirements)
   + evidence-authority + independence constraints + QoS overlays
```

This describes the live substrate (`roleEligibility` + `evidenceRequirements` + SEAL `attest_evidence` already implement it), not an invention.\
An enumerated triple-table is rejected - it freezes the many-to-many and dies on role-doubling and overlay-hatting.

**Everything else attaches by citation or by system, never by widening the triple.**\
The work-type cites the procedure that conducts it, in `methods`, and the document it produces, in `produces`; the axioms come from the systems the change alters ([`E5`](../entities/E5-system.md), [`T0`](../traits/README.md)).\
Adding method or system as a fourth axis would multiply every combination into the table this rule rejects.

**The order a cold agent assembles one unit of work in:**

1. **The systems the change alters** give the traits, and so the axioms in force; the organisation doing the work is a system too, and its axioms govern how the work is done and recorded.
2. **The work-type** gives the eligible roles and domains, and its `evidenceAuthority` says who may satisfy the evidence.
3. **The domain** is the surface the work's evidence lands on ([`D0`](../domains/README.md)).
4. **The role** is who performs it; what it may attest is set by role and work-type together ([`R0`](../roles/README.md)).
5. **The method and artifact** are the ones the work-type cites.

---

## The canonical constraint set (= the closeability preflight)

These nine constraints are the composition rule.\
The **`closeabilityPreflight` of a work-type is exactly the seed-time projection of this set** - a work-type does not restate them, it *satisfies* them.\
A generated node that cannot pass this preflight at seed is not admitted (this is what makes the catalog safe for autonomous generation - A7, A8).

1. **RoleEligibility permissive, authority strict.** Many roles may perform a
   type; only the `evidenceAuthority` path may *satisfy* its evidence.
2. **Independence is structural + roster-aware.** `evidenceAuthority:
   verifier-attestation` requires the attesting role-set to contain an identity
   that **cannot be the executor given the LIVE roster** (single-agent-per-role
   aware). If the live roster collapses attester and executor to one agent ->
   **fail the seed**, and the gate waits for an independent agent or is met by
   director ratification (constraint 9); a same-agent review never stands in.
   Verifier-*held* gates use plain `kind:review`, never verifier-attestation
   (this is the bug-249 fix).
3. **DomainEligibility gates the pairing.** `domain` is IN the intersection: a
   `(work-type x domain)` outside the type's `domainEligibility` is rejected.
   `domainFreedom: pinned` means the generator does not vary the domain. Each
   parameter carries a `bindingSource` so `targetRef` resolves to a real entity
   (no vacuous nodes) - A1.
4. **TargetRef / references required for relatedness gates.** If the authority
   needs related refs, seed them or fail the blueprint.
5. **Falsifier required.** Every generated node names the concrete observation
   that turns it FAIL/blocked rather than prose.
6. **Repair-path required for completion-gated seeds.** Any node seeded inside a
   `completionDependsOn` gate MUST carry a declared supersession/disposition
   `compositionHook`. Never bare-abandon a completion-gate child as a repair
   strategy (this is the bug-250 fix - `abandoned != done`, so an abandoned
   child traps the parent forever).
7. **Generation-mode gates idle-pooling.** Only `proactive-poolable` types enter
   the idle pool. A `proactive-poolable` executor-evidence type either carries a
   **mandatory bracketing `verify-gate` compositionHook** the idle engine
   instantiates alongside it, **or** is `evidenceAuthority:
   executor-evidence-provisional` - its closure does not count as assurance
   until an independent gate consumes it. **No executor-evidence idle node
   reaches terminal `done` on self-produced evidence with an unevaluated
   falsifier** (the idle-pool anti-gaming rule).
8. **Author != approver for independence gates.** For `code-owner-approve` (and
   any independence gate), the eligible-approver set must contain >=1 identity
   distinct from the bracketed node's author; else fail the seed and surface a
   **director-ratification** path (the only authority that can unblock a
   sole-code-owner self-approval).
9. **Degradation is bounded.** In a thin roster, an own-seat independence check
   may degrade to **defer-until-independent-seat** or **director-ratification**
   ONLY. It may **never route to the architect when the architect is (or is
   eligible as) the node's executor** - that reintroduces self-attestation.
   Same-agent review is never a valid degradation.

---

## The entry schema (`work-types/W*.md` frontmatter)

A candidate is taxonomy-grade **iff it compiles to a closeable claimable node**.\
A work-type carries these fields; `generatable`, `methods` and `produces` are optional, and the rest are required:
```yaml
id:                   W<n>
category:             work-type
title:                <kebab-verb-phrase> - <one-line>
status:               active    # see schemas/catalog-entry for the vocabulary
generatable:          false     # optional; set only when the type must be authored by hand
roleEligibility:      [<pure role union>]
evidenceContract:     [{kind, description}, ...]      # the evidenceRequirements[] template - the compile-target
evidenceAuthority:    executor-evidence | executor-evidence-provisional | verifier-attestation | director-ratification
domainEligibility:    [<subject-surfaces>]            # a single value when pinned
domainFreedom:        free | pinned
parameters:           [{name, fills, bindingSource, predicate}]   # bindingSource: discover-from-substrate | provided-by-trigger | operator-supplied
generationMode:       proactive-poolable | reactive-triggered | arc-seeded | externally-triggered
falsifier:            <the observation that turns the node FAIL, not prose>
compositionHooks:     <dependsOn / completionDependsOn patterns>
methods:              [<M ids>]       # optional; the procedures that conduct this work
produces:             [<AR ids>]      # optional; the document types this work produces
```

Body sections (PC1 exemplar): `## Definition`, `## Evidence & closeability` (reference this file's constraint set - do not restate it), `## Generation` (mode + how idea-425/451/403 instantiate it), `## Axiom alignment` (load-bearing citations only - no decoration, per M7 / the per-item axiom-test gate), `## Origin`.

---

## generation-mode - the idle-safety field

- **`proactive-poolable`** - mintable against the existing substrate, no
  trigger. The idle-QoS pool (idea-403/404). Honest set: `audit-a-surface`,
  `bank-idea`, `author-guard-or-falsifier-tests`, `reconcile-ledger` (each under
  constraint 7's provisional/bracket rule).
- **`reactive-triggered`** - instantiated by a substrate trigger (a bug, a
  build, an approved PR, a director signal, a FAILed/trapped completion child).
- **`arc-seeded`** - minted by a driver inside a blueprint (seed, drive,
  closeout, council, backstop).
- **`externally-triggered`** - gated on out-of-band human/Director availability
  the engine cannot schedule (director-mode ceremonies). Never idle-pooled or
  auto-minted; waits for the external signal.

---

## Two generation-engine requirements (not taxonomy entries)

- **verify-gate is generative-on-FAIL.** A FAIL grows a repair subgraph via a
  conditional edge (an idea-451 primitive, currently unbuilt). `arc-repair` has
  a `reactive-triggered` path so that edge can mint it; a FAIL on a
  completion-gated child MUST route through `arc-repair`'s supersession path,
  never bare-abandon.
- **Separation-of-duties degrades by constraint 9**, not by a full-roster
  assumption.

---

## Not a work-type: `recover-incident`

Incident-recovery is **not a generatable work-type** - there is no `incident` substrate entity for a trigger to fire on, and once an incident is machine- visible it *is* a bug.\
It is recorded as a **posture / routing note**: an incident routes through `fix-a-bug-or-repair` / `arc-repair`; the friction it surfaces is harvested via `bank-idea-or-knowledge-capital`.

---

## Backstop is a work-type, not a layer

`backstop-a-prod-window` (W-series) is an ordinary `arc-seeded` work-type with a `backstop:true` flag, a `roleEligibility` union, final-disposition evidence, and a "stands-down-last" `compositionHook` (`completionDependsOn` on the bracketed nodes).\
There is **no `overlays/` directory**.

---

## Axiom alignment

- **A2 (Isomorphic Specification):** the frontmatter schema is the
  machine-parseable contract the generation engine (idea-425/451) consumes.
- **A11 (Cognitive Minimalism):** the canonical constraint set moves pool-safety
  and evidence contracts into schema fields so LLMs do not re-derive them.
- **A8 (Gated Recursive Integrity):** the closeability preflight is the
  lower-layer gate a generated node must pass before it bears weight.

---

## Faults

Population faults - visible across the set, invisible to any one work-type.

- **Two work-types for one act.** Two entries a generator could mint for the same work, so the same node appears under two names.
- **The restated constraint.** A work-type that copies the canonical constraint set instead of satisfying it; the copy drifts from the one source.
- **The doubly-declared pairing.** A pairing stated on the work-type and again on the domain, free to disagree; only the work-type's list governs, and the domain's view is generated.
- **The uncovered work.** A recurring kind of work no work-type covers, so it is hand-routed every time.
- **The uncited procedure.** A procedure that conducts work cited by no work-type, so a coordinating system cannot attach it.

---

## Index

<!-- BEGIN GENERATED: entries. Run tools/generate-index.mjs; do not edit by hand. -->
| ID | Title | Hydrate when |
|---|---|---|
| [W0](README.md) | Work-types - the composition rule, the canonical closeability preflight, and the entry schema | You are classifying a unit of work and need the composition rule or the closeability preflight |
| [W1](W1-build-a-slice.md) | build-a-slice - implement a scoped increment | You are scoping the implementation of a bounded increment |
| [W2](W2-fix-a-bug-or-repair.md) | fix-a-bug-or-repair - resolve a filed defect | You are resolving a defect that has already been filed |
| [W3](W3-retire-or-hard-cut.md) | retire-or-hard-cut - delete a surface with disposition | You are deleting a surface and must say what happens to what depended on it |
| [W4](W4-validate-locally.md) | validate-locally - self-check a fresh artifact | You have a fresh artifact and are self-checking it before anyone else sees it |
| [W5](W5-author-guard-or-falsifier-tests.md) | author-guard-or-falsifier-tests - add a test that can fail | You are adding a test that is able to fail |
| [W6](W6-merge-and-land.md) | merge-and-land - land an approved change on canonical main | You are landing an approved change on the canonical branch |
| [W7](W7-publish-deploy-or-canonicalize.md) | publish-deploy-or-canonicalize - ship to the estate/channel | You are shipping something to the estate or a release channel |
| [W8](W8-verify-gate-reactive.md) | verify-gate-reactive - independently gate a build/change | You are gating a build or change that you did not author |
| [W9](W9-audit-a-surface.md) | audit-a-surface - bounded adversarial sweep of a surface | You are sweeping a bounded surface adversarially rather than reviewing a diff |
| [W10](W10-adversarial-design-review-upstream.md) | adversarial-design-review-upstream - critique a design before build/merge | You are critiquing a design before it is built or merged |
| [W11](W11-run-a-live-probe-or-smoke.md) | run-a-live-probe-or-smoke - observe live behavior at a revision | You need to observe live behaviour at a specific revision |
| [W12](W12-meta-validate-dogfood.md) | meta-validate-dogfood - use the deliverable as its own test | You are using a deliverable as its own test |
| [W13](W13-code-owner-approve.md) | code-owner-approve - non-author independence approval | You are approving as a code owner who did not write the change |
| [W14](W14-design-a-contract-or-invariant.md) | design-a-contract-or-invariant - author a design-of-record | You are authoring a design of record, a contract or an invariant |
| [W15](W15-convene-a-council.md) | convene-a-council - multi-lens deliberation + synthesis | You need several lenses deliberated and synthesised before deciding |
| [W16](W16-bank-idea-or-knowledge-capital.md) | bank-idea-or-knowledge-capital - capture reusable capital | You have reusable capital in hand and are capturing it |
| [W17](W17-author-closeout-packet.md) | author-closeout-packet - proof-level arc closeout | You are closing an arc and must assemble proof rather than narrative |
| [W18](W18-seed-a-blueprint-arc.md) | seed-a-blueprint-arc - instantiate a WorkGraph arc | You are instantiating a staged arc from a blueprint |
| [W19](W19-drive-an-arc.md) | drive-an-arc - operate an arc over its lifetime | You are operating an arc across its lifetime rather than a single node |
| [W20](W20-reconcile-ledger.md) | reconcile-ledger - reconcile entity/backlog state vs truth | Entity or backlog state has diverged from truth and you are reconciling it |
| [W21](W21-arc-repair.md) | arc-repair - repair a WorkGraph arc topology | An arc topology is wrong and you are repairing it in place |
| [W22](W22-axiom-alignment-gate.md) | axiom-alignment-gate - per-item axiom-alignment check | You are checking a single item against the axioms it claims to satisfy |
| [W23](W23-capture-decision-and-ratify.md) | capture-decision-and-ratify - record + ratify a decision | You are recording a decision and having it ratified |
| [W24](W24-director-walkthrough.md) | director-walkthrough - live Director sensemaking walkthrough | You are walking the director through something live for sensemaking |
| [W25](W25-backstop-a-prod-window.md) | backstop-a-prod-window - hold abort/rollback over a risk window | You are holding abort or rollback authority across a risk window |
| [W26](W26-reset-or-converge-the-fleet.md) | reset-or-converge-the-fleet - restore fleet to a healthy state | The fleet is unhealthy and you are restoring it to a known state |
<!-- END GENERATED -->
