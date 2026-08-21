---
id: AR4
category: artifact
title: Decision record - one ruling, append-only, with what it affects
status: active
hydrate-when: You are ruling on something that later work will be built on and must not be re-litigated
recurrence: demonstrated
supersedes: []
related: [AR0, AR1, A4, A13, M4]
---

# AR4 - decision record

## Purpose

Carry one ruling durably: what was decided, on whose authority, why the alternatives were refuted, and which documents must absorb it.

The corpus of records is **append-only**.\
A ruling is never edited to match a later view; it is amended or superseded by a later record, and both stay readable.\
That is what makes the reasoning recoverable rather than only the conclusion, which is [`A4`](../axioms/A4-zero-loss-knowledge.md)'s whole argument: lost decision rationale is capital that cannot be reconstructed, only guessed at.

---

## Lifecycle stage

Continuous, and consumed by the architecture.\
A ruling is emitted whenever a question is settled, and the target [`AR1`](AR1-system-architecture.md) absorbs it into the sections the record declares it affects.

---

## Required sections

**One ruling is one record.\
A record is not necessarily one file.**

The observed forms are three, and all three hold: a register document carrying rulings as rows with an authority column; rulings as sections inside the document each governs; and one file per ruling.\
What must not vary is that a ruling is separately addressable, separately dated, and separately superseded.\
What may vary is where the bytes sit.

An earlier version of this entry mandated one file per ruling, which no observed programme does.\
That was one instance generalised into a physical-form requirement, and it is withdrawn: the fields below are required, and their carrier is not specified.

**Every ruling carries a status, and the status is load-bearing.**\
At least `proposed` and `ratified`, distinguished.\
The measured practice worth adopting is to make the status a gate condition rather than a label - one programme's gate definitions state that no `proposed` decision authorises implementation or a gate pass, which turns the field into a mechanism instead of an annotation.

Frontmatter, or the equivalent columns where the carrier is a register:
```yaml
id:         "0047"                  # zero-padded, monotonic, never reused
title:      <the ruling, as a sentence>
date:       YYYY-MM-DD
status:     ratified | proposed
authority:  [<who ruled>]
supersedes: []                      # records this one replaces
amends:     ["0020", "0021"]        # records this one modifies but does not replace
affects:    ["design/tssa.md", ...] # documents that must absorb it
```

`amends` and `supersedes` are separate fields because they are different acts.\
Superseding retires a record; amending leaves it live and changes part of it.\
Collapsing them loses which prior rulings are still standing.

`affects` is **one** way to make absorption checkable.\
A record naming a document creates an obligation on that document, and a gate can walk it.

It is not the only way, and no observed programme uses it.\
The measured alternative is a machine-readable sibling artifact - a traceability declaration outside the prose that binds each ruling to the gates and tests that own it, checked by its own test.\
Either satisfies the requirement, which is that **absorption is checkable by something other than a reader**.\
A programme that carries neither has an unfalsifiable claim, whatever its records say.

Body:

- **The ruling.** What is decided, stated so it can be cited in one line.
- **Why not the alternatives.** The refuted options and what refuted them. A ruling with no refuted alternative was not a decision.
- **Named costs.** What this ruling costs, stated rather than discovered later.
- **Consequences.** What must now change, and where.

### Provenance tags

Every load-bearing sentence carries its epistemic status inline, in a vocabulary that is greppable:

| Tag | Means |
| --- | --- |
| `[DIRECTOR]` | ruled by the authority, quoted verbatim where possible |
| `[MEASURED]` | established by observation, with the observation cited |
| `[ARGUED]` | reasoned from stated premises, not measured |
| `[OPEN]` | not settled; carried deliberately |

The distinction between measured and argued is the one that matters most and is the easiest to lose.\
A tag makes it survive the summarising that follows, and lets a reader find every argued claim in a corpus with one search.

---

## Authority

Ruled by whoever holds decision authority for the altitude - typically the director.\
Drafted by anyone.

A design call made during architecture work is lawful, provided it is carried durably and tagged.\
The failure it guards is **category drift**: a design opinion written into architecture prose reads as architecture some weeks later, and nobody can then tell which calls are load-bearing and which were convenience.

---

## Acceptance falsifier

An instance is unacceptable if:

- it refutes no alternative;
- a load-bearing claim carries no provenance tag, so measured and argued are indistinguishable;
- absorption is checkable by no mechanism - neither an `affects` list a gate can walk nor a machine-readable binding outside the prose;
- a named absorption obligation is not met - **registration in an index is not absorption**;
- it carries no status, or a status vocabulary that cannot distinguish a proposal from a ruling;
- a proposal is cited as authority for work already done;
- its `id` reuses a retired one;
- it was edited after ratification other than by an appended, dated amendment;
- `authority` names no one.

Nothing here constrains the carrier.\
A register row and a standalone file fail and pass these identically, which is the point of the relaxation.

---

## Template

Two carriers, both conformant.\
Choose by how many rulings the programme expects, not by preference.

### One file per ruling

```markdown
---
id: "NNNN"
title: <the ruling>
date: YYYY-MM-DD
status: ratified
authority: [<who>]
supersedes: []
amends: []
affects: []
---
# NNNN - <the ruling>

**Status:** ratified - **Date:** - **Authority:**

## The ruling
## Why not the alternatives
## Named costs
## Consequences
```

### A register carrying many rulings

```markdown
# <system> - decision register

## Status            <- what authority ratified these, and when
## Confirmed intent  <- the intent the rulings realise, if it has no other home

## Decision records
| id | ruling | authority | status |
```

The register form carries the same fields as columns, and each ruling keeps its own body below the table for the refuted alternatives, costs and consequences.\
One observed programme absorbs its intent capture into the `Confirmed intent` section of the register, so that a reader reaches the authority from the decision it authorises rather than from a separate artifact.\
That is a legitimate placement and not a missing document.
