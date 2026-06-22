# Authoring a constraint in SysML v2

A constraint model captures a **checkable boolean rule** over data: a reusable, parameterized invariant
that must hold. In SysML v2 a rule is a **`constraint def`** — `in` parameters plus one boolean expression —
which you then **assert** on a part's attributes. Read `sysml-literacy` first; this is the *authoring*
counterpart. (For static structure that's `model-a-component`; for *states* that's `model-a-state-machine`;
for *ordered steps* that's `model-a-workflow`. A constraint is the *must-hold rule over the data*, not the
structure, the states, or the steps.)

`constraint def` is already the well-formedness idiom across this catalogue (every skill's
`well-formedness.sysml`). This skill teaches the construct in its own right — and the new part the catalogue
had not yet shown: **asserting a reusable constraint on a part's attributes**, and **composing constraints**.

## The one distinction that matters: a constraint is a CHECKABLE SPEC, not prose intent

This is the spec/test substrate in miniature. Conflating these three is the classic mistake:

- **A constraint** — `constraint def Positive { in x : Integer; x > 0 }` — is a **decidable boolean over
  data**. Given values it is true or false. It is composable (assert two atoms into one rule) and reusable
  (assert the same def on many parts). It is the "test" half of spec/test.
- **A requirement** is **prose intent** ("the tank shall not overflow"). It says *what is wanted*, not a
  computable predicate. (Requirements `satisfy`/`verify`; that is a different construct — not authored yet.)
- **A prose pitfall / doc** is guidance for a human. It is not checkable at all.

If you cannot write it as a boolean over named parameters, it is not a constraint yet — it is a requirement.
Get that right first; almost everything else is detail.

**Note this validator PARSES constraints but does NOT evaluate them.** A constraint here is a *spec*, exactly
like every `well-formedness.sysml` across the catalogue: `syntaxErrors==0` proves it is well-formed SysML, not
that it holds. A future evaluator — or you, by hand — checks the truth value.

## Anatomy (see `assets/template.sysml`)

```
constraint def Rule {
    in x : Integer;              // a PARAMETER the rule constrains
    in cap : Integer;
    x > 0 and x <= cap          // ONE boolean expression (the spec)
}

part def Subject {
    attribute amount : Integer;
    attribute limit : Integer;
    assert constraint amountValid : Rule {   // ASSERT the rule on this part
        in x = amount;                       // bind each parameter to an attribute
        in cap = limit;
    }
}
```

- **`constraint def`** — a reusable rule. **`in <name> : Type;`** — a parameter (type with `ScalarValues`
  after `import ScalarValues::*;`, or an `enum def`). **The body** is a single boolean expression.
