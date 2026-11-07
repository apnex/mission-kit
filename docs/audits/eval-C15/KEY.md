# C15 entity-graph cold read - probes and frozen key

Frozen: the record of what was measured, never edited.\
Document under test: `components/C15-entity-graph.md`: the entry at `82115e6` (run 1), its revision of 2026-11-07 (run 2), and the final text after the review's fixes (run 3).\
Each key layer was written and hashed before any reader of its run, audited by a fresh agent, and corrected before any scoring; the hashes are in the local run folder's `key/KEY.sha256`.\
Run folder: `docs/evals/runs/2026-11-07-c15-cold-read`, local and never published.

---

## Probes

Answer every probe.\
For each answer, mark each claim as either SAYS (the document you hold states it - quote the words) or GUESS (your own inference or general knowledge).\
If the document does not settle something, say "not stated" rather than inventing an answer.\
After the probes, list anything you could not decide from what you hold, and any defect you noticed in what you hold.

Q1.\
You are building a browser diagram editor with a server.\
Entities: nodes; links (each link references exactly two nodes); groups (a group lists its member nodes, and a node may belong to at most one group).\
Rules: deleting a node deletes every link touching it and removes it from its group; a group left with fewer than two members dissolves; adding a node to a group removes it from any other group it was in.\
Both the browser (for instant previews and undo) and the server (for authoritative commits) must apply these rules.\
Your organisation keeps a registry of shared components.\
(a) Is there a registered unit that covers this, and how would each rule be expressed in it?\
(b) Can your project depend on it today?\
(c) What do you do now?

Q2.\
Your entity graph must survive a server restart, and you want an on-disk history you can compact.\
Does `entity-graph` do that?\
If not, what does, and how does `entity-graph`'s in-memory graph relate to it - including how the in-memory graph gets its contents after a restart?

Q3.\
Your browser client reaches the server only over the network and cannot open the server's store directly.\
How does the browser keep its own graph view current, and what makes its previews agree with what the server will accept?

Q4.\
You declare an invariant on routes: at most 10 waypoints, whose measure is the number of waypoints over 10.\
The store already holds route R with 14 waypoints.\
Edit A removes 2 waypoints from R. Edit B, planned separately against the original R, adds 1 waypoint to R. Edit C, planned separately against the original R, renames an unrelated node while R still has 14 waypoints.\
For each of A, B and C, does `plan()` accept or refuse it, and why?

Q5.\
Your domain also needs: at most two straight links between any pair of nodes.\
No reference-field option expresses this.\
How do you add the rule without changing `entity-graph`'s core, and what must you never do?

Q6.\
Each node's label must be a non-empty string of at most 40 characters.\
Which unit owns that check, and how does it relate to `entity-graph`?

Q7.\
Only a group's owner may delete that group.\
Does `entity-graph` enforce this?\
If not, what does?

Q8.\
User A changes node N's label from "x" to "y".\
Then user B's committed change sets N's label to "z", and it arrives at A's graph through `applyChange`.\
A now presses undo.\
What does `entity-graph` do?

Q9.\
(a) Does `reachable(fromId)` follow references only from referrer to target, or in both directions?\
(b) What does `ownerOf(memberId, containerKind)` return if the member is referenced by two containers of that kind?

Q10.\
Between `plan()` and `commit()`, another writer changes one of the entities the plan writes.\
What happens at commit, and what does `commit()` return to you?

---

## Run 1 key, with its audit corrections

Written before any reader ran, by an agent that did not author C15.\
Not shown to readers.\
Document under test: `components/C15-entity-graph.md` at mission-kit `82115e6`.\
There is no prior version, so the comparison is readers holding C15 against readers holding nothing.

Scoring 0 / 1 / 2 per probe.\
A claim the reader labels GUESS scores at most 1 unless the key below says the grounded answer is "not stated".\
Decision probes: Q1-Q7.\
Gap probes: Q8-Q10, plus the restart-load part of Q2 - the key answer is that the entry does not settle the point.\
A gap probe is not expected to separate readers; its job is to confirm whether a contract gap is real.

Separation margin, stated before the run: a decision probe separates if the mean score of readers holding C15 exceeds the mean of readers holding nothing by at least 0.75.

---

### Q1 - adopt

