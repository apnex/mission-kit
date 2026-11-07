# Absorption triage - PR #16, set-theory upstream candidates

A dated triage of the concepts proposed in pull request #16, made so that whatever fits mission-kit's vision is absorbed in mission-kit's own words and nothing is asked of the requester.\
The director chose this route on 2026-10-26: triage, review adversarially, absorb what fits, and test with context-lab where that makes sense.\
This file is the triage and its evidence; it changes no entry, and every absorption it proposes lands, if at all, by its own ruling.

---

## Identity

| Field | Value |
|---|---|
| Proposal | Pull request #16, `https://github.com/apnex/mission-kit/pull/16`, opened 2026-10-25 from a fork |
| Head | `7bf986d10ea23062b678d0b7a3123e56be2c12a6`, three commits, one candidate each |
| Base | `5b4ba53fa7f9d197d32d84024ac4d7cc3bbc79c6`, 147 commits behind `main` when triaged |
| Commit identity | All three commits are authored and committed as `Verifier <test@example.com>` |
| Triaged against | `main` at `d06ff98` |
| Mechanics | Merges into `main` without conflict; every gate passes except `S6`, on `entities/E3-set.md` line 48; the file hashes the proposal lists match its head |

The proposal's description cites a specification bundle at an internal address and an approval in a chat thread.\
Neither is copied here: neither resolves from this workspace, and this repository is public.\
The description states that the candidates were "developed and empirically validated in the `zorg` repository"; searched with `grep -rlI "MK-CAND\|CLAIM_ALLOWED"` across the whole local workspace, excluding `node_modules` and `.git`, nothing was found other than this file.\
The workspace holds a clone of `zorg` on `main` at `b7fbfb6`; the adversarial review found neither term in its tree or in `git log --all --grep`, nor `two-key`, `stage-0`, `fidelity tier` or `relational coverage`, and none of the three candidates in its `upstream/mission-kit-issues.md`.\
The clone may be behind its remote, so that validation is not claimed here.

---

## The proposal, carried whole

