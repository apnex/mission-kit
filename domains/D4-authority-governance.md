---
id: D4
category: domain
title: authority-governance - the governance/authority substrate
status: active
subjectSurface: the governance/authority substrate as subject — SEAL, CODEOWNERS, decisions, class-grants, axioms-as-law
evidenceResolvesAgainst: Decision/Confirmation/Signal entities, class-grants, CODEOWNERS approvals, axiom-alignment records
pinnedForTypes: [capture-decision-and-ratify, axiom-alignment-gate, director-walkthrough, code-owner-approve]
freeForTypes: [audit-a-surface, verify-gate-reactive, design-a-contract-or-invariant]
related: [D0]
---

# D4 — authority-governance

## Subject-surface
The governance/authority machinery treated as a subject: SEAL, CODEOWNERS,
decisions, class-grants, and axioms-as-law. Evidence resolves against Decision/
Confirmation/Signal entities, class-grants, CODEOWNERS approvals, and
axiom-alignment records.

## Freedom
**Pinned** for governance-mode types (`capture-decision-and-ratify`,
`axiom-alignment-gate`, `director-walkthrough`, `code-owner-approve`) — their
type names this surface, so the generator does not vary the domain. Still a
**free** target of `audit-a-surface` / `verify-gate` / `design-a-contract` (you
can audit or design the governance substrate).

## Axiom alignment
- **A13 (Director Intent Amplification):** director-ratification evidence
  resolves here; non-delegable authority is protected on this surface.
