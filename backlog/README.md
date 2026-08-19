# Backlog - mission-required notes

Deferred **requests to run a future mission**, not the missions themselves.

A `mission-required` (`MREQ-N`) entry captures work that is *known to be needed* but deliberately parked - so it is not silently lost.\
It is distinct from the tactical `S`/`M`/`P`/`K` entries (which are situated moves you reach for) and from the axioms (standing invariants): an `MREQ` is a *pending unit of work with an armed revival condition*.

Every entry MUST carry a `revival-trigger` (per [M5 - Anti-amnesia deferral](../methodology/M5-anti-amnesia-deferral.md)): the observable condition under which the item should be re-triaged.\
A deferral without a revival trigger is rejected the same way a malformed record is.

**Revival re-triages, it does not resume.** When a trigger fires, the item routes back through fresh intake - its parked findings are re-examined against the world as it is then, not silently resumed.

## Entries

| ID | Title | Status | Revival trigger (short) |
|---|---|---|---|
| [MREQ-1](mreq-1-axiom-application-methodology.md) | Axiom-application methodology for non-code missions | deferred | a 3rd non-code mission needs disciplined axiom use, OR a 2nd "axiom-laundered wrong conclusion" is observed |

---

## Entry shape

```yaml
id: MREQ-N
category: mission-required
title: One-line title - noun phrase, no period
status: deferred          # deferred | active | done | wont-do  (all reopenable per M5)
revival-trigger: >        # REQUIRED - the observable condition to re-triage
  ...
related-axioms: []        # axioms the future mission bears on
related: []               # cross-links to S/M/P/K/MREQ entries
```
