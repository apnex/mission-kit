import assert from "node:assert/strict";
import test from "node:test";
import {
  resourceReferenceFrom,
  resourceSemanticDigest
} from "../../../source/authoring/kernel/digests.mjs";
import {
  buildSurveyPolicySnapshot
} from "../../../source/authoring/survey/survey-policy-snapshot.mjs";
import {
  assertSurveyPolicyValid,
  digest,
  loadProfile,
  trustedPolicyInput
} from "./support.mjs";

test("explicit trusted pins deterministically build the fixed immutable SurveyPolicySnapshot", async () => {
  const profile = await loadProfile();
  const input = trustedPolicyInput(profile);
  const before = structuredClone(input);
  const first = buildSurveyPolicySnapshot(input);
  const repeated = buildSurveyPolicySnapshot(input);

  assert.deepEqual(input, before);
  assert.deepEqual(repeated, first);
  assert.notEqual(repeated, first);
  assert.deepEqual(first.spec.profileRef, resourceReferenceFrom(profile));
  assert.deepEqual(first.spec.geometry, {
    rounds: 2,
    questionsPerRound: 3,
    totalQuestions: 6,
    choiceOptions: {
      minimum: 3,
      maximum: 4
    }
  });
  assert.deepEqual(first.spec.disclosure, {
    mode: "single-current-question",
    siblingQuestionFramesVisible: false,
    futureQuestionsVisible: false,
    interimInterpretationVisible: false
  });
  assert.deepEqual(
    first.spec.validation.schemaBindings,
    input.schemaBindings
  );
  assert.deepEqual(
    first.spec.validation.validatorBindings,
    input.validatorBindings
  );
  assert.deepEqual(
    first.spec.contextSelection.selectors,
    input.selectorBindings
  );
  assert.equal(
    first.metadata.name,
    `survey-policy-${resourceSemanticDigest(first).slice("sha256:".length)}`
  );
  assert.equal(Object.isFrozen(first), true);
  assert.equal(Object.isFrozen(first.spec.contextSelection.selectors), true);
  assertSurveyPolicyValid(first, profile);

  const changedInput = trustedPolicyInput(profile);
  changedInput.selectorBindings[0].digest = digest("a");
  const changed = buildSurveyPolicySnapshot(changedInput);
  assert.notEqual(
    resourceSemanticDigest(changed),
    resourceSemanticDigest(first)
  );
  assert.notEqual(changed.metadata.name, first.metadata.name);
});
