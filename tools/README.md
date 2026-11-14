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
| [`S17`](../style/S17-source-comments-state-duty-and-why.md) | `s17-source-comments.sh` | no, needs judgement |

Every checker takes the same arguments, prints the same finding format, and honours the same exemption markers, which live once in [`lib/style-common.sh`](lib/style-common.sh).\
Rules `S1`, `S2`, `S3`, `S4`, `S5`, `S7`, `S9`, `S11`, `S15` and `S16` need judgement and have no enforcer; review those by reading.

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
tools/check-all.sh --root DIR      # run against repository root DIR
tools/check-all.sh --style-only    # run only the style-rule dispatch stage
```

**Why it exists.**\
Five checkers existed and nothing ran any of them, which is the unread-checker fault the charter names.\
This is the single entry point, so the gate a contributor runs and the gate CI runs are the same script rather than two copies that drift.

**Run it when** you are about to commit, and let CI run it on every push and pull request.

Style is gated on changed files rather than the whole corpus, handing each per-rule checker the changed files of its declared `medium` (`*.md` for `documents` rules `S6`..`S14`, and `tools/*.sh` and `tools/*.mjs` for `code` rule `S17`).\
The corpus carries debt that predates the checker, so blocking on all of it would either stall every change or force one unreviewable sweep.\
Gating the diff blocks new debt and implements S6's instruction to convert opportunistically.\
Changed means committed against the base plus staged, unstaged and untracked, because comparing commits alone makes the gate vacuous locally and omitting untracked paths lets a brand-new file escape until CI.

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

It refuses when a style member (`S1..Sn`) omits `medium` or declares an unknown value, or when a charter or non-style entry declares `medium`.\
In `style/README.md`, the generated `## Index` partitions members into `### Sub-set: <medium>` tables from `medium` frontmatter (`documents`, `messages`, `commits`, `code`), keeping the `Held by` column on every sub-set table.

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

Holds the pairing between a style or conduct rule and the tool that enforces it.

```sh
tools/check-enforcers.sh [--root DIR]
```

**Why it exists.**\
The link between a rule and its mechanism lived only in prose, which is how six rules came to be enforced by one file holding six duties.\
Declaring it in frontmatter makes it checkable in both directions: a rule naming a tool that does not exist (in `enforced-by:` or as a `tools/*.sh` or `tools/*.mjs` script in its body) is a broken promise, a rule body naming a non-test script that disagrees with `enforced-by:` is a forked enforcer, and a per-rule tool (`tools/s[0-9]*-*` or `tools/ru[0-9]*-*`) that no rule claims is orphaned.

**Run it when** you add or rename a style or conduct rule or its enforcer.

Exit status is non-zero if either direction is broken.\
A `*.test.sh` beside a tool is skipped: it names the tool it exercises rather than a rule, so no rule may claim it.

---

## enforcers.test.sh

Holds `check-enforcers.sh` to its frontmatter, body-script, and orphan-tool refusals.

```sh
tools/enforcers.test.sh
```

**Why it exists.**\
`S14` declared `enforced-by: tools/s14-hydration-triggers.sh` in frontmatter while its `## Checking` section still named the retired `tools/check-style.sh --rule S14` (`B132`).\
Checking both frontmatter `enforced-by:` and `tools/*.sh` or `tools/*.mjs` paths in rule bodies only holds if a fixture test fails when either check is removed.

**Run it when** you change `tools/check-enforcers.sh`.

Exit status is non-zero if any of its five fixture cases fails.

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
`axioms/README.md` had always specified a five-section shape and all sixteen axioms had always followed it, which is a convention held by the care of whoever wrote last rather than a rule.

It also holds every charter - each knowledge layer's `<prefix>0` entry at `<directory>/README.md` and every spanning-set charter declaring `category: set` - to the headings `E4` fixes, declared under `spec.charters`: Vision, Territory, Operation, Faults and Index, in any order.\
That pass replaced a separate charter checker, so one tool holds the one contract.

**Run it when** you add an entry in a governed category, or change a declared shape or a charter.

The shape is data in [`schemas/entry-body/v1alpha1/entry-body.json`](../schemas/entry-body/v1alpha1/entry-body.json), so adding a category is an edit to that file rather than to this tool.\
A category absent from it is ungoverned by design.\
Exit status is non-zero if any entry is missing a declared section or carries them out of order.

---

## check-board.mjs

Holds the board and the backlog to the contract that binds them.

```sh
node tools/check-board.mjs            # check
node tools/check-board.mjs --write    # regenerate the board's ledger and held list
node tools/check-board.mjs --root DIR # check another project's board and backlog against the same contract
```

**Why it exists.**\
`docs/BOARD.md` is the plan and `docs/BACKLOG.md` is the record, and the board states a five-rule contract between them.\
Until this tool every rule was prose.\
Within two commits of the board being written it carried a milestone out of plan order, a finding arguing that a closed row was still open, and an item citing no row at all - and that item was the one whose duty was to mechanise this contract.\
A person found all three by asking.\
It also generates the board's triage ledger and held list from the scores and states on the backlog rows, because the instance check of `AR3` found the board's hand copies disagreeing with the record on fifteen rows; it fails when the generated views are out of date, which was mutation-tested.

**On its first run it found a fourth that the manual pass missed**: an item in an open milestone still citing a row that had closed when its requirement landed.\
That is the argument for a script over a careful reader, made by the script.

| Rule | Checks | Catches |
|---|---|---|
| R1 | every board item cites a backlog row | an orphaned plan item |
| R2 | every cited row exists | a citation to nothing |
| R3 | every row carries six columns, scores and evidence, and every open row carries an observable revival trigger | a row the generated views cannot order or revive |
| R4 | no closed row is planned in a live item | the record and the plan disagreeing |
| R5 | milestones appear in ascending order | an accidental priority nobody chose |
| R6 | a finished milestone or item cites no row left open and unplanned | finished work claiming more than it closed |
| R7 | the generated triage ledger and held list match the record | a hand copy or stale view drifting from the record |
| R8 | `Where we are` agrees with the milestone headings | a narrative still pointing at finished work |

**Run it when** you edit either file, which `check-all.sh` does on every change.

It reads both files as written rather than a separate declaration, because the files are the declaration; a second statement of the board's structure would be the drift this exists to prevent.\
A corpus with no board passes, since absence is the bootstrap state and refusing it would block the commit that creates the board.\
Exit status is non-zero on any disagreement.

---

## check-traits.mjs

Holds the `applies-to` vocabulary and the `traits/` layer to naming the same things, and refuses any axiom that combines the floor (`any-system`) with a trait.

```sh
node tools/check-traits.mjs
node tools/check-traits.mjs --root DIR
```

**Why it exists.**\
An axiom's `applies-to` field is constrained to an enum in the catalogue contract, so a misspelled or undefined tag is refused instead of silently binding nothing.\
That enum is a second list of the traits declared in `traits/`, and two lists of one thing drift.\
Add a trait and forget the enum, and every axiom tagged with it is refused; remove one and the enum keeps admitting a tag nothing defines.\
It also enforces `T0`'s floor-exclusivity rule across `axioms/`: an axiom tagged `any-system` already binds every system that has a trait, so combining `any-system` with a trait in `applies-to` is refused (`B118`).

**Run it when** you add, rename or retire a trait, or edit an axiom's `applies-to` list.

The floor, `any-system`, is a valid value and deliberately not a trait, so it is the one name allowed in the enum without a trait behind it.\
Exit status is non-zero if either list names something the other does not, if the floor is absent from the enum, if `traits/` or `axioms/` holds no entries, or if an axiom has empty or unknown `applies-to` tags or combines `any-system` with a trait (`2` on invalid CLI arguments).

---


## check-standing-context.sh

Validates a standing-context document against the contract it declares.

```sh
tools/check-standing-context.sh /path/to/AGENTS.md
tools/check-standing-context.sh --no-network /path/to/AGENTS.md
tools/check-standing-context.sh --addresses-only [--no-network] FILE...
```

`check-all.sh` runs it three times: once on [`_template-standing-context.md`](../_template-standing-context.md), once on this repository's own [`AGENTS.md`](../AGENTS.md), and once with `--addresses-only` across every tracked markdown file (`B27`, `B30`, `M4.4`, `M4.5`).\
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

`eval.test.sh` holds its behaviour: exported trees, `prompts/`, `TASKS.md`, `scorers/` and `sealed/` are read-only, `prepare` refuses a writable corpus and records corpus and prompt digests, `blind` records scorer digests, `score` refuses a corpus, reader prompt or scorer prompt altered afterwards and parses single-line, literal-`\n` and multi-line JSON score objects, no version label reaches a reader or scorer, an unscored or doubly-scored answer refuses the result, and a regression fails the comparison.\
Each refusal was mutation-tested - removed from the tool to confirm the test goes red.

Every result also lists **consistent hedges** - probes where most readers of one corpus marked the answer not settled or guessed - so an ambiguity in the corpus is looked for before the key is blamed.\
It is a prompt to check, not a verdict: readers sometimes hedge a side point and still answer correctly.

---

## check-decisions.mjs

Holds the decision register, `docs/DECISIONS.md`, to the shape `AR4` requires of it.

```sh
node tools/check-decisions.mjs
```

**Why it exists.**\
A ruling is changed only by a later row, so the register is trustworthy only if every row can be addressed, ordered and traced.\
It checks that ids are unique and in order, every row has a kind, authority and status, lineage names earlier rows, a general ruling names entries that exist, and a project decision names none.\
It does not check that an entry states its ruling: that is read, because matching words would report a cheaper reading as absorption.\
Mutation-tested on a duplicated id and a missing affected path.

**Run it when** you add or change a row; the gate runs it on every change.

---

## generate-architecture.mjs

Generates the structural sections of `docs/ARCHITECTURE.md` from the corpus.

```sh
node tools/generate-architecture.mjs [--root DIR]           # regenerate
node tools/generate-architecture.mjs [--root DIR] --check   # fail if stale
```

**Why it exists.**\
`AR1` forbids a hand-authored current projection, and this corpus's was hand-authored and stale.\
For a corpus the running system is the repository, so the layers, each one's duty and population, what each draws on, and what the gate holds are read from the root README, the charters, the directories and `check-all.sh`, rebasing root-relative links into `docs/` (`B126`).\
The reasoning sections stay authored.

**Run it when** a layer, a charter's title or `related`, or the gate changes; the gate runs `--check` on every change.

---

## check-id-reuse.mjs

Holds that an id, once retired, is never issued again, and that every `supersedes` value names a retired id.

```sh
node tools/check-id-reuse.mjs
```

**Why it exists.**\
Frozen records keep citing an id after its entry moves or goes, so a reissued id makes every such citation point at the wrong entry.\
A moved entry leaves no stub in the tree, so the retired ids are derived from git history rather than kept by hand: an id is retired when a file holding it was deleted, or renamed to a file holding a different id, and no file added in the same commit kept it.\
Two reuses predate the check and are named in it as history, not permission.\
A successor's `supersedes` records the ids it replaces; with no stub left, that lineage is what a reader holding an old citation finds by searching for it, so the check holds it to ids history shows retired.\
Mutation-tested: an entry reissuing a retired id fails the gate.

**Run it when** you mint an id; the gate runs it on every change.

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

Holds the spanning-set and style medium sub-set mechanisms to their refusals: a spanning set may gather only entries that exist and are active, must gather at least one, and its index is generated from its members, including a block-list form; and every style member (`S1..Sn`) must declare a valid `medium` while `style/README.md` partitions its index into `### Sub-set: <medium>` tables.

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

---

## entry-body.test.sh

Holds `check-entry-body.sh` to its governed-category and charter refusals, across both `<prefix>0` layer charters and `category: set` spanning-set charters.

```sh
tools/entry-body.test.sh
```

**Why it exists.**\
`check-entry-body.sh` checked only `*/README.md` layer charters, so `ST1` carried `Purpose` and no `Operation` while the gate reported every charter clean (`B104`).\
Each refusal case verifies its fixture landed on disk before trusting a non-zero exit.

---

## methods-view.test.sh

Holds `generate-index.mjs` to generating each procedure entry's reverse view of the work-types that cite it in `methods`.

```sh
tools/methods-view.test.sh
```

**Why it exists.**\
`SC1` promised that the reverse view of a work-type's `methods` is generated, while `generate-index.mjs` generated reverse views only for `domainEligibility`, `applies-to` and `produces` (`B102`).\
Exercises `--check` staleness refusal, generation on a citing work-type, and removal when the citation goes.

---

## decisions.test.sh

Holds `check-decisions.mjs` to `AR4`'s register refusals and live pending-absorption reporting.

```sh
tools/decisions.test.sh
```

**Why it exists.**\
Rulings superseded before absorption stayed marked `pending` in `absorbed` and were reported alongside live unabsorbed rulings.\
Verifies duplicate-id refusal, missing-`affects` refusal, and that superseded rows are excluded from `pending absorption` while live pending rows remain visible.

---

## check-component-edges.mjs

Holds registered components' `## Edges` declarations (`Contains`, `Contained-by`, `Consumes`, `Consumed-by`) to bidirectional peer agreement.

