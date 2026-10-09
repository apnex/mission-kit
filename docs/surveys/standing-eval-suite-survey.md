---
survey-title: Standing evaluation suite for mission-kit
work-item: standing-eval-suite
methodology-source: survey skill (K5), installed copy pinned at 2c971fa
lifecycle-handoff:
  from: intent-open
  to: intent-captured
  authority-ref: director, this session, 2026-10-10
  planning-input-ref: self
stakeholder-picks:
  round-1:
    Q1: abcd
    Q1-rationale: none given
    Q2: acd
    Q2-rationale: procedure (c) is important, but perhaps a separate suite
    Q3: ab
    Q3-rationale: none given
  round-2:
    Q4: a
    Q4-rationale: none given
    Q5: abcd
    Q5-rationale: none given
    Q6: ab
    Q6-rationale: can use Lun/Sol if needed
outcome-axis:
  primary: [decision-quality, corpus-quality, generality]
  secondary: [regression-safety, economy]
  round-1:
    primary: [decision-quality, corpus-quality]
    secondary: [regression-safety, generality]
  round-2:
    primary: [corpus-quality, generality]
    secondary: [decision-quality, economy]
axiom-principle-anchors:
  primary: [A14]
  secondary: [A8, A2]
  round-1: [A14, A8]
  round-2: [A14, A11, A12]
anti-goals-count: 4
flags-count: 5
calibration-data:
  stakeholder-time-cost-minutes: 5
  comparison-baseline: b24-work-layers-survey and b38-director-communication-requirements
  notes: Time is estimated by the proposer, not measured. The director answered both rounds in one line each, adding a rationale on Q2 and Q6. Two answers left a hypothesis of the proposer's unconfirmed (communication's place), which a sharper Q4 option could have settled directly.
---

# Standing evaluation suite for mission-kit -- Survey envelope

**Methodology:** survey skill (2-round, 3-orthogonal-questions-per-round pick-list)\
**Work item:** standing-eval-suite\
**Lifecycle handoff:** `intent-open -> intent-captured` only; this envelope grants no design, seed, implementation, or delivery effect.

---

## S0 Context

The first confirmatory adherence run (`docs/audits/adherence-2026-10-09.md`) showed guidance changes what agents do, and that always-on adds little over on-trigger at short distance.\
The director then asked for a longer, deeper design that measures comprehension and efficacy of the guidance while measuring adherence, as forward capital investment (`A14`), and confirmed the work is a standing, re-runnable evaluation suite: a matrix of engineering scenarios and metrics, covering layers beyond axioms and explain, such as components.

Outcome axes for this survey, supplied by the proposer:

- **decision-quality** - the suite's results settle choices about the corpus, such as what is always-on.
- **corpus-quality** - results point at specific entries to improve.
- **regression-safety** - a change that makes agents worse is caught.
- **generality** - results hold across models and harnesses, not one.
- **economy** - a run costs proportionate machine time and director attention.

---

## S1 Round 1 picks

| Q | Question | Picks |
|---|---|---|
| Q1 | What should the suite's results decide? | a always-on vs on-trigger; b gate on corpus changes; c weak entries as rewrite targets; d whether mission-kit helps at all |
| Q2 | Which engineering surface should scenarios cover? | a reasoning (axioms, standing doctrine); c procedure (work-types, methods, artifacts) - important, perhaps a separate suite; d reuse (components, patterns). Not b, communication |
| Q3 | When should it run? | a per change, scenarios the change touches; b full matrix on a cadence |

### S1.Q1 -- Per-question interpretation

All four purposes were picked, so the suite is one instrument serving four decisions, not a single-purpose experiment.\
They pull in different directions: a change gate (b) needs runs that are cheap and fast enough to precede every change; whether mission-kit helps at all (d) needs a no-corpus control arm in every full run; rewrite targets (c) need per-entry resolution and the reasons behind failures, not only pass rates; and the always-on decision (a) needs the context-delivery arms.\
The reading most consistent with the other picks is a shared scenario library, with each purpose served by a different selection and arm set from it.

