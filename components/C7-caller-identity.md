---
id: C7
category: component
title: caller-identity - peer session and request principal verification with explicit certainty
status: active
hydrate-when: You are about to record which principal a session or request belongs to or verify caller credentials before ruling on an operation
sovereignty: internal
supersedes: []
related: [C0, C1, C3, C6, C10, A1, A3]
---

# C7 - caller-identity

Sovereignty is `internal`, so a fit gap here is pressure that routes upstream rather than a constraint a consumer works around.

---

## Duty

Establish which principal a session or request belongs to from the evidence presented and the host's rules, without ever claiming more certainty than the evidence gives.

That is the whole duty.\
It does not also decide what an identified principal is allowed to do, issue credentials, run sign-in flows, store user accounts, or frame transport connections - each of those belongs to the application's policy, [`C10`](C10-credential-issuer.md), or [`C1`](C1-agp.md).

At the altitude below this one it is six units in its anchored core, listed under `Edges`.\
That is the anchored core of one box, per [`C0`](README.md#duty-is-singular-at-an-altitude), not six duties.

---

## Contract

What a consumer depends on, and what it may not reach past.

| surface | contract |
|---|---|
| construction | `createCallerIdentity(options)` binds the host's admission mode (`"unauthenticated"` or `"authenticated"`), optional host `admission` rule, optional `verifiers`, optional `redeemedVerifier`, and bounded session retention (`admissionDeadlineMs`, `closedRetentionMs`, `maxClosedSessions`) |
| session principal (`session-principal`) | in `"unauthenticated"` mode (such as `assertedNodeRule`), `admission.evaluate(request)` extracts an asserted principal (`proved: false`) from the peer's node name under the host's rule and records it in the session table; in `"authenticated"` mode (`supportsRedeemedAdmission: true`), it requires redeemed-admission evidence verified by `redeemedVerifier.verifyRedeemed({ redemptionId, lifecycle, remoteNodeId })` within `admissionDeadlineMs`, records the session with `proved: true`, and returns `{ decision: "allow", authorizationAssociation: { mode: "authenticated", issuer, principal, instanceBinding } }` |
| request evidence (`request-evidence`) | `callerIdentity.evidence(delivery, verified?)` checks `delivery.source.originNodeId` first (refusing relayed requests where origin and arrival peer differ), returns the session's recorded principal (`proved: true` or `proved: false`) when `verified` is omitted, and never promotes an asserted principal to proved |
| verified credentials (`verified-principal`) | `verifyCredential(verifiers, credential, options?)` and `callerIdentity.verify(credential)` run every configured `CredentialVerifier` (`{ issuer, verify }`), read each return value as plain data through [`C3`](C3-shape-check.md) (`{ principal, expiresAt?, session? }`), resolve `null` if zero verifiers accept or if any two accepting verifiers disagree on `(issuer, principal)`, and otherwise return a brand-tagged `VerifiedCredential` (`proved: true`) that `callerIdentity.evidence(delivery, verified)` checks for brand authenticity and `clock.now() < verified.expiresAt` |

The verifier port (`CredentialVerifier`) and the redeemed-admission verifier port (`RedeemedAdmissionVerifier`, implemented by [`C10`](C10-credential-issuer.md)) are the two extension seams: applications plug in their own token verifiers and [`C10`](C10-credential-issuer.md)'s `verifyRedeemed` without changing `caller-identity`.

---

## Reference

The sovereign repository `apnex/caller-identity` (`@apnex/caller-identity`), with its vision in `VISION.md`, its contract in `CONTRACT.md`, and its machine-checked surface in `export-map.json`.

The contract and export map state what is served now, so this reference stays true without a version recorded here.\
Where `export-map.json` records `deferred: {}`, current and target have not diverged.

Do not read the implementation to judge fit.\
If duty, contract and fit criteria are insufficient to decide, that is a defect in this entry.

---

## Fit criteria

### Does my project want this at all

Read this half first, before knowing anything about `caller-identity`.\
If none of it describes you, stop here.

- Your service accepts requests from remote peers and needs to know which principal is calling before recording a writer or ruling on access.
- You are about to keep a custom map from connection IDs to caller names, or wire token verifiers directly into request handlers.
- You must keep development-mode self-asserted identities (`proved: false`) strictly separated from cryptographically or verifier-proved principals (`proved: true`).

### Does it meet my requirement

- Every operation on a host reads one consistent principal record for a request, stating `principal`, `proved`, and the evidence source.
- Conflicting verifiers establish no principal (`null`) rather than letting an arbitrary verifier win.
- Relayed requests where origin and arrival peer differ (`originNodeId !== peerNodeId`) are always refused (`{ principal: null, proved: false }`), even when a `VerifiedCredential` is passed; end-to-end identity across relays is outside this component's scope.

**It is the wrong tool when**

| you need | reach elsewhere, because `caller-identity` is |
|---|---|
| minting standing codes or single-use connection admission keys | not a credential issuer - compose it with [`C10`](C10-credential-issuer.md) |
| deciding which principal may read or write which entity | not an authorisation policy - pass its evidence record to your policy in [`C6`](C6-entity-api.md) |
| user registration, password storage, or OAuth login screens | not an identity provider - it verifies credentials from providers you trust |

---

## Adjustment policy

Internal and sovereign, so a fit gap has somewhere to go.

1. **Record the gap where both sides can see it.** If a transport or credential flow supplies evidence that `createCallerIdentity` and `verifyCredential` cannot represent, record the gap against `caller-identity`'s contract.
2. **Close it at a seam where one exists.** New token formats are `CredentialVerifier` plug-ins, and single-use connection keys plug in via `redeemedVerifier` ([`C10`](C10-credential-issuer.md)).
3. **Never fork.** A side table of session principals in application code re-creates the disagreement and certainty drift this component prevents.

---

## Edges

**Contains** - six internal units in its anchored core: identity coordinator (`caller-identity`), bounded session table (`session-records`), asserted-node rule (`asserted-node-rule`), credential verifier and brand guard (`verified-principal`), clock port (`clock`), and identity types (`identity-types`).

**Contained-by** - nothing; `caller-identity` is a top-level registered component.

**Consumes** - [`C1`](C1-agp.md) (`agp`) for peer-identity evidence, delivery context and session lifecycle observation, and [`C3`](C3-shape-check.md) (`shape-check`) for plain-data reading and promise observation across verifier callbacks ([`E5`](../entities/E5-system.md)).

**Consumed-by** - [`C10`](C10-credential-issuer.md) (`credential-issuer`), which uses `verifyCredential` to verify sign-in proofs, and `zorg` (`@apnex/zorg-hub`), which uses `caller-identity` through its declared contract without containing it ([`E5`](../entities/E5-system.md)).
