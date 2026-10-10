# Evaluation suites

The standing probes that measure whether cold agents read this corpus as intended.\
Run with [`tools/eval.mjs`](../../tools/eval.mjs); method in [`M2`](../../methodology/M2-test-drive-docs-by-execution.md), *Reasoning documents*.

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

Suites are under `docs/` because they are about this corpus, and because `eval.mjs export` strips `docs/`, so no reader can reach a key.

---

## The context-lab pack

`docs/evals/context-lab/` is mission-kit's pack for [context-lab](https://github.com/apnex/context-lab), the shared evaluation component (`0087`, `0088`).\
It carries the adherence suite and the `explain` suite, transcribed as they stand; until mission-kit's own tools retire, each suite file and its pack scenarios are twins (`B80`).\
Its experiment register lives in its `register/` folder and is committed: it is the evidence an experiment was fixed before its outcomes.

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
