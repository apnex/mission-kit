import assert from "node:assert/strict";
import test from "node:test";

import {
  IN_MEMORY_STORE_FAULT_POINTS,
} from "../../../source/authoring/adapters/in-memory-store.mjs";
import {
  roundOneFrameValues,
} from "../round-one/support.mjs";
import {
  roundOneQuestionFrameValues,
} from "../round-one-question-frames/support.mjs";
import {
  roundOneQuestionValues,
} from "../round-one-questions/support.mjs";
import {
  beginSurveyAuthoring,
  createLiveSurveyHarness,
  createRoundOneFrameSubmission,
  createRoundOneQuestionFramesSubmission,
  createRoundOneQuestionsSubmission,
  createSurveyFrameSubmission,
  issueRoundOneFrameAssignment,
  issueRoundOneQuestionFramesAssignment,
  issueRoundOneQuestionsAssignment,
  issueSurveyFrameAssignment,
  submitRoundOneFrame,
  submitRoundOneQuestionFrames,
  submitRoundOneQuestions,
  submitSurveyFrame,
} from "./live-support.mjs";

test("an AT05 prepublication fault preserves the exact complete AT04 root", async () => {
  const fault = new Error("AT05 prepublication fault");
  let armed = false;
  const harness = await createLiveSurveyHarness({
    storeId: "survey-v2-profile-at05-prepublish-rollback",
    faultInjector({ point }) {
      if (
        armed &&
        point ===
          IN_MEMORY_STORE_FAULT_POINTS
            .AFTER_PREPARATION_BEFORE_PUBLISH
      ) {
        throw fault;
      }
    },
  });
  await beginSurveyAuthoring(harness);

  let issued = await issueSurveyFrameAssignment(harness);
  await submitSurveyFrame(
    harness,
    issued,
    createSurveyFrameSubmission(harness, issued),
  );
  issued = await issueRoundOneFrameAssignment(harness);
  await submitRoundOneFrame(
    harness,
    issued,
    createRoundOneFrameSubmission(
      harness,
      issued,
      roundOneFrameValues(),
    ),
  );
  issued = await issueRoundOneQuestionFramesAssignment(harness);
  await submitRoundOneQuestionFrames(
    harness,
    issued,
    createRoundOneQuestionFramesSubmission(
      harness,
      issued,
      roundOneQuestionFrameValues(),
    ),
  );
  issued = await issueRoundOneQuestionsAssignment(harness);
  const submission = createRoundOneQuestionsSubmission(
    harness,
    issued,
    roundOneQuestionValues(),
  );
  const before = await harness.coordinator.read(
    harness.storeId,
  );

  armed = true;
  await assert.rejects(
    submitRoundOneQuestions(
      harness,
      issued,
      submission,
    ),
    fault,
  );
  armed = false;

  const after = await harness.coordinator.read(
    harness.storeId,
  );
  assert.deepEqual(after, before);
});
