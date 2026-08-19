---
id: W5
category: work-type
title: author-guard-or-falsifier-tests - add a test that can fail
status: active
roleEligibility: [engineer]
evidenceContract:
  - kind: test-run
    description: failing-before / passing-after or mutation proof
evidenceAuthority: executor-evidence-provisional
domainEligibility: [delivery-code, tooling-harness]
domainFreedom: free
parameters:
  - name: target
    fills: the under-tested surface
    bindingSource: discover-from-substrate
generationMode: proactive-poolable
falsifier: a vacuous test that cannot fail
compositionHooks: proactive-poolable ONLY under constraint 7 — a mandatory bracketing verify-gate the idle engine instantiates alongside it, OR the provisional authority (executor-evidence-provisional). Closure does not count as assurance until an independent gate consumes it.
---

# W5 — author-guard-or-falsifier-tests

## Definition

Add a test that pins a real behavior on an under-tested surface — a guard that
turns red on regression or a falsifier that mutation-proves it can fail. The
value is the failing observation the test is capable of producing, not the green
tick.

## Evidence & closeability

The evidence contract is a single `test-run`: **failing-before / passing-after,
or a mutation proof** that the test discriminates. The closeability preflight is
the canonical constraint set in `work-types/README.md` — satisfied, not
restated. The load-bearing gate here is **constraint 7**: an executor-evidence
idle node may not reach terminal `done` on self-produced evidence with an
unevaluated falsifier. W5 satisfies this via `executor-evidence-provisional` —
its closure is provisional until an independent gate consumes it (or a bracketing
verify-gate is instantiated alongside it). Constraint 5 (named falsifier) and
constraint 3 (the `target` param carries a `discover-from-substrate`
bindingSource, so no vacuous node) also bind at seed.

## Generation

`proactive-poolable` — mintable against the existing substrate with no trigger,
so it enters the idle-QoS pool (idea-403/404). idea-425/451/403 instantiate it as
an idle engineer picking an under-tested surface, minting the node with `target`
bound from substrate discovery, and closing provisionally under a bracketing
verify-gate. The falsifier is **a vacuous test that cannot fail** — a test whose
mutation proof is absent (nothing it asserts can go red) fails the seed's
constraint-5/7 preflight rather than closing as assurance.

## Axiom alignment

- **A7** — the test is the independent falsifier; provisional closure keeps
  self-produced evidence from standing as assurance until an independent gate
  consumes it.
- **A8** — a guard that can go red is the durable repair-detector for the surface,
  turning future regressions into machine-visible FAILs.
