---
id: RU0
category: rule
title: Rules - how work is done, where a check could tell whether it was
status: active
hydrate-when: You are adding or applying guidance on how work is done that leaves a trace a check could test
supersedes: []
related: [M0, PC0, S0, A0, E4]
---

# Rules - the how-you-must layer

## Purpose

A **rule** governs how work is done, produces nothing of its own, and **leaves a trace a check could test**: something in the record of the work shows whether it was kept.

The set exists because a rule that leaves a trace can be held, and one that does not can only be urged.\
Separating rules from practices tells a reader which guidance can be verified after the fact, and tells an author which guidance owes a check.

---

## Placement

Placement is stated once, in [`M0`](../methods/README.md), and applies here unchanged: axiom, procedure, style, rule, practice, asked in that order.\
A rule is what reaches the fourth question: it produces nothing of its own, does not govern an artifact's form, and leaves a trace in the record a check could test.

---

## Territory

This set covers **the points in a unit of work where how it is done can be verified afterwards from its record**, at the moments `M0` names.

| Moment | What the rule holds | Members |
|---|---|---|
| **Entering** | what must be recorded or checked before work begins | **none - gap** |
| **Committing to a design** | what a design must record before it is built | **none - gap** |
| **Verifying** | what a claim of correctness must carry in the record | **none - gap** |
| **Deciding what to keep** | what lands, what is cut, and that a cut is recorded with a condition for its return | [`RU1`](RU1-default-reject-honest-yield.md) default-reject and honest yield, [`RU3`](RU3-anti-amnesia-deferral.md) anti-amnesia deferral |
| **Treating the record** | that what was recorded is not rewritten, that rewriting history is justified when it happens, and what must never enter it | [`RU2`](RU2-frozen-history-rule.md) frozen history, [`RU4`](RU4-publishing-rewritten-history.md) publishing rewritten history |
| **Handing over** | what a handover must record | **none - gap** |

Every member sits in one row, and four rows hold none.\
The members came from `methodology/` and `skills/` in Delta-1.

**Gaps tested.**\
The empty rows are gaps, not moments where no rule can exist.\
Guidance in the corpus that leaves a trace and has no rule entry, by moment: *Verifying:* claims record whether they were measured or inferred - stated in the vision and the standing context, and visible in every claim.\
*Treating the record:* credentials are never committed - `M0`'s own example of a rule - and commit hygiene, no tool attribution and one concern per commit, which the standing context carries and every commit shows.\
*Handing over:* a handover record names what is unfinished - a rule that would leave a trace, and none exists.\
*Entering* and *committing to a design* have no checked candidate yet.

---

## Member shape

A rule declares its `trace` in frontmatter: the observable in the record that shows it was kept or broken, required by the catalogue contract.\
It names an enforcer in `enforced-by` when a tool checks it, and `tools/check-enforcers.sh` holds that tool to existing; a rule with no tool yet is still a rule, and is checked by reading the trace.

---

## Boundaries and composition

- **Against style:** style governs the artifact's form; a rule governs what the work does or records. Both may be checked by a tool.
- **Against practices:** both govern conduct; a practice leaves nothing to check.
- **Against methods:** a method produces a result; a rule produces nothing and constrains how other work is done.
- **With methods:** a method's steps may be held by rules - `RU3` holds what any procedure records when it defers.

---

## Faults

- **The rule with no trace.** Guidance filed here that leaves nothing to check; it is a practice, and its presence teaches that rules are advisory.
- **The trace nobody reads.** A rule whose trace exists and is never checked, by tool or by review; it is held in name only.
- **The style rule in rule clothing.** A convention about an artifact's form filed here, where writers do not look for it.
- **The unguarded record.** A point where work's record could be lost or rewritten, and no rule says it may not.

---

## Index

<!-- BEGIN GENERATED: entries. Run tools/generate-index.mjs; do not edit by hand. -->
| ID | Title | Hydrate when |
|---|---|---|
| [RU0](README.md) | Rules - how work is done, where a check could tell whether it was | You are adding or applying guidance on how work is done that leaves a trace a check could test |
| [RU1](RU1-default-reject-honest-yield.md) | Default-reject discipline + honest yield reporting | You are running an improvement sweep, refactor programme or audit cycle |
| [RU2](RU2-frozen-history-rule.md) | Frozen-history rule | You are making a policy change that would rewrite artifacts recorded before it |
| [RU3](RU3-anti-amnesia-deferral.md) | Anti-amnesia deferral - every parked or cut item carries a revival trigger | You are parking, cutting or marking won't-do on a unit of tracked work |
| [RU4](RU4-publishing-rewritten-history.md) | Publishing rewritten history | You are about to force-push rewritten history that others may have consumed |
<!-- END GENERATED -->
