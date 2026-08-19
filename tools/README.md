# Mission Kit tools

Runnable checks and conversions that operate on this repository.

Each tool owns one duty.\
A style rule is held by exactly one tool named for it, and that tool owns both the check and the fix, so a rule cannot be reported by one implementation and refused by another.\
The rule declares its enforcer in frontmatter and `check-structure.sh` verifies the pairing in both directions.

| Rule | Enforcer | Fix |
| --- | --- | --- |
| [`S6`](../style/S6-one-sentence-per-line.md) | `s6-one-sentence-per-line.mjs` | yes |
| [`S8`](../style/S8-code-block-comments-not-prose.md) | `s8-code-block-comments.sh` | no, needs judgement |
| [`S10`](../style/S10-horizontal-rule-between-h2-sections.md) | `s10-section-rules.sh` | yes |
| [`S12`](../style/S12-code-block-introducer-own-paragraph.md) | `s12-code-block-introducer.sh` | yes |
| [`S13`](../style/S13-plain-ascii-in-markdown.md) | `s13-plain-ascii.sh` | yes |
| [`S14`](../style/S14-hydration-triggers-state-a-condition.md) | `s14-hydration-triggers.sh` | no, needs judgement |

Every checker takes the same arguments, prints the same finding format, and honours the same exemption markers, which live once in [`lib/style-common.sh`](lib/style-common.sh).\
Rules `S1`, `S3`, `S4`, `S5`, `S7`, `S9` and `S11` need judgement and have no enforcer; review those by reading.

A file opts out of one rule with a marker on its own line, so the exemption is explicit:
```
<!-- style-check: allow S13 (character is the subject) -->
```

A generated artifact is exempt automatically.\
If its first lines declare `GENERATED FILE`, the defect belongs to the source its compiler reads.

---

## format-markdown.sh

Applies every rule that has a fix.

```sh
tools/format-markdown.sh FILE...
```

An alias, not an implementation: it runs each sovereign tool in `--fix` mode.\
Running it twice leaves the second run with nothing to do.

---

## check-all.sh

Runs every gate this repository holds itself to.

```sh
tools/check-all.sh                 # style over files changed against origin/main
tools/check-all.sh --all           # style over the whole corpus
tools/check-all.sh --since REF     # style over files changed against REF
```

**Why it exists.**\
Five checkers existed and nothing ran any of them, which is the unread-checker fault the charter names.\
This is the single entry point, so the gate a contributor runs and the gate CI runs are the same script rather than two copies that drift.

**Run it when** you are about to commit, and let CI run it on every push and pull request.

Style is gated on changed files rather than the whole corpus.\
The corpus carries debt that predates the checker, so blocking on all of it would either stall every change or force one unreviewable sweep.\
Gating the diff blocks new debt and implements S6's instruction to convert opportunistically.\
Changed means committed against the base plus staged plus unstaged, because comparing commits alone makes the gate vacuous locally.

Exit status is non-zero if any gate fails, and every gate runs even after an earlier one fails, so one run reports everything.

---

# Mission Kit tools

Runnable checks and conversions that operate on this repository.

Each entry states what it does, why it exists, and the condition under which you run it.\
Nothing here is loaded as context: read a tool when its trigger fires, then run it.\
All three are dependency-free and run from the repository root.

---

## check-style.sh

Verifies markdown against the style rules that can be decided by reading the text.

```sh
tools/check-style.sh                      # every *.md in the repo
tools/check-style.sh style/               # a subtree
tools/check-style.sh --rule S6 INDEX.md   # one rule, one file
```

**Why it exists.**\
The style entries published their checkers as prose one-liners, so nothing ran them and the corpus drifted out of compliance with the rules it publishes.\
Every check here runs the checker its own entry publishes rather than reimplementing it, so the entry and the tool cannot diverge.

**Run it when** you have edited any markdown in this repository, or before opening a pull request that touches documentation.

Implements [`S6`](../style/S6-one-sentence-per-line.md), [`S8`](../style/S8-code-block-comments-not-prose.md), [`S10`](../style/S10-horizontal-rule-between-h2-sections.md), [`S12`](../style/S12-code-block-introducer-own-paragraph.md), [`S13`](../style/S13-plain-ascii-in-markdown.md) and [`S14`](../style/S14-hydration-triggers-state-a-condition.md).\
`S1`, `S3`, `S4`, `S5`, `S7`, `S9` and `S11` need judgement and are deliberately absent, because a heuristic there would emit false failures and train readers to ignore the tool.\
Review those by reading.

