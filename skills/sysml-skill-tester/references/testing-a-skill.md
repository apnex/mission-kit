# Testing a SysML-anchored modelling skill

This is the **acceptance bar** for a modelling-catalogue skill: prove it teaches what it claims, before it ships.
The discipline is agent-agnostic; run the lenses in parallel if your agent supports it.

## The core test: author from the skill ALONE

The single most informative check — **author a FRESH model in a new domain using ONLY what the skill says**, then
run it through the gate (`syntaxErrors == 0`). If an agent given only the skill cannot produce a valid model, the
skill failed, full stop. Pick a domain *not* in the skill's examples (so you test the teaching, not recall).

## The procedure (see `assets/test-procedure.sysml`)

1. **Author fresh** — a new model from the skill alone, exercising every construct the skill requires (incl. its
   advanced feature).
2. **Gate-validate** — run the SysML parser; require `syntaxErrors == 0`. A failure is a finding about the skill.
3. **Audit consistency** — do all cross-links resolve on disk? does the skill contradict itself or the shared
   `validating-sysml` reference? are the dogfood assets the right SysML kinds? Does it teach the correct
   **post-gate hand-scan** for its construct, and correctly *attribute* the validator's known advisory
   false-positives (circular-containment, the `XthenY` greedy-parse, `not-referenced`) — rather than presenting a
   validator-ism as a language rule (a documented past defect)?
4. **Gate-verify every parse claim** — for EVERY prose claim of the form "X parses" / "X won't parse" / "is
   reserved", write a probe and run it through the gate. This is load-bearing: skills have shipped false claims
   (a bound-`accept` idiom; `do action` in an action body; `else` "won't parse" when it silently does) precisely
   where this step was skipped.
5. **Judge** — issue a verdict. (`judge` is the meta-analogue of the primitives' review step — the
   review/verdict gate before a skill is declared done; it mirrors the builder's `reviewScaffold`.)

## The lenses (independent perspectives)

Run these as independent checks (each surfaces what the others miss):

- **Authoring-stress** — the core test above; report where the skill left you guessing or its scope couldn't
  express what you needed.
- **Normative correctness** — does the skill teach idiomatic SysML v2, or a validator-ism presented as a language
  rule? (Verify each against the gate.)
- **Pedagogy + consistency** — cross-links, self-contradiction, progressive disclosure, DRY, dogfood assets.
- **Generalization** (when ≥2 sibling skills exist) — does the model-X template still hold, or does this skill
  strain it? Generic-vs-specific split (feeds `sysml-skill-builder`).

## The verdict (see `assets/well-formedness.sysml`)

A skill passes when: the **authoring test passes**, there are **no false parse claims**, **all cross-links
resolve**, and it is **internally consistent** with the shared reference. Separate **must-fix** (a wrong parse
claim, a broken link, a self-contradiction, an authoring-test failure) from **nice-to-have** (polish). Ship on
"correct + consistent"; defer polish.

## Why a green gate is not enough

`syntaxErrors == 0` is necessary, not sufficient (see `validating-sysml.md`): it is blind to an unreachable
state, an unused event, an unbound effect, a `ref`-vs-`part` mistake, a missing `import`, and non-idiomatic
forms it silently accepts. The authoring test + the lenses cover what the gate cannot.
