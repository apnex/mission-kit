---
id: C2
category: component
title: context-lab - experiments on the context given to language-model agents
status: active
hydrate-when: You are about to judge whether instructions, documents or skills you give agents change what they do, or to build a harness that runs agents to find out
sovereignty: internal
supersedes: []
related: [C0, A3, A14, M2]
---

# C2 - context-lab

Sovereignty is `internal`, so a fit gap here is pressure that routes upstream rather than a constraint a consumer works around.

---

## Duty

Run experiments on the context language-model agents are given, and report what each experiment showed.

That is the whole duty.\
It does not also own a project's experiments, keys or conclusions, edit a project's working context, rank models, or decide for a project - each of those is either the project's or a second concern.

At the altitude below this one it is twenty-two units, each with one duty, listed in its architecture's anchored core.\
That is the anchored core of one box, per [`C0`](README.md#duty-is-singular-at-an-altitude), not twenty-two duties.

---

## Contract

What a consumer depends on, and what it may not reach past.

| surface | contract |
|---|---|
| project pack | everything project-specific - experiments, suites, context sources and variants, arms, population, masks, isolation probes, and comparisons (`schema: "context-lab.pack/1"`) - enters through one directory the core validates (`context-lab check <pack>`) before anything runs; nothing project-specific is read from anywhere else |
| hooks | project scripts (`declaration-check`, `variant-transform`, `outcome-measure`, `note-generator`) run at four fixed points, each with a stated JSON stdin/stdout contract, in a `bwrap` sandbox with no network and bounded reads and writes |
| delivery | each arm's context is a local copy at a pinned revision (`instruction`, `folder-file`, or `on-request`), every published address rewritten to it, and a canary proving it was read |
| isolation | every arm and every judge on every runtime is probed (`leakProbes`) before any cell runs; an arm without a pass never runs, and any cell touching a forbidden path or address is invalidated |
| runtimes | each agent runtime (`opencode`, `codex`, `external`) sits behind one adapter returning one common `Outcome` form (`cost`, `stop`, `tools`, `trace`, scrubbed `events.jsonl`) and recording sanitized `routes` in `run.json`; driven runtimes run in a `bwrap` filesystem sandbox |
| episodes | single- or multi-phase episodes (`session: "new" \| "continue"`, branching via `after`, handoff notes via `note` and `withhold` with fresh git history, and rotating `trapPairs`); a behaviour failure ends only the phases that follow from it while sibling branches still run |
| judging | code decides what a check can (`decidedBy: "code"`); every judged outcome (`decidedBy: "judge"`) is blinded and scored by the model families other than its agent's, never its own; optional classify-then-verify `judging.chain` requires an exact quote in the outcome before cross-family verification, and `context-lab candidates <pack> <run-dir>` extracts recurring findings into `CANDIDATES.json` and `CANDIDATES.md` |
| human panel | `context-lab pick <pack> <run-dir> [--mode calibration\|preference] [--count N] [--with ARM] [--without ARM]` runs an interactive terminal panel on blinded outcome pairs, writes `picks.json`, and re-tallies `RESULT.json` and `RESULT.md` |
| comparison | `context-lab thresholds <pack> <comparison> <aa-run-dir>` derives two-stage size-3 and size-9 noise thresholds from an identical-arm A/A run into `register/thresholds/<comparison>.jsonl`, and `context-lab compare <pack> <comparison> <base-run-dir> [--head DIR] [--runs K] [--nine DIR] [--nine-head DIR] [--out FILE]` compares base and head arms |
| record and resume | `context-lab record <pack> <experiment>` fixes the experiment's content hash in `register/<experiment>.json` (requiring `variation` and `default` when `declaredStatus` is `"result"`), `context-lab status <pack> <experiment>` reports whether a run will carry `result` or `exploration`, `context-lab suite <pack> <suite>` and `context-lab entries <pack>` inspect scenario selection and `exercises:` coverage, `context-lab expose <pack> <scenario> <change>` records held-out exposure, `context-lab run <pack> <suite> [--runs N] [--max-attempts 1\|2] [--parallel P] [--work DIR] [--revision REV]` executes a suite, and `context-lab resume <pack> <run-dir> [--parallel P] [--work DIR]` resumes an interrupted run from state `probed` after verifying the register hash, routes, variant manifests, and recorded cell files |
| review panel | `context-lab review <pack> --prompt <file> [--files <path,...>] --out <dir> [--members <id,...>] [--verify] [--parallel N] [--work <dir>] [--tools on\|off] [--sockets] [--mount-sources] [--ro <path,...>] [--private-dir <path,...>] [--npm-cache-source <dir>] [--retain-paths <rel,...>] [--exclude-names <name,...>] [--max-workspace-bytes B] [--max-retained-bytes B] [--max-dep-cache-bytes B] [--max-working-bytes B] [--min-free-bytes B] [--require-hard-native-quota] [--timeout <seconds>]` runs a review prompt across distinct model families in parallel (with optional `--tools on`, `--sockets` for Codex socket creation, `--private-dir` for per-reviewer `0700` writable directories at fixed paths, isolated `{SCRATCH}` and `{DEP_CACHE}` with symlinked `--npm-cache-source`, read-only source/path mounts, and verified `<out>/workspaces/<member>/` and `<out>/events/<member>.jsonl`) and, with `--verify`, cross-verifies every extracted finding with boolean `supports` verdicts (`supportingFamilies`, `familyCount`) across the other families, writing `REVIEW.json` and `REVIEW.md` |
| prompt preview | `context-lab preview <pack> <experiment\|suite> --out <dir> [--response <file>] [--members <id,...>] [--revision <rev>]` renders what a run would hand its readers and judges - each reader invocation of run 1 with its prompt, instruction files, the runtime configuration context-lab writes, command, environment and mounts, and each judge job's first and retry prompt - contacting no runtime and reading no credential, through the preparation and prompt functions a run uses, into `PREVIEW.json`, `PREVIEW.md` and each invocation's files |

