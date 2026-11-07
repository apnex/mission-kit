---
id: C3
category: component
title: shape-check - closed-record JSON shape validation and plain-data reading
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
| dialect | one closed-record JSON Schema 2020-12 subset (`SHAPE_DIALECT_ID`, `prepareShapeDocument`), where every object keyword requires `additionalProperties: false` and `$ref` targets only local `#/$defs/<name>` definitions with no cycle |
| judgement | `judgeShapeValue(shape, value)` reads the input as plain data first, checks every rule of the dialect, and returns `{ fit: true, value }` with a deeply frozen plain copy or `{ fit: false, misfits }` ordered by JSON Pointer, each misfit naming `path`, `rule`, `expected`, `actual` and `fix` |
| plain-data reading | `readPlainJson(value)` copies an arbitrary value into a deeply frozen plain JSON value in a single descriptor pass (`Object.getOwnPropertyDescriptor` over `Object.getOwnPropertyNames`, accepting `null`, booleans, finite numbers with `-0` normalised to `0`, strings, plain arrays and plain objects), without invoking getters, setters, `toJSON` or `valueOf` conversions; it rejects accessors, symbols, non-plain prototypes, array holes and active-path cycles, catches any throw from a `Proxy` trap, and calls `observePromises(value)` before returning `{ ok: false }` |
| promise observation | `observePromises(value, maxNodes = 1000)` walks up to `maxNodes` objects or arrays by identity through own data descriptors without the call stack (catching any `Proxy` trap throw) and, for every reached value that is a native `Promise` (`instanceof Promise`), calls `Promise.prototype.then.call(v, noop, noop)` inside a `try`/`catch` guard, consuming its rejection whenever attachment succeeds (when a promise carries an own `constructor` or `Symbol.species` getter that throws before reactions attach, the throw is caught and ECMAScript cannot suppress that rejection) |
| canonical JSON and bounds | `toCanonicalJson(value)` serialises a plain JSON value with lexicographically sorted keys (`SD1`), `snapshotJson(value)` freezes a plain copy, and `utf8ByteLength`, `nestingDepth` and `firstUnsafeInteger` (`SAFE_INTEGER_LIMIT`) measure size, depth and safe-integer bounds |
| conformance corpus | `@apnex/shape-check/corpus` exports the dialect's positive and negative conformance cases as data, authored independently of the implementation |

The plain-data reader (`readPlainJson` and `observePromises`) is the load-bearing seam at every plug-in and callback boundary: any component that calls caller-supplied code reads the return value through it before inspecting a single field.

---

## Reference

The sovereign repository `apnex/shape-check` (`@apnex/shape-check`), with its vision in `VISION.md`, its contract in `CONTRACT.md`, and its machine-checked surface in `export-map.json`.

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

- Shapes are closed-record JSON data structures (`additionalProperties: false` on every object) that both sides of a boundary can inspect as data.
- Validation never mutates the caller's object, fills defaults, or coerces types (its only normalisation is `-0` to `0`, matching JSON number semantics, in both `readPlainJson` and `judgeShapeValue`).
- The library must run in any JavaScript runtime with zero runtime-specific dependencies.

**It is the wrong tool when**

| you need | reach elsewhere, because `shape-check` is |
|---|---|
| coercion, default filling, or silent stripping of unknown fields | not a normaliser - it judges the value it was given and refuses unknown fields |
| open-ended schemas, remote `$ref` fetching, or arbitrary code predicates | not a general schema engine - shapes are closed-record data with local `$defs` only |
| storing records, tracking revisions, or ordering writes | not a store - compose it with [`C4`](C4-entity-store.md) |
| CLI flag parsing or environment-variable precedence | not a command parser - reach for [`C9`](C9-operation-command.md) |

---

## Adjustment policy

Internal and sovereign, so a fit gap has somewhere to go.

1. **Record the gap where both sides can see it.** If a project needs a keyword or format the closed-record dialect excludes, record the measured case against `shape-check`'s contract rather than writing a side validator.
2. **Adjust upstream so every consumer gets the same dialect, or keep it in the application's semantic policy.** Domain rules that depend on state (such as whether a name is already taken) belong in the store or application policy, not in the shape dialect.
3. **Never fork.** Two validators that almost agree re-create the drift this component exists to eliminate.

---

## Edges

**Contains** - nine internal units in its anchored core: dialect checker (`shape-document-check`), value judge (`judge-shape-value`, `value-judgement`), verdict builder (`shape-verdict`), JSON Pointer ordering (`json-pointer-order`), URI format checker (`uri-format`), plain-JSON reader and promise observer (`plain-json-value`), canonical JSON serialiser (`canonical-json`), dialect constants (`shape-dialect`), and the conformance corpus (`corpus`).

**Contained-by** - nothing; `shape-check` is a top-level registered component.

**Consumes** - nothing; `shape-check` depends on no other component.

**Consumed-by** - [`C4`](C4-entity-store.md) (`entity-store`), [`C5`](C5-operation-call.md) (`operation-call`), [`C6`](C6-entity-api.md) (`entity-api`), [`C7`](C7-caller-identity.md) (`caller-identity`), [`C8`](C8-operation-proxy.md) (`operation-proxy`), [`C9`](C9-operation-command.md) (`operation-command`), [`C10`](C10-credential-issuer.md) (`credential-issuer`), [`C15`](C15-entity-graph.md) (`entity-graph`), and `zorg`, which use `shape-check` through its declared contract without containing it ([`E5`](../entities/E5-system.md)).
