---
id: P4
category: pattern
title: Neutral core + tenant composition - shared mechanism, injected semantics, promote down by evidence
status: active
supersedes: []
related: [A3, P3]
---

# P4 — Neutral core + tenant composition

## Rule

When two or more domains need the same *mechanism* — a state
stepper, a graph traversal, a transactional commit, an index —
factor that mechanism into a thin, **domain-neutral core** and let
each domain be a **tenant** that programs the core declaratively.
The core owns the *mechanism*; the tenant owns the *semantics*.

Three constraints make it hold:

- **The core names no domain vocabulary.** Its functions take
  injected data + callbacks (a schema, an adjacency function,
  validators, store ports) and return results in those terms. No
  entity name, no field name, no business noun appears in the core.
  Enforce it with a gate that scans the core's source for banned
  domain terms — an import-graph check is not enough, because a core
  can leak a domain word in a string or comment while importing
  nothing.
- **Tenants program, consumers consume.** A tenant supplies a
  manifest + injected functions; thin consumers call the tenant.
  Value falls to the lowest layer common to everything above it.
- **Promote down by evidence, not speculation.** A primitive moves
  *into* the core only when at least two tenants genuinely share it
  (sample-size-two). One tenant's "this might be reusable" stays in
  that tenant until a second, real consumer proves the shape.

## Rationale

The naive alternative — copy the mechanism into each domain — drifts
and rots: the state machine in domain A diverges from the one in
domain B, and a fix in one is forgotten in the other. The opposite
failure is worse: a speculative "framework" built for reuse before
any second consumer exists, which ossifies the wrong abstraction and
costs months to unwind. Both are avoided by a *thin* core that does
exactly the mechanism and a hard promotion rule that waits for
evidence.

Neutrality is the load-bearing property. A core that quietly knows
about one domain's nouns isn't reusable — it's that domain's code
with extra indirection. The source-scanning gate is what keeps the
neutrality honest under maintenance: it fails the moment someone
"just adds" a domain term for convenience, which is exactly when the
abstraction would start to rot. The strictness is the point.

Promotion-by-evidence is what stops the core from bloating. The
question is never "could this be generic?" (everything could) but
"do two real consumers already need it?" Until the second consumer
exists, the primitive lives in the first tenant, where it's cheap to
change. The second consumer is what reveals the *actual* shared
shape — which is almost never the one you'd have guessed from one.

## Examples

**Bad:**

> Two subsystems each need an FSM with the same transition+effect
> shape. Each hand-rolls its own stepper inline. A bug fix to the
> transition guard lands in one and is forgotten in the other; the
> two slowly diverge until "the FSM" means two different things.

**Good:**

> A neutral `step(fsm, state, event)` lives in a thin core that
> names no subsystem nouns (guarded by a source scan for banned
> terms). Each subsystem injects its own transition table and
> effect semantics. One stepper, two tenants; a guard fix is made
> once. A maintained index used by only one tenant stays in that
> tenant — it is promoted into the core only when a second tenant
> needs the same index.

## When to apply

- A second domain is about to grow a mechanism the first already
  has (state machine, traversal, transactional store, cache/index).
- Designing a substrate intended for multiple consumers — start the
  core thin + neutral and let it grow by promotion, rather than
  speccing a broad framework up front.
- Reviewing a "shared" library that has accumulated one consumer's
  vocabulary — that's the smell this pattern prevents.

Don't apply with a single consumer and no concrete second one in
sight: you'd be speculating. Keep the mechanism in the one place
that uses it until the second consumer is real.
