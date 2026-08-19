---
id: S4
category: style
title: Four-journey README
added: 2026-05-24
status: active
supersedes: []
related: [S3, P1]
---

# S4 - Four-journey README

## Rule

The top-level README of an operator-facing project orients on the
four lifecycle journeys an operator can take:

1. **Install** - get it running for the first time.
2. **Use** - drive it day-to-day once installed.
3. **Test / verify** - confirm it's working as intended.
4. **Remove** - uninstall cleanly, leaving the host in a known
   state.

Each journey gets a short section in the README that (a) names the
journey, (b) summarizes the shape of the journey in 1-3 sentences,
and (c) **links to the deep-dive doc** that walks the operator
through it step-by-step. The README itself does not embed the
step-by-step.

A "what this project is" intro (1 paragraph) and a "prerequisites
overview" section can precede the four journeys; nothing else
should.

---

## Rationale

The READMEs that turn into walls of text always do so by trying to
embed every workflow inline. Operators arriving fresh can't find
the path that applies to them; operators returning to do one
specific thing have to re-scan the wall to locate it. Both cases
fail.

The four journeys are exhaustive for any operator-facing
deliverable - there is no fifth life-cycle phase an operator drives
that doesn't fit one of those four labels. So the README's job is
just to be the discovery layer: "you are here; the four things you
can do are these; click through to the one you need."

This also makes the project's documentation surface visible at a
glance. If install has a doc but remove doesn't, the README itself
exposes that gap.

---

## Examples

**Bad:**

> 491-line README that opens with a system architecture diagram,
> then has installation steps inline (covering both substrates with
> nested conditionals), then has usage examples, then has
> troubleshooting, then has uninstall buried near the end.

**Good:**

> ~150-line README:
>
> - 1-paragraph intro: *what this is*.
> - Prerequisites overview (links to a prereqs doc).
> - **Install** section: 2 sentences + link to `docs/install.md`.
> - **Use** section: 2 sentences + link to `docs/usage.md`.
> - **Test** section: 2 sentences + link to `docs/test.md`.
> - **Remove** section: 2 sentences + link to `docs/teardown.md`.
> - Status / project-meta footer.

---

## When to apply

- Bootstrapping the README for any new operator-facing project.
- Reviewing a README that's grown past ~200 lines - that's the
  signal it's outgrown the inline-everything shape.
- Restructuring a project's docs when journeys start blurring
  together and operators report "I couldn't find the uninstall
  steps."

---

## Origin

A rigorous docs rewrite cut a top-level README from 491 lines to
~167 lines by adopting this exact shape. The collapsed material
moved into journey-specific deep-dive docs; nothing was lost; the
README became navigable for both new arrivals and returning
operators.