(a) Yes: `entity-graph` (C15).\
Mappings: link's node references `onTargetDelete: "cascade-delete"`; group `members` reference field with `cardinality: "many"` and `onTargetDelete: "unlink"`; `exclusivity: "steal"` for one-group-per-node; `minTargets: 2` with `onBelowMin: "cascade-delete"` for dissolve; the same pure `plan(intent)` runs in client (preview, undo) and host (commit).\
(b) No: status is `draft`; the repository is scaffolded with draft vision and contract, and awaits cold reading, director ratification and implementation before it is in force.\
(c) Do not hand-roll a separate client and server cascade planner (adjustment policy: never fork); record the requirement against `entity-graph`'s contract while its design is settled (adjustment policy step 1).\
What to do in the meantime if the project cannot wait is not stated by the entry; noting that gap earns credit and is not required.

2: (a) with at least three of the four rule mappings, and (b), and (c). 1: two of (a), (b), (c). 0: otherwise, including treating it as usable today with no other part right.

### Q2 - durability (decision part + gap part)

No: `entity-graph` is not a durable store.\
The durable append-only log is `C4` (`entity-store`).\
`entity-graph` layers over it: `commit` submits writes as one positioned `C4` `change`, and the in-memory view advances from `C4`'s change stream through `applyChange` in monotonic `position` order.\
How the in-memory view is first populated at start (snapshot, bootstrap, replay from position zero) is not stated.

2: not durable, routes to C4, states the layering, and says the initial load is not stated (or labels any load mechanism as a guess). 1: not durable and C4, but asserts a load mechanism as fact, or omits the layering. 0: says `entity-graph` persists.

### Q3 - another process

Run `entity-graph` in the browser, fed by `C6` (`entity-api`)'s change stream through `applyChange` in position order; the same pure `plan(intent)` is used for client previews and host commits, which is what makes them agree.\
Noticing that `C6` appears in the contract but not under Consumes earns credit and is not required.

2: both parts. 1: one part. 0: neither.

### Q4 - invariant measure

A accepted: a partial repair, measure falls from 4 to 2, and partial repairs are permitted.\
B refused: it increases an existing violation's measure (4 to 5).\
C accepted: it neither introduces a violation nor increases an existing one's measure.

2: all three right. 1: two right. 0: one or none.

### Q5 - domain rule seam

Express it as a pure kind `invariant` (`{ key, measure, sentence }`) and/or a pure `reaction` on the link kind's declaration row - a tenant row under `P4` - so the core gains no domain kind.\
Never fork or hand-roll a separate planner; if the seams cannot express it, record the gap against `entity-graph`'s contract (internal, so the fix goes upstream).

2: seam and never-fork (or route-upstream). 1: one of them. 0: neither, or "modify the core".

### Q6 - field validation routing

Per-record shape validation belongs to `C3` (`shape-check`); `entity-graph` is not a schema validator.\
Inside `entity-graph` the kind declares its closed-record shape and `C3` validates it.

2: `C3` owns the rule and `entity-graph` only carries or delegates it. 1: `C3` named without the relation, or `entity-graph` said to validate it while naming shapes. 0: `entity-graph`'s invariants named as the owner.

### Q7 - authorisation (control)

No: access policy is the application's; `entity-graph` is not an authorisation engine.

2: no, and the application. 1: no, without saying what does. 0: yes.

### Q8 - undo under an intervening write (gap)

Undo plans and applies the inverse of A's edit (label back to "x", derived from the pre-state immediately before A's write) through the same pipeline: `plan`, then `commit` with `expectedRevision` guards.\
Whether that inverse is refused because N's revision moved, or overwrites B's "z", or is rebased, is not stated.

2: names the pipeline and says the outcome under the intervening write is not stated. 1: names the pipeline but asserts one outcome as fact. 0: otherwise.

### Q9 - traversal semantics (gap)

(a) Direction of `reachable` is not stated; `filter` is optional and its shape is not stated.\
(b) `ownerOf` behaviour with two owners is not stated; only a declared `exclusivity` would make the owner unique.

2: both stated as not settled (an inference labelled GUESS is fine). 1: one. 0: both asserted as fact.

### Q10 - commit conflict (gap)

`C4`'s `expectedRevision` guard refuses the change and, being atomic, nothing lands.\
What `commit()` returns, whether the graph is left unchanged, and whether it re-plans are not stated.

