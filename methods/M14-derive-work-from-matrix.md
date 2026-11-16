---
id: M14
category: method
title: Derive work from a component-stream matrix - compose component and stream visions into ratcheted work items
status: active
hydrate-when: You are deriving, prioritising or auditing work across a system's components and cross-cutting streams
supersedes: []
related: [E6, E10, AR1, AR2, AR3, AR5, AR6, W0, D0, R0, RU3, A2, A3, A13, A14]
---

# M14 - Derive work from a component-stream matrix

## Rule

An engineering programme with multiple [components](../entities/E6-component.md) (`C_1..C_n`) and standing cross-cutting [streams](../entities/E10-stream.md) (`S_1..S_m`) derives work from their 2D intersection rather than from a 1D backlog.\
Each cell `(C_i, S_j)` composes the component's structural vision with the stream's vector vision and asymptotes ([`AR6`](../artifacts/AR6-vision.md)), measures the component's current state against a ratcheted floor, and compiles any gap into [`AR2`](../artifacts/AR2-delta.md) deltas and [`W0`](../work-types/README.md) work items.

1. **Anchor the component axis (`C_1..C_n`) to [`AR1`](../artifacts/AR1-system-architecture.md).** Every row `C_i` must correspond 1:1 to a component with a single duty and declared interfaces in `AR1`, and carry a component vision (`AR6`) stating what the component is for and what it will never become. No row may be an unanchored label or a mode of work.
2. **Anchor the stream axis (`S_1..S_m`) to measurable asymptotes (`AR6`).** Every column `S_j` must state a cross-cutting direction of travel, at least one monotonic metric (`metricKey`, `direction`, `ratchetFloor`), and what holding the stream vision does not authorise.
3. **Classify every cell `(C_i, S_j)` honestly (bimodal sparsity).** A cell is assigned one of three states:
   - `active`: the stream applies to the component now, and the cell declares its **composed intent** (`AR6_C x AR6_S`), an `AR1` structural invariant reference, an executable verification predicate, and a 4-tuple health vector (`asymptoteTarget`, `currentMeasured`, `ratchetFloor`, `lastVerified`).
   - `deferred`: the intersection is valid but not currently worked; it must record a concrete [`RU3`](../rules/RU3-anti-amnesia-deferral.md) `revivalTrigger` in [`AR5`](../artifacts/AR5-backlog.md).
   - `explicit-null`: the stream is structurally orthogonal to the component, with a one-line rationale so no agent invents artificial busywork to fill the grid square.
4. **Derive the cell gap inside the component's boundary.** For each `active` cell where `currentMeasured` falls short of the next rung toward `asymptoteTarget` (or regresses below `ratchetFloor`), state the gap as a transition between `C_i`'s current and target state in `AR1`.\
The implementation of that transition belongs inside `C_i`'s declared boundary ([`E6`](../entities/E6-component.md), [`A3`](../axioms/A3-sovereign-composition.md)), never in a cross-component monolith owned by the stream.
5. **Compile the gap to tactical `role x work-type x domain` nodes.** Each `AR2` delta closing a cell gap instantiates claimable nodes under [`W0`](../work-types/README.md), binding:
   - `role` ([`R0`](../roles/README.md)): who performs or judges the node;
   - `work-type` ([`W0`](../work-types/README.md)): the verb-family (`W14` to design the contract, `W1` to build the slice, `W5` to author the falsifier, `W8` to gate it); and
   - `domain` ([`D0`](../domains/README.md)): the tactical evidence surface (`delivery-code`, `distribution`, `tooling-harness`, etc.) against which that node's proof resolves.
6. **Ratchet the floor on verification.** When the independent gate ([`E7`](../entities/E7-gate.md)) passes on live evidence ([`E8`](../entities/E8-evidence.md)), advance the cell's `ratchetFloor` to the newly verified level so future regressions fail the mechanical check immediately.

---

## Rationale

A 1D priority list forces components and cross-cutting qualities to compete in the same flat queue: either one stream monopolises every component through a coupled script, or one component absorbs local feature work while cross-cutting resilience, programmability, and governance decay unseen.

Separating the **strategic intent plane** (`Component x Stream`, which decides *what* must change and *why*) from the **tactical execution plane** (`Role x Work-Type x Domain`, which decides *who* executes a single claimable node, *in what mode*, and *against which evidence surface*) preserves [`W0`](../work-types/README.md)'s closeability preflight while giving [`AR3`](../artifacts/AR3-board.md) a deterministic algebra for generating and ranking work ([`A13`](../axioms/A13-intent-persistence.md), [`A14`](../axioms/A14-compounding-learning.md)).

---

## When to apply

- When standing up or revising a programme's [`AR1`](../artifacts/AR1-system-architecture.md), [`AR6`](../artifacts/AR6-vision.md), and [`AR3`](../artifacts/AR3-board.md) so strategic intent compiles into bounded work.
- When an audit ([`M12`](M12-investigate-a-set.md)) finds that a cross-cutting stream has grown a monolithic script bypassing component interfaces, or that components are starving a standing quality vector.
- Before seeding a new [`AR2`](../artifacts/AR2-delta.md) arc on the board, to verify which `(C_i, S_j)` cell gap it closes and what ratchet floor it advances.
