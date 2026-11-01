---
id: C5
category: component
title: operation-call - typed invocations and streaming replies with honest endings over named delivery
status: active
hydrate-when: You are about to pair requests with replies, stream multi-part answers, or enforce call deadlines and cancellation over one-way message delivery
sovereignty: internal
supersedes: []
related: [C0, C1, C3, C6, C8, A1, A3, A7]
---

# C5 - operation-call

Sovereignty is `internal`, so a fit gap here is pressure that routes upstream rather than a constraint a consumer works around.

---

## Duty

Turn one-way named message delivery into typed request-response and streaming invocations that always end within a caller-chosen bound in one of four honest outcomes.

That is the whole duty.\
It does not also route messages, retry failed calls on its own, persist state across restarts, deduplicate effects at the destination, or decide who is authorised to call - each of those belongs to [`C1`](C1-agp.md), the store, or the application.

At the altitude below this one it is eleven units in its anchored core, listed under `Edges`.\
That is the anchored core of one box, per [`C0`](README.md#duty-is-singular-at-an-altitude), not eleven duties.

---

## Contract

What a consumer depends on, and what it may not reach past.

| surface | contract |
|---|---|
| declarations | operations are declared as data (`DECLARATION_LIMITS`, `NAME_PATTERN`), stating each operation's request shape and answer or part shape in [`C3`](C3-shape-check.md)'s dialect so caller and host validate against the same contract |
| caller | `createCaller` invokes a named operation with a caller-chosen deadline (`MAX_BOUND_MS`), an optional `invocation` identity (`INVOCATION_PATTERN`, so a caller-driven retry keeps the same identity while each attempt gets a fresh correlation label), optional advertiser instance pinning, and an optional `AbortSignal` |
| four honest endings | every invocation resolves once, within its bound, to `answered` (whole answer or completed stream of ordered `parts`), `refused` (the operation or its input check declined, with a structured refusal record), `not-delivered` (the delivery layer beneath refused the send before any destination handler admitted it, so it had no effect), or `unknown` (the request may have been admitted, or a stream stopped before its `end`, so the caller must not assume it had no effect; `earlierAttemptsUncertain` tracks prior attempts of the same invocation) |
| streaming and liveness | an operation declared to answer in parts sends ordered `part` messages and `alive` heartbeats before `end`; the caller bounds the wait for the next sign of life (`hop-stalled` when a hop exceeds its allowance), and cancelling sends `cancel` to the host while preserving parts already received (`cancelled` / `unknown`) |
| host | `createOperationHost` exposes declared operations as named endpoints over [`C1`](C1-agp.md), validates incoming requests through [`C3`](C3-shape-check.md), passes peer-identity evidence from the delivery context to the handler, and pairs every reply (`part`, `alive`, `end`) to the request's attempt correlation label |
| wire and caller suite | `@apnex/operation-call/message-format` exports the wire readers, writers and limits (`readMessage`, `writeRequest`, `writePart`, `writeAlive`, `writeEnd`, `writeCancel`, `MESSAGE_LIMITS`), and `@apnex/operation-call/caller-suite` exports `registerCallerSuite` to test any direct or proxied caller against the full ending matrix |

The delivery port and the caller suite are the two seams: [`C8`](C8-operation-proxy.md) relays invocations across a local daemon and proves parity by passing `registerCallerSuite`.

---

## Reference

The sovereign repository `apnex/operation-call` (`@apnex/operation-call`), with its vision in `VISION.md`, its contract in `CONTRACT.md`, and its machine-checked surface in `export-map.json`.

The contract and export map state what is served now, so this reference stays true without a version recorded here.\
Where `export-map.json` records `deferred: {}`, current and target have not diverged.

Do not read the implementation to judge fit.\
If duty, contract and fit criteria are insufficient to decide, that is a defect in this entry.

---

## Fit criteria

### Does my project want this at all

Read this half first, before knowing anything about `operation-call`.\
If none of it describes you, stop here.

- Your components communicate over [`C1`](C1-agp.md) (or a named one-way delivery port) and callers need a reply or a stream of parts back from a named operation.
- You are about to write request-reply correlation, timeout timers, streaming heartbeats, cancellation, or error envelopes by hand.
- An agent or caller in your system must never confuse *"definitely did not run"* (`not-delivered`) with *"might have run before the connection dropped"* (`unknown`).

### Does it meet my requirement

- Every call has an explicit caller-chosen deadline, and timers re-check the clock on wake so early timer wakeups never fire a deadline early.
- Request, answer, part and refusal payloads are plain JSON validated by [`C3`](C3-shape-check.md).
- Retries are chosen by the caller, using a stable `invocation` identity so the destination can recognise a repeat.

**It is the wrong tool when**

| you need | reach elsewhere, because `operation-call` is |
|---|---|
| name-addressed routing and peer transport connections | not a router or transport - it sits on top of [`C1`](C1-agp.md) |
| automatic background retries or durable queues | not a retrier or queue - it reports how each attempt ended so the caller decides |
| CRUD, tag queries, and change-log catch-up for entities | not an entity protocol - compose it with [`C6`](C6-entity-api.md) |
| a shared local daemon so short-lived CLI commands reuse one connection | not a daemon - compose it with [`C8`](C8-operation-proxy.md) |

---

## Adjustment policy

Internal and sovereign, so a fit gap has somewhere to go.

1. **Record the gap where both sides can see it.** A call-lifecycle or streaming requirement that `createCaller` and `createOperationHost` cannot express is recorded against `operation-call`'s contract.
2. **Close it at a seam where one exists.** Clock and identity ports (`systemCallClock`, `systemIdentitySource`) and the delivery port allow deterministic testing and alternative carriers without changing the call state machine.
3. **Never fork.** A custom RPC wrapper over [`C1`](C1-agp.md) re-creates the `failed` versus `unknown` ambiguity this component eliminates.

---

## Edges

**Contains** - eleven internal units in its anchored core: caller state machine (`caller`), operation host (`host`), operation declaration validator (`declarations`), call-ending reader (`call-ending`), refusal validator (`refusal`), wire codec (`message-format`), identifier validators (`names`), call types (`call-types`), clock and identity ports (`system-ports`), and the reusable caller conformance suite (`caller-suite`).

**Contained-by** - nothing; `operation-call` is a top-level registered component.

**Consumes** - [`C1`](C1-agp.md) (`agp`) for named endpoint advertisement, routed sends, delivery disposition reports, correlation labels and peer-identity evidence, and [`C3`](C3-shape-check.md) (`shape-check`) for declared shape validation and plain-data reading ([`E5`](../entities/E5-system.md)).

**Consumed-by** - [`C6`](C6-entity-api.md) (`entity-api`), [`C8`](C8-operation-proxy.md) (`operation-proxy`), and `zorg`, which use `operation-call` through its declared contract without containing it ([`E5`](../entities/E5-system.md)).
