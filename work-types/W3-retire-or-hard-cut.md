---
id: W3
category: work-type
title: retire-or-hard-cut - delete a surface with disposition
status: active
hydrate-when: You are deleting a surface and must say what happens to what depended on it
roleEligibility: [engineer]
evidenceContract:
  - {kind: pr, description: deletion diff}
  - {kind: commit, description: merged SHA}
  - {kind: freeform, description: reference scan + residual disposition}
evidenceAuthority: executor-evidence
domainEligibility: [delivery-code, distribution, tooling-harness]
domainFreedom: free
parameters:
  - {name: target, fills: the surface to retire, bindingSource: operator-supplied}
generationMode: arc-seeded
falsifier: active refs remain or rollback not documented
compositionHooks: dependsOn the reference-scan; disposition recorded before the deletion merges
---

# W3 — retire-or-hard-cut

## Definition

Delete a named surface (a module, package, vendored tree, transport path) from
the codebase and record where its responsibility went — a hard cut, not a
deprecation shim.

## Evidence & closeability

Closes on the three-part `evidenceContract`: the **pr** (deletion diff), the
**commit** (merged SHA), and a **freeform** reference scan proving no active
callers remain plus a residual disposition (where the responsibility moved, or
that it is gone). `evidenceAuthority: executor-evidence` — the engineer's own
deletion + scan satisfy it. All nine composition constraints and the closeability
preflight are canonical in `work-types/README.md` (referenced, not restated); the
scan-before-merge dependency is the seed-time projection of the falsifier gate.

## Generation

`arc-seeded` — minted by a driver inside a cleanup/hygiene blueprint against a
`target` the operator supplies. idea-425 (role×type×domain compose) instantiates
it as an engineer node on a `free` domain; idea-451 brackets it so a FAILed scan
grows a repair edge rather than merging a live-ref deletion; idea-403's pool never
auto-mints it (deletion needs an explicit target). **Falsifier:** active refs
remain, or the rollback/disposition is not documented — either turns the node
FAIL rather than done.

## Axiom alignment

- **A6** — deletion is the highest-leverage hygiene move; less surface is less to
  carry, directly serving the self-fed engine's throughput.
- **A11** — the reference scan makes the cut verifiable at seed, so the architect
  need not hand-audit each removal.
