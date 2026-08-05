import assert from "node:assert/strict";
import test from "node:test";
import {
  buildRoundOneQuestionFrameProducts,
  RoundOneQuestionFramesAuthorityError,
} from "../../../source/authoring/survey/round-one-question-frames-authority.mjs";
import {
  roundOneQuestionFramesAuthorityInputs,
} from "./support.mjs";

test("Round 1 QuestionFrame authority rejects each wrong active parent head without mutating input", () => {
  for (const slot of ["survey-frame", "survey", "round-1-frame"]) {
    const input = roundOneQuestionFramesAuthorityInputs();
    const head = input.workspace.spec.activeHeads.find(
      (candidate) => candidate.slot === slot,
    );
    head.reference = {
      ...head.reference,
      semanticDigest: `sha256:${"e".repeat(64)}`,
    };
    const before = structuredClone(input);
    assert.throws(
      () => buildRoundOneQuestionFrameProducts(input),
      RoundOneQuestionFramesAuthorityError,
      slot,
    );
    assert.deepEqual(input, before, slot);
  }
  const wrongRound = roundOneQuestionFramesAuthorityInputs();
  wrongRound.workspace.spec.activeHeads.find(
    ({ slot }) => slot === "round-1",
  ).reference.kind = "Survey";
  const before = structuredClone(wrongRound);
  assert.throws(
    () => buildRoundOneQuestionFrameProducts(wrongRound),
    (error) => {
      assert.equal(error.code, "ROUND_ONE_QUESTION_FRAMES_ROUND_INVALID");
      return true;
    },
  );
  assert.deepEqual(wrongRound, before);
});
