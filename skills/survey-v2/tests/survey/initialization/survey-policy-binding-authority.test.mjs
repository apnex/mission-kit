import assert from "node:assert/strict";
import test from "node:test";
import {
  buildSurveyPolicySnapshot
} from "../../../source/authoring/survey/survey-policy-snapshot.mjs";
import {
  digest,
  loadProfile,
  trustedPolicyInput
} from "./support.mjs";

test("Survey policy construction rejects ambient or invalid trusted binding authority", async () => {
  const profile = await loadProfile();
  const ambientInput = {
    ...trustedPolicyInput(profile),
    resourceName: "caller-selected"
  };
  const invalidProfile = structuredClone(profile);
  invalidProfile.spec.profileDigest = digest("0");
  const invalidBinding = trustedPolicyInput(profile);
  invalidBinding.schemaBindings[0].resourceType = {
    apiVersion: "attacker.example/v1",
    kind: "Injected"
  };
  const duplicateBinding = trustedPolicyInput(profile);
  duplicateBinding.validatorBindings[1].id =
    duplicateBinding.validatorBindings[0].id;
  const invalidDigest = trustedPolicyInput(profile);
  invalidDigest.selectorBindings[0].digest = "sha256:not-a-digest";
  const ambientArray = trustedPolicyInput(profile);
  ambientArray.schemaBindings.injected = true;
  const rejected = [
    ambientInput,
    trustedPolicyInput(invalidProfile),
    { ...trustedPolicyInput(profile), schemaBindings: [] },
    { ...trustedPolicyInput(profile), validatorBindings: [] },
    { ...trustedPolicyInput(profile), selectorBindings: [] },
    invalidBinding,
    duplicateBinding,
    invalidDigest,
    ambientArray
  ];

  for (const candidate of rejected) {
    assert.throws(() => buildSurveyPolicySnapshot(candidate));
  }
});
