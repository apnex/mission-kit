---
id: M13
category: method
title: Change a set's membership - admit, modify, retire or rebalance a member
status: active
hydrate-when: You are about to add an entry to a set, substantively change one, retire one, or split, merge or replace members
supersedes: []
related: [M11, M12, E3, E4, PC1, SC1, SC6, S14, RU2, RU3, W3, AR3, AR5]
---

# M13 - Change a set's membership

## Rule

Operating a set governs its population - [`M12`](M12-investigate-a-set.md) analyses it and this method changes its membership - while operating its charter changes the text the population is measured against, by [`M11`](M11-change-a-charter.md).

**Admit a member.**

1. Check the candidate against the set's scope, its admission tests and its growth policy. A candidate the scope excludes is routed to the neighbour the charter names; one that would break the growth policy is not admitted but recorded as a backlog row ([`AR5`](../artifacts/AR5-backlog.md)) for the board ([`AR3`](../artifacts/AR3-board.md)) to weigh.
2. Read a peer member first and author from it ([`PC1`](../practices/PC1-author-from-exemplar.md)).
3. Mint a new id, never issued before; `tools/check-id-reuse.mjs` refuses a retired one.
4. Give it the frontmatter [`SC1`](../schemas/SC1-catalog-entry.md) requires, a hydration trigger that states a condition ([`S14`](../style/S14-hydration-triggers-state-a-condition.md)), and the body sections its category declares in [`SC6`](../schemas/SC6-entry-body.md), if any.
5. Regenerate the index and pass the gate.

**Modify a member.**

1. An edit in place keeps the id.
2. A change that would alter what a reader decides is tested before it lands, by [`M2`](M2-test-drive-docs-by-execution.md), with the previous version as the comparison.
3. Changing the id inside the file retires the old id; that is a replacement, below, not an edit.
4. Regenerate the index if the title or trigger changed, and pass the gate.

**Retire a member.**

1. Delete it, with no stub, and record where its duty went - to a successor, a neighbour, or nowhere.
2. A successor lists the retired id in `supersedes`, so a reader holding an old citation finds it by searching.
3. Repair live citations; frozen records keep the old id as history ([`RU2`](../rules/RU2-frozen-history-rule.md)).
4. Regenerate the index and pass the gate; the id is retired for good.

**Rebalance the set.**

1. Splitting, merging or replacing members starts from a finding - usually an investigation's - recorded as a backlog row.
2. The board weighs the options and the director selects.
3. Carry it out by the steps above: a split admits and modifies, a merge modifies one member and retires the other, a replacement admits a successor and retires the original.
4. If the finding shows the charter itself wrong - its scope, admission tests or growth policy - change it by [`M11`](M11-change-a-charter.md) first.

Admitting and retiring within the growth policy needs no ratification beyond the change's own review; a rebalance, and any change the growth policy routes to the board, is the director's to select.

---

## Rationale

A charter describes the ideal and does not know its members, so changing who is in the set is not a change to the charter, and the procedure for it cannot live there.\
The steps were scattered before this method gathered them: admission tests in each charter, authoring from a peer in a practice, identity in the root README, the body contract in a schema, retirement in a work-type.

It has been run.\
Retirement with no stub and a `supersedes` lineage was carried out on six methods and skills (`9be5e8b`) and on a pattern moved to style as `S16` (`4c2d75f`); admission from the population's own rules was carried out on `E7` (`04893f6`) and this method.

---

## When to apply

- Adding an entry to any set.
- A substantive change to a member's claim.
- Retiring an entry, or moving one to another layer.
- Acting on an investigation's finding that members overlap, crowd one place, or leave another empty.

---

## Work-types that cite this procedure

Generated from each work-type's `methods`; a procedure no work-type cites shows an empty table.

<!-- BEGIN GENERATED: entries. Run tools/generate-index.mjs; do not edit by hand. -->
| ID | Title | Hydrate when |
|---|---|---|
<!-- END GENERATED -->
