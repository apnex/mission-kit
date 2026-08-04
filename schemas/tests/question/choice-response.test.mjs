import assert from "node:assert/strict";
import test from "node:test";
import {
  clone,
  readExample,
  validateQuestionStructure
} from "../support/question-validation.mjs";

test("Choice supports one permitted selection", () => {
  const question = readExample("release-strategy.question.json");
  assert.equal(question.spec.response.cardinality.maximum, 1);
  assert.equal(validateQuestionStructure(question), true, JSON.stringify(validateQuestionStructure.errors));
});

test("Choice supports multiple selections and explicit incompatibility", () => {
  const question = readExample("service-placement.question.json");
  assert.equal(question.spec.response.cardinality.maximum, 2);
  assert.deepEqual(question.spec.response.constraints[0].optionIds, [
    "single-region-only",
    "multi-region-active"
  ]);
  assert.equal(validateQuestionStructure(question), true, JSON.stringify(validateQuestionStructure.errors));
});

test("Choice requires explicit label and meaning for every option", () => {
  const question = clone(readExample("release-strategy.question.json"));
  delete question.spec.response.options[0].meaning;
  assert.equal(validateQuestionStructure(question), false);
});

test("Choice requires a positive selection cardinality", () => {
  const question = clone(readExample("release-strategy.question.json"));
  question.spec.response.cardinality.minimum = 0;
  assert.equal(validateQuestionStructure(question), false);
});

test("Choice requires at least two alternatives", () => {
  const question = clone(readExample("release-strategy.question.json"));
  question.spec.response.options = [question.spec.response.options[0]];
  assert.equal(validateQuestionStructure(question), false);
});

test("Choice bounds an immediately presented answer set to sixteen alternatives", () => {
  const question = clone(readExample("release-strategy.question.json"));
  const template = question.spec.response.options[0];
  question.spec.response.options = Array.from({ length: 17 }, (_, index) => ({
    ...template,
    id: `option-${index + 1}`,
    label: `Option ${index + 1}`,
    meaning: `Meaning ${index + 1}`
  }));
  assert.equal(validateQuestionStructure(question), false);
});

test("Choice rejects undeclared constraint types", () => {
  const question = clone(readExample("service-placement.question.json"));
  question.spec.response.constraints[0].type = "PreferredTogether";
  assert.equal(validateQuestionStructure(question), false);
});

test("Choice rejects unknown fields instead of treating them as extensions", () => {
  const question = clone(readExample("release-strategy.question.json"));
  question.spec.response.options[0].score = 10;
  assert.equal(validateQuestionStructure(question), false);
});

test("Choice rejects an unknown response field", () => {
  const question = clone(readExample("release-strategy.question.json"));
  question.spec.response.shuffle = true;
  assert.equal(validateQuestionStructure(question), false);
});

test("Choice rejects an unknown constraint field", () => {
  const question = clone(readExample("service-placement.question.json"));
  question.spec.response.constraints[0].rationale = "These modes cannot coexist.";
  assert.equal(validateQuestionStructure(question), false);
});
