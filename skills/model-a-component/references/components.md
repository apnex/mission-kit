# Authoring a component in SysML v2

A component model describes **static structure**: what things a system is made of, the data each carries, what
they own, and what they depend on. In SysML v2 a component kind is a **`part def`** (a thing that flows or is
stored is an **`item def`**). Read `sysml-literacy` first; this is the *authoring* counterpart. (For *states*
and events that's `model-a-state-machine`; for *ordered steps* that's `model-a-workflow`. A component is the
*being-made-of*, not the doing.)

## The one distinction that matters: `ref` vs `part`

This is the component analog of "two orthogonal axes" — conflating them is the classic structure bug:

- **`part child : Child[*];` — COMPOSITION.** The component *owns* the sub-part; its lifetime is contained.
  (A `System` owns its `services`.)
- **`ref uses : Other[0..*];` — DEPENDENCY.** The component *points at* something it does not own. (A
  `Service` refs the `Database` it depends on — it doesn't contain it.)
- **A flowing `item` is a `ref`, not a `part`.** A `Service` that processes `Order`s does `ref handles :
  Order[*]` — it handles instances whose lifetime it doesn't own (see `assets/example.sysml`).

Get this right first; almost everything else is detail.

## Anatomy (see `assets/template.sysml`)

```
part def Component {
    attribute name : String;          // DATA the component carries
    attribute kind : Kind;            // an enum-typed attribute
    ref uses  : Dependency[0..*];     // a DEPENDENCY edge (points at)
    part parts : Subpart[*];          // COMPOSITION (owns)
}
```
- **`part def`** — a structural component kind. **`item def`** — a thing that flows/is stored; it carries
  `attribute`s in a brace body just like a part (`item def Order { attribute id : String; }`), but a component
  **refs** an item (it doesn't own each instance's lifetime).
- **`attribute x : Type;`** — data. Type it with `ScalarValues` (`String`/`Boolean`/`Integer`, after
  `import ScalarValues::*;`) or an `enum def`.
- **Multiplicity** — `[1]` (default, one), `[0..*]` (optional many), `[1..*]` (at least one), `[*]` (any).
- **Subtyping** — `part def CpuWorker :> Worker { … }`: `CpuWorker` *is-a* `Worker` (`:>` specializes). Mark a
  base you never instantiate directly `abstract part def`.
- **Instances + redefinition** — `part w : CpuWorker :> workers { :>> cores = 16; }`: a concrete part subsetting
  an owner (`:>`), redefining an inherited attribute value (`:>>`). See `assets/specialization.sysml`.

## The authoring procedure

Also modelled as a workflow you can read — **[`assets/authoring-procedure.sysml`](../assets/authoring-procedure.sysml)**.

1. **List the parts** — the kinds of thing in the system; one `part def` each (`item def` if it flows).
2. **Add attributes** — the data each part carries.
3. **Wire the structure** — `ref … : Other[mult]` for dependencies, `part … : Sub[mult]` for composition.
4. **Add subtypes** — `:>` where kinds share structure; `:>>` to redefine values on instances.
5. **Check ownership (review)** — is every `ref` a dependency and every `part` truly owned? does every
   ref/part resolve? is the multiplicity sane? (cross-walks to `assets/well-formedness.sysml`.)
6. **Validate** — see `sysml-literacy/references/validating-sysml.md`.

## Patterns

- **`ref` for dependency, `part` for ownership.** If deleting the whole would delete the piece, it's a `part`;
  if the piece outlives/sits outside it, it's a `ref`.
- **Subtype to share, redefine to specialize.** Common structure → an (often `abstract`) base + `:>` subtypes;
  set concrete values with `:>>` on the instance.
- **Multiplicity is a contract.** `[1..*]` says "at least one"; `[0..1]` says "optional". Author it
  deliberately — it's checkable structure, not decoration.

## Pitfalls (gate-learned)

- **Reserved / contextual keywords can't be names** — not `part`, `ref`, `attribute`, `item`, `state`, `from`,
  `accept`, `to`, `then`, `entry`, `subject`, `fork`, `render`, **`typed`**, **`in`/`out`**. (`typed` and `in`
  are real footguns here — they parse-fail as feature names.) The list is gate-derived and NOT exhaustive vs a
  normative parser; also steer clear of data-model-loaded names like `value` / `type` (they parse here but are
  semantically reserved normatively) — prefer a domain name.
- **`ref` vs `part`** — using `part` for something the component doesn't own (or `ref` for something it does)
  is the classic structure bug; the parser cannot judge ownership, so it won't catch it.
- **`import ScalarValues::*;` before `String`/`Boolean`/`Integer`** — and note the gate does NOT warn if you
  forget it (the names just resolve to nothing silently) — a genuine blind spot to scan for.
- **`:>` (specialize) vs `:>>` (redefine).** `:>` is a *type* relationship: between two **defs** it is
  specialization (subtype / is-a), on a **usage** it is subsetting; `:>>` sets a *value* (redefine an
  attribute, "this instance's attr = …"). Don't swap `:>` and `:>>`.
- **Unresolved type targets ARE flagged — as a warning.** A typo'd/undeclared type — `ref store : Databse;` —
  emits a non-gated `warning: Type 'Databse' is not defined` (visible, but `syntaxErrors` stays 0). So the
  manual scan is NOT for typos (the gate shows those); it is for the two things the gate is silent on: a missing
  `import ScalarValues::*;`, and `ref`-vs-`part` semantics. Encode the decidable rules as `constraint def`s
  (**[`assets/well-formedness.sysml`](../assets/well-formedness.sysml)**).

## Scope — deferred, but exists (add after the skeleton validates)

- **Ports + connections / interfaces** (`port def`, connection `connect … to …`) — how parts plug together.
  Normative SysML v2 has them; out of scope of this skill (a future `model-a-connection`, not yet authored).
  Model the parts + refs first.
- **Attribute constraints** (a `constraint def` asserted on a part's attributes) — that's `model-a-constraint`
  (not yet authored).
- **Item flows between parts** — model the static structure first, layer flows later.
