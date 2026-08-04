import assert from "node:assert/strict";
import test from "node:test";
import {
  validateContract
} from "./support/contract-validation.mjs";
import {
  profileWithSelector
} from "./support/lifecycle-profile-scenarios.mjs";

test("a workspace-version lifecycle rule rejects fields from the pointer branch", async () => {
  const { profile } = await profileWithSelector((selector) => {
    selector.lifecycleRule.path = "/status/phase";
  });
  const result = await validateContract("authoring-profile-manifest", profile);
  assert.equal(result.valid, false);
  assert.notEqual(result.structuralErrors.length, 0);
});
