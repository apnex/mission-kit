# Evaluation suites

The standing probes that measure whether cold agents read this corpus as intended.\
Run with [`tools/eval.mjs`](../../tools/eval.mjs); method in [`M2`](../../methods/M2-test-drive-docs-by-execution.md), *Reasoning documents*.

---

## Layout

```text
docs/evals/
  <suite>/suite.json   probes, keys and rubrics - the live key for the current corpus
  runs/<run-id>/       one run: prompts, answers, scorer prompts, scores, RESULT, sealed mapping
```

Each suite names the frozen key it came from in `source`.\
The frozen key in `docs/audits/` is the record of what was measured then and is never edited.\
The suite holds what is correct now, and changes when the corpus legitimately changes - a suite edit is a ruling about the corpus and says so in its commit.

Suites are under `docs/` because they are about this corpus, and because `eval.mjs export` strips `docs/`, so no export carries a key; a reader is kept to its export by its prompt alone (`B124`).

---

## The context-lab pack

`docs/evals/context-lab/` is mission-kit's pack for [context-lab](https://github.com/apnex/context-lab), the shared evaluation component (`0087`, `0088`).\
It is the single source of truth for the `adherence`, `explain`, `handoff`, `aa`, and `c0` suites (`B80`); the earlier `docs/evals/adherence/suite.json` and `docs/evals/explain/suite.json` copies are retired alongside `tools/adherence.mjs` and `tools/eval-human.mjs` (`B77`, `B80`).\
By `0149`, historical experiment files under `docs/evals/context-lab/`, `docs/evals/human/`, and `docs/evals/standing/` are git-ignored working material alongside `docs/evals/runs/`, while the active `<suite>/suite.json` definitions remain tracked.

---

## A run

Runs are written under `docs/evals/runs/`, which git ignores: they are working material, kept on local disk and never published.\
An audit quotes each run's name and the scores it found, and that quotation is the published record.


```sh
c=$(node tools/eval.mjs export --out /tmp/eval | cut -f1)
node tools/eval.mjs prepare --suites composition,system-boundary,axiom-direction,component,component-a3 \
  --corpus head="$c" --readers 3 --out docs/evals/runs/<run-id>
```

Give each line of `TASKS.md` to a fresh agent as its whole instruction.\
Then blind the answers, give each scorer line to a different fresh agent, and score.

```sh
node tools/eval.mjs status --run docs/evals/runs/<run-id>
node tools/eval.mjs blind  --run docs/evals/runs/<run-id>
node tools/eval.mjs score  --run docs/evals/runs/<run-id>
node tools/eval.mjs compare --base docs/evals/runs/<baseline>/RESULT.json --head docs/evals/runs/<run-id>/RESULT.json
```

A before-and-after run passes two `--corpus` options to one `prepare`, so both versions are scored blind by the same scorer.

---

## What a result can and cannot claim

Readers and scorers are agents of one model family unless a run states otherwise, so agreement across them is one measurement family, not several.\
The scorer is independent of the author of the change and blind to version; it is not independent of the key, which the author wrote and a fresh reader reviewed.\
**Every reader also receives the harness's always-on context** - the workspace `AGENTS.md` and the ledger fetched from `main` - whatever corpus it is handed (`B40`).\
Comparisons between two corpora are fair, since both arms carry it; a claim that a corpus helps against no corpus is confounded by it, and an after-run is taken before its change reaches `main`, or the control receives the change through the ledger.

---

## Not yet migrated

The `R0`, `D0`, `M0` and `A0` charter evaluations in `docs/audits/` are not yet suites.\
Their keys were written for the charters as they stood, and at least one answer is now false - `D0`'s product-data probe predates `D7` - so migrating them means re-deriving each key, not copying it.

---

## The regression rule

Decided before any comparison is run, so it cannot be chosen after the numbers are seen.

`compare` runs at tolerance 0, so every drop is reported.\
A reported drop is then classified by reading the scorer's reasons:

