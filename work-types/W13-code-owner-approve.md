---
id: W13
category: work-type
title: code-owner-approve — non-author independence approval
added: 2026-07-13
status: active
roleEligibility: [architect, verifier, engineer]
evidenceContract:
  - kind: review
    description: review ID from a non-author / code-owner
evidenceAuthority: verifier-attestation
domainEligibility: [authority-governance]
domainFreedom: pinned
parameters:
  - name: pr
    fills: the change needing approval
    bindingSource: provided-by-trigger
generationMode: reactive-triggered
falsifier: author approves own change (author == approver)
compositionHooks: brackets the PR node; approval gate whose eligible-approver set must contain an identity != the change author, else routes to the director-ratification path
provenance: [gh-codeowners-architect-approval]
---

# W13 — code-owner-approve

## Definition

A code-owner (non-author) grants the independence approval a governed change
requires to clear REVIEW_REQUIRED — an author-distinct identity attesting the PR,
never the author's own sign-off.

## Evidence & closeability

The evidence contract is a single `kind: review` — a review ID produced by a
non-author / code-owner. Authority is `verifier-attestation`. Closeability is
governed by the canonical constraint set / closeability preflight in
`work-types/README.md` (do not restate it here). Load-bearing here: constraint 8
(author ≠ approver for independence gates) — the eligible-approver set must
contain ≥1 identity distinct from the bracketed change's author; if the live
roster collapses to a sole code-owner who is the author, the seed fails and
surfaces the **director-ratification** path (the only authority that can unblock
a self-approval).

## Generation

`generationMode: reactive-triggered` — instantiated by a substrate trigger (an
opened PR needing code-owner approval on a governed surface), never idle-pooled
or auto-minted. idea-425/451/403 instantiate it as the approval gate an
author-distinct code-owner satisfies before the PR lands: idea-451's conditional
edge routes a sole-owner self-approval to the director-ratification fallback
rather than admitting it. Falsifier: the author approves their own change
(author == approver) — that turns the node FAIL.

## Axiom alignment

- **A7 / A8** — independent assurance is the load-bearing purpose: an approval
  from an identity that did not author the change is what makes the governance
  gate real rather than self-certified.
- **A13** — the director-ratification fallback is the only sanctioned path when
  no author-distinct code-owner exists, keeping the sole-owner escape under
  director authority.

## Origin

Earned from the `gh-codeowners-architect-approval` practice — a non-pusher
architect code-owner whose author-distinct `--approve` clears REVIEW_REQUIRED on
governed surfaces.
