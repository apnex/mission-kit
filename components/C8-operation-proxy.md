---
id: C8
category: component
title: operation-proxy - shared per-identity local relay daemon for short-lived callers
status: active
hydrate-when: You have short-lived CLI commands, hooks or browser tabs that must share one long-lived connection per identity without losing call endings
sovereignty: internal
supersedes: []
related: [C0, C1, C3, C5, C9, A1, A3, A7]
---

# C8 - operation-proxy

Sovereignty is `internal`, so a fit gap here is pressure that routes upstream rather than a constraint a consumer works around.

---

## Duty

Let short-lived processes invoke named operations through one shared on-demand caller per identity and target, preserving [`operation-call`](C5-operation-call.md)'s four honest endings across the local hop.

That is the whole duty.\
It does not also route network messages, retry calls, queue work while disconnected, share a connection across different identities, or decide authorisation - each of those belongs to [`C1`](C1-agp.md), [`C5`](C5-operation-call.md), or the host application.

At the altitude below this one it is fourteen units in its anchored core, listed under `Edges`.\
That is the anchored core of one box, per [`C0`](README.md#duty-is-singular-at-an-altitude), not fourteen duties.

---

## Contract

What a consumer depends on, and what it may not reach past.

| surface | contract |
|---|---|
| caller parity (`createProxyClient`) | implements the exact caller interface of [`C5`](C5-operation-call.md) (`call`, `prepare`, `status`), so application or SDK code written against [`C5`](C5-operation-call.md) runs through the proxy unchanged and passes [`C5`](C5-operation-call.md)'s `registerCallerSuite` |
| on-demand lifecycle and single owner | keyed by `keyDigest` over `(application, identity, target)`: the first short-lived caller launches the proxy when none answers, concurrent launches elect one owner via an exclusive lock in the user's mode-`0700` runtime directory (`~/.operation-proxy/<digest>.lock`), and the proxy exits after its configured idle window (`proxy-idle-expiry`) never while a call or stream is in flight |
| hop allowance and honest endings | the proxy subtracts a small hop allowance (`DEFAULT_HOP_ALLOWANCE_MS`) from the caller's deadline for the underlying [`C5`](C5-operation-call.md) call; if the underlying ending returns before the caller's deadline it is delivered unchanged, and if the proxy dies or the local channel fails after a request was written, the caller receives `unknown` (`proxy-lost` or `hop-stalled`), never a false `not-delivered` |
| read-only status (`status`) | `client.status({ timeMs, signal })` reports whether the identity's proxy is `stopped` without starting one, or `running` (`pid`, `connected`, `routeReady`, `inFlight`, `idleMs`, and optional `managementUrl`), and returns `not-delivered` when the channel is unreachable or unsafe (`runtime-dir-unsafe`) |
| machine and browser adapters | `@apnex/operation-proxy/machine` (`createMachineClient`, `startMachineProxy`, `runMachineProxy`) runs over a local Unix domain socket in the user-database home (`os.userInfo().homedir`); `@apnex/operation-proxy/browser` (`createBrowserClient`, `runBrowserProxy`) runs over a browser `SharedWorker` |

The local channel adapter (`machine` vs `browser`) is the extension seam: both adapters implement the neutral channel link port while sharing the same `client-half` and `proxy-half` state machines.

---

## Reference

The sovereign repository `apnex/operation-proxy` (`@apnex/operation-proxy`), with its vision in `VISION.md`, its contract in `CONTRACT.md`, and its machine-checked surface in `export-map.json`.

The contract and export map state what is served now, so this reference stays true without a version recorded here.\
Where `export-map.json` records `deferred: {}`, current and target have not diverged.

Do not read the implementation to judge fit.\
If duty, contract and fit criteria are insufficient to decide, that is a defect in this entry.

---

## Fit criteria

### Does my project want this at all

Read this half first, before knowing anything about `operation-proxy`.\
If none of it describes you, stop here.

- Your users or agents run short-lived CLI commands, scripts or hooks that call a service over [`C1`](C1-agp.md) and [`C5`](C5-operation-call.md).
- Connecting a fresh [`C1`](C1-agp.md) node on every CLI invocation would churn route announcements, add connection setup latency to every command, and turn one agent identity into dozens of ephemeral peers.
- You are about to write a background daemon, PID/lock file, Unix socket protocol, or idle-shutdown timer by hand.

### Does it meet my requirement

- Zero manual daemon setup: the first command starts the proxy automatically, and it stops itself when idle.
- Strict identity isolation: one proxy serves one `(application, identity, target)` tuple, inside a mode-`0700` directory owned by the OS user.
- Callers still get [`C5`](C5-operation-call.md)'s exact `answered`, `refused`, `not-delivered` and `unknown` guarantees across the local socket hop.

**It is the wrong tool when**

| you need | reach elsewhere, because `operation-proxy` is |
|---|---|
| a long-lived server or agent that already stays running in one process | not needed - embed [`C1`](C1-agp.md) and [`C5`](C5-operation-call.md) directly |
| a shared multi-tenant network gateway serving many users over the network | not a network gateway - it listens only on a host-local channel for one OS user and one identity |
| offline queueing or automatic retry when the hub is down | not a queue or retrier - if the hub is unreachable within the connect window, preparation ends `not-delivered` |

---

## Adjustment policy

Internal and sovereign, so a fit gap has somewhere to go.

1. **Record the gap where both sides can see it.** A local-relay or lifecycle need that `createMachineClient` or `createBrowserClient` cannot meet is recorded against `operation-proxy`'s contract.
2. **Close it at a seam where one exists.** Host-specific IPC and process launching live in the `machine` and `browser` adapters behind the neutral channel link port.
3. **Never fork.** A project-specific local daemon is the exact duplication this component replaces.

---

## Edges

**Contains** - fourteen internal units in its anchored core: client half (`client-half`), connection preparer (`client-preparing`), proxy half (`proxy-half`), key digest (`key`, `sha256`), channel protocol (`channel-messages`, `channel-link`), ending mapper (`endings`), hop clock (`hop-clock`), machine adapter (`machine`, `machine-adapter`, `machine-channel-adapter`, `machine-clock-adapter`, `machine-runtime-adapter`, which `implements` the channel port for OS processes), and browser adapter (`browser`, `browser-adapter`, which `implements` the channel port for `SharedWorker`).

**Contained-by** - nothing; `operation-proxy` is a top-level registered component.

**Consumes** - [`C5`](C5-operation-call.md) (`operation-call`), [`C1`](C1-agp.md) (`agp`), and [`C3`](C3-shape-check.md) (`shape-check`) through their declared contracts ([`E5`](../entities/E5-system.md)).

**Consumed-by** - `zorg` (`@apnex/zorg-cli`), which uses `operation-proxy` through its declared contract without containing it ([`E5`](../entities/E5-system.md)).
