import assert from "node:assert/strict";
import test from "node:test";
import {
  buildRoundOneQuestionProducts,
} from "../../../source/authoring/survey/round-one-questions-authority.mjs";
import {
  roundOneQuestionsAuthorityInputs,
} from "./support.mjs";

test("Option parsing splits only the first exact delimiter and optional instruction remains absent", () => {
  const input = roundOneQuestionsAuthorityInputs();
  input.normalizedValues["q1-options"][0] =
    "Director | Final authority | including later delimiters.";
  const question = buildRoundOneQuestionProducts(input)[0].resource;
  assert.deepEqual(question.spec.response.options[0], {
    id: "a",
    label: "Director",
    meaning: "Final authority | including later delimiters.",
  });
  assert.deepEqual(Object.keys(question.spec.prompt), ["text"]);
});
