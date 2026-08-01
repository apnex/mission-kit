import test from "node:test";
import assert from "node:assert/strict";
import { canonicalize } from "../../source/executables/runtime/lib/canonical.mjs";

test("canonical JSON rejects an accessor without invoking its getter.", () => {
  let invoked = false;
  const value = {};
  Object.defineProperty(value, "changing", {
    enumerable: true,
    get() {
      invoked = true;
      return Math.random();
    }
  });
  assert.throws(() => canonicalize(value), /accessor/);
  assert.equal(invoked, false);
});
