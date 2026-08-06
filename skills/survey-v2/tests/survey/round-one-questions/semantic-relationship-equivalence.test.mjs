import assert from "node:assert/strict";
import test from "node:test";
import {
  resourceReferenceFrom,
} from "../../../source/authoring/kernel/digests.mjs";
import {
  createSurveyResourceResolver,
  validateSurveyResourceSemantics,
} from "../../../source/authoring/survey/resource-semantics.mjs";
import {
  buildRoundOneQuestionProducts,
} from "../../../source/authoring/survey/round-one-questions-authority.mjs";
import {
  roundOneQuestionsAuthorityInputs,
} from "./support.mjs";

test("Survey binding semantics prove exact relationship graph equivalence with neutral Question constraints", () => {
  const input = roundOneQuestionsAuthorityInputs();
  const products = buildRoundOneQuestionProducts(input);
  const productResources = products.map(({ resource }) => resource);
  const inventory = [
    input.resources.round,
    ...input.resources.questionFrames,
    input.resources.frameSet,
    ...productResources,
  ];
  const resolver = createSurveyResourceResolver(inventory);
  for (const binding of productResources.slice(3, 6)) {
    assert.deepEqual(
      validateSurveyResourceSemantics(binding, { resolveReference: resolver }),
      [],
    );
  }

  const changedQuestion = structuredClone(productResources[2]);
  changedQuestion.spec.response.constraints = [];
  const changedBinding = structuredClone(productResources[5]);
  changedBinding.spec.questionRef = resourceReferenceFrom(changedQuestion);
  const divergentResolver = createSurveyResourceResolver([
    input.resources.round,
    ...input.resources.questionFrames,
    input.resources.frameSet,
    ...productResources.slice(0, 2),
    changedQuestion,
    ...productResources.slice(3, 5),
    changedBinding,
  ]);
  const issues = validateSurveyResourceSemantics(changedBinding, {
    resolveReference: divergentResolver,
  });
  assert.ok(issues.some(({ code }) =>
    code === "BINDING_QUESTION_CONSTRAINT_DIVERGENCE"
  ));
});
