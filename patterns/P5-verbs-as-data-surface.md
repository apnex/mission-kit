---
id: P5
category: pattern
title: Verbs-as-data surface — one manifest drives dispatch, docs, and validation
status: active
supersedes: []
related: [A12, P4]
---

# P5 — Verbs-as-data surface

## Rule

Describe a tool's operations once, as **data** — a manifest listing
each operation with its kind, signature, inputs, and effect — and
drive every surface from that one manifest: the dispatcher routes
off it, the self-documenting/help output is derived from it, and
input validation reads it. Adding a standard operation becomes one
manifest entry plus its handler, with no new branch in the
dispatcher and no separate edit to the docs.

What stays code is the irreducible part — the operation's actual
logic. The manifest declares the *envelope* (name, shape, which
collection it touches, what it emits); it does not try to make the
logic declarative. The win is a generated *surface*, not a no-code
system.

Guard the manifest-to-handler lockstep with a **real** check, not a
source grep. A test that greps the source for `name:` false-passes
when an operation's name happens to collide with some other token in
the file; assert against the *live* handler map (import it and
compare keys) and add a runtime guard that fails loudly on any
invocation if the manifest and the handlers diverge.

## Rationale

Hand-wired surfaces drift across the places that describe the same
operation. A new verb typically touches three spots — the dispatch
branch, the help/`describe` text, and the input parser — and the
moment one is forgotten, the tool advertises an operation it can't
run, or runs one it doesn't document. The "self-documenting surface"
becomes a second hand-maintained copy that silently goes stale.

A single manifest collapses those copies into one source. The help
output is now provably complete (it's derived), a new operation
can't be half-added (the dispatcher and docs come from the same
list), and an agent or operator can learn the whole surface by
reading data rather than tracing code — which is the real payoff
when the primary consumer of the tool is itself automated.

The subtle failure is a *false* lockstep guard. The first instinct
is to grep the source to check "every manifest verb has a handler" —
but a grep matches tokens, not the live dispatch table, so a verb
named after an existing identifier passes the check while the tool
breaks at runtime. The same blind spot hides missing input-binding
coverage. The fix is to make the surface importable and assert
against the actual map, plus a startup guard that converts drift
into a clear error instead of a cryptic failure on first use.

## Examples

**Bad:**

> A CLI grows a new write command. The author adds a dispatch
> branch and the logic, but forgets the `help` text and the
> argument validator. The command works but is undocumented and
> unvalidated; a sibling refactor later renames an input key in the
> validator only, and the command silently drops that field. Each
> surface was edited by hand, so each could drift alone.

**Good:**

> Operations live in one manifest: `{name, kind, signature, inputs,
> effect}`. The dispatcher loops over it, `help` is derived from it,
> and the argument binder reads each entry's `inputs`. A new command
> is one manifest row + a handler. A test imports the live handler
> map and asserts it equals the manifest's operation set; a runtime
> guard rejects any invocation if they diverge — so a half-added or
> mis-keyed verb fails loudly, not silently.

## When to apply

- A tool surface (CLI, RPC, command palette) where each operation
  is currently wired in several hand-edited places that have already
  drifted, or will.
- Building a surface whose primary consumer is an agent — a data
  manifest is far more introspectable than dispatch code.
- As the cheap first step toward a fully declarative/manifest-driven
  tool: capture the surface-as-data value at small scale before
  committing to a general runtime.

Verify the guard you add actually catches drift: inject a colliding
verb name and a mis-keyed input, and confirm the check fails. A
guard that can't fail on planted drift is decoration.

## Origin

A tool's operation catalog and dispatcher were unified onto one
declarative manifest, so its self-documenting surface became derived
rather than hand-listed. An adversarial review caught the first
lockstep guard as false assurance: it grepped source text, so a verb
whose name collided with another token passed while the command was
unreachable, and there was no coverage that an operation's declared
inputs matched what its logic consumed. The fix made the surface
importable (assert against the live map), added a runtime drift
guard, and proved both by injecting drift and watching the new
checks fail.
