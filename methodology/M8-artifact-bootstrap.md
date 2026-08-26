---
id: M8
category: methodology
title: Artifact bootstrap - enter the loop at its inlet, one ratified type at a time
status: active
hydrate-when: You are adopting the artifact document set in a project that does not use it yet
supersedes: []
related: [M6, AR0, AR6, A13]
---

# M8 - Artifact bootstrap

## Rule

The [`artifacts/`](../artifacts/README.md) layer holds **types**, not procedures.\
An entry states what a conformant document is; none states what to do first, and reading them cold leaves an adopter knowing the shape of a destination and not the first step toward it.\
This is that first step, and nothing in it is new - every clause below is a rule that already exists somewhere, gathered into the order an adopter meets them.

1. **Fetch the corpus; do not vendor it.** The ledger routes to every entry, and
   an entry read from a copy is a copy that will drift.
2. **Enter at the inlet.** [`AR0`](../artifacts/README.md)'s loop has exactly one
   position with nothing upstream of it, and it is the vision. Every other type
   presupposes a purpose that only that one carries.
3. **Follow the order the types themselves declare.** Each entry's
   `Lifecycle stage` states where it sits: the vision is upstream of everything,
   the architecture is the anchor that the rest cite, the board sits between
   architecture and delta, and a delta opens between selection and execution.
   The decision record and the backlog are both continuous, so they open the
   moment anything is ruled or deferred rather than at a position in the
   sequence.
4. **Work from the entry, never from a summary of it - including this one.** A
   restatement is a second authoritative copy free to drift from the first, and
   these entries change. Where a step here disagrees with the type it describes,
   the type wins and this document is wrong.
5. **Author from a peer instance, per [`M6`](M6-author-from-exemplar.md).**
   Several artifact types ship no template deliberately, because a skeleton
   produces filled-in headings rather than a document. Take the devices, not the
   table of contents.
6. **Honour the authority each type declares.** A type that names who may ratify
   it is naming something no other role may supply, and an agent that drafts
   past that boundary has produced a document that looks conformant and
   authorises nothing.
7. **Check the draft against the type's own acceptance falsifier before showing
   it to anyone.** It is written to be run by the author.
8. **Stop at one type.** Ratify it, then start the next. A cascade produces a
   set of documents that agree with each other and were never separately
   examined.

**A known limit, stated so it is met as a limit rather than a contradiction.**\
The current projection of an architecture is required to be derived rather than hand-authored, and its stated derivation source is the exit criteria of completed transitions.\
A project adopting this set has run none, so at bootstrap that source does not yet exist.\
There is no settled answer, and inventing one here would be worse than naming the gap.

---

## Rationale

Every layer that holds definitions needs a companion that holds procedure, or the definitions are correct and inert.\
The components layer states this for itself - a registry is a catalogue and not a discipline, and the obligation to use it is a procedure that lives elsewhere.\
The artifact layer has the same split and had no elsewhere, so the first adopter had to be handed steps by a human, which is the thing a portable corpus is supposed to make unnecessary.

The order is load-bearing rather than tidy.\
Each type is written to cite the one above it, so a target architecture authored before a vision cites a north star that does not exist, and a board authored before an architecture ranks moves against no stated destination.\
Producing them out of order does not fail loudly; it produces documents whose cross-references resolve to nothing, which reads as completeness.

Stopping at one type is the clause most likely to be skipped and the one that protects the rest.\
An agent asked to onboard a repository will produce the whole set in one pass if permitted, and a set authored in one pass is internally consistent by construction - every document agrees because one author wrote them together against no external check.\
Ratifying each in turn is what forces each to survive contact with someone who did not write it.

---

## Examples

**Bad:**

> An agent is asked to onboard a repository. It reads the artifact
> charter, infers the six types, and produces all six in one pass -
> a vision written from the README, an architecture from the
> directory layout, a board from the open issues. Every document
> is well formed and every cross-reference resolves. Nothing in it
> was ratified, the vision states a purpose nobody confirmed, and
> the whole set now reads as a decision the project has taken.

**Good:**

> The agent fetches the ledger, reads the artifact charter for the
> loop, and opens the vision entry in full. It returns evidence of
> what the project appears to exist for, cited and labelled as
> inference, together with the questions only the authority can
> answer. A draft follows after those answers, is checked against
> the type's own falsifier, and is ratified before the next type
> is opened.

---

## When to apply

- A project is adopting the artifact document set for the first time.
- An existing project has some of these documents by other names and wants them
  reconciled to the types.
- An agent has been asked to "set up the documentation" and would otherwise
  produce a complete set in one pass.
- Especially where a reader has the artifact entries open and feels ready to
  write - that feeling is what this exists to interrupt, because the entries
  describe a destination and say nothing about order or authority.
