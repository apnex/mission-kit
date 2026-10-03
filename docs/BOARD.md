# mission-kit - board

The live, triaged, prioritised set of **legal next moves**, for director selection.

An [`AR3`](../artifacts/AR3-board.md) instance.\
[`BACKLOG.md`](BACKLOG.md) is the **record** - append-and-close, every row evidenced, nothing deleted.\
This is the **plan** - mutable, reorderable, short.\
They are maintained together and checked against each other.

> **Opened** from the backlog's fifteen rows, after the corpus authored its own vision and architecture.\
> This is the first board this corpus has held, and `AR3` is the only artifact type never previously checked against an instance.

---

## The contract with the record

Five rules.\
They exist so the plan can move fast without the record losing fidelity.

1. **Every board item cites a `B` row.** A finding with no row is not ready for the board - it gets a row first, with cited evidence, per the backlog's own admission rule.
2. **Closing a board item closes its `B` row in the same commit.** Never one without the other.
3. **A `B` row whose revival trigger has not fired is NOT on the board.** It is listed under [Held](#held) and **scored on the same scale**, so that not choosing it is a visible judgement rather than an omission.
4. **The board is reorderable and items may be dropped.** A dropped item is not deleted: its `B` row is rewritten with the reason as a revival trigger. Explicit deferral is permitted; silence is not.
5. **A move ships with the mechanism that would catch its absence**, where one is possible. A rule with no enforcer is recorded as unenforced rather than presented as held.

Reconciliation is mechanized by [`tools/check-board.mjs`](../tools/check-board.mjs), which refuses any change that breaks this contract.

**Status vocabulary:** `TODO` - `WIP` - `BLOCKED` - `DONE` - `DROPPED`

---

## Where we are

The thread of the current conversation, so a reader can see how the active work connects to the ask that started it, and what is parked to return to.\
Updated whenever the thread moves; the milestones below remain the plan.

```text
M5  bring the charters to E4                     4 of 13 applied, 9 remain        PAUSED
 +- how the axis layers compose (B32)            done
     +- axioms as asymptotes, system, component  done
     +- six open design questions (B36)          1 of 6 done                      PARKED
     +- evaluation harness                       built
     +- how mission-kit says how to do work (B24)
         +- Delta-1: methods, rules, practices   ready to ratify                  PARKED
         +- the explain set (B38)
             +- Delta-2                          withdrawn - needs a real metric  PARKED
             +- communication limits             understand, decide: confirmed
             +- moves                            eight, provisional
             +- human evaluation                 session 2: restructured won 4 of 4
             +- placement drafted                   style, one practice, one method
             +- draft guidance tested on director   won 4 of 4
             +- apply via Delta-2, revised             next                                   <- HERE
         +- Delta-1                                  done
```

**To return to, in order:** the human evaluation tool, then Delta-2 revised from its results; ratify Delta-1; the five remaining `B36` questions; the nine remaining charters.

---

## Triage scale

Two orthogonal dimensions.\
**Order on the higher of the two, never on a blend.**

**Impact** - what it costs someone now.

| | | |
|---|---|---|
| **S1** | **corpus-wrong** | the corpus states something false, or prescribes what it cannot support |
| **S2** | **silently-unreachable** | a rule or entry exists and cannot be found, followed, or applied by its intended reader |
| **S3** | **unenforced** | a stated rule has no mechanism, and nothing reveals when it is violated |
| **S4** | **incomplete** | a declared surface is absent; work is possible but harder than it should be |
| **S5** | **internal** | no consequence for any reader; consistency and hygiene only |

**Principle breach** - which standing commitment is violated, and whether the breach is of its **mandate** or of an **enforcement signal**.\
A mandate breach is the commitment itself failing; a signal breach is a mechanic of it going unheld.

**Visible** - `adopter` - `author` - `agent` - `internal` **Size** - `S` few lines - `M` half a day - `L` structural

> **Ordering rule.** The two scales disagree, and the disagreement is the information. `B5` is `S4` by impact - nothing is broken today - and an **`A3` mandate breach**, because the corpus composes sixteen layers while leaving the term that governs composition undefined. It ranks above several `S2` items on that basis alone. Collapsing the scales would have hidden that, and would have sorted this board by how loudly each item complains.

---

## Triage ledger

All forty-four rows, scored.\
Held rows are [below](#held).

| Row | Impact | Principle | Visible | Size | Milestone | One line |
|---|---|---|---|---|---|---|
| **B5** | S4 | **A3 mandate** | author | **L** | **M1** `DONE` | `set` is undefined while sixteen layers compose by it; four other rows depend on it |
| **B4** | S2 | **A3 mandate** - A4 | author | M | **M5** | thirteen charters, thirteen shapes; admission appears in 5 of 13, body shape in 0 |
| **B3** | S4 | **A14 mandate** | author | M | **M1** `DONE` | no set declares its territory, so no set can find its own gaps |
| **B6** | S2 | A3 signal | agent | S | **M1** `DONE` | a member cannot name its own canonical name or its governing set |
| **B15** | **S1** | **A4 mandate** | adopter | M | **M2** | `AR4` prescribed to adopters and unheld here; rulings live only in commit messages |
| **B2** | S2 | A2 signal | adopter | S | **M2** | no canonical instance filenames; only `VISION.md` is prescribed, and only by illustration |
| **B11** | S2 | **A0 mandate** | adopter | S | **DONE** | `AR6` told authors to use a peer instance the corpus did not contain |
| **B1** | **S1** | **A2 mandate** | adopter | M | **M2** | prescribes a document set it does not hold - vision, backlog, architecture now land |
| **B13** | S4 | A3 signal | author | S | **M3** | `MREQ-9` filed too narrowly; the layer had no procedural surface at all, not just no work-types |
| **B9** | S3 | **A8 mandate** | author | M | **M3** | `AR3` never instance-checked; `AR5` discharged by writing one |
| **B14** | S4 | A3 signal | author | **L** | **M3** | `backlog/` and `AR5` are two objects wearing one word |
| **B10** | S5 | A4 signal | adopter | S | **M4** | `CSSA`/`TSSA` is one programme's vocabulary presented as convention |
| **B7** | S4 | A2 signal | adopter | M | **M4** | `AR2` has no instance naming or ordinal scheme |
| **B17** | S1 | **A8 mandate** | author | M | **M5** | a checker enforcing a superseded standard, suspended rather than left misreporting |
| **B18** | S4 | **A4 mandate** | agent | M | **Held** | no procedure for handing over work in progress |
| **B19** | S4 | A14 signal | author | S | **Held** | nothing proportionate for a small design decision |
| **B21** | **S2** | **A4 mandate** | agent | **L** | **Held** | no axiom states the property that protects an agent against its own error |
| **B23** | S2 | **A13 mandate** | agent | S | `DONE` | organisation now defined as one agent or many; lone agent named a primary reader |
| **B24** | S3 | **A3 mandate** | author | **L** | **M5** | the compositional split behind the work axes has not been revisited since sets were defined |
| **B22** | S4 | A9 signal | author | S | **Held** | `A9` binds every system and is the least exercised axiom |
| **B25** | S2 | A13 signal | agent | S | **M3** | `M7`'s trigger is narrower than its title, so nothing routes an author to it unprompted |
| **B26** | S2 | **A3 mandate** | adopter | S | `DONE` | multi-tag binding ambiguous in every revision; ruled any-tag |
| **B27** | S3 | **A8 signal** | author | S | **M4** | network check fails under throttling, inviting `--no-network`, which would hide a real break |
| **B28** | S2 | **A3 mandate** | adopter | M | `DONE` | applicability tags were undefined vocabulary; now the `traits/` layer |
| **B29** | S2 | **A8 mandate** | author | S | **M5** | an evaluation key is the author's opinion; a wrong one yields a confident wrong result |
| **B30** | S3 | **A8 signal** | adopter | S | **M4** | external addresses outside AGENTS.md are unchecked; placeholder links look real |
| **B31** | S3 | A10 signal | adopter | S | **M5** | the duty to expand a set on a found gap is stated for domains only, not work-types, traits or sets in general |
| **B32** | **S2** | **A12 mandate** - A3 | agent | M | **M5** | no record states how the axis layers compose; a context-less agent assembles it from four charters |
| **B33** | S3 | A8 signal | agent | S | **M5** | `W0` constraints 2 and 9 contradict on same-agent degradation |
| **B34** | **S1** | **A14 mandate** - A13 | agent | M | **M5** | axioms read as constraints, intended as asymptotes; `system` undefined |
| **B35** | S2 | **A3 mandate** - A14 | agent | M | **M5** | `component` undefined in four senses; opportunistic improvement unstated; axiom wording inconsistent with the asymptote |
| **B36** | S3 | **A3 mandate** | agent | S | **M5** | six design questions on boundaries, traits and adjacency, taken one at a time |
| **B37** | S4 | A8 signal | agent | S | **M5** | five small defects found by baseline readers: `W22` authority, `M1` floor, `E2` count, root `README` on the index, `generatable` |
| **B38** | S2 | **A13 mandate** - A4 | agent | M | **M5** | communication with a cold human is guided only in scattered pieces |
| **B39** | S5 | A3 signal | adopter | S | **Held** | style cannot be scoped by medium |
| **B40** | **S2** | **A8 mandate** | author | S | **M5** | every eval reader also gets the harness's AGENTS.md and the main ledger; corpus-against-nothing claims are confounded |
| **B41** | S4 | A14 signal | agent | S | **Held** | M5 may push agents to over-report deferrals in status messages |
| **B42** | S3 | **A14 mandate** | director | S | **M5** | communication moves have package evidence only; grow by isolated pairs and the friction log |
| **B43** | S3 | A3 signal | agent | S | `DONE` | `K0` and one placement edge stale after Delta-1 |
| **B44** | S2 | **A14 mandate** | director | S | `DONE` | lessons captured as notes recurred; four absorbed into mechanism |
| **B20** | S5 | A3 signal | author | S | `DONE` | `M7` may be axiom-shaped in a methodology's place |
| **B16** | S3 | **A8 mandate** | author | S | **M4** | the board drifted from itself within two commits, and the item meant to prevent that cited no row |
| **B8** | S3 | **A2 mandate** | adopter | **L** | **Held** | `AR1` forbids the hand-authored current projection a bootstrap cannot avoid |
| **B12** | S4 | A14 signal | author | M | **Held** | recovery methodology unwritten; its reasoning is untested |

`DONE` marks a closed item.\
**Bold principle** = mandate breach, which is what lifts an item above its impact score.

---

## What the triage found

Three things the scoring surfaced that reading the backlog did not.

**`B5` was the keystone and did not look like one - discharged in `M1`.**\
By impact it is `S4` - nothing is broken and no adopter is blocked.\
By principle it is an `A3` mandate breach, because the corpus composes sixteen layers, nests sets inside `docs/`, and leaves the governing term undefined.\
`B3`, `B4` and `B6` each resolved readily once `set` existed and were half-guesses without it.\
Four rows collapsed into one move, which is the case for the two-signal device made on first use rather than argued: `B5` would have sorted near the bottom on impact alone.

**`B1` and `B15` are the same defect at two altitudes.**\
Both are the corpus prescribing what it does not hold.\
`B1` is discharged by this commit; `B15` is the residue, and it is the more embarrassing half - a decision register is prescribed to every adopter while this corpus keeps its rulings in commit messages.

**`B8` is `Held` deliberately, and the reason is a real one.**\
It is an `A2` mandate breach with no available remedy: a bootstrap has no completed transitions to derive a current projection from.\
Ranking it high would put an unsolvable item at the top of the board.\
Its trigger is the first delta, which makes it solvable rather than merely urgent.

---

## M1 - define the set - `DONE`

**The keystone.**\
Everything in `M1` is one delta and should not be split.

| # | Item | Row | Proof it landed |
|---|---|---|---|
| M1.1 | Author `E3 - set`: what a set owns, what a member owes it, how a parent registers a child and delegates | `B5` | `DONE` - `E3` exists, `E2` cross-references it, contract passes |
| M1.2 | Require a **territory statement** on every set - the denominator without which a gap is undetectable | `B3` | `DONE` - `E3` requires it; `C0` carries the first one |
| M1.3 | Declare the charter shape, and check it the way `SC6` checks member bodies | `B4` | `DONE` - declared in `spec.charters`, checked by `check-charter-shape.sh`, mutation-proven. Advisory until the 30-section debt clears |
| M1.4 | Give a member a resolvable pointer to its governing set | `B6` | `DONE` - `category` now names the set and the contract states how its charter resolves |

**Exit criteria.**\
`set` is defined and cited by at least two charters.\
A charter missing a required section is refused by a script, and the refusal is proven by injecting the defect.\
One set states its territory, and a gap in that set is demonstrably findable.

---

## M2 - hold what we prescribe - `WIP`

Close the gap between what the corpus tells adopters to do and what it does.

| # | Item | Row | Status |
|---|---|---|---|
| M2.1 | `VISION.md` at the root | `B1` | `DONE` |
| M2.2 | `docs/BACKLOG.md` as an `AR5` instance | `B1` | `DONE` |
| M2.3 | `docs/ARCHITECTURE.md` as an `AR1` instance | `B1` | `DONE` |
| M2.4 | This board as an `AR3` instance | `B1`, `B9` | `DONE` |
| M2.5 | A decision register, and a ruling on whether commit messages are a conformant `AR4` carrier | `B15` | `TODO` |
| M2.6 | Canonical instance filenames, decided per-entry or as one table | `B2` | `TODO` |

**Exit criteria.**\
Every artifact type this corpus prescribes is either held by it or has a recorded reason it is not.\
An adopter reading `AR4` can point at a conformant instance in this corpus.

---

## M3 - make composition real - `TODO`

Ten of sixteen layers have no observed consumer.\
This milestone tests whether composition is structural or theoretical.

| # | Item | Row |
|---|---|---|
| M3.1 | Amend `MREQ-9` to the broader finding, and rule on the third reading now that `M8` cites an `AR` type | `B13` |
| M3.2 | Instance-check `AR3` against this board and record what it surfaced | `B9` |
| M3.4 | Align `M7`'s trigger with its title, so an author reaches it without already asking about anchoring | `B25` |
| M3.3 | Rule on `backlog/` versus `AR5` - keep both, migrate, or split by concern, without breaking `MREQ` citations | `B14` |

**Exit criteria.**\
Every ID-bearing layer either has an observed consumer or a recorded reason it has none.

---

## M4 - conventions and enforcement - `TODO`

| # | Item | Row |
|---|---|---|
| M4.1 | Rule on `CSSA`/`TSSA` - keep, drop "conventionally", or promote as `E` entities | `B10` |
| M4.2 | Mechanize the board-record contract: every item cites a live row, every open row is on the board or in Held, milestone order matches the plan | `B16` `DONE` |
| M4.3 | `AR2` instance naming and ordinal scheme | `B7` |
| M4.4 | Retry network checks with backoff on 5xx, so throttling is told apart from a broken address | `B27` |
| M4.5 | Check every external address in the corpus, and make placeholders unmistakable | `B30` |

---

## M5 - bring the charters to `E4` - `WIP`

[`E4`](../entities/E4-charter.md) defines what a charter is: six required concerns - four at fixed headings, two answered anywhere - six conditional ones, and the rest free.

| # | Item | Row | Status |
|---|---|---|---|
| M5.1 | Audit all thirteen charters against `E4`: answered, partial or absent, citing where | `B4` | `DONE` - [audit](audits/charter-audit-against-E4.md) |
| M5.2 | Reconcile `E4` with what the audit found | `B4` | `DONE` |
| M5.3 | **Trial conversion of one charter** | `B4` | `DONE` - `M0`, verdict **improved** - [verdict](audits/M5.3-trial-verdict-M0.md), [candidate](audits/M5.3-trial-candidate-M0.md). Awaiting director review |
| M5.4 | Revise `E4` on what the trial shows, or stop if the enhancement did not improve utility | `B4` | `DONE` - territory must be derived and show a gap; growth must be paid for |
| M5.4b | **Second trial, on `A0`**, isolating whether growth comes from the standard or from `M0` missing two concerns | `B4` | `DONE` - verdict **improved**, growth paid for. Growth tracks missing concerns: 36 percent here against 78 for `M0` - [verdict](audits/M5.4b-trial-verdict-A0.md), [candidate](audits/M5.4b-trial-candidate-A0.md). Awaiting director review |
| M5.5 | Convert all thirteen, one per change - draft, audit, evaluate, director review, apply | `B4` | `WIP` - `M0`, `A0`, `R0`, `D0` **applied** - [M0](audits/M5.5-01-M0.md), [A0](audits/M5.5-02-A0.md), [R0](audits/M5.5-03-R0.md), [D0](audits/M5.5-04-D0.md); 9 remain |
| M5.5b | Revisit the compositional split behind the work axes when conversion reaches `R0`, `D0` and `W0` | `B24` | `TODO` |
| M5.5c | Carry the duty to expand a set on a found gap into `W0` and `T0`, or state it once in `E3` | `B31` | `TODO` |
| M5.5d | **Composition record**: measure a context-less agent's composition of the axis layers against the current corpus, author one declared record of how they compose and the order to read them, re-measure | `B32` | `WIP` - baseline **14 / 14** in three runs: correctness is already met, so the record is unearned on these probes. Two questions every run had to guess - whose traits count, and what an axiom alignment refers to - are the measured gap. [scores](audits/eval-COMP/SCORES.md) |
| M5.5e | Resolve the constraint 2 / constraint 9 contradiction in the `W0` conversion | `B33` | `TODO` |
| M5.5f | **Axioms as asymptotes, and `system` defined** - amend `A0`, scope `M7`, add the entity; evaluate before and after | `B34` | `DONE` - **8.3 to 16.0 / 16**, approved - [audit](audits/M5.5f-asymptote-and-system.md) |
| M5.5g | **Component defined, opportunistic improvement, axiom wording pass** - evaluate before and after | `B35` | `DONE` - **7 to 10 / 10**, approved; open questions to `B36` - [audit](audits/M5.5g-component-opportunistic-wording.md) |
| M5.5h | Rule on the six open design questions, one at a time, and amend `E5`, `E6`, `A0`, `A3` or `T0` as each ruling requires | `B36` | `WIP` - 1 of 6: bypassed interface applied, 5 to 8 / 8, no regression - [audit](audits/M5.5h-01-bypassed-interface.md) |
| M5.5i | Measure and correct the incidental defects the baseline readers found | `B37` | `TODO` |
| M5.5j | **Delta-1, the work layers** - procedures stay in `methodology/`, practices and rules to a new `practices/`, prose skill `K1` in; packaged skills, WorkGraph skills and the `W0` citation deferred | `B24` | `DONE` - all four stages; 21.66 to 28 / 28 - [delta](deltas/delta-1-work-layers.md), [audits](audits/delta-1/) |
| M5.5k | **The explain set** - communication with a human of limited context, measured with live agents first, then designed as a set spanning layers | `B38` | `WIP` - baseline re-scored after ruling: 7.0 with and without the corpus, no gap; Delta-2 revision 2 gathers and authors nothing - [delta](deltas/delta-2-explain-set.md) |
| M5.5l | State the always-on-context confound in every evaluation result, and take after-runs before a change reaches `main` | `B40` | `WIP` - stated in `docs/evals/README.md` |
| M5.5m | Grow the communication-moves matrix: isolated pairs in short sessions, and the live friction log | `B42` | `TODO` |
| M5.6 | Rebuild the charter checker - fixed headings by name, free concerns by a declared location - and re-enable it | `B17` | `TODO` |
| M5.7 | **Add a key review to `M2`** - a fresh reader audits the answer key against the population before any evaluator runs. Trigger fired at `D0`: three of seven answers wrong, caught before use | `B29` | `DONE` - in `M2` rule 1 |

**How each charter is converted is product, not plan, and lives in the corpus.**\
The editing rule is [`E4`](../entities/E4-charter.md) section *Changing a charter*; the evaluation that tests each conversion is [`M2`](../methodology/M2-test-drive-docs-by-execution.md).\
This milestone records which charters are done, not how.

**Exit criteria.**\
Every charter answers `E4`'s required concerns and has passed `M2` evaluation against its previous version.\
The charter checker tests fixed headings by name and free concerns by declared location, and gates every change.

---

## Held

Rows on the record and not on the board, **scored on the same scale**, so declining them is visible.

| Row | Impact | Principle | Why held | Revival trigger |
|---|---|---|---|---|
| **B8** | S3 | **A2 mandate** | No available remedy. A bootstrap has no completed transitions to derive a current projection from, so the rule is unsatisfiable rather than unsatisfied. Ranking it would put an unsolvable item first. | **this corpus runs its first delta**, at which point a derived projection becomes possible and the rule is testable |
| **B12** | S4 | A14 signal | Its reasoning has not survived contact with a repository. Writing it now would be authoring a procedure from one un-run prompt, which is the shape-from-one-instance error the corpus has already made twice. | **the first external brownfield adopter reports back** |

| **B18** | S4 | **A4 mandate** | Found by the `M0` trial and not yet triaged. Authoring a handover procedure from one observed absence would repeat the shape-from-one-instance error. | **a handover loses information a procedure would have kept** |
| **B19** | S4 | A14 signal | Found by the `M0` trial. A thin moment is not a failure until something fails at it. | **a small design decision fails in a way an anchoring check would have caught** |

| **B21** | **S2** | **A4 mandate** | Found by the `A0` trial, then corrected: first framed as defence against an adversary, which is out of scope. Scored high and held anyway, since adding an axiom changes the constitution and warrants its own audit. | **a lone agent ships a claim it corroborated itself and was wrong** |
| **B22** | S4 | A9 signal | Found by the `A0` trial. A low citation count has two legitimate readings and one observation cannot separate them. | **a deployment fails in a way chaos validation would have caught** |
| **B39** | S5 | A3 signal | Nested sets need generator support, and no medium-specific rule exists to fill one. | **the first style rule that applies to one medium only** |
| **B41** | S4 | A14 signal | Two readers in one run; a harm finding from n = 2 is a lead, not a result. | **the explain after-run shows the same, or a director reports a status update padded with deferrals** |



All are deferrals of evidence or of authority, not of appetite.\
Neither is blocked on effort.

---

## Decisions required

Three, each naming exactly what it blocks.\
Each is a director ruling that cannot be derived from the corpus.

| # | Question | Blocks |
|---|---|---|
| **Q1** | **Are commit messages a conformant `AR4` carrier?** `AR4` admits a register form and requires a ruling to be separately addressable, dated and superseded. A commit is dated and addressable by sha and is not separately supersedable. | `M2.5`, and therefore `B15` |
| **Q2** | **Does `set` become an `E` entity, or a property of the existing `layer` entity?** `E2` defines `layer` and cannot express nesting; sets nest and can be smaller than a layer. Making `set` separate risks two terms for one thing; folding it in risks `E2` owning two concerns. | all of `M1`, and therefore `B3`, `B4`, `B5`, `B6` |
| **Q3** | **Does `backlog/` survive as a layer?** Retiring it demotes ten routable, citable entries into table rows and breaks live citations from `AR0`, `AR2` and `MREQ-9`. Keeping it leaves two objects wearing one word. | `M3.3`, and therefore `B14` |

**Q2 is the one to answer first.**\
It gates the entire keystone milestone, and `M1` cannot start without it.