```sh
node tools/check-component-edges.mjs
node tools/check-component-edges.mjs --root DIR
```

**Why it exists.**\
`Consumed-by` lists unregistered consuming applications alongside registered peer components (`0096`), so it cannot be purely generated from peer frontmatter, and two hand-written sides of one relation drift (`B112`).\
Checks that every registered component (`C1..Cn`) declares all four edge lines, links every peer `C<n>` target to an existing component other than itself without contradicting `"nothing"`, and agrees bidirectionally across `Consumes` / `Consumed-by` and `Contains` / `Contained-by`.

**Run it when** you add a component or edit `## Edges`; the gate runs it on every change.

---

## component-edges.test.sh

Holds `check-component-edges.mjs` to its bidirectional, missing-line, dangling-peer, self-edge and unlinked-ID refusals.

```sh
tools/component-edges.test.sh
```

**Why it exists.**\
Exercises both directions of `Consumes` / `Consumed-by` asymmetry, `Contains` / `Contained-by` asymmetry, missing edge declarations, self-edges, unknown component IDs, and unlinked or contradictory declarations in an isolated fixture sandbox.

---

## board.test.sh

Holds `check-board.mjs` to `R1` through `R8`, inline-code cell and revival-trigger extraction, and its generated ledger and held-list views.

