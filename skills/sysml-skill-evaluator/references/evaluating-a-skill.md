# Evaluating a skill's leverage

A skill is worth its tokens only if it conveys something the **base model doesn't already know**. SysML
*grammar* it knows; your project's **methodology conventions** it does not. This skill measures that gap — the
**leverage** a skill provides — so a new skill must prove it teaches doctrine, not restate SysML.

This is the complement to `sysml-skill-tester`: the tester asks *"is the skill correct?"*; the evaluator asks
*"does the skill help — and where?"*

## The question, stated precisely

> Holding the medium constant, does an agent **with** the skill reach conclusions an agent **without** it
> cannot — specifically on the conventions the skill claims to teach, when those conventions are **not** given
> away by the task?

If yes (a large treatment−control gap), the skill earns its keep. If no (the gap is ~0), the base model
already had it — the skill is redundant on that point.

## The three design invariants (violate one and you get a false null)

These are not optional. Across four evals, **three returned a meaningless null** because one was violated.

1. **Hold the medium constant.** Both arms work from the *same* artifact (e.g. both read a SysML model). Do
   NOT compare "prose vs model" — that measures the *medium*, not the skill. (v3's prose arm was this mistake.)
2. **Withhold the convention from the task.** The task poses a situation whose correct answer *requires* the
   rule, but never states it. If you put the rule in the prompt, the control gets it for free and the gap
   collapses to zero. **This is the single most common failure** — v1/v2-read/v3 all leaked the convention into
   the task. The one early signal (a reserved-word trap) was precisely the case where it was *not* leaked.
3. **Blind judging + a format-matched control.** Solver and judge never know which arm produced an output.
   Control = a grammar-only baseline (knows SysML syntax, not your methodology), comparable in length — not a
   strawman, not "no help at all." The primer is a **second leak channel**: it must contain ZERO methodology —
   no example that embodies a convention under test — or the control gets it free, the same null as a task leak.

These three are **necessary, not sufficient** (like the literacy base's `syntaxErrors==0`). A fourth check is the
one most easily forgotten: **the withheld convention must be load-bearing.** The task must be one the rule
actually *decides*, and the base model must *fail* it without the rule. If the task is solvable without the
convention you get a false null (mis-read as "innate"); if the rule doesn't decide the task, a non-zero delta is
noise (mis-read as "skill-unique"). Confirm the control's failure mode *is* the missing convention
(`well-formedness.sysml`: `ConventionIsLoadBearing`).

## The procedure (see `assets/evaluation-procedure.sysml`)

1. **Pick the conventions** the skill claims to teach (its proprietary rules).
2. **Withhold them** — build tasks that require each rule, stating only the situation, never the rule.
3. **Set the arms** — treatment = agent + skill; control = agent + grammar primer; same model + question to both.
4. **Blind-solve** each task × arm (replicate ≥3–5× per cell for a stable estimate).
5. **Blind-judge** each output against a **convention-derived key** — score *low* for "valid SysML, no issues"
   when the key says there's a violation (do not reward confident-but-wrong generic commentary).
6. **Compute the per-convention delta** = treatment mean − control mean.
7. **Review soundness** (see `assets/well-formedness.sysml`): format constant? conventions withheld? control not
   at the ceiling? If control is at 100, the metric is uninformative — harden the tasks.
8. **Verdict** — split the conventions into **skill-unique** (big delta — control fails or asserts the
   opposite) vs **innate** (delta ~0 — the base model already had it). The skill's real value = the skill-unique
   set; the innate ones dilute the headline and make good **negative controls**.

## Scoring + the gate threshold

Score each judged output **0–100 per task**, against the convention-derived key:
- **100** — identifies the withheld violation AND prescribes the convention's fix.
- **~50** — generically correct but misses the convention (spots a symptom, not the rule).
- **0** — asserts the *opposite*, or "valid SysML, no issues" when the key says there is a violation.

A convention's score = the mean over its task×arm replicates; the **per-convention delta** = treatment mean −
control mean (same 0–100 scale). **The gate:** a skill PASSES if at least one withheld convention shows a delta
**≥ ~20**; it FAILS (cut or merge — it is restating SysML) if *every* convention's delta is **< ~20**. Bands:
**≥50** = strong skill-unique value · **20–49** = weak/marginal leverage (a gradient — the optimize-loop's
territory) · **~0** = innate (the base model already has it).

**A worked withheld task (anti-amnesia).** *Model:* a rung with `lifecycleState = "parked"` and no
`revivalTrigger`. *Question (rule withheld):* "Is this well-formed? Any issues?" *Convention key:* flags the
missing revival trigger (anti-amnesia requires every deferral to carry one). *Scoring:* treatment names the
missing trigger → ~100; control says "valid SysML, no issues" → ~0. The task never states "deferrals need a
trigger" — the rule comes only from the skill. That is the whole design in one task.

## Interpreting the result

- **Big positive delta (50–95):** the skill conveys a methodology-specific convention the base model can't
  infer — and often gets *confidently wrong* without (the worst failure mode). This is exactly the value.
- **Delta ~0, control high:** innate SysML/modelling competence; the skill adds nothing measurable there.
- **Delta ~0, both low:** either the task is broken (the convention leaked, or the question is ambiguous), OR a
  **floor effect** — the convention is genuinely skill-unique but the task is too hard for the base model in
  *both* arms. Distinguish them: confirm the *treatment* can solve it at all; if not, ease the task.
- **Delta ~0, both high (ceiling):** the task is too easy or the convention leaked — uninformative; redesign.

## Worked evidence (the v1→v4 arc)

This methodology was forged by failing three times. v1, v2-read, and v3 all hit ceiling nulls — partly the base
model's strength, mainly because the conventions were stated in the task (handing them to the control). The
**corrected v4** (format constant, conventions withheld) finally discriminated: treatment 99.8 vs control 54.1,
with a clean per-convention split — the *methodology-specific* conventions (anti-amnesia +93, buildsOn-on-banked
+93.5, reopenable-terminals +73.5, revive-to-candidate +55, payoff≠dependency +50) showed large gaps, while the
*generic* ones (one-enum-per-axis, ref-vs-part) showed zero. That split *is* the skill's value, isolated.
**Read these as DIRECTIONAL** (n=2 replicates/cell, single judge): the robust claim is the *split* (methodology-
specific = large, generic = ~0), not the one-decimal magnitudes — firming the numbers needs ≥5 reps + a 2nd judge.

## Validity caveats (state them with every result)

- **Author-defined keys** measure *faithfulness to your doctrine*, not whether the doctrine is externally
  *right*. The eval tells you the skill conveys your conventions — not that the conventions are good.
- **Power**: replicates per cell drive the confidence interval; 2 is anecdotal, ≥5 is readable, and a single
  judge leaves grader bias unmeasured (add a second judge / ensemble for anything beyond a directional read).
- **Treatment ceiling**: if the skill is already near 100, you can detect *regressions* better than
  *improvements* — which is why this is a **gate** for new/changed skills, not an optimizer of mature ones.

## Use as a gate

Run this on a **new or changed** skill: it must show a non-trivial treatment−control delta on at least one
withheld convention, or it is just restating SysML and should be cut or merged. An optimize-loop (measure →
adjust → re-measure) is only worth standing up once a skill scores *low* — i.e. when there is a gradient to
climb; a skill already at the ceiling gives the loop nothing to do.
