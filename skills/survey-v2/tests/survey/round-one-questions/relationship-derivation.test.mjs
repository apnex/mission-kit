import assert from "node:assert/strict";
import test from "node:test";
import {
  roundOneQuestionProducts,
} from "./support.mjs";

test("Composable exclusive and mixed relationships derive exact neutral Choice constraints", () => {
  const products = roundOneQuestionProducts();
  const questions = products.slice(0, 3).map(({ resource }) => resource);
  const bindings = products.slice(3, 6).map(({ resource }) => resource);
  assert.deepEqual(
    questions.map((question) =>
      question.spec.response.options.map(({ id }) => id)
    ),
    [["a", "b", "c"], ["a", "b", "c", "d"], ["a", "b", "c", "d"]],
  );
  assert.deepEqual(questions[0].spec.response.constraints, []);
  assert.deepEqual(bindings[0].spec.incompatibilities, []);
  assert.equal(bindings[0].spec.optionRelationship, "composable");
  assert.deepEqual(questions[1].spec.response.constraints, [{
    type: "MutuallyExclusive",
    optionIds: ["a", "b", "c", "d"],
  }]);
  assert.deepEqual(bindings[1].spec.incompatibilities, []);
  assert.equal(bindings[1].spec.optionRelationship, "exclusive");
  assert.deepEqual(bindings[2].spec.incompatibilities, [
    ["a", "c"],
    ["b", "d"],
  ]);
  assert.deepEqual(questions[2].spec.response.constraints, [
    { type: "MutuallyExclusive", optionIds: ["a", "c"] },
    { type: "MutuallyExclusive", optionIds: ["b", "d"] },
  ]);
  assert.equal(bindings[2].spec.optionRelationship, "mixed");
  questions.forEach((question) => {
    assert.deepEqual(question.spec.response.cardinality, {
      minimum: 1,
      maximum: question.spec.response.options.length,
    });
  });
});
