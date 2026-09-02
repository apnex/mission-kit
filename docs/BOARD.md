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

Reconciliation is mechanizable and is not yet mechanized - no checker asserts that every board item cites a live row.\
That is item `M4.2`.

**Status vocabulary:** `TODO` - `WIP` - `BLOCKED` - `DONE` - `DROPPED`

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

All fifteen rows, scored.\
Held rows are [below](#held).

| Row | Impact | Principle | Visible | Size | Milestone | One line |
|---|---|---|---|---|---|---|
| **B5** | S4 | **A3 mandate** | author | **L** | **M1** | `set` is undefined while sixteen layers compose by it; four other rows depend on it |
| **B4** | S2 | **A3 mandate** - A4 | author | M | **M1** | thirteen charters, thirteen shapes; admission appears in 5 of 13, body shape in 0 |
| **B3** | S4 | **A14 mandate** | author | M | **M1** | no set declares its territory, so no set can find its own gaps |
| **B6** | S2 | A3 signal | agent | S | **M1** | a member cannot name its own canonical name or its governing set |
| **B15** | **S1** | **A4 mandate** | adopter | M | **M2** | `AR4` prescribed to adopters and unheld here; rulings live only in commit messages |
| **B2** | S2 | A2 signal | adopter | S | **M2** | no canonical instance filenames; only `VISION.md` is prescribed, and only by illustration |
| **B11** | S2 | **A0 mandate** | adopter | S | **DONE** | `AR6` told authors to use a peer instance the corpus did not contain |
| **B1** | **S1** | **A2 mandate** | adopter | M | **M2** | prescribes a document set it does not hold - vision, backlog, architecture now land |
| **B13** | S4 | A3 signal | author | S | **M3** | `MREQ-9` filed too narrowly; the layer had no procedural surface at all, not just no work-types |
| **B9** | S3 | **A8 mandate** | author | M | **M3** | `AR3` never instance-checked; `AR5` discharged by writing one |
| **B14** | S4 | A3 signal | author | **L** | **M3** | `backlog/` and `AR5` are two objects wearing one word |
| **B10** | S5 | A4 signal | adopter | S | **M4** | `CSSA`/`TSSA` is one programme's vocabulary presented as convention |
| **B7** | S4 | A2 signal | adopter | M | **M4** | `AR2` has no instance naming or ordinal scheme |
| **B8** | S3 | **A2 mandate** | adopter | **L** | **Held** | `AR1` forbids the hand-authored current projection a bootstrap cannot avoid |
| **B12** | S4 | A14 signal | author | M | **Held** | recovery methodology unwritten; its reasoning is untested |

`DONE` marks a closed item.\
**Bold principle** = mandate breach, which is what lifts an item above its impact score.

---

## What the triage found

Three things the scoring surfaced that reading the backlog did not.

**`B5` is the keystone and does not look like one.**\
By impact it is `S4` - nothing is broken and no adopter is blocked.\
By principle it is an `A3` mandate breach, because the corpus composes sixteen layers, nests sets inside `docs/`, and leaves the governing term undefined.\
`B3`, `B4` and `B6` each resolve trivially once `set` exists and are each half-guesses without it.\
Four rows collapse into one move.

**`B1` and `B15` are the same defect at two altitudes.**\
Both are the corpus prescribing what it does not hold.\
`B1` is discharged by this commit; `B15` is the residue, and it is the more embarrassing half - a decision register is prescribed to every adopter while this corpus keeps its rulings in commit messages.

**`B8` is `Held` deliberately, and the reason is a real one.**\
It is an `A2` mandate breach with no available remedy: a bootstrap has no completed transitions to derive a current projection from.\
Ranking it high would put an unsolvable item at the top of the board.\
Its trigger is the first delta, which makes it solvable rather than merely urgent.

---

## M1 - define the set - `TODO`

**The keystone.**\
Everything in `M1` is one delta and should not be split.

| # | Item | Row | Proof it landed |
|---|---|---|---|
| M1.1 | Author `E3 - set`: what a set owns, what a member owes it, how a parent registers a child and delegates | `B5` | entry exists, resolves, passes the entry-body contract |
| M1.2 | Require a **territory statement** on every set - the denominator without which a gap is undetectable | `B3` | `E3` states it; at least one charter carries one |
| M1.3 | Declare the charter shape, and check it the way `SC6` checks member bodies | `B4` | a checker refuses a charter missing a required section, proven by mutation |
| M1.4 | Give a member a resolvable pointer to its governing set | `B6` | `category` resolves to a charter, or a new field does |

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
| M3.3 | Rule on `backlog/` versus `AR5` - keep both, migrate, or split by concern, without breaking `MREQ` citations | `B14` |

**Exit criteria.**\
Every ID-bearing layer either has an observed consumer or a recorded reason it has none.

---

## M4 - conventions and enforcement - `TODO`

| # | Item | Row |
|---|---|---|
| M4.1 | Rule on `CSSA`/`TSSA` - keep, drop "conventionally", or promote as `E` entities | `B10` |
| M4.2 | Mechanize the board-record contract: every item cites a live row, every closed row names a milestone | contract rule 5 |
| M4.3 | `AR2` instance naming and ordinal scheme | `B7` |

---

## Held

Rows on the record and not on the board, **scored on the same scale**, so declining them is visible.

| Row | Impact | Principle | Why held | Revival trigger |
|---|---|---|---|---|
| **B8** | S3 | **A2 mandate** | No available remedy. A bootstrap has no completed transitions to derive a current projection from, so the rule is unsatisfiable rather than unsatisfied. Ranking it would put an unsolvable item first. | **this corpus runs its first delta**, at which point a derived projection becomes possible and the rule is testable |
| **B12** | S4 | A14 signal | Its reasoning has not survived contact with a repository. Writing it now would be authoring a procedure from one un-run prompt, which is the shape-from-one-instance error the corpus has already made twice. | **the first external brownfield adopter reports back** |

Both are deferrals of evidence, not of appetite.\
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
