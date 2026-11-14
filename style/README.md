---
id: S0
category: style
title: Style - how artifacts are written, and which rules a script can hold
status: active
hydrate-when: You are about to write a document another agent will read or a message a human will read, or you need to know whether a convention can be mechanically enforced
supersedes: []
related: [M0, P0, K0, A4, E3, E4, SC1]
---

# Style - the how-you-say-it layer

## Vision

**North star.**\
Every artifact a reader meets - documents, messages to a human, commit messages and code - has its form held by rules, so no author fixes the same defect of form twice.\
*Form* is how the finished artifact reads, as distinct from what the work that produced it had to do or record.

**What this set is, and is not.**\
It is the rules for the form of every medium a reader meets, each judged by reading the finished artifact, and they stay the delivery mechanism and never the payload.\
It is not guidance on what work must do or record, which belongs in [rules](../rules/README.md), nor guidance whose following the output could not show, which belongs in [practices](../practices/README.md).

**Succeeding.**\
The set is measured on four dimensions, never collapsed into one score:

- **Non-overlap** - each rule states one property of the finished artifact, and none restates another.
- **Mechanical hold** - every rule a predicate can express is held by exactly one tool, and every other rule is named as held by reading.
- **Coverage** - every medium the scope claims has rules for its form.
- **Earned** - every rule answers a real defect in a real artifact, never a preference.

**Authority.**\
The director holds this vision and ratifies any change to it, under [`M11`](../methods/M11-change-a-charter.md).

**What this vision does not authorise.**\
Citing this vision admits no rule and licenses no change of direction; a rule is admitted only by the tests under *What earns an entry*.

A **style rule** governs an artifact's form, and is judged by reading the output rather than by watching it being produced.

The set exists because form is part of what knowledge is.\
Under [`A4`](../axioms/A4-zero-loss-knowledge.md) knowledge is an engineering product, so a convention that keeps an artifact diffable, searchable and unambiguous is a functional requirement rather than a preference.\
Without the set, each author settles form afresh, and the same defect is fixed in one document and reintroduced in the next.

---

## Territory

**Scope.**\
This set covers **the form of every artifact a reader meets**: documents, messages to a human, commit messages, and code - its names and its comments.\
The claim is set by what the set is for, not by what it holds today.

**Growth policy.**\
Uncapped.\
A member is one convention about the form of one medium at one grain, judged in the finished artifact, earned by a real defect, and holding across artifacts.\
Members are balanced on non-overlap: one rule holds one decision on one surface, and an enforced rule names exactly one tool.\
Rules for media other than documents are grouped into sub-sets by medium once there is a second such rule, in any medium other than documents.

---

## Sub-sets

This set partitions its members into four medium sub-sets ([`E3`](../entities/E3-set.md), [`E4`](../entities/E4-charter.md)), declared once per member in the `medium` frontmatter field ([`SC1`](../schemas/SC1-catalog-entry.md)) and grouped by medium in the generated *Index* below:

| Sub-set | `medium` value | What it is for |
|---|---|---|
| **Documents** | `documents` | The form of durable markdown documents, runbooks, READMEs, and catalogue entries |
| **Messages** | `messages` | The form of agent-to-human messages where the reader has limited time and context |
| **Commits** | `commits` | The form of version-control commit messages |
| **Code** | `code` | The form of executable scripts and source files - their names and their comments |

---

## Operation

This set is analysed by [`M12`](../methods/M12-investigate-a-set.md) and its membership changed by [`M13`](../methods/M13-change-a-set.md); this charter is changed by [`M11`](../methods/M11-change-a-charter.md).\
Its members are balanced on non-overlap, so an analysis looks for two rules holding one decision on one surface, and for a rule a predicate could express that names no tool.\
To stress the territory against *Scope* rather than only against existing document rules, an analysis crosses the four claimed media (documents, messages to a human, commit messages, and code names and comments) against artifact grains (whole-artifact structure, section layout, sentence and block form, and inline identifiers or citations), samples real artifacts in each cell for recurring reader or diff failures, checks whether a second rule in any non-document medium triggers a medium sub-set under *Growth policy*, and tests every rule held by reading for a deterministic predicate over text that a script in `tools/` could hold.\
A rule a script can hold names exactly one tool, and the pairing is verified as stated under *Enforcement boundary*.\
A candidate that governs what the work does or records is routed to [rules](../rules/README.md), and one whose following the finished artifact could not show is routed to [practices](../practices/README.md).

