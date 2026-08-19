---
id: W4
category: work-type
title: validate-locally — self-check a fresh artifact
status: active
roleEligibility: [engineer]
evidenceContract:
  - kind: test-run
    description: local test output + exact command/env
evidenceAuthority: executor-evidence-provisional
domainEligibility: [delivery-code, tooling-harness, distribution]
domainFreedom: free
parameters:
  - name: target
    fills: the just-built artifact + SHA
    bindingSource: provided-by-trigger
generationMode: arc-seeded
falsifier: non-reproducible command or wrong target SHA
compositionHooks: seeded by the build node that produced the target; feeds an independent gate (verify-gate / verifier-attestation) that consumes its provisional evidence
---

# W4 — validate-locally

## Definition

An engineer self-checks a just-built artifact against its own tests before any
independent gate runs — the executor's fast confidence pass on a fresh target,
not the assurance verdict.

## Evidence & closeability

Evidence contract: a single `test-run` carrying the **local test output plus the
exact command and environment** used to produce it. Because the executor both
built and validated the target, this is `executor-evidence-provisional`: its
closure does **not** count as assurance until an independent gate consumes it
(README constraint 7's provisional path). Closeability is the canonical seed-time
projection — see `work-types/README.md` for the constraint set and the
closeability preflight; this entry satisfies it, it does not restate it.

## Generation

`arc-seeded` — minted by the build node inside a blueprint, with `target` bound
`provided-by-trigger` from the artifact-and-SHA that node just produced. It is
the executor-side leg that idea-425/451/403 pair with an independent gate:
idea-451's verify-gate (or verifier-attestation) consumes the provisional
`test-run` to render the actual verdict. Falsifier: a **non-reproducible command
or wrong target SHA** turns the node FAIL — the self-check must re-run against
the exact built target, or it is worthless.

## Axiom alignment

- **A6** — self-fed execution: an idle engineer can validate a fresh build
  without hand-routing, feeding a well-typed provisional node downstream.
- **A8** — assurance stays independent: provisional executor evidence never
  self-certifies; the terminal verdict waits for a gate that is not the executor.
