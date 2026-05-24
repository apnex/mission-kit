---
id: S12
category: style
title: Code-block introducer is its own paragraph
added: 2026-05-24
status: active
supersedes: []
related: [S2, S6, S8]
---

# S12 — Code-block introducer is its own paragraph

## Rule

When a sentence **introduces** a code block (typically ending with `:`
and immediately followed by a fenced code block), separate it from any
**preceding prose** with a blank line. The introducer becomes its own
one-sentence paragraph, visually paired with the code block it
introduces.

Resulting source pattern:

````markdown
Description sentence.\
Description sentence.\
Description sentence.

Introducer sentence:

```bash
command
```
````

The blank line between the description prose and the introducer is the
visual cue: everything above is context; the sentence immediately above
the code block is the "do this" bridge.

## Doesn't apply when

- **No preceding prose.** The introducer is the first thing in a
  section (right after a heading) or follows another structural element
  with its own visual break. No separation needed.
- **No introducer.** The code block stands alone or is preceded only by
  the heading. (Common for "Quick start" patterns where the code block
  is self-explanatory.)
- **Code-block-then-prose** (reverse order). This rule is about prose
  leading INTO a code block, not the prose following one.

## Rationale

**Visual scanning.** Readers scrolling through a long troubleshooting
section or workflow are looking for "what do I type" markers. The code
block is the unmissable visual anchor; the sentence directly above it
is the action description. Without a blank line, that sentence is
buried in the description paragraph above — the reader has to mentally
extract it.

**Paragraph semantics match prose role.** Description sentences
(explaining the problem, the context, the constraints) play one role;
the introducer plays another (announcing the action). Different roles
deserve different paragraphs.

**Cheap fix.** A blank line. No new syntax, no markup gymnastics. The
rendered result reads exactly the way the writer's intent maps to the
reader's scan path.

## Examples

**Bad (description and introducer in one paragraph):**

````markdown
The container exits at the BAR1-verify step with `BAR1 too small`.\
The kernel cmdline is missing the required boot params.\
BAR1 sizing happens once at boot and cannot be changed at runtime.\
Re-run `Layer 1` host bring-up, then reboot:

```bash
sudo ./scripts/apply.sh
```
````

(The "Re-run..." action-introducer is buried in the four-line
description paragraph. Reader has to read all four lines to find the
fix.)

**Good (introducer is its own paragraph, paired with the block):**

````markdown
The container exits at the BAR1-verify step with `BAR1 too small`.\
The kernel cmdline is missing the required boot params.\
BAR1 sizing happens once at boot and cannot be changed at runtime.

Re-run `Layer 1` host bring-up, then reboot:

```bash
sudo ./scripts/apply.sh
```
````

(Description = problem context. Blank line. Introducer = action.
Block = the action. Reader's eye jumps straight from the code block
back to the action sentence right above it.)

## When to apply

- Authoring any new prose-and-code mixed content.
- Reviewing a PR diff — scan for code blocks whose introducer is
  jammed into a multi-sentence description paragraph above.
- Doc-pass cleanups — opportunistic when editing existing content.

## Origin

2026-05-24 README audit — the §Troubleshooting BAR1 entry packed three
description sentences plus the action introducer into one paragraph,
all running together with hard-break backslashes. Operator scanning the
section had no visual cue for "this last sentence is the fix." Adding
a single blank line fixed it; promoting the pattern to a rule prevents
the regression elsewhere.
