---
id: K2
category: skill
title: Publishing rewritten history
added: 2026-05-24
status: active
supersedes: []
related: [K1, M4]
---

# K2 — Publishing rewritten history

## Rule

Force-push of rewritten history is **forbidden by default**.
It is acceptable only when a named justification, a clean harm test, and the mechanical safeguards all hold.

The gate is on **blast radius, not branch name**. A solo `master` with no forks and no consumers is safe to rewrite; a shared `feature/x` that CI pins by SHA is not. Judge the branch you have, not the branch its name suggests.

### Justification

1. **A named justification, supplied by the invoking rule or a recorded human decision.** A [[K1]] scrub, a cascade rebase whose consumer docs cite pre-rebase SHAs, a trailer strip required by policy. *"Cleaning up the commits"* is not a justification. If you cannot name what breaks or what policy fails by leaving history alone, stop.

### Harm test — all four

2. **No competing work on the branch.** No other contributor has commits on it outside the rewrite, and nobody has unpushed work based on it.
3. **No forks, or every fork owner notified** with the pre- and post-rewrite tips, before the push.
4. **No open PRs targeting the branch.** Open PRs would have to be closed and re-opened against new commits, losing review history. Defer until they merge or close.
5. **No external references to the affected SHAs.** CI configs, deployment manifests, release notes, published links, another repo's docs. Where any exist, update them in the same change or defer.

### Safeguards — all three

6. **Range-diff clean.** `git range-diff <old>...<new>` shows no semantic change beyond the intended one. This is the mechanical check that catches a filter regex which silently ate code.
7. **Rollback preserved.** A filesystem copy of the pre-rewrite repository and its tip SHA, both retained until the push is confirmed good. Recovery must be mechanical, not reconstructive.
8. **Logged.** The invocation is recorded somewhere durable — a catalog doc, a memory entry, a changelog — naming the justification, the harm-test evidence, and both tips. Implicit invocations do not count.

Use `git push --force-with-lease=<branch>:<expected-sha>`, never `git push --force`.
The explicit lease value is the last defence against racing another push, and it still applies when the rewrite tool has dropped your remote-tracking ref.

## Never

- A branch you do not own.
- An upstream repository you do not control.
- A branch under a policy requiring linear or immutable history, regardless of the harm test.

## Rationale

Rewriting published history is destructive. Collaborators lose work, CI rebuilds from refs that no longer exist, and anyone who branched off the old history has to rebase. The conditions exist to make those harms bounded and reviewable rather than discovered afterwards.

The split between justification and harm test is deliberate, and it is what keeps this rule general. Whether a rewrite is *warranted* depends entirely on motive, and motives multiply — attribution, secrets, identifiers, rebases, licence headers. Whether a rewrite is *safe to publish* does not depend on motive at all; it depends on who else is holding the old history. Enumerating admissible motives here would mean editing this rule every time a new one appears, which is exactly how the earlier version came to forbid the [[K1]] scrub it was written to authorise.

Condition 6 catches accidental tree changes, the worst-case failure of any rewrite. Condition 7 makes rollback cheap enough that you will actually do it. Condition 8 turns *"this seemed fine at the time"* into an auditable record.

## Examples

**Bad:**

> *"I rebased the branch to clean up the commits."* No named justification, no range-diff, no backup, no record. Two collaborators rebuild their local branches by accident.

**Also bad:**

> The harm test is skipped because the branch is called `feature/x` rather than `main`. Three people share it and the deploy manifest pins one of its SHAs. The name was never the risk.

**Good:**

> Logged in the project's catalog: *"Force-pushed `master` 2026-MM-DD. Justification — [[K1]] identifier scrub, condition 1. Harm test — sole contributor, 0 forks, 0 open PRs, no external SHA references, evidence in the linked run. Safeguards — range-diff shows only the target substitution, filesystem backup retained at `<path>`, pre-tip `<sha>`, post-tip `<sha>`."*
>
> Then publish with an explicit lease:
> ```bash
> git push --force-with-lease=master:<pre-tip-sha> origin master
> ```

## When to apply

- Publishing the result of a [[K1]] scrub.
- A cascade rebase across a patch series where consumer documentation cites the pre-cascade SHAs.
- Any rewrite of history that has already been pushed.

Do not apply for cosmetic improvement, and do not treat a passing harm test as permission to rewrite habitually. The default is still no.

## Origin

2026-05-24 — a patch-series cascade rebase across fork branches needed force-push because consumer documentation cited the pre-cascade-base SHAs. Five conditions were codified to make the carve-out reviewable and repeatable. Memory: `feedback_force_push_fork_carve_out`.

2026-08-05 — the rule was found to forbid the [[K1]] scrub it is cited by, on two counts. Its justification condition admitted only consumer-reference correctness, so a policy scrub failed it even on a fork branch; and its branch prohibition covered `master`, which is where [[K1]]'s own worked example operates. Both were artifacts of generalising from a single fork-branch incident. The justification condition became motive-agnostic and the branch prohibition became the harm test, so that a new scrub class never again requires editing this rule.
