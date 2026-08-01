import test from "node:test";
import assert from "node:assert/strict";
import { canonicalize } from "../../source/executables/runtime/lib/canonical.mjs";

test("canonical JSON rejects an object key that is not a Unicode scalar sequence.", () => {
  assert.throws(() => canonicalize({ ["\udc00"]: "value" }), /unpaired surrogate/);
});
