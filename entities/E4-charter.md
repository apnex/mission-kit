---
id: E4
category: entity
title: charter - the document that voices a set, and the questions only it can answer
status: active
hydrate-when: You are writing or revising a charter, or deciding whether a section belongs in one
supersedes: []
related: [E3, E2, A3, S0, M11, M12, M13]
---

# E4 - charter

## Definition

A **charter** is the document through which a [`set`](E3-set.md) speaks.\
It states what the population owes itself - the things no member has standing to say and no member could know.

A member answers *what am I, and how do I apply.*\
A charter answers *what is this population for, what belongs in it, how do its members relate, and how would you know it was wrong.*

Every knowledge layer's charter is its `<prefix>0` entry, held at `<directory>/README.md`.\
A set with no charter is a directory listing: it can be checked for validity and never for completeness, because nothing states what the collection is for.

**A charter is an asymptote for its set.**\
Like an axiom, or a programme's [vision](../artifacts/AR6-vision.md), it describes the ideal end state of the set - a direction the population approaches and never fully reaches - and the population is measured against it.\
It is never cut to fit what the set holds today, and it is written independently of the current population: a charter describes the ideal, not its members, which appear only in the generated index.\
**A charter has two halves: a vision applied to its set, and the operating instructions for it.**\
The **vision half** is the set's end state, written with the devices a [vision](../artifacts/AR6-vision.md) requires, applied to the set:

- **what the set is, and what it is not;**
- **a north star** - one statement short enough to quote whole, defining any term in it that could be read two ways;
- **what would count as succeeding**, as dimensions rather than one score;
- **the authority** - who holds the vision and may change it, which for every charter in this corpus is the director;
- **what the vision does not authorise** - citing the end state admits no member and licenses no change of direction; only the operating half's tests admit.

The **operating half** says how the set is run: what it covers and how it grows, what enters and where the rest goes, how members relate, how it goes wrong, and how it is analysed and changed.\
It operates two things, and they are kept apart: the **set** - its population, analysed by [`M12`](../methods/M12-investigate-a-set.md) and changed by [`M13`](../methods/M13-change-a-set.md), which admits, modifies, retires and rebalances members - and the **charter** itself, changed by [`M11`](../methods/M11-change-a-charter.md).\
A charter cites these methods and adds only what is specific to its set.

**Members need not know their set.**\
A member need not know its siblings, or how the population is governed; the charter is the one place that aggregates it.\
Where a member names its set - a layer member's category - that is an address that reaches the charter, not knowledge of how the set is governed.

**Partitions and gaps belong to investigations, not to the charter.**\
A territory can be partitioned in more than one defensible way, and the dimensions a population is missing cannot be listed before someone has studied it and formed a hypothesis about how it could be cut.\
So the charter states no cells and no gaps.\
An investigation ([`M12`](../methods/M12-investigate-a-set.md)) - a dated analysis of the population against the vision, scope and growth policy - proposes a partition, places the members in it, and finds the gaps; a later investigation may cut the set differently without the charter changing.\
Each gap an investigation finds becomes a backlog row with a revival trigger ([`AR5`](../artifacts/AR5-backlog.md)), and the board ([`AR3`](../artifacts/AR3-board.md)) weighs open rows for the director to select; a charter does not rank its own gaps.\
The charter changes only when an investigation shows its end state, scope or growth policy is itself wrong.\
The dependency runs one way: an investigation cites the charter it measures against, and a charter neither links to its investigations nor records that it is being investigated, because the ideal does not depend on any measurement of it.\
The exception to naming members is a set spanning layers, whose charter declares its members in a `members` list because each member's category names its own layer; its index is still generated, from that list.

A charter's content falls into three classes, and the classes are the point of this entry.

- **Required.** Every charter answers these, because every set has them.
- **Conditional.** A charter answers these only when the property is present. A set whose members all take one shape need not say it has kinds.
- **Free.** The set's own substance. Unconstrained by design, because a charter organised as its set is organised says more than one forced into a template.

---

## Discriminators

**Required, conditional, and free are told apart by one question:** *could a member answer this?*\
If any single member could state it, it is not charter content at all and belongs in the member.\
If no member could, it is a set property, and the remaining question is only whether every set has it.

### Required - every charter

