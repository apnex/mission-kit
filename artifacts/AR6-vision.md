---
id: AR6
category: artifact
title: Vision - the enduring purpose a programme is measured against
status: active
hydrate-when: You need to say why a programme exists and what it must never become, and no document holds it
recurrence: argued
supersedes: []
related: [AR0, AR1, AR3, A13, A14]
---

# AR6 - vision

## Purpose

Carry the enduring purpose of a programme - what it is for, what it will not become, and what would count as succeeding.

A vision conveys intent, but intent is its consequence rather than its type.\
The type is the statement of purpose, which is why it outlives every plan derived from it.

A vision is the **inlet to the lifecycle loop**.\
[`AR0`](README.md)'s loop is otherwise closed: the architecture is projected at two instants, the board selects between them, deltas transition, rulings and deferrals return.\
Nothing in it says why any of it is being done, and every other type presupposes a purpose that no type carries.

A vision is not a plan and grants no authority.\
It is the thing a plan is checked against.

---

## Not an architecture

**A vision and a system architecture are orthogonal devices, and this section exists because they were once confused.**

[`AR1`](AR1-system-architecture.md) describes a system - components, duties, interfaces, state, run time.\
A vision describes an endeavour and names no component at all.

Two discriminators, both observable:

- **Structure.** If the document names a component, an interface or a duty, it is an `AR1` at some instant. A vision that has grown a component is an architecture wearing the wrong title.
- **Projection.** `AR1` is *temporally projected* - one architecture stated at two instants, `current` and `target`, conventionally CSSA and TSSA. **A vision is not projected.** There is no current vision and target vision; a vision that changed is a new vision, ratified as such, and never a second view of the same one.

The relation runs one way, and it is citation rather than containment.\
The target projection of `AR1` is shaped by the vision and cites it; the vision constrains the target and knows nothing of it.\
A vision survives its target architecture being replaced wholesale, and a change of vision invalidates the target.

`AR1`'s justification chain - *domain, axioms, north star, principles, decisions, model* - names the north star as a layer it **cites**, not one it contains.\
That citation is what this type answers: before this entry existed, an architecture citing its north star reached for a document that did not exist.

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
- **The non-authority declaration.** What holding this document does *not* entitle its holder to do. A vision that reads as an approval will be cited as one.
- **The north star.** One statement, short enough to be quoted whole and cited by a board. If it uses a term that could be read two ways, the document defines that term itself rather than leaving it to the reader.
- **What would count as succeeding**, as a set of dimensions rather than a score. A single number hides its weakest dimension. Where this was observed, the refusal to collapse was stated explicitly rather than left implicit - though that is a reading of one instance, not a survey of practice.
- **The authority.** Who holds this intent and who may change it.

**Enduring and point-in-time content are separated, or the document says which it is.**\
The observed failure is exact: a statement of enduring purpose grew a section of dated, attempt-by-attempt programme state under the same document status, so one line declared the currency of both.\
Current state belongs to `AR1`'s derived instant, and a live frontier belongs to `AR3`.

---

## Authority

Held by the director.\
Drafted by anyone; ratified only by the director, because intent is the one thing no other role may supply.

A vision is amended, never quietly rewritten.\
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