The proposal's diff against its base, verbatim from `gh pr diff 16` at head `7bf986d`, lines removed as well as added, so it survives the pull request being closed:
```diff
diff --git a/entities/E3-set.md b/entities/E3-set.md
index 37564d6a..3867465a 100644
--- a/entities/E3-set.md
+++ b/entities/E3-set.md
@@ -43,6 +43,11 @@ A collection is items in one place.\
 A set is a collection with a charter, which means it can be asked a question a collection cannot answer: *is anything missing?*\
 Without a stated end state and scope a gap is invisible, so an uncharted population can be audited for validity and never for completeness; an investigation against them is what finds the gap.
 
+**Internal partition completeness against relational coverage completeness (`Set A x Set B`).**\
+A set's completeness is measured either *internally* - by partitioning its own population along axes drawn from its own scope - or *relationally*, where Set B (`L0` validation topologies, test suites, controls) exists to cover the members of Set A (`F0` architectural flows, requirements, failure modes).\
+In a relational join (`M_A x M_B`), Set A supplies the denominator: an uncovered row in `M_A` is a coverage gap in Set B, and an unallocated or malformed row in `M_A` surfaces as a dual-set hygiene fault in Set A.\
+Neither charter hardcodes the join matrix in its own `Territory`, because the join changes whenever either population moves; the charter of Set B declares that its composition is relational over Set A, and a dated [`M12`](../methods/M12-investigate-a-set.md) investigation holds the `M_A x M_B` matrix citing both charters.
+
 **Set against category.**\
 `category` is the member-side declaration of set membership - the value an entry writes to name the population that governs it.\
 The set is the population; the category is the member's claim about it.\
diff --git a/entities/E4-charter.md b/entities/E4-charter.md
index 3b7ecc9b..a2f8c9c8 100644
--- a/entities/E4-charter.md
+++ b/entities/E4-charter.md
@@ -145,6 +145,9 @@ No member can state them, so they are a set property.\
 A charter's probes are derived from its population - from what members actually do - and never from the text of its latest revision, or they can only confirm that revision.\
 Weakening a probe is a change to the charter's standard and is as visible in review as weakening a claim.
 
+Where the investigator running [`M12`](../methods/M12-investigate-a-set.md) sits across a trust or credential boundary from the runtime substrate that executes the set's members, self-reported execution summaries cannot serve as probes.\
+The charter then specifies a **two-key cross-trust-boundary probe**: (1) an immutable raw platform audit-log export anchored by platform-minted event IDs and timestamps, (2) a deterministic cross-consistency script verifying bijective identity across audit logs, state snapshots, and member receipts, and (3) a post-hoc challenge-response query against random audit-log entries.
+
 ### Free - everything else
 
 A charter's remaining sections are its own.\
diff --git a/methods/M12-investigate-a-set.md b/methods/M12-investigate-a-set.md
index e489f907..7b37c0eb 100644
--- a/methods/M12-investigate-a-set.md
+++ b/methods/M12-investigate-a-set.md
@@ -16,12 +16,12 @@ An investigation is a dated analysis of a set's population against its charter's
 It produces a partition, the place of each member in it, and the gaps; the charter is unchanged by it.
 
 1. **Read the charter and every member.** The vision and scope say what the set is for; the growth policy says how it grows and what members are balanced on.
-2. **Propose a partition derived from the members** - their triggers, their subjects, the moments or risks they address - so that every member lands in it, and in exactly one place. A member that fits nowhere, or everywhere, is evidence the partition is wrong. More than one partition is usually defensible; state why this one was chosen.
+2. **Propose a partition derived from the members - or a coverage join (`M_A x M_B`) where the set covers another charted set.** For an internal partition, cut by the members' triggers, subjects, or moments so that every member lands in it, and in exactly one place. Where Set B's charter declares relational coverage over Set A, form the cross-set coverage matrix `M_A x M_B`: every populated member of Set A must map to at least one primary covering member of Set B (totality), each member of Set B must state its unique marginal coverage (minimal covering set), and unallocated or malformed members discovered in Set A are recorded as upstream Set A hygiene findings. More than one partition or join is usually defensible; state why this one was chosen.
 3. **Let the scope set the extent, not the population.** A cell no member fills is kept and named as a gap; removing it to match the population erases the gap it exposes.
 4. **Test each gap.** Search the corpus for a member, or guidance elsewhere, that already fills it, and name the searches run. A gap that survives is real; a candidate that would fill it is named where one exists.
 5. **Show a gap or argue there is none.** A partition that names at least one checked absence has shown it can detect one; one that names none must say why the population is complete against it.
 6. **Check the balance** against the growth policy: a crowded cell beside empty ones is a finding.
-7. **Record it in the project's own record**, dated, citing the charter it measured against. The charter does not link to it.
+7. **Record it in the project's own record**, dated, citing the charter (or both charters in a cross-set `M_A x M_B` join) it measured against. Where the investigation probes runtime execution across a trust boundary, attach the three-part two-key verification receipt (raw platform audit-log export, deterministic cross-consistency script verdict, and post-hoc challenge-response probe). The charter does not link to it.
 8. **Carry each gap to the backlog** ([`AR5`](../artifacts/AR5-backlog.md)) as a row with a revival trigger; the board ([`AR3`](../artifacts/AR3-board.md)) weighs them for the director.
 9. **If the vision, scope or growth policy is itself shown wrong,** propose a re-aim under [`M11`](M11-change-a-charter.md); a finding about members - overlap, crowding, a candidate - is acted on by [`M13`](M13-change-a-set.md).
 
diff --git a/methods/M13-change-a-set.md b/methods/M13-change-a-set.md
index 8b412461..2036b5b5 100644
--- a/methods/M13-change-a-set.md
+++ b/methods/M13-change-a-set.md
@@ -23,9 +23,9 @@ This method is the first; [`M12`](M12-investigate-a-set.md) analyses the populat
 4. Give it the frontmatter [`SC1`](../schemas/SC1-catalog-entry.md) requires, a hydration trigger that states a condition ([`S14`](../style/S14-hydration-triggers-state-a-condition.md)), and the body sections its category declares in [`SC6`](../schemas/SC6-entry-body.md), if any.
 5. Regenerate the index and pass the gate.
 
-**Modify a member.**
+**Modify or promote a member across fidelity tiers.**
 
-1. An edit in place keeps the id.
+1. An edit in place keeps the id. Where a set's charter stratifies members by fidelity tier (`E4`), promoting a member from a bootstrap tier (`Stage-0` stand-in) to a higher fidelity tier (`Stage-1` full functional stand-in or native substrate) is an in-place modification under the same member id: update the member's declared fidelity tier, widen its `CLAIM_ALLOWED` ceiling only for the planes newly validated, and retain earlier stage discoveries in its record.
 2. A change that would alter what a reader decides is tested before it lands, by [`M2`](M2-test-drive-docs-by-execution.md), with the previous version as the comparison.
 3. Changing the id inside the file retires the old id; that is a replacement, below, not an edit.
 4. Regenerate the index if the title or trigger changed, and pass the gate.
```

