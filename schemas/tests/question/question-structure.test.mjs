import assert from "node:assert/strict";
import test from "node:test";
import {
  clone,
  readExample,
  validateQuestionStructure
} from "../support/question-validation.mjs";

test("a closed Kubernetes-shaped Question resource validates", () => {
  const question = readExample("release-strategy.question.json");
  assert.equal(validateQuestionStructure(question), true, JSON.stringify(validateQuestionStructure.errors));
});

test("Question rejects a different API version", () => {
  const question = clone(readExample("release-strategy.question.json"));
  question.apiVersion = "survey.mission-kit/v1alpha1";
  assert.equal(validateQuestionStructure(question), false);
});

test("Question rejects a different resource kind", () => {
  const question = clone(readExample("release-strategy.question.json"));
  question.kind = "SurveyQuestion";
  assert.equal(validateQuestionStructure(question), false);
});

test("Question requires a stable metadata name", () => {
  const question = clone(readExample("release-strategy.question.json"));
  question.metadata.name = "Round 1 / Question 1";
  assert.equal(validateQuestionStructure(question), false);
});

test("Question rejects an unknown root field", () => {
  const question = clone(readExample("release-strategy.question.json"));
  question.status = {};
  assert.equal(validateQuestionStructure(question), false);
});

test("Question rejects an unknown metadata field", () => {
  const question = clone(readExample("release-strategy.question.json"));
  question.metadata.generation = 1;
  assert.equal(validateQuestionStructure(question), false);
});

test("Question rejects an unknown spec field", () => {
  const question = clone(readExample("release-strategy.question.json"));
  question.spec.round = 1;
  assert.equal(validateQuestionStructure(question), false);
});

test("Question requires exact respondent-facing prompt text", () => {
  const question = clone(readExample("release-strategy.question.json"));
  question.spec.prompt.text = "";
  assert.equal(validateQuestionStructure(question), false);
});

test("Question rejects a whitespace-only prompt", () => {
  const question = clone(readExample("release-strategy.question.json"));
  question.spec.prompt.text = "   ";
  assert.equal(validateQuestionStructure(question), false);
});

test("Question rejects a whitespace-only instruction", () => {
  const question = clone(readExample("release-strategy.question.json"));
  question.spec.prompt.instruction = "\t";
  assert.equal(validateQuestionStructure(question), false);
});

test("Question rejects a whitespace-only option label", () => {
  const question = clone(readExample("release-strategy.question.json"));
  question.spec.response.options[0].label = "\t";
  assert.equal(validateQuestionStructure(question), false);
});

test("Question rejects a whitespace-only option meaning", () => {
  const question = clone(readExample("release-strategy.question.json"));
  question.spec.response.options[0].meaning = "\n";
  assert.equal(validateQuestionStructure(question), false);
});
