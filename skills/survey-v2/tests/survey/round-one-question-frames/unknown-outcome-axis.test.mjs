import assert from "node:assert/strict";
import test from "node:test";
import {
  buildRoundOneQuestionFrameProducts,
  RoundOneQuestionFramesAuthorityError,
} from "../../../source/authoring/survey/round-one-question-frames-authority.mjs";
import {
  roundOneQuestionFramesAuthorityInputs,
} from "./support.mjs";

test("Round 1 QuestionFrame authority rejects an anchor outside the frozen Survey outcome axes", () => {
  const input = roundOneQuestionFramesAuthorityInputs();
  input.normalizedValues["q2-outcome-axis-anchors"] = [
    "unfrozen-axis | evidence about an invented outcome axis",
  ];
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
        "ROUND_ONE_QUESTION_FRAME_AXIS_UNKNOWN",
      );
      return true;
    },
  );
  assert.deepEqual(input, before);
});