---

## Concepts

Each candidate is split into the separate claims it makes, stated without the vocabulary of the project it came from, so that a weak claim does not sink a strong one beside it.

| Id | Concept | From |
|---|---|---|
| C1a | A set that exists to cover the members of another set takes its denominator from that set's population, and is complete when every member of it is covered; this is a second kind of completeness beside measuring a set against its own scope. | 01 |
| C1b | Investigating such a set finds two kinds of finding: a member of the covered set that nothing covers is a gap in the covering set, and a member of the covered set found missing or malformed is a finding about the covered set. | 01 |
| C1c | Each member of the covering set must state its unique marginal coverage, so that the covering set is minimal. | 01 |
| C1d | Neither charter holds the matrix of who covers what; a dated investigation holds it, citing both charters. | 01 |
| C1e | The notation `M_A x M_B` and the examples `L0` and `F0`. | 01 |
| C1f | Replacing `M12` step 2 drops its misfit test - a member that fits nowhere, or everywhere, is evidence the partition is wrong - and drops risks from the axes a partition may cut by, for internal partitions as well as joins. | 01 |
| C1g | Every covered member maps to at least one *primary* covering member. | 01 |
| C2a | Promoting a member to a higher tier of fidelity keeps its id. | 02 |
| C2b | A charter may sort its members into tiers of fidelity. | 02 |
| C2c | On promotion, what the member may claim widens only as far as the new validation reaches. | 02 |
| C2d | On promotion, what earlier tiers discovered is kept in the member's record. | 02 |
| C2e | The heading rename, and the names `Stage-0`, `Stage-1`, `CLAIM_ALLOWED` and planes. | 02 |
| C3a | Where the one judging sits across a trust boundary from the party whose conduct is in question, that party's own summary of what it did cannot settle a claim about what it did. | 03 |
| C3b | The remedy: evidence minted by the platform rather than the party, checked mechanically for consistency across independent records, and challenged at random after the fact. | 03 |
| C3c | Placing that remedy in `E4`'s probes and in `M12`. | 03 |
| C3d | The name "two-key" for a check of three parts. | 03 |
| C3e | The trigger includes a credential boundary: the judge lacks access to observe the conduct, not only reason to trust the party. | 03 |

---

## Searches run

Every verdict of "already covered" or "absent" below rests on these, run against `main` at `d06ff98`; a miss is a claim about these searches, not about the corpus.