A file opts out of one rule with a marker on its own line, which keeps the exemption explicit and greppable:
```
<!-- style-check: allow S13 (character is the subject) -->
```

A generated artifact is exempt automatically.\
If the first lines declare `GENERATED FILE`, the defect belongs to the source the compiler reads, and any fix here is discarded on the next build.

Exit status is non-zero when any check fails.

---

## generate-index.mjs

Derives `INDEX.md` and the category tables from entry frontmatter.

```sh
node tools/generate-index.mjs
node tools/generate-index.mjs --check
```

**Why it exists.**\
An index maintained by hand omits whatever nobody remembered to add, and nothing detects the omission.\
Three entries went missing that way before this existed.\
Deriving every table from the entries makes that class impossible rather than merely fixed, and `--check` is the half that makes it a mechanism: generation alone is a convention.

**Run it when** you add, retire or rename an entry, and in any gate that guards this repository.

Generated regions are delimited by markers, so hand-written prose in the same file survives untouched.\
A file carrying no markers is left alone, which is how `roles/`, `domains/` and `work-types/` opt out of a local table.\
Exit status is non-zero in `--check` mode when a region is stale.

---

## reflow-sentences.mjs

Rewrites markdown prose to one sentence per line.

```sh
node tools/reflow-sentences.mjs --dry style/S5-no-version-pins-in-prose.md
node tools/reflow-sentences.mjs style/S5-no-version-pins-in-prose.md
```

**Why it exists.**\
[`S6`](../style/S6-one-sentence-per-line.md) asks for conversion to be opportunistic rather than bulk, and that only works if converting a section is cheap enough to do while you are already editing it.\
This does the mechanical part: unwrap mid-sentence hard wraps, put each sentence on its own line, and add a trailing backslash between adjacent sentences in a paragraph so they render on separate lines.

**Run it when** you are editing a section that is still hard-wrapped, immediately before your own edits.\
Do not run it across files you are not otherwise touching; `S6` says the diff becomes unreviewable.

Prose only.\
Frontmatter, fenced blocks, tables, headings, list items and blockquotes are copied through untouched, because a multi-sentence bullet is the form `S6` endorses.\
Sentence splitting declines on abbreviations, initials and ellipses, since a wrong split costs more than a missed one.\
Use `--dry` first, and check the result with `check-style.sh`.

---

## check-standing-context.sh

Validates a standing-context document against the contract it declares.

```sh
tools/check-standing-context.sh /path/to/AGENTS.md
tools/check-standing-context.sh --no-network /path/to/AGENTS.md
```

**Why it exists.**\
A standing-context document is the single always-on file an agent loads at session start, which makes it the one artifact nothing reviews.\
The document declares its own rules in frontmatter, so this tool holds no knowledge of any workspace, path or host and can be carried anywhere the knowledge base goes.

**Run it when** you have edited a standing-context document, or when you want to confirm one you did not write still satisfies its contract.

Checks the frontmatter, the presence of every required section, plain ASCII, that no term under `forbids` appears in the body, that every address resolves, and that the file is within `max-bytes`.\
Start a new document from [`_template-standing-context.md`](../_template-standing-context.md); the contract is [`schemas/standing-context/v1alpha1`](../schemas/standing-context/v1alpha1/standing-context.schema.json).

Exit status is non-zero when any check fails.

---

## skill-graph.mjs

Lints the `SKILL.md` catalogue as a directed acyclic graph and derives each skill's level.

```sh
node tools/skill-graph.mjs
```

**Why it exists.**\
The catalogue is a hierarchy expressed as edges, not as numbered names.\
This makes those edges load-bearing: every `prerequisite` and `composes` target must resolve, the graph must be acyclic, level is derived rather than stored in a name, and every bundle's `skills` entry must resolve.

**Run it when** you add or retire a skill, or change a `prerequisite` or `composes` edge.

Exit status is non-zero on any broken edge or cycle.