---

## What earns an entry

All three must hold.

1. **It governs form.** Placement is stated once, in [`M0`](../methods/README.md): axiom, procedure, style, rule, practice, asked in that order. A style rule is what reaches the third question - it produces nothing of its own, and it governs how the artifact reads whatever work produced it.
2. **Its absence produced a real defect** in a real artifact, and a reader can be shown the difference. Aesthetic preference does not qualify.
3. **It holds across artifacts**, not inside one document.

Prefer a rule a script can hold.\
If the rule can be stated as a predicate over the text, state it that way and write the tool, because a prose convention degrades to a matter of taste the first time two authors disagree.

---

## Neighbours

| Neighbour | The question that separates them |
|---|---|
| [Rules](../rules/README.md) | Does it govern the artifact's form, or what the work must do or record? A revival trigger on a deferred item is a rule, though it is visible in text. |
| [Practices](../practices/README.md) | Could the finished artifact show it was followed? If nothing in the output could, it is a practice. |
| [Methods](../methods/README.md) | Does it produce a result of its own? A method does; a style rule only shapes one. |
| [Schemas](../schemas/README.md) | Is it the shape of a field, which a validator holds, or how the field's content reads? `SC1` holds that `hydrate-when` exists; a style rule holds what it says. |
| [Skills](../skills/README.md) | Is it a capability applied while working, or a property judged in the result? |

---

## Composition

Rules at different grains apply to the same artifact at once and do not override each other; a file is conformant when every rule that reaches it holds.\
Within a grain, members divide one surface rather than compete for it.

- **A surface is divided by decision.** Where several rules reach one surface, each holds one decision about it, and none restates another's.
- **A concern spanning grains is split between them.** The coarser rule decides what the artifact must carry, and the finer rule decides how it is rendered.
- **Rules for one document type nest.** One rule may order a document and define a slot that another rule fills.
- **A rule may compose across layers**, as a member of a set spanning layers whose charter in [`sets/`](../sets/README.md) declares it.

---

## Enforcement boundary

A style rule is worth more when a script holds it, and the layer says openly which ones are held.\
The *Held by* column of the index is generated from each rule's `enforced-by`, so the split is declared once, in the member.

An enforced rule names exactly one tool, and [`tools/check-enforcers.sh`](../tools/check-enforcers.sh) verifies the pairing in both directions: a rule naming a tool that does not exist fails, and so does a per-rule tool no rule claims.\
One rule, one tool, and that tool owns both the check and the fix, so a rule cannot be reported by one implementation and refused by another.

The remaining rules need judgement and are reviewed by reading.\
That is a stated property of the layer, not a backlog: some conventions are about whether a sentence earns its place, and no script settles that.

Style is gated on changed files rather than on the whole corpus.\
The corpus carries debt that predates the checkers, so gating the diff blocks new debt and converts the rest opportunistically as sections are edited.\
Converting all legacy debt in one corpus-wide sweep is avoided for the same reason: it produces a diff no one can review and hides real changes inside it.

---

## Axiom alignment

The set serves `A4`: form that keeps knowledge searchable and diffable is part of not losing it.\
It falls short wherever a rule is held only by reading, because that rule's hold is as strong as the review that reads for it.\
It falls short further wherever a medium it claims carries knowledge with no rule for its form.

---

## Faults

- **The forked enforcer.** Two tools holding one rule, disagreeing at the edges. This is why a rule names exactly one.
- **The orphaned rule.** A convention nobody enforces and nobody reviews, which teaches readers that the layer is decorative.
- **The unscoped medium.** Rules for one medium scattered among the document rules with nothing grouping them. A second rule for a medium other than documents, in any such medium, is the point at which the medium rules earn sub-sets of their own.
- **The work rule in style clothing.** A convention filed here that governs what the work does or records rather than how the artifact reads, where an author applying rules will not look for it.

