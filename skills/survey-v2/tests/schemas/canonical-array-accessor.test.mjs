import assert from "node:assert/strict";
import test from "node:test";
import { canonicalize } from "../../source/executables/runtime/lib/canonical.mjs";

test("canonical JSON rejects an array accessor without invoking its getter", () => {
  let invoked = false;
  const value = [null];
  Object.defineProperty(value, "0", {
    enumerable: true,
    get() {
      invoked = true;
      return "hidden";
    }
  });
  assert.throws(() => canonicalize(value), /accessor/);
  assert.equal(invoked, false);
});
