---
id: C10
category: component
title: credential-issuer - standing codes, single-use per-node admission keys, and key-reuse reporting
status: active
hydrate-when: You are about to issue, present or redeem credentials for peer connection admission or manage revocable machine standing codes
sovereignty: internal
supersedes: []
related: [C0, C1, C3, C7, C8, A1, A3]
---

# C10 - credential-issuer

Sovereignty is `internal`, so a fit gap here is pressure that routes upstream rather than a constraint a consumer works around.

---

## Duty

Issue and redeem single-use per-node connection admission keys from verified sign-ins or revocable standing codes, so no hub ever accepts a reusable credential twice.

That is the whole duty.\
It does not also run user sign-in flows, verify third-party identity tokens itself, frame transport channels, or decide what an admitted principal may read or write - each of those belongs to an identity provider, [`C7`](C7-caller-identity.md), [`C1`](C1-agp.md), or the application's policy.

At the altitude below this one it is eight units in its anchored core, listed under `Edges`.\
That is the anchored core of one box, per [`C0`](README.md#duty-is-singular-at-an-altitude), not eight duties.

---

## Contract

What a consumer depends on, and what it may not reach past.

| surface | contract |
|---|---|
| standing codes (`standing-code`) | `mintStandingCode`, `listStandingCodes` and `revokeStandingCode` on `createCredentialIssuer` let a signed-in principal (verified through [`C7`](C7-caller-identity.md)) mint a 32-byte random code (`ci_code_<64 hex>`) for a provisioned machine identity permitted by the host's `allowStandingCode` rule; only the SHA-256 `codeHash` is stored in `StandingCodeStore` (`createMemoryStandingCodeStore`, or `@apnex/credential-issuer/machine`'s atomic `0600` `createFileStandingCodeStore`), and revocation or wall-clock expiry takes effect immediately |
| lease-exclusive key issuance (`admission-key-issue`, `preshared-key-secret`) | `issueAdmissionKey({ proof, hub, node, proofMode, continuationSecret? })` verifies a sign-in or standing-code proof (never another admission key), checks the host's `allowIssueKey` rule, enforces `(hub, node)` lease exclusivity across competing `(issuer, principal)` pairs and continuation secrets without evicting live leases, and mints a short-lived single-use key carrying a 32-byte random TLS 1.3 external-PSK `secret` (`Uint8Array(32)` + `secretHex`), a printable-ASCII `pskIdentity` (`<= 127` bytes), a `bearerToken`, and an `instanceBinding` |
| single-use redemption and reuse reporting (`single-use-admission`, `key-reuse-report`) | `resolvePsk(pskIdentity)` performs non-consuming lookup within the retention window; `beginPskArrival`, `completePskProof` and `redeemBearer` execute an atomic single-use redemption against [`C1`](C1-agp.md)'s `AdmissionUse` lifecycle (idempotent for the same `use.lifecycle` handle, refusing any second distinct presentation, terminating the first session if the key is still within its live window, and emitting a secret-free `KeyReuseReport` to `onKeyReuse`) |
| redeemed-admission verifier (`admission-key-verifier`) | `verifyRedeemed({ redemptionId, lifecycle, remoteNodeId })` plugs into [`C7`](C7-caller-identity.md)'s `"authenticated"` admission mode, requiring both `redemptionId` and exact `lifecycle` object identity under the current `(hub, node)` lease and `remoteNodeId === record.node` before returning `{ ok: true, issuer, principal, instanceBinding }`, while `sweepLeases()` reclaims leases only when all four liveness conditions hold |
| client presenter and refusal observer (`fresh-key-per-dial`) | `createCredentialPresenterTarget` fetches a fresh single-use key from `issueKey` on every dial and reconnect (presenting a standing code only to the issuer, never to the hub, and enforcing 3-case idempotent `dispose()` carrier-permit custody), and `observeAdjacencyRefusal` subscribes to adjacency events before reading snapshot state to map only current committed `"issuer-refused"` states and rearm on proof rotation (`generation >= receipt.generation`) |

The `StandingCodeStore` port and [`C7`](C7-caller-identity.md)'s verifier list are the seams: durable code storage and external sign-in token formats plug in without changing the key-issuance or single-use redemption state machine.

