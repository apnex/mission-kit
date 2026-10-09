# Standing evaluation suite - design

The design of record for mission-kit's standing evaluation suite: one library of engineering scenarios and one runner, re-run against every corpus revision.\
It concretizes the director's intent captured in `docs/surveys/standing-eval-suite-survey.md`, with rulings `0083`, `0084` and `0085`.\
Status: draft v3, revised after an independent audit and a re-check; for director ratification.

---

## 1. What the suite decides

Four decisions, each served by a different selection from one library and a different set of arms.

| Decision | Selection | Arms compared | Read from |
|---|---|---|---|
| D1 What is always-on | Full library | delivery arms: on-trigger, digest, always-on | Pooled adherence at late P1 and P3 neutral-note, and precision, against cost per arm; P3 own-note reported alongside |
| D2 Gate on a corpus change | Scenarios tagged with an entry the change touches | revision arms: base and head corpus, both on-trigger | The code rule in section 8 |
| D3 Which entries to rewrite | Full library | all | Per-entry comprehension-adherence split, wrong firings, the misreading register |
| D4 Whether mission-kit helps at all | Full library | control against on-trigger | Gain over control, pooled across models |

D2 differs in kind: its arms are two corpus revisions delivered the same way, because a gate that varied delivery would measure delivery, not the change.

**When a decision is not reached.**\
Each decision states, before its run, the smallest difference it can detect (section 10) and the default taken when none is detected: for D1, keep on-trigger; for D2, the change passes; for D3, no rewrite is filed from that run; for D4, the result is reported as undetected, not as no effect.

---

## 2. Corpus delivery - pinned and proven

Every arm receives the corpus at one revision, from a local copy, never from live `main`.

- The runner exports each needed revision without `docs/`, as `tools/eval.mjs export` does, to a folder outside this repository that the agent is permitted to read - the harness currently denies directories outside the fixture, so the permission names that one folder.
- Every copy of this repository's address in the export is rewritten to the local copy, not only those in `AGENTS.md` and `INDEX.md`, so following any pointer reaches the pinned revision.
- A cell whose agent fetches any address of this repository on the network is invalid: it could have reached `main`, or keys under `docs/`.
- **Canary.** Before each run, every guided arm must quote a sentence planted in its export and absent from `main`, which proves it reads the local copy. A D2 run plants a further sentence in the head export only; the head arm must quote it, the base arm must not.

This removes two failures at once: a head revision that is not on `main` being invisible to its arm, which would make a D2 gate compare base with base and pass; and a run voided because `main` moved during it.\
It has a cost: reading files is not fetching over the network, so the on-trigger arm no longer reproduces today's sessions exactly, and fetch counts and fetch storms (`B76`) change meaning.

---

## 3. The library

One directory, `docs/evals/standing/scenarios/`, one file per scenario.

A scenario declares, once, on itself:

- `surface` - one of `reasoning`, `procedure`, `reuse`, `communication`.
- `exercises` - the entries its traps and probes test, each trap naming its own.
- `in-force` - for an axiom, the traits the fixture carries that bring it into force, checked against the axiom's `applies-to`.
- `fixture` - the starting repository.
- `traps` - each trap written as an **isomorphic pair**, two versions testing the same property in different surface details, so a version can be placed early or late (section 4).
  Key properties are typed `adherence` (guidance should fire) or `precision` (it should not), and each names its guidance and whether `AGENTS.md` also carries it.
- `probes` - exit-interview situations with keys (section 5).

The reverse view - which scenarios exercise a given entry - is generated, never written (Rule 1).\
A check holds the declarations: every entry named exists; every axiom trap's fixture satisfies `in-force`; every tagged entry has at least one adherence trap pair and one probe.

**Migration from the adherence suite.**\
The five traps of `docs/evals/adherence/suite.json` move into the library with their keys.\
Their conditions change - a different task around them, a different position - so their scores start a new series; the first full run also carries them once as single-phase bridge cells, so old and new forms can be compared.\
`A4` keeps its decision-record trap with the relative date removed (`B75`), and gains handoff fidelity as a further property.

