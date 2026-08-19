---
id: P3
category: pattern
title: Twin-parity by generation - one master, generate the other, gate the round-trip
status: active
hydrate-when: You have a spec and data, or a view and source, that must not disagree
supersedes: []
related: [A2, P1]
---

# P3 — Twin-parity by generation

## Rule

When one model must exist in two representations — a spec form and
a data form, a human-readable view and a machine-checkable artifact,
a diagram and its serialization — do not hand-author both. Pick one
representation as the **master** and **generate** the other from it.
Then add a parity gate to CI that *regenerates* the derived view and
fails if it differs from the committed copy.

The committed derived file is a convenience (it's diffable, it's
browsable), but it is never the source of truth — the gate proves it
is exactly what the master produces. If hand-editing the derived
view is even possible, the gate must catch it.

When generation genuinely isn't available yet (no emitter for that
direction), the fallback is a parity gate that diffs the two hand-
authored twins **field by field** — not just checks that both exist.
But treat that as scaffolding: a diff-of-two-hand-copies still lets
both drift until the next CI run, whereas generation makes drift
structurally impossible.

## Rationale

Two hand-maintained representations of one model drift. Always.
Someone updates the spec and forgets the data file, or fixes the
data and leaves the spec stale; the two are "in sync" only until the
next edit under deadline. The drift is silent because nothing checks
it — each file is independently well-formed, so every tool that
reads one is happy while the other lies.

Generation removes the second author. There is one place to edit;
the other representation is a pure function of it. Parity is no
longer a discipline you have to remember — it's a build invariant.
The gate is what makes the guarantee real rather than aspirational:
"regenerate and diff" turns any out-of-band edit into a red build
with an exact pointer to the stale file and the command to fix it.

The honesty trap to avoid: a parity gate that only checks both
copies *exist*, or only compares their top-level keys, passes while
their contents disagree. The gate must compare the truth-bearing
content (every field that carries meaning), or it's theater.

## Examples

**Bad:**

> A model is kept as both a typed spec (for humans + tooling) and a
> serialized data file (for the runtime). Both are edited by hand.
> A field is renamed in the data file under deadline; the spec is
> missed. CI is green — each file parses fine on its own — and the
> divergence ships, surfacing later as a confusing runtime/spec
> mismatch no one can date.

**Good:**

> The data file is the master. A small emitter generates the spec
> view from it. CI runs the emitter and diffs the result against the
> committed spec; an out-of-band edit to the spec turns the build
> red with *"spec is STALE — regenerate with `<command>`."* The two
> representations cannot disagree across a green build.

## When to apply

- Any model with a spec/data, view/source, or human/machine pair
  that must agree (schemas + their docs; a state chart + its
  transition table; a diagram + its serialization).
- Replacing a "remember to update both" convention that has already
  produced at least one silent divergence.
- Designing a round-trip: decide the master direction first, build
  the generator, and add the regenerate-and-diff gate in the same
  change — not "later."

Don't over-apply: if a representation is purely derived at read time
(rendered on demand, never committed), there's nothing to keep in
parity — this pattern is for *committed* twins.
