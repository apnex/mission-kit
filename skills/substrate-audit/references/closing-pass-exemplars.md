# Closing-pass exemplars

Reference shapes for the three closing-pass artefacts (`05-coverage.md`,
`03-mapping.md`, `00-summary.md`). Pulled from the honcho v3.0.7 probe
at `apnex/kate@6bffd41` — `docs/memory/honcho/`. Read these when you're
about to write the closing pass and want a known-good shape to imitate.

## Why these three exemplars

The honcho probe is a useful exemplar because it exercised every closing-pass
mechanic:

- **Mid-probe promotion** (surprisal) — coverage doc had to account for a
  feature that wasn't on the original inventory
- **Inlined sub-features** — multiple `dream_scheduler.py`-style components
  filed as Behaviour notes in parents
- **Open assessments unresolved at close** — A20, A27, partial A21 carried
  forward
- **Partial-fit goals** — G3 and G4 are partial, not absent; the mapping
  doc had to characterise both ends without overclaiming
- **Negative findings** — no abductive specialist, no TTL/decay; the
  summary's "capabilities NOT present" section is load-bearing

## 00-summary.md exemplar (64 lines)

`apnex/kate:docs/memory/honcho/00-summary.md`

Section shape that worked:

1. **Substrate in one paragraph** — single dense paragraph naming all the
   major subsystems and their cadence relationship; reads as the abstract
2. **Cadence/writers table** — for substrates with multiple async writers,
   a compact table (writer / cadence / output / cost) anchors the
   architectural commitment in one place
3. **Pluggable surfaces** — one sentence listing what's swappable; details
   live in `02-architecture.md` §6
4. **Key capabilities discovered** — 5-8 bullets, each one substrate-native
   capability + one-line significance + cross-ref to feature spec
5. **Capabilities NOT present (negative findings)** — equally important;
   crossprobe relies on knowing what's absent. Cite the assessment entry
   that established each absence
6. **Notable architectural smells** — 2-4 bullets; smells that didn't
   warrant their own assessment paragraph but matter operationally
7. **What this probe deliberately does NOT do** — explicit scope fence
   pointing at crossprobe + deferred infrastructure
8. **Reading order** — numbered list telling a future reader which artefact
   to open in which order, with the one-line purpose of each

The summary CITES the other artefacts rather than restating them. If a
section feels like a re-statement of `02-architecture.md`, cut it.

## 03-mapping.md exemplar (164 lines)

`apnex/kate:docs/memory/honcho/03-mapping.md`

Section shape that worked:

- One H2 per goal (G1, G2, …Gn)
- **Fit: strong | partial | absent** as the first line under the H2 —
  the reader scans these
- **Substrate feature → how it addresses Gx** table per goal — one row
  per cited feature spec, no prose paragraph unless the fit needs an
  argument
- For partial fits, an **Absent** row in the table calling out what
  the substrate does NOT provide (e.g. "no TTL / decay" for G3)
- **Summary table at the bottom** — Goal / Fit / Note — one row per
  goal; lets the operator answer "does this substrate fit?" in 30 seconds

Pitfalls the honcho mapping avoided:

- **Don't over-claim partial fits as strong.** Honcho's G3 (time-aware
  retrieval) has primitives for time-bias but no enforced decay — that
  is partial, not strong. Calling it strong contaminates the comparative
  pass and misleads operators who actually need decay.
- **Don't list every feature spec per goal.** Cite only specs that
  materially address the goal. A 20-row table tells the reader nothing.

## 05-coverage.md exemplar (118 lines)

`apnex/kate:docs/memory/honcho/05-coverage.md`

Section shape that worked:

1. **Specs delivered (N)** — grouped by category (foundations / retrieval /
   async-cognition / infrastructure); each spec gets one line
2. **Planned-but-merged** — features the L1 hypothesis listed but that got
   consolidated into broader specs during execution; per-row rationale
3. **Discovered mid-probe (promoted)** — features that emerged during
   reading and were specced; per-row promotion-criteria justification
   referencing the heuristic in step 6.5 of the main SKILL
4. **Deferred (out-of-scope)** — infrastructure layers explicitly skipped
   per the step-4 scope declaration; per-row rationale
5. **Open assessments at probe close** — questions from `04-assessment.md`
   that couldn't be resolved; what evidence would resolve them
6. **Methodology notes** — what worked, what didn't, what to feed back
   into the skill. The honcho exemplar's note about "the most dangerous
   gaps are the ones you've already mentioned" became pitfall #22 in
   the main SKILL
7. **Closing summary** — one paragraph of counts (N specced, N merged,
   N promoted, N deferred, N open) so a future reader can audit at a
   glance

## When to follow these shapes vs adapt

Follow the section ORDER (summary last, mapping after coverage, etc.) — it's
the discipline that prevents anchor-on-conclusions writing.

Adapt the section SHAPES — your substrate may not have multiple writers, may
not have negative findings worth a section, may have only one goal-fit
column. Don't pad to match the exemplar; cut sections that don't earn
their place.

The substrate vocabulary in these exemplars is honcho-specific
("perspectival peer-pairs", "dreamer", "dialectic agent", "explicit/
deductive/inductive observations"). Your closing pass must use YOUR
substrate's native vocabulary — these shapes show structure, not wording.
