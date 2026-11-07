# entity-graph vision cold read - probes and frozen key

Frozen: the record of what was measured, never edited.\
Document under test: `apnex/entity-graph` `VISION.md`: the draft at `bf078b4` (run 1), its revision of 2026-11-07 under the director's rulings `D2` to `D6` (run 2), and the final text after the review's fixes (run 3).\
Each key layer was written and hashed before any reader of its run, audited by a fresh agent, and corrected before any scoring; the hashes are in the local run folder's `key/KEY.sha256`.\
Run folder: `docs/evals/runs/2026-11-07-entity-graph-vision-cold-read`, local and never published.

---

## Probes

Answer every probe.\
For each answer, mark each claim as either SAYS (the document you hold states it - quote the words) or GUESS (your own inference or general knowledge).\
If the document does not settle something, say "not stated" rather than inventing an answer.\
After the probes, list anything you could not decide from what you hold, and any defect you noticed in what you hold.

V1.\
A contributor proposes that `entity-graph` write a snapshot of its indices to disk so that start-up is fast.\
Admit or refuse the proposal, and why?

V2.\
A contributor proposes a built-in `link` kind with `from` and `to` fields, because every consumer so far draws diagrams.\
Admit or refuse, and why?

V3.\
A consumer wants `entity-graph` to check that the current user is allowed to delete a group.\
Admit or refuse, and if refused, where does that check belong?

V4.\
Two users edit the same entities concurrently.\
A proposal says `entity-graph` should merge their conflicting edits automatically.\
Does the document admit it, refuse it, or leave it unsettled?\
Quote whatever bears on it.

V5.\
An implementation's reverse indices always agree with a fresh full scan, but each reverse lookup scans every entity.\
Does it meet what the document counts as success?\
Why?

V6.\
A planner checks referential integrity after each individual operation in a batch, so it refuses a batch whose second step leaves a reference dangling for a moment even though the batch's final state is valid.\
Is that consistent with the document?

V7.\
You hold this document.\
May you cite it to register `entity-graph` in a component registry, or to approve a change to its contract?\
Who may change the document, and how?

V8.\
Later design work finds that maintaining reverse indices incrementally from the change stream is a poor fit for the client, and that recomputing them on demand behind a cache meets the goals better.\
Does the document as written allow that design?\
If not, what would have to happen first?

V9.\
Name ways `entity-graph` could fail by the document's own measure even though it is fully implemented and fast.

V10.\
Which unit owns each of these: (a) carrying changes between processes; (b) checking that one entity's own fields fit its schema; (c) the rule "at most two straight links between any pair of nodes", which depends on node coordinates?

---

## Run 1 key, with its audit corrections

Written before any reader ran, by an agent that did not author the vision.\
Not shown to readers.\
Document under test: `VISION.md` in `apnex/entity-graph` at `bf078b4`.\
There is no prior version, so the comparison is readers holding the vision against readers holding nothing.

Scoring 0 / 1 / 2 per probe.\
A claim the reader labels GUESS scores at most 1 unless the key says the grounded answer is "not stated".\
Decision probes: V1-V3, V5-V10.\
Gap probe: V4 - the key answer is that the vision does not settle merging; its job is to confirm whether the gap is real.

Separation margin, stated before the run: a decision probe separates if the mean score of readers holding the vision exceeds the mean of readers holding nothing by at least 0.75.

---

### V1 - snapshot to disk

Refuse: "Not the durable store.\
It writes no files, keeps no append-only log on disk"; durability, history bounds and log compaction belong to `entity-store` (`C4`).

2: refuse, and `entity-store` (or the store beneath) owns it. 1: refuse without the owner, or the owner without refusing. 0: admit.

### V2 - built-in link kind

Refuse: "No kind and no reference rule is built in."\
The Reuse dimension requires a non-visual consumer to adopt it "without a fork or a domain-specific branch in the core".

2: refuse, citing no built-in kinds or the Reuse dimension. 1: refuse on general grounds only. 0: admit.

### V3 - permission check

Refuse: "Not an authority.\
It never decides which principal may make a change; the application's policy decides before committing, and `access-grants` (`BL20`) is a separate concern."

2: refuse, and the application's policy (or `access-grants`). 1: refuse only. 0: admit.

### V4 - automatic merge (gap)

Not settled: no sentence admits or excludes merging concurrent edits.\
Nearest text: "One atomic change means the planned forward writes either land together ... or are refused whole with a structured explanation, leaving the live graph untouched."\
That constrains a single commit, not reconciliation between users.