1. `git grep -nIi "fidelity\|stage-0\|stage-1\|CLAIM_ALLOWED\|FRIC-"` outside run records: no fidelity tier, stage of fidelity or claim ceiling is defined; `stage-1` appears only as a delta stage, and `fidelity` in its technical sense only in `A9`'s measured delta between simulation and production.
2. `git grep -nwE "L0|F0"`: 21 hits in three files - ten each in two captured tool listings, `docs/audits/M5.5-08-sets-flake-capture.txt` and `docs/audits/sets-flake-capture-2.txt`, and one in `skills/sysml-skill-builder/references/building-a-skill.md`, where `L0` names a modelling level; neither is an entry id in this corpus.
3. `git grep -nIiE "\bcover(s|age|ed|ing)?\b"` across the entry layers: the hits relevant here are listed under C1a.
4. `git grep -nIiE "traceab|\bspans?\b|denominator"` across entries, methods, sets and artifacts.
5. `git grep -nIiE "self-report|trust boundar|audit.log|challenge|platform-minted|minted by|reporting on itself|own report"` across entries, methods, patterns, rules, practices, axioms, `AGENTS.md` and `README.md`.
6. `grep -rlI "MK-CAND\|CLAIM_ALLOWED"` across the local workspace: nothing but this file, `zorg`'s local clone included.

---

## Verdicts

