---
name: sysml-skill-evaluator
description: "Use when a new or changed SysML-anchored skill needs its leverage measured before it ships. Measure a SysML-anchored skill's LEVERAGE - whether it conveys methodology understanding the base model lacks, vs merely restating SysML. Run as a gate on a new/changed skill: format held constant (both arms read the same model), the convention WITHHELD from the task, treatment (agent+skill) vs control (agent+grammar-primer), blind-judged vs convention keys, reported as a per-convention treatment-minus-control delta. Read sysml-literacy first; completes the meta-quartet with sysml-skill-builder + sysml-skill-tester."
metadata:
  prerequisite: sysml-literacy
  see-also: sysml-skill-builder, sysml-skill-tester
  role: meta-evaluation
---

# sysml-skill-evaluator - measure a skill's leverage

## When to use

- A modelling skill is **new or changed** and you must prove it **earns its keep** - that it conveys doctrine
  the base model can't infer, not just SysML the base model already knows.
- You want to know **where** a skill adds value (which of its conventions are skill-unique vs already innate),
  to sharpen it toward the parts that matter.

Not for: checking a skill is *correct* (that's `sysml-skill-tester`); authoring a skill (`sysml-skill-builder`).\
This measures **leverage** - the gap a skill opens over the base model.

**Prerequisite:** `sysml-literacy`.\
**Completes the meta-quartet:** `sysml-literacy` (read) - `sysml-skill-builder` (build) - `sysml-skill-tester` (verify-correctness) - **`sysml-skill-evaluator`** (measure-leverage).

---

---

## Evaluate it (the short path)

1. Read **[`references/evaluating-a-skill.md`](references/evaluating-a-skill.md)** - the three design invariants,
   the procedure, how to interpret the per-convention deltas, and the v1->v4 evidence.
2. Follow the procedure (modelled in **[`assets/evaluation-procedure.sysml`](assets/evaluation-procedure.sysml)**):
   pick the skill's conventions -> **withhold them from the task** -> set arms (treatment=skill, control=grammar
   primer, **same medium**) -> blind-solve -> blind-judge vs a convention key -> per-convention delta -> review
   soundness -> verdict (skill-unique vs innate).

---

---

## Watch out (the null-traps - these cause false "no leverage" results)

- **Never state the convention in the task.** If you do, the control gets it for free and the delta collapses to
  zero - the **dominant** cause of three early false nulls (v3 also carried a prose-vs-model confound, and the
  base model's ceiling strength contributed). The rule must come only from the skill - and the **control primer
  must contain zero methodology** (a second leak channel).
- **Hold the medium constant.** Both arms read the same artifact; do NOT compare prose-vs-model (that measures
  the medium, not the skill).
- **Control must be a fair grammar baseline** (knows SysML, not your methodology), comparable length - not a
  strawman, not no-help-at-all.
- **Watch the ceiling.** If the control scores ~100, the task is too easy or the convention leaked - the result
  is uninformative; harden the task. (Soundness criteria: **[`assets/well-formedness.sysml`](assets/well-formedness.sysml)**.)
- **Author-defined keys** measure faithfulness to *your* doctrine, not that the doctrine is externally right -
  say so with every result.

---

---

## Validate

Every `.sysml` asset must pass the gate (**`syntaxErrors == 0`**; see **[`sysml-literacy/references/validating-sysml.md`](../sysml-literacy/references/validating-sysml.md)**).\
The eval itself is sound only if every criterion in **[`assets/well-formedness.sysml`](assets/well-formedness.sysml)** holds (format constant - conventions withheld - control format-matched - blind judge - metric discriminates - convention load-bearing).\
A result where the **control is not at the ceiling AND there is a non-zero per-convention delta** is a **necessary condition** for a verdict - *not sufficient* (the withheld convention must also be load-bearing, per the scale + gate threshold in the reference); anything less is a redesign, not a verdict.\
(`compatibility`: needs an agent that can run independent solver/judge roles; >=5 replicates + a second judge for anything past a directional read.)

---

---

## Note for skill authors

A meta-skill (the `sysml-skill-builder` "composed/meta vary the asset set" variant): no template/example; the assets are the dogfood - the eval **procedure** as an `action def` and the **soundness criteria** as `constraint def`s.\
Use this as the **leverage gate**: a new skill that shows zero delta on every convention is restating SysML - cut or merge it.\
Stand up an optimize-loop only when a skill scores *low* (a gradient to climb); a skill already at the ceiling gives the loop nothing to do.
