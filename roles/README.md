---
id: R0
category: role
title: Roles - the M axis (pure essence + type-determined authority)
status: active
hydrate-when: You need to know which role may attest, approve or decide on a piece of work
related: [W0, D0, A3, A6, A13, A16, E1, T0]
---

# Roles - the M axis

## Vision

**North star.**\
One role for every authority engineering work needs, each pure in essence and held rather than embodied, so no decision the work needs is made by whoever happens to be acting.\
*Held rather than embodied* means one actor may hold several roles, and independence is a property of identity rather than of role, as *How the roles compose* sets out.

**What this set is, and is not.**\
This set is the kinds of authority over work, from the intent behind a unit of work to its ratification and across the flow of many units.\
It is not a set of people or seats, not a mode of work or a flag carried by one - those belong to work-types - and not the evidence a unit of work produces, which `role x work-type` decides.

**Succeeding.**\
Measured on these dimensions, never collapsed into one score:

- **Coverage** - every decision the work needs falls inside a role.
- **Independent mandates** - no two roles hold the same authority.
- **Purity** - each role's essence is invariant across domain and work-type, so composition rather than enumeration determines the aggregate.
- **Fillability** - any organisation, from one agent to many, fills every authority it can and sees plainly any it cannot, and never presents a self-check as independent assurance.

**Authority.**\
The director holds this vision and ratifies any change to it, under [`M11`](../methods/M11-change-a-charter.md).

**What this vision does not authorise.**\
Citing it admits no member and licenses no change of direction; admission is by the tests in this charter's operating sections.

Roles are defined as **essence + engagement-mode**, independent of domain and work-type so composability determines the aggregate.\
Read `work-types/README.md` for the composition rule that combines these with the domain and work-type axes.

A role is an **authority over work**, not a person.\
It says who may decide, build, assure or ratify, so that a unit of work can be claimed and closed without anyone routing it by hand.

---

## Territory

**Scope.**\
This set covers **every authority engineering work needs** - within a unit of work, from the intent behind it to its ratification, and across units, where work is chosen, run as a flow and kept.

**Growth policy.**\
Uncapped: the count of roles follows the authorities the work needs rather than fixing them.\
A member sits at the grain of one kind of authority over work - pure in essence, independent of domain and work-type - never a person, a mode of work, or a flag carried by a work-type.\
Members are balanced on independence of mandates: no two roles hold the same authority, and work done after release is the existing authorities applied again, not a new one.

---

## Operation

This set is analysed by [`M12`](../methods/M12-investigate-a-set.md) and its membership changed by [`M13`](../methods/M13-change-a-set.md); this charter is changed by [`M11`](../methods/M11-change-a-charter.md).\
Its members are balanced on independence of mandates, so an analysis asks of each pair of roles whether they hold one authority, and of the set whether any decision the work needs falls outside every role.\
A candidate that is a mode of work, or a flag a unit of work carries, is routed to [`work-types/`](../work-types/README.md), as *Backstop is not a role* records; a candidate that is a surface work lands on is routed to [`domains/`](../domains/README.md).\
The constraint that one identity may not execute and independently verify the same work is authored in [`W0`](../work-types/README.md) and cited here, so a change to it is made there and not in this charter.\
To stress the territory across both unit-level and above-unit work, an analysis crosses the four authorities (intent and ratification, system shape, execution, and independent assurance) against the work-types' `roleEligibility` and `evidenceAuthority` fields and across organisation sizes from a single agent to a multi-agent fleet, testing whether any decision or cross-unit stewardship falls outside every role or collapses executor and verifier identity.

---

## Purity is on ESSENCE only

A role's **essence** - its lens, its stance, and the kind of authority it holds - is invariant across every instance; that is the purity test.\
But the **evidence** its engagement produces is a function of the *work-type*, not the role: `engineer x build-a-slice` produces `executor-evidence`, while `engineer x code-owner-approve` produces a non-author's verdict - an approval, not evidence ([`E8`](../entities/E8-evidence.md)).\
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
The obligation to check one's own work by means the author's reasoning cannot bias - including fetching any cited online address empirically rather than trusting recall - is authored once in [`A16`](../axioms/A16-unbiased-self-check.md) and cited here rather than restated.\
On the role axis, even the strongest self-check available to an agent alone - a fresh instance of the same agent with no shared context - produces the author's own evidence ([`E8`](../entities/E8-evidence.md)) and never holds [`R3`](R3-verifier.md) verifier authority, because both instances share one model and so cannot seal a gate requiring independence.

**When there is no second agent, the independence a gate requires never falls to the same agent.**\
It waits for a second agent, or the director decides the gate instead of a verifier - a recorded change of kind under [`E7`](../entities/E7-gate.md); the director does not become a verifier.\
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
- **The authority with no role.** A decision the work needs that falls outside every role, so it is made by whoever happens to be acting.

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
