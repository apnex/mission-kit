import assert from "node:assert/strict";
import test from "node:test";
import {
  buildRoundOneQuestionFrameProducts,
} from "../../../source/authoring/survey/round-one-question-frames-authority.mjs";
import {
  roundOneQuestionFramesAuthorityInputs,
} from "./support.mjs";

test("Round 1 QuestionFrame authority rejects each misdirected authenticated R10 parent edge", () => {
  for (const [relation, destination] of [
    ["derived-from", "survey"],
    ["belongs-to", "surveyFrame"],
    ["frames", "surveyFrame"],
    ["parent-frame", "survey"],
  ]) {
    const input = roundOneQuestionFramesAuthorityInputs();
    input.workspace.spec.dependencyEdges.find(
      (edge) => edge.relation === relation,
    ).to = input.references[destination];
    const before = structuredClone(input);
    assert.throws(
      () => buildRoundOneQuestionFrameProducts(input),
      (error) => {
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
