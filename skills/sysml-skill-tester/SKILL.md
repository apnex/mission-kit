---
name: sysml-skill-tester
description: "Verify a SysML-anchored modelling skill before it ships — author a fresh model from the skill ALONE and gate-validate it, audit cross-links/consistency, and gate-verify every 'X parses' claim against the validator. Use to test a model-a-X or composed system skill (the acceptance bar). Read sysml-literacy first; pairs with sysml-skill-builder."
metadata:
  prerequisite: sysml-literacy
  see-also: sysml-skill-builder
  role: meta-verification
---

# sysml-skill-tester — verify a SysML-anchored modelling skill

## When to use

- A modelling-catalogue skill has been built (or changed) and you must **prove it teaches what it claims**
  before shipping.
- You want a repeatable **acceptance bar**, not a once-over read — the discipline that has caught real defects
  (false parse claims, missing examples, mis-attributed validator quirks) every time it ran.

Not for: authoring the skill (that's `sysml-skill-builder`); validating a single model (that's the gate +
`validating-sysml.md`). This verifies the *skill* as a teaching artifact.

**Prerequisite:** `sysml-literacy` (you must read SysML to judge the assets). **Pairs with:**
`sysml-skill-builder` (build → test).

## Test it (the short path)

1. Read **[`references/testing-a-skill.md`](references/testing-a-skill.md)** — the bar, the procedure, the lenses,
   the verdict.
2. Follow the procedure (modelled in **[`assets/test-procedure.sysml`](assets/test-procedure.sysml)**): **author a
   fresh model from the skill ALONE** (a domain not in its examples) → gate-validate (`syntaxErrors == 0`) → audit
   consistency → **gate-verify every "X parses" claim** → judge.
3. Run the lenses independently (in parallel if your agent supports it): authoring-stress · normative correctness ·
   pedagogy/consistency · generalization (when siblings exist).

## Watch out

- **The authoring test is the core.** If an agent given only the skill cannot author a valid model in a NEW
  domain, the skill failed — a clean read is not a pass.
- **Gate-verify every parse claim.** Do not trust prose of the form "X parses / won't parse / is reserved" —
  probe it against the validator. This is the step whose absence has shipped false claims.
- **A green gate is not enough.** `syntaxErrors == 0` is blind to unreachable/unused/unbound semantics, a
  `ref`-vs-`part` mistake, a missing `import`, and non-idiomatic forms it silently accepts.
- **Separate must-fix from nice-to-have** — ship on correct + consistent; defer polish.

## Validate

This skill's own dogfood assets pass the gate (`syntaxErrors == 0`; see
**[`sysml-literacy/references/validating-sysml.md`](../sysml-literacy/references/validating-sysml.md)**). The
verdict criteria are a checkable spec in **[`assets/well-formedness.sysml`](assets/well-formedness.sysml)**.
(`compatibility`: requires a SysML v2 parser. The lenses are independent — run them in parallel if your agent
supports it, or serially; **parallelism is an optimization, not a requirement**.)
