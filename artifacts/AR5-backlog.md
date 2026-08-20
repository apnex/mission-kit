---
id: AR5
category: artifact
title: Backlog - the durable record of what was not done, each row with a trigger
status: active
hydrate-when: You are deferring, cutting or parking work and it must not become forgetting
recurrence: demonstrated
supersedes: []
related: [AR0, AR3, M5, A14]
---

# AR5 - backlog

## Purpose

Hold every finding and deferral durably, so that not doing something is a recorded judgement rather than an absence.

The backlog is the **record**; [`AR3`](AR3-board.md) is the **plan**.\
The plan is reorderable and items may be dropped from it.\
The record is append-only and nothing leaves it silently.\
Keeping them as one document is the common failure: a plan that must also serve as the record cannot be reordered freely, and a record that must also serve as the plan accumulates until it is unreadable.

Its governing rule is [`M5`](../methodology/M5-anti-amnesia-deferral.md): every parked or cut row carries a **revival trigger** naming an observable condition.\
"Later" is not a trigger.

---

## Lifecycle stage

Continuous, and paired with the board.\
Execution and audit emit rows; the board consumes open rows whose triggers have fired and scores the rest under `Held`.

---

## Required sections

- **The row contract.** When a row is required, and what evidence a row must cite. Stated in the document, because a backlog whose admission rule is unwritten fills with noise.
- **Rows**, each carrying an id, the finding, cited evidence, a state, and a revival trigger where the state is not closed.
- **State groupings** - typically open, parked, retired - so that cut work stays visible rather than being deleted.

A row's minimum shape:

| Field | Why |
| --- | --- |
| `id` | stable, never reused, so the board and other records can cite it |
| finding | what is actually true, stated so it can be scored |
| evidence | a citation, not an assertion - file and line, or the command run |
| state | open, parked, retired |
| revival trigger | required unless closed; an observable condition |

**Revival re-triages, it does not resume.**\
When a trigger fires the row returns to intake and is re-examined against the world as it is then, not silently picked up where it stopped.

---

## Authority

Any participant may add a row.\
Closing a row is bound to the act that closed it - a fix, a ruling, or an explicit cut - never to a tidying pass.

A row is closed in the same commit as the work that closed it.\
Deferred closure is how records and reality separate.

---

## Acceptance falsifier

An instance is unacceptable if:

- a non-closed row has no revival trigger, or its trigger is a date or the word "later" rather than an observable condition;
- a row cites no evidence;
- a row was deleted rather than retired with a reason;
- a row is closed with no corresponding change;
- a board item exists whose row does not, or a row names a milestone that is not on the board.

The trigger test is the one that carries the weight: a condition someone could observe firing, without having to remember to check.

---

## Template

```markdown
# <system> - backlog

## Adding a row      <- the admission rule and the evidence requirement

## Open
| id | finding | evidence | revival trigger |

## Parked
| id | finding | evidence | revival trigger |

## Retired
| id | finding | reason cut | revives on |
```
