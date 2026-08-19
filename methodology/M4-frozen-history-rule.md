---
id: M4
category: methodology
title: Frozen-history rule
status: active
supersedes: []
related: [M3, K1]
---

# M4 — Frozen-history rule

## Rule

Design-record artifacts are **frozen at the time of authorship**
and are not rewritten when project policy later changes. The class
includes:

- Planning docs and brainstorming specs (capturing what was
  considered).
- Per-change intent + review records at time of authorship
  (capturing what the reviewer believed at the time).
- Migration narratives written during the migration (capturing
  what was decided and why, in the moment).
- Retrospectives, post-mortems, ADRs.

When current state diverges from what these records describe, the
remedy is **a status banner at the top of the artifact + a
cross-link to the current state** — not an in-place rewrite. If
the divergence is significant, retire the artifact (move it to an
archive, or flip `status: superseded` with a `supersedes:`
cross-link) but leave its contents intact.

The complement: working source artifacts — code, contracts,
current-state docs, runbooks — *do* get updated in place. The
distinction is *captures-a-decision-point* vs.
*describes-current-state*.

## Rationale

Quietly rewriting a design record to match new norms is
falsification. A reader six months later assumes the record
reflects what was actually decided at the time; if the record has
been silently updated, that assumption is wrong, and the reader
has no way to know. The audit trail is gone.

This matters most when later questions arise: "why did we choose
X over Y back then?" The original record is the only honest
answer. If it's been polished to fit current policy, you've lost
the ability to reconstruct the actual decision — including its
constraints, its alternatives, and the reasoning that no longer
applies.

Status banners + cross-links preserve both signals: the historical
record stays intact (so the audit trail survives) and the
current-state pointer is one click away (so readers aren't
misdirected operationally).

## Examples

**Bad:**

> Project changes its commit-trailer policy. A maintainer updates
> the old planning doc to retroactively use the new trailer
> format, "for consistency." Six months later, someone asking
> "when did we adopt this trailer policy?" finds the planning doc
> already using it — and concludes wrongly that the policy
> predates the change.

**Good:**

> Same policy change. The old planning doc gets a status banner at
> the top: *"This plan was authored 2026-MM-DD under the prior
> trailer policy; the current policy is documented at <link>. The
> body below is preserved as-authored."* The plan body is
> untouched.

## When to apply

- Any policy change (commit conventions, naming rules, review
  process) that would, if applied retroactively, alter the
  apparent state of historical records.
- Cleaning up project history for a public release — distinguish
  the source code (which can be rewritten under known carve-outs)
  from the design records (which shouldn't be).
- Writing a retrospective or planning doc — accept upfront that
  this artifact will become frozen the moment its decision is
  made.

## Origin

A policy change retiring AI-attribution trailers from commit
history scrubbed real commit messages (under a documented
carve-out) but **left historical planning docs untouched** even
where those docs showed AI-trailer examples. The decision was
explicit: the commits are the artifact of record for the source,
but the plans are the artifact of record for what was decided at
the time — and rewriting the latter would have silently revised
the historical narrative.
