import assert from "node:assert/strict";
import test from "node:test";
import {
  buildRoundOneQuestionFrameProducts,
  RoundOneQuestionFramesAuthorityError,
} from "../../../source/authoring/survey/round-one-question-frames-authority.mjs";
import {
  roundOneQuestionFramesAuthorityInputs,
} from "./support.mjs";

test("Round 1 QuestionFrame authority rejects each missing authenticated R10 parent edge", () => {
  for (const relation of [
    "derived-from",
    "belongs-to",
    "frames",
    "parent-frame",
  ]) {
    const input = roundOneQuestionFramesAuthorityInputs();
    input.workspace.spec.dependencyEdges =
      input.workspace.spec.dependencyEdges.filter(
        (edge) => edge.relation !== relation,
      );
    const before = structuredClone(input);
    assert.throws(
      () => buildRoundOneQuestionFrameProducts(input),
      (error) => {
        assert.equal(
          error instanceof RoundOneQuestionFramesAuthorityError,
          true,
          relation,
        );
        assert.equal(
          error.code,
          "ROUND_ONE_QUESTION_FRAMES_ANCESTRY_INVALID",
          relation,
        );
        return true;
      },
    );
    assert.deepEqual(input, before, relation);
  }
});
