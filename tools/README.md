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

The ledger is emitted as one section per layer rather than one flat table.\
A layer's heading is its directory name, and the layer is stated once there instead of in a column on every row.\
`Status` is emitted only in a table holding an entry that is not `active`.

Five things are refused rather than rendered, because each produces an index that reads as correct and is not.

It also refuses to emit when two entries declare the same `id`, in both modes rather than only under `--check`.\
An id addresses an entry, so a collision means neither is addressable: the ledger renders both rows, a `related:` edge naming the id becomes ambiguous, and `check-entry-body.sh` keys its exemptions on `(category, id)`, so exempting one of the pair silently exempts the other.\
Uniqueness is checked here because this is the only thing that collects the entry set, and a second collector would be a copy free to disagree with it.

It refuses on a dangling catalogue edge for the same reason.\
A `related`, `supersedes` or `related-axioms` naming an entry that does not exist is a citation resolving to nothing, which reads as routing and leads nowhere.\
Nothing else reports these: `skill-graph.mjs` resolves edges between `SKILL.md` bodies and never reads catalogue frontmatter, and the schema validates one file at a time, so a cross-file reference is outside what any single-file contract can see.

It refuses when a layer has no charter, or when a charter's title does not begin with its own directory name.\
The charter is what makes a layer self-describing - its `id` carries the prefix, its `title` the section heading, its trigger the route in - so a heading has two independent derivations and they are gated against each other.

It refuses when an entry's `category` does not match the layer that owns it.\
The value is the entry's own claim about where it lives, and the two can disagree.\
Nothing else can catch this: `check-entry-body.sh` reads the declared category deliberately, so a misfiled entry is held to the wrong body shape rather than reported, and only four of the thirteen categories are body-governed.

It refuses when the root README's layer table and the directories carrying a charter do not name the same layers.\
The generator declares no layer list of its own: the reading order is the charter's table, and the set is every directory whose README declares an id and a category.\
A layer present in one and not the other would have its entries silently uncollected, or a heading with nothing under it, and the ledger would look correct either way.

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

Exit status is non-zero if either direction is broken.\
A `*.test.sh` beside a tool is skipped: it names the tool it exercises rather than a rule, so no rule may claim it.

---

## s6-one-sentence-per-line.test.sh

Holds the S6 enforcer to the rule it enforces.

```sh
tools/s6-one-sentence-per-line.test.sh
```

**Why it exists.**\
S6 owns both halves of its rule, so a fix that corrupts its input makes the gate unsatisfiable rather than merely noisy.\
The tool once joined a run of `**Key:** value` metadata lines into one line, and because no sentence terminator separated them the splitter could not undo it -- then reported the damaged file clean, certifying its own corruption.

**Run it when** you change the sentence splitter, the structural-line predicate, or the fix path.

Exit status is non-zero if any behaviour check fails.

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

## check-board.mjs

Holds the board and the backlog to the contract that binds them.

```sh
node tools/check-board.mjs
```

**Why it exists.**\
`docs/BOARD.md` is the plan and `docs/BACKLOG.md` is the record, and the board states a five-rule contract between them.\
Until this tool every rule was prose.\
Within two commits of the board being written it carried a milestone out of plan order, a finding arguing that a closed row was still open, and an item citing no row at all - and that item was the one whose duty was to mechanise this contract.\
A person found all three by asking.

**On its first run it found a fourth that the manual pass missed**: an item in an open milestone still citing a row that had closed when its requirement landed.\
That is the argument for a script over a careful reader, made by the script.

| Rule | Checks | Catches |
|---|---|---|
| R1 | every board item cites a backlog row | an orphaned plan item |
| R2 | every cited row exists | a citation to nothing |
| R3 | every open row is on the board or under Held | a known problem silently falling off |
| R4 | no closed row is planned in an open milestone | the record and the plan disagreeing |
| R5 | milestones appear in ascending order | an accidental priority nobody chose |
| R6 | a finished milestone cites no row left open and unplanned | a milestone claiming more than it delivered |

**Run it when** you edit either file, which `check-all.sh` does on every change.

It reads both files as written rather than a separate declaration, because the files are the declaration; a second statement of the board's structure would be the drift this exists to prevent.\
A corpus with no board passes, since absence is the bootstrap state and refusing it would block the commit that creates the board.\
Exit status is non-zero on any disagreement.

---

## check-traits.mjs

Holds the `applies-to` vocabulary and the `traits/` layer to naming the same things.

```sh
node tools/check-traits.mjs
```

**Why it exists.**\
An axiom's `applies-to` field is constrained to an enum in the catalogue contract, so a misspelled or undefined tag is refused instead of silently binding nothing.\
That enum is a second list of the traits declared in `traits/`, and two lists of one thing drift.\
Add a trait and forget the enum, and every axiom tagged with it is refused; remove one and the enum keeps admitting a tag nothing defines.

**Run it when** you add, rename or retire a trait.

The floor, `any-system`, is a valid value and deliberately not a trait, so it is the one name allowed in the enum without a trait behind it.\
Exit status is non-zero if either list names something the other does not.

---

## check-charter-shape.sh

Holds every knowledge layer's charter to the sections a member cannot supply for itself.

```sh
tools/check-charter-shape.sh            # report, never blocking
tools/check-charter-shape.sh --strict   # exit non-zero on any gap
```

