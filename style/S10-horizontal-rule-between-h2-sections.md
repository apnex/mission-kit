---
id: S10
category: style
title: Horizontal rule between top-level sections in long-form docs
status: active
supersedes: []
related: [S6, S9]
---

# S10 - Horizontal rule between top-level sections in long-form docs

## Rule

In long-form markdown docs (READMEs and deep-dive docs with 5+ top-level `##` sections, or with any H2 section longer than ~20 lines), insert a horizontal rule (`---`) on its own line, surrounded by blank lines, between each `##` section.

Pattern:
````markdown
## Section A

...content...

---

## Section B

...content...
````

Don't apply to:

- Short docs (3 or fewer H2 sections, all short - header weight alone
  separates cleanly).
- Nested subsections (`###`, `####`) - those rely on header indentation
  hierarchy.
- Reference docs whose H2s are inherently a flat list of equal items
  (e.g., glossaries, FAQ items) - horizontal rules add noise without
  benefit there.

---

## Rationale

**Reader scanning.** In a long README with 8-10 H2 sections, the header typography (`##`) alone often isn't visually heavy enough to dominate surrounding code blocks, tables, and paragraphs.\
A horizontal rule is an unambiguous "new section starts here" cue that helps the reader scroll-scan to the section they want without re-parsing every header along the way.

**Renderer consistency.** Markdown renderers vary in how strongly they weight H2 headers - some make them barely distinguishable from H3, some make them prominent.\
A horizontal rule is the one separator that renders consistently visually (a literal line across the column width) regardless of theme or renderer.

**Source-file structure.** When editing or grepping the source, the `---` marker is unambiguous - it's never part of prose, never part of a code block (those have fenced delimiters), so it's a clean grep anchor for "give me every top-level section break."

---

## Examples

**Bad (no separators in a long doc with many sections):**

````markdown
## Install
...
## Use
...
## Test
...
## Remove
...
````

(In rendered output, sections may run together visually - particularly if any section ends with a long code block or table that already has visible borders.)

**Good (separators between top-level sections):**

````markdown
## Install
...

---

## Use
...

---

## Test
...

---

## Remove
...
````

---

## When to apply

- Writing a new README or deep-dive doc you expect to grow past 5 H2 sections.
- Editing an existing long doc - opportunistic; add when you're already
  touching the section boundaries.
- Don't bulk-add to short docs just because the rule exists. The trigger
  is "long enough that sections risk running together visually."
