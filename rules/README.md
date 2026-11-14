---
id: RU0
category: rule
title: Rules - how work is done, where a check could tell whether it was
status: active
hydrate-when: You are adding or applying guidance on how work is done that leaves a trace a check could test
supersedes: []
related: [M0, PC0, S0, A0, E4, AR4, AR5, SC2]
---

# Rules - the how-you-must layer

## Vision

**North star.**\
Every point where how work is done can be verified from its record is held by a rule that names its trace, and every trace is read - by a tool where one can check it, by review where none can - so no guidance that could be held is left merely urged.

**What this set is, and is not.**\
It is the set of rules: guidance that governs how work is done, produces nothing of its own, and **leaves a trace a check could test** - something in the record of the work that shows whether it was kept.\
It is not guidance that leaves nothing to check, which is a practice, in [`practices/`](../practices/README.md); nor a convention about an artifact's form, which is style; nor a procedure producing a result of its own, which is a method.

**Succeeding.**\
Measured on three dimensions, never collapsed into one score:

- **Traced** - every rule declares a trace that a tool or a reader can check.
- **Read** - every trace is actually checked, by its enforcer where one exists and by review where none does, so no rule is held in name only.
- **Guarded** - no point where the record of the work could be lost or rewritten is left without a rule saying it may not.

**Authority.**\
The director holds this vision and ratifies any change to it, under [`M11`](../methods/M11-change-a-charter.md).

**What this vision does not authorise.**\
Citing it admits no rule and licenses no change of direction; a rule is admitted only by the placement, growth policy and member shape in this charter's operating sections.

The set exists because a rule that leaves a trace can be held, and one that does not can only be urged.\
Separating rules from practices tells a reader which guidance can be verified after the fact, and tells an author which guidance owes a check.

---

## Placement

Placement is stated once, in [`M0`](../methods/README.md), and applies here unchanged: axiom, procedure, style, rule, practice, asked in that order.\
A rule is what reaches the fourth question: it produces nothing of its own, does not govern an artifact's form, and leaves a trace in the record a check could test.

---

## Territory

**Scope.**\
This set covers **the points in a unit of work where how it is done can be verified afterwards from its record**.

**Growth policy.**\
Uncapped.\
A member is one constraint on how work is done, at the grain of a single trace in the record that shows whether it was kept.\
Members are balanced on their traces: each declares one that a tool or a reader can check, and guidance whose trace nothing could check is a practice, in [`practices/`](../practices/README.md).

---

## Operation

This set is analysed by [`M12`](../methods/M12-investigate-a-set.md) and its membership changed by [`M13`](../methods/M13-change-a-set.md); this charter is changed by [`M11`](../methods/M11-change-a-charter.md).\
Its members are balanced on their traces, so an analysis checks each declared `trace` against whether anything actually reads it; `tools/check-enforcers.sh` holds only that a named enforcer exists, never that the trace is read.\
To stress the territory beyond existing members, an analysis walks the moments of a unit of work where a durable record is written or altered (entering, committing to a design, verifying, deferring or cutting, amending history, and handing over), audits recurring process defects in the project's decision records ([`AR4`](../artifacts/AR4-decision-record.md)), backlog ([`AR5`](../artifacts/AR5-backlog.md)), and standing context ([`SC2`](../schemas/SC2-standing-context.md)) for obligations that leave a verifiable trace in the record, and checks whether each rule's declared `trace` can be held by an executable script paired through `tools/check-enforcers.sh`.\
A candidate whose trace nothing could check is routed to [`practices/`](../practices/README.md), one governing an artifact's form to [`style/`](../style/README.md), and one producing a result of its own to [`methods/`](../methods/README.md).\
Placement is stated in [`M0`](../methods/README.md) and is changed there, not here, and a practice that acquires a trace moves into this set.

---

## Member shape

A rule declares its `trace` in frontmatter: the observable in the record that shows it was kept or broken, required by the catalogue contract.\
It names an enforcer in `enforced-by` when a tool checks it, and `tools/check-enforcers.sh` holds that tool to existing; a rule with no tool yet is still a rule, and is checked by reading the trace.

---

## Boundaries and composition

- **Against style:** style governs the artifact's form; a rule governs what the work does or records. Both may be checked by a tool.
- **Against practices:** both govern conduct; a practice leaves nothing to check.
- **Against methods:** a method produces a result; a rule produces nothing and constrains how other work is done.
- **With methods:** a method's steps may be held by rules - a rule on deferral holds what any procedure records when it defers.

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
