import assert from "node:assert/strict";
import test from "node:test";
import * as kernelCanonical from "../../../source/authoring/kernel/canonical.mjs";
import * as legacyCanonical from "../../../source/executables/runtime/lib/canonical.mjs";

test("the historical runtime path is an identity-preserving compatibility re-export", () => {
  assert.deepEqual(
    Object.keys(legacyCanonical).sort(),
    Object.keys(kernelCanonical).sort()
  );
  for (const name of Object.keys(kernelCanonical)) {
    assert.equal(legacyCanonical[name], kernelCanonical[name], name);
  }
});
