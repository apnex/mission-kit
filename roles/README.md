---
id: R0
category: role
title: Roles - the M axis (pure essence + type-determined authority)
status: active
hydrate-when: You need to know which role may attest, approve or decide on a piece of work
related: [W0, D0, A3, A6, A13, E1, T0]
---

# Roles - the M axis

## Purpose

Roles are defined as **essence + engagement-mode**, independent of domain and work-type so composability determines the aggregate.\
Read `work-types/README.md` for the composition rule that combines these with the domain and work-type axes.

A role is an **authority over work**, not a person.\
It says who may decide, build, assure or ratify, so that a unit of work can be claimed and closed without anyone routing it by hand.

---

## Territory

This set covers **every authority engineering work needs** - within a unit of work, from the intent behind it to its ratification, and across units, where work is chosen, run as a flow and kept.

A unit of work passes through five positions, and work across units adds three more; each needs someone with authority to act at it.\
The positions are the denominator: a gap is a position with no role, or one that some organisations cannot fill.

| Position | The authority it needs | Role |
|---|---|---|
| **Intent** | to say what is wanted and why | [`R4`](R4-director.md) director |
| **Shape** | to decide how the system is structured and how its parts compose | [`R1`](R1-architect.md) architect |
| **Implementation** | to turn a design into a working, landed artifact | [`R2`](R2-engineer.md) engineer |
| **Assurance** | to prove or refute a claim about work it did not do | [`R3`](R3-verifier.md) verifier |
| **Ratification** | to accept the result as the organisation's own | [`R4`](R4-director.md) director |
| *Across units:* **Direction** | to choose which work is done, in what order, and to change course | [`R4`](R4-director.md) director |
| **Flow** | to seed, drive and repair a run of many units | [`R1`](R1-architect.md) architect, which holds the driver lease and is the eligible role for seeding, driving and repairing an arc |
| **Curation** | to keep the durable knowledge and to delegate authority to the other roles | [`R4`](R4-director.md) director |

No position lacks a role today; a new position the work turns out to need, with no role to hold it, would be a gap here, and the count of roles follows the positions rather than fixing them.\
Within a unit the director holds two positions, at either end, because intent and its acceptance are the same authority exercised before and after the work.

**Operating shipped work is not a gap.**\
Landing, deploying, probing live behaviour, holding a production window and restoring a fleet are each work-types, and each names existing roles as eligible.\
Operation is implementation and assurance applied after release, not a sixth authority.

**One position is a gap for an organisation of one: assurance.**\
Assurance is the only authority defined by being exercised by someone *other* than the agent who did the work.\
An organisation of a single agent may hold every role, under a director who holds intent and ratification - and the one it can never exercise is assurance, because there is no work but its own to exercise it on.\
The independence a gate requires waits for a second agent, or is met by the director's ratification instead, which concentrates every assurance decision on the scarcest attention the organisation has.\
What the organisation lacks is the authority to let its own check stand as assurance - never the obligation to check, which it holds in full.\
No trait yet lets an axiom bind on this condition - work no second agent independently checks - and [`T0`](../traits/README.md) records that absence as a gap.

---

## Purity is on ESSENCE only

A role's **essence** - its lens, its stance, and the kind of authority it holds - is invariant across every instance; that is the purity test.\
But the **evidence** its engagement produces is a function of the *work-type*, not the role: `engineer x build-a-slice` produces `executor-evidence`, while `engineer x code-owner-approve` produces non-author independence-evidence.\
That is why each role frontmatter carries `evidenceAuthorities` as a **set**.\
Do NOT treat "engineer => executor-evidence" as a generation invariant - the authority is composed from `(role x work-type)`.

---

## Director is charter-mandated but non-composing

`architect / engineer / verifier` share the substrate engagement-mode "claim -> execute work-nodes" and participate symmetrically in `roleEligibility` unions.\
**Director does not** (`composing: false`): it steers/ratifies/gates/curates *outside* the claim->execute loop, is never idle-poolable, and is the sole `director-ratification` authority.\
It is retained as a first-class role, by charter mandate and [`A13`](../axioms/A13-director-intent-amplification.md), but marked non-composing so readers never expect symmetric unions.\
Director-ratification cannot be satisfied by architect narrative - it requires a `DirectorSignal` / `Decision` / `Confirmation` or explicitly documented ratified delegation.

---

## How the roles compose

