import assert from "node:assert/strict";
import test from "node:test";
import {
  createSurveyctlHarness,
  initializeHarness,
  readSession,
} from "./support.mjs";

test(
  "surveyctl init reaches exactly the active SurveyFrame-required postcondition",
  async (testContext) => {
    const harness = await initializeHarness(
      await createSurveyctlHarness(testContext),
    );
    const session = await readSession(harness);

    assert.equal(session.runtimeStatus, "active");
    assert.equal(session.phase, "round_1_drafting");
    assert.equal(session.commitRevision, 1);
    assert.equal(session.journal.length, 1);
    assert.equal(
      session.authoring.workspace.spec.authoringState,
      "survey_frame_required",
    );
    assert.equal(
      session.authoring.workspace.spec.openAssignment,
      null,
    );
    assert.equal(harness.initialized.state.pending, null);
  },
);
