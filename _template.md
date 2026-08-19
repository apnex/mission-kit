---
id: X0
category: style          # style | methodology | pattern | skill
title: One-line title — imperative voice, no period
status: active           # active | superseded | deprecated
supersedes: []           # list of IDs this replaces (if any)
related: []              # cross-link to other IDs that pair with this
---

# X0 — <Title>

## Rule

One imperative paragraph stating the rule. The thing you'd put on a
sticky note.

## Rationale

Why this exists. What fails without it. Be concrete — name the
specific failure mode that motivated codifying this. One or two
paragraphs.

## Examples

**Bad:**

> <generic example showing the anti-pattern; no project specifics>

**Good:**

> <generic example showing the rule applied; no project specifics>

## When to apply

The trigger condition. Read this section when you're about to start
a task that might touch the rule's domain. Bulleted list works well.

- Trigger 1.
- Trigger 2.

## Origin

The real finding that codified this rule. Brief — one or two
sentences. Link to durable artifacts only (commits, memory entries,
permalinked docs); not ephemeral PRs/issues that might disappear.

---

<!--
Template usage:
  cp _template.md <category>/X<n>-<kebab-slug>.md
  Pick X based on category prefix:  S=style M=methodology P=pattern K=skill
  Pick n as the next free integer in that category (see INDEX.md).
  Update INDEX.md + the category's README.md to include the new row.
-->