2: refusal by the guard, and says the return or refusal shape is not stated. 1: one of those. 0: neither.

---

### Corrections after the key audit

Applied before any reader was scored.\
The audit's corrected text governs wherever it differs from the probe sections above.

**Separation is judged on decisions, not citations.**\
Each reader gets two scores per probe: a decision score (0-2, no GUESS cap) and a grounded score (0-2, GUESS cap applied).\
A decision probe separates only if the mean decision score of readers holding C15 exceeds that of readers holding nothing by at least 0.75.

**Q7 is a reader-capability check**, reported outside the decision-probe tally.

#### Q1 (wrong)

(a) and (b) unchanged.\
(c) Do not hand-roll separate client and server cascade planners or reverse indices (step 3, 'Never fork').\
All four rules can be expressed with declared options, so step 1 (record a requirement the declaration cannot express) does not apply.\
Recording the requirement is acceptable, but it is not required and step 1 does not prescribe it here.\
The entry does not say what to do while the component is unbuilt.\
Grounded next steps include waiting for, or helping drive, the 'cold reading, director ratification and implementation' the status line names, and making the project known as a consumer (C15 lists candidate consumers; C0: 'A component is admitted when a consumer needs it').\
Score (c) as present when the answer gives never-fork plus any one of those next steps, or never-fork plus a statement that the interim path is not stated.\
Do not mark down a reader who says step 1 does not apply.

#### Q7 (unfair)

Answer unchanged: No. Line 24 assigns 'decide who is authorised to act' to 'the application's policy', and line 77 says 'not an authorisation engine - enforce access policy in the application'.\
Per-reader scoring unchanged (2: no, and the application; 1: no, without saying what does; 0: yes).\
For separation, judge Q7 on the decision alone, without the GUESS cap: a reader holding nothing who says 'no, the application' has made the same decision.\
Expect it not to separate, and do not count it in C15's favour.\
Better still, report it as a reader-capability check outside the decision-probe tally.

#### Q8 (wrong)

Stated in the entry: undo uses the inverse of A's edit (label back to "x", 'derived from the pre-state immediately before each forward write') and 'plans and applies the inverse through the same pipeline' (line 37).\
Inferred, not stated: that undo reverses A's own edit rather than B's change, since inverses come from 'each planned transaction' and B arrived through applyChange.\
Not stated: whether 'the same pipeline' ends in a C4 commit or only in the in-memory view (line 62 groups undo/redo with client-side optimistic previews); which revision any expectedRevision guard would carry; and so whether the undo is refused, overwrites B's "z", or is rebased. 2: gives 'plans and applies the inverse through the same pipeline' and says the outcome under the intervening write is not stated.\
Naming commit with expectedRevision guards is fine only if it is labelled GUESS. 1: names the pipeline but asserts one outcome as SAYS, or asserts as SAYS that undo commits with guards. 0: otherwise.

#### Q9 (incomplete)

(a) The entry never defines which direction `reachable` follows, or the shape of `filter`.\
Line 60 lists it among 'fast synchronous reverse lookups (`referrersOf`, `ownerOf`, `reachable`)' and leaves out the forward `targetsOf`.\
That is evidence it follows references back from target to referrer, so it is not forward-only, but it does not settle reverse-only versus both directions.\
Full credit for (a): 'not stated', or a quote of line 60 with an inference of reverse traversal that also says the direction is not defined.\
Not credited: 'referrer to target only' or 'both directions' asserted as SAYS.\
(b) Unchanged: behaviour with two containers is not stated; only a declared `exclusivity` would make the owner unique. 2: both handled as above. 1: one. 0: neither.

#### Q10 (wrong)

Stated in the entry: commit submits plan(intent)'s writes to C4's atomic multi-entity change 'with `expectedRevision` guards' (line 38).\
If those guards carry the revisions the plan saw, the other writer's change makes the guard refuse, and because the change is atomic nothing lands.\
Not stated: whether commit reuses the earlier plan or re-plans the intent at commit time (it takes `intent`, not a plan result).\
If it re-plans on a view that has already applied the other change, the guard may match and the commit succeed, or plan may refuse on the new state.\
Also not stated: which revisions the guards carry, what commit() returns (the `{ ok, ... }` shape is stated for plan only), whether the in-memory graph is left unchanged, and whether anything retries. 2: names the guard as the mechanism that refuses a write against a moved entity, with nothing landing, and says commit()'s return is not stated.\
An answer that says refusal itself depends on unstated re-planning also satisfies the first part. 1: one of those. 0: asserts a silent overwrite, or asserts a return shape or automatic retry as SAYS.

