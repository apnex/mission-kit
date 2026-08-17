import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  lintSchema,
  validateSchemaInstance,
} from "../../source/executables/shared/schema-validator.mjs";
import {
  validateJsonSchema,
} from "../../source/executables/engine/schema-validator.mjs";
import { packageRoot } from "../helpers/package-root.mjs";

const CHILD_MAPS = new Set([
  "$defs",
  "dependentSchemas",
  "patternProperties",
  "properties",
]);
const CHILD_ARRAYS = new Set(["allOf", "anyOf", "oneOf", "prefixItems"]);
const CHILD_SCHEMAS = new Set([
  "additionalProperties",
  "contains",
  "else",
  "if",
  "items",
  "not",
  "propertyNames",
  "then",
]);

function schemaKeywords(schema, target = new Set()) {
  if (schema === true || schema === false) return target;
  for (const [key, value] of Object.entries(schema)) {
    target.add(key);
    if (CHILD_MAPS.has(key)) {
      Object.values(value).forEach((child) => schemaKeywords(child, target));
    } else if (CHILD_ARRAYS.has(key)) {
      value.forEach((child) => schemaKeywords(child, target));
    } else if (CHILD_SCHEMAS.has(key) && typeof value === "object") {
      schemaKeywords(value, target);
    }
  }
  return target;
}

test("compiler and runtime share one audited validator result for every emitted keyword and hostile data view", async () => {
  const cases = [
    [{ type: "string" }, "value", 1],
    [{ const: "fixed" }, "fixed", "wrong"],
    [{ enum: ["a", "b"] }, "a", "c"],
    [
      {
        type: "object",
        properties: { value: { type: "string" } },
        required: ["value"],
        additionalProperties: false,
      },
      { value: "ok" },
      { value: "ok", extra: true },
    ],
    [
      { allOf: [{ type: "number" }, { minimum: 0 }] },
      1,
      -1,
    ],
    [
      { oneOf: [{ const: "a" }, { const: "b" }] },
      "a",
      "c",
    ],
    [
      { anyOf: [{ type: "string" }, { type: "number" }] },
      "a",
      false,
    ],
    [
      { if: { type: "number" }, then: { minimum: 1 } },
      2,
      0,
    ],
    [
      { type: "array", items: { type: "string" } },
      ["a"],
      [1],
    ],
    [
      {
        type: "array",
        prefixItems: [{ const: "a" }],
        items: false,
      },
      ["a"],
      ["b"],
    ],
    [
      {
        type: "array",
        minItems: 1,
        maxItems: 2,
        uniqueItems: true,
      },
      ["a", "b"],
      ["a", "a"],
    ],
    [
      {
        type: "string",
        minLength: 2,
        maxLength: 2,
        pattern: "^[a-z]+$",
      },
      "ab",
      "1",
    ],
    [
      { type: "string", format: "date-time" },
      "2026-01-01T00:00:00Z",
      "not-a-date",
    ],
    [
      { type: "number", minimum: 1, maximum: 2 },
      1.5,
      3,
    ],
    [
      { type: "number", exclusiveMinimum: 1, maximum: 2 },
      1.5,
      1,
    ],
    [
      {
        $defs: { positive: { type: "number", minimum: 1 } },
        $ref: "#/$defs/positive",
      },
      1,
      0,
    ],
  ];
  for (const [schema, positive, negative] of cases) {
    lintSchema(schema);
    assert.equal(validateSchemaInstance(schema, positive).length, 0);
    assert.equal(validateJsonSchema(positive, schema).valid, true);
    assert.notEqual(validateSchemaInstance(schema, negative).length, 0);
    assert.equal(validateJsonSchema(negative, schema).valid, false);
  }

  const catalog = JSON.parse(
    await readFile(
      join(packageRoot, "source/manifests/schema-catalog.json"),
      "utf8",
    ),
  );
  const emitted = new Set();
  for (const filename of catalog.schemas) {
    const schema = JSON.parse(
      await readFile(join(packageRoot, "schemas", filename), "utf8"),
    );
    lintSchema(schema, filename);
    schemaKeywords(schema, emitted);
  }
  const exercised = new Set();
  cases.forEach(([schema]) => schemaKeywords(schema, exercised));
  for (const keyword of emitted) {
    if (!["$id", "$schema", "title"].includes(keyword)) {
      assert.equal(
        exercised.has(keyword),
        true,
        `emitted keyword has no parity vector: ${keyword}`,
      );
    }
  }

  const unsupported = { type: "string", unevaluatedProperties: false };
  assert.throws(() => lintSchema(unsupported), /unsupported schema keyword/u);
  assert.throws(
    () => validateJsonSchema("value", unsupported),
    /supported-keyword audit/u,
  );

  for (const validate of [
    (instance) => validateSchemaInstance({ type: "object", additionalProperties: true }, instance),
    (instance) =>
      validateJsonSchema(instance, {
        type: "object",
        additionalProperties: true,
      }),
  ]) {
    let getterCalls = 0;
    const hostile = {};
    Object.defineProperty(hostile, "value", {
      enumerable: true,
      get() {
        getterCalls += 1;
        return "attacker-controlled";
      },
    });
    assert.throws(() => validate(hostile), /inert|accessor/u);
    assert.equal(getterCalls, 0);
  }
});
