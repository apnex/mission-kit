import test from "node:test";
import assert from "node:assert/strict";
import { canonicalize } from "../../source/executables/runtime/lib/canonical.mjs";

test("canonical JSON rejects proxy objects before traversing them.", () => {
  const value = new Proxy({}, {
    ownKeys() {
      throw new Error("proxy trap must not run");
    }
  });
  assert.throws(() => canonicalize(value), /proxy objects/);
});