---

## Run 2 key changes, with their audit corrections

Written before any run-2 reader ran, by the agent that revised C15, so ties go to the original.\
Document under test: the revised `components/C15-entity-graph.md` (copy in `reader-v2/C15.md`).\
Baseline: run 1's answers and scores for the entry at `82115e6`, scored against `KEY-corrected.md`.

`KEY-corrected.md` governs every probe of run 2, with its decision and grounded scores and its GUESS cap, except where this file says otherwise.\
The exceptions below exist because the director's rulings of 2026-11-07 changed what the entry is meant to say: the contract is stated at the level the vision commits to, and mechanism, option names and method names are design owed.\
For each exception, an answer that gives the run-1 key's answer and labels the specific option or method as design owed or not stated in the entry is also fully right.

### Q1 - adopt (changed in part)

(a) Yes, `entity-graph`; each rule is declared on the kinds as a reference rule, a condition over the entities, or a consequence the application states.\
The entry no longer names reference options, so "which option expresses each rule is design owed, or not stated" is the grounded answer; naming options as GUESS is fine.\
(b) No: `draft`, no code, design owed, not in force, registered under `0116` (proposed).\
(c) Stated now: keep the implementation the project already has, start no new one, and record the requirement against `entity-graph`'s `CONTRACT.md` under *Design owed* (adjustment policy step 1); never fork.

2: (a) the unit, with the rules mapped to declared rules, conditions or consequences (options as design owed or GUESS), and (b), and (c). 1: two of the three.

### Q8 - undo under an intervening write (changed)

The entry states that an undo is an edit like any other and keeps every commitment, and that how concurrent conflicting edits are resolved is design owed. 2: says the outcome under the intervening write is design owed or not stated, grounded in either statement. 1: asserts one outcome as SAYS.

### Q9 - traversal semantics (changed)

(a) The entry says only "what can be reached from it by following references"; direction is not stated.\
(b) The entry names no `ownerOf`; behaviour with two containers is not stated, and the lookup surface is design owed. 2: both not stated (a labelled GUESS is fine). 1: one. 0: both asserted as SAYS.

### Q10 - commit conflict (changed)

The entry states that an edit lands in `C4` whole or not at all and an edit that does not land leaves every answer as it was; how a host lands an edit whole is design owed, and what a commit returns is not stated. 2: whole-or-nothing with nothing landing on refusal, and says the return or mechanism is design owed or not stated. 1: one of those.

### Probes unchanged

Q2-Q7 keep `KEY-corrected.md`.\
In Q4 the entry now says "no edit may leave a rule more broken than it found it, and a partial repair is allowed" without the word measure; mapping the probe's measure onto that sentence is grounded.

---

### Corrections after the run-2 key audit

Applied before any run-2 reader was scored; where a correction below speaks to a probe, it replaces every earlier key text for that probe in full.

**Inherited text.**\
Any earlier key text that quotes wording, method names or mechanism absent from the revised document is read as GUESS if a reader asserts it as SAYS, and a reader is never marked down for saying the revised document does not state it.

#### Q1 (incomplete)

Q1 replaces KEY-corrected Q1 in full.

(a) Yes, `entity-graph` (L16, L25, L73 names these exact consequences).\
The rules that act - deleting links, removing from a group, dissolving, moving between groups - are declared on the kinds as reference rules or as consequences (L38).\
A condition refuses (L40), so it fits 'at most one group' only as a refusal, not as dissolve or move.\
Which reference rule or consequence carries each rule is design owed (L47).\
Naming run-1 options is fine as GUESS.\
Credit (a) when the answer gives the unit and places at least three of the four rules as reference rules or consequences, or says that the placement is design owed.\
A dissolve or move mapped only to a condition does not count toward the three.

(b) No. Credit any one of: draft, no code, not in force, no consumer depends on it (L16-L18).\
Citing `0116` is not required.