```sh
tools/board.test.sh
```

**Why it exists.**\
`check-board.mjs` matched lowercase `trigger` inside inline code (`B76`), matched `TRIGGER FIRED` ahead of an active `TRIGGER:` (`B39`), collapsed an empty trailing trigger column onto `evidence`, and checked `DONE` milestones under `R6` while skipping `DONE` items in open milestones (`B125`).\
Exercises each refusal and generated-view case in an isolated fixture sandbox.

---

## architecture.test.sh

Holds `generate-architecture.mjs` to structural table derivation, root-to-`docs/` relative link rebasing, and `--check` staleness refusal.

```sh
tools/architecture.test.sh
```

**Why it exists.**\
`generate-architecture.mjs` copied root `README.md` blurbs verbatim into `docs/ARCHITECTURE.md`, turning `[AR0](artifacts/README.md)` into a broken link under `docs/` (`B126`), and carried no behaviour test.\
Exercises active-member counting, charter `related` draws, root-relative link rebasing (preserving inline code and external links), missing-region failure, and `--check` staleness refusal.

---

## check-links.mjs

Holds live markdown files across the repository to resolving every relative link and `#fragment` heading anchor on disk.

```sh
node tools/check-links.mjs
node tools/check-links.mjs --root DIR [file ...]
```

