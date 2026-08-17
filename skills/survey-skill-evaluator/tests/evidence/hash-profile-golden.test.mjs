import test from "node:test";
import assert from "node:assert/strict";
import {
  HASH_PROFILE_ID,
  canonicalize,
  hashCanonical,
} from "../../source/executables/engine/index.mjs";

test("semantic hashing is canonical, framed, and domain separated", () => {
  assert.equal(HASH_PROFILE_ID, "survey-evaluator-sha256-jcs-v1");
  assert.equal(canonicalize({ z: -0, a: "é" }), '{"a":"é","z":0}');
  assert.equal(
    hashCanonical("fixture/a", { b: 2, a: 1 }),
    hashCanonical("fixture/a", { a: 1, b: 2 }),
  );
  assert.notEqual(
    hashCanonical("fixture/a", { a: 1 }),
    hashCanonical("fixture/b", { a: 1 }),
  );
});
