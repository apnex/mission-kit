import assert from "node:assert/strict";
import test from "node:test";
import {
  buildRoundOneQuestionFrameProducts,
  RoundOneQuestionFramesAuthorityError,
} from "../../../source/authoring/survey/round-one-question-frames-authority.mjs";
import {
  roundOneQuestionFramesAuthorityInputs,
} from "./support.mjs";

test("Round 1 QuestionFrame authority rejects a stale active parent head before producing anything", () => {
  const stale = roundOneQuestionFramesAuthorityInputs();
  stale.workspace.spec.activeHeads.find(
    ({ slot }) => slot === "round-1-frame",
  ).reference = {
    ...stale.references.roundFrame,
    semanticDigest: `sha256:${"f".repeat(64)}`,
  };
  const before = structuredClone(stale);
  assert.throws(
    () => buildRoundOneQuestionFrameProducts(stale),
    (error) => {
      assert.equal(
        error instanceof RoundOneQuestionFramesAuthorityError,
        true,
      );
      assert.equal(error.code, "ROUND_ONE_QUESTION_FRAMES_STALE_PARENT");
      return true;
    },
  );
  assert.deepEqual(stale, before);
});