- **`assert constraint <name> : Rule { in p = attr; }`** — assert the rule on a part, binding each parameter
  to an attribute (or a literal). The leading `<name>` is the named assertion (queryable: "what asserts
  Rule?"). The bindings make the spec a contract on this concrete part.
- **Operators** (all gate-verified): comparison `> < >= <= == !=`; boolean `and or not implies xor`.
  **Equality is `==`** — see Pitfalls.

## The authoring procedure

Also modelled as a workflow you can read — **[`assets/authoring-procedure.sysml`](../assets/authoring-procedure.sysml)**.

1. **Name the rule** — one `constraint def` per boolean intent; a meaningful name (`Positive`, `InClosedRange`).
2. **Declare parameters** — the `in` parameters the rule constrains (`Integer`/`Boolean`/an enum).
3. **Write the expression** — ONE boolean over those parameters. Use `==` (not `=`); combine with
   `and`/`or`/`not`/`implies`/`xor`.
4. **Assert on the part** — `assert constraint c : Rule { in p = attr; }`, binding each parameter to an
   attribute. (Or compose two rules — see below.)
5. **Check it is assertable (review)** — is it a *checkable boolean spec*, not prose intent? does every
   parameter appear in the body and get bound at each assert? is equality `==` not `=`? would a *reusable*
   named def beat an inline expression? (cross-walks to `assets/well-formedness.sysml`.)
6. **Validate** — see `sysml-literacy/references/validating-sysml.md`. The gate parses; it does not evaluate.

## The advanced feature: composing constraints (see `assets/composition.sysml`)

The single extension a real user reaches for *next* after one rule: build a higher-level invariant by
**asserting two named constraints inside a third** (a conjunction by composition), then assert that composite
on a part:

```
constraint def NonNegative { in n : Integer; n >= 0 }
constraint def AtMost      { in n : Integer; in cap : Integer; n <= cap }

constraint def WithinAllowance {           // a COMPOSITE built from two reusable atoms
    in qty : Integer;  in allowance : Integer;
    assert constraint NonNegative { in n = qty; }
    assert constraint AtMost      { in n = qty; in cap = allowance; }
}
```

This is what turns constraints into a **reusable spec library** — small atoms combine into named business
invariants, and changing an atom updates every composite that uses it — rather than copy-pasted inline
expressions. (Gate-verified to parse.)

## Patterns

- **Author once, assert many.** A named `constraint def` is reusable: assert it on every part it governs
  (`InClosedRange` asserted on both voltage and state-of-charge in `assets/example.sysml`).
- **Compose atoms into invariants.** Small reusable rules (`NonNegative`, `AtMost`) → a named composite
  (`WithinAllowance`). Reuse beats repetition.
- **Bind to attributes or literals.** `in lo = 0;` (literal bound) and `in v = voltageMv;` (attribute) are
  both legal bindings — gate-verified.
- **Inline only the one-off.** `assert constraint { level >= 0 and level <= capacity }` (anonymous, over
  attributes directly) parses and is fine for a single-use check — but it is **not reusable or composable**.
  Prefer a named `constraint def` whenever the rule recurs or has a meaningful name.

## Pitfalls (gate-learned)

- **Equality is `==`, never `=`.** `constraint def C { in x : Integer; x == 0 }` parses; `x = 0` **parse-FAILS**
  in a constraint body (`no viable alternative at input 'x=0'`). `=` is binding/assignment, not comparison.
- **Reserved / contextual keywords can't be names** — not `in`, `attribute`, `subject`, `state`, `from`,
  `accept`, `to`, `then`, `entry`, `fork`, `render`, `typed`, `out`, `doc`, `verify`, `decide`, `for`, `part`,
  `ref`, `item`. `in` and `attribute` as parameter names **parse-FAIL** (verified: `no viable alternative`);
  `subject` parse-FAILS as an action pin name (caught authoring this skill's own procedure). The list is
  gate-derived and NOT exhaustive vs a normative parser — probe, don't trust the list.
- **The gate accepts a body-less constraint.** `constraint def Empty { in x : Integer; }` (parameters, no
  boolean expression) **parses clean** — but it asserts nothing. A rule with no boolean body is the silent
  bug; the gate is blind to it. Scan for it (`HasBooleanBody` in `assets/well-formedness.sysml`).
- **`import ScalarValues::*;` before `Integer`/`Boolean`/`String`** — and the gate does NOT warn if you
  forget it (the types just resolve to nothing). A genuine blind spot to scan for.
- **The gate parses, it does not evaluate.** `syntaxErrors==0` says the rule is well-formed SysML, not that
  it is satisfiable or true. Unbound parameters, an always-false rule, a parameter never used in the body —
  all parse clean. These are the author's responsibility (the `constraint def`s in `well-formedness.sysml`).
- **`assert Rule { … }` (without the `constraint` keyword) also parses** — but `assert constraint Rule { … }`
  is the canonical form; prefer it for readability + portability.

## Scope — deferred, but exists (add after the skeleton validates)

- **A rich expression / calculation language** — `calc def`, derived attributes, quantities + units, set/
  collection operators. Normative SysML v2 has a full expression sublanguage; this skill stays at boolean
  predicates over scalar parameters. Model the boolean rule first.
- **Runtime EVALUATION** — this validator (and this skill) is **parse-only**. Computing whether a constraint
  holds for given values is out of scope; a constraint here is a spec, like every `well-formedness.sysml`.
- **Requirements (`requirement def`, `satisfy`/`verify`)** — the *prose-intent* sibling a constraint is
  distinct from. Not yet authored; a constraint can be the checkable backing of a requirement.