**Why it exists.**\
A charter is a set's only voice: it states the territory the population covers, what admits a member, what a healthy population looks like against a merely valid one, and where the members are.\
Thirteen charters were written before anything declared that shape, and each invented its own - an admission rule appears in six, a faults list in eight, a body shape in five, and a territory statement in one.\
That divergence is what [`E3`](../entities/E3-set.md) records and this check stops recurring.

**Advisory, deliberately, and with a stated end.**\
Thirty sections are missing across the thirteen predating charters.\
Gating on that today would refuse every unrelated change for a debt the change did not create, so the check reports and exits zero.\
It flips to blocking when the count reaches nought, which is tracked as `B4`.\
An advisory gate with no flip condition is decoration, so the condition is the point rather than a caveat.

**Run it when** you write or edit a charter, or add a layer.

The charter set is derived rather than listed: a charter is the entry whose id is its set's prefix followed by zero, so a layer added tomorrow is covered without editing this tool.\
The required sections are data in [`schemas/entry-body/v1alpha1/entry-body.json`](../schemas/entry-body/v1alpha1/entry-body.json) under `spec.charters`.\
Order is free and every other section is the set's own substance.

---

## check-standing-context.sh

Validates a standing-context document against the contract it declares.

```sh
tools/check-standing-context.sh /path/to/AGENTS.md
tools/check-standing-context.sh --no-network /path/to/AGENTS.md
```

`check-all.sh` runs it twice: once on [`_template-standing-context.md`](../_template-standing-context.md), and once on this repository's own [`AGENTS.md`](../AGENTS.md).\
The second is the point.\
A corpus that defines the contract and holds an instance nothing validates is asserting a rule it does not keep.

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

---

## eval.mjs

Measures whether cold agents read the corpus as intended, before and after a change, and refuses a regression.

```sh
node tools/eval.mjs export  --out DIR [--ref REF]
node tools/eval.mjs prepare --suites a,b --corpus LABEL=PATH --readers 3 --out RUN
node tools/eval.mjs blind   --run RUN
node tools/eval.mjs score   --run RUN
node tools/eval.mjs compare --base RESULT.json[:LABEL] --head RESULT.json[:LABEL]
```

**Why it exists.**\
Every evaluation was run by hand and scored by the author of the change, knowing which version each answer came from, and none had been re-run after a later change.\
This tool makes a run repeatable from the record, hands scoring to a separate agent who sees no version label, and turns old probes into a regression gate.

**It calls no agent.**\
It holds the deterministic half - export, prompts, blinding, scoring arithmetic, comparison - and leaves reading and scoring to whatever agent harness runs the lines it writes, so it depends on no agent runtime.\
Suites and runs live in [`docs/evals/`](../docs/evals/README.md).

**Run it when** a change touches how the corpus is meant to be read - an axiom, an entity, a trait, a charter - and compare against the last baseline.

`eval.test.sh` holds its behaviour: no version label reaches a reader or scorer, an unscored or doubly-scored answer refuses the result, and a regression fails the comparison.\
Each refusal was mutation-tested - removed from the tool to confirm the test goes red.

---

## eval-human.mjs

Measures a communication change on the human it is for, by asking them to pick between two versions of a message.

```sh
node tools/eval-human.mjs run docs/evals/human/<suite>
node tools/eval-human.mjs summary docs/evals/human/runs/<run>
```

**Why it exists.**\
An agent judging an agent's message is one measurement family, and it scored messages as good that the human they were written for found hard to use.\
This tool asks the human directly, in the cheapest form a human can answer: two versions, random order, one key.

**Run it when** a change to how agents communicate with a human needs evidence, and the human can spare a few minutes.

`eval-human.test.sh` holds that each pick is recorded as the version it was, the version with the move is not always shown in one position, and stopping early keeps what was answered.\
Each was mutation-tested.

---

## check-moves.sh

Holds every superseded entry to a live successor, and every live entry away from superseded ids.

```sh
tools/check-moves.sh
```

**Why it exists.**\
Delta-1 moved seven entries to new ids, keeping each old one as a superseded pointer.\
A move is only safe if each pointer reaches a successor that claims it, and no live guidance still cites the old id - otherwise a reader follows a citation to a dead end.

**Run it when** an entry is superseded or moved; the gate runs it on every change.

---

## check-landed.sh

Says whether local work has reached the remote, from git rather than from memory.

```sh
tools/check-landed.sh
```

**Why it exists.**\
A commit the gate refused, followed by a push that pushed nothing, was reported as landed, because the report rested on an echo that ran regardless.\
Run it after every push; it exits non-zero on an uncommitted change, a commit the remote lacks, or a remote ahead.

---

## sets.test.sh

Holds the spanning-set mechanism to its refusals: a set may gather only entries that exist and are active, must gather at least one, and its index is generated from its members, including a block-list form.

```sh
tools/sets.test.sh
```

**Why it exists.**\
A set routes a reader to everything governing one situation; a set gathering a superseded or draft entry would route them to guidance not in force.\
Each refusal was confirmed by an agent other than its author to turn the test red when removed.

---

## check-guidance-placement.sh

Holds `M10` and `S15` to the communication guidance the director tested: every tested line appears, unreworded, in the entry the placement assigns it to.

```sh
tools/check-guidance-placement.sh
```

**Why it exists.**\
The guidance was preferred as written; a later edit that quietly rewords it would carry the evidence's authority without the evidence.

Every result also lists **consistent hedges** - probes where most readers of one corpus marked the answer not settled or guessed - so an ambiguity in the corpus is looked for before the key is blamed.\
It is a prompt to check, not a verdict: readers sometimes hedge a side point and still answer correctly.
