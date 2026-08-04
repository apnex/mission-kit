import assert from "node:assert/strict";
import test from "node:test";
import {
  validateContract
} from "./support/contract-validation.mjs";
import {
  profileWithSelector
} from "./support/lifecycle-profile-scenarios.mjs";

test("an event input selector carries the same closed lifecycle rule authority", async () => {
  const { profile } = await profileWithSelector((_selector, value) => {
    value.spec.transitionBindings[1].inputSelectors = [{
      ordinal: 1,
      role: "runtime-input",
      resourceType: {
        apiVersion: "runtime.example/v1alpha1",
        kind: "RuntimeArtifact"
      },
      cardinality: { min: 1, max: 1 },
      requiredLifecycleState: "sealed",
      lifecycleRule: {
        mode: "json-pointer-state",
        path: "/status/phase"
      },
      selection: {
        mode: "event-input",
        inputKey: "runtime"
      }
    }];
  });
  const result = await validateContract("authoring-profile-manifest", profile);
  assert.equal(result.valid, true, JSON.stringify(result));
});