**Why it exists.**\
`check-standing-context.sh --addresses-only` checks external `https://` addresses across tracked markdown files (`B30`), and `0134` fixed link rebasing in `generate-architecture.mjs`, while nothing checked internal relative links or `#fragment` anchors - leaving `docs/README.md` pointing at `../backlog/README.md` after the `backlog/` layer was retired into `docs/BACKLOG.md` and `docs/requests/` (`B14`, `B130`, `B137`).\
Checks every relative markdown link and `#fragment` heading anchor (cross-file and same-file) outside fenced code blocks, single- and multi-backtick inline code spans, external URLs, `<placeholder>` tokens, and frozen historical records (`docs/audits/`, `docs/investigations/`, `docs/requests/`, governed by `RU2`, unless passed explicitly as `[file ...]`), refusing any target that does not exist on disk, escapes the repository root, or names a missing `#fragment` heading slug.

**Run it when** you move, rename or retire a file or heading, or edit markdown links; `check-all.sh` runs it on every change.

---

## links.test.sh

Holds `check-links.mjs` to verifying relative markdown links, `#fragment` heading anchors, code and `RU2` exemptions, root-escape refusal, and `--root` argument validation.

```sh
tools/links.test.sh
```

**Why it exists.**\
Exercises valid relative links and `#fragment` anchors, broken relative link refusal, broken `#fragment` anchor refusal (cross-file and same-file), root-escape refusal, fenced and single/double-backtick inline-code exemptions, `RU2` frozen-history exemptions, and missing `--root` argument handling in an isolated fixture sandbox.

