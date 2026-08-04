import assert from "node:assert/strict";
import test from "node:test";
import {
  validateContract
} from "./support/contract-validation.mjs";
import {
  profileWithSelector
} from "./support/lifecycle-profile-scenarios.mjs";

test("a context selector accepts an explicit non-root JSON Pointer lifecycle rule", async () => {
  const { profile } = await profileWithSelector((selector) => {
    selector.lifecycleRule = {
      mode: "json-pointer-state",
      path: "/status/phase"
    };
  });
  const result = await validateContract("authoring-profile-manifest", profile);
  assert.equal(result.valid, true, JSON.stringify(result));
});
