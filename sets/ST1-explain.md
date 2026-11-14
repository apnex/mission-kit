---
id: ST1
category: set
title: Explain - how an agent leads a human of limited context to understand and decide
status: active
hydrate-when: You are about to communicate with a human who has limited context, to have them understand or decide something
supersedes: []
members: [S15, M10]
related: [ST0, M11, M12, M13, W23, W24, AR4, A13, A12, A5, A4, A8, A3]
---

# ST1 - Explain

## Vision

**North star.**\
A human with limited context, who may be reading cold, can understand what an agent tells them and decide what it asks.\
*Reading cold* means arriving without the session history, tool outputs or intermediate reasoning the agent holds.

**What this set is, and is not.**\
It is the cross-layer set gathering every entry that governs how an agent leads a human of limited context to understanding and a decision.\
It is not guidance for agent-to-agent seams, not the artifact where a ratified decision is stored, and not a home for untested communication opinions.

**Succeeding.**\
Measured on three dimensions, never one score:

- **Reach** - a cold agent about to write to or guide a human reaches this set and every member that applies.
- **Coherence** - no two members give opposite instructions for the same moment in an exchange.
- **Human-observed proof** - every member was shown on a human reader to improve understanding or decision-making over its absence.

**Authority.**\
The director holds this vision and ratifies any change to it, under [`M11`](../methods/M11-change-a-charter.md).

**What this vision does not authorise.**\
Citing it admits no member and licenses no change of direction; admission is by *What earns an entry* and the growth policy under *Territory*.

---

## Territory

**Scope.**\
Every moment in engineering work where an agent communicates with a human of limited context so that the human can understand a situation or make a decision - both the form of a single message and the multi-step dialogue that reaches understanding before asking for a choice.

**Growth policy.**\
Uncapped across layers.\
A member sits at the grain of one distinct moment or medium in agent-to-human communication and lives in the layer of its own kind (such as `style/`, `methods/`, `rules/` or `practices/`), declared in this charter's `members` list.\
Members are balanced on non-overlap and non-contradiction across moments, admitted by the test in *What earns an entry*.

---

## Operation

This set is analysed by [`M12`](../methods/M12-investigate-a-set.md) and its membership changed by [`M13`](../methods/M13-change-a-set.md); this charter is changed by [`M11`](../methods/M11-change-a-charter.md).\
Membership is read from this charter's `members` list and rendered into *Index* by `tools/generate-index.mjs`, never typed by hand.\
Members compose across altitudes of an exchange: [`M10`](../methods/M10-guided-dialogue.md) governs the multi-step sequence that reaches confirmed understanding before asking for a decision, and [`S15`](../style/S15-message-to-a-human.md) governs the form of each individual message inside or outside that dialogue.\
An analysis partitions the moments of human communication against the scope, checks that no two members give conflicting counts or instructions at one moment, and records any untested or conflicting moment as a backlog row ([`AR5`](../artifacts/AR5-backlog.md)) rather than inside this charter.\
To stress the territory beyond existing members, an analysis walks the full human-exchange arc - initial framing, status or bad-news delivery, teaching an unfamiliar concept, structured multi-question survey ([`K5`](../skills/survey/SKILL.md)), multi-turn guided dialogue (`M10`), board selection ([`AR3`](../artifacts/AR3-board.md)), and decision ratification - tests the boundary tensions named under *Boundaries* (`K5`, `AR3`, [`RU1`](../rules/RU1-default-reject-honest-yield.md)), and isolates individual communication moves through single-move paired comparisons on a human rather than package rewrites.\
A candidate governing messages between agents is routed to [`A6`](../axioms/A6-frictionless-agentic-collaboration.md) and its coordination entries; one governing how a finished decision is recorded is routed to [`AR4`](../artifacts/AR4-decision-record.md) and [`W23`](../work-types/W23-capture-decision-and-ratify.md).

---

## Axiom alignment

`A5`, `A12`, `A8`, `A4`, `A3` and `A13` - the axioms the two limits in `M10` are derived from.\
Cited, not enrolled: an axiom is a standing commitment, not a situated move.\
The set remains short of `A8` and `A4` at per-move granularity: existing human-evaluation evidence proves the bundled guidance as a package rather than isolating each individual move's share.

---

## What earns an entry

An entry joins this set when following it changes what a human of limited context can understand or decide, observed on a human - the evidence `S15` and `M10` carry.\
Importance alone does not admit one.

---

## Boundaries

Communication with a human only.\
Messages between agents are not in scope; agent-to-agent seams belong under [`A6`](../axioms/A6-frictionless-agentic-collaboration.md).

**Related, not members.**\
`W23` and `AR4`, where a decision `M10` leads to is captured and recorded; `W24`, the director's live walkthrough, which cites `M10` as the procedure that conducts it; it stays related rather than a member, being director-led.

**Related, each with a tension to reconcile before it joins:** `K5` survey asks three questions a round, against one question at a time; `AR3` board offers many moves at once, against one decision at a time; `RU1` honest yield is triggered by sweeps and audits, not by any report.

---

## Faults

- **The member nobody finds.** A moment with guidance that a cold agent does not reach.
- **Opposite instructions.** Two members telling a cold agent opposite things for one moment.
- **The member admitted for importance.** An entry in this set without an observed difference in what the human could do.

---

## Index

<!-- BEGIN GENERATED: entries. Run tools/generate-index.mjs; do not edit by hand. -->
| ID | Title | Hydrate when |
|---|---|---|
| [M10](../methods/M10-guided-dialogue.md) | Guided dialogue - lead a human to understanding, then to a recorded decision | You need a human with limited context to understand something or decide something |
| [S15](../style/S15-message-to-a-human.md) | A message to a human - point first, one step, explained names, clear picks | You are about to write a message a human will read without the context you have |
<!-- END GENERATED -->
