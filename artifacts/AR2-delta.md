---
id: AR2
category: artifact
title: Delta - a declared, gated transition between two architecture states
status: active
hydrate-when: You are about to change a system and need the change declared and its landing provable
recurrence: demonstrated
supersedes: []
related: [AR0, AR1, AR3, A8, A14]
---

# AR2 - delta

## Purpose

Declare one transition between two states of [`AR1`](AR1-system-architecture.md), and make its landing provable rather than reportable.

A delta is the only place **sequencing** lives.\
The architecture is timeless at both instants, so build order, staging and "what lands when" belong here and nowhere else.\
An architecture that grows a stage column has absorbed delta content, and it relocates.

A delta is a **build plan, not a ceremony class**.\
It is lightweight by design: enough to state what changes, to fence what must not, and to know mechanically when it is done.

---

## Lifecycle stage

Between selection and execution.\
The board proposes and triages candidate moves, the director selects one, and the delta is what the selected move becomes before any work starts.

---

## Required sections

- **From-state and to-state.** The two architecture states this transition connects, cited rather than described.
- **The fence.** What this delta is responsible for. A boundary, not a wish.
- **The anti-scope fence.** What must *not* creep in. Stated separately from the fence, because the failure mode is additive and a single boundary statement never catches it.
- **Build order.** The certifiable stages, ordered so each is provable before the next depends on it.
- **Binary exit criteria.** Each one an observation that is true or false. Not a checklist of tasks.
- **Coverage map.** Which ratified decisions this delta *proves* and which it *defers* - the from-to statement in mechanical form.
- **Verification targets.** What the harness must exercise for the criteria to be checkable.
- **Named costs and non-claims.** What this transition explicitly does not demonstrate.

---

## Authority

Authored by the architect or engineer who will execute it.\
Selected by the director from the board.\
Its exit criteria are evaluated by whoever holds verification authority for the work type - never by the executor alone, where the criteria carry assurance weight.

---

## Acceptance falsifier

An instance is unacceptable if:

- an exit criterion is not binary - if two readers could disagree on whether it is met, it is prose;
- progress is expressed as a count of tasks rather than as criteria met;
- coverage is weighted to produce a percentage of completion;
- the anti-scope fence is absent;
- it names no from-state or no to-state;
- a criterion is evaluated by the party who executed the work it certifies, on a delta whose closure counts as assurance.

**Progress against the target is measured, never reported.**\
The measure is the fraction of ratified decisions proven by green, falsifier-backed criteria.\
Two limits keep it honest: the unit is a binary falsifier and never a task count, and **coverage is not proximity** - decisions are unequal in proof cost, and inventing weights to smooth that produces hand-written status wearing arithmetic.\
A reading of zero proven at the outset is correct, not alarming.

---

## Template

```markdown
# Delta-N - <name> - <shape>

## 0. From-state -> to-state
## 1. The fence
## 2. Build order - certifiable stages
## 3. Coverage map - decisions proven vs deferred
## 4. Verification targets
## 5. Binary exit criteria
## 6. Named costs and non-claims
## 7. The anti-scope fence
```

A delta's *shape* - a vertical end-to-end slice, a horizontal layer, a repair - is a property of the transition, not a governance class.\
Naming the shape in the title is useful; giving each shape its own type is not.
