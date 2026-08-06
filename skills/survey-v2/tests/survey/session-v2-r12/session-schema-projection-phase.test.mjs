import assert from "node:assert/strict";
import test from "node:test";
import {
  deriveCurrentQuestionProjectionRecipe,
} from "../../../source/authoring/survey/director-question-projection.mjs";
import {
  makeSession,
  matrixSession,
} from "../../fixtures/survey/session-v2/session-factory.mjs";
import {
  validateSessionStructure,
} from "../../survey-contracts/session/support/session-validation.mjs";
import {
  projectionFixtureSources,
} from "./projection-support.mjs";

test("the source session schema admits a recipe only at round_1_q1_ready", async () => {
  const recipe = deriveCurrentQuestionProjectionRecipe(
    projectionFixtureSources(),
  );
  const beforeT03 = makeSession();
  assert.equal(
    (await validateSessionStructure(beforeT03)).valid,
    true,
  );
  beforeT03.pendingProjection = recipe;
  assert.equal(
    (await validateSessionStructure(beforeT03)).valid,
    false,
  );

  const q1Ready = matrixSession({
    authoringState: "waiting_for_round_1_responses",
    phaseState: "round_1_q1_ready",
  });
  assert.equal(
    (await validateSessionStructure(q1Ready)).valid,
    false,
    "Q1-ready cannot retain the pre-T03 null projection",
  );
  q1Ready.pendingProjection = recipe;
  assert.equal(
    (await validateSessionStructure(q1Ready)).valid,
    true,
  );
});
