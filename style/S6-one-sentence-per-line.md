---
id: S6
category: style
title: One sentence per line (semantic line breaks)
added: 2026-05-24
status: active
supersedes: []
related: [S2, S5, S7, S8, S9]
---

# S6 — One sentence per line (semantic line breaks)

## Rule

Each sentence starts at column 0 on its own line. Don't hard-wrap mid-sentence
to fit a column budget. If a sentence is too long for comfort, split it into
shorter sentences — don't wrap the long one.

The principle: **line breaks carry semantic information.** A new line means a
new sentence. A wrap inside a sentence means nothing — it confuses readers and
clutters diffs.

Applies to markdown prose. Code blocks follow their own line-break conventions
(natural code flow, comments aligned to columns, etc.) — this rule is about
prose only.

## Rationale

**Diffs.** Rewording one sentence becomes a one-line diff, not a re-wrap
cascade across an entire paragraph. PR review focuses on the actual change,
not on noise from re-flow.

**Reading flow.** Eyes navigate by line. With one sentence per line, navigating
by line equals navigating by thought. With mid-sentence wraps, the eye has to
re-scan the previous line's tail to maintain context across the wrap boundary.

**Tooling friendliness.** Greps, grep-based AI/LLM doc-parsers, and text
diffing all work on lines. Sentence-per-line gives each sentence a stable line
identity. Mid-sentence wrap means a sentence is a multi-line region — harder
to extract, harder to reference (`file.md:42` no longer identifies a sentence).

**No column-budget tyranny.** A 78-char hard wrap was a relic of terminal
widths from 50 years ago. Modern editors wrap visually; renderers (GitHub,
IDE preview, browser) wrap to viewport. The source file doesn't need to
pre-wrap for them.

## Examples

**Bad (hard wrap at ~78 chars):**

```
A containerised kernel-injector for a patched build of the NVIDIA open kernel
module that mitigates the silent host-freeze bug at issue #979 — a Thunderbolt-
attached Blackwell GPU hard-locking the host under CUDA load. The patches add
in-driver crash-safety and a PCIe-error recovery state machine.
```

(Five lines, three sentence boundaries; lines and sentences don't align.)

**Good (one sentence per line):**

```
A containerised kernel-injector for a patched build of the NVIDIA open kernel module that mitigates the silent host-freeze bug at issue #979.
The bug: Thunderbolt-attached Blackwell GPUs hard-lock the host under CUDA load.
The patches add in-driver crash-safety and a PCIe-error recovery state machine.
```

(Three lines, three sentences, perfect alignment. Renderer wraps long lines
in the rendered output; source stays one-sentence-per-line.)

## When to apply

- Writing any markdown prose. (Code blocks exempt.)
- Editing a doc that has hard-wrapped paragraphs — opportunistic conversion
  when you're already touching the section.
- New repo bootstrap — bake this into the editor config (most modern editors
  have a "no hard wrap" or "wrap visually only" option).

Don't convert paragraphs you're not otherwise touching, all at once, in a
single PR. The diff will be unreviewable. Convert opportunistically as
sections get edited.

## Origin

2026-05-24 README style audit — opening prose used 78-char hard wraps, with
mid-sentence wraps breaking visual continuity. The fix made the source
substantially easier to read AND made the rendered output identical (the
renderer wraps regardless of source layout).
