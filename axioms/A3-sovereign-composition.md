---
id: A3
category: axiom
title: Sovereign Composition
added: 2026-06-19
status: active
applies-to: [any-system]
related: [A8]
source-tele: tele-3
---

# A3 — Sovereign Composition

## Mandate
Every module is a self-contained sovereign unit owning exactly one concern, exposing bit-perfect semantic interfaces, composing without leaking internals. God objects, spaghetti coupling, and dual-purpose modules are structurally impossible.

## Mechanics
- **Law of One** — a module does exactly one thing; "and"/"also" in its description is a violation.
- **Air-Gap Principle** — units interact only through declared adapters and contracts; no unit reaches into another's internals or kernel.
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
- **Veto Paralysis** — no reviewer can isolate root cause from the boundaries, forcing a system-wide halt.

## Success signals
You'll know it holds when:
1. Every module owns exactly one concern; no accretion-bucket modules exist.
2. All inter-module interaction passes through declared contracts; nothing reaches into another unit's internals.
3. New capabilities arrive by composition, not by modifying existing units.
4. Any module can be understood, tested, and changed in isolation from its contract alone.
5. Boundary violations are detectable by review or tooling.

## Provenance
Derived from OIS `tele-3` (Sovereign Composition), Director-ratified 2026-04-21 (idea-149); absorbs the prior external axiom AX-020 (Interface Singularity) and the boundary-isolation intent of idea-148. The deeper principle — one concern behind a versioned contract, composition over modification — is foundational to any system, but its stakes rise sharply under AI-assisted and agentic generation, where Spaghetti Synthesis accretes faster than review can contain. Pairs with A8 as a companion boundary axiom.
