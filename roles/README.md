---
id: R0
category: role
title: Roles - the M axis (pure essence + type-determined authority)
status: active
hydrate-when: You need to know which role may attest, approve or decide on a piece of work
related: [WT0, D0, A6, A13, E1]
---

# Roles - the M axis

Four roles, each defined as **essence + engagement-mode**, independent of domain and work-type so composability determines the aggregate.\
Read `work-types/README.md` for the composition rule that combines these with the domain and work-type axes.

- **R1 architect** - **R2 engineer** - **R3 verifier** - **R4 director**

## Purity is on ESSENCE only

A role's **essence** (lens / stance / authority) is invariant across every instance - that is the purity test.\
But the **authority component** of its engagement-mode is a function of the *work-type*, not the role: `engineer x build-a-slice` produces `executor-evidence`, while `engineer x code-owner-approve` produces non-author independence-evidence.\
That is why each role frontmatter carries `evidenceAuthorities` as a **set**.\
Do NOT treat "engineer => executor-evidence" as a generation invariant - the authority is composed from `(role x work-type)`.

---

## Director is charter-mandated but non-composing

`architect / engineer / verifier` share the substrate engagement-mode "claim -> execute work-nodes" and participate symmetrically in `roleEligibility` unions.\
**Director does not** (`composing: false`): it steers/ratifies/gates/curates *outside* the claim->execute loop, is never idle-poolable, and is the sole `director-ratification` authority.\
It is retained as a first-class role (charter
+ A13) but marked non-composing so readers never expect symmetric unions.
Director-ratification cannot be satisfied by architect narrative - it requires a `DirectorSignal` / `Decision` / `Confirmation` or explicitly documented ratified delegation.

---

## Backstop is not a role

Backstop is a **work-type** (`backstop-a-prod-window`) with a `backstop:true` flag, not a role and not a separate overlay layer.\
See `work-types/README.md`.

---

## Axiom alignment

- **A6 (Frictionless Agentic Collaboration):** the role axis is what lets `role x
  work-type x domain` compile to a claimable WorkItem, removing manual routing.
- **A13 (Director Intent Amplification):** the axis carries the Director as a
  first-class but non-composing authority, protecting non-delegable intent.
- **A3 (Sovereign Composition):** roles are pure on essence, so composability -
  not enumeration - determines the aggregate.
