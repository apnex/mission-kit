---
id: AR3
category: artifact
title: Board - the triaged graph of legal next moves, for director selection
status: active
hydrate-when: You are deciding what to do next and want the choice reasoned rather than taken under local pressure
recurrence: argued
supersedes: []
related: [AR0, AR1, AR2, AR5, A13, A14]
---

# AR3 - board

## Purpose

Present the live, triaged, prioritised set of **legal next moves** so the director selects a direction rather than deriving the options.

The board is where forward capital is allocated, and that makes it the instrument of [`A14`](../axioms/A14-compounding-learning.md).\
The axiom requires the organisation to engineer the path of greatest learning rather than the shortest path, and names **Shortest-Path Myopia** as its fault.\
An architecture states a destination but chooses nothing.\
Without a board the next move is chosen implicitly, item by item, under whatever pressure is loudest - which is not a risk of that fault but the fault itself, running by default.

It is a **graph, not a list**.\
Moves depend on each other, and a move whose dependency is unmet is not legal yet.

---

## Lifecycle stage

Between architecture and delta.\
It consumes the gap between the two [`AR1`](AR1-system-architecture.md) instants plus the open rows of [`AR5`](AR5-backlog.md), and emits one selected move that becomes an [`AR2`](AR2-delta.md).

---

## Required sections

- **The triage scale.** The dimensions each candidate is scored on, and the rule for ordering when they disagree.
- **The triage ledger.** Every candidate, scored, with its evidence cited.
- **Ordered milestones.** The moves grouped and sequenced, each carrying a status.
- **Held.** Open records whose revival trigger has not fired - **scored on the same scale**, so that not choosing them is a visible judgement rather than an omission.
- **Decisions required.** The questions that block work, each naming exactly what it blocks.
- **The contract with the record.** How board items bind to backlog rows.

### Two signals, and the higher wins

The load-bearing device.\
Score every candidate on **at least two orthogonal dimensions**:

- **impact** - what it does to someone now, on a severity scale from data loss down to internal-only;
- **principle breach** - which standing commitment it violates, and whether the breach is of the commitment's mandate or of an enforcement signal.

**Order on the higher of the two.**\
Do not collapse them into one score.

They measure different things: impact is what hurts today, principle breach is what will keep costing after today's pain is gone.\
**Where they disagree, the disagreement is information** - collapsing the scales destroys exactly the signal that prevents shortest-path ordering.\
An item that is low-impact but breaches a mandate outright belongs early, and a single blended number can never say so.

This is also what makes an axiom corpus operational rather than decorative.\
A standing commitment that never changes what gets built next is not in force.

---

## Authority

Authored by the architect.\
**Selected by the director**, who is the board's only consumer for the selection act.

The board exists to spend director attention well: it presents scored options and states what each decision blocks, so the director rules on direction and never on derivation.

---

## Acceptance falsifier

An instance is unacceptable if:

- ordering is derived from a single collapsed score;
- an item cites no record row;
- a deferred item was dropped without its reason being written back as a revival trigger - explicit deferral is permitted, silence is not;
- `Held` items are listed but not scored, so the comparison is asserted rather than shown;
- a `Decisions required` entry does not name what it blocks;
- the board and the record disagree about any item's state.

The last is mechanically checkable and should be: every record row naming a board milestone must exist on the board, and every board item must cite a live row.

---

## Template

```markdown
# <system> - board

## The contract between board and record
## Triage scale          <- dimensions + the higher-of-two ordering rule
## Triage ledger         <- every candidate, scored, evidence cited
## <M0..Mn>              <- ordered milestones, each with a status
## Held                  <- scored, with revival triggers
## Decisions required    <- each naming what it blocks
```

Group milestones by **severity, not by theme**.\
Grouping by theme is the observed failure: two user-visible wrong-result defects sat in the last milestone because they happened to live in the same files as cleanup work.
