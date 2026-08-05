import assert from "node:assert/strict";
import test from "node:test";
import {
  buildRoundOneQuestionFrameProducts,
  RoundOneQuestionFramesAuthorityError,
} from "../../../source/authoring/survey/round-one-question-frames-authority.mjs";
import {
  roundOneQuestionFramesAuthorityInputs,
} from "./support.mjs";

test("QuestionFrameSet rejects a blank aggregate coverage rationale", () => {
  const input = roundOneQuestionFramesAuthorityInputs();
  input.normalizedValues["coverage-rationale"] = "   ";
  const before = structuredClone(input);
  assert.throws(
    () => buildRoundOneQuestionFrameProducts(input),
    (error) => {
      assert.equal(
        error instanceof RoundOneQuestionFramesAuthorityError,
        true,
      );
      assert.equal(
        error.code,
        "ROUND_ONE_QUESTION_FRAME_FIELD_INVALID",
      );
      return true;
    },
  );
  assert.deepEqual(input, before);
});