### S1.Q2 -- Per-question interpretation

Reasoning and reuse are in; procedure is wanted but possibly as its own suite, which suggests its scenarios have a different shape - longer, multi-step, gated work - rather than a lower priority.\
Communication was not picked.\
The proposer's hypothesis, unconfirmed: the explain guidance already has a human-judged evaluation (`docs/evals/human/`), and the director prefers it judged there rather than by agents; round 2 tests this rather than assuming it.

### S1.Q3 -- Per-question interpretation

Two cadences: targeted runs on each guidance change, and a full matrix periodically.\
New model or harness versions and always-on changes were not picked as triggers, so those decisions are taken from the periodic matrix rather than from dedicated runs.\
Per-change targeting requires each scenario to declare which entries it exercises, so a change can select its scenarios - a relationship declared once, on the scenario, with the reverse view generated (Rule 1).

**Round-1 composite read.**\
A standing scenario library, tagged by the entries each scenario exercises, from which a per-change subset and a periodic full matrix are drawn, serving four decisions at once.\
Tensions carried to round 2: how procedure and communication sit relative to the main suite, which measurements every run must produce, and which agents and how much machine time.

**Round-1 axiom / principle anchoring.**\
`A14`: the suite is learning capital - every scenario banked and re-run, its yield compounding across corpus revisions.\
`A8`: the per-change run is a gate on the corpus's own changes, so it must prove the property, not the act.\
`A2`: per-change selection needs the declared scenario-to-entry map to stay in step with the scenarios.

---

## S2 Round 2 picks

| Q | Question | Picks |
|---|---|---|
| Q4 | How should the suites be organised? | a - one scenario library and one runner, suites as tagged selections |
| Q5 | Which measurements must every full run produce? | a adherence, including after compaction; b comprehension, linked to adherence; c precision, including jargon leakage; d cost per arm |
| Q6 | Which agents, and how much machine time? | a today's three families on two harnesses; b a cheaper, weaker model per family - "can use Lun/Sol if needed" |

### S2.Q4 -- Per-question interpretation

Disambiguates Round 1's note that procedure might be a separate suite.One library and one runner was picked and a separate procedure suite was not, so procedure scenarios live in the same library, selected by tag, even if their shape is longer and multi-step; the runner must therefore support multi-phase scenarios rather than one task per cell.A shared per-entry ledger over time and keeping explain in its human-judged evaluation were not picked.The proposer does not read the first as rejecting results that persist across runs - each run already writes a result - but as not asking for a cross-suite scorecard now; the second leaves communication's place unresolved, carried as a flag.

### S2.Q5 -- Per-question interpretation

Deepens Round 1's four purposes.All four measurements in every full run: each serves a purpose from Q1 - adherence the change gate and always-on decision, comprehension and its link to adherence the rewrite targets, precision the cost of always-on in wrong firings, cost the price of each delivery arm.This rules out a design that measures one thing well and defers the rest, and it makes the multi-phase episode - task with traps, handoff, more traps, exit interview - the natural unit, since one episode yields all four.

### S2.Q6 -- Per-question interpretation

Refines generality.Today's three families on two harnesses, plus a cheaper model per family; no extra harnesses, and no cap on machine time, so coverage is not traded down to fit a budget."Lun/Sol" is read by the proposer, from the Codex model list, as `gpt-6-luna` ("fast and affordable") and `gpt-6-sol` ("previous generation workhorse"); this is an inference to be confirmed.The cheaper tier for the other families is not yet named: Gemini already runs on `gemini-3.8-flash`, and the only other Claude model configured is `claude-opus-5`.

**Round-2 composite read.**One runner over one tagged library, producing adherence, comprehension, precision and cost in every full run, across three families at two capability tiers, without a machine-time cap.

**Round-2 axiom / principle anchoring.**`A14`: one library and every measurement per run maximise what each run banks.`A11`: the runner, selection, blinding and tally stay deterministic code; agents do only the tasks and the judging.`A12`: the cost measurement prices each way of assembling context, which is the question the always-on decision turns on.