2: says it is not settled, and cites the land-or-refuse-whole commitment as the nearest constraint. 1: asserts refuse or admit as fact while citing that commitment. 0: neither.

### V5 - exact but slow

No. Leanness requires reverse lookups to be synchronous and O(1) or O(degree).\
The dimensions "are not weighted, and they do not collapse", so meeting Exactness does not make up for failing Leanness.

2: no, citing Leanness and that the dimensions do not collapse. 1: no with one of those. 0: yes.

### V6 - per-step checking

No. Referential integrity and invariants are "evaluated once on the resulting post-cascade state, never per intermediate step", and "a batch may pass through a transient state that would be illegal on its own and still end valid".

2: no, with the resulting-state rule. 1: no without it. 0: yes.

### V7 - authority

No: "Holding this document authorises nothing.\
It does not ratify a decision, admit a component to any registry, or approve a contract change."\
Held by the director; drafted by anyone and ratified only by the director; a change of direction is recorded as a decision first and absorbed afterwards, never quietly rewritten.

2: both halves. 1: one. 0: neither.

### V8 - a different index mechanism

As written, no. The vision commits to an in-memory graph whose "every forward and reverse reference index lives in memory", indices "maintained incrementally off the change stream" ("Why it exists"), synchronous side-effect-free traversals, and index maintenance in O(changed references) (Leanness).\
Recompute-on-demand contradicts at least the incremental-maintenance sentence and the maintenance bound.\
Adopting it needs a ruling recorded as a decision and then absorbed into the vision by the director.

2: identifies the binding text, and routes the change to a recorded decision and amendment. 1: one of those. 0: says the vision is silent or that the design may simply proceed.

### V9 - failure by its own measure

Any of: an index disagrees with a fresh full scan, or a rejected plan mutates the live view (Exactness); incremental edits, batch imports, client previews and server commits disagree (Single-source rules); `drawv2` or a non-visual consumer such as one over `zorg` must fork it or add a domain branch to the core (Reuse).

2: at least two dimensions other than Leanness, each with its observable failure. 1: one. 0: none, or only speed.

### V10 - ownership

(a) `entity-api` (`C6`), `operation-call` (`C5`) and `agp` (`C1`).\
(b) `shape-check` (`C3`).\
(c) Grid arithmetic is `snap-grid` (`C11`)'s, but the capacity rule is supplied by the application as a pure reaction or invariant function on that kind's row, which `entity-graph` runs while knowing nothing of coordinates.

2: all three, including the split in (c). 1: (a) and (b), or (c) with one other. 0: otherwise.

---

### Corrections after the key audit

Applied before any reader was scored; the audit's corrected text governs where it differs.

**Separation is judged on decisions, not citations.**\
Each reader gets a decision score (0-2, no GUESS cap, quoting not required) and a grounded score (0-2, key rules and GUESS cap).\
A decision probe separates only if the mean decision score of readers holding the vision exceeds that of readers holding nothing by at least 0.75.

#### V1 (unfair)

Refuse.\
Reason: "Not the durable store.\
It writes no files, keeps no append-only log on disk".\
The vision gives durability, history bounds, repeat recognition and log compaction to entity-store (C4).\
It does not say who would hold a snapshot of graph indices, and it does not address start-up cost. 2: refuse, grounded in 'Not the durable store' or 'writes no files'.\
Naming entity-store as the owner of durability is acceptable but not required, and 'who owns an index snapshot is not stated' also earns 2. 1: refuse on general grounds without the vision's boundary. 0: admit.

#### V3 (unfair)

Refuse: 'It never decides which principal may make a change; the application's policy decides before committing'. 2: refuse, and the check belongs to the application's policy, made before committing.\
Mentioning access-grants (BL20) as a separate concern is fine. 1: refuse with access-grants as the only owner named (the vision calls it 'a separate concern', not the place the check runs), or refuse with no owner. 0: admit.\
Separation: compute it on the decision (refuse, and the application owns the check), not on quoting.\
Record before the run that V3 is expected not to separate.

#### V4 (incomplete)

