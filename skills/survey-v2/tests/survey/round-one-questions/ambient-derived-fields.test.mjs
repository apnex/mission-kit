import assert from "node:assert/strict";
import test from "node:test";
import {
  RoundOneQuestionsAuthorityError,
  buildRoundOneQuestionProducts,
} from "../../../source/authoring/survey/round-one-questions-authority.mjs";
import {
  roundOneQuestionsAuthorityInputs,
} from "./support.mjs";

test("Round 1 Question authority rejects producer-authored identity and derived fields", () => {
  const input = roundOneQuestionsAuthorityInputs();
  input.normalizedValues["q1-option-ids"] = ["owned", "by", "producer"];
  assert.throws(
    () => buildRoundOneQuestionProducts(input),
    (error) =>
      error instanceof RoundOneQuestionsAuthorityError &&
      error.code === "ROUND_ONE_QUESTIONS_VALUES_INVALID",
  );
});
