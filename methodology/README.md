---
id: M0
category: methodology
title: Methodology - how work is conducted, as against how artifacts are written
status: active
hydrate-when: You are choosing how to run a review, audit or deferral, or you need to know whether a rule belongs here or in style
supersedes: []
related: [S0, P0, K0, W0]
---

# Methodology - the how-you-operate layer

Ways of working.\
Named procedures for conducting work, each one declinable in a given situation and none of them optional once you are in the situation it names.

A methodology entry governs **conduct**: the sequence you follow, the independence you require, the evidence you demand before you proceed.\
It is a *situated move* in the sense [`A0`](../axioms/README.md) draws - you reach for it when the work matches its trigger, unlike an axiom, which is in force whether you reach for it or not.

---

## What belongs here, and what does not

The layer boundary is the object the rule acts on.

| If the rule governs | It belongs in | Because |
| --- | --- | --- |
| the process you follow | `methodology/` | the object is the conduct of work |
| the artifact you produce | [`style/`](../style/README.md) | the object is the text, and a reader judges it without watching you work |
| the shape of a solution | [`patterns/`](../patterns/README.md) | the object is a design, reusable across processes |
| a capability you execute | [`skills/`](../skills/README.md) | the object is a procedure with inputs and outputs, invoked rather than followed |
| what must always hold | [`axioms/`](../axioms/README.md) | it is not declinable, so it is not a move |

The discriminating question is what a reviewer would inspect to tell whether the rule was honoured.\
If they would read the output, it is style.\
If they would have to know how you arrived at it, it is methodology.

---

## What earns an entry

A procedure earns one when following it and not following it produce measurably different work, and the difference has actually been observed.\
A named practice that everyone already follows codifies nothing.\
A practice nobody has run is a proposal, not a methodology.

Prefer strengthening an existing entry to adding a neighbour.\
Two procedures differing only in the situation they name will be applied interchangeably, and the distinction they were minted for is lost on first use.

---

## Faults

- **The unenforceable procedure.** A sequence with no observable trace, so conformance can only be asserted. If nothing distinguishes a run that followed it, it is advice.
- **The style rule in process clothing.** A convention about the artifact filed here, where the people who write artifacts do not look for it.
- **The procedure that is really a skill.** A named capability with inputs and outputs, filed as a way of working. It belongs in `skills/`, where it can be invoked.
- **The ceremony.** A step retained because it is in the procedure, after the failure it guarded against became impossible. Procedures accrete; nothing prunes them unless the entry says what it is protecting against.

---

## Index

<!-- BEGIN GENERATED: entries. Run tools/generate-index.mjs; do not edit by hand. -->
| ID | Title | Hydrate when |
|---|---|---|
| [M0](README.md) | Methodology - how work is conducted, as against how artifacts are written | You are choosing how to run a review, audit or deferral, or you need to know whether a rule belongs here or in style |
| [M1](M1-triangulated-review.md) | Triangulated review - minimum 4 independent inputs | You are reviewing a patch or design that ships to production or upstream |
| [M2](M2-test-drive-docs-by-execution.md) | Test-drive docs by execution | You are about to ship an operator-facing workflow document to someone who will run it |
| [M3](M3-default-reject-honest-yield.md) | Default-reject discipline + honest yield reporting | You are running an improvement sweep, refactor programme or audit cycle |
| [M4](M4-frozen-history-rule.md) | Frozen-history rule | You are making a policy change that would rewrite artifacts recorded before it |
| [M5](M5-anti-amnesia-deferral.md) | Anti-amnesia deferral - every parked or cut item carries a revival trigger | You are parking, cutting or marking won't-do on a unit of tracked work |
| [M6](M6-author-from-exemplar.md) | Author from exemplar - read a peer instance before adding to a collection | You are about to add an entry to a curated collection |
| [M7](M7-axiom-alignment-audit.md) | Axiom alignment audit - required gate for extensive planning/design | You are judging whether a design decision is anchored to a first principle |
<!-- END GENERATED -->
