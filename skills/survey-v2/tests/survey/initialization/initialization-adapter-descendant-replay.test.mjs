import assert from "node:assert/strict";
import test from "node:test";
import {
  canonicalize,
} from "../../../source/authoring/kernel/canonical.mjs";
import {
  beginSurveyAuthoring,
  createLiveSurveyHarness,
  createSurveyFrameSubmission,
  issueSurveyFrameAssignment,
  submitSurveyFrame,
} from "../profile/live-support.mjs";

test(
  "active initialization replay authenticates its retained ancestor without rejecting legitimate AT02 descendants",
  async () => {
    const harness = await createLiveSurveyHarness({
      storeId:
        "survey-initialization-descendant-replay",
    });
    const initialized = await beginSurveyAuthoring(harness);
    const issued = await issueSurveyFrameAssignment(harness);
    const submission = createSurveyFrameSubmission(
      harness,
      issued,
    );
    await submitSurveyFrame(
      harness,
      issued,
      submission,
    );
    const before = (
      await harness.coordinator.read(harness.storeId)
    ).snapshot;
    assert.equal(before.commitRevision, 3);

    const replayed = await initialized.adapter.advance(
      initialized.result.state,
      initialized.dependencyResult,
    );
    const after = (
      await harness.coordinator.read(harness.storeId)
    ).snapshot;

    assert.deepEqual(replayed, initialized.result);
    assert.equal(canonicalize(after), canonicalize(before));
    assert.equal(after.commitRevision, 3);
    assert.equal(
      after.journal[0].recordDigest,
      initialized.result.state.accepted.recordDigest,
    );
    assert.equal(
      after.workspace.spec.authoringState,
      "round_1_frame_required",
    );
  },
);
