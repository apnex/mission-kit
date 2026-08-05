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
  "surveyctl submit durably commits the SurveyFrame and validate certifies the persisted replay",
  async (testContext) => {
    const harness = await initializeHarness(
      await createSurveyctlHarness(testContext),
    );
    const issued = await executeCommand(harness, "next");
    const input = await writeSurveyFrameInput(
      harness,
      issued.result,
    );
    const submitted = await executeCommand(
      harness,
      "submit",
      { input },
    );
    assert.equal(submitted.result.kind, "committed");

    const persisted = await readSession(harness);
    assert.equal(persisted.commitRevision, 3);
    assert.equal(
      persisted.authoring.workspace.spec.authoringState,
      "round_1_frame_required",
    );
    assert.equal(
      persisted.authoring.workspace.spec.openAssignment,
      null,
    );

    const validation = await executeCommand(
      harness,
      "validate",
    );
    const view = JSON.parse(validation.output.toString("utf8"));
    assert.equal(view.status, "valid");
    assert.equal(Object.hasOwn(view, "issues"), false);
    assert.equal(
      view.commitRevision,
      persisted.commitRevision,
    );
  },
);
