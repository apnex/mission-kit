---
id: C1
category: component
title: AGP - name-addressed routing between application components
status: active
hydrate-when: Parts of your application must reach each other and you are about to write the code that connects them
supersedes: []
related: [C0, A3]
---

# C1 - AGP

**Type: internal, sovereign.**\
Owned here, so a misfit is pressure that routes upstream rather than a constraint to work around.

---

## Duty

Route messages between named application endpoints across a topology no one centrally administers.

That is the whole duty.\
It does not also store, retry, translate, orchestrate, or decide who may talk to whom - each of those would be a second concern and a second component.

At the altitude below this one it is eight concerns with eight duties, listed under `Edges`.\
That is not a contradiction and not a second duty; it is the anchored core of one box, per [`C0`](README.md#duty-is-singular-at-an-altitude).

---

## Contract

What a consumer depends on, and what it may not reach past.

| surface | contract |
|---|---|
| construction | one factory for one implementation; a node's position in a topology is configuration, never a different type |
| addressing | an endpoint name is the unit of reachability - never a host, port, address, or intermediate node |
| wire | every named public data-only structure carries its own schema, generated rather than hand-written |
| send | resolves only when one node admitted the message against a route it can justify; a message with no usable route is refused before it is sent, never accepted and dropped |
| carrier | a neutral transport port, with a conformance kit a new carrier is tested against |
| observation | read-only projections of node state; observing never mutates |

The neutral transport port is the load-bearing part of this contract for anyone extending rather than consuming: it is the seam a new carrier is added at, and adding one is an adapter rather than a change to the routing core.

---

## Reference

The sovereign repository, and its architecture document.

The architecture **declares its own instant**, so this reference stays true without a version recorded here - a reader learns currency from the document rather than from the registry's memory of it.\
Where the architecture states `current` and no target companion exists, current and target have not diverged.

Do not read the implementation to judge fit.\
If duty, contract and fit criteria are insufficient to decide, that is a defect in this entry.

---

## Fit criteria

### Does my project want this at all

Read this half first, before knowing anything about AGP.\
If none of it describes you, stop here.

- Your application is more than one running part, and those parts have to talk.
- You are about to write connection setup, reconnection, addressing or "which instance do I send this to" by hand - **especially if you have written it before, on another project.**
- You do not want any one part to be the thing whose failure takes reachability down with it.
- Where a part runs is going to change - it will scale, move, or be split - and you do not want the callers rewritten when it does.

The second is the strongest signal and the easiest to miss, because writing that code feels like progress rather than duplication.\
Rebuilding these primitives once per application is the recurrence this registry exists to stop.

### Does it meet my requirement

- Parts must address each other **by name**, and the name keeps working when the topology under it changes.
- Reachability is computed from state each node holds, rather than configured centrally, because nobody administers the whole graph.
- A message with no usable route is refused before it is sent, rather than accepted and lost.

**It is the wrong tool when**

| you need | reach elsewhere, because AGP is |
|---|---|
| durability, replay, or end-to-end acknowledgement | not a queue - nothing is persisted or retried |
| request and response pairing | not an RPC framework - a correlated reply is built on one-way delivery |
| topics, fan-out, or subscription state | not a bus - endpoints are addressed, not subscribed |
| infrastructure-layer traffic policy, sidecars, or termination for workloads that did not ask | not a service mesh |
| custody of a message on a destination's behalf | not a broker - a node forwards or refuses |
| cognition, orchestration, or autonomy | not agentic - it carries messages *for* agentic systems and contains none |

A need in the right column is not a reason to extend AGP.\
It is a reason to compose it with something else, or to find the component that owns that duty.

---

## Adjustment policy

Internal and sovereign, so a fit gap has somewhere to go.

1. **Record the gap where both sides can see it.** A measured misfit at a consumer is evidence, not a complaint, and it is worth nothing if it stays in the consuming project.
2. **Resolve it one of two ways, deliberately.** Either the component is adjusted upstream so every consumer gets the change, or it is fractured into sovereign parts and recomposed - which is the right answer when the gap reveals a second duty rather than a missing feature.
3. **Never fork.** A local copy adjusted in place produces two contracts that both read as authoritative, which is the failure this registry exists to prevent.

Extension has a designed seam.\
A new carrier is an adapter against the neutral transport port and is proved by the conformance kit; it is not a modification of the routing core.\
A gap that can be closed at that seam is not pressure on this component at all.

---

## Edges

**Composes** - eight sovereign units, each stating one duty, at the altitude below this entry.

| unit | duty |
|---|---|
| core | node configuration and state schemas, peer state machine, routing information base, bounded resources, clocks, canonical operations |
| protocol | wire schemas, generated structures, codec, preflight checks, contextual semantics |
| transport | the carrier-neutral port: listener, acquisition, channel, terminal, evidence, diagnostics, and its conformance kit |
| transport-node-ws | a runtime implementation of the neutral port |
| transport-loopback | a process-local implementation of the neutral port |
| binding-websocket | the wire protocol over one carrier: configuration, subprotocol, validation, close mappings |
| node | lifecycle, endpoints, sessions, routing composition, data admission, reverse errors |
| management-http | an optional read-only projection over node state |

**Composed-by** - nothing yet.

None of the eight is registered here.\
Each earns an entry when a consumer outside this component needs it, per [`A3`](../axioms/A3-sovereign-composition.md)'s Earned Exposure, and not before.\
`transport` is the likeliest first: a carrier-neutral port shipped with a conformance kit is useful to anything that has to abstract a carrier.

**A relation this vocabulary cannot express.**\
Three of the eight stand in a port-and-adapter relation - one declares the contract, two implement it and are substitutable for each other.\
`composes` and `composed-by` record that all three are inside AGP and lose the fact that two are interchangeable.\
Substitutability is the property a registry exists to expose, so the omission is worth recording rather than working around.
