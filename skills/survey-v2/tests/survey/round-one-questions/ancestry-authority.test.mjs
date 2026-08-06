import assert from "node:assert/strict";
import test from "node:test";
import {
  RoundOneQuestionsAuthorityError,
  buildRoundOneQuestionProducts,
} from "../../../source/authoring/survey/round-one-questions-authority.mjs";
import {
  roundOneQuestionsAuthorityInputs,
} from "./support.mjs";

test("Round 1 Question authority rejects an incomplete active QuestionFrameSet ancestry graph", () => {
  const input = roundOneQuestionsAuthorityInputs();
  const frameSet = input.references.frameSet;
  const questionFrame = input.references.questionFrames[1];
  input.workspace.spec.dependencyEdges =
    input.workspace.spec.dependencyEdges.filter((edge) =>
      !(
        edge.relation === "frames" &&
        edge.from.name === frameSet.name &&
        edge.to.name === questionFrame.name
      )
    );
  assert.throws(
    () => buildRoundOneQuestionProducts(input),
    (error) =>
      error instanceof RoundOneQuestionsAuthorityError &&
      error.code === "ROUND_ONE_QUESTIONS_ANCESTRY_INVALID",
  );
});
