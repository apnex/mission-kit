---
id: E4
category: entity
title: charter - the document that voices a set, and the questions only it can answer
status: active
hydrate-when: You are writing or revising a charter, or deciding whether a section belongs in one
supersedes: []
related: [E3, E2, A3, S0]
---

# E4 - charter

## Definition

A **charter** is the document through which a [`set`](E3-set.md) speaks.\
It states what the population owes itself - the things no member has standing to say and no member could know.

A member answers *what am I, and how do I apply.*\
A charter answers *what is this population for, what belongs in it, how do its members relate, and how would you know it was wrong.*

Every knowledge layer's charter is its `<prefix>0` entry, held at `<directory>/README.md`.\
A set with no charter is a directory listing: it can be checked for validity and never for completeness, because nothing states what the collection is for.

**A charter holds the set's vision, and manages the set against it.**\
The vision is what the set is for and what it claims to cover; the population is measured against it, as a programme is measured against its [vision](../artifacts/AR6-vision.md), and it is never cut to fit what the set holds today.\
The rest of the charter is management: the territory shows where the population stands against the claim, the boundaries decide what enters and where the rest goes, the faults say how the set goes wrong, and changes to any of it are made under *Changing a charter*, below.\
A claim no member yet fills is a gap - the distance between the population and its charter - and naming it is how gaps are found.

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
| **Purpose** | Why does this set exist, and what goes wrong without it? | A member knows why *it* exists, never why the collection does | heading `Purpose` |
| **Territory** | What does this set claim to cover? | Completeness is a property of the population; a member cannot see its siblings' absence | heading `Territory` |
| **Boundaries** | What belongs here, what does not, and where does the excluded thing go instead? | An exclusion decides a case no member holds | anywhere |
| **Composition** | How do members relate to one another? | A relation has two ends, and a member holds one | anywhere |
| **Faults** | What does an unhealthy population look like, as against a merely valid one? | Every member can be valid while the set is wrong | heading `Faults` |
| **Index** | What is in it? | Generated, never typed | heading `Index` |

**Where the location is fixed and where it is free.**\
The rule is derived from what thirteen charters actually do rather than chosen in advance: **where every set asks the same question and answers it in the same form, the heading is fixed; where the form of the answer varies by set, the answer is required and its heading is free.**

Purpose, Territory, Faults and Index are the same question in every set and are answered in the same form, so each takes a fixed heading.\
A fixed heading makes the answer addressable - it can be linked, checked by a script, and seen by a reader skimming the spine - which is the corpus's own reachability property applied to the charter.\
Purpose is the clearest case: every charter answers it, nearly always in untitled opening paragraphs, and an untitled answer is invisible to everything except a full read.

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
**Relations to other sets belong here.**\
A set defining itself against a neighbour is stating a boundary, and every observed instance of an inter-set relation takes that form.

**Two kinds of fault, and only one belongs in a charter.**\
A **population fault** is visible only across the set - a member admitted for importance rather than fit, two members restating one rule, a population that has stopped being searched.\
A **member fault** is a failure mode of one member's invariant, and belongs in that member, where a reader meets it while doing the thing that risks it.\
Collected in a charter, member faults are read only by people already looking for them.\
The `Faults` concern is for population faults alone.

**A territory must earn itself.**\
Requiring a territory is checkable; requiring a *good* one is not, and a poorly chosen territory passes every check while hiding the gaps it exists to expose.\
So a territory carries two obligations beyond being present.

- **Its partition is derived from the population; its extent is set by purpose.** The axes should be readable from the members themselves - their triggers, their subjects, the moments or risks they address - so that every existing member lands in it and lands in exactly one place. A member that fits nowhere, or fits everywhere, is evidence the partition is wrong. How far the territory reaches is set by what the set is for, not by what it holds: a cell no member fills is kept and named as a gap, and removing it to match the population erases the gap it exposes.
- **It shows a gap or argues that there is none.** A territory that names at least one real, checked absence has demonstrated that it can detect one. A territory that names none must say why the population is complete against it. A territory that can do neither is decoration, however complete it sounds.

More than one partition is usually defensible, and choosing among them is a judgement this entry cannot make.\
The two obligations do not pick the right partition; they rule out the ones that cannot do the job.

**Growth must be paid for.**\
Conforming a charter usually lengthens it, because the concerns most often missing - territory and composition - are the ones that need authoring rather than moving.\
Length is acceptable when it is paid for, and only then.\
An added passage is paid for when it **answers a question the charter could not previously answer**, and when that answer **improves what a reader can do with the charter** - route an item, find a gap, choose a member, or see a relation they would otherwise have had to reconstruct from the members.\
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
They belong here rather than in the procedure that runs them, because what good looks like is specific to each set: a good axiom charter lets a reader find which kind of failure has no protector, and a good methodology charter lets a reader choose the procedure for the moment they are in.\
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

A charter is changed to make it the best version of itself in context, and its existing words may be improved where improving them advances that.\
What is preserved is meaning, and the check on meaning is as strict as a check on words would be: **every changed or removed sentence is accounted for.**

| Change | Permitted | Evidence the change carries |
|---|---|---|
| **move** | yes | none |
| **reword** | when it materially improves clarity or precision | old and new side by side, and the reason |
| **merge** | when two passages state one thing | both originals, and why one suffices |
| **correct** | when an error or contradiction is exposed | the error cited, and the old text kept in the record |
| **delete** | only when the claim is wrong, unpaid, or held elsewhere | the claim, and which of the three applies |

Every edit is weighed for cost against quality.\
Changing settled text has a real cost - it invalidates a reader's memory and puts reasoning at risk - so an edit is made when it advances the document, and a marginal one is not made.\
An added passage is held to the same test as any growth: it answers a question the charter could not, and improves what a reader can do.

A change that would alter what a reader decides is tested before it is ratified, by the procedure in [`M2`](../methods/M2-test-drive-docs-by-execution.md), against the charter's probes and with the previous version as the comparison.\
The author's own reading of old against new is not that test.\
The previous version stays recoverable at its commit, so the record of what a charter said is never lost where the charter no longer says it.

**An earlier rule preserved every original sentence character for character, and was withdrawn.**\
It proved nothing was lost and capped every revision at the original plus an appendix.\
Its decisive failure was a sentence it forbade fixing: the sentence was ambiguous, the rule allowed only flagging it, and the flag recorded a contradiction that did not exist.\
Fixing the sentence removed both the ambiguity and the paragraph that had been defending a false conflict, and the charter got shorter.

---

## Boundaries

It is **not a template.**\
Four concerns take a fixed heading because every set asks them in the same form; the rest of a charter is organised as its set is organised.\
Two conformant charters share those four headings and may share nothing else.

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
`E3` names what a set owns: territory, member relations, admission and retirement, placement and naming, and the health of the population.\
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
The split between fixed and free headings is the correction: it keeps the four answers that are always the same form checkable by a script, and refuses to flatten the two whose form is the content.

A trial conversion of one charter then tested the standard against a real population before any other charter was touched.\
It preserved every line of the original and was judged improved, because its territory detected a real gap - no procedure for handing work over - that had gone unrecorded.\
It also showed the standard's weakest point: nothing stopped a territory from being well-formed and useless.\
The obligation that a territory be derived from its population and show a gap, or argue there is none, is the correction that trial made necessary.