---

## Index

<!-- BEGIN GENERATED: entries. Run tools/generate-index.mjs; do not edit by hand. -->
| ID | Title | Held by | Hydrate when |
|---|---|---|---|
| [S0](README.md) | Style - how artifacts are written, and which rules a script can hold |  | You are about to write a document another agent will read or a message a human will read, or you need to know whether a convention can be mechanically enforced |

### Sub-set: documents

| ID | Title | Held by | Hydrate when |
|---|---|---|---|
| [S1](S1-prereqs-explicit-cluster-agnostic.md) | Prerequisites explicit + cluster-agnostic + assumes authenticated tooling | reading | You are authoring a workflow document that drives shared infrastructure |
| [S2](S2-runnable-commands-in-code-blocks.md) | Runnable workflow steps belong in code blocks | reading | You are writing a document that asks the reader to execute a step |
| [S3](S3-producer-consumer-doc-split.md) | Producer / consumer doc split | reading | You are documenting a component that another repository consumes |
| [S4](S4-four-journey-readme.md) | Four-journey README | reading | You are writing or restructuring the top-level README of an operator-facing project |
| [S5](S5-no-version-pins-in-prose.md) | No version pins in user-facing prose | reading | You are about to name a version, date or other point-in-time identifier in prose |
| [S6](S6-one-sentence-per-line.md) | One sentence per line (semantic line breaks) | `tools/s6-one-sentence-per-line.mjs` | You are about to write or edit markdown prose that someone else will read |
| [S7](S7-alternative-paths-separate-blocks.md) | Alternative paths in separate code blocks under subsections | reading | You are documenting two or more alternative paths the reader must choose between |
| [S8](S8-code-block-comments-not-prose.md) | Code-block comments are for what-the-line-does, not prose substitutes | `tools/s8-code-block-comments.sh` | You are about to put explanatory text inside a code block |
| [S9](S9-action-first-readme-structure.md) | Action-first README structure | reading | You are deciding what a reader meets first at the top of a README |
| [S10](S10-horizontal-rule-between-h2-sections.md) | Horizontal rule between top-level sections in long-form docs | `tools/s10-section-rules.sh` | You are writing a document you expect to grow past five top-level sections |
| [S11](S11-technical-identifiers-use-backticks.md) | Technical identifiers in prose use backticks | reading | You are about to mention a command, path, flag or other literal name in prose |
| [S12](S12-code-block-introducer-own-paragraph.md) | Code-block introducer is its own paragraph | `tools/s12-code-block-introducer.sh` | You are about to introduce a code block with a sentence |
| [S13](S13-plain-ascii-in-markdown.md) | Plain ASCII in markdown - typeable characters only | `tools/s13-plain-ascii.sh` | You are about to type a character you could not produce on a standard keyboard |
| [S14](S14-hydration-triggers-state-a-condition.md) | Hydration triggers state a condition, not a topic | `tools/s14-hydration-triggers.sh` | You are adding a catalogue entry, or reviewing one that has never routed anyone |
| [S16](S16-path-a-path-b-workflow-paths.md) | Path A / Path B - one complete path per execution environment in a workflow document | reading | You are authoring a workflow document that supports more than one execution path |

### Sub-set: messages

| ID | Title | Held by | Hydrate when |
|---|---|---|---|
| [S15](S15-message-to-a-human.md) | A message to a human - point first, one step, explained names, clear picks | reading | You are about to write a message a human will read without the context you have |

### Sub-set: code

| ID | Title | Held by | Hydrate when |
|---|---|---|---|
| [S17](S17-source-comments-state-duty-and-why.md) | Source comments state the file's duty and why non-obvious code is written that way | `tools/s17-source-comments.sh` | You are writing or editing an executable script or source file, or deciding what to put in its opening or inline comments |
<!-- END GENERATED -->
