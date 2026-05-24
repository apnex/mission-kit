---
id: K2
category: skill
title: Force-push carve-out for fork branches
added: 2026-05-24
status: active
supersedes: []
related: [K1]
---

# K2 — Force-push carve-out for fork branches

## Rule

Force-push to a public fork branch (e.g., your fork of an upstream
project) is **forbidden by default** and acceptable only when
**all five** of these conditions hold:

1. **Downstream-consumer need.** A label, badge, version string,
   or referenced state in a consumer's docs would otherwise be
   wrong if history is left unrewritten. The force-push is the
   minimum change that restores correctness across the consumer
   boundary.
2. **Range-diff identical.** `git range-diff <old>...<new>` shows
   no semantic change beyond what's intended. The rewrite is
   surgical — commit messages, trailer scrubs, rebase onto a new
   base — not silent code changes.
3. **Reflog preserved locally.** Operator has a local
   `refs/pre-rewrite/<branch>` or equivalent and can `git reset
   --hard` back to the pre-push state. Rollback is mechanical.
4. **No open upstream PRs against the rewritten branch.** Open
   PRs would have to be closed and re-opened with new commits,
   losing review history. If there are any, defer the force-push
   until they're merged or closed.
5. **Catalog-documented + user-confirmed.** The carve-out
   invocation is logged (in a doc, a memory entry, a changelog —
   somewhere durable) and the operator has confirmed all five
   conditions before pushing. Implicit invocations don't count.

Use `git push --force-with-lease`, never `git push --force`. The
lease check is the last line of defense against racing a push
from another contributor.

## Rationale

Rewriting public history is destructive: collaborators on the
branch lose their work; CI may rebuild from invalid refs; anyone
who based a branch off the old history has to rebase. The five
conditions exist to make those harms bounded + reviewable:

- Condition 1 forces a concrete justification — *"because labels
  would otherwise be wrong"* is specific; *"to clean things up"*
  is not.
- Condition 2 catches accidental tree changes — a typo in a
  filter regex that silently strips code is the worst-case
  failure of a history rewrite, and `git range-diff` is the
  mechanical check that catches it.
- Condition 3 makes rollback cheap — if any of the harms surface
  post-push, the recovery is a `reset --hard` + force-push to the
  preserved ref.
- Condition 4 prevents losing review history — open PRs are the
  highest-value thing on a branch.
- Condition 5 turns "this seemed fine at the time" into "this was
  explicitly invoked under conditions 1–4."

Without the discipline, force-push becomes a foot-gun that erodes
trust in the branch.

## Examples

**Bad:**

> *"I rebased the fork branch to clean up the commits."* No
> documented downstream need; no range-diff check; no backup ref;
> no record of the operation. Two collaborators rebuild their
> local branches by accident.

**Good:**

> Operator notes in the project's catalog doc: *"Force-pushed
> fork branch `feature/x` 2026-MM-DD under K2 carve-out:
> condition 1 — consumer docs cite the pre-cascade SHA which is
> now wrong; condition 2 — range-diff vs.
> `refs/pre-rewrite/feature/x` shows only the trailer scrub and
> the cascade rebase; condition 3 — backup ref preserved locally;
> condition 4 — no open upstream PRs against this branch;
> condition 5 — this entry."*
>
> Then: `git push --force-with-lease origin feature/x`.

## When to apply

- A documented consumer-facing label / badge / SHA reference
  would be wrong if you don't rewrite.
- A trailer scrub (see K1) requires rewriting commit messages on
  a fork branch.
- A cascade rebase across a patch series requires re-anchoring
  later branches after rewriting an earlier one.

Do not apply: to upstream/protected branches (`main`,
`master`, `release/*`) on any project; to branches with active
PRs awaiting merge; to make trivial cosmetic improvements; ever,
to a branch you don't own.

## Origin

A patch-series cascade rebase across fork branches needed
force-push because consumer documentation cited the
pre-cascade-base SHAs of the later patches. The five conditions
were codified explicitly during that work to make the carve-out
reviewable + repeatable. Memory:
`feedback_force_push_fork_carve_out`.