Not stated: no sentence admits or excludes automatically merging concurrent conflicting edits.\
Any of these sentences bears on it: l.32 (writes land together or are refused whole); l.25 (each intent is evaluated against the current state); l.30 (the planner refuses edits that introduce or worsen a violation); l.38 with l.59 (the store orders changes by position, and entity-graph assigns none itself); l.52 (it applies incoming positioned changes); l.86 (previews and commits never disagree, which is about rules, not reconciling states); l.64-66 (not a transport).\
Each constrains how a single intent is planned, committed or ordered, and none decides merging. 2: not stated, plus at least one bearing sentence quoted and read as constraining without settling. 1: not stated with nothing quoted, or admit/refuse asserted as SAYS while citing a bearing sentence. 0: claims some sentence explicitly settles merging, or asserts admit/refuse with no bearing text.

#### V8 (incomplete)

As written, no. Any of these is binding text: l.41 (without an incremental reverse index, a lookup must scan every record, which is the problem the component exists to solve); l.45 (reverse indices are 'maintained incrementally off the change stream'); l.89 (lookups O(1) or O(degree): a cache miss that recomputes is a full scan; whether the maintenance bound is also broken can be argued); l.22-23 (indices live in memory; traversals are synchronous and side-effect-free).\
Route: a ruling is recorded as a decision first and then absorbed into the vision.\
Anyone may draft the amendment; only the director ratifies it; it is amended, never quietly rewritten. 2: names any binding sentence, and routes the change through a recorded decision followed by an amendment. 1: one of those. 0: says the vision is silent, or that the design may simply proceed.

#### V9 (incomplete)

Count a dimension when the reader names an observable failure in it.\
Exactness: an index disagrees with a fresh full scan after commits, undo/redo or streamed changes, or a rejected plan mutates the live view.\
Single-source rules: a rule or cascade is stated in more than one place or checked other than on the resulting state, or incremental edits, batch imports, client previews and server commits disagree.\
Reuse: drawv2, or a non-visual consumer over zorg, needs a fork or a domain-specific branch in the core.\
Leanness counts only for a failure that is not about speed: lookups that are not synchronous, planning that touches more than a scratch projection, or an asymptotic bound missed even though measured speed is good. 2: two or more dimensions, each with its observable failure. 1: one. 0: none, or measured speed only.

#### V10 (incomplete)

(a) entity-api (C6), citing l.51, or the three entity-api (C6), operation-call (C5) and agp (C1), citing l.66.\
Either earns (a).\
(b) shape-check (C3), from l.62.\
A reader who also notes that l.38 says the entity store 'validates each record's own shape', and reconciles or flags it, still earns (b). entity-store alone, without l.62, does not.\
(c) The application owns the rule: it supplies it as a pure reaction or invariant function on that kind's row, and entity-graph runs the hook knowing nothing of coordinates. snap-grid (C11) owns grid arithmetic, not this rule; naming it is neither required nor enough. 2: all three. 1: any two. 0: otherwise.

---

## Run 2 key changes, with their audit corrections

Written before any run-2 reader ran, by the agent that assembled the revision, so ties go to the original.\
Document under test: the revised `VISION.md` (copy in `reader-v2/VISION.md`).\
Baseline: run 1's answers and scores for the vision at `bf078b4`, scored against `KEY-corrected.md`.

`KEY-corrected.md` governs every probe of run 2, with its decision and grounded scores and its GUESS cap, except where this file says otherwise.\
The exceptions exist because the director's rulings of 2026-11-07 (`D2` to `D6`) changed what the vision is meant to decide: it states purpose only, leaves mechanism to the design effort, names its open questions, and names no other component.

### V1 - snapshot to disk (changed by `D2`)

Admissible as a design choice: "Whether it keeps a copy of its own view anywhere, to start faster or for any other reason, is the design effort's choice, so long as the copy says which position it reflects and the store governs wherever the two disagree."\
It must not become the record: "The store beneath keeps every entity, gives every change its position, and holds the history". 2: the design effort's choice, with both conditions (states its position; the store governs). 1: allowed without the conditions, or refused citing "Not the record" without the choice. 0: refused as forbidden outright.

### V4 - automatic merge (changed by `D6`)

Named as an open question owed by the design effort ("How conflicting edits are resolved"), neither in nor out, bounded: what lands is an edit judged in full against a known state, landing whole or not at all, and no answer claims a position it does not reflect. 2: open and owed by the design, with the bound. 1: open without the bound, or the bound without saying it is open. 0: admit or refuse as SAYS.

### V5 - exact but slow (wording changed)

No, or not without a stated, small per-answer cost: Leanness asks for it to be "cheap per answer", and the dimensions "are not weighted, and they do not collapse", so meeting Exactness does not make up for Leanness. 2: fails or is at risk on Leanness, and the dimensions do not collapse. 1: one of those. 0: meets success.

### V8 - a different index mechanism (changed by `D2`)

