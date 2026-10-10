# mission-kit - board

The live, triaged, prioritised set of **legal next moves**, for director selection.

An [`AR3`](../artifacts/AR3-board.md) instance.\
[`BACKLOG.md`](BACKLOG.md) is the **record** - append-and-close, every row evidenced, nothing deleted.\
This is the **plan** - the milestones, their order and the decisions they wait on.\
Each row's scores live on the row; the [triage ledger](#triage-ledger) and the [held](#held) list below are generated from the record by [`tools/check-board.mjs`](../tools/check-board.mjs), so the plan cannot disagree with the record about a score or a holding.

---

## The contract with the record

Five rules.\
They exist so the plan can move fast without the record losing fidelity.

1. **Every board item cites a `B` row.** A finding with no row is not ready for the board - it gets a row first, with cited evidence, per the backlog's own admission rule.
2. **Closing a board item closes its `B` row in the same commit.** Never one without the other.
3. **An open row no live item cites is held.** Holding is read from the plan, not declared: the [held](#held) list is generated, each row with its scores and revival trigger, so that not choosing it is a visible judgement rather than an omission. A row whose trigger fires returns to triage and is planned or re-held.
4. **The board is reorderable and items may be dropped.** A dropped item is not deleted: its `B` row is rewritten with the reason as a revival trigger. Explicit deferral is permitted; silence is not.
5. **A move ships with the mechanism that would catch its absence**, where one is possible. A rule with no enforcer is recorded as unenforced rather than presented as held.

[`tools/check-board.mjs`](../tools/check-board.mjs) holds rules 1 and 3 and the generated views; rules 2, 4 and 5 are held by review.

**Status vocabulary:** `TODO` - `WIP` - `BLOCKED` - `DONE` - `DROPPED`

---

## Where we are

The thread of the current conversation, so a reader can see how the active work connects to the ask that started it, and what is parked to return to.\
Updated whenever the thread moves; the milestones below remain the plan.

```text
M5  bring the charters to E4                     DONE
M2  hold what we prescribe                       DONE - decision register, fixed upper-case names
M3  make composition real                        DONE - board generated from the record, M7 trigger, produces
next: M4 conventions and enforcement             <- HERE
```

**M2, M3 and M5 complete.**\
The next milestone in plan order is M4.

**To return to:** the communication-moves matrix (`B42`), when the director has a session; Delta-2 stays withdrawn until it has a real metric.

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

**The common scale.**\
To order on the higher of the two, a mandate breach ranks as `S2` and a signal breach as `S4`; ties go to the mandate breach, then to the higher impact.

> **Ordering rule.** The two scales disagree, and the disagreement is the information. `B5` is `S4` by impact - nothing is broken today - and an **`A3` mandate breach**, because the corpus composes sixteen layers while leaving the term that governs composition undefined. It ranks above several `S2` items on that basis alone. Collapsing the scales would have hidden that, and would have sorted this board by how loudly each item complains.

---

## Triage ledger

Every open row, scored on the row and ordered on the common scale; generated, never edited by hand.

<!-- BEGIN GENERATED: ledger. Run tools/check-board.mjs --write; do not edit by hand. -->
| Row | Impact | Principle | Planned in | Finding |
|---|---|---|---|---|
| `B21` | S2 | A4 mandate | held | No axiom states the property that protects an agent against its own error. |
| `B77` | S3 | A3 mandate | held | The adherence runner has mission-kit built into it, so it is not yet the universal component `0087` and `0088` place in `context-lab`. |
| `B18` | S4 | A4 mandate | held | Methodology has no procedure for handing over work in progress. |
| `B27` | S3 | A8 signal | M4.4 | The full gate's network check fails under GitHub throttling while passing in isolation. |
| `B30` | S3 | A8 signal | M4.5 | External addresses outside `AGENTS.md` are checked by nothing, and placeholder links look real. |
| `B70` | S3 | A8 signal | held | `W22`, and three peers, declare `evidenceAuthority: verifier-attestation` while `W0` constraint 2 says verifier-held gates use plain `kind:review`. |
| `B76` | S3 | A12 signal | held | With today's guidance, a Gemini agent can spend a whole task fetching ledger entries. |
| `B12` | S4 | A14 signal | held | The recovery methodology for a brownfield vision is unwritten and its reasoning is untested. |
| `B19` | S4 | A14 signal | held | Methodology has nothing proportionate for a small design decision. |
| `B22` | S4 | A9 signal | held | `A9` binds every system unconditionally and is the least exercised axiom in the corpus. |
| `B41` | S4 | A14 signal | held | `M5` may push agents to over-report deferred items in messages to humans. |
| `B42` | S4 | A14 signal | held | The communication moves have package evidence only. |
| `B45` | S4 | A14 signal | held | Axiom-application methodology for non-code missions. |
| `B46` | S4 | A14 signal | held | Work-type for extending the corpus itself. |
| `B47` | S4 | A14 signal | held | The component design and specification altitude. |
| `B49` | S4 | A14 signal | held | Retiring the legacy style debt that keeps the whole-corpus gate red. |
| `B50` | S4 | A14 signal | held | The retrieval strategy for a ledger that outgrows always-on context. |
| `B51` | S4 | A14 signal | held | A provenance and trust vocabulary for an agent-maintained corpus. |
| `B52` | S4 | A14 signal | held | The post-ratification half of a delta, and whether its required sections are two shapes. |
| `B55` | S4 | A14 signal | held | Gaps the `AR0` investigation of 2026-10-04 found in `artifacts/`. |
| `B56` | S4 | A14 signal | held | Gaps the `A0` investigation of 2026-10-04 found in `axioms/`. |
| `B57` | S4 | A14 signal | held | Gaps the `C0` investigation of 2026-10-04 found in `components/`. |
| `B58` | S4 | A14 signal | held | Gaps the `E0` investigation of 2026-10-04 found in `entities/`. |
| `B59` | S4 | A14 signal | held | Gaps the `M0` investigation of 2026-10-04 found in `methods/`. |
| `B60` | S4 | A14 signal | held | Gaps the `P0` investigation of 2026-10-04 found in `patterns/`. |
| `B61` | S4 | A14 signal | held | Gaps the `PC0` investigation of 2026-10-04 found in `practices/`. |
| `B62` | S4 | A14 signal | held | Gaps the `R0` investigation of 2026-10-04 found in `roles/`. |
| `B63` | S4 | A14 signal | held | Gaps the `RU0` investigation of 2026-10-04 found in `rules/`. |
| `B64` | S4 | A14 signal | held | Gaps the `SC0` investigation of 2026-10-04 found in `schemas/`. |
| `B65` | S4 | A14 signal | held | Gaps the `ST0` investigation of 2026-10-04 found in `sets/`. |
| `B66` | S4 | A14 signal | held | Gaps the `K0` investigation of 2026-10-04 found in `skills/`. |
| `B67` | S4 | A14 signal | held | Gaps the `S0` investigation of 2026-10-04 found in `style/`. |
| `B68` | S4 | A14 signal | held | Gaps the `T0` investigation of 2026-10-04 found in `traits/`. |
| `B69` | S4 | A14 signal | held | Gaps the `W0` investigation of 2026-10-04 found in `work-types/`. |
| `B71` | S4 | A3 signal | held | No work-type produces a board, a delta or a vision. |
| `B73` | S4 | A14 signal | held | No guidance in this corpus is measured for adherence, only for comprehension. |
| `B74` | S4 | A13 signal | held | `S15` gives two counts for a decision message's picks that cannot both hold. |
| `B75` | S4 | A14 signal | held | The `A4` adherence trap depends on the real date. |
| `B10` | S5 | A4 signal | M4.1 | `CSSA`/`TSSA` is one downstream programme's vocabulary presented as a corpus convention. |
| `B39` | S5 | A3 signal | held | Style cannot be scoped by medium. |
<!-- END GENERATED: ledger -->

---

## M1 - define the set - `DONE`

**The keystone.**\
Everything in `M1` is one delta and should not be split.

| # | Item | Row | Proof it landed |
|---|---|---|---|
| M1.1 | Author `E3 - set`: what a set owns, what a member owes it, how a parent registers a child and delegates | `B5` | `DONE` - `E3` exists, `E2` cross-references it, contract passes |
| M1.2 | Require a **territory statement** on every set - the denominator without which a gap is undetectable | `B3` | `DONE` - `E3` requires it; `C0` carries the first one |
| M1.3 | Declare the charter shape, and check it the way `SC6` checks member bodies | `B4` | `DONE` - declared in `spec.charters`, checked by `check-entry-body.sh`, mutation-proven. Advisory until the 30-section debt clears |
| M1.4 | Give a member a resolvable pointer to its governing set | `B6` | `DONE` - `category` now names the set and the contract states how its charter resolves |

**Exit criteria.**\
`set` is defined and cited by at least two charters.\
A charter missing a required section is refused by a script, and the refusal is proven by injecting the defect.\
One set states its territory, and a gap in that set is demonstrably findable.

---

## M2 - hold what we prescribe - `DONE`

Close the gap between what the corpus tells adopters to do and what it does.

| # | Item | Row | Status |
|---|---|---|---|
| M2.1 | `VISION.md` at the root | `B1` | `DONE` |
| M2.2 | `docs/BACKLOG.md` as an `AR5` instance | `B1` | `DONE` |
| M2.3 | `docs/ARCHITECTURE.md` as an `AR1` instance | `B1` | `DONE` |
| M2.4 | This board as an `AR3` instance | `B1`, `B9` | `DONE` |
| M2.5 | A decision register, and a ruling on whether commit messages are a conformant `AR4` carrier | `B15` | `DONE` - [register](DECISIONS.md); commit messages ruled not a conformant carrier (`0074`) |
| M2.6 | Canonical instance filenames, decided per-entry or as one table | `B2` | `DONE` - fixed upper-case names in `AR0` (`0076`) |

**Exit criteria.**\
Every artifact type this corpus prescribes is either held by it or has a recorded reason it is not.\
An adopter reading `AR4` can point at a conformant instance in this corpus.

---

## M3 - make composition real - `DONE`

Ten of sixteen layers have no observed consumer.\
This milestone tests whether composition is structural or theoretical.

| # | Item | Row | Status |
|---|---|---|---|
| M3.1 | Amend `B53` (formerly `MREQ-9`) to the broader finding, and rule on the third reading now that `M8` cites an `AR` type | `B13` | `DONE` - `produces` applied; reverse view generated (`0079`) |
| M3.2 | Instance-check `AR3` against this board and record what it surfaced | `B9` | `DONE` - ledger and held generated from the record |
| M3.3 | Rule on `backlog/` versus `AR5` - keep both, migrate, or split by concern, without breaking `MREQ` citations | `B14` | `DONE` - `backlog/` retired |
| M3.4 | Align `M7`'s trigger with its title, so an author reaches it without already asking about anchoring | `B25` | `DONE` - trigger matches the title |

**Exit criteria.**\
Every ID-bearing layer either has an observed consumer or a recorded reason it has none.

---

## M4 - conventions and enforcement - `TODO`

| # | Item | Row | Status |
|---|---|---|---|
| M4.1 | Rule on `CSSA`/`TSSA` - keep, drop "conventionally", or promote as `E` entities | `B10` | `TODO` |
| M4.2 | Mechanize the board-record contract: every item cites a live row, every open row is on the board or in Held, milestone order matches the plan | `B16` | `DONE` |
| M4.3 | `AR2` instance naming and ordinal scheme | `B7` | `DONE` - with M2.6 (`0076`) |
| M4.4 | Retry network checks with backoff on 5xx, so throttling is told apart from a broken address | `B27` | `TODO` |
| M4.5 | Check every external address in the corpus, and make placeholders unmistakable | `B30` | `TODO` |
| M4.6 | Derive `docs/ARCHITECTURE.md`'s current projection from the completed deltas, or record exactly what stops it | `B8` | `DONE` - structure generated (`0080`) |

---

## M5 - bring the charters to `E4` - `DONE`

[`E4`](../entities/E4-charter.md) defines what a charter is: six required concerns - four at fixed headings, two answered anywhere - six conditional ones, and the rest free.

| # | Item | Row | Status |
|---|---|---|---|
| M5.1 | Audit all thirteen charters against `E4`: answered, partial or absent, citing where | `B4` | `DONE` - [audit](audits/charter-audit-against-E4.md) |
| M5.2 | Reconcile `E4` with what the audit found | `B4` | `DONE` |
| M5.3 | **Trial conversion of one charter** | `B4` | `DONE` - `M0`, verdict **improved** - [verdict](audits/M5.3-trial-verdict-M0.md), [candidate](audits/M5.3-trial-candidate-M0.md). Awaiting director review |
| M5.4 | Revise `E4` on what the trial shows, or stop if the enhancement did not improve utility | `B4` | `DONE` - territory must be derived and show a gap; growth must be paid for |
| M5.4b | **Second trial, on `A0`**, isolating whether growth comes from the standard or from `M0` missing two concerns | `B4` | `DONE` - verdict **improved**, growth paid for. Growth tracks missing concerns: 36 percent here against 78 for `M0` - [verdict](audits/M5.4b-trial-verdict-A0.md), [candidate](audits/M5.4b-trial-candidate-A0.md). Awaiting director review |
| M5.5 | Convert all thirteen, one per change - draft, audit, evaluate, director review, apply | `B4` | `DONE` - `M0`, `A0`, `R0`, `D0` **applied** - [M0](audits/M5.5-01-M0.md), [A0](audits/M5.5-02-A0.md), [R0](audits/M5.5-03-R0.md), [D0](audits/M5.5-04-D0.md); `SC0` **applied**, approved - [SC0](audits/M5.5-05-SC0.md); `MREQ-0` retired with its layer; `W0` **applied**, approved - [W0](audits/M5.5-06-W0.md); `S0` **applied**, approved - [S0](audits/M5.5-07-S0.md); the ten applied charters rechecked against the vision ruling, approved - [recheck](audits/M5.5-07a-vision-recheck.md); ruling A, the organisation's machinery is its own domains, approved - [machinery](audits/M5.5-07b-machinery-domain.md); `P0` **applied**, approved, with `P1` moved to style as `S16` and the six earlier stubs removed - [P0](audits/M5.5-08-P0.md); `E0` **applied**, approved - [E0](audits/M5.5-09-E0.md); terms defined before `K0`, approved: `gate` as `E7` - [gate](audits/M5.5-09a-gate.md), `evidence` as `E8` - [evidence](audits/M5.5-09b-evidence.md), `substrate` as `E9` - [substrate](audits/M5.5-09c-substrate.md); `K0` **applied**, approved - [K0](audits/M5.5-10-K0.md); `AR0` **applied**, approved - [AR0](audits/M5.5-11-AR0.md); `C0` **applied**, approved - [C0](audits/M5.5-12-C0.md); charters as asymptotes applied to all sixteen, approved - [asymptote](audits/M5.5-13-charter-asymptote.md); eval runs purged from history - [purge](audits/history-purge-2026-10-04.md); then the charter frame - vision and operating halves, `M11`, `M12` and `M13`, the charter shape in `SC6` - approved - [frame](audits/M5.5-14-charter-frame.md) |
| M5.5b | Revisit the compositional split behind the work axes when conversion reaches `R0`, `D0` and `W0` | `B24` | `DONE` - in the `W0` conversion |
| M5.5c | Carry the duty to expand a set on a found gap into `W0` and `T0`, or state it once in `E3` | `B31` | `DONE` - in the `W0` conversion |
| M5.5d | **Composition record**: measure a context-less agent's composition of the axis layers against the current corpus, author one declared record of how they compose and the order to read them, re-measure | `B32` | `DONE` - see `B32` |
| M5.5e | Resolve the constraint 2 / constraint 9 contradiction in the `W0` conversion | `B33` | `DONE` - in the `W0` conversion |
| M5.5f | **Axioms as asymptotes, and `system` defined** - amend `A0`, scope `M7`, add the entity; evaluate before and after | `B34` | `DONE` - **8.3 to 16.0 / 16**, approved - [audit](audits/M5.5f-asymptote-and-system.md) |
| M5.5g | **Component defined, opportunistic improvement, axiom wording pass** - evaluate before and after | `B35` | `DONE` - **7 to 10 / 10**, approved; open questions to `B36` - [audit](audits/M5.5g-component-opportunistic-wording.md) |
| M5.5h | Rule on the six open design questions, one at a time, and amend `E5`, `E6`, `A0`, `A3` or `T0` as each ruling requires | `B36` | `DONE` - six of six ruled and applied - [audit](audits/M5.5h-02-design-rulings.md) |
| M5.5i | Measure and correct the incidental defects the baseline readers found | `B37` | `DONE` - see `B37` |
| M5.5j | **Delta-1, the work layers** - procedures stay in `methodology/`, practices and rules to a new `practices/`, prose skill `K1` in; packaged skills, WorkGraph skills and the `W0` citation deferred | `B24` | `DONE` - all four stages; 21.66 to 28 / 28 - [delta](DELTAS/DELTA-1.md), [audits](audits/delta-1/) |
| M5.5k | **The explain set** - communication with a human of limited context, measured with live agents first, then designed as a set spanning layers | `B38` | `DONE` - Delta-2: `M10`, `S15`, `ST1`; human check 6 of 6 - [audits](audits/delta-2/) |
| M5.5l | State the always-on-context confound in every evaluation result, and take after-runs before a change reaches `main` | `B40` | `DONE` - see `B40` |
| M5.6 | Rebuild the charter checker - fixed headings by name, free concerns by a declared location - and re-enable it | `B17` | `DONE` - fixed headings held by `check-entry-body.sh` from `SC6`; free concerns held by review |
| M5.7 | **Add a key review to `M2`** - a fresh reader audits the answer key against the population before any evaluator runs. Trigger fired at `D0`: three of seven answers wrong, caught before use | `B29` | `DONE` - in `M2` rule 1 |

**How each charter is converted is product, not plan, and lives in the corpus.**\
The editing rule is [`E4`](../entities/E4-charter.md) section *Changing a charter*; the evaluation that tests each conversion is [`M2`](../methods/M2-test-drive-docs-by-execution.md).\
This milestone records which charters are done, not how.

**Exit criteria.**\
Every charter answers `E4`'s required concerns and has passed `M2` evaluation against its previous version.\
The charter checker tests fixed headings by name and free concerns by declared location, and gates every change.

---

## Held

Open rows no live item cites, with their scores and the condition that would revive each; generated from the record.

<!-- BEGIN GENERATED: held. Run tools/check-board.mjs --write; do not edit by hand. -->
| Row | Impact | Principle | Finding | Revival trigger |
|---|---|---|---|---|
| `B21` | S2 | A4 mandate | No axiom states the property that protects an agent against its own error. | a lone agent ships a claim it corroborated itself and was wrong, or the axiom set is next audited. Whether this is a new axiom or a property an existing one should state - `A8`'s gating and `A4`'s zero-loss are the nearest - is a question for the set. |
| `B77` | S3 | A3 mandate | The adherence runner has mission-kit built into it, so it is not yet the universal component `0087` and `0088` place in `context-lab`. | The `context-lab` vision is ratified: extract the core there behind a project-supplied seam, then retire the copies |
| `B18` | S4 | A4 mandate | Methodology has no procedure for handing over work in progress. | a handover loses information that a procedure would have preserved, or `M5` converts `M0` and the gap becomes a stated thinness. |
| `B70` | S3 | A8 signal | `W22`, and three peers, declare `evidenceAuthority: verifier-attestation` while `W0` constraint 2 says verifier-held gates use plain `kind:review`. | either is documented, or a gate is refused on the distinction. |
| `B76` | S3 | A12 signal | With today's guidance, a Gemini agent can spend a whole task fetching ledger entries. | The ledger's reading instructions are next changed, or a second run repeats the pattern |
| `B12` | S4 | A14 signal | The recovery methodology for a brownfield vision is unwritten and its reasoning is untested. | the first external brownfield adopter reports back. Waiting is deliberate - their run is the only evidence available and costs nothing. |
| `B19` | S4 | A14 signal | Methodology has nothing proportionate for a small design decision. | a small design decision fails in a way an anchoring check would have caught. |
| `B22` | S4 | A9 signal | `A9` binds every system unconditionally and is the least exercised axiom in the corpus. | a deployment fails in a way chaos validation would have caught, or `A9` is cited as the reason a change was refused. |
| `B41` | S4 | A14 signal | `M5` may push agents to over-report deferred items in messages to humans. | the explain suite's after-run shows the same, or a director reports a status update padded with deferrals. |
| `B42` | S4 | A14 signal | The communication moves have package evidence only. | for each session: the director has five minutes, or the friction log gains three rows. |
| `B45` | S4 | A14 signal | Axiom-application methodology for non-code missions. | Pick up the remaining guide layers when EITHER (a) a third non-code mission (design/governance/planning) is about to start and would benefit from disciplined axiom use beyond the M7 audit gate, OR (b) a second observed instance of "axiom-laundered wrong conclusion" occurs (an axiom-decorated decision that later proved factually unfounded). Re-triage on revival - do not resume assumptions below; re-check them against the missions observed by then. |
| `B46` | S4 | A14 signal | Work-type for extending the corpus itself. | a third layer is added or retired, OR corpus-extension work needs to be claimed on the coordination substrate rather than performed by hand |
| `B47` | S4 | A14 signal | The component design and specification altitude. | a programme states how a component specification binds upward to the duty its architecture declares, OR two programmes agree on where the boundary with code sits, OR an AR1 instance is blocked because a component's duty cannot be stated without implementation detail the architecture must not carry |
| `B49` | S4 | A14 signal | Retiring the legacy style debt that keeps the whole-corpus gate red. | a contributor or CI needs `check-all.sh --all` as a real gate rather than a known-red one, OR the remaining debt falls small enough to clear in a diff a reviewer can actually read |
| `B50` | S4 | A14 signal | The retrieval strategy for a ledger that outgrows always-on context. | the ledger passes roughly 250 entries or 50 KB, OR an agent loads it in full and still fails to route to an entry whose trigger matched what it was doing |
| `B51` | S4 | A14 signal | A provenance and trust vocabulary for an agent-maintained corpus. | an entry is found to be wrong or stale and nothing records when it was last checked or against what, OR a reader needs to weigh two entries differently and the corpus offers no basis for doing so |
| `B52` | S4 | A14 signal | The post-ratification half of a delta, and whether its required sections are two shapes. | a second programme is observed carrying standalone delta documents through to closeout, OR a delta is closed and a reader cannot tell from the type whether its to-state was reached, OR two deltas in one programme are found to bind to each other such that one inherits the other's fence |
| `B55` | S4 | A14 signal | Gaps the `AR0` investigation of 2026-10-04 found in `artifacts/`. | each gap's own trigger, as stated in the investigation; OR the next investigation of this set, which re-triages all of them. |
| `B56` | S4 | A14 signal | Gaps the `A0` investigation of 2026-10-04 found in `axioms/`. | each gap's own trigger, as stated in the investigation; OR the next investigation of this set, which re-triages all of them. |
| `B57` | S4 | A14 signal | Gaps the `C0` investigation of 2026-10-04 found in `components/`. | each gap's own trigger, as stated in the investigation; OR the next investigation of this set, which re-triages all of them. |
| `B58` | S4 | A14 signal | Gaps the `E0` investigation of 2026-10-04 found in `entities/`. | each gap's own trigger, as stated in the investigation; OR the next investigation of this set, which re-triages all of them. |
| `B59` | S4 | A14 signal | Gaps the `M0` investigation of 2026-10-04 found in `methods/`. | each gap's own trigger, as stated in the investigation; OR the next investigation of this set, which re-triages all of them. |
| `B60` | S4 | A14 signal | Gaps the `P0` investigation of 2026-10-04 found in `patterns/`. | each gap's own trigger, as stated in the investigation; OR the next investigation of this set, which re-triages all of them. |
| `B61` | S4 | A14 signal | Gaps the `PC0` investigation of 2026-10-04 found in `practices/`. | each gap's own trigger, as stated in the investigation; OR the next investigation of this set, which re-triages all of them. |
| `B62` | S4 | A14 signal | Gaps the `R0` investigation of 2026-10-04 found in `roles/`. | each gap's own trigger, as stated in the investigation; OR the next investigation of this set, which re-triages all of them. |
| `B63` | S4 | A14 signal | Gaps the `RU0` investigation of 2026-10-04 found in `rules/`. | each gap's own trigger, as stated in the investigation; OR the next investigation of this set, which re-triages all of them. |
| `B64` | S4 | A14 signal | Gaps the `SC0` investigation of 2026-10-04 found in `schemas/`. | each gap's own trigger, as stated in the investigation; OR the next investigation of this set, which re-triages all of them. |
| `B65` | S4 | A14 signal | Gaps the `ST0` investigation of 2026-10-04 found in `sets/`. | each gap's own trigger, as stated in the investigation; OR the next investigation of this set, which re-triages all of them. |
| `B66` | S4 | A14 signal | Gaps the `K0` investigation of 2026-10-04 found in `skills/`. | each gap's own trigger, as stated in the investigation; OR the next investigation of this set, which re-triages all of them. |
| `B67` | S4 | A14 signal | Gaps the `S0` investigation of 2026-10-04 found in `style/`. | each gap's own trigger, as stated in the investigation; OR the next investigation of this set, which re-triages all of them. |
| `B68` | S4 | A14 signal | Gaps the `T0` investigation of 2026-10-04 found in `traits/`. | each gap's own trigger, as stated in the investigation; OR the next investigation of this set, which re-triages all of them. |
| `B69` | S4 | A14 signal | Gaps the `W0` investigation of 2026-10-04 found in `work-types/`. | each gap's own trigger, as stated in the investigation; OR the next investigation of this set, which re-triages all of them. |
| `B71` | S4 | A3 signal | No work-type produces a board, a delta or a vision. | one of these is done as claimed work on the coordination substrate, or a project asks which work-type authors one. |
| `B73` | S4 | A14 signal | No guidance in this corpus is measured for adherence, only for comprehension. | The first adherence run is scored: write `A3` and `A14` traps next, then the remaining axioms, each key committed and audited before its run |
| `B74` | S4 | A13 signal | `S15` gives two counts for a decision message's picks that cannot both hold. | `S15` is next changed, or a reader or scorer splits on the pick count again |
| `B75` | S4 | A14 signal | The `A4` adherence trap depends on the real date. | The suite is next revised: drop the relative date, then re-run `A4` alone |
| `B39` | S5 | A3 signal | Style cannot be scoped by medium. | FIRED and moved: `S15` is the first single-medium rule; one rule does not earn a sub-set. TRIGGER: a second single-medium style rule. Nested sets need generator support, shared with `B38`'s set spanning layers. |
<!-- END GENERATED: held -->

---

## Decisions required

None open.\
A decision is entered here when a move cannot proceed without a director ruling, naming what it blocks; once ruled it moves to [`DECISIONS.md`](DECISIONS.md) and leaves this list.

