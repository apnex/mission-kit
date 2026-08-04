import assert from "node:assert/strict";
import test from "node:test";
import {
  validateContract
} from "./support/contract-validation.mjs";
import {
  profileWithSelector
} from "./support/lifecycle-profile-scenarios.mjs";

test("a context selector rejects missing lifecycle rule authority", async () => {
  const { profile } = await profileWithSelector((selector) => {
    delete selector.lifecycleRule;
  });
  const result = await validateContract("authoring-profile-manifest", profile);
  assert.equal(result.valid, false);
  assert.notEqual(result.structuralErrors.length, 0);
});
