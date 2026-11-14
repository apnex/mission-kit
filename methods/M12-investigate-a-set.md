---
id: M12
category: method
title: Investigate a set - partition the population against its charter and find the gaps
status: active
hydrate-when: You need to know whether a set is complete, balanced or lopsided against its charter, or where its gaps are
supersedes: []
related: [E4, E3, E6, M11, M13, AR5, AR3, RU3]
---

# M12 - Investigate a set

## Rule

An investigation is a dated analysis of a set's population against its charter's vision, scope and growth policy.\
It produces a partition, the place of each member in it, and the gaps; the charter is unchanged by it.

1. **Read the charter and every member.** The vision and scope say what the set is for; the growth policy says how it grows and what members are balanced on.
2. **Propose a partition derived from the members** - their triggers, their subjects, the moments or risks they address - so that every member lands in it, and in exactly one place. A member that fits nowhere, or everywhere, is evidence the partition is wrong. More than one partition is usually defensible; state why this one was chosen. Where the charter measures the set against another set's population - its scope is that population, or covering it is a dimension of succeeding - read that measure as a cover, beside any partition of the set's own scope: the cells are that population's members, and a member here may sit in several without the cover being wrong; read which members it covers from the relation's declarations and any view generated from them, and where no declaration exists, building the view by hand is itself a finding.
3. **Let the scope set the extent, not the population.** A cell no member fills is kept and named as a gap; removing it to match the population erases the gap it exposes. Under such a scope, a member of the other set that nothing here covers is such a gap, and a member here that covers nothing is outside the scope, or shows a member the other set lacks. Where the relation runs the other way - this set's charter requires each of its own members to be covered by another set's members - a member here that nothing covers is a fault of this set, not a gap in the other.
4. **Test each gap.** Search the corpus for a member, or guidance elsewhere, that already fills it, and name the searches run. A gap that survives is real; a candidate that would fill it is named where one exists.
5. **Show a gap or argue there is none.** A partition that names at least one checked absence has shown it can detect one; one that names none must say why the population is complete against it.
6. **Check the balance** against the growth policy: a crowded cell beside empty ones is a finding.
7. **Record it in the project's own record**, dated, citing the charter it measured against. The charter does not link to it.
8. **Carry each gap to the backlog** ([`AR5`](../artifacts/AR5-backlog.md)) as a row with a revival trigger, naming the set it is about; the board ([`AR3`](../artifacts/AR3-board.md)) weighs them for the director.
9. **If the vision, scope or growth policy is itself shown wrong,** propose a re-aim under [`M11`](M11-change-a-charter.md); a finding about members - overlap, crowding, a candidate - is acted on by [`M13`](M13-change-a-set.md).

**Investigating across nested altitudes.**\
Where a hierarchy of sets spans containment altitudes ([`E3`](../entities/E3-set.md), [`E6`](../entities/E6-component.md)), close coverage, boundaries and peer relations at one altitude before descending into child sets or internal parts at the altitude below.\
Exclude properties that belong to a lower altitude and can vary independently there - implementation internals, hosting geometry or runtime placement - routing out-of-altitude material to the layer that owns it rather than contaminating the higher set.

**Open-world anchors and retired tombstones.**\
Where a set starts from an incomplete empirical anchor such as an export or register, retain observed anchors without dropping or rewriting measured facts (`step 1`) and let the charter's full scope expose omitted members (`step 3`).\
Treat unresolved peer references on active anchors as evidence of missing members, distinguish synthesized scope additions from measured anchors so counts reconcile, and isolate any retired record retained for conservation with zero active dependency edges.

---

## Rationale

A charter describes the ideal and cannot see its own population, so completeness is found by measuring, not by declaring.\
Cutting the set is a judgement that can be made more than one way, so it is held in a dated analysis a later investigation may replace, rather than in the charter where it would freeze the set.\
The obligations in steps 2 to 5 are what make a partition able to find anything: a well-formed partition that cannot detect a gap is decoration.\
Closing one altitude before descending and isolating incomplete empirical anchors keep higher-level set definitions invariant when lower-altitude deployment or implementation changes.

---

## When to apply

- Before deciding what a set should admit next.
- When a set reads as complete to the people who use it, which is when a missing kind is least visible.
- After a change to a charter's vision, scope or growth policy, to measure the population against it again.
- When populating or stressing a multi-altitude hierarchy of sets anchored to a partial empirical source.
