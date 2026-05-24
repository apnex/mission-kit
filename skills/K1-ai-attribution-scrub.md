---
id: K1
category: skill
title: AI-attribution scrub
added: 2026-05-24
status: active
supersedes: []
related: [K2, M4]
---

# K1 — AI-attribution scrub

## Rule

When project policy requires that AI-assist tooling (Claude Code,
Copilot, Cursor, etc.) leave no authorship trail in git history,
scrub the affected refs with a message-only filter. The procedure:

1. **Inventory the patterns to strip.** Typically `Co-Authored-By:
   <AI-tool> *`, generated-with footers, "🤖 …" attribution lines,
   `Signed-off-by:` lines referencing AI-tool email addresses.
   Build the list before touching history.
2. **Make a backup ref.** `git update-ref refs/pre-scrub/<branch>
   <branch>` before each rewrite. Provides a no-rebuild rollback.
3. **Rewrite messages only, not trees.** Use `git filter-repo
   --message-callback` (preferred) or `git filter-branch
   --msg-filter` (fallback). Tree contents must not change — only
   commit messages.
4. **Apply on the refs you care about**, not blindly on `--all`.
   Stripping a reflog branch you didn't intend to touch is hard to
   un-do.
5. **Clean up post-rewrite state.** Delete `refs/original/*`
   (filter-branch leftovers), expire reflogs (`git reflog expire
   --expire=now --all`), and `git gc --prune=now --aggressive`.
6. **Force-push with lease.** `git push --force-with-lease`, never
   plain `--force`. See K2 for the carve-out conditions that
   justify force-push at all.
7. **Notify downstream consumers** (forks, dependents, anyone with
   a clone) **before** pushing. Rewritten SHAs invalidate their
   clones.

A reusable scrub-tool repo with `(a)` inventory script, `(b)`
dry-run script, `(c)` rewrite script, `(d)` cleanup + force-push
script — plus a README that names each AI-attribution pattern
explicitly — is worth building once and reusing across projects.

## Rationale

AI-attribution policies are increasingly common (compliance,
contractor agreements, public-repo conventions, vendor neutrality)
and they often arrive *after* commits have already landed. The
scrub is mechanical but fragile: get the regex wrong and you
either strip too much or leave attribution behind; skip the reflog
cleanup and the old text is still recoverable; force-push without
notifying consumers and you break their clones.

A pre-built tool with a dry-run mode catches regex errors before
they touch history. Backup refs catch logic errors after. The
combination is what makes the procedure repeatable across projects
without re-discovering each gotcha.

## Caveats

- **Rewrites every commit SHA reachable from the scrubbed refs.**
  Tags, branches, and any external references to commit hashes
  (CI configs, deployment manifests pinning to SHAs, docs citing
  commits) all need to be updated.
- **Force-push-with-lease is not the same as `--force`.** Lease
  fails if the remote moved; that's the safety property you want.
- **Signed commits lose their signature** when rewritten unless
  re-signed during the rewrite. Decide upfront whether re-signing
  is in scope.
- **Open PRs against the rewritten branch** need to be closed and
  re-opened against the new history.

## Examples

**Bad:**

> Runs `git filter-branch --msg-filter 'sed /Co-Authored-By:
> Claude/d'` directly on `main`, no backup, no inventory, no
> reflog cleanup, then `git push --force`. Two consumers' clones
> break overnight; one of them had unpushed work on a branch
> based off the old `main`.

**Good:**

> 1. `tools/scrub-inventory.sh` lists every attribution pattern
>    found across the target branches.
> 2. `tools/scrub-dryrun.sh` shows the diff of message-only
>    changes per commit.
> 3. `git update-ref refs/pre-scrub/main main`.
> 4. `tools/scrub-rewrite.sh main`.
> 5. `git reflog expire --expire=now --all && git gc --prune=now`.
> 6. Notify downstream consumers; allow 24h.
> 7. `git push --force-with-lease origin main`.

## When to apply

- Adopting a new AI-attribution policy and needing to retroactively
  clean history.
- Preparing a private repo for public release where AI trailers
  shouldn't appear.
- Migrating from one AI tool to another and standardizing on
  no-attribution.
- Onboarding contractors / vendors whose contracts disallow
  third-party attribution on delivered work.

## Origin

A no-AI-attribution policy adopted mid-project required scrubbing
existing commit history across a fork branch and a project repo.
The procedure was codified into a reusable scrub-tool repo with
four scripts + a README so the same procedure could be applied to
future repos without re-discovering each step. Memory:
`feedback_no_claude_attribution_in_commits`.