(c) Stated (L19, L101, L103): start no new implementation, record the requirement against `entity-graph`'s contract (CONTRACT.md under *Design owed*), and never hand-roll a second planner or reverse index.\
Credit (c) for recording the requirement plus either starts-no-new-one or never-fork.\
Do not require 'keep the implementation it already has': the probe does not say the project has one.\
Give full (c) credit, and record it as a finding, when a reader notes that the entry gives no path for a project with no implementation and cannot use `entity-graph` yet.\
Also credit a reader who notes that step 1 is worded for requirements the declaration cannot express, provided they follow L19 and record the requirement.\
Waiting for ratification and implementation, or becoming a candidate consumer, are acceptable additions but do not replace recording.

Scoring. 2: (a), (b) and (c). 1: two of them. 0: otherwise, including treating the component as usable today.

#### Q2 (wrong)

No. `entity-graph` does not keep the durable record (L28).\
Durable storage of entities, positions and history belongs to C4, which it sits over (L87).\
C4 also owns compaction; C15 itself only says 'history'.

Layering as the revised entry states it: a planned edit lands in C4 whole or not at all (L42).\
Every change that reaches the store is taken in from C4, or through C6, in position order, so answers stay true at the position they report (L42).\
C15 consumes C4's positioned writes and ordered change stream (L113).

The entry no longer names `commit`, `applyChange` or one C4 `change`, and does not say the graph is in-memory.\
Treat those words as GUESS if a reader asserts them as SAYS.\
Credit, never penalise, a reader who notes that the probe's 'in-memory' premise is not stated.

How the view is populated after a restart is not stated.\
It is not among the four design-owed points, and 'taken in ... in position order' does not settle it.

Scoring. 2: not durable, routes to C4, states the layering in the terms above, and says the initial load is not stated (or labels any mechanism GUESS). 1: not durable and C4, but asserts a load mechanism as SAYS or omits the layering. 0: says `entity-graph` persists.

#### Q3 (wrong)

Part 1: the browser keeps its `entity-graph` view current from C6's change stream, taken in in position order (L42, L113).

Part 2: browser and server work from the one declaration, stated once as data, which every answer and plan uses (L38).\
The same rules therefore judge the preview and the commit.\
Removing the preview/commit duplication (L74) and the drift between client and server copies (L103) is the component's stated purpose.\
Credit 'the same planner or rules on both sides' as grounded in L38 and L103.

The entry no longer names `applyChange` or `plan(intent)` and does not call the planner pure; treat those words as GUESS if asserted as SAYS.

Credit, but do not require:
- a preview judged at the browser's position can still differ from the server's verdict if the store has moved, since concurrent conflict resolution is design owed (L46);
- the overlap with C6's deferred dated-local-view (L114).

Delete the note crediting 'C6 not under Consumes'.\
L113 lists C6, and that claim earns nothing.

Scoring. 2: both parts. 1: one. 0: neither.

#### Q4 (incomplete)

A is accepted: R goes from 14 to 12, less broken, and a partial repair is allowed (L40, L79).

B is refused: R goes from 14 to 15, so the edit leaves the rule more broken than it found it (L40).

C is accepted: R is unchanged at 14, so the rule is not left more broken (L40).

The entry does not define how 'more broken' is compared, because invariant shape is design owed (L47).\
Reading it as the probe's declared measure is the intended reading.\
It earns full grounded credit whether the reader marks it SAYS or labels it inference or GUESS, so the GUESS cap does not apply to this mapping.\
Also give full credit to a reader who decides B refused under the declared measure and notes that a count of violated routes would not change.

Scoring. 2: all three right. 1: two right. 0: one or none.

#### Q5 (wrong)

Declare the rule on the link kind as a condition (it refuses a third straight link between a pair), or as a consequence, as a P4 tenant row, so the core gains no domain kind (L49, L102).\
L102 uses this exact example.

Never fork: never hand-roll a second reverse index or change planner in client and server code (L103).\
Never add a domain kind to the core (L49).\
If the declaration cannot express the rule, record it in CONTRACT.md under *Design owed* (L101).

The entry no longer names `invariant { key, measure, sentence }`, `reaction` or purity, and L47 makes invariant shape design owed.\
Run-1 names are fully right only if labelled design owed or GUESS.

Scoring. 2: seam and never-fork (or route upstream). 1: one of them. 0: neither, or 'modify the core'.

#### Q8 (unfair)

