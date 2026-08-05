---
id: S6
category: style
title: One sentence per line (semantic line breaks)
added: 2026-05-24
status: active
supersedes: []
related: [S2, S5, S7, S8, S9, S12]
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

## Making the break visible

Sentence-per-line is a **source** convention.\
It does not, on its own, put sentences on their own rendered lines.

Markdown joins the lines of a paragraph with a space, so sentence-per-line source renders as one continuous block — which is the intent where the sentences genuinely form one paragraph, and the wrong result where they don't.

Pick the break from what the sentences are to each other:

- **One flowing paragraph** — bare newline. The break serves diffs and tooling, and is meant to be invisible.
- **Coupled, each needing its own rendered line** — trailing `\`. A status line and its qualifier; a claim and its bound.
- **Separate thoughts** — blank line. They are separate paragraphs, so let them render as separate paragraphs.
- **A list wearing prose** — a real markdown list. Three or more sentences elaborating one subject is usually this case, not the hard-break case.

The trailing `\` is a CommonMark hard break and renders on GitHub.\
Prefer it to two trailing spaces, which are invisible in source and get silently stripped by editors and formatters.

Getting this wrong is not a cosmetic miss.\
A pitch followed by an inventory, collapsed into a single rendered block, is the wall of text [[S4]] and [[S9]] exist to prevent — reintroduced by a rule meant to improve readability.

This section is written the way it prescribes: the paired sentences above carry a trailing `\`, the shifts of subject are blank-line separated, and the four cases are a list rather than a run of prose.

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
in the rendered output; source stays one-sentence-per-line. All three render
as one paragraph, which is correct here — they are one thought.)

**Bad (breaks that were meant to show, but don't):**

```
Self-assembling, internal-only k3s VM on GCE.
Stands up a custom VPC with IAP-SSH ingress, a least-privilege VM with OS Login, secrets fetched into an env file on boot, and optional self-assembly on first boot.
```

(Two source lines, one rendered block. The pitch and the inventory run
together, and the inventory is a four-item list wearing prose.)

**Good (the break made visible):**

```
Self-assembling, internal-only k3s VM on GCE.

Stands up:

- custom VPC with IAP-SSH ingress
- least-privilege VM with OS Login
- secrets fetched into an env file on boot
- self-assembly on first boot (optional)
```

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

2026-08-05 — a Terraform module README applied the rule to an elevator pitch
followed by a five-clause capability inventory, and both collapsed into one
rendered block on GitHub. The 2026-05-24 note above holds only where the
sentences belong in one paragraph; where they don't, the break has to be made
visible. [[S12]] had already been using the trailing `\` for exactly this,
without naming it as a rule — hence the "Making the break visible" section.