Allowed: "How the view is kept current, where it is kept, and how an edit's consequences and its undo are worked out are the design effort's to choose, and nothing here prefers one way over another"; it is judged by the success dimensions. 2: allowed, and judged by the dimensions (Exactness, Leanness and the rest). 1: allowed without the dimensions. 0: forbidden, or needs an amendment.

### V9 - failure by its own measure (dimensions changed)

Six dimensions: Exactness, Agreement, Reversibility, Legibility, Leanness, Reuse. 2: at least two dimensions other than Leanness, each with its observable failure. 1: one. 0: none, or only speed.

### V10 - ownership (changed by `D2`)

The vision names no other component.\
(a) "Carrying edits and changes between processes is someone else's job."\
(b) "Whether one entity's own fields fit its kind is someone else's judgement."\
(c) The application supplies the rule, and `entity-graph` applies it without understanding it; choosing where anything sits belongs to the application or another component. 2: all three, with (a) and (b) answered as not this component's and not named in the vision (a named component labelled GUESS is fine). 1: two. 0: otherwise.

### Probes unchanged

V2, V3, V6 and V7 keep `KEY-corrected.md`.\
In V2 the Reuse dimension now speaks of "a visual application and a non-visual one" and "No kind and no rule is built in" sits under *Declare once*; citing either is grounded.\
In V3 the sentence is "Whether the asker may make the edit is decided by the application before it asks"; `access-grants` is no longer mentioned.

---

### Corrections after the run-2 key audit

Applied before any run-2 reader was scored; where a correction below speaks to a probe, it replaces every earlier key text for that probe in full.

**Inherited text.**\
Any earlier key text that quotes wording, method names or mechanism absent from the revised document is read as GUESS if a reader asserts it as SAYS, and a reader is never marked down for saying the revised document does not state it.

#### V1 (unfair)

Admissible.\
The vision leaves it to the design effort under two conditions: 'Whether it keeps a copy of its own view anywhere, to start faster or for any other reason, is the design effort's choice, so long as the copy says which position it reflects and the store governs wherever the two disagree' (l.89; see also l.75, 'where it is kept').\
It must not become the record (l.88).\
A reader may note that the application owns storage (l.78); this is acceptable but not required.\
A conditional answer ('refuse as worded, admit once it carries both conditions') counts as admissible.\
Decision score: 2 admissible or the design effort's choice, with both conditions; 1 admissible with one condition or none; 0 refused as forbidden, whatever it cites.\
Grounded score: the same tiers, with l.89 quoted as SAYS and the GUESS cap applied.\
A refusal that cites 'Not the record' scores 0, because the passage it cites goes on to permit the proposal.

#### V6 (incomplete)

No. 'An edit is judged by the state it would leave, never by the order of its steps, so an edit may pass through a state that would be wrong on its own and still be allowed' (l.28).\
A batch is one edit: 'An edit is any set of creations, changes and removals asked for together' (l.37).\
The state the edit would leave includes its consequences (l.36). l.75 leaves how the planner works to the design effort, but not this outcome.\
Supporting citations, not required: problem 3, 'when a rule is written into each operation' (l.57), and Agreement, 'alone or within a bulk load' (l.140). 2: no, with the resulting-state rule (l.28 or its substance). 1: no without it. 0: yes, including 'yes, because mechanism is the design effort's choice'.

#### V9 (unfair)

Six dimensions.\
Count a dimension when the reader names an observable failure in it.\
Exactness: an answer differs from a fresh reading at the position it reports, a refused edit changes an answer, or an answer reflects part of an edit (l.135-137).\
Agreement: the same edit from the same state gets different results in preview and commit, or alone and within a bulk load (l.140-141).\
Reversibility: a landed edit cannot be undone, or its undo does not restore every changed entity with its identity, for example a deleted entity recreated under a new identity because identity is formed from position (l.144-145, l.195).\
Legibility: a refusal does not name the rule, the entity (including one the caller never named), or the part of the edit that led there (l.148-149).\
Reuse: an adopter needs a variant, a fork or a domain branch in the core, or there are fewer than two adoptions without core change, at least one by an application it was not designed around (l.156-158).\
Leanness counts only for a failure that is not about speed: not small to embed, code size not small, or per-answer, per-edit or per-change cost not stated (l.152-153). 2: two or more dimensions, each with its observable failure. 1: one. 0: none, or measured speed only.

#### V10 (wrong)