**A role is held, not embodied.**\
One actor may hold several roles, and in a small organisation usually does.\
An organisation of one agent holds architect, engineer and verifier at once, under a director - though its verifier role has nothing to act on, since assurance is over work the verifier did not do.

**The constraint is narrower than "one actor, one role", and it is about identity, not role.**\
The same identity may not be both the executor and the independent verifier of one piece of work.\
Holding both roles is lawful; exercising both on the same work is not.

**Checking one's own work is always required, at any size of organisation.**\
An agent that cannot provide independent assurance is still accountable for checking what it did, and an organisation of one depends on that more than any other, because nobody else will.\
The check must use means the author's own reasoning cannot bias: a mechanism that fails when the work is wrong, a fresh reader holding only the work, a measurement in place of a re-reading.\
A cited address is the plainest case: it is fetched before it is cited, because a fabricated link reads exactly like a real one and only fetching it tells them apart.\
Re-reading one's own work is the weakest check available, because the author knows what every line was meant to say.\
A fresh reader may be a new instance of the same agent with no shared context.\
That is the strongest check available to an agent alone, and it is still a self-check: the instance is independent of the author's context and motives, not of the model they share, so it cannot provide independent assurance.\
These checks produce the author's own evidence, and they are mandatory; they do not seal a gate that requires independence.

**When there is no second agent, the independence a gate requires never falls to the same agent.**\
It waits for a second agent, or the gate is met by the director's ratification instead of a verifier's attestation; the director does not become a verifier.\
The agent's own check happens regardless; only its standing as assurance changes.\
The rule is constraint 9 of the canonical constraint set, authored once in [`W0`](../work-types/README.md) and cited here rather than restated.

**Roles compose with work-types and domains.**\
`role x work-type x domain` generates a unit of work, and `role x work-type` decides the evidence that work may produce - the role alone never does, as *Purity is on ESSENCE only* above sets out.

---

## Backstop is not a role

Backstop is a **work-type** (`backstop-a-prod-window`) with a `backstop:true` flag, not a role and not a separate overlay layer.\
See `work-types/README.md`.

---

## Axiom alignment

- **A6 (Frictionless Agentic Collaboration):** the role axis is what lets `role x
  work-type x domain` compile to a claimable WorkItem, removing manual routing.
- **A13 (Director Intent Amplification):** the axis carries the Director as a
  first-class but non-composing authority. Intent is the director's alone;
  ratification may be delegated, but only by a documented act of the director.
- **A3 (Sovereign Composition):** roles are pure on essence, so composability -
  not enumeration - determines the aggregate.

---

## Faults

Population faults - visible across the set and invisible to any one role.

- **The role read as a person.** A role treated as a seat one agent occupies, so a small organisation concludes it cannot use the set, or a large one gives each role its own agent and calls that independence. Roles are authorities; independence is about identity.
- **The unchecked lone agent.** An organisation of one that reads *cannot provide assurance* as *need not check*, so its work is checked by nobody. The most damaging misreading of this set, because the rule it misreads exists to make checking stronger.
- **The self-attesting identity.** One identity exercising both executor and verifier authority on the same work, so that a self-check is presented as independent assurance. Every role can be correctly held while this happens, which is why it is a population fault.
- **The director by narrative.** Ratification inferred from an architect's account rather than from a director signal or a documented delegation. It reads as authority and carries none.
- **The concentrated position.** In a thin organisation every independence check falls to the director, so the scarcest attention becomes the bottleneck for every gate. The degradation rule is correct; its cost is real, and it is the cost to plan for.
- **The authority with no role.** A decision the work needs that falls outside every position, so it is made by whoever happens to be acting. The territory records none today; it exists so that one would be visible if it appeared.

---

## Index

<!-- BEGIN GENERATED: entries. Run tools/generate-index.mjs; do not edit by hand. -->
| ID | Title | Hydrate when |
|---|---|---|
| [R0](README.md) | Roles - the M axis (pure essence + type-determined authority) | You need to know which role may attest, approve or decide on a piece of work |
| [R1](R1-architect.md) | architect - authority over system shape | You are ruling on system shape and need to know what an architect may decide alone |
| [R2](R2-engineer.md) | engineer - make it real | You are building, and need to know what an engineer may attest to about their own work |
| [R3](R3-verifier.md) | verifier - independent adversarial assurance | You are sealing a gate and need to know what independence the verifier must hold |
| [R4](R4-director.md) | director - intent source and ratification authority | You are about to claim authority that only the director holds |
<!-- END GENERATED -->