---

## Reference

The sovereign repository `apnex/credential-issuer` (`@apnex/credential-issuer`), with its vision in `VISION.md`, its contract in `CONTRACT.md`, and its machine-checked surface in `export-map.json`.

The contract and export map state what is served now, so this reference stays true without a version recorded here.\
Where `export-map.json` records `deferred: {}`, current and target have not diverged.

Do not read the implementation to judge fit.\
If duty, contract and fit criteria are insufficient to decide, that is a defect in this entry.

---

## Fit criteria

### Does my project want this at all

Read this half first, before knowing anything about `credential-issuer`.\
If none of it describes you, stop here.

- Clients (CLI daemons, agents, or browsers) connect to a hub over [`C1`](C1-agp.md) and you want every connection admitted with a single-use key rather than a reusable bearer token sent to the hub.
- Headless machines or agents need a revocable standing credential (`standing-code`) that is never sent to the hub itself, only exchanged at the issuer for a one-connection admission key.
- You need stolen or replayed connection keys detected immediately, with the original session terminated if the key is still within its live window and a structured `KeyReuseReport` emitted.

### Does it meet my requirement

- A hub sees one uniform admission mechanism (single-use admission keys bound to `(hub, node)` and verified with [`C7`](C7-caller-identity.md)), whether the client started from a human sign-in or a machine standing code.
- Both native TLS 1.3 external-PSK (`native-tls13-external-psk-v1`, 32-byte secret) and bearer proof modes are supported.
- Standing codes are persisted only as SHA-256 hashes in an atomic `0600` file store (failing closed and quarantining on post-rename directory `fsync` errors).

**It is the wrong tool when**

| you need | reach elsewhere, because `credential-issuer` is |
|---|---|
| verifying third-party OAuth / OIDC / JWT sign-in tokens | not a token verifier - supply token verifiers through [`C7`](C7-caller-identity.md) |
| per-resource access grants (owner / write / read on specific documents) | not an authorisation or ACL engine - enforce resource permissions in application policy |
| end-to-end caller identity across untrusted multi-hop relays | not a relay-surviving identity proof - admission keys authenticate the direct peer connection to the hub |

---

## Adjustment policy

Internal and sovereign, so a fit gap has somewhere to go.

1. **Record the gap where both sides can see it.** A credential-lifecycle or carrier-handshake requirement that `createCredentialIssuer` or `createCredentialPresenterTarget` cannot satisfy is recorded against `credential-issuer`'s contract.
2. **Close it at a seam where one exists.** Standing-code persistence sits behind `StandingCodeStore` (`createMemoryStandingCodeStore` and `createFileStandingCodeStore`), sign-in verification sits behind [`C7`](C7-caller-identity.md), and clock/randomness ports are injectable.
3. **Never fork.** Building a second token-exchange or standing-code store in an application re-creates the long-lived hub token exposure this component eliminates.

---

## Edges

**Contains** - eight internal units in its anchored core: issuer and redeemer state machine (`credential-issuer`), client credential presenter and adjacency refusal observer (`presenter-target`), in-memory standing-code store (`standing-code-store`), atomic file standing-code store (`machine`, `machine-adapter`, which `implements` `StandingCodeStore`), SHA-256 and intrinsic `Uint8Array` validator (`sha256`), clock and randomness adapter (`clock-adapter`), and issuer types (`issuer-types`).

**Contained-by** - nothing; `credential-issuer` is a top-level registered component.

**Consumes** - [`C7`](C7-caller-identity.md) (`caller-identity`) for `verifyCredential`, [`C3`](C3-shape-check.md) (`shape-check`) for `readPlainJson`, `observePromises` and `toCanonicalJson`, and [`C1`](C1-agp.md) (`agp`) for admission-use lifecycle and credential-presenter contracts ([`E5`](../entities/E5-system.md)).

**Consumed-by** - `zorg` (verified in `zorg`'s workspace gates and wired into `@apnex/zorg-hub` and `@apnex/zorg-cli` on Milestone M3 cutover), which uses `credential-issuer` through its declared contract without containing it ([`E5`](../entities/E5-system.md)).