---

## traits.test.sh

Holds `check-traits.mjs` to vocabulary parity between `traits/` and the `applies-to` enum, `any-system` floor exclusivity and tag validation across `axioms/`, and `--root` argument validation.

```sh
tools/traits.test.sh
```

**Why it exists.**\
`A15` declared `applies-to: [any-system, autonomous, multi-agent]` against `T0`'s floor rule while `check-traits.mjs` checked only tag vocabulary (`B118`).\
Exercises valid vocabulary and floor-exclusive axioms (including block lists with inline comments and subsequent list keys), unenumerated traits, undefined enum values, missing `any-system` floor in the enum, inline, reversed, block-list, and multi-line flow-array `any-system` + trait combinations, empty or unknown `applies-to` tags, empty `axioms/` directories, and missing, flag-like, or nonexistent `--root` or unknown flag arguments in an isolated fixture sandbox.

---

## s17-source-comments.test.sh

Holds `s17-source-comments.sh` and `check-all.sh --style-only` to line-2 `<name> - <summary>` header validation, non-empty `Sovereign duty:` and `Usage:` declarations, plain ASCII in full-line source comments, commented-out statement refusal, heredoc skipping, `style-check: allow S17` and `GENERATED FILE` exemptions, style-medium dispatch, and CLI argument validation.

```sh
tools/s17-source-comments.test.sh
```

**Why it exists.**\
An `M12` sampling pass across `tools/*.sh` and `tools/*.mjs` under `S0`'s `code` medium (`B67` gap 3) found `3` of `37` scripts failing the line-2 header convention, `1` script carrying `6` non-ASCII comment lines that escaped `S13` (`*.md` only), and `8` of `25` non-test scripts omitting `Sovereign duty:` in their opening comment block.\
Exercises valid `.sh`, `.mjs` and `*.test.sh` headers, markdown-argument fallback and explicit file arguments (including missing-file refusal), malformed line-2 headers (wrong stem, literal dot in stem, whitespace-only summary), missing, empty, or post-header `Sovereign duty:` and `Usage:`, non-ASCII comment refusal and comment-line `style-check: allow S17` / `GENERATED FILE` exemptions, heredoc skipping (`<<'EOF' > file`, `<<-EOF` with tab terminator, comment ending in `<<EOF`, and `<<<` here-strings), all `5` shell and `10` JavaScript commented-out code patterns alongside natural prose comments, `check-all.sh --style-only` medium dispatch (`documents` vs `code`, quoted `medium`, unknown-medium fail-closed, invalid `--since`), and invalid `--root` or unknown flags in an isolated fixture sandbox.
