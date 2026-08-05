import assert from "node:assert/strict";
import test from "node:test";
import {
  createSurveyctlHarness,
  executeCommand,
  initializeHarness,
  readSession,
  writeSurveyFrameInput,
} from "./support.mjs";

test(
  "two concurrent surveyctl submissions produce one commit and never corrupt the session",
  async (testContext) => {
    const harness = await initializeHarness(
      await createSurveyctlHarness(testContext),
    );
    const issued = await executeCommand(harness, "next");
    const input = await writeSurveyFrameInput(
      harness,
      issued.result,
    );
    const revisionBefore = (await readSession(harness))
      .commitRevision;
    const attempts = await Promise.allSettled([
      executeCommand(harness, "submit", { input }),
      executeCommand(harness, "submit", { input }),
    ]);
    const committed = attempts.filter(
      (attempt) =>
        attempt.status === "fulfilled" &&
        attempt.value.result?.kind === "committed",
    );
    const losing = attempts.filter(
      (attempt) =>
        attempt.status === "rejected" ||
        attempt.value.result?.kind !== "committed",
    );
    const persisted = await readSession(harness);

    assert.equal(committed.length, 1);
    assert.equal(losing.length, 1);
    assert.equal(
      persisted.commitRevision,
      revisionBefore + 1,
    );
    assert.equal(
      persisted.authoring.workspace.spec.authoringState,
      "round_1_frame_required",
    );
    const validation = await executeCommand(
      harness,
      "validate",
    );
    assert.equal(
      JSON.parse(validation.output.toString("utf8")).status,
      "valid",
    );
  },
);
