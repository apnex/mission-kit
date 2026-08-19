---
id: A3
category: axiom
title: Sovereign Composition
status: active
hydrate-when: You are deciding whether a concern belongs behind a new boundary or an existing one
applies-to: [any-system]
related: [A8]
---

# A3 — Sovereign Composition

## Mandate
Every module is a self-contained sovereign unit owning exactly one concern, exposing bit-perfect semantic interfaces, composing without leaking internals. A boundary that isolates a concern is distinct from a surface that others depend on: the first is earned by having one concern, the second by a real consumer that needs it. God objects, spaghetti coupling, and dual-purpose modules are structurally impossible.

## Mechanics
- **Law of One** — a module does exactly one thing; "and"/"also" in its description is a violation.
- **Air-Gap Principle** — units interact only through declared adapters and contracts; no unit reaches into another's internals or kernel.
- **Earned Exposure** — a concern earns an internal boundary by being one concern; it earns promotion to a stable, depended-upon surface only when a real consumer outside its origin needs it. Boundaries are drawn on isolation; committed contracts are drawn on demand. Exposing a surface on anticipated rather than demonstrated reuse is premature abstraction paid at the boundary.
- **Semantic Bit-Masking** — interfaces are explicit, versioned contracts with bit-perfect message formats; both sides agree on the exact shape.
- **Composable by Default** — a new capability is assembled by composing existing units, never by modifying them.
- **Local Reasoning** — any unit is understandable, testable, and changeable in isolation, from its contract and inputs alone.
- **Logic Density** — code is dense with intent; ceremony, scaffolding, and premature abstraction are defects, not neutral cost.

## Rationale
Enables parallel, independent evolution — a transport or infrastructure layer can be swapped without the logic layer ever noticing. Prevents spaghetti coupling, which becomes the dominant failure mode under AI-assisted and agentic code generation, where unbounded synthesis accretes cross-cutting entanglement faster than human review can catch it. Clean boundaries are what keep logic density achievable: when units stay isolated, each stays dense and intent-revealing without leaking complexity into its neighbors. Without the principle, concerns merge, change radius grows without bound, and the system eventually becomes too entangled to modify safely.

## Faults
- **Logic Leakage** — a change in one area causes unexpected failure in another.
- **Architectural Paralysis** — everything is too entangled to change.
- **God-Object Accretion** — "utils", "helpers", "managers" accumulate unrelated concerns.
- **Ceremony Bloat** — signal drowns in scaffolding; logic density collapses.
- **Speculative Surface** — a boundary is promoted to a stable, depended-upon contract before any external consumer needs it, manufacturing versioning, compatibility, and coordination cost the system does not yet owe.
- **Veto Paralysis** — no reviewer can isolate root cause from the boundaries, forcing a system-wide halt.

## Success signals
You'll know it holds when:
1. Every module owns exactly one concern; no accretion-bucket modules exist.
2. All inter-module interaction passes through declared contracts; nothing reaches into another unit's internals.
3. New capabilities arrive by composition, not by modifying existing units.
4. Any module can be understood, tested, and changed in isolation from its contract alone.
5. Boundary violations are detectable by review or tooling.
6. Every stable, depended-upon surface traces to a real consumer that needed it; none exists on speculation alone.