- **A regression** if the drop traces to text the change altered, or to a reading the change made possible. The change is corrected before it lands.
- **Noise** only if the text the probe depends on is unchanged and the scorer's reasons are hedges of a kind the baseline already shows. With three readers, one reader moving one point moves a mean by 0.33.

Every classification is recorded with the run, so a reader can check it.

---

## Key reviews

Every suite's keys are audited by a fresh reader before first use, and corrected before any reader runs.

| Suite | Review found | Corrected |
|---|---|---|
| `boundary-bypass` | the preamble ruled out one of the ruling's two outcomes; B3 dropped "adjust the interface"; B4 cited `C0`'s adjustment rule, which governs registered components and is itself an open question; "recorded" stated where the ruling says nothing | all four |
| `work-layers` | the questions copied their target entries' wording, so they would measure text search; the director's `B24` wording had leaked into two probes; L6 quoted a sentence `W0` does not contain | questions reworded in plain terms; leaked wording removed; L6 keyed to `W0`'s actual text |
| `explain` | the harness told readers to cite files while the suite forbade it; the scorer's guess cap would have penalised required labelling of inferred claims; readers' self-explanations would have unblinded a before-and-after run; X1 lacked a deadline and contradicted the preamble; X2 lacked the risk it asked for; X3 gave away its separating experiment and left a fact ambiguous; X4 required an order the goal does not; rubrics were too broad to interpret | harness: instructions, scorer instructions and a stripped self-explanation per suite, each tested; fixtures completed; rubrics gated on core properties and required to name failing properties |
| `gate` (G7) | the key was right for the corpus before and after `0129`; the question asked only for the verdict, while the rubric gave full marks only to an answer that also said the work waits | the question also asks what happens to the work, in the auditor's words |
| `lone-gate` (L1, L2) | both keys were grounded across `96a8aef`, `fbc248d` and `0132`, and `L2` matched its rubric; `L1`'s rubric required naming executor/author evidence rather than assurance for full marks while the question asked only whether the result satisfies the gate | `L1` also asks what standing its result carries, committed before any reader ran |
| `board` (B1-B4) | `B1`, `B3` (bounded `fifth tier` vs `third tier`) and `B4` were grounded across `AR0`, `AR3`, `AR4` and `AR5`; `B2`'s rubric required stating that the `Held` list is generated for full marks while the question asked only what makes a row held | `B2` also asks how the board's `Held` list is produced, committed before any reader ran (`0136`) |
| `charter-stress` (CS1-CS3), `gate` (G1), `s0` (Q4, Q7) | `CS1` omitted a direct cue for nested sub-sets inside a layer; `CS2` left open whether to name each of `C0`, `ST1` and `S0`'s stress passes; `CS3` omitted a direct cue for `PC0`'s moments-of-work pass and the single-occupant retirement rule; `gate.G1`'s key omitted that the three kinds are classified by who judges; `s0.Q4` added `S16` under `By reading` and `s0.Q7` dropped `legacy debt converted in one sweep` after `0140` moved it to `Enforcement boundary` | all five aligned and committed before any reader ran (`0139`, `0141`) |
| `charter-stress` (CS4, CS5), `sc0` (Q7) | `CS4` was narrowed to `W17`-`W19`/`W21` and `K18`/`K23`-`K26` and its rubric replaced `below R4 (E1)` with `below the director's altitude (E1)`; `CS5` replaced stripped `docs/` phrasing (`Under 0142`, `rule, or work-type`, and `catalog.json's schemas and resources arrays`) with `E0`, `T0`, `A0`, and `SC0`'s exact exported `Operation` text; `sc0.Q7` dropped `(EntryBody today)` after `0144` registered `EntryBody` in `schemas/catalog.json` `resources` | all four aligned and committed before any reader ran (`0142`, `0143`, `0144`) |
| `charter-stress` (CS3, CS6), `s0` (Q4) | `CS3`'s rubric assumed `practices/` still held a single member after `0147` admitted `PC2`; `CS6`'s key and rubric restated `tools/s17-source-comments.sh`'s checks slightly differently from `s17-source-comments.sh` lines 74-130 (at `e0e357515252ddba866380e36ae07ac7d722111e`) and required `style/README.md`'s index grouping without the question asking for it; `s0.Q4` passed (`0` defects) | `CS3.rubric` and `CS6.key`/`CS6.rubric` aligned and committed before any reader ran (`0145`, `0146`, `0147`) |