Stated:
- Undo is a later edit that restores every entity the undone edit changed 'as it was before' (L41).
- It is an edit like any other, so it is held to the rules and lands whole or not at all (L41, L42, L81).
- So undoing A's edit restores N's label to 'x', which replaces B's 'z'.

Not stated:
- whether that replacement is intended when another user's change intervened, or whether the undo should be refused or merged instead. L46 leaves 'how concurrent conflicting edits are resolved' design owed, and whether a change taken in before the undo was planned counts as concurrent is not stated.
- which landed edit an undo targets: no undo stack or per-user history is named.
- `applyChange`, which is no longer named.

Scoring. 2: either (i) or (ii).
- (i) The outcome under the intervening write is design owed or not stated, grounded in L46 or in the absence of a rule.
- (ii) L41's restore to 'x', replacing 'z', reported as SAYS with the quote; a note on the open point is welcome but not required.
1: asserts as SAYS an outcome L41 does not give: refused because N's revision moved, rebased or merged, B's 'z' kept, or undo reversing B's change. 0: otherwise.

Record a reader split between (i) and (ii) as a finding against the entry.

#### Q9 (incomplete)

(a) The entry says only 'what can be reached from it by following references' (L39), and the lookup surface is design owed (L47).\
Full credit for either:
- 'not stated', or
- 'following references' read as referrer to target, with the words quoted, whether marked SAYS or inference.
Not credited when asserted as SAYS: 'both directions', or target to referrer.\
The revised text gives no ground for either.

(b) The entry names no `ownerOf`.\
Behaviour with two containers is not stated, and lookup methods are design owed (L47).\
Do not penalise a reader who adds that the stated 'what refers to it' answer would include both containers.

Scoring. 2: both handled as above. 1: one. 0: neither.

#### Q10 (incomplete)

Stated:
- An edit lands in C4 whole or not at all, and one that does not land leaves every answer as it was (L42, L39).
- C15 consumes C4's expected-revision guards (L113).

Design owed: how concurrent conflicting edits are resolved, and how a host lands an edit whole (L46).\
Whether this commit is refused, overwrites the other writer or re-plans is therefore not settled.\
'The guard refuses it' is an inference from L113.

The return value is not stated, and the entry names no `commit()`.\
L80 says a refusal names the rule, the entity and the part of the edit.\
Whether a conflict refusal takes that form is not stated, since a conflict breaks no declared rule.

Scoring.
- 2: whole or nothing, with nothing landing if it does not land, plus the conflict outcome or the return given as design owed or not stated. Quoting L80 for refusal content counts toward 2 if the reader notes, or does not deny, that it may not cover a conflict.
- 1: one of those.
- 0: asserts a silent overwrite as SAYS, or an automatic retry or a return shape as SAYS with no textual basis. L80 is a textual basis.

---

## Run 3 key changes, with their audit corrections

Written before any run-3 reader ran, by the agent that revised C15, so ties go to the original.\
Document under test: the final `components/C15-entity-graph.md` (copy in `reader-v3/C15.md`), revised after run 2 in answer to its readers and to an adversarial review.\
`KEY-v2-corrected.md`, with the earlier keys it builds on, governs every probe except the two below, which change because the final text now states what run 2's readers found missing.

### Q1 - adopt (part c changed)

(a) and (b) as in `KEY-v2-corrected.md`.\
(c) Stated now: the probe's project has no implementation, so it starts none of its own, takes its need to `entity-graph`'s design effort, and records any requirement the contract does not yet state (*Adjustment policy*, step 1); never fork.\
Credit (c) for: no implementation of its own, plus taking the need to the design effort or recording requirements, plus never fork or starting none.\
A reader who still finds no usable path for a project that cannot wait is credited and the point recorded as a finding; the entry says what to do, not how long it takes.

### Q6 - field validation routing (credit widened)

A rule on one record's own fields belongs to its kind's shape, judged by `C3` (`shape-check`), or to the application where a shape cannot state it; `entity-graph` only carries the declared shape. 2: `C3` (or the application where a shape cannot state the rule) owns it, and `entity-graph` only carries or delegates it. 1: `C3` named without the relation. 0: `entity-graph`'s own conditions named as the owner.

---

### Corrections after the run-3 key audit

Applied before any run-3 reader was scored; a correction below replaces every earlier key text for its probe in full.

