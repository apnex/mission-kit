import test from "node:test";
import assert from "node:assert/strict";
import { canonicalize } from "../../source/executables/runtime/lib/canonical.mjs";

test("canonical JSON rejects cyclic input.", () => {
  const value = {};
  value.self = value;
  assert.throws(() => canonicalize(value), /cyclic objects/);
});
