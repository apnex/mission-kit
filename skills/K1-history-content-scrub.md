---
id: K1
category: skill
title: History content scrub
added: 2026-05-24
status: active
supersedes: []
related: [K2, M4, S3]
---

# K1 - History content scrub

## Rule

When content must not remain in git history - AI-authorship trailers, a leaked credential, an internal identifier - rewrite the affected refs to remove it, prove the rewrite was both complete and surgical, then take the publication decision to [[K2]].

The mechanics are identical whatever the target.\
Only the rewrite scope and the post-scrub obligation vary by class.

**1. Classify the target.** The class fixes what you rewrite and what you owe afterwards:

- **Authorship trailer** - `Co-Authored-By:` naming an AI tool, generated-with footers, `🤖 ...` lines, `Signed-off-by:` referencing a tool address. Messages only. No further obligation.
- **Live credential** - a key, token, password, or private certificate. Messages and blobs. **Rotate it first.** A scrub is not remediation; treat the secret as compromised from the moment it was pushed, and rotate whether or not the scrub succeeds.
- **Identifier** - a project ID, internal hostname, customer or client name. Messages and blobs. No obligation beyond the purge limit in Caveats.

**2. Inventory before touching anything.** Build the full pattern list and confirm where each occurrence lives - blob content, commit message, tag message. A pattern you miss survives the rewrite; a pattern that over-matches silently eats code. Check messages explicitly: a commit that *removes* a secret often names it in its own message.

**3. Back up to the filesystem, not to a ref.** Copy the whole repository including `.git`. A `refs/pre-scrub/*` ref is not a backup here - `git filter-repo` rewrites every ref in the repository, the backup ref among them. Record the pre-scrub tip SHA alongside the copy.

**4. Rewrite.** Use `git filter-repo` with `--replace-text` for blobs and `--replace-message` for commit and tag messages, scoped to the classification in step 1. Apply to the refs you mean to change, not blindly to everything.

**5. Verify - all three checks, before cleanup.** This is the step that separates a scrub from a hope:

- The target appears in **no blob and no message**, across every ref.
- The **tip tree hash is unchanged**, whenever the scrub should not alter current state. This is the strongest check available: it proves the rewrite touched history and nothing else.
- The **commit count is unchanged**.

**6. Clean up.** Delete `refs/original/*` if `filter-branch` was the fallback, expire reflogs, and garbage-collect so the old objects are unreachable locally.

**7. Publish under [[K2]].** The scrub does not authorise its own force-push. K1 establishes that the rewrite is correct; [[K2]] decides whether publishing it is safe.

## Rationale

Content-removal policies usually arrive *after* the commits have landed - a compliance rule, a contractor agreement, a private repo going public, a secret pasted into a config. The remedy is mechanical but fragile in three distinct ways, and each needs its own guard.

Get the pattern wrong and you either strip too much or leave the target behind, so the inventory comes first. Get the logic wrong and you need to start over, so the backup comes before the rewrite. Get it *apparently* right and ship it unverified, and nobody finds out until the target turns up in a clone - so verification is a step, not a habit.

Separating the mechanics from the publication decision is what keeps this rule usable. A scrub of a leaked key and a scrub of an AI trailer are the same procedure with different obligations; the question of whether force-pushing the result is safe is a different question entirely, with different inputs, and it belongs in [[K2]].

## Caveats

- **A scrub is not a purge.** Rewriting and force-pushing makes the old commits unreachable; it does not delete them from the host. They remain fetchable by SHA. Confirmed 2026-08-05 on `apnex/k3s-gce`: after a successful `--force-with-lease`, the orphaned commit was still served in full by the GitHub API, target string intact. Purging requires a request to the host's support team. Never report a scrub as a retraction.
- **Rewrites every commit SHA reachable from the scrubbed refs.** Tags, branches, CI configs, deployment manifests pinning a SHA, and docs citing commits all need updating.
- **`--force-with-lease` is not `--force`.** The lease fails if the remote moved. That is the safety property you want.
- **Signed commits lose their signature** unless re-signed during the rewrite. Decide upfront whether re-signing is in scope.
- **Open PRs against the rewritten branch** must be closed and re-opened against the new history.
- **Existing clones diverge.** Every checkout of the old history - another machine, a CI cache, a colleague - needs a fresh clone or a hard reset.

## Examples

**Bad:**

> Runs `git filter-branch --msg-filter 'sed /Co-Authored-By: Claude/d'` directly on `main`, no inventory, no backup, no verification, then `git push --force`. The trailer survives in three commits the regex didn't anchor correctly, nobody checks, and two consumers' clones break overnight.

**Good:**

> Classify: authorship trailer, messages only, no rotation needed.
>
> Inventory the patterns, then back up the working copy:
> ```bash
> tar -czf ../repo-pre-scrub.tar.gz .
> git rev-parse HEAD > ../repo-pre-scrub.sha
> ```
>
> Rewrite, then verify all three checks before cleaning up:
> ```bash
> git filter-repo --replace-message ../patterns.txt --force
> git log --all --format='%B' | grep -c 'Co-Authored-By: Claude'   # expect 0
> git rev-parse HEAD^{tree}                                        # expect unchanged
> git rev-list --count HEAD                                        # expect unchanged
> ```
>
> Then take the publication decision to [[K2]].

## When to apply

- Adopting a content policy - no AI attribution, no internal identifiers - that must apply retroactively.
- Preparing a private repo for public release.
- A credential has been committed. Rotate first, then scrub.
- Onboarding contractors or vendors whose contracts disallow third-party attribution on delivered work.

Do not apply to remove content you merely regret. History is a record; the bar is that the content must not be there, not that you would rather it weren't.

## Origin

2026-05-24 - a no-AI-attribution policy adopted mid-project required scrubbing existing commit history across a fork branch and a project repo. The procedure was codified into a reusable scrub-tool repo with four scripts and a README. Memory: `feedback_no_claude_attribution_in_commits`.

2026-08-05 - the same procedure was needed for a GCP project ID in `apnex/k3s-gce`, a target class the attribution-only framing did not cover, so the rule was generalised to any history content with per-class obligations. Three corrections came out of that run. The rewrite had to cover blobs as well as messages, which the messages-only framing forbade. A backup *ref* would not have survived `git filter-repo`, which rewrites every ref including the backup. And the force-push did not purge - the orphaned commit was still served by the GitHub API afterwards, which is now a caveat rather than a discovery.
