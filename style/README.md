---
id: S0
category: style
title: Style - how artifacts are written, and which rules a script can hold
status: active
hydrate-when: You are about to write a document another agent will read or a message a human will read, or you need to know whether a convention can be mechanically enforced
supersedes: []
related: [M0, P0, K0, A4]
---

# Style - the how-you-say-it layer

## Purpose

A **style rule** governs an artifact's form, and is judged by reading the output rather than by watching it being produced.

The set exists because form is part of what knowledge is.\
Under [`A4`](../axioms/A4-zero-loss-knowledge.md) knowledge is an engineering product, so a convention that keeps an artifact diffable, searchable and unambiguous is a functional requirement rather than a preference.\
Without the set, each author settles form afresh, and the same defect is fixed in one document and reintroduced in the next.

---

## Territory

This set covers **the form of every artifact a reader meets**: documents, messages to a human, commit messages, and code - its names and its comments.\
The claim is set by what the set is for, not by what it holds today; a medium with no member is a gap, not a reason to narrow the claim.

| Medium | Grain | What the rule holds | Members |
|---|---|---|---|
| **Document** | token | how a single name, character or identifier is written | [`S5`](S5-no-version-pins-in-prose.md) no version pins in prose, [`S11`](S11-technical-identifiers-use-backticks.md) identifiers in backticks, [`S13`](S13-plain-ascii-in-markdown.md) plain ASCII |
| | line | how prose is broken into lines | [`S6`](S6-one-sentence-per-line.md) one sentence per line |
| | code block | what goes in a block, and how it is introduced and commented | [`S2`](S2-runnable-commands-in-code-blocks.md) runnable steps in blocks, [`S7`](S7-alternative-paths-separate-blocks.md) alternative paths in separate blocks, [`S8`](S8-code-block-comments-not-prose.md) comments say what the line does, [`S12`](S12-code-block-introducer-own-paragraph.md) introducer in its own paragraph |
| | section | how a long document is divided | [`S10`](S10-horizontal-rule-between-h2-sections.md) horizontal rule between top-level sections |
| | document type | what one kind of document must carry or put first | [`S1`](S1-prereqs-explicit-cluster-agnostic.md) workflow prerequisites, [`S4`](S4-four-journey-readme.md) four-journey README, [`S9`](S9-action-first-readme-structure.md) action-first README, [`S14`](S14-hydration-triggers-state-a-condition.md) catalogue hydration triggers |
| | between documents | which content goes in which document | [`S3`](S3-producer-consumer-doc-split.md) producer and consumer docs split |
| **Message to a human** | whole message | what comes first, how much one message carries, how names and choices are put | [`S15`](S15-message-to-a-human.md) a message to a human |
| **Commit message** | whole message | how a commit says what problem it solves | **none - gap** |
| **Code** | names | how a function, type, file or constant is named | **none - gap** |
| | comments | what a comment in source code says and how | **none - gap** |

Every member sits in one row, and three rows hold none.

**Gaps tested.**\
*Commit messages:* no style rule; the always-on standing context carries commit hygiene, which a style rule would hold as form.\
*Code names:* no style rule; a skill, [`K27`](../skills/K27-write-discoverable-code.md), guides naming for plain-text search while code is written, and a style rule would state what the finished name must satisfy.\
*Code comments:* no style rule; `S8` covers comments in code blocks inside documents, not in source files.\
A first rule for any of these would be the second rule for a medium other than documents, which is the point at which the set's medium rules are due to be grouped as sub-sets (see *The unscoped medium* under Faults).

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
| [Schemas](../schemas/README.md) | Is it the shape of a field, which a validator holds, or how the field's content reads? `SC1` holds that `hydrate-when` exists; `S14` holds what it says. |
| [Skills](../skills/README.md) | Is it a capability applied while working, or a property judged in the result? |

---

## Composition

Rules at different grains apply to the same artifact at once and do not override each other; a file is conformant when every rule that reaches it holds.\
Within a grain, members divide one surface rather than compete for it.

- **The code-block rules** each hold one decision: `S2` decides that a step goes in a block, `S7` that alternatives get separate blocks, `S12` how a block is introduced, and `S8` what its comments say.
- **The README rules nest.** `S9` orders the top of a README, and its action-paths slot is where `S4`'s four journeys go.
- **`S15` composes across layers**, not within this one: with [`M10`](../methods/M10-guided-dialogue.md) it forms the explain set, [`ST1`](../sets/ST1-explain.md).

---

## Enforcement boundary

A style rule is worth more when a script holds it, and the layer says openly which ones are held.\
The *Held by* column of the index is generated from each rule's `enforced-by`, so the split is declared once, in the member.

An enforced rule names exactly one tool, and [`tools/check-enforcers.sh`](../tools/check-enforcers.sh) verifies the pairing in both directions: a rule naming a tool that does not exist fails, and so does a per-rule tool no rule claims.\
One rule, one tool, and that tool owns both the check and the fix, so a rule cannot be reported by one implementation and refused by another.

The remaining rules need judgement and are reviewed by reading.\
That is a stated property of the layer, not a backlog: some conventions are about whether a sentence earns its place, and no script settles that.

Style is gated on changed files rather than on the whole corpus.\
The corpus carries debt that predates the checkers, so gating the diff blocks new debt and converts the rest opportunistically as sections are edited.

---

## Axiom alignment

The set serves `A4`: form that keeps knowledge searchable and diffable is part of not losing it.\
It falls short where nine of its fifteen rules are held only by reading, so their hold is as strong as the review that reads for them.\
It falls short further where three media it claims - commit messages, code names, code comments - carry knowledge with no rule for their form.

---

## Faults

- **The forked enforcer.** Two tools holding one rule, disagreeing at the edges. This is why a rule names exactly one.
- **The orphaned rule.** A convention nobody enforces and nobody reviews, which teaches readers that the layer is decorative.
- **The unscoped medium.** Rules for one medium scattered among the document rules with nothing grouping them. One such rule sits in the territory as a row; a second is the point at which a medium earns a sub-set of its own.
- **The work rule in style clothing.** A convention filed here that governs what the work does or records rather than how the artifact reads, where an author applying rules will not look for it.
- **The corpus-wide sweep.** Converting all legacy debt in one commit, producing a diff no one can review and hiding a real change inside it.

---

## Index

<!-- BEGIN GENERATED: entries. Run tools/generate-index.mjs; do not edit by hand. -->
| ID | Title | Held by | Hydrate when |
|---|---|---|---|
| [S0](README.md) | Style - how artifacts are written, and which rules a script can hold |  | You are about to write a document another agent will read or a message a human will read, or you need to know whether a convention can be mechanically enforced |
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
| [S15](S15-message-to-a-human.md) | A message to a human - point first, one step, explained names, clear picks | reading | You are about to write a message a human will read without the context you have |
<!-- END GENERATED -->