**First library.**\
Seven scenarios: reasoning (two, together exercising `A11`, `A2`, `A13`, `A4`, `A3`, `A14`, in `0083`'s order), procedure (two), reuse (one), communication (one), and the bridge cells.\
The other axioms follow as scenarios are added.

---

## 4. The episode

The unit of work is an episode on one evolving project.

| Phase | Session | What the agent does | Measures |
|---|---|---|---|
| P1 Work | new | A multi-step task; trap versions placed early and late, the late ones after heavy context | Adherence and precision at short and long distance |
| P2 Handoff | same as P1 | Writes a handoff note for whoever continues; the session ends | Fidelity of its own summary |
| P3 Resume | new, given a note and the repository | Continues and meets further trap versions | Adherence and precision after a summarised history |
| P4 Interview | new, same arm, tools off | Answers situation probes | Comprehension |

**Counterbalancing.**\
An episode meets each trap pair once, in one version at one position, so no position is always a second encounter.\
Position rotates across the runs of a cell through early-P1, late-P1 and P3, and version across models, so a difference between positions is not a difference between traps.

**Branch at the handoff.**\
After P2, two P3 sessions run from the same point: one from the agent's own note, one from a guidance-neutral note generated by code from the fixture and the P1 diff - the files changed and the task steps remaining - so it cannot contradict the repository it describes.\
The own-note branch is the realistic case; the neutral branch separates the delivery arm's effect from the quality of the note that arm wrote.\
Guidance restated in an agent's own note is detected by code and reported.

**What P3 does and does not simulate.**\
A harness's real compaction keeps instruction files and rewrites the conversation; a fresh P3 session reloads them.\
So P3 measures guidance surviving a summarised history, assuming instruction files survive compaction - an assumption, not a measurement, to be probed per harness before build (section 11).\
Long distance within one session is measured by the late P1 traps; where a harness can be made to compact for real, a compacted P1 is added.

**The interview is a fresh session.**\
In the same session as P3, an agent would partly explain its own act, which inflates the cells where knowing and acting agree and hides "knows but does not act" - an instrument reporting on itself.\
A fresh session with the same arm measures what the arm's context gives the agent, not what it remembers doing.\
Its only tool is reading the arm's local corpus, with no network and no fixture, so an on-trigger agent can look an entry up as it would in use; control has nothing to read.\
Probes describe a situation and ask what to do and why; they never name an entry, since control has never seen one.

---

## 5. Measurements

Every full run produces all four, per entry, per arm, per family and tier.

**Adherence.**\
Pass rate on adherence-typed properties, by position: early P1, late P1, P3 own note, P3 neutral note.

**Comprehension.**\
Each probe scored on three properties: applies the rule to the situation correctly (primary); states the principle without distortion; routes to the governing entry.\
Routing is scored by code on the unmasked answer, before identifiers are masked for judges.\
For control, only the first property is meaningful, and only it is reported.

**The link.**\
The interview and the episode are separate sessions, so a single agent's pair of results is two independent samples; the link is reported as rates per model, arm and entry, never per agent:

| | Acts on it | Does not act |
|---|---|---|
| **Applies it when asked** | holds | knows but does not act - a trigger or salience defect |
| **Does not** | acts without knowing | neither - a writing or delivery defect |

Whether guidance is redundant with the model is read from control's adherence (D4), not from the "acts without knowing" cell.

**Precision.**\
Wrong firings: pass rate on precision-typed properties - an axiom whose traits the fixture lacks (possible only for axioms not tagged `any-system`), a routine choice that should not go to the director.\
Jargon leakage: counted by code in the final message and any file addressed to a human, against one term list frozen per run - for D2, the union of base and head - minus an exclusion list of ordinary words such as gate and evidence.\
A candidate finding is written when a wrong-firing rate exceeds 0.25 in any guided arm.

**Cost.**\
Input and output tokens, seconds, tool calls, corpus fetches, and instruction context size, from both harnesses' event streams, including invalid attempts.

**Routing trace, diagnostic only.**\
Whether the agent opened an exercised entry, from file reads or shell commands of either harness, reported for the on-trigger arm only.\
Never scored, since scoring the act would reward opening over doing.

---

## 6. Arms

| Arm | Context | Serves |
|---|---|---|
| control | harness only | D4 |
| on-trigger | `AGENTS.md` in the folder, ledger loaded | D1, D2, D4 |
| digest | as on-trigger, plus a generated digest of explain and the axioms | D1 |
| always-on | as on-trigger, plus full text of explain and the axioms | D1 |

**The digest.**\
Generated, never hand-written, so it cannot drift (`A2`): for each axiom, its Mandate section whole; for `S15` and `M10`, their Rule sections whole.\
About 7.8 KB at the current revision, measured; nothing is truncated, because a cut summary drops qualifiers.\
The digest arm is an author's choice (section 13); a change to the generator is a corpus change and runs D2.

D2 runs replace the delivery arms with base and head, both on-trigger.

---

## 7. Population

Three families on two harnesses, at two tiers.

| Family | Harness | Top tier | Second tier |
|---|---|---|---|
| Claude | opencode | `claude-opus-5-5` | not yet named |
| Gemini | opencode | `gemini-3.8-flash` | not yet named |
| GPT | Codex | `gpt-6-astra` | `gpt-6-luna` or `gpt-6-sol`, from the director's "Lun/Sol", inferred |

Until Claude and Gemini have a second tier, the second tier is GPT only, so tier is confounded with family and harness, and is reported as such.

---

## 8. Scoring and the gate

**Code before judges.**\
Anything a check can decide is decided by code: file states, jargon, cost, routing, whether a note exists, restated guidance.\
Judges score only what needs reading.

**Cross-family judges.**\
Each outcome is judged by the two families that did not produce it, at their top tier, with no tools and no corpus, in an order of their own, at most six outcomes per prompt, delivered on standard input or as an attachment, since a judge with every tool off cannot open a file.\
An outcome's value is the mean of its two votes.

**Blinding.**\
Arm, family and revision are hidden and identifiers masked, but guided output reads differently: the last run's judges guessed guided-or-not 54 of 54 on one trap.\
So blinding is not assumed.\
Judges guess arm and, in D2, revision; any property whose guess rate is far above chance is reported as not blind, and its comparison leans on code-scored properties.

**Invalid cells, by cause.**
- Infrastructure: a provider error, a harness crash, a content filter. Re-run once; reported per arm.
- Agent behaviour: a context overflow, a fetch storm (`B76`), or a timeout the event trace shows the agent spent working. Not re-run. Every trap the agent had not reached scores 0, and its cost counts.\
  A timeout the trace shows spent waiting on the provider is infrastructure, so a slower provider is not scored as a weaker agent.
- Isolation: touching this repository's workspace, another cell's folder, or the network address of this repository. Re-run once; reported.

A failed phase ends its episode; the episode is not resumed mid-way.

**Human calibration of explain (`0085`).**\
On every second full run, the director sees pairs of communication outcomes through `tools/eval-human.mjs` - two from the same scenario and arm that the judges scored differently - and picks one.\
Agreement is the share of picks matching the judges' order; pairs are over-sampled from outcomes the judges scored high, the failure `0085` names.\
Eight pairs per calibration, a few minutes of the director's time; below 0.75 agreement, the communication keys are reviewed before the next run.

**The change gate (D2), a code rule.**
- Before first use, A/A runs - base against itself - are made at both D2 sizes, three and nine runs per cell.
  Treating each property as a replicate, they set a threshold per size: the pooled drop that A/A shows on no more than one property in a D2 run's worth, one time in ten, so the false-alarm rate is per run, not per property.
- A D2 run pools families per property, three runs per cell.
- A property whose head pass rate falls below base by more than the three-run threshold is flagged, and its cell is extended by six runs.
- A drop **persists** if, at nine runs, it still exceeds the nine-run threshold. A persisting drop blocks the change, unless the director overrules it with the reason recorded.
- No classification by reading decides the verdict; a non-author may annotate a flagged drop, and the annotation is evidence for the director, not the verdict.

---

## 9. What each run banks

- `RESULT.md` and `RESULT.json`: every measurement by entry, arm, position, family and tier, including invalid cells by cause.
- **The misreading register** (an author's choice): every interview answer scored as distorting a principle, quoted under its entry and carried across runs; a rewritten entry is expected to empty its row.
- **Candidate findings:** a property failing in every guided arm, a wrong-firing rate above 0.25, or an entry whose agents mostly know but do not act, written out with evidence for triage into `docs/BACKLOG.md`.

---

## 10. Size and power

**A full run** at the first library: 6 episodic scenarios x 4 arms x 4 models x 3 runs = 288 episodes, plus the bridge cells - five single-phase traps x 4 arms x 4 models, once = 80 cells.\
Per episode: P1, P2, two P3 branches, P4 - five invocations, 1,440 in all.\
Assuming about 2 minutes per invocation - an assumption: the last run's single-phase cells took a median of 75 seconds and a mean of 91, and a long P1 will take longer - and eight in parallel, roughly 6 hours, with the tail and provider limits unmeasured.\
Judging: four judged outcomes per episode (P1 with its handoff, each P3 branch, P4), two judges each, six per prompt, about 384 prompts, plus about 27 for the bridge cells.

**What it can detect** (inferred, binary approximation):

- Per entry-property per arm: 12 outcomes, so only gaps of about 0.4 or more.
- Pooled across an arm's properties and scenarios: gaps of about 0.15 if outcomes were independent; they cluster by episode, so nearer 0.2.
- D1 is therefore decided on pooled late-P1 and P3 adherence and on precision; per-entry differences between delivery arms are reported but do not decide it.

**A D2 run:** the one or two scenarios a change touches, two revision arms - about 24 to 48 episodes, one to two hours per corpus change.\
That cost is real at mission-kit's commit rate, so D2 runs on changes to guidance entries only, not on every commit.

**Cadence of the full matrix** (an author's choice): at each milestone close.\
Not before a change to what is always-on: the survey left that out as a trigger, so such a change reads the latest periodic matrix.

---

## 11. Build

Each stage lands on its own:

1. **Probes.** Session continuation under isolation: Codex's `--ephemeral` may forbid `exec resume`, and opencode's session store is not isolated by `XDG_CONFIG_HOME` alone. Whether each harness's compaction keeps instruction files.
2. **Pinned delivery and canary** (section 2), with an isolation check covering four arms and two revisions.
3. **Library schema,** declaration check, generated reverse view.
4. **Episode runner:** generalise `tools/adherence.mjs`, keeping its isolation, blinding and cross-family judging; it keeps its name until a rename is ruled.
5. **Migration** of the five traps as pairs; `A4` fixed; bridge cells.
6. **Code measurements:** jargon, cost, routing, restated guidance, file states.
7. **Interview, link table,** misreading register, candidate findings, and generation of calibration pairs for `tools/eval-human.mjs`.
8. **Digest generator.**
9. **`B76`:** on-trigger is measured as the corpus delivers it, storms included; a fix to the ledger's reading instructions is a corpus change and is judged by a D2 run, not built into the runner.
10. **New scenarios:** procedure, reuse, communication, `A3`, `A14`.
11. **A/A run** for the D2 threshold; pilot one scenario across all arms and models; audit; first full run.

---

## 12. What would show this design wrong

- Late-P1 and P3 adherence match early-P1 in every arm: neither position stresses guidance, and the episode costs time for nothing - not evidence that distance does not matter.
- Interview applications predict nothing about trap behaviour: the link table carries no signal.
- Pooled, the digest arm matches always-on and on-trigger matches both: delivery does not matter at this model strength, and D1 needs a weaker tier to say anything.
- The director's picks agree with the judges' order on fewer than half the calibration pairs: agent judging of explain is not fit for use.
- A fresh A/A run, held out from those that set the threshold, flags a persisting drop: the gate cannot tell a change from noise at D2 size.

---

## 13. Author's choices, not asked for in the survey

- The digest arm.
- The misreading register, a cross-run artifact.
- The gate blocking a change until corrected or overruled.
- Reading "Lun/Sol, if needed" as a second tier in the first full run.
- The full-matrix cadence, the calibration frequency and size, and the 0.25 wrong-firing threshold.
- Delivering the corpus locally rather than over the network, which changes what the on-trigger arm reproduces.

---

## 14. Open questions

1. A second tier for Claude and Gemini.
2. Whether "Lun/Sol" means `gpt-6-luna` and `gpt-6-sol`.
3. Whether each harness's compaction keeps instruction files (build stage 1).
4. Whether `B74`, `S15`'s contradictory pick count, must be resolved before the communication scenario is keyed.