---

## Suite edits

| Suite | Edit | Why |
|---|---|---|
| `system-boundary` | the service is stated to be not declarative | the fixture left the declarative trait open, so careful readers correctly hedged `A2` and the rubric capped them. Found when the first regression check flagged S1, S2, S3 and S5; earlier hand scoring had passed the same hedge |
| `explain` | the stands-alone property required general engineering terms to be explained | corrected by director ruling: a competent cold reader is assumed to know general engineering terms; only system-specific names must be explained. The baseline was re-scored against the corrected key; the original run is unchanged |
| `layer-charters` | the placement sequence's style step - checkable from the text alone - would file three of the four rules as style, and contradicted H1; H3 stated its own answer; H7 would stop being unique once rules leave the procedure layer; H2 paraphrased an existing entry | style is what governs how an artifact is written, its form, whatever the work was; H1 and H2 replaced with fresh rule and practice examples; H3 reworded and its control reason accepted; H7 asks for a moment with nothing governing it |
| `charter-claims` | `V8` places retiring an entry under `W3` again | director ruling: no stubs, so retiring an entry is deleting it with its disposition recorded, which is `W3`'s hard cut. Runs `md-02` and earlier scored the stub-era corpus and are unchanged |
| `layer-charters` | `H7` asks for the kind of work with nothing governing it, not a whole moment | after the vision recheck every moment has some member - `M10` holds handing over to a human - so the question's premise was false and careful readers hedged on it in five runs; the gap is the agent-to-agent handover within that moment |
| `e0` | `Q4` now has `E7` defining gate, then `E8` defining evidence; `Q5` asks for an undefined term, not an empty kind | the gate rulings added `E7`. In `gate-regression` all three readers named `E7` and scored 0 against the old key; under the new key each is correct. With `E9` every kind holds an entry, so `Q5`'s 'kind with no entity' had no answer and all three readers in `substrate-regression` hedged on it |
| `work-layers` | `K3 substrate-audit` renamed `K3 repo-audit` | director ruling: `substrate` means the coordination system only, so the audit skill is renamed. Earlier runs scored the old name and are unchanged |
| `sc0` | `Q4` accepts that the split is one partition, not canonical | the charter-as-asymptote ruling moved partitions to investigations; in the asymptote regression run one reader correctly called the split non-canonical and was capped |
| `charter-claims` V3 V4 V10, `p0` Q5, `k0` Q4, `ar0` Q4, `e0` Q4 Q5, `c0` Q4, `sc0` Q4 | gaps found by reading members against the charter's scope score in full; the charter not recording them is not a hedge; any consistent partition scores | director rulings: charters name no gaps and do not know their investigations. In `noinv-regression` every reader found the absence and hedged only on whether it was a recorded gap, which the corpus by design no longer says |
| `asymptote` | `Z1` no longer names the Purpose heading | the charter frame renamed it Vision |
| `charter-frame` | `F3` adds `M13` | director ruling: operating the set it governs is distinct from operating the charter |
| `p0` | `Q4` and `Q6` no longer name `P1` | director ruling: `P1` moved to style as `S16`, with no stub. Run `p0-01` scored the earlier corpus and is unchanged |
| `charter-claims` | `V8` re-keyed from *none* to `W1`/`W2`/`W3` on `D6` | director ruling A: domains divide by engineered product and the build, land and retire work-types act on the knowledge domain. Run `cc-01` scored the earlier state and is unchanged. After run `md-01`, readers showed retiring an entry is superseding, which `W3` - a hard cut, not a deprecation shim - does not fit; the key now places it under `W1` |
| `charter-claims` | `V7` asks whether the absence is inside the schemas set's claim, not whether a contract *should* exist | in `md-02` all three readers gave the key's answer and hedged only on whether to build one now - a gap is not an order to build, and the set lists a contract ahead of its consumer as a fault. The question invited a build decision the key never asked for |
| `work-layers` (stage 4) | keys named only the pre-Delta-1 homes; L5 scored down a faithful after-corpus reader citing RU0; L6's after-key had no skill test; L7 left the before-layer implicit | keys accept each corpus's answer; L5, L6, L7 corrected; L7 added after the change was drafted |
| `design-rulings` | one shared preamble contradicted R4 and answered R3; R6 read as an unchanged contract; R4 claimed multi-agent with no fact for it; R2 turned the ruling's 'only if' into 'if' | facts per question; R6 states the documented behaviour changes; R4 states only the state the trait test needs; R2 credits the chaining condition |
| `design-rulings` (after run) | R2 placed A, B and C in one service, where containment already binds and chaining does nothing - a gap in `E5`, fixed at the source; R5 required a point the question did not ask | R2 set in separate services; R5's rubric scores what is asked |
| `system-boundary` (S2, S5) | readers hedged across many runs; read sentence by sentence, the hedges were on facts the fixtures omitted - whether the interface is versioned, whether the changed lines are the ones parsed. `E5` also gained the default, unversioned unless declared | fixtures state both facts |
| `sc0` | Q4's discriminator, who validates, was false - the gate validates all six; Q7 listed two single-schema faults as population faults; Q6 missed catalog.json and bundles | Q4 separates by whose instances; Q7 lists measured population faults; Q6 widened |
| `w0` | Q5 put who-checks on the role and the domain as what work alters; Q7's unconditional 'add a work-type' contradicted the incident precedent; Q8 listed a member fault | Q5 sources corrected from R0 and D0; Q7 conditional on a closeable node, routing note otherwise; Q8 population faults only |
| `composition` (P1) | readers hedged A2, the fixture leaving the declarative trait open | fixture states the service is not declarative |
| `self-check` (U3) | in `mkhc-eval-run-r1` all three `head` readers answered that `SC1` and `M13` agree on deleting retired files with no stub and scored 1 because the rubric also required ID non-reuse, which the question did not ask | `U3` asks both whether the file stays or is deleted with no stub and whether a retired ID may ever be reissued |
| `composition` (P1, P2), `system-boundary` (S1-S3, S5) | the `any-system` floor keys named `A3, A4, A8, A9, A14`, predating `A15` (`0121`) and `A16` (`0123`) | floor keys updated to include `A15` and `A16`; earlier runs scored the fourteen-axiom corpus and are unchanged |
| `gate` | `G7` added: a verifier handed only the builder's own message that the tests passed, with nothing to check it against | `0129` names in `E7` the case `0115` put in `E8` (`B105`), and no probe asked it as a question about a gate. Keyed from `0115` and committed before any reader ran; the key is the same for the corpus before and after `0129`. Earlier runs scored six probes and are unchanged |
| `lone-gate` | new two-probe suite (`L1`, `L2`) in its own reader group | `B120` noted that `composition.P5` could not separate whether post-`0127` lone-agent readers no longer learn their own check is owed or merely name the gate's outcome as what they do instead; placing `L1` in its own group tests that question directly without cueing `composition.P5` or being cued by `self-check.U1` (`0132`) |
| `board` | `B2` also asks how the `Held` list is produced; `B3` bounds the two impact tiers (`fifth tier` vs `third tier`) and drops instance-only `S2`/`S4` shorthand from the key | in `2026-11-12-climb4-r1-board-gate`, `2` of `3` `base` readers hedged on `B3` because `"higher impact"` left the top tier open (`B129`), and the `B29` audit found `B2`'s rubric required naming generation (`0136`) |
| `gate` (G1), `s0` (Q4, Q7) | `gate.G1` also asks `"and what are its kinds?"` and its key notes classification by who judges; `s0.Q4` adds `S16` under `By reading`; `s0.Q7` drops `legacy debt converted in one sweep` | `10` of `12` readers across Climb 4 scored `1` of `2` on `gate.G1` by giving the three parts rather than the three kinds (`B133`); `S16` moved from `P1` in `0058` as a rule held by reading (`B133`); `0140` moved `The corpus-wide sweep` from `Faults` to `Enforcement boundary` (`B135`, `0141`) |
| `charter-stress` | new three-probe suite (`CS1`, `CS2`, `CS3`) | tests the recursive set hierarchy and Level 0 root-set stress protocol (`CS1`, `0139`), `E4`/`M12` charter `Operation` territory-stress rules and `C0`/`ST1`/`S0` stress passes (`CS2`, `0139`, `0140`), and `PC0`/`M0` moments-of-work stress, placement filtering, and single-occupant retirement (`CS3`, `0140`) |
| `charter-stress` (CS4, CS5), `sc0` (Q7) | `CS4` added for `E10` (`arc` representations), `T3` solo-agent complement via `A16`/`W0`/`R0`, and `A15` human-gate filter against `E1`/`A13`; `CS5` added for `0142`'s foundational charter `## Operation` stress passes (`E0`, `T0`, `A0`, `SC0`); `sc0.Q7` drops `(EntryBody today)` from the missing-resource population fault | `0142` upgrades `E0`, `T0`, `A0`, `R0`, `D0`, `W0`, `AR0`, `SC0`, and `K0` `## Operation`, `0143` admits `E10` and reconciles `T3` (`B68`) and `A15` (`B115`), and `0144` registers `EntryBody` in `schemas/catalog.json` `resources` (`B64`) |
| `charter-stress` (CS3, CS6), `s0` (Q4) | `CS6` added for `S0`'s four Level 2 medium sub-sets via `SC1` `medium`, `S17` and `tools/s17-source-comments.sh`'s four source-comment checks, and `PC2` (*Check the splits that favour you*); `CS3` rubric notes single-occupant retirement applies while the layer holds a single member (whether or not `PC2` has since been admitted); `s0.Q4` adds `(and S17 once admitted)` under `Held by a tool` | `0145` admits `S17` (`B67` gap 3), `0146` partitions `style/` into medium sub-sets via `SC1` `medium` (`B39`), and `0147` admits `PC2` to `practices/` (`B136`), audited by a fresh `B29` agent before any reader ran |

