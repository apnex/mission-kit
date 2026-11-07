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
M1  define the set                               DONE
M2  hold what we prescribe                       DONE
M3  make composition real                        DONE
M4  conventions and enforcement                  DONE
M5  bring the charters to E4                     DONE
M6  make every trap able to show its guidance    DONE
M7  absorb what pull request 16 proposes         DONE
next: none selected
```

**All seven milestones are done.**\
Since M4 closed: every axiom has an adherence trap (`B73`); the second adherence pass rewrote `A3`'s and `A14`'s hydration triggers and added the rule that a shortcut instruction does not suspend a binding rule (`0098`), confirmed by a pre-registered repeat (`B89`); Grok left the evaluation pack (`0100`), and `aa-gate`'s thresholds were re-derived for the four-model design (`B90`).\
Testing a rewrite of `A4`'s trigger (`0103`) showed that `A4`'s trap cannot show whether `A4` works, the only trap of fifteen its guidance does not move; M6 builds one that can, and makes that a check every trap must pass.\
The new trap, `adherence-a4-record`, now measures `A4`: inconclusive at 12 cells per arm (`0104`), its pre-registered repeat separated, 13 of 24 cells with guidance against 1 of 24 without (`0105`), the effect lying in Gemini Argon and GPT.\
`M2` now requires that every probe and trap separate readers holding the document from readers holding none before it judges a change: a fresh audit refuted the first wording before any reader ran (`0106`), the revised wording's test could not see the change, since readers holding nothing gave its answers unaided, and the director ratified it by authority, with one clause clarified (`0107`, `0108`).\
Pull request #16 proposed three additions from another project; the director chose to absorb what fits in mission-kit's own words and ask nothing of the requester, and M7 triages it, tests the verdicts with `context-lab` and lands the absorptions (`docs/audits/PR16-absorption-triage.md`).\
The test sent all three absorptions to the director, who ratified them with one clause added (`0112` to `0115`): `E4` no longer denies relations between sets other than boundaries, `M12` can investigate a set measured against another's members, and `E8` says what a party's own account shows; the pull request is closed with a note of what was taken and where.

Since then, `C15` (`entity-graph`) was registered as a draft, cold-read twice against its vision and contract, and revised under the director's rulings of 2026-11-07; it is registered as a draft under `0116`, its vision is ratified, and a project that cannot wait may build a recorded stopgap until it is usable (`0117`).

**To return to:** the communication-moves matrix (`B42`), when the director has a session; `B70`, which waits on bug 249's details.\
The model list is settled: the pack keeps its four models (`0101`).

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
| `B102` | S1 | A2 signal | held | `SC1` says the reverse view of a work-type's `methods` is generated, and nothing generates it. |
| `B103` | S1 | A4 signal | held | `SC1`'s `retired` status keeps the id "so citations resolve", against the rule that a retired entry is deleted. |
| `B21` | S2 | A4 mandate | held | No axiom states the property that protects an agent against its own error. |
| `B111` | S2 | A2 mandate | held | `C4` declares a multi-item `change`, applied all or nothing, that `entity-store`'s implementation does not serve. |
| `B18` | S4 | A4 mandate | held | Methodology has no procedure for handing over work in progress. |
| `B95` | S2 | A4 signal | held | Claude deletes a source after flagging what the deletion loses, with `A4` and the rule against it both in its context. |
| `B98` | S2 | A4 signal | held | `M2` rule 1 does not say whether a key's audit must come before readers answer. |
| `B105` | S2 | A4 signal | held | `E7`'s list of what makes a gate's run invalid does not name an account the judge cannot check. |
| `B110` | S2 | A8 signal | held | The `S6` tool vendored into `apnex/entity-graph` predates `B83`'s fix. |
| `B70` | S3 | A8 signal | held | `W22`, and three peers, declare `evidenceAuthority: verifier-attestation` while `W0` constraint 2 says verifier-held gates use plain `kind:review`. |
| `B76` | S3 | A12 signal | held | With today's guidance, a Gemini agent can spend a whole task fetching ledger entries. |
| `B97` | S3 | A11 signal | held | Whether a probe separates readers holding the document from readers holding none is computed by hand. |
| `B104` | S3 | A2 signal | held | A set charter carries headings `E4` says every charter fixes, and nothing checks it. |
| `B106` | S3 | A3 signal | held | `C15`'s dated view may overlap `C6`'s deferred `dated-local-view`. |
| `B107` | S3 | A8 signal | held | The `S6` checker passes a line holding a second sentence that starts with a lowercase word. |
| `B109` | S3 | A3 signal | held | `C2`, `C6` and `C10` state their duty with two verbs joined by "and" and name no one concern, which `C0`'s "and" test may forbid. |
| `B112` | S3 | A8 signal | held | Nothing checks that a component's Consumes and its peers' Consumed-by agree. |
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
| `B78` | S4 | A3 signal | held | No study tests how agents compose mission-kit's components, or which boxes recur in designs that the registry lacks. |
| `B79` | S4 | A2 signal | held | The language and layout of a component are a convention held only in repositories. |
| `B84` | S4 | A2 signal | held | A registry entry's Contract section is restated by hand beside the component's own contract, the two drift, and no schema holds the capability-table form eight component repositories already use. |
| `B85` | S4 | A3 signal | held | No pattern holds one long-lived caller, started on demand and shared by short-lived processes, though the shape recurs independently. |
| `B86` | S4 | A7 signal | held | No pattern holds honest call endings - answered, refused, not delivered, unknown - with an identity that lets a repeat be recognised, though the shape recurs and the corpus names idempotency only as a primitive (`A11`). |
| `B92` | S4 | A12 signal | held | What earns always-loaded context is measured for the axioms and not for the ledger and standing context. |
| `B96` | S4 | A8 signal | held | `a4r-2`'s key splits its judges on two readings of a reply. |
| `B101` | S4 | A14 signal | held | Verifying another party's conduct across a trust boundary has no procedure. |
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

## M4 - conventions and enforcement - `DONE`

| # | Item | Row | Status |
|---|---|---|---|
| M4.1 | Rule on `CSSA`/`TSSA` - keep, drop "conventionally", or promote as `E` entities | `B10` | `DONE` - dropped from `AR1` and `AR6` (`0095`) |
| M4.2 | Mechanize the board-record contract: every item cites a live row, every open row is on the board or in Held, milestone order matches the plan | `B16` | `DONE` |
| M4.3 | `AR2` instance naming and ordinal scheme | `B7` | `DONE` - with M2.6 (`0076`) |
| M4.4 | Retry network checks with backoff on 5xx, so throttling is told apart from a broken address | `B27` | `DONE` - `check-standing-context.sh` retries 3x with backoff on 5xx/`000` |
| M4.5 | Check every external address in the corpus, and make placeholders unmistakable | `B30` | `DONE` - `<org>/<repo>` placeholders; `--addresses-only` across all tracked markdown |
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

## M6 - make every trap able to show its guidance - `DONE`

A trap measures an axiom only if agents given the guidance behave differently from agents without it.\
The second adherence pass showed that for fourteen of fifteen traps, and not for `A4`'s.

| # | Item | Row | Status |
|---|---|---|---|
| M6.1 | **Build an `A4` trap that separates guided from unguided agents**, key audited by a fresh reader, and its separation measured before it judges anything | `B93` | `DONE` |
| M6.2 | Require of every trap, in `M2`, that it separate guided from unguided agents before it judges a change | `B94` | `DONE` - `M2` rule 4 |

**Exit criteria.**\
`A4` has a trap on which guided agents score measurably above unguided ones, and `M2` requires that of every trap before it judges a change.

---

## M7 - absorb what pull request 16 proposes - `DONE`

An outside proposal is a source of lessons learned elsewhere, and the vision wants a lesson learned once, anywhere.\
The requester is asked for nothing: mission-kit triages the proposal, has the triage attacked, tests its verdicts and words what fits itself.

| # | Item | Row | Status |
|---|---|---|---|
| M7.1 | **Triage the proposal into concepts and have a fresh reader attack the triage** | `B100` | `DONE` - `docs/audits/PR16-absorption-triage.md` |
| M7.2 | Pre-register and run one `context-lab` test of the absorptions and the verdicts of "already covered" | `B100` | `DONE` - `0113` result |
| M7.3 | Word and land the absorptions, each by its own ruling, correct `E4`'s claim about inter-set relations, and close the pull request with a note of what was absorbed | `B99`, `B100` | `DONE` - `0112` to `0115`; pull request closed 2026-10-26 |

**Exit criteria.**\
Every concept in the proposal has a verdict with its evidence, what was absorbed is landed by ruling, and the pull request is closed with a note of what was taken and where.

---

## Held

Open rows no live item cites, with their scores and the condition that would revive each; generated from the record.

<!-- BEGIN GENERATED: held. Run tools/check-board.mjs --write; do not edit by hand. -->
| Row | Impact | Principle | Finding | Revival trigger |
|---|---|---|---|---|
| `B102` | S1 | A2 signal | `SC1` says the reverse view of a work-type's `methods` is generated, and nothing generates it. | the next change to `tools/generate-index.mjs`, or the next investigation of the methods or work-types set |
| `B103` | S1 | A4 signal | `SC1`'s `retired` status keeps the id "so citations resolve", against the rule that a retired entry is deleted. | the next retirement of an entry, or the next change to `SC1` |
| `B21` | S2 | A4 mandate | No axiom states the property that protects an agent against its own error. | a lone agent ships a claim it corroborated itself and was wrong, or the axiom set is next audited. Whether this is a new axiom or a property an existing one should state - `A8`'s gating and `A4`'s zero-loss are the nearest - is a question for the set. |
| `B111` | S2 | A2 mandate | `C4` declares a multi-item `change`, applied all or nothing, that `entity-store`'s implementation does not serve. | the next change to `entity-store`'s write surface, or the first consumer that lands an edit of more than one entity |
| `B18` | S4 | A4 mandate | Methodology has no procedure for handing over work in progress. | a handover loses information that a procedure would have preserved, or `M5` converts `M0` and the gap becomes a stated thinness. |
| `B95` | S2 | A4 signal | Claude deletes a source after flagging what the deletion loses, with `A4` and the rule against it both in its context. | `A4`'s trap is settled under `0104`, or `A4` or `AGENTS.md` section 5.5 is next changed |
| `B98` | S2 | A4 signal | `M2` rule 1 does not say whether a key's audit must come before readers answer. | `M2` is next changed, or the next key is audited |
| `B105` | S2 | A4 signal | `E7`'s list of what makes a gate's run invalid does not name an account the judge cannot check. | `E7` is next changed, or a gate's judge meets such an account |
| `B110` | S2 | A8 signal | The `S6` tool vendored into `apnex/entity-graph` predates `B83`'s fix. | the style tools are next vendored into a component repository, or `apnex/entity-graph`'s tools are next changed |
| `B70` | S3 | A8 signal | `W22`, and three peers, declare `evidenceAuthority: verifier-attestation` while `W0` constraint 2 says verifier-held gates use plain `kind:review`. | either is documented, or a gate is refused on the distinction. |
| `B76` | S3 | A12 signal | With today's guidance, a Gemini agent can spend a whole task fetching ledger entries. | .f.5` and `adherence-a13.on-trigger-b.f.9` at the time limit after 22 and 19 tool calls, 9 and 6 of them corpus reads; `adherence-a13.on-trigger-b.a.2` with no message after 22 seconds); whether that repeats the pattern - same model family, trap and arm, but no fetching storm - is for triage |
| `B97` | S3 | A11 signal | Whether a probe separates readers holding the document from readers holding none is computed by hand. | `0107` is ratified, or the next evaluation through `tools/eval.mjs` |
| `B104` | S3 | A2 signal | A set charter carries headings `E4` says every charter fixes, and nothing checks it. | `ST1` or `SC6` is next changed |
| `B106` | S3 | A3 signal | `C15`'s dated view may overlap `C6`'s deferred `dated-local-view`. | `entity-graph`'s design rules on whether its client view is, builds on, or differs from `dated-local-view`, or `C6`'s `dated-local-view` is revived |
| `B107` | S3 | A8 signal | The `S6` checker passes a line holding a second sentence that starts with a lowercase word. | the next change to `tools/s6-one-sentence-per-line.mjs`, or the next corpus file found holding two sentences on one line |
| `B109` | S3 | A3 signal | `C2`, `C6` and `C10` state their duty with two verbs joined by "and" and name no one concern, which `C0`'s "and" test may forbid. | the next `M12` investigation of the components set, or the next admission of a component whose duty joins two verbs |
| `B112` | S3 | A8 signal | Nothing checks that a component's Consumes and its peers' Consumed-by agree. | the next component admitted or its edges changed, or the next change to `tools/check-entry-body.sh` |
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
| `B78` | S4 | A3 signal | No study tests how agents compose mission-kit's components, or which boxes recur in designs that the registry lacks. | mission-kit's pack runs on context-lab's core (context-lab M1.2) |
| `B79` | S4 | A2 signal | The language and layout of a component are a convention held only in repositories. | a third component is founded, or a component departs from the convention again |
| `B84` | S4 | A2 signal | A registry entry's Contract section is restated by hand beside the component's own contract, the two drift, and no schema holds the capability-table form eight component repositories already use. | the first component is filed with its entry generated from its contract, or a second, unrelated project writes contracts in this shape |
| `B85` | S4 | A3 signal | No pattern holds one long-lived caller, started on demand and shared by short-lived processes, though the shape recurs independently. | operation-proxy is built and its start, staleness and idle-ending tests pass |
| `B86` | S4 | A7 signal | No pattern holds honest call endings - answered, refused, not delivered, unknown - with an identity that lets a repeat be recognised, though the shape recurs and the corpus names idempotency only as a primitive (`A11`). | operation-call is certified, so the entry can cite a working instance |
| `B92` | S4 | A12 signal | What earns always-loaded context is measured for the axioms and not for the ledger and standing context. | the director selects it, or the next change to what `AGENTS.md` or `INDEX.md` carries, or `B50`'s trigger |
| `B96` | S4 | A8 signal | `a4r-2`'s key splits its judges on two readings of a reply. | before `experiments/adherence.json` next runs, or before anything is decided on `a4r-2` |
| `B101` | S4 | A14 signal | Verifying another party's conduct across a trust boundary has no procedure. | a verification across a trust or credential boundary is run in a project readable from here, on records the party could not have written, and its verdict differs from the party's own report |
| `B39` | S5 | A3 signal | Style cannot be scoped by medium. | FIRED and moved: `S15` is the first single-medium rule; one rule does not earn a sub-set. TRIGGER: a second single-medium style rule. Nested sets need generator support, shared with `B38`'s set spanning layers. |
<!-- END GENERATED: held -->

---

## Decisions required

A decision is entered here when a move cannot proceed without a director ruling, naming what it blocks; once ruled it moves to [`DECISIONS.md`](DECISIONS.md) and leaves this list.

None open.