The project pack and the runtime adapter are the two seams: a new project is a new pack, and a new runtime is a new adapter, neither a change to the core.

---

## Reference

The sovereign repository, `https://github.com/apnex/context-lab`, with its consumer operations and pack authoring guide in `README.md` and `docs/OPERATIONS.md`, its vision in `VISION.md`, and its architecture in `docs/ARCHITECTURE-TARGET.md`.

The architecture **declares its own instant**, so this reference stays true without a version recorded here.\
What is built is stated by its completed deltas under `docs/DELTAS/`.

Do not read the implementation to judge fit.\
If duty, contract and fit criteria are insufficient to decide, that is a defect in this entry.

---

## Fit criteria

### Does my project want this at all

Read this half first, before knowing anything about context-lab.\
If none of it describes you, stop here.

- Your agents work from guidance you write - instructions, documents, skills - and you change it.
- You have asked whether a change helped, and the answer came from one session, from the author of the change, or from the same model judging its own work.
- You are about to write a script that launches agents, captures what they did and scores it - **especially if you have written one before, on another project.**

The third is the strongest signal: two projects in this organisation each grew such a harness, one partly copied from the other, before this component existed.

### Does it meet my requirement

- The context is the thing that varies, and everything else must be shown held fixed: the revision, what each agent received, and that nothing withheld reached it.
- Outcomes are behaviour as well as answers: what an agent did in a repository, not only what it said about the guidance.
- A result must be repeatable from its record, and honest about its status.

**It is the wrong tool when**

| you need | reach elsewhere, because context-lab is |
|---|---|
| a ranking of models | not a benchmark - a model is a factor in an experiment, never its subject |
| a score to tune guidance until it passes | not a target - results are evidence about context, judged on experiments a rewrite was not written against |
| agents run against live systems or real data | not built for it - experiments touch material built for them, unless its owner consents |
| a verdict on whether a change may land | not an authority - a comparison flags; the project's own authority decides |

---

## Adjustment policy

Internal and sovereign, so a fit gap has somewhere to go.

1. **Record the gap where both sides can see it.** A project that cannot express an experiment in a pack has found a gap in the pack's contract, and the evidence belongs in context-lab's backlog.
2. **Close it at a seam where one exists.** A new runtime is an adapter against the common outcome form, proved by its conformance suite; project-specific measurement is a hook. Neither is pressure on the core.
3. **Otherwise adjust upstream, or fracture.** A gap that reveals a second duty is a second component, not a feature.
4. **Never fork.** A copied harness adjusted in place is the failure that founded this component.

---

## Edges

**Contains** - twenty-two units at the altitude below this entry, each with one duty, in the anchored core of its architecture: pack checker, experiment register, selector, variant builder, arm composer, workspace builder, runtime adapter (implemented by the `opencode`, `codex`, and `external` adapters), isolation prober, phase driver, answer parser, validity classifier, code measurer, blinder, judge panel, pair chooser, human panel, tally, threshold deriver, comparator, candidate writer, run conductor, and review panel; because context-lab contains them, it inherits every trait any of them has ([`E5`](../entities/E5-system.md)).

**Contained-by** - nothing; context-lab is a top-level registered component.

**Consumes** - nothing; context-lab depends on no other registered component.

**Consumed-by** - mission-kit (`docs/evals/context-lab/`) and zorg (`evals/context-lab/`), which supply project packs and use context-lab through its declared contract without containing it ([`E5`](../entities/E5-system.md)).

None of the twenty-two contained units is registered here.\
The runtime adapters are the likeliest first: running one isolated agent on any runtime and returning its events in one form (`implements` the runtime-adapter port) is useful to anything that drives agents.
