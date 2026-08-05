import assert from "node:assert/strict";
import test from "node:test";
import {
  buildRoundOneQuestionFrameProducts,
  RoundOneQuestionFramesAuthorityError,
} from "../../../source/authoring/survey/round-one-question-frames-authority.mjs";
import {
  roundOneQuestionFramesAuthorityInputs,
} from "./support.mjs";

test("QuestionFrame authority rejects producer injection of derived references, ordinals, or Round-1 relation semantics", () => {
  for (const field of ["roundRef", "roundOrdinal", "round1Relation"]) {
    const input = roundOneQuestionFramesAuthorityInputs();
    input.normalizedValues[field] = "producer-injected";
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
          "ROUND_ONE_QUESTION_FRAMES_VALUES_INVALID",
        );
        return true;
      },
    );
    assert.deepEqual(input, before, field);
  }
});
