import assert from "node:assert/strict";
import test from "node:test";

import {
  verifyCurrentQuestionProjectionRecipeFromSession,
} from "../../../source/authoring/survey/director-question-projection.mjs";
import {
  createSurveyctlHarness,
  executeCommand,
  initializeHarness,
  readSession,
  writeRoundOneFrameInput,
  writeRoundOneQuestionFramesInput,
  writeRoundOneQuestionsInput,
  writeSurveyFrameInput,
} from "../surveyctl-v2/support.mjs";

async function submitIssued(harness, writeInput) {
  const issued = await executeCommand(harness, "next");
  const input = await writeInput(
    harness,
    issued.result,
  );
  const submitted = await executeCommand(
    harness,
    "submit",
    { input },
  );
  assert.equal(submitted.result.kind, "committed");
}

test("the persisted AT05 postimage contains one authenticated Q1 recipe and no delivery state", async (testContext) => {
  const harness = await initializeHarness(
    await createSurveyctlHarness(testContext, {
      slug: "session-at05-postimage",
    }),
  );
  for (const writeInput of [
    writeSurveyFrameInput,
    writeRoundOneFrameInput,
    writeRoundOneQuestionFramesInput,
    writeRoundOneQuestionsInput,
  ]) {
    await submitIssued(harness, writeInput);
  }

  const session = await readSession(harness);
  assert.equal(session.phase, "round_1_q1_ready");
  assert.notEqual(session.pendingProjection, null);
  assert.equal(
    session.pendingProjection.viewKind,
    "question",
  );
  assert.equal(
    session.pendingProjection.unit.questionOrdinal,
    1,
  );
  assert.deepEqual(
    session.pendingProjection.sourceSelections.map(
      ({ role }) => role,
    ),
    [
      "survey-frame",
      "round-frame",
      "question-frame",
      "question",
    ],
  );
  verifyCurrentQuestionProjectionRecipeFromSession(
    session,
  );
  assert.equal(session.outbox, null);
  assert.deepEqual(session.attempts, []);
  assert.deepEqual(session.responses, {});
});
