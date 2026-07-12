---
id: WT0
category: work-type
title: Work-types — the composition rule, the canonical closeability preflight, and the entry schema
added: 2026-07-13
status: active
related: [R0, D0, A0, A3, A6, A7, A11]
source: worktax0 (docs/design/worktax-ratified-design.md v2)
---

# Work-types — composition, closeability, and schema

This is the **canonical** cross-axis reference for the work-taxonomy. Every
`work-types/W*.md` entry references this file for its composition rule and its
closeability preflight — **the constraint set is authored here once and never
forked per entry** (M7 guardrail #2). Read `roles/README.md` (the M role axis)
and `domains/README.md` (the N domain axis) alongside this.

The taxonomy exists to let strategic intent compile into self-fed WorkGraph
execution (A0): a `role × work-type × domain` triple **generates** a claimable
WorkItem with a complete evidence contract, so idle agents can be fed
well-typed work and the Director/architect need not hand-route it (A6, A11).

## Two structural concepts, three pure axes

The model is **axes + composition** — there is no separate overlay layer, and no
enumerated `M×N×K` table.

- **ROLES (M=4)** — `architect, engineer, verifier, director`. Pure on
  *essence*; the authority component of engagement-mode is *type-determined*.
  See `roles/`.
- **DOMAINS (N=6)** — subject-surfaces (what a node's evidence resolves
  against). Orthogonality is **bimodal**: `free` for object-level build/ship/
  assurance work, `pinned` for meta/substrate work. See `domains/`.
- **WORK-TYPES (K≈26)** — verb-families carrying the *mode* + *shape* of work.
  This directory.

Definitions stay linear (M+N+K); richness is computed at compose-time. The
`aggregate > sum` claim holds fully for the free build/ship/assurance third
(where the idle engine is most active) and is honestly `pinned` for the meta
third — stated, not over-claimed (A3: honest boundaries over false symmetry).

## The composition rule (generative-with-constraints)

```
role × work-type × domain
   → WorkItem template (type, roleEligibility, priority, dependsOn,
                        completionDependsOn, references, targetRef,
                        evidenceRequirements)
   + evidence-authority + independence constraints + QoS overlays
```

This describes the live substrate (`roleEligibility` + `evidenceRequirements` +
SEAL `attest_evidence` already implement it), not an invention. An enumerated
triple-table is rejected — it freezes the many-to-many and dies on role-doubling
and overlay-hatting.

## The canonical constraint set (= the closeability preflight)

These nine constraints are the composition rule. The **`closeabilityPreflight`
of a work-type is exactly the seed-time projection of this set** — a work-type
does not restate them, it *satisfies* them. A generated node that cannot pass
this preflight at seed is not admitted (this is what makes the catalog safe for
autonomous generation — A7, A8).

1. **RoleEligibility permissive, authority strict.** Many roles may perform a
   type; only the `evidenceAuthority` path may *satisfy* its evidence.
2. **Independence is structural + roster-aware.** `evidenceAuthority:
   verifier-attestation` requires the attesting role-set to contain an identity
   that **cannot be the executor given the LIVE roster** (single-agent-per-role
   aware). If the live roster collapses attester and executor to one agent →
   **fail the seed or downgrade to `kind:review`**. Verifier-*held* gates use
   plain `kind:review`, never verifier-attestation (this is the bug-249 fix).
3. **DomainEligibility gates the pairing.** `domain` is IN the intersection: a
   `(work-type × domain)` outside the type's `domainEligibility` is rejected.
   `domainFreedom: pinned` means the generator does not vary the domain. Each
   parameter carries a `bindingSource` so `targetRef` resolves to a real entity
   (no vacuous nodes) — A1.
4. **TargetRef / references required for relatedness gates.** If the authority
   needs related refs, seed them or fail the blueprint.
5. **Falsifier required.** Every generated node names the concrete observation
   that turns it FAIL/blocked rather than prose.
6. **Repair-path required for completion-gated seeds.** Any node seeded inside a
   `completionDependsOn` gate MUST carry a declared supersession/disposition
   `compositionHook`. Never bare-abandon a completion-gate child as a repair
   strategy (this is the bug-250 fix — `abandoned != done`, so an abandoned
   child traps the parent forever).
7. **Generation-mode gates idle-pooling.** Only `proactive-poolable` types enter
   the idle pool. A `proactive-poolable` executor-evidence type either carries a
   **mandatory bracketing `verify-gate` compositionHook** the idle engine
   instantiates alongside it, **or** is `evidenceAuthority:
   executor-evidence-provisional` — its closure does not count as assurance
   until an independent gate consumes it. **No executor-evidence idle node
   reaches terminal `done` on self-produced evidence with an unevaluated
   falsifier** (the idle-pool anti-gaming rule).
8. **Author ≠ approver for independence gates.** For `code-owner-approve` (and
   any independence gate), the eligible-approver set must contain ≥1 identity
   distinct from the bracketed node's author; else fail the seed and surface a
   **director-ratification** path (the only authority that can unblock a
   sole-code-owner self-approval).
9. **Degradation is bounded.** In a thin roster, an own-seat independence check
   may degrade to **defer-until-independent-seat** or **director-ratification**
   ONLY. It may **never route to the architect when the architect is (or is
   eligible as) the node's executor** — that reintroduces self-attestation.
   Same-agent review is never a valid degradation.

## The entry schema (`work-types/W*.md` frontmatter)

A candidate is taxonomy-grade **iff it compiles to a closeable claimable node**.
Every work-type carries:

```yaml
id:                   W<n>
category:             work-type
title:                <kebab-verb-phrase> — <one-line>
added:                2026-07-13
status:               active | candidate | posture   # candidate = not yet standing behavior; posture = not generatable
roleEligibility:      [<pure role union>]
evidenceContract:     [{kind, description}, ...]      # the evidenceRequirements[] template — the compile-target
evidenceAuthority:    executor-evidence | executor-evidence-provisional | verifier-attestation | director-ratification
domainEligibility:    [<subject-surfaces>]            # a single value when pinned
domainFreedom:        free | pinned
parameters:           [{name, fills, bindingSource, predicate}]   # bindingSource: discover-from-substrate | provided-by-trigger | operator-supplied
generationMode:       proactive-poolable | reactive-triggered | arc-seeded | externally-triggered
falsifier:            <the observation that turns the node FAIL, not prose>
compositionHooks:     <dependsOn / completionDependsOn patterns>
provenance:           [<mission/work-item ids that earned this type>]
```

Body sections (M6 exemplar): `## Definition`, `## Evidence & closeability`
(reference this file's constraint set — do not restate it), `## Generation`
(mode + how idea-425/451/403 instantiate it), `## Axiom alignment` (load-bearing
citations only — no decoration, per M7 / the per-item axiom-test gate),
`## Origin`.

## generation-mode — the idle-safety field

- **`proactive-poolable`** — mintable against the existing substrate, no
  trigger. The idle-QoS pool (idea-403/404). Honest set: `audit-a-surface`,
  `bank-idea`, `author-guard-or-falsifier-tests`, `reconcile-ledger` (each under
  constraint 7's provisional/bracket rule).
- **`reactive-triggered`** — instantiated by a substrate trigger (a bug, a
  build, an approved PR, a director signal, a FAILed/trapped completion child).
- **`arc-seeded`** — minted by a driver inside a blueprint (seed, drive,
  closeout, council, backstop).
- **`externally-triggered`** — gated on out-of-band human/Director availability
  the engine cannot schedule (director-mode ceremonies). Never idle-pooled or
  auto-minted; waits for the external signal.

## Two generation-engine requirements (not taxonomy entries)

- **verify-gate is generative-on-FAIL.** A FAIL grows a repair subgraph via a
  conditional edge (an idea-451 primitive, currently unbuilt). `arc-repair` has
  a `reactive-triggered` path so that edge can mint it; a FAIL on a
  completion-gated child MUST route through `arc-repair`'s supersession path,
  never bare-abandon.
- **Separation-of-duties degrades by constraint 9**, not by a full-roster
  assumption.

## Not a work-type: `recover-incident`

Incident-recovery is **not a generatable work-type** — there is no `incident`
substrate entity for a trigger to fire on, and once an incident is machine-
visible it *is* a bug. It is recorded as a **posture / routing note**: an
incident routes through `fix-a-bug-or-repair` / `arc-repair`; the friction it
surfaces is harvested via `bank-idea-or-knowledge-capital`. (worktax0 §10-L.)

## Backstop is a work-type, not a layer

`backstop-a-prod-window` (W-series) is an ordinary `arc-seeded` work-type with a
`backstop:true` flag, a `roleEligibility` union, final-disposition evidence, and
a "stands-down-last" `compositionHook` (`completionDependsOn` on the bracketed
nodes). There is **no `overlays/` directory** (worktax0 §10-F).

## Axiom alignment

- **A2 (Isomorphic Specification):** the frontmatter schema is the
  machine-parseable contract the generation engine (idea-425/451) consumes.
- **A11 (Cognitive Minimalism):** the canonical constraint set moves pool-safety
  and evidence contracts into schema fields so LLMs do not re-derive them.
- **A8 (Gated Recursive Integrity):** the closeability preflight is the
  lower-layer gate a generated node must pass before it bears weight.
