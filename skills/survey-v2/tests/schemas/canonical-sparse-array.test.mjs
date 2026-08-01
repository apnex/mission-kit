import test from "node:test";
import assert from "node:assert/strict";
import { canonicalize } from "../../source/executables/runtime/lib/canonical.mjs";

test("canonical JSON rejects sparse arrays.", () => {
  const value = [];
  value.length = 1;
  assert.throws(() => canonicalize(value), /sparse arrays/);
});