| Concern | The question | Why a member cannot answer it | Location |
|---|---|---|---|
| **Vision** | What end state does this set approach, and why does it exist? Written with the vision devices above, first, because the scope, the growth policy and every judgement about the population are measured against it. | A member knows why *it* exists, never what the collection is heading towards | heading `Vision` |
| **Territory** | What does this set claim to cover, and by what growth policy does it grow? | Scope and growth are properties of the population; a member cannot see its siblings | heading `Territory` |
| **Operation** | How is this set analysed, stressed against its scope, and its membership changed, and how is this charter changed? It cites the methods and states the territory-stress pass and routing rules specific to this set. | Analysing, stressing and changing a population is done across it, never from inside one member | heading `Operation` |
| **Boundaries** | What belongs here, what does not, and where does the excluded thing go instead? | An exclusion decides a case no member holds | anywhere |
| **Composition** | How do members relate to one another? | A relation has two ends, and a member holds one | anywhere |
| **Faults** | What does an unhealthy population look like, as against a merely valid one? | Every member can be valid while the set is wrong | heading `Faults` |
| **Index** | What is in it? | Generated, never typed | heading `Index` |

**Where the location is fixed and where it is free.**\
The rule is derived from what thirteen charters actually do rather than chosen in advance: **where every set asks the same question and answers it in the same form, the heading is fixed; where the form of the answer varies by set, the answer is required and its heading is free.**

Vision, Territory, Operation, Faults and Index are the same question in every set and are answered in the same form, so each takes a fixed heading.\
A fixed heading makes the answer addressable - it can be linked, checked by a script, and seen by a reader skimming the spine - which is the corpus's own reachability property applied to the charter.\
The vision is the clearest case: every charter answered why its set exists, nearly always in untitled opening paragraphs, and an untitled answer is invisible to everything except a full read; the heading was `Purpose` until the vision ruling.\
The fixed headings are declared in the entry-body contract, [`SC6`](../schemas/SC6-entry-body.md), and checked by `tools/check-entry-body.sh`; this entry states what they mean.

Boundaries and Composition vary in form, and the form carries the content.\
Composition has been answered as a loop, as declared edges, as generative axes, as containment, and as orthogonality with no apex member; forcing one heading would flatten five different relations into one shape.\
Boundaries has three legitimate forms, below.\
For these two the answer must be present and findable, and its heading belongs to the set.

**The three forms of Boundaries.**\
A charter may use any or all of them, and the strongest charters use all three.

| Form | States | Example shape |
|---|---|---|
| **Admission test** | what earns membership | a short list of tests, all of which must pass |
| **Exclusion with route** | a named thing that is not a member, and where it goes instead | "X is not a member of this set; it belongs in Y" |
| **Neighbour table** | how this set is told apart from each adjacent set | one row per neighbour, one discriminating question |

An exclusion without a route is half an answer: it tells the reader where not to put something and leaves them to guess where it belongs.\
**Relations to other sets belong here when they are boundaries.**\
A set defining itself against a neighbour is stating a boundary.\
A set can also be measured against another set's members - the work-types charter asks that every procedure that conducts work be cited by a work-type, the traits charter that every trait be named by an axiom - and that relation is not a boundary: it is declared once, on the members of the side whose meaning includes it, with the reverse view generated ([`README.md`](../README.md), *Mechanics*).\
A charter that measures its set this way says so, in its vision or its scope; which members are covered is read from the declarations and never typed into the charter, though a view generated from them may appear in its index.

> **Correction.** This entry previously said: *Relations to other sets belong here. A set defining itself against a neighbour is stating a boundary, and every observed instance of an inter-set relation takes that form.*
> The last clause was arguably false when written - the axiom charter already had each domain citing the axioms it must satisfy, a one-way citation rather than a boundary - and became plainly false once the work-types charter's *Attachment* and the traits charter's *Binding* measured one set against another's members, and each artifact type's generated *Produced by* section showed the types no work-type produces.

**Two kinds of fault, and only one belongs in a charter.**\
A **population fault** is visible only across the set - a member admitted for importance rather than fit, two members restating one rule, a population that has stopped being searched.\
A **member fault** is a failure mode of one member's invariant, and belongs in that member, where a reader meets it while doing the thing that risks it.\
Collected in a charter, member faults are read only by people already looking for them.\
The `Faults` concern is for population faults alone.

**What a territory states.**\
Two things, and no partition.

