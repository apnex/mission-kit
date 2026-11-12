---
id: C3
category: component
title: shape-check - declared JSON shape validation and plain-data reading
status: active
hydrate-when: You are about to validate a value against a schema or read an untrusted object across a boundary without triggering getters or hidden promises
sovereignty: internal
supersedes: []
related: [C0, A3]
---

# C3 - shape-check

Sovereignty is `internal`, so a fit gap here is pressure that routes upstream rather than a constraint a consumer works around.

---

## Duty

Judge any value against a shape declared as data in the same way at every boundary, returning a plain copy or the misfits to fix.

That is the whole duty.\
It does not also store shapes, coerce or repair values, decide who may submit a value, or send or listen over a network - each of those belongs to the caller or to another component.

At the altitude below this one it is nine units in its anchored core, listed under `Edges`.\
That is the anchored core of one box, per [`C0`](README.md#duty-is-singular-at-an-altitude), not nine duties.

---

## Contract

What a consumer depends on, and what it may not reach past.

| surface | contract |
|---|---|
| dialect | two subsets of JSON Schema 2020-12: dialect 1 (`SHAPE_DIALECT_ID`, `urn:apnex:shape-check:dialect:1`), whose keywords `type`, `properties`, `required`, `additionalProperties` (`false` or a subschema), `items`, `enum`, `const`, `pattern`, `minLength`, `maxLength`, `minItems`, `maxItems` and `format` (`uri` only, as an assertion) mean what that specification says unless the contract says otherwise; and dialect 2 (`urn:apnex:shape-check:dialect:2`, a string the package exports no constant for), which keeps every keyword of dialect 1 with its meaning and adds `minimum` and `maximum` (a JSON number, on numbers: the value is at least or at most it) and `uniqueItems` (a boolean, on arrays: when `true`, no two items are equal as JSON) (`SD9`); a shape document names its dialect in its root `$schema` and a subschema carries none, a dialect 1 document may be placed inside a dialect 2 one, and once released, what a dialect means never changes, so a keyword added later belongs to a new dialect identifier and a dialect 1 document using `minimum`, `maximum` or `uniqueItems` is refused with `unknown-keyword` |
| judgement | `judgeShapeValue(shape, value)` judges a value against a whole shape document, changing neither, and returns one of three verdicts, each a JSON object: `{ verdict: "fits" }`; `{ verdict: "misfit", misfits }`, listing every misfit rather than the first, ordered by JSON Pointer and then keyword, each misfit exactly `pointer`, `keyword`, `expected` (the part of the shape broken) and `fit` (a sentence from the contract's fixed table saying what would fit); or `{ verdict: "shape-refused", problems }`, every problem listed (`not-an-object`, `missing-dialect`, `unknown-dialect`, `nested-dialect`, `unknown-keyword`, `invalid-value`, `invalid-pattern`) and no value judged; `prepareShapeDocument(shape)` checks a document once and returns a judge for any number of values; the same shape and value always yield the same verdict, record for record, and a value judged against a dialect 1 shape and the same shape marked dialect 2 gets the same verdict and reason; a dialect 2 misfit of `minimum`, `maximum` or `uniqueItems` is explained as dialect 1's are, and `invalid-value` refuses a `minimum` or `maximum` that is not a JSON number or a `uniqueItems` that is not a boolean |
| plain-data reading | `readPlainJson(value)` copies an arbitrary value into a deeply frozen plain JSON value in a single descriptor pass (`Object.getOwnPropertyDescriptor` over `Object.getOwnPropertyNames`, accepting `null`, booleans, finite numbers with `-0` normalised to `0`, strings, plain arrays and plain objects), without invoking getters, setters, `toJSON` or `valueOf` conversions; it rejects accessors, symbols, non-plain prototypes, array holes and active-path cycles, catches any throw from a `Proxy` trap, and calls `observePromises(value)` before returning `{ ok: false }` |
| promise observation | `observePromises(value, maxNodes = 1000)` walks up to `maxNodes` objects or arrays by identity through own data descriptors without the call stack (catching any `Proxy` trap throw) and, for every reached value that is a native `Promise` (`instanceof Promise`), calls `Promise.prototype.then.call(v, noop, noop)` inside a `try`/`catch` guard, consuming its rejection whenever attachment succeeds (when a promise carries an own `constructor` or `Symbol.species` getter that throws before reactions attach, the throw is caught and ECMAScript cannot suppress that rejection) |
| canonical JSON and bounds | `toCanonicalJson(value)` serialises a plain JSON value with object properties ordered by the Unicode code points of their names (`SD4`), `snapshotJson(value)` freezes a plain copy, and `utf8ByteLength`, `nestingDepth` and `firstUnsafeInteger` (`SAFE_INTEGER_LIMIT`) measure size, depth and safe-integer bounds |
| conformance corpus | `@apnex/shape-check/corpus` exports both dialects' positive and negative conformance cases as data, authored independently of the implementation |

The plain-data reader (`readPlainJson` and `observePromises`) is the load-bearing seam at every plug-in and callback boundary: any component that calls caller-supplied code reads the return value through it before inspecting a single field.

---

## Reference

The sovereign repository `apnex/shape-check` (`@apnex/shape-check`), with its vision in `VISION.md`, its contract in `CONTRACT.md`, and its machine-checked surface in `export-map.json`.

Releases are published only by its own CI, as a tarball attached to a GitHub release at `https://github.com/apnex/shape-check/releases`, and a published release is never replaced, so a fix is a new version.\
A consumer names the release file in its `package.json`, and its lockfile pins the file's hash.

The contract and export map state what is served now, so this reference stays true without a version recorded here.\
Where `export-map.json` records `deferred: {}`, current and target have not diverged.

Do not read the implementation to judge fit.\
If duty, contract and fit criteria are insufficient to decide, that is a defect in this entry.

---

## Fit criteria

### Does my project want this at all

Read this half first, before knowing anything about `shape-check`.\
If none of it describes you, stop here.

- More than one part of your system checks incoming records, arguments or plug-in return values, and you need them to agree on every verdict and every error message.
- Callers (especially language-model agents) need a refusal that states the exact JSON Pointer path, what was expected and how to fix it in one attempt.
- You accept values from untrusted or caller-supplied callbacks in JavaScript and must not let property getters, setters, `toJSON`/`valueOf` methods, throwing `Proxy` traps or reachable rejected `Promise`s corrupt validation or surface as unhandled rejections.

### Does it meet my requirement

- Shapes are JSON data that both sides of a boundary can inspect, in a fixed subset of JSON Schema 2020-12; a record is closed by `additionalProperties: false`, which the dialect allows and does not require.
- Validation never mutates the caller's object, fills defaults, or coerces types (its only normalisation is `-0` to `0`, matching JSON number semantics, in both `readPlainJson` and `judgeShapeValue`).
- Numeric bounds and distinct array items, where a shape needs them, are declared in dialect 2.
- The library must run in any JavaScript runtime with zero runtime-specific dependencies.

**It is the wrong tool when**

| you need | reach elsewhere, because `shape-check` is |
|---|---|
| coercion, default filling, or silent stripping of unknown fields | not a normaliser - it judges the value it was given, and a field the shape does not allow is a misfit, never stripped |
| open-ended schemas, `$ref` of any kind, or arbitrary code predicates | not a general schema engine - shapes are data in a fixed subset of JSON Schema 2020-12, with no `$ref` or `$defs` |
| storing records, tracking revisions, or ordering writes | not a store - compose it with [`C4`](C4-entity-store.md) |
| CLI flag parsing or environment-variable precedence | not a command parser - reach for [`C9`](C9-operation-command.md) |

---

## Adjustment policy

Internal and sovereign, so a fit gap has somewhere to go.

1. **Record the gap where both sides can see it.** If a project needs a keyword or format the dialects exclude, record the measured case against `shape-check`'s contract rather than writing a side validator.
2. **Adjust upstream so every consumer gets the same dialect, or keep it in the application's semantic policy.** Domain rules that depend on state (such as whether a name is already taken) belong in the store or application policy, not in the shape dialect.
3. **Never fork.** Two validators that almost agree re-create the drift this component exists to eliminate.

---

## Edges

**Contains** - nine internal units in its anchored core: dialect checker (`shape-document-check`), value judge (`judge-shape-value`, `value-judgement`), verdict builder (`shape-verdict`), JSON Pointer ordering (`json-pointer-order`), URI format checker (`uri-format`), plain-JSON reader and promise observer (`plain-json-value`), canonical JSON serialiser (`canonical-json`), dialect constants (`shape-dialect`), and the conformance corpus (`corpus`).

**Contained-by** - nothing; `shape-check` is a top-level registered component.

**Consumes** - nothing; `shape-check` depends on no other component.

**Consumed-by** - [`C4`](C4-entity-store.md) (`entity-store`), [`C5`](C5-operation-call.md) (`operation-call`), [`C6`](C6-entity-api.md) (`entity-api`), [`C7`](C7-caller-identity.md) (`caller-identity`), [`C8`](C8-operation-proxy.md) (`operation-proxy`), [`C9`](C9-operation-command.md) (`operation-command`), [`C10`](C10-credential-issuer.md) (`credential-issuer`), [`C15`](C15-entity-graph.md) (`entity-graph`, a draft not yet built), and `zorg`, which use `shape-check` through its declared contract without containing it ([`E5`](../entities/E5-system.md)).
