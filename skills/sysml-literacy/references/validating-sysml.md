# Validating SysML (shared reference)

Authoring SysML is the **error-prone direction** — reading is forgiving, writing is not. Every SysML-anchored
authoring skill (`model-a-state-machine`, `model-a-workflow`, …) shares this validate discipline; it lives here
once, in the literacy base, so each skill links it instead of repeating it.

## Run a parser; gate on `syntaxErrors == 0`

Put the `.sysml` text through a SysML v2 parser / LSP and require **zero syntax errors**. That is the trust bar
for "this text is well-formed SysML." It is the *only* fully mechanical check you get.

## `syntaxErrors == 0` is NECESSARY, not SUFFICIENT

A clean parse does **not** mean the model is correct. Two gaps the parser will not catch:

1. **Semantic well-formedness** — the parser happily accepts an unreachable state, a transition that targets
   nothing meaningful, a declared event no transition uses, an effect that binds nothing. These are the
   author's responsibility. After a clean parse, **scan by hand** (or with a linter):
   - every transition has a target (`then <state>`);
   - every non-initial state is reachable (some transition `then`s it);
   - every declared event is used (appears in some `accept`);
   - every "terminal" is a deliberate choice (reopenable, or intentionally a dead-end).
   A skill may ship these as `constraint def`s (a checkable spec) — e.g. `model-a-state-machine/assets/well-formedness.sysml`.
2. **Normative idiom** — the validator below is a *community subset*. Passing it does **not** mean the text is
   idiomatic OMG-normative SysML v2 (see "Normative vs this validator").

## The validator we gate on (daltskin community ANTLR build)

The gate is `sysml-v2-lsp` (the daltskin community ANTLR grammar) — **necessary, not sufficient**, vs the
OMG-normative pilot. It emits advisory **semantic** notes that are NOT gated. Know the ignorable classes so you
don't chase ghosts (and don't distort a valid model to silence them):

- **`… has no documentation` (info)** — cosmetic; add a `doc` if you like, ignore otherwise.
- **`should use camelCase` (hint)** — meaningful ids (`R0`, `S_relational`, `MDL3`) are deliberate; ignore.
- **`… is not referenced by any usage in the workspace` (warning)** — expected for a top-level `def` (an
  `action def`, a `constraint def`) that nothing in the file *uses* — exactly the case for a skill's modelled
  procedure or a stand-alone spec. Cosmetic; ignore.
- **`Circular containment: A -> B -> A` (advisory error)** — a known FALSE POSITIVE of this analyzer's
  containment heuristic on a reified relational metamodel (a `ref` to a compositely-owned type reads as a
  back-edge). The model is valid SysML; do not distort it.
- **`Type 'XthenY' is not defined` (warning)** — a **greedy-parse artifact**: when a `: Type` binding is
  immediately followed by `then`, this grammar swallows the `then` into the type name (`Activate then active`
  → `Activatethenactive`). It appears for the bound-payload accept (`accept e : Event then …`) and the inline
  `do action x : Action then …` effect form. The text still parses (syntaxErrors==0); the warning is spurious
  **on this validator** — but prefer the forms that avoid it (see below).

## Normative vs this validator (what to flip when a real parser arrives)

Two idioms here are validator-driven substitutions, not the normative choice. Use the portable form now; flip
when an OMG-normative parser is the gate:

- **Events: use `item def Event;`.** Normatively, lifecycle events/triggers are `signal def` (asynchronous
  signals); items are things that flow or are stored. This validator does **not** implement `signal def`
  (`signal def E;` → a syntax error), so `item def` is the portable substitute. Flip `item def` → `signal def`
  for events under a normative parser.
- **Accept: prefer bare `accept Event`.** Normatively you can bind the payload (`accept e : Event`) to read it
  in a guard/effect — but this validator mis-parses `: Type` before `then` (the greedy-parse warning above), so
  the bare form is the clean choice here. Guards that need a condition can read attributes in scope instead
  (`accept Event if <cond> then …`), which is clean. Bind the payload only under a normative parser.

## Attribution caveat

Semantic notes are **workspace-wide**: a warning from one file can surface while validating another in the same
batch. When attributing a warning, validate the file in isolation.