---

## S3 Composite intent envelope

Build a standing evaluation suite for mission-kit: one library of engineering scenarios and one runner, from which suites are drawn as tagged selections - by layer, by entry exercised, by purpose.

- **Purposes, all four:** decide what is always-on; gate corpus changes; find weak entries to rewrite; show whether mission-kit helps at all against no mission-kit.
- **Surface:** reasoning (axioms, standing doctrine), procedure (work-types, methods, artifacts) and reuse (components, patterns), in the same library.
- **Unit:** a multi-phase episode on an evolving project, so one run yields every measurement.
- **Measurements, every full run:** adherence (including after a simulated compaction), comprehension and its link to adherence, precision (wrong firings, jargon leakage), and cost per arm.
- **Cadence:** a targeted subset on each guidance change, selected by the entries each scenario declares; a full matrix periodically.
- **Population:** three families on two harnesses, each at two capability tiers; no machine-time cap.

**Final axiom / principle anchoring.**`A14` governs the whole: scenarios and results are banked capital re-run against every corpus revision.`A8` shapes the per-change run as a gate that must measure the property, so the design must keep the blinding and invalidity rules of the current runner.`A2` requires the scenario-to-entry declarations to stay in step with the scenarios, held by a check.`A11` keeps everything but task and judgement in code.

---

## S4 Scope summary

- **Title:** standing evaluation suite for mission-kit.
- **Primary outcomes:** decision-quality, corpus-quality, generality.
- **Secondary outcomes:** regression-safety, economy.
- **Alignment:** round 1 weighted decision- and corpus-quality; round 2 added generality and priced economy without capping it.

---

## S5 Anti-goals

- **Extra harnesses** (Claude Code, Gemini command-line tool) - not picked; composes later as a new runner adapter over the same library.
- **A machine-time cap per full run** - not picked; economy is measured, not enforced.
- **Dedicated runs on new model versions or before always-on changes** - not picked as triggers; those decisions read the periodic matrix.
- **Procedure as a separately built suite** - not picked; procedure scenarios share the library and runner.

---

## S6 Flags / open questions for the design phase

1. **Communication's place.** Resolved after the survey by director ruling `0085`: explain is a surface of the suite, judged by agents across families in every run, with the director's human-judged evaluation periodically calibrating the agent judges.
2. **"Lun/Sol"** is inferred as `gpt-6-luna` and `gpt-6-sol`; the director continued without correcting the reading when it was stated, which is not confirmation. A cheaper tier for Claude and Gemini is not named.
3. **A cross-run, per-entry scorecard** was not picked; the design should say whether per-run results suffice for the rewrite-target purpose.
4. **The comparison against no mission-kit** needs a control arm in every full run, which the four-arm design already has; the per-change subset may omit it.
5. **Known defects carried in:** `B75` (`A4` trap date), `B76` (on-trigger fetch storms), `B74` (`S15` pick count).

---

## S7 Sequencing / cross-work considerations

### S7.1 Branch + review strategy

Design of record first, audited by an agent that did not write it, then built on `main` in concern-sized commits, as all mission-kit work is.

### S7.2 Composability

The current runner (`tools/adherence.mjs`) and suite are the seed: their isolation, blinding, invalidity and cross-family scoring carry over; the episode, the tags and the selection are new.M4's remaining items are independent and can interleave.

---

## Scalibration

- **Stakeholder time:** about 5 minutes, estimated.
- **Baseline:** the two earlier surveys in `docs/surveys/`.
- **Notes:** answers came one line per round with two short rationales; one hypothesis of the proposer's was left unconfirmed, which a more direct option could have settled.

---

## S8 Cross-references

- `docs/audits/adherence-2026-10-09.md` - the run that prompted this.
- `docs/evals/adherence/suite.json`, `tools/adherence.mjs` - the seed suite and runner.
- Decisions `0083`, `0084`; backlog `B73`-`B76`.
- The design artifact this feeds: not yet written.
