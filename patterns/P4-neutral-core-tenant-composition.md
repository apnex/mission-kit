---
id: P4
category: pattern
title: Neutral core + tenant composition - shared mechanism, injected semantics, promote down by evidence
status: active
hydrate-when: A mechanism is about to be built, or built a second time, and you are deciding whether it belongs in a neutral core or in the domain that first needs it
supersedes: []
related: [A3, P3]
---

# P4 - Neutral core + tenant composition

## Rule

When two or more domains need the same *mechanism* - a state stepper, a graph traversal, a transactional commit, an index - factor that mechanism into a thin, **domain-neutral core** and let each domain be a **tenant** that programs the core declaratively.\
The core owns the *mechanism*; the tenant owns the *semantics*.

Three constraints make it hold:

- **The core names no domain vocabulary.** Its functions take
  injected data + callbacks (a schema, an adjacency function,
  validators, store ports) and return results in those terms. No
  entity name, no field name, no business noun appears in the core.
  Enforce it with a gate that scans the core's source for banned
  domain terms - an import-graph check is not enough, because a core
  can leak a domain word in a string or comment while importing
  nothing.
- **Tenants program, consumers consume.** A tenant supplies a
  manifest + injected functions; thin consumers call the tenant.
  Value falls to the lowest layer common to everything above it.
- **Promote down by evidence, not speculation.** A primitive moves
  *into* the core when it holds none of any tenant's content and a
  tenant's selected work needs it. The evidence is the answer to
  "what would it take to make this free of every tenant's
  content?" - when that work is done, a single tenant is enough;
  until it is, the primitive stays in that tenant. A second, real
  consumer is the strongest test of the shape, and the core is
  adjusted to fit it, never forked.

---

## Rationale

The naive alternative - copy the mechanism into each domain - drifts and rots: the state machine in domain A diverges from the one in domain B, and a fix in one is forgotten in the other.\
The opposite failure is worse: a speculative "framework" built for reuse before any second consumer exists, which ossifies the wrong abstraction and costs months to unwind.\
Both are avoided by a *thin* core that does exactly the mechanism and a hard promotion rule that waits for evidence.

Neutrality is the load-bearing property.\
A core that quietly knows about one domain's nouns isn't reusable - it's that domain's code with extra indirection.\
The source-scanning gate is what keeps the neutrality honest under maintenance: it fails the moment someone "just adds" a domain term for convenience, which is exactly when the abstraction would start to rot.\
The strictness is the point.

Promotion-by-evidence is what stops the core from bloating.\
The question is never "could this be generic?"\
(everything could) but "what would it take to make this free of every tenant's content, and is that done?"\
A primitive that still carries its first tenant's nouns stays in that tenant, where it is cheap to change; one that carries none moves into the core as soon as selected work needs it, so the mechanism is not built twice while everyone waits for a second consumer.\
Generality that no selected work needs is still speculation, and is not built.\
The second consumer, when it comes, is what tests the *actual* shared shape - and a core kept thin and neutral is cheap to adjust when that shape differs from the first guess.

---

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
> once. A maintained index whose code still names one tenant's
> fields stays in that tenant until those names are lifted out into
> what the tenant injects; once its code names none, it moves into
> the core when that tenant's work needs it, before any second
> tenant arrives.

---

## When to apply

- A second domain is about to grow a mechanism the first already
  has (state machine, traversal, transactional store, cache/index).
- One domain is about to build a mechanism that need hold none of
  its own content - ask what would make it free of that content,
  and build it in the core once the answer is done.
- Designing a component intended for multiple consumers - start the
  core thin + neutral and let it grow by promotion, rather than
  speccing a broad framework up front.
- Reviewing a "shared" library that has accumulated one consumer's
  vocabulary - that's the smell this pattern prevents.

Don't promote a mechanism that still holds a tenant's content, or build generality that no selected work needs: you'd be speculating.\
A single consumer is not itself the obstacle; content is, and so is building ahead of need.
