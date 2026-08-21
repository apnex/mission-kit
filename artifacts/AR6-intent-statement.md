---
id: AR6
category: artifact
title: Intent statement - the enduring purpose a programme is measured against
status: active
hydrate-when: You are about to state where a system is going and find the reason it exists has no home
recurrence: argued
supersedes: []
related: [AR0, AR1, AR3, A13, A14]
---

# AR6 - intent statement

## Purpose

Carry the enduring purpose of a programme - what it is for, what it will not become, and what would count as succeeding - so that a target architecture has something to be derived from and a board has something to rank against.

An intent statement is the **inlet to the lifecycle loop**.\
[`AR0`](README.md)'s loop is otherwise closed: the architecture states two instants, the board selects between them, deltas transition, rulings and deferrals return.\
Nothing in it receives intent, and every other type presupposes a direction that no type states.

[`AR1`](AR1-system-architecture.md) already names the gap.\
Its justification chain is *domain, axioms, north star, principles, decisions, model*, each layer citing only layers above it.\
**North star is a named layer of that chain and nothing owns it**, so an architecture citing it reaches for a document that does not exist.

An intent statement is not a plan and grants no authority.\
It is the thing a plan is checked against.

---

## Lifecycle stage

Upstream of everything, and consumed rather than executed.

The target instant of `AR1` is derived from it.\
[`AR3`](AR3-board.md) ranks candidate moves against it, which is what makes an ordering argument possible at all - a board with no stated intent can only rank on local pressure, which is the fault `A14` names.\
It is amended by ratified rulings like any other living document, and it outlives every delta.

---

## Required sections

**No fixed table of contents, deliberately, and the deliberation is the entry's main claim.**

This type is admitted on `recurrence: argued` - one instance observed as a document, plus the same concern observed as embedded sections in two further programmes with no home of their own.\
Across those three, no section recurs.\
Prescribing a spine from one document would fix the type to that document, which is [`MREQ-3`](../backlog/mreq-3-component-design-spec-altitude.md)'s parked objection applied to a different altitude, and `AR0`'s admission rule bars it.

What is required is that these **devices** are present and findable.\
How they are arranged belongs to the programme.

- **What this is, and what it is not.** Both, and the second is not optional. A purpose with no stated exclusions has not been bounded, and the negative half is the half that is observed to travel.
- **The non-authority declaration.** What holding this document does *not* entitle its holder to do. An intent statement that reads as an approval will be cited as one.
- **The north star.** One statement, short enough to be quoted whole and cited by a board. If it uses a term that could be read two ways, the document defines that term itself rather than leaving it to the reader.
- **What would count as succeeding**, as a set of dimensions rather than a score. A single number hides its weakest dimension, and the observed practice in every programme that states success at all is to refuse the collapse explicitly.
- **The authority.** Who holds this intent and who may change it.

**Enduring and point-in-time content are separated, or the document says which it is.**\
The observed failure is exact: a statement of enduring purpose grew a section of dated, attempt-by-attempt programme state under the same document status, so one line declared the currency of both.\
Current state belongs to `AR1`'s derived instant, and a live frontier belongs to `AR3`.

---

## Authority

Held by the director.\
Drafted by anyone; ratified only by the director, because intent is the one thing no other role may supply.

An intent statement is amended, never quietly rewritten.\
A ruling that changes direction is recorded as [`AR4`](AR4-decision-record.md) and absorbed here, so the reasoning survives the change.

---

## Acceptance falsifier

An instance is unacceptable if any of these is observed:

- it states what the programme is and not what it is not;
- it carries no statement of what holding it does not authorise;
- its success measure is a single score, or a set of dimensions with a rule for collapsing them into one;
- its north star cannot be quoted in one sentence, or uses a load-bearing term the document does not define;
- point-in-time programme state sits under the same status as the enduring statement, with nothing distinguishing them;
- it names no holder;
- a ratified decision that changes direction is registered against it and not absorbed - registration in a list is not absorption.

The last is mechanical and shares its gate with `AR1`, since both are living documents that ratified rulings must reach.

---

## Template

No template ships with this entry, for the reason given under `Required sections` and following [`AR1`](AR1-system-architecture.md)'s precedent: a fillable skeleton would contradict the rule that arrangement belongs to the programme, and would produce empty headings.

Author from a peer instance instead, per [`M6`](../methodology/M6-author-from-exemplar.md).\
Take the devices, not the table of contents.

**On promotion to `demonstrated`.**\
This entry moves to `recurrence: demonstrated` when a second programme is observed carrying this concern as a document rather than as sections of one.\
Until then the tier records honestly that one project can show a shape was produced and never that another team would produce it.
