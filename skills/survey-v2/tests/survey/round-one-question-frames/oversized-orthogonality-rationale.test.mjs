import assert from "node:assert/strict";
import test from "node:test";
import {
  buildRoundOneQuestionFrameProducts,
  RoundOneQuestionFramesAuthorityError,
} from "../../../source/authoring/survey/round-one-question-frames-authority.mjs";
import {
  roundOneQuestionFramesAuthorityInputs,
} from "./support.mjs";

test("QuestionFrameSet rejects an oversized aggregate orthogonality rationale", () => {
  const input = roundOneQuestionFramesAuthorityInputs();
  input.normalizedValues["orthogonality-rationale"] = "x".repeat(2001);
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
