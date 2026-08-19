---
id: S5
category: style
title: No version pins in user-facing prose
added: 2026-05-24
status: active
supersedes: []
related: [S6, S7, S8, S9, M4]
---

# S5 - No version pins in user-facing prose

## Rule

Don't hardcode specific versions, tag names, image SHAs, dates, or other
point-in-time identifiers in user-facing prose. Use generic placeholders
(`<your-tag>`, `<aorus.N>`, `<current>`) or reference a single
source-of-truth file (a `VERSION` file, the `image:` tag in a
`docker-compose.yml`, a renderable manifest).

Exceptions for prose that is intrinsically about a specific version:
release notes, migration narratives at the moment they're written, audit
trails. Those are point-in-time artifacts by design - and per [[M4]],
they're frozen at authorship and not kept in the active-docs surface.

---

## Rationale

Every version bump forces edits in N places. Some places get missed.
The doc rots from the moment it's written. Operators land on a doc that
says "tag `aorus.14`" and wonder whether that's still current - they
have to cross-reference against another source anyway, so the pin in
prose served no purpose except to drift.

A more subtle cost: version-pinned prose is a *false* operational
contract. The reader sees a specific version and assumes the
surrounding instructions are tested against THAT version. When the
project has moved on, the prose says one thing and reality says
another. The doc loses trust.

The placeholder pattern (`<your-tag>`) is honest: the doc tells you
what to put in, the source-of-truth file tells you what value to use,
the doc and reality stay in sync regardless of when the doc was last
edited.

---

## Examples

**Bad:**

> A containerised kernel-injector for a patched build of the NVIDIA
> open kernel module (`595.71.05-aorus.14`) that mitigates the
> Thunderbolt eGPU host-freeze bug.

> Build the image: `docker build -t apnex/foo:1.2.3-rc4 .`

**Good (placeholder):**

> Build the image (substitute your tag):
>
> ```bash
> docker build -t apnex/foo:<your-tag> .
> ```

**Good (omit + reference):**

> A containerised kernel-injector for a patched build of the NVIDIA
> open kernel module that mitigates the Thunderbolt eGPU host-freeze
> bug. Current build version is the `image:` tag in `docker-compose.yml`.

---

## When to apply

- Writing or editing user-facing prose (READMEs, install guides,
  teardown guides, troubleshooting).
- Reviewing a doc PR - scan for hardcoded versions in prose; replace
  with placeholders or source-of-truth references.
- Authoring repo metadata (GitHub description, package descriptions,
  release-tracker summaries) - same rule applies, same drift problem.

---

## Origin

2026-05-24 README style audit on a project where the opening prose
hardcoded the patched-driver version. The version had already drifted
once (repo description said `aorus.13`; reality was `aorus.14`); the
README prose was about to drift the same way at the next cycle.