#### Q1 (incomplete)

(a) and (b) as in KEY-v2-corrected, except 'L73 names these exact consequences' becomes 'L73 names three of the four (links of a deleted node, leaving a group, dissolving); the move rule is not named there'.\
(c) The probe does not say whether the project already has an implementation of these rules, so L19 applies by branch.\
The project starts no implementation of its own.\
If it has one, it keeps it until entity-graph is usable and then moves onto it (L103).\
If it has none, it takes its need to entity-graph's design effort.\
Either way it records any requirement the contract does not yet state (step 1, L101).\
It never forks (L103).\
Credit (c) when the answer gives (1) no new implementation, or never fork, and (2) the L19 action for the branch it takes, or for both branches.\
Recording an unstated requirement is accepted in place of (2), and so is a reasoned statement that the contract already states these rules.\
If a reader asserts that the project has, or lacks, an implementation, mark that premise GUESS but do not mark the answer down for it.\
A reader who finds no usable path for a project that cannot wait still gets (c) credit, and the point is recorded as a finding.\
Scoring as KEY-v2-corrected.

#### Q2 (incomplete)

As KEY-v2-corrected Q2, except for the restart sentence and the 2-line.\
Restart: how the view is populated after a restart is not stated.\
It is not among the five open points L46 names, but L45 makes how each row is achieved the design effort's, so 'design owed', citing L45, is equally right.\
'Taken in ... in position order' (L42) does not settle it.\
C15 itself never mentions compaction or disk.\
The statement that C4 compacts comes from C4's entry, so a reader who says compaction is not stated here is right. 2: not durable, routes to C4, states the layering, and says the initial load is not stated or design owed (or labels any mechanism GUESS).

#### Q3 (wrong)

Part 1 unchanged: the browser keeps its view current from C6's change stream, taken in in position order (L42, L113).\
Part 2: browser and server work from the one declaration, stated in one place and as data wherever data can say it, and every answer and every plan works from it (L38).\
The same rules therefore judge the preview and the commit (L38, L74, L103).\
Do not credit as SAYS that the whole declaration is data, or that the same declaration data is loaded on both sides.\
L38 allows for parts that are not data, and how the declaration reaches the browser is not stated.\
Credit these, but do not require them: a preview is shown apart and states the position it was planned from (L39), so it agrees with the server only as of that position; how a C6-only client lands an edit, and how concurrent conflicting edits are resolved, are design owed (L46); C15's dated view may overlap C6's deferred dated-local-view (L114).\
Scoring unchanged: 2 for both parts, 1 for one, 0 for neither.

#### Q4 (incomplete)

A accepted (L40, L79) and C accepted (L40), whatever the measure.\
B is refused under the probe's declared measure, because R goes from 4 over to 5 over and is left more broken (L40).\
L47 now lists 'how brokenness is measured' as design input, not contract, so whether a declared measure decides 'more broken' is design owed.\
Under a count of violated routes, B would not be more broken.\
Count B right for any of these: a reader who decides refused under the declared measure (any label, no GUESS cap on this mapping); one who gives the conditional, refused if the declared measure is how brokenness is measured, which L47 leaves design owed; or one who decides refused and notes the count-of-violated-routes alternative.\
A bare 'not stated' for B, with no verdict under the declared measure, is not right.\
For the decision score, a conditional verdict counts as a decision.\
Do not mark down a reader who notes that, if waypoints are a field of the route, L102 sends the limit to the kind's shape (C3), provided they answer under the probe's premise.\
Scoring unchanged: 2 for all three right, 1 for two, 0 for one or none.

#### Q6 (unfair)

Answer as KEY-v3.\
Grounded score as KEY-v3, with C3 named and grounded in L38, L88 or L102.\
Decision score, with no citation required: 2 when the answer routes the check to a per-record shape or schema validator, or to the application where a shape cannot state it, and says entity-graph only carries the declared shape or delegates the check.\
For a reader holding C15 that validator is C3; for a reader holding nothing, a separate shape or schema validator. 1 when the routing is right but the relation to entity-graph is missing. 0 when entity-graph's own conditions are named as the owner.\
Naming C3 counts only toward the grounded score.\
Before reusing run 1's readers holding nothing as the Q6 baseline, re-score their decisions (R1, R4) on this line.
