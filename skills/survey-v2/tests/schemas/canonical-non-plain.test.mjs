import test from "node:test";
import assert from "node:assert/strict";
import { canonicalize } from "../../source/executables/runtime/lib/canonical.mjs";

test("canonical JSON rejects non-plain objects.", () => {
  assert.throws(() => canonicalize(new Date(0)), /non-plain objects/);
});
