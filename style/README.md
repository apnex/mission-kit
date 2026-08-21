---
id: S0
category: style
title: Style - how artifacts are written, and which rules a script can hold
status: active
hydrate-when: You are about to write or edit a document another agent will read, or you need to know whether a convention can be mechanically enforced
supersedes: []
related: [M0, P0, K0, A4]
---

# Style - the how-you-say-it layer

Doc, commit, and naming conventions.\
Rules about the artifact itself, judged by reading the output rather than by watching it being produced.

Style is where [`A4`](../axioms/A4-zero-loss-knowledge.md) becomes operational.\
If knowledge is an engineering product, its form is part of the product, and a convention that keeps a document diffable, searchable and unambiguous is a functional requirement rather than a preference.

---

## Enforced and unenforced rules

A style rule is worth more when a script holds it, and the layer says openly which ones are held.

An enforced rule declares `enforced-by` in its frontmatter naming exactly one tool, and [`tools/check-enforcers.sh`](../tools/check-enforcers.sh) verifies the pairing in both directions: a rule naming a tool that does not exist is a broken promise, and a tool no rule claims is orphaned.\
One rule, one tool, and that tool owns both the check and the fix, so a rule cannot be reported by one implementation and refused by another.

The remaining rules need judgement and are reviewed by reading.\
That is a stated property of the layer, not a backlog: some conventions are about whether a sentence earns its place, and no script settles that.

Style is gated on changed files rather than on the whole corpus.\
The corpus carries debt that predates the checkers, so gating the diff blocks new debt and converts the rest opportunistically as sections are edited.

---

## What earns an entry

A convention earns one when its absence has produced a real defect in a real artifact, and a reader can be shown the difference.\
Aesthetic preference does not qualify, and neither does a rule that only holds inside one document.

Prefer a rule a script can hold.\
If the rule can be stated as a predicate over the text, state it that way and write the tool, because a prose convention degrades to a matter of taste the first time two authors disagree.

---

## Faults

- **The unfalsifiable convention.** A rule phrased as a quality ("be clear", "be concise") with no predicate. It cannot be checked, so it is cited only when someone already disagrees.
- **The orphaned rule.** A convention nobody enforces and nobody reviews, which teaches readers that the layer is decorative.
- **The forked enforcer.** Two tools holding one rule, disagreeing at the edges. This is why a rule names exactly one.
- **The corpus-wide sweep.** Converting all legacy debt in one commit, producing a diff no one can review and hiding a real change inside it.

---

## Index

<!-- BEGIN GENERATED: entries. Run tools/generate-index.mjs; do not edit by hand. -->
| ID | Title | Hydrate when |
|---|---|---|
| [S0](README.md) | Style - how artifacts are written, and which rules a script can hold | You are about to write or edit a document another agent will read, or you need to know whether a convention can be mechanically enforced |
| [S1](S1-prereqs-explicit-cluster-agnostic.md) | Prerequisites explicit + cluster-agnostic + assumes authenticated tooling | You are authoring a workflow document that drives shared infrastructure |
| [S2](S2-runnable-commands-in-code-blocks.md) | Runnable workflow steps belong in code blocks | You are writing a document that asks the reader to execute a step |
| [S3](S3-producer-consumer-doc-split.md) | Producer / consumer doc split | You are documenting a component that another repository consumes |
| [S4](S4-four-journey-readme.md) | Four-journey README | You are writing or restructuring the top-level README of an operator-facing project |
| [S5](S5-no-version-pins-in-prose.md) | No version pins in user-facing prose | You are about to name a version, date or other point-in-time identifier in prose |
| [S6](S6-one-sentence-per-line.md) | One sentence per line (semantic line breaks) | You are about to write or edit markdown prose that someone else will read |
| [S7](S7-alternative-paths-separate-blocks.md) | Alternative paths in separate code blocks under subsections | You are documenting two or more alternative paths the reader must choose between |
| [S8](S8-code-block-comments-not-prose.md) | Code-block comments are for what-the-line-does, not prose substitutes | You are about to put explanatory text inside a code block |
| [S9](S9-action-first-readme-structure.md) | Action-first README structure | You are deciding what a reader meets first at the top of a README |
| [S10](S10-horizontal-rule-between-h2-sections.md) | Horizontal rule between top-level sections in long-form docs | You are writing a document you expect to grow past five top-level sections |
| [S11](S11-technical-identifiers-use-backticks.md) | Technical identifiers in prose use backticks | You are about to mention a command, path, flag or other literal name in prose |
| [S12](S12-code-block-introducer-own-paragraph.md) | Code-block introducer is its own paragraph | You are about to introduce a code block with a sentence |
| [S13](S13-plain-ascii-in-markdown.md) | Plain ASCII in markdown - typeable characters only | You are about to type a character you could not produce on a standard keyboard |
| [S14](S14-hydration-triggers-state-a-condition.md) | Hydration triggers state a condition, not a topic | You are adding a catalogue entry, or reviewing one that has never routed anyone |
<!-- END GENERATED -->
