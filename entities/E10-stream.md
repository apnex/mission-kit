---
id: E10
category: entity
title: stream - a standing cross-cutting vector of improvement across components, measured against asymptotes
status: active
hydrate-when: You are deciding whether a concern is a component or a stream, or deriving work from the intersection of a component and a cross-cutting direction of travel
supersedes: []
related: [E5, E6, AR1, AR2, AR6, W0, D0, M14, RU3, A3, A13, A14]
---

# E10 - stream

## Definition

A **stream** is a standing, cross-cutting vector of improvement that applies across one or more [components](E6-component.md) of a [system](E5-system.md).\
Where a component is a vertical structural unit with one duty and declared interfaces, a stream is a horizontal direction of travel - such as resilience, programmability, security posture, or velocity - measured against one or more **asymptotes**: falsifiable, monotonic limits approached over time and never permanently finished.

A component has a structural vision ([`AR6`](../artifacts/AR6-vision.md)) stating what that box is for and what it must never become.\
A stream has a cross-cutting vision ([`AR6`](../artifacts/AR6-vision.md)) stating the quality vector's north star and its measurable asymptotes.\
Their intersection at cell `(C_i, S_j)` is **composed intent**: what it means for component `C_i` to advance along stream `S_j`, from which a concrete target gap in [`AR1`](../artifacts/AR1-system-architecture.md), a gated transition in [`AR2`](../artifacts/AR2-delta.md), and claimable units of work ([`W0`](../work-types/README.md)) are derived ([`M14`](../methods/M14-derive-work-from-matrix.md)).

---

## Discriminators

**Stream against component.**\
Ask whether the noun names a box with interfaces in [`AR1`](../artifacts/AR1-system-architecture.md) or a direction of improvement that crosses several boxes.\
A control plane, a host runtime, or a knowledge store is a [component](E6-component.md): it owns code and state behind a declared boundary.\
Resilience, programmability, or governance is a stream: it improves how every component it touches behaves, and it owns no monolithic codebase of its own.

**Stream against domain.**\
A [domain](../domains/README.md) (`D0`) is the tactical **evidence surface** a single unit of work's proof resolves against - the codebase, the release channel, the runtime harness, or the data store.\
A stream is the strategic **vector of intent** that explains *why* a component is being changed and *which* asymptote the change advances.\
Two changes to the same component may land on the same evidence surface (`delivery-code`) while serving different streams (one advancing resilience, one advancing programmability); the stream decides the ratcheted metric, and the domain decides how the node's diff is proved.

**Stream against work-type.**\
A [work-type](../work-types/README.md) (`W0`) is a verb-family (`build-a-slice`, `audit-a-surface`, `verify-gate-reactive`) that compiles to a single claimable node.\
A stream is a standing vector that generates many such nodes across components as its ratchet advances.

**Stream against trait.**\
A [trait](../traits/README.md) (`T0`) is an observable characteristic of a system (`stateful`, `multi-agent`, `network-exposed`) that brings axioms into force.\
A stream is a deliberate programme vector pursued across components to move measurable asymptotes.

**Stream against delta or arc.**\
A [delta](../artifacts/AR2-delta.md) (`AR2`) is a bounded transition between two instants of an architecture (`current` to `target`) that closes when its gate passes.\
A stream is enduring: when one delta closes and ratchets a cell's floor, the stream remains open for the next rung toward its asymptote.

---

## Boundaries

**Not a code-owning monolith.**\
A stream never owns the implementation of the components it crosses.\
Every change derived from cell `(C_i, S_j)` lands inside component `C_i`'s declared boundary and interfaces ([`E6`](E6-component.md), [`A3`](../axioms/A3-sovereign-composition.md)), never in a stream-specific script that reaches into multiple components' internals.

**Not a dense grid that forces artificial work.**\
Not every stream applies to every component at every instant.\
A cell `(C_i, S_j)` in a component-stream matrix is either **active** (bound to a falsifiable ratchet predicate and metric), **deferred** (carrying an explicit [`RU3`](../rules/RU3-anti-amnesia-deferral.md) revival trigger), or **explicit null** (orthogonal by stated rationale).\
Inventing work merely to populate an empty square of a matrix violates [`A3`](../axioms/A3-sovereign-composition.md) and [`A14`](../axioms/A14-compounding-learning.md).

**Not a one-off project or milestone.**\
If a concern finishes permanently after a single delivery, it is a delta ([`AR2`](../artifacts/AR2-delta.md)), not a stream.

---

## Relations

**To [`E6`](E6-component.md).**\
Components form the vertical structural axis (`C_1..C_n`) and streams form the horizontal vector axis (`S_1..S_m`) of a programme's 2D intent matrix.

**To [`AR6`](../artifacts/AR6-vision.md).**\
Both components and streams carry visions under `AR6`: a component vision bounds the purpose of one structural part, a stream vision bounds one cross-cutting vector and its asymptotes, and their intersection at `(C_i, S_j)` yields composed intent.

**To [`AR1`](../artifacts/AR1-system-architecture.md) and [`AR2`](../artifacts/AR2-delta.md).**\
Composed intent at cell `(C_i, S_j)` exposes a gap between `C_i`'s current and target state in `AR1`, which is closed by a gated `AR2` delta.

**To [`M14`](../methods/M14-derive-work-from-matrix.md), [`W0`](../work-types/README.md), and [`D0`](../domains/README.md).**\
`M14` compiles an active cell gap `(C_i, S_j)` into tactical `role x work-type x domain` nodes whose evidence resolves against a domain surface in `D0`.

---

## Why precision matters

Without a distinct term for a cross-cutting stream, organisations collapse two orthogonal questions - *which part of the system is changing* ([`E6`](E6-component.md)) and *which enduring quality vector the change advances* (`E10`) - into a single flat list of workstreams or domains.

Conflated in one direction, a horizontal stream is treated as a component and grows a monolithic script or team that reaches past every component's interface to enforce resilience or governance from outside, breaking [`A3`](../axioms/A3-sovereign-composition.md).\
Conflated in the other, a component's backlog becomes an unranked pile of local features with no ratcheted cross-cutting asymptotes, or a 1D priority list starves foundational components until an incident forces reactive repair ([`A14`](../axioms/A14-compounding-learning.md)).