---

## Retired probes

A probe is retired when the corpus has deliberately stopped claiming what it tests; its text stays here and in history.

| Suite | Probe | Question | Why retired |
|---|---|---|---|
| `charter-claims` | `V3` | At which moments of a unit of work does no rule apply today? Name one piece of guidance in the corpus that leaves a trace in the record but has no rule entry. | it asks for a specific gap or partition, which charters no longer hold: under the charter-as-asymptote rulings gaps live in investigations and the backlog, and a cold reader of the product can find an absence but not that it is known. Director ruling, after `noinv-regression` |
| `charter-claims` | `V4` | At which moments of a unit of work does no practice apply today? | it asks for a specific gap or partition, which charters no longer hold: under the charter-as-asymptote rulings gaps live in investigations and the backlog, and a cold reader of the product can find an absence but not that it is known. Director ruling, after `noinv-regression` |
| `charter-claims` | `V10` | Which axiom protects a system against a hostile actor or untrusted input? | it asks for a specific gap or partition, which charters no longer hold: under the charter-as-asymptote rulings gaps live in investigations and the backlog, and a cold reader of the product can find an absence but not that it is known. Director ruling, after `noinv-regression` |
| `s0` | `Q5` | A team wants a style rule for comments in source code. Is there one, and where would it go? | it asks for a specific gap or partition, which charters no longer hold: under the charter-as-asymptote rulings gaps live in investigations and the backlog, and a cold reader of the product can find an absence but not that it is known. Director ruling, after `noinv-regression` |
| `p0` | `Q5` | Is there a pattern in this corpus for making an operation safe to retry after a partial failure? | it asks for a specific gap or partition, which charters no longer hold: under the charter-as-asymptote rulings gaps live in investigations and the backlog, and a cold reader of the product can find an absence but not that it is known. Director ruling, after `noinv-regression` |
| `k0` | `Q4` | An agent working alone, with no coordination substrate, needs to have a change independently verified and then shipped. Which skills help? | it asks for a specific gap or partition, which charters no longer hold: under the charter-as-asymptote rulings gaps live in investigations and the backlog, and a cold reader of the product can find an absence but not that it is known. Director ruling, after `noinv-regression` |
| `ar0` | `Q4` | What does the artifacts layer's territory claim that no artifact type fills today? | it asks for a specific gap or partition, which charters no longer hold: under the charter-as-asymptote rulings gaps live in investigations and the backlog, and a cold reader of the product can find an absence but not that it is known. Director ruling, after `noinv-regression` |
| `c0` | `Q4` | How complete is the components registry against what it claims to cover, and can a gap be found from the corpus? | it asks for a specific gap or partition, which charters no longer hold: under the charter-as-asymptote rulings gaps live in investigations and the backlog, and a cold reader of the product can find an absence but not that it is known. Director ruling, after `noinv-regression` |
| `e0` | `Q4` | Does any entity entry define 'gate', 'evidence' or 'arc'? Where, if anywhere, is each defined? | it asks for a specific gap or partition, which charters no longer hold: under the charter-as-asymptote rulings gaps live in investigations and the backlog, and a cold reader of the product can find an absence but not that it is known. Director ruling, after `noinv-regression` |
| `e0` | `Q5` | The entity entries define several terms. Group them by what kind of thing they define, and name a load-bearing term the corpus relies on that has no entity yet. | it asks for a specific gap or partition, which charters no longer hold: under the charter-as-asymptote rulings gaps live in investigations and the backlog, and a cold reader of the product can find an absence but not that it is known. Director ruling, after `noinv-regression` |
| `sc0` | `Q4` | Contracts in this set are not all of one kind. Name the kinds, say what separates them, and place each existing contract. | it asks for a specific gap or partition, which charters no longer hold: under the charter-as-asymptote rulings gaps live in investigations and the backlog, and a cold reader of the product can find an absence but not that it is known. Director ruling, after `noinv-regression` |
| `layer-charters` | `H7` | Which kind of work does the corpus record as having nothing at all governing it - no procedure, rule or practice? | same class as the eleven above - it asks for a gap or a partition that moved out of the charters into investigations; all three readers hedged in `frame-regression`. Retired on the director's ruling for that class |
| `k0` | `Q5` | Is there a skill for running a blind before-and-after evaluation of a document with cold readers? | same class as the eleven above - it asks for a gap or a partition that moved out of the charters into investigations; all three readers hedged in `frame-regression`. Retired on the director's ruling for that class |
| `k0` | `Q6` | Group the skills into families and say how members of a family relate. | same class as the eleven above - it asks for a gap or a partition that moved out of the charters into investigations; all three readers hedged in `frame-regression`. Retired on the director's ruling for that class |
| `work-layers` | `L5` | Suppose an agent must stop mid-task and someone else - or the same agent tomorrow, with no memory - must continue. If guidance for that transition were written, where would it go? Does the corpus say anything about its absence? | same class - it asks for a recorded gap (handing over) that moved out of the methods charter into an investigation; all three readers hedged in `setop-regression`. Retired on the director's ruling for that class |
