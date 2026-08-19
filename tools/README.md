# Mission Kit tools

Runnable checks and conversions that operate on this repository.

Each entry states what it does, why it exists, and the condition under which you run it.\
Nothing here is loaded as context: read a tool when its trigger fires, then run it.\
All three are dependency-free and run from the repository root.

## check-style.sh

Verifies markdown against the style rules that can be decided by reading the text.

```sh
tools/check-style.sh                      # every *.md in the repo
tools/check-style.sh style/               # a subtree
tools/check-style.sh --rule S6 INDEX.md   # one rule, one file
```

**Why it exists.** The style entries published their checkers as prose one-liners, so nothing ran them and the corpus drifted out of compliance with the rules it publishes.\
Every check here runs the checker its own entry publishes rather than reimplementing it, so the entry and the tool cannot diverge.

**Run it when** you have edited any markdown in this repository, or before opening a pull request that touches documentation.

Implements [`S6`](../style/S6-one-sentence-per-line.md), [`S8`](../style/S8-code-block-comments-not-prose.md), [`S10`](../style/S10-horizontal-rule-between-h2-sections.md), [`S12`](../style/S12-code-block-introducer-own-paragraph.md) and [`S13`](../style/S13-plain-ascii-in-markdown.md).\
`S1`, `S3`, `S4`, `S5`, `S7`, `S9` and `S11` need judgement and are deliberately absent, because a heuristic there would emit false failures and train readers to ignore the tool.\
Review those by reading.

A file opts out of one rule with a marker on its own line, which keeps the exemption explicit and greppable:
```
<!-- style-check: allow S13 (character is the subject) -->
```

Exit status is non-zero when any check fails.

## reflow-sentences.mjs

Rewrites markdown prose to one sentence per line.

```sh
node tools/reflow-sentences.mjs --dry style/S5-no-version-pins-in-prose.md
node tools/reflow-sentences.mjs style/S5-no-version-pins-in-prose.md
```

**Why it exists.** [`S6`](../style/S6-one-sentence-per-line.md) asks for conversion to be opportunistic rather than bulk, and that only works if converting a section is cheap enough to do while you are already editing it.\
This does the mechanical part: unwrap mid-sentence hard wraps, put each sentence on its own line, and add a trailing backslash between adjacent sentences in a paragraph so they render on separate lines.

**Run it when** you are editing a section that is still hard-wrapped, immediately before your own edits.\
Do not run it across files you are not otherwise touching; `S6` says the diff becomes unreviewable.

Prose only.\
Frontmatter, fenced blocks, tables, headings, list items and blockquotes are copied through untouched, because a multi-sentence bullet is the form `S6` endorses.\
Sentence splitting declines on abbreviations, initials and ellipses, since a wrong split costs more than a missed one.\
Use `--dry` first, and check the result with `check-style.sh`.

## skill-graph.mjs

Lints the `SKILL.md` catalogue as a directed acyclic graph and derives each skill's level.

```sh
node tools/skill-graph.mjs
```

**Why it exists.** The catalogue is a hierarchy expressed as edges, not as numbered names.\
This makes those edges load-bearing: every `prerequisite` and `composes` target must resolve, the graph must be acyclic, level is derived rather than stored in a name, and every bundle's `skills` entry must resolve.

**Run it when** you add or retire a skill, or change a `prerequisite` or `composes` edge.

Exit status is non-zero on any broken edge or cycle.
