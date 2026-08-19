---
id: M6
category: methodology
title: Author from exemplar — read a peer instance before adding to a collection
status: active
supersedes: []
related: [M2, S1, A4, A14]
---

# M6 — Author from exemplar

## Rule

Before authoring a new instance into an existing collection —
an axiom into an axiom set, a handler into a handler directory,
a doc into a doc family, a config into a fleet of configs —
**read at least one full peer instance first.** The ground rules:

1. A **spec or README tells you the required shape**; only a
   peer instance tells you the **living conventions** — voice,
   granularity, what goes where, which fields are terse and
   which are elaborated, what the collection actually treats as
   normal.
2. Pick the **nearest peer** as the exemplar: the most recently
   added instance, or the one closest in kind to what you're
   writing. Older instances may predate convention drift.
3. Where spec and exemplar disagree, **flag it** — either the
   spec has rotted (file the doc bug) or the exemplar deviated
   (fix it or don't copy it). Never silently pick one.
4. After authoring, **diff against the exemplar once** —
   structure, section order, voice — before shipping.

## Rationale

Specs are compressed; collections carry uncompressed convention.
An author working from the spec alone produces an instance that
is *valid* but *foreign* — right sections, wrong voice; right
fields, wrong altitude; project-specific detail where peers keep
it quarantined. Each foreign instance then becomes a bad exemplar
for the next author, compounding drift. The failure is invisible
at authoring time (the spec is satisfied) and expensive at review
time (a reviewer must now articulate conventions nobody wrote
down). Reading one peer costs minutes; it converts every unwritten
convention into free guidance and keeps the collection coherent
enough that its own instances remain trustworthy exemplars.

## Examples

**Bad:**

> Author reads the collection README, writes a new entry matching
> every specified section, ships it. Review finds the title breaks
> the (unwritten) noun-phrase convention, the body carries
> project-specific references every peer confines to a provenance
> section, and a closing section is missing its customary framing
> line. Three rounds of avoidable correction.

**Good:**

> Author reads the README for required shape, then opens the most
> recently added peer entry. Notes the title style, the section
> voice, where project detail is quarantined. Writes the new
> entry, diffs it once against the peer, ships. Review passes
> structurally clean; discussion focuses on substance.

## When to apply

- Adding any entry to a curated collection (axioms, methodology
  sets, pattern libraries, runbooks, schema families).
- Writing the Nth handler / migration / adapter in a directory of
  N-1 existing ones.
- Contributing to an unfamiliar repo — the exemplar read doubles
  as convention onboarding.
- Especially when a spec/README exists and feels sufficient —
  that feeling is the failure mode.
