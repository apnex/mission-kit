import assert from "node:assert/strict";
import test from "node:test";
import {
  validateContract
} from "./support/contract-validation.mjs";
import {
  profileWithSelector
} from "./support/lifecycle-profile-scenarios.mjs";

test("a workspace resource version can prove only the frozen lifecycle state", async () => {
  const { profile } = await profileWithSelector((selector) => {
    selector.requiredLifecycleState = "active";
  });
  const result = await validateContract("authoring-profile-manifest", profile);
  assert.deepEqual(
    result.semanticIssues.map(({ code }) => code),
    ["CONTEXT_LIFECYCLE_RULE_INVALID"]
  );
});
