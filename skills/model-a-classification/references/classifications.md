# Authoring a classification in SysML v2

A classification model describes **how a thing is categorized along fixed-value axes**: each axis is a
single dimension with a closed, mutually-exclusive set of values, and a thing is classified by carrying
that axis as an enum-typed attribute. In SysML v2 an axis is an **`enum def`** (`enum def Priority { low;
medium; high; }`) and the classification is an **enum-typed `attribute`** on a `part def` (`attribute
priority : Priority`). Read `sysml-literacy` first; this is the *authoring* counterpart. (For the
*structure* a thing is made of that's `model-a-component`; for the *states* it moves through that's
`model-a-state-machine`. A classification is *which bucket(s)* a thing sits in — not what it owns or does.)

## The one distinction that matters: ORTHOGONALITY (one enum = one axis)

This is the classification analog of "ref vs part" — getting it wrong is the classic classification bug,
and **the gate cannot catch it**:

- **Each `enum def` is ONE independent dimension.** `Priority` (urgency) and `Status` (lifecycle
  position) are *different questions* about the same thing. Each gets its own enum and its own attribute.
- **A thing classified along several dimensions carries several enum-typed attributes — one per axis.** A
  work item has `attribute priority : Priority` AND `attribute status : Status` AND `attribute size :
  Size`. The classification space is the **product** of the axes.
- **Do NOT conflate axes into one enum.** The anti-pattern is `enum def State { lowOpen; lowClosed;
  highOpen; highClosed; }` — jamming priority × status into one hand-enumerated list. It **parses with
  `syntaxErrors == 0`** (gate-verified), so the parser is silent; only you can catch it. It explodes
  combinatorially, makes "all high-priority items" un-queryable, and couples dimensions that should vary
  independently. The arc's real classification keeps payoff, tier and risk as **three** orthogonal enums
  for exactly this reason (see `assets/orthogonal-axes.sysml`).

Get orthogonality right first; almost everything else is detail.

## Anatomy (see `assets/template.sysml`)

```
enum def Priority { low; medium; high; }        // an AXIS: a fixed, mutually-exclusive value set

part def WorkItem {
    attribute title : String;                       // ordinary data (not a classification)
    attribute priority : Priority = Priority::low;  // classified along the Priority axis (default optional)
    // one enum-typed attribute per ORTHOGONAL axis
}
```
- **`enum def Axis { v1; v2; … }`** — a classification axis. Each value is a literal; bare literals
  (`low;`) and the keyword-prefixed form (`enum low;`, which also takes a per-literal `doc`) both parse.
- **`attribute x : Axis;`** — classifies the thing along that axis. Default `[1]` multiplicity = exactly
  one value (single-valued axis).
- **Default value** — `attribute priority : Priority = Priority::medium;` (qualified) or `= medium;`
  (unqualified) both parse; the default must be a literal of that enum.
- **Literals are scoped to their enum** — `low`/`medium`/`high` may recur across `Priority` and `Risk`;
  `Priority::high` and `Risk::high` are distinct values on distinct axes. Reusing one enum across several
  part defs (`attribute tier : Tier` on both `A` and `B`) is fine and encouraged.

## The authoring procedure

Also modelled as a workflow you can read — **[`assets/authoring-procedure.sysml`](../assets/authoring-procedure.sysml)**.

1. **List the axes** — the *independent dimensions* you classify along; one axis per distinct question.
2. **Define the enums** — one `enum def` per axis, its fixed values as literals.
3. **Attach attributes** — one enum-typed `attribute` per axis on the thing being classified.
4. **Set defaults / multiplicity** — optional `= Axis::value` default; `[0..*]` for a multi-valued axis.
5. **Check the axes (review)** — are the axes truly *orthogonal*? Is any single enum secretly two
   dimensions jammed together? Does every default name a real literal of its enum? (cross-walks to
   `assets/well-formedness.sysml`.)
6. **Validate** — see `sysml-literacy/references/validating-sysml.md`.

## Advanced: more orthogonal axes (see `assets/orthogonal-axes.sysml`)

The most valuable extension of a classification is **more independent dimensions** — the single thing a
real user reaches for next. `assets/orthogonal-axes.sysml` classifies an arc summit along **four** axes:
`payoff`, `tier`, `risk` (three single-valued enums, all independent) plus `tags : Tag[0..*]` (a
**multi-valued** axis — a thing can carry several tags at once). The point is that each axis varies,
queries and reasons *alone*: a high-payoff summit can be low- or high-risk; tier is independent of both.
This is the orthogonality lesson made concrete.

## Patterns

- **One enum = one axis; a thing carries several.** If you find yourself enumerating combinations
  (`smallUrgent`, `largeIdle`), you have two axes — split them.
- **Multiplicity picks single- vs multi-valued.** Default `[1]` = exactly one bucket (priority); `[0..*]`
  = several at once (tags/labels). Choose deliberately — it's a contract.
- **Reuse an enum across things; reuse a literal across enums.** Both are fine and keep the vocabulary
  small. Literals are scoped, so name collisions across axes are harmless.
- **Defaults encode the common case.** `= Status::open` says "new items start open"; checkable structure,
  not decoration.

## Pitfalls (gate-learned)

- **Conflated axes parse clean — the gate is SILENT.** A single enum jamming two dimensions
  (`{ lowOpen; highClosed; }`) is `syntaxErrors == 0` (probed). Orthogonality is an author-only judgment;
  scan for it by hand. This is the one thing this skill exists to prevent.
- **A typo'd default literal is NOT flagged.** `attribute priority : Priority = Priority::middle;`
  (note: no `middle` value) parses with `syntaxErrors == 0` (probed) — the gate is silent on a default
  that names a non-member. Scan defaults by hand.
- **Reserved / contextual keywords can't be enum LITERALS** — probed: `enum def E { in; out; to; }`
  parse-fails (`extraneous input 'in'`). Nor can a reserved word be the attribute NAME — `attribute
  state : State` parse-fails (`state` is reserved). Avoid `state`, `from`, `accept`, `to`, `then`,
  `entry`, `subject`, `fork`, `render`, `typed`, `in`, `out`, `doc`, `verify`, `decide`, `for`, `part`,
  `ref`, `attribute`, `item` as literals or names. Also note `disjoint` is reserved in this gate (it
  parse-fails as a name) — relevant since classifications are about mutual exclusion; use `exclusive`.
  The list is gate-derived and NOT exhaustive vs a normative parser — **probe, don't trust the list**.
- **`import ScalarValues::*;` before `String`/`Integer`** — only needed for ordinary (non-enum) data;
  enum-typed attributes don't need it, but the gate is silent if you forget it where you do (a blind
  spot). Encode the decidable rules as `constraint def`s
  (**[`assets/well-formedness.sysml`](../assets/well-formedness.sysml)**).

## Scope — deferred, but exists (add after the skeleton validates)

- **Enums with bodies / operations** — an `enum def` whose literals carry attributes or behaviour. Out of
  scope; model the flat fixed-value axes first.
- **Derived / computed classifications** — an axis whose value is *derived* from others (a `derived`
  attribute or a calculation), rather than independently set. Out of scope of this skill; model the
  independent axes first, derive later.
- **Constraints across axes** — a rule that couples two axes ("if risk = high then tier must be
  load_bearing") is a `constraint def` over the classification — that's `model-a-constraint` (not yet
  authored). Keep the axes orthogonal first; layer cross-axis rules separately.
