---
id: E1
category: entity
title: sovereign-hierarchy - layered authority where each layer holds final say over one class of decision
status: active
hydrate-when: You are deciding which layer owns a decision, or an actor is about to decide something at another layer's altitude
supersedes: []
related: [A3, A13, R0, R4]
---

# E1 - sovereign-hierarchy

## Definition

The **sovereign hierarchy** is the arrangement of authority in an agentic organisation as ordered layers, where each layer holds final say over exactly one class of decision and passes *intent* downward rather than instructions.

A layer is sovereign in the strict sense: within its class of decision it is not overridden from above, and it does not reach past its own altitude to decide for another layer.\
Delegation moves the question down; it does not move the authority.

---

## Discriminators

- **Against an org chart.** An org chart ranks actors by seniority and says nothing about which decisions are whose. The sovereign hierarchy ranks *decision classes*, and an actor's position follows from the class it owns.
- **Against an escalation path.** Escalation carries a decision upward when a lower level cannot make it. Here the lower level is not permitted to make the higher level's decision at all, so there is nothing to escalate.
- **Against a call stack.** A caller resumes control when the callee returns and may discard its result. A delegating layer does not review the delegate's decision within the delegate's own class.
- **Against role composition.** Roles are a taxonomy of stance and lens; the hierarchy is a taxonomy of altitude. One actor may hold two roles, but a single decision sits at exactly one altitude.
- **The altitude test.** Ask what the layer above may overrule. If it may overrule everything, there is one layer wearing several names rather than a hierarchy.

---

## Boundaries

It is **not** delegation of authority.\
Authority is held, never passed; what descends is intent, and what returns is evidence.

It is **not** the composition graph.\
[`A3`](../axioms/A3-sovereign-composition.md) arranges *modules* so each owns one concern.\
This entity arranges *decisions* so each has one owner.\
The two are structural analogues and are routinely conflated, but a module boundary confers no authority and an altitude implies no module.

It is **not** a domain.\
"Each layer is sovereign in its own domain" is the phrasing this definition replaces, because `domain` is the N axis in [`D0`](../domains/README.md) and names a subject surface rather than an altitude.\
A layer owns a class of decision; a domain names what evidence resolves against.

It is **not** a chain of command.\
A command names the action to take.\
The hierarchy's whole content is that the action is *not* named downward.

---

## Relations

| Edge | Target | Reading |
| --- | --- | --- |
| apex of | [`A13`](../axioms/A13-director-intent-amplification.md) | the Director is the top layer, and its attention is the apex scarce resource |
| structural analogue of | [`A3`](../axioms/A3-sovereign-composition.md) | one concern per module is to structure what one decision class per layer is to authority |
| instantiated by | [`R0`](../roles/README.md) | roles are the actors that occupy layers; `composing: false` marks the one that sits outside the claim-execute loop |
| held by | [`R4`](../roles/R4-director.md) | final authority is never delegated, which is this definition applied to the top layer |

---

## Why precision matters

Two competent readers act differently on "the architect owns this".\
Under one reading the architect decides and the director is informed; under the other the architect recommends and the director decides.\
Both readings are consistent with an undefined hierarchy, and the divergence surfaces only after the decision has been executed.

The failure is asymmetric.\
A layer that under-reaches produces a stall that somebody notices, while a layer that over-reaches produces a decision that looks made and is discovered at the gate, or later.\
Authority drift is the named fault, and it cannot be detected without a definition of the altitude that was crossed.
