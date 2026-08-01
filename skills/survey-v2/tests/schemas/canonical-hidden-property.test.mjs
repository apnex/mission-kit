import test from "node:test";
import assert from "node:assert/strict";
import { canonicalize } from "../../source/executables/runtime/lib/canonical.mjs";

test("canonical JSON rejects non-enumerable object properties.", () => {
  const value = { visible: true };
  Object.defineProperty(value, "hidden", { enumerable: false, value: true });
  assert.throws(() => canonicalize(value), /non-enumerable/);
});
