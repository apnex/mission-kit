---
id: K15
category: skill
title: model-a-classification - author orthogonal enum classification axes in SysML v2
status: active
hydrate-when: You are modelling orthogonal classification axes in SysML v2
name: model-a-classification
description: "Use when modelling which bucket(s) a thing sits in: priority, status, tier, risk, size, a category. Author a classification in SysML v2 - fixed-value axes (enum def) carried as enum-typed attributes to classify a thing along INDEPENDENT dimensions. Keeps orthogonal axes as separate enums (one enum = one axis; a thing carries several), not one combined enum. Read the sysml-literacy skill first; this is the authoring counterpart."
metadata:
  prerequisite: sysml-literacy
  models: classification
---

# model-a-classification - author a classification in SysML v2

## When to use

- You are modelling **which category a thing falls into** along one or more fixed-value dimensions - a
  priority, a status, a tier, a risk level, a size, a label set.
- You have **several independent dimensions** and want them kept orthogonal + queryable ("all
  high-priority items", "everything in the closed status"), not collapsed into one combined label.
- You are handing an agent or a tool a classification scheme and want the axes unambiguous and the value
  sets closed.

Not for: the *structure* a thing is made of - its parts, data and dependencies (that's `model-a-component`); the *states* it moves through and the events between them (that's `model-a-state-machine`); the ordered *steps* it performs (that's `model-a-workflow`).\
A classification is *which bucket(s)*, not what it owns, what state it's in, or what it does.

**Prerequisite:** `sysml-literacy` (you must be able to *read* an `enum def` + an attribute before you author one).

---

## Author it (the short path)

1. Copy **[`assets/template.sysml`](assets/template.sysml)** and rename the generic names.
2. Follow the six-step procedure in **[`references/classifications.md`](references/classifications.md)** -
   also modelled as a workflow you can read in
   **[`assets/authoring-procedure.sysml`](assets/authoring-procedure.sysml)**: list axes -> define enums ->
   attach attributes -> set defaults/multiplicity -> check axes (review) -> validate.
3. Compare against the worked examples: **[`assets/example.sysml`](assets/example.sysml)** (a work item
   on two orthogonal axes - priority + status) and
   **[`assets/orthogonal-axes.sysml`](assets/orthogonal-axes.sysml)** (an arc summit on four axes -
   payoff, tier, risk + a multi-valued tag axis - the orthogonality lesson made concrete).

The canonical shape (from the template):
```
enum def Priority { low; medium; high; }        // an AXIS: a fixed, mutually-exclusive value set

part def WorkItem {
    attribute priority : Priority = Priority::low;  // classified on the Priority axis (default optional)
    attribute status : Status;                      // a SECOND, orthogonal axis = a second attribute
}
```

---

## Watch out (see references for the full list)

- **The one distinction that matters: ORTHOGONALITY - one enum = one axis; a thing carries several.**
  Conflating two dimensions into one enum (`{ lowOpen; lowClosed; highOpen; highClosed; }`) is the classic bug.
  It **parses clean** (`syntaxErrors == 0`, gate-verified) - the parser is silent, so only you catch it.
- **A typo'd default literal is NOT flagged** - `= Priority::middle` (no such value) parses clean
  (probed). Scan defaults by hand.
- **Reserved/contextual keywords can't be enum LITERALS or attribute NAMES** - probed: `enum def E { in;
  out; to; }` parse-fails, and `attribute state : State` parse-fails (`state` reserved). Also `disjoint`
  is reserved in this gate. Avoid `state`, `from`, `accept`, `to`, `then`, `entry`, `subject`, `fork`,
  `render`, `typed`, `in`, `out`, `doc`, `verify`, `decide`, `for`, `part`, `ref`, `attribute`, `item`,
  `disjoint`. (List is gate-derived, not exhaustive - probe, don't trust it.)
- **Multiplicity picks single- vs multi-valued** - default `[1]` = exactly one bucket; `[0..*]` = several
  at once (tags/labels). A deliberate contract.
- **Literals are scoped to their enum** - `high` may recur in `Priority` and `Risk`; `Priority::high` and
  `Risk::high` are distinct. Reusing one enum across part defs is fine.

---

## Validate

Authoring SysML is the error-prone direction - **always validate before you trust the model.** The discipline is shared across all model-a-X skills: **[`sysml-literacy/references/validating-sysml.md`](../sysml-literacy/references/validating-sysml.md)**.\
In short: run a SysML v2 parser, require **`syntaxErrors == 0`** (necessary, not sufficient), then scan the semantics by hand - the parser is *silent* on the two things that matter here: **conflated (non-orthogonal) axes** and a **typo'd default literal** (both gate-verified to parse clean).\
The decidable rules are a checkable spec in **[`assets/well-formedness.sysml`](assets/well-formedness.sysml)**.\
(`compatibility`: requires a SysML v2 parser to validate.)

---

## Note for skill authors

This skill follows the **model-X template** - the fixed scaffold `sysml-skill-builder` codifies: a thin `SKILL.md` (frontmatter `prerequisite: sysml-literacy` + `models: <construct>` - when - author-it - watch-out - validate - this note) + **five assets** - `template.sysml`, `example.sysml`, one focused *advanced* example (the construct's most valuable extension - here `orthogonal-axes.sysml`, more independent axes), `authoring-procedure.sysml` (the procedure as an `action def`, its penultimate step a review - `checkAxes`, the orthogonality self-audit), `well-formedness.sysml` (the decidable rules as `constraint def`s) - + one `references/<construct>.md`, all linking the shared `validating-sysml` reference.\
A primitive declares `prerequisite: sysml-literacy` and composes nothing; "level" is derived from the edges.
