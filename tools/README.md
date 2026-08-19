# Mission Kit tools

Runnable checks and conversions that operate on this repository.

Each tool owns one duty.\
A style rule is held by exactly one tool named for it, and that tool owns both the check and the fix, so a rule cannot be reported by one implementation and refused by another.\
The rule declares its enforcer in frontmatter and `check-enforcers.sh` verifies the pairing in both directions.

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

## check-structure.sh

Holds the repository's shape to what its documents claim.

```sh
tools/check-structure.sh
```

**Why it exists.**\
A new directory appears in no document until somebody remembers, and nothing notices that it did not.\
`statusline/` and `statusline-pi/` went undocumented in the charter that way while being listed in the ledger, which is the typed-index fault at directory granularity.

**Run it when** you add, rename or remove a top-level directory.

Two invariants: every top-level directory is named in the root README, and every top-level directory carries its own README.\
Exit status is non-zero if either is broken.

---

## check-enforcers.sh

Holds the pairing between a style rule and the tool that enforces it.

```sh
tools/check-enforcers.sh
```

**Why it exists.**\
The link between a rule and its mechanism lived only in prose, which is how six rules came to be enforced by one file holding six duties.\
Declaring it in frontmatter makes it checkable in both directions: a rule naming a tool that does not exist is a broken promise, and a per-rule tool that no rule claims is orphaned.

**Run it when** you add or rename a style rule or its enforcer.

Exit status is non-zero if either direction is broken.

---

## check-tool-docs.sh

Holds this file to the directory it indexes.

```sh
tools/check-tool-docs.sh
```

**Why it exists.**\
This README was once two documents concatenated, and the older half advertised two tools that the same commit had deleted.\
Nothing detected it, because the checkers read entries and directories rather than the tool index itself.\
That is the drifted-specification fault inside the directory whose purpose is preventing drift.

**Run it when** you add, rename or remove anything in `tools/`.

Two invariants: every section in this README names a file that exists, and every executable in `tools/` is named somewhere in this README.\
A per-rule enforcer satisfies the second through the rule table rather than a section of its own.\
Exit status is non-zero if either is broken.

---

## check-entry-body.sh

Holds catalogue entries to the body shape their category declares.

```sh
tools/check-entry-body.sh
```

**Why it exists.**\
The catalogue entry contract governs frontmatter and stops at the closing marker, so nothing governed the body.\
`axioms/README.md` had always specified a five-section shape and all fifteen axioms had always followed it, which is a convention held by the care of whoever wrote last rather than a rule.

**Run it when** you add an entry in a governed category, or change a declared shape.

The shape is data in [`schemas/entry-body/v1alpha1/entry-body.json`](../schemas/entry-body/v1alpha1/entry-body.json), so adding a category is an edit to that file rather than to this tool.\
A category absent from it is ungoverned by design.\
Exit status is non-zero if any entry is missing a declared section or carries them out of order.

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
