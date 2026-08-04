import assert from "node:assert/strict";
import test from "node:test";
import {
  validateChoiceResponseSemantics,
  validateQuestionSemantics
} from "../../question/v1alpha1/question.validator.mjs";
import {
  clone,
  readExample,
  validateQuestionStructure
} from "../support/question-validation.mjs";

function issueCodes(question) {
  assert.equal(validateQuestionStructure(question), true, JSON.stringify(validateQuestionStructure.errors));
  return validateQuestionSemantics(question).map((issue) => issue.code);
}

test("valid Choice resources have no semantic violations", () => {
  assert.deepEqual(issueCodes(readExample("release-strategy.question.json")), []);
  assert.deepEqual(issueCodes(readExample("service-placement.question.json")), []);
});

test("Choice semantic validation reports paths relative to its sovereign contract", () => {
  const question = clone(readExample("release-strategy.question.json"));
  question.spec.response.options[1].id = question.spec.response.options[0].id;
  const [responseIssue] = validateChoiceResponseSemantics(question.spec.response);
  const [questionIssue] = validateQuestionSemantics(question);

  assert.equal(responseIssue.path, "/options/1/id");
  assert.equal(questionIssue.path, "/spec/response/options/1/id");
});

test("semantic validation rejects duplicate option IDs", () => {
  const question = clone(readExample("release-strategy.question.json"));
  question.spec.response.options[1].id = question.spec.response.options[0].id;
  assert.deepEqual(issueCodes(question), ["DUPLICATE_OPTION_ID"]);
});

test("semantic validation rejects an inverted cardinality range", () => {
  const question = clone(readExample("service-placement.question.json"));
  question.spec.response.cardinality.minimum = 3;
  question.spec.response.cardinality.maximum = 2;
  assert.deepEqual(issueCodes(question), ["CARDINALITY_RANGE_INVERTED"]);
});

test("semantic validation rejects maximum cardinality above option count", () => {
  const question = clone(readExample("release-strategy.question.json"));
  question.spec.response.cardinality.maximum = 4;
  assert.deepEqual(issueCodes(question), ["CARDINALITY_EXCEEDS_OPTIONS"]);
});

test("semantic validation rejects redundant constraints on a single-choice question", () => {
  const question = clone(readExample("release-strategy.question.json"));
  question.spec.response.constraints.push({
    type: "MutuallyExclusive",
    optionIds: [
      "rolling",
      "blue-green"
    ]
  });
  assert.deepEqual(issueCodes(question), ["REDUNDANT_SINGLE_CHOICE_CONSTRAINT"]);
});

test("semantic validation rejects constraint references to absent options", () => {
  const question = clone(readExample("service-placement.question.json"));
  question.spec.response.constraints[0].optionIds[1] = "not-declared";
  assert.deepEqual(issueCodes(question), ["UNKNOWN_CONSTRAINT_OPTION"]);
});

test("semantic validation rejects equivalent duplicate constraints", () => {
  const question = clone(readExample("service-placement.question.json"));
  question.spec.response.constraints.push({
    type: "MutuallyExclusive",
    optionIds: [
      "multi-region-active",
      "single-region-only"
    ]
  });
  assert.deepEqual(issueCodes(question), ["DUPLICATE_CONSTRAINT"]);
});

test("semantic validation accepts a constrained Choice with a possible minimum selection", () => {
  const question = clone(readExample("service-placement.question.json"));
  question.spec.response.cardinality.minimum = 2;
  assert.deepEqual(issueCodes(question), []);
});

test("semantic validation rejects a Choice with no possible answer", () => {
  const question = clone(readExample("service-placement.question.json"));
  question.spec.response.cardinality.minimum = 2;
  question.spec.response.cardinality.maximum = 2;
  question.spec.response.constraints = [{
    type: "MutuallyExclusive",
    optionIds: [
      "single-region-only",
      "multi-region-active",
      "edge"
    ]
  }];
  assert.deepEqual(issueCodes(question), ["UNSATISFIABLE_CHOICE"]);
});
