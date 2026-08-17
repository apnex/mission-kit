import test from "node:test";
import assert from "node:assert/strict";
import { parseStrictJson, ValidationError } from "../../source/executables/engine/index.mjs";

test("strict JSON rejects a duplicate object key", () => {
  assert.throws(
    () => parseStrictJson('{"a":1,"a":2}'),
    (error) => error instanceof ValidationError && /Duplicate/.test(error.message),
  );
});