Revised after the adversarial review below; where the review changed a verdict or its reason, the table carries the revised one.\
Tally: 17 concepts - 3 absorbed (`C1c`'s orphan check with `C1b`), 6 already covered, 7 rejected, 1 parked.\
**Correction.**\
The commit that landed this triage, `45cb8a1`, says four absorbed and six rejected; the table is right and that message is not.

| Id | Verdict | Where, or why |
|---|---|---|
| C1a | **absorb** | Practised here and stated as a success measure in two charters (`W0` *Attachment*, `T0` *Binding*), but stated as a kind of completeness in none of `E3`, `E4` or `M12`, and contradicted by `E4` (below). |
| C1b | **absorb, reworded** | `M12` as written cannot run such an investigation: a covering member may cover several members (`A7` binds two traits; `M1` is cited by `W8` and `W10`), and step 2 reads that as a wrong partition. What it lacks is the reading for a coverage scope. Which set an uncovered member indicts is not fixed: in `W0` the covering set, in `T0` the covered one, since a trait no axiom would name binds nothing and is not admitted. |
| C1c | **reject**, cores placed | Stating what a member alone covers needs knowledge of siblings it "has no standing to describe" (`E3`), and minimality forbids overlap that is often deliberate. A covering member declaring what it covers names another set's members, not siblings, and is the corpus's rule (`README.md`, *Mechanics*; `0020`, `0039`): already covered. One covering nothing is the orphan `tools/check-enforcers.sh` rejects: absorbed with C1b. Whether double cover is a fault is the covering set's `Faults` or growth policy to say, against which `M12` step 6 reports crowding: already covered. |
| C1d | **already covered**, by different text | Keeping the matrix out of both charters follows from `E4`, `0065` and `0069`. Where it lives is answered differently here: declared on the members of the side whose meaning includes it, with the reverse view generated (`README.md`, *Mechanics*; `0020`), and an investigation records what that view shows at a date; a matrix held whole in an investigation where a declaration exists is the typed index `README.md` names a fault. |
| C1e | **reject** | `L0` and `F0` are not ids here (search 2), citing an id the corpus has not minted breaks mint-before-cite, and the notation adds nothing the prose cannot carry; and examples are generic (`README.md`, admission rules). |
| C1f | **reject** | A regression: the misfit test is what lets a partition fail (`M12`, rationale). Its likely cause - a covering member landing in several cells - is real, and is answered under C1b rather than by deleting the test. |
| C1g | **reject** | No instance here distinguishes a primary cover, and every entry derives from a real finding (`README.md`, admission rules). |
| C2a | **already covered** | `M13`: "An edit in place keeps the id", and only changing the id is a replacement; a tier is a kind (C2b), not an id. |
| C2b | **already covered** | `E4`'s conditional concern *Kinds*, required when "members come in more than one sort", asking "What sorts exist, and how is a member told which it is?" |
| C2c | **already covered, to be measured** | `AGENTS.md` 5.2 ("If you cannot state what the substitution would miss, it is not a proxy"), `A9`'s measured simulation-production delta, and two binary cases, `W11` ("a probe against a mock ... is FAIL") and `M2` workflow rule 3 (run in the real environment, "not a synthetic stand-in"). None grades a claim by how far a stand-in's validation reaches, and the strongest text is standing context, not an entry. If readers of the corpus miss it, the home is `E8`, *Discriminators*, beside C3a. |
| C2d | **already covered** | `A4` ("Summarization is loss"), `A14`'s capture-on-discovery, `RU2`, which freezes the records discoveries were written in while the member itself is updated in place, and `AGENTS.md` 5.5. |
| C2e | **reject** | The names belong to the project they came from; `E4` defines no fidelity tier, so "stratifies members by fidelity tier (`E4`)" cites a statement `E4` does not make; and examples are generic (`README.md`, admission rules). |
| C3a | **absorb, narrowly** | Present for reviews - `M1` (inputs "produced by the author" audit the author's coherence, not the code's correctness) and `AGENTS.md` 5.2 - but `E8` frames independence by the judge alone, and `W8` gates "on evidence the verifier did not author", which an executor's own transcript satisfies: sound where the judge can re-check, silent where it cannot. |
| C3b | **park, as a backlog row** | From the judge's side it is a procedure producing a verdict, so a candidate for `methods/`, most likely strengthening `M1` or `W8`'s evidence contract (`M0` growth policy); `M0` admits a procedure only when following it has been observed to change the work, which is not readable from here (search 6). From the designer's side it would be a pattern whose recurrence is public - transparency logs, attestation with a verifier's nonce, auditors' external confirmations - as `B85` and `B86` accept public instances, while every project in this workspace shares one author. Revival: a verification across a trust or credential boundary is run in a project readable from here, on records the party could not have written, and its verdict differs from the party's own report. Filed under `RU3` when this triage lands. |
| C3c | **reject** | `E4`'s probes are questions a reader holding only the charter must answer, not observations of a running system, and `M12` analyses a population against its charter and observes no execution; the remedy is in the wrong kind of document in both. `E9` and `0064` also fix *substrate* to the coordination substrate, so "runtime substrate" cannot stand. |
| C3d | **reject** | Naming; "two-key" conventionally means two parties must both act, not three records checked by one judge. |
| C3e | **already covered** | `AGENTS.md` 5.1 (`NOT-CLAIMED` is a valid output; liveness is not provable from a repository) and 5.2 (`UNRUNNABLE` is a valid verdict); folded into C3a's wording. |

**Why C1a is absorbed.**\
Mission-kit already measures one charted set against another's population, in charters: `W0` counts *Attachment* - "every procedure that conducts work is cited by a work-type" (`0039`) - and its 2026-10-04 investigation records the shortfall as a gap; `T0` counts *Binding* - "every trait is named by an axiom, or would be"; and under `0079` "the types no work-type produces are a recorded gap".\
`tools/check-enforcers.sh` and `0083` relate a set to things that are not sets - a mechanism layer (`E2`) and evaluation files - and are not counted.\
None of these is stated as a kind of completeness in `E3`, `E4` or `M12`, which name only a set's own scope as its denominator.\
And `E4` states the opposite: "A set defining itself against a neighbour is stating a boundary, and every observed instance of an inter-set relation takes that form."\
The relations above are not boundaries, and neither are two the corpus already states - a domain cites the axioms it must satisfy and no axiom names a domain (`axioms/README.md`), and a work item is generated from three sets' members (`W0`), which `E4` itself lists among the forms of Composition.\
The root charter already says how such relations are held: declared once, on the side whose meaning includes it, every reverse view generated (`README.md`, *Mechanics*; `0020`).\
The sentence is false as measured, was arguably false when written - its source audit, `docs/audits/charter-audit-against-E4.md` section 3.4, lists the one-way citation - and correcting it is owed whether or not anything else is absorbed.

---

## What absorption would change

Sketched, not worded; wording comes under `M13` - each target is a member, not a charter - with a ruling each; `M11` applies only if a charter changes.\
`0006` governs charters; `0091` and `M13` step 2 govern these entries.

| Absorbs | Entry | Change |
|---|---|---|
| C1a | `E4`, *Relations to other sets belong here* | Correct the claim that every inter-set relation is a boundary, under a correction banner, naming the relations that are not and where `README.md` says they are held. Owed whatever else lands. |
| C1a | `E4`, *What a territory states* | A scope may be stated as another set's population - "every member of that set". Only if the test shows readers need it. |
| C1a | `E3` | Dropped: the denominator is already "the end state and scope" (`E3`), and the clause would restate it. |
| C1b, C1c | `M12`, steps 2, 3 and 8 | Where the scope is another set's population, its members are the cells and a member here may sit in several; read the relation where it is declared, and its generated view where one exists, building it by hand only where none does, which is itself a finding; a covered member nothing covers is a gap for the set whose purpose includes the relation, the side it is declared on; a member here that covers nothing is outside the scope or shows a member the other set lacks; each goes to the backlog naming the set it is about. |
| C3a, C3e | `E8`, *Discriminators* | Evidence produced by the party whose conduct is in question settles what that party reported; it settles the conduct only where the judge can re-run the work or check the report against a record the party could not have written, and a judge who can do neither says so rather than passing it. |

---

## Test, to be pre-registered after the review

One `context-lab` run, built under `M2` rule 4, can test both the absorptions and the verdicts of "already covered": probes for each concept, put to readers holding nothing, readers holding the corpus as it stands, and readers holding it with the absorptions.\
A probe on an "already covered" concept should be answered by readers of the current corpus; a probe on an absorbed concept should be answered better by readers of the revised one; any probe readers holding nothing answer as well decides nothing.\
The probes, key, arms and predicates are written and audited before any reader runs.\
The arms state whether `AGENTS.md` is part of the corpus as it stands: C2c, C2d, C3a and C3e rest partly on its section 5, which carries no id and is not in the adopter template.\
A concept outside practice already teaches may not separate readers holding nothing from readers holding the corpus; that outcome is pre-registered as `UNRUNNABLE` for its verdict, not a confirmation.

---

## Adversarial review

A fresh agent, holding the repository and none of the author's session, attacked this triage before any absorption was worded, under `W10` and `M1`, with four inputs: the proposal, the corpus on `main`, the archaeology of the rulings and entries concerned, and outside practice from its own knowledge, marked inferred.\
Session `ses_e8a914e85ffeRs1sNr6QxuYP52`; verdict: triage holds with changes.\
It turned no absorb into a reject and no reject into an absorb.\
It found `C1b`'s rule overgeneralised, `C3a`'s wording ineffective, `C1d` resting on the wrong text, `C3b` in the wrong layer with the wrong revival trigger, three concepts missed (`C1f`, `C1g`, `C3e`), the proposal carried without its removed lines, two searches miscounted, and `C1a`'s evidence partly mis-chosen; all are applied above.\
The author checked its central measured claims before applying them: the *Attachment* and *Binding* measures, `README.md`'s *Mechanics* and admission rules, the `L0`/`F0` count, the `W8`, `W11` and `M1` quotes, and the `zorg` clone's revision.

---

## Outcome

Recorded after the fact, on 2026-10-26.

The test, run `2026-10-26-005243-absorb16`, sent all three absorptions to the director, and every concept judged already covered read as covered by general practice - readers holding nothing met it as often as readers of the corpus.\
The director ratified the absorptions with one clause added: `E4`'s correction (`0112`), `M12`'s reading of a set measured against another's members (`0113`), and `E8`'s *The party's own report* (`0114`), whose last clause says that at a gate an account the judge cannot check gives no verdict (`0115`).\
They landed on `main` at `3393178`, and the pull request was closed with a note of what was taken and where; nothing was asked of the requester.\
`C3b` stays parked as `B101`.