- **Scope** - what the set claims to cover, set by what the set is for and never by what it holds. A claim no member fills is not narrowed to fit; an investigation finds the gap.
- **Growth policy** - the rules by which the set grows and is balanced: whether it is capped at a number or uncapped, the altitude a member sits at, and what members are balanced on. *Capped at five, balanced in cognitive weight* and *uncapped - as many as fit the altitude without diluting each* are both growth policies, and they make different sets. A candidate that would break the policy is not simply admitted; it is recorded as a backlog row, and the board weighs replacing a member, changing the policy, or declining it.

> **Correction.** This entry previously required a territory to carry a partition derived from the population and to show a gap or argue there was none:
> *Its partition is derived from the population; its extent is set by purpose* - and - *It shows a gap or argues that there is none.*
> The director ruled that a charter is an asymptote: it states end state, scope and growth policy, and partitions and gaps are found by investigation. The obligation to show a checked gap moved with them; it did not disappear.

**What Operation states to make a territory stressable.**\
A small or lopsided population cannot reveal its own missing dimensions if an investigation only groups the members already held.\
Each charter's `Operation` therefore states **how its territory is actively stressed against its `Vision` and `Scope`** - the external denominator, sampling pass, or generative stress-test an [`M12`](../methods/M12-investigate-a-set.md) investigation runs to expose unpopulated regions of `Scope`, seam collisions between neighbours, and bundled moves inside a single member, alongside where excluded candidates are routed.\
The stress protocol belongs in the charter because it defines how the set's ideal is tested; the dated partition and the gaps a run finds belong in a dated [`M12`](../methods/M12-investigate-a-set.md) investigation kept as working material (in this corpus, git-ignored under `docs/investigations/`) with surviving gaps carried to the backlog ([`AR5`](../artifacts/AR5-backlog.md)).

**Growth must be paid for.**\
Conforming a charter usually lengthens it, because the concerns most often missing - territory and composition - are the ones that need authoring rather than moving.\
Length is acceptable when it is paid for, and only then.\
An added passage is paid for when it **answers a question the charter could not previously answer**, and when that answer **improves what a reader can do with the charter** - route an item, see where the set is heading, choose a member, or see a relation they would otherwise have had to reconstruct from the members.\
A passage that restates, introduces, or summarises what is already present is unpaid, and is removed.

### Conditional - when the property is present

| Concern | Required when | The question |
|---|---|---|
| **Kinds** | members come in more than one sort | What sorts exist, and how is a member told which it is? |
| **Member shape** | the set prescribes a body or frontmatter | What must every member carry? Read from the machine declaration, never restated |
| **Placement** | members live somewhere other than the charter's directory | Where do members live, and what are they called? |
| **Enforcement boundary** | some properties are machine-held and some are not | Which rules a script holds, and which are settled by reading? |
| **Sub-sets** | the set contains sets | Which children exist, and what each is for - and nothing more |
| **Axiom alignment** | the set makes a claim an axiom governs | Which standing commitments bind it, and where it falls short |
| **Probes** | a change to the charter would alter what a reader decides | What must a reader holding only this charter be able to answer? |

**Probes are what makes a charter's purpose testable.**\
They are questions a fresh reader holding only the charter must be able to answer, each with the answer it should reach.\
They belong here rather than in the procedure that runs them, because what good looks like is specific to each set: a good axiom charter lets a reader judge whether a proposed principle belongs, and a good methodology charter lets a reader choose the procedure for the moment they are in.\
No member can state them, so they are a set property.\
[`M2`](../methods/M2-test-drive-docs-by-execution.md) holds the procedure that runs them; this concern holds what they ask.

A charter's probes are derived from its population - from what members actually do - and never from the text of its latest revision, or they can only confirm that revision.\
Weakening a probe is a change to the charter's standard and is as visible in review as weakening a claim.

### Free - everything else

A charter's remaining sections are its own.\
A loop diagram, a tie-break rule, a composition table, an argument for why a distinction is drawn where it is - none is required of other sets and none is forbidden.\
The test for a free section is only that it states a set property; anything a member could say has drifted into the wrong document.

**Charter against member.**\
A member states what it is.\
A charter states what the members owe each other.\
A charter section that describes one member in detail has absorbed that member's duty and should move into it.