The vision names no owner for (a), for (b), or for geometry.\
The only other component it names is `entity-store` (`C4`), and only in 'Questions left open' (l.191, l.195), never as the owner of any of these.\
(a) 'Carrying edits and changes between processes is someone else's job' (l.117).\
(b) 'Whether one entity's own fields fit its kind is someone else's judgement' (l.92).\
(c) The application supplies the rule, and entity-graph applies it without understanding it (l.121).\
Choosing where anything sits belongs to the application or another component (l.122). 2: all three, with (a) and (b) answered as not this component's and with no owner named in the vision.\
A named component labelled GUESS is acceptable.\
A component named as SAYS, for example entity-store as the owner of (b), does not earn that part. 1: two. 0: otherwise.

---

## Run 3 key changes, with their audit corrections

Written before any run-3 reader ran, by the agent that assembled the revision, so ties go to the original.\
Document under test: the final `VISION.md` (copy in `reader-v3/VISION.md`), revised after run 2 in answer to its readers and to an adversarial review.\
`KEY-v2-corrected.md`, with the earlier keys it builds on, governs every probe unchanged: the changes after run 2 clarify wording, name `D2` and `D4` in the body, place an undo after a later change inside the open question on conflicting edits (`V4`), and mark the Reversibility measure as a goal (`V9`), none of which changes a right answer.

---

### Corrections after the run-3 key audit

Applied before any run-3 reader was scored; a correction below replaces every earlier key text for its probe in full.

#### V4 (incomplete)

Unsettled.\
It is an open question owed by the design effort ('How conflicting edits are resolved', l.199-201).\
The document also says 'A proposal that answers one of the questions in the last section is neither in nor out here.\
It goes to the design effort, bounded by what that section says any answer must keep' (l.124-125); D6 rules the same.\
'Combining the two' (l.201) names merging as one candidate answer, not a chosen one.\
An answer that says the document names merging as a candidate the design may choose counts as unsettled, not as admit.\
The bound is any of: 'what lands is an edit judged in full against a known state, landing whole or not at all, and no answer claims a position it does not reflect' (l.202); 'Every answer keeps every commitment above' (l.182); or l.125 together with the commitments it points to. 2: unsettled and owed by the design, with any one of those bounds. 1: unsettled without a bound, or a bound without saying it is unsettled. 0: admit as chosen, or refuse, asserted as SAYS.

#### V8 (incomplete)

Allowed, and nothing has to happen first: 'How the view is kept current, where it is kept, and how an edit's consequences and its undo are worked out are the design effort's to choose, and nothing here prefers one way over another (D2)' (l.75).\
Any one of these is a grounded bound.\
(i) 'Every way is judged by the same dimensions' (l.76), for example Exactness (l.135) and Leanness, 'cheap per answer' (l.153).\
(ii) The cache is something kept to answer, so it is 'never the record' (l.88), and as a copy of the view it 'says which position it reflects and the store governs wherever the two disagree' (l.89).\
(iii) Every answer states the position it reflects (l.33). 2: allowed, with any one bound. 1: allowed with no bound. 0: forbidden, or needs a decision or an amendment to the vision first.\
A GUESS that some record outside the vision might need superseding is not marked down.

#### V9 (incomplete)

Six dimensions.\
Count a dimension when the reader names an observable failure in it.\
Exactness: an answer differs from a fresh reading at the position it reports, a refused edit changes an answer, or an answer reflects part of an edit (l.135-137; see l.34).\
Agreement: the same edit from the same state gets different results in preview and commit, or alone and within a bulk load (l.140-141).\
Reversibility: an undo that lands does not restore every entity its edit changed, identity included, for example a deleted entity recreated under a new identity because C4 forms identity from position (l.144-146, l.196); or a landed edit can never be undone.\
An undo refused or planned again because a change landed after the edit it reverses falls inside the open question at l.200-201 and does not count on its own. l.146 calling the measure the goal excuses no failure; a reader who leaves identity out because it is named open is not marked down when two other dimensions are named.\
Legibility: a refusal does not name the rule, the entity (including one the caller never named), or the part of the edit that led there (l.149-150).\
Reuse: an adopter needs a variant, a fork or a domain branch in the core, or there are fewer than two adoptions without core change, at least one by an application it was not designed around (l.157-159).\
Leanness counts only for a failure that is not about speed: not small to embed, code size not small, a per-answer, per-edit or per-change cost that is not stated, or one that is not small in something other than time (l.153-154). 2: two or more dimensions, each with its observable failure. 1: one. 0: none, or measured speed only.
