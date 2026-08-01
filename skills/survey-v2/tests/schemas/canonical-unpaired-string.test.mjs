import test from "node:test";
import assert from "node:assert/strict";
import { canonicalize } from "../../source/executables/runtime/lib/canonical.mjs";

test("canonical JSON rejects an unpaired surrogate string value.", () => {
  assert.throws(() => canonicalize("\ud800"), /unpaired surrogate/);
});