**Charter against set.**\
The set is the population; the charter is its voice.\
[`E3`](E3-set.md) defines what a set owns.\
This entry defines the document that states it.

---

## Changing a charter

A charter is changed by [`M11`](../methods/M11-change-a-charter.md): every changed sentence is accounted for, a change that would alter what a reader decides is tested before it is ratified, and the director ratifies.\
The procedure moved there from this entry, which states what a charter is and no longer how to change one.

---

## Boundaries

It is **not a template.**\
Five concerns take a fixed heading because every set asks them in the same form; the rest of a charter is organised as its set is organised.\
Two conformant charters share those five headings and may share nothing else.

It is **not the enforcement.**\
Where a concern is machine-checkable, the machine declaration holds it and the charter reads it.\
A charter that restates a machine-held rule creates a second authority free to drift.

It is **not a member.**\
It carries an id and appears in its own index, and is exempt from the body shape its set prescribes for members, because it defines that shape rather than instantiating it.

It does **not govern its sub-sets.**\
A parent charter registers each child and states what it is for.\
The child charter governs its own population, and inherits nothing.

---

## Relations

**To [`E3`](E3-set.md).**\
`E3` names what a set owns: its end state, scope and growth policy, member relations, admission and retirement, placement and naming, and the health of the population.\
Each maps to a required or conditional concern here, and a set property `E3` names that this entry does not place is a defect in one of the two.

**To [`E2`](E2-layer.md).**\
Every knowledge layer's charter is its `<prefix>0` entry.\
That regularity is what lets a member resolve its charter without a lookup.

**To [`S0`](../style/README.md).**\
The first charter to state its own enforcement boundary - which rules a script holds and which are settled by reading - as a property of the set rather than a backlog.\
The conditional concern of that name generalises it.

**To [`A3`](../axioms/A3-sovereign-composition.md).**\
Composition is required rather than conditional because every set's members relate somehow, even if only by being orthogonal, and an unstated relation is the one most likely to be violated silently.

---

## Why precision matters

Thirteen charters were written without a definition of what a charter is, and each invented its own shape.

The divergence carries real evidence, and it is better evidence than any template would have been: thirteen authors writing independently converged on roughly seven concerns.\
**Composition** was invented in five charters without any of them copying another.\
**Boundaries** appear in four, almost always as a ruling that some named thing is excluded and routed elsewhere - and one charter carries the strongest form, a table discriminating the set from each of its neighbours by a single question.\
**Kinds** appear in four: standing against situated, internal against external, enforced against unenforced, pattern against anti-pattern.\
A concern reached independently by several authors is a property of sets, not a habit of one writer.

A first attempt at standardising charters counted the most frequent headings and declared four of them required.\
That was popularity rather than design, and it failed in three specific ways worth recording, because each is the kind of error a definition exists to prevent.\
It omitted composition, the concern most consistently invented.\
It reported charters as missing an admission rule when they carried several, written as exclusions under other headings, because it matched names rather than answers.\
And it disagreed with `E3`, the definition it was meant to enforce, so the enforcement and the thing it enforced were already two statements of one rule drifting apart.

The required concerns are stated as questions so that the third failure cannot recur: a checker can only test for the presence of an answer if it knows what question it is testing, and a heading name is not a question.

A later audit read all thirteen charters in full and graded each concern by whether an answer was present, under any heading.\
It found the heading count wrong in both directions.\
Purpose was answered in every charter and titled in two, so a heading checker would have reported it absent eleven times.\
Boundaries was answered in eleven, mostly as exclusions under other headings, which the earlier standard counted as missing.\
And the two concerns genuinely absent - territory in most charters, composition in several - were ones the earlier standard either omitted or could not detect.\
The split between fixed and free headings is the correction: it keeps the four answers that are always the same form checkable by a script - five since the vision ruling added Operation - and refuses to flatten the two whose form is the content.

A trial conversion of one charter then tested the standard against a real population before any other charter was touched.\
It preserved every line of the original and was judged improved, because its territory detected a real gap - no procedure for handing work over - that had gone unrecorded.\
It also showed the standard's weakest point: nothing stopped a territory from being well-formed and useless.\
The obligation that a territory be derived from its population and show a gap, or argue there is none, is the correction that trial made necessary.
**Since corrected:** the gap that trial found is held as a backlog row, and finding gaps is now the work of investigations; see *What a territory states*.
