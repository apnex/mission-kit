---
id: M5
category: methodology
title: Anti-amnesia deferral - every parked or cut item carries a revival trigger
status: active
hydrate-when: You are parking, cutting or marking won't-do on a unit of tracked work
supersedes: []
related: [M3, M4]
---

# M5 - Anti-amnesia deferral

## Rule

When you defer, park, or cut a unit of work, record - at the moment of deferral - a concrete **revival trigger**: the observable condition under which the item should be reconsidered.\
Make the trigger a required field, not an optional note: a deferral with no revival trigger is rejected the same way a malformed record is.

Two corollaries make the rule load-bearing:

- **Terminal is reopenable.** "Done", "won't do", and "parked" are
  states, not graves. Every terminal state keeps an outgoing edge
  back to reconsideration; nothing is permanently unreachable.
- **Revival re-triages, it does not resume.** Reviving a dormant
  item routes it back through the *same* intake/triage as a brand
  new item - its old assumptions are re-examined, not silently
  resumed. The trigger says *when to look again*, not *what to do*.

---

## Rationale

The expensive failure isn't deferring work - it's deferring it *amnesically*.\
Six months on, a parked item is a line that says "not now" with no record of what "now" would have to become.\
So one of two things happens: it's silently lost (the deferral was effectively a delete no one decided on), or it's re-litigated from scratch (the original reasoning, constraints, and alternatives are gone, so the team re-derives them at full cost).\
Both are knowledge loss disguised as a tidy backlog.

Forcing a revival trigger at deferral time converts "we'll get to it" into a testable predicate.\
The backlog stops being a graveyard and becomes a set of armed conditions: when a trigger's condition holds, the item surfaces itself.\
The cost is one sentence at the cheapest possible moment (you have the full context in hand right when you defer); the payoff is that future-you can trust the backlog instead of re-discovering it.

Making terminals reopenable + routing revival through fresh triage is what keeps the trigger honest: a revived item that skipped re-triage would carry stale assumptions into a changed world.

---

## Examples

**Bad:**

> A capability is cut from the release as "out of scope for now"
> and moved to a someday list. No condition is recorded. A later
> planning round finds the line, no one remembers why it was cut or
> what changed, and the team spends a meeting reconstructing the
> original decision before they can even decide whether to revisit.

**Good:**

> The same cut records its trigger inline: *"Revive when a second
> consumer needs this surface, OR when the manual workaround is
> requested a third time."* Deferral is rejected until that field
> is filled. Later, the moment a second consumer appears, the item
> is unambiguously back in scope - and it re-enters triage, where
> its year-old assumptions get re-checked rather than assumed.

---

## When to apply

- Parking, cutting, or marking-won't-do any unit of tracked work
  (a task, a feature, a design option, a dependency).
- Designing the state machine for a tracker, backlog, or roadmap -
  bake the required-revival-trigger constraint into the schema, and
  give terminal states an outgoing reopen edge.
- Writing a decision record that defers an alternative: state the
  condition that would reopen the choice, not just the choice.
