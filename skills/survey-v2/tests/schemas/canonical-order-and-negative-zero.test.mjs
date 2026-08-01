import test from "node:test";
import assert from "node:assert/strict";
import { canonicalize } from "../../source/executables/runtime/lib/canonical.mjs";

test("canonical JSON sorts object keys and normalizes negative zero.", () => {
  assert.equal(canonicalize({ z: -0, a: 1 }), '{"a":1,"z":0}');
});
