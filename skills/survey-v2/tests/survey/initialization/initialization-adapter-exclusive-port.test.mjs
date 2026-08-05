import assert from "node:assert/strict";
import test from "node:test";
import {
  canonicalize,
} from "../../../source/authoring/kernel/canonical.mjs";
import {
  createBeginSurveyCommand,
  createLiveSurveyHarness,
} from "../profile/live-support.mjs";

test(
  "Survey BEGIN_AUTHORING rejects raw coordinator access before a store operation",
  async () => {
    const harness = await createLiveSurveyHarness({
      storeId:
        "survey-initialization-exclusive-event-port",
    });
    const before = (
      await harness.coordinator.read(harness.storeId)
    ).snapshot;
    const command = await createBeginSurveyCommand(harness);

    await assert.rejects(
      harness.coordinator.execute(
        harness.storeId,
        command,
      ),
      (error) =>
        error?.code ===
          "TRANSACTION_EVENT_ADMISSION_REQUIRED",
    );
    const after = (
      await harness.coordinator.read(harness.storeId)
    ).snapshot;

    assert.equal(canonicalize(after), canonicalize(before));
    assert.equal(after.commitRevision, 0);
    assert.equal(after.journal.length, 0);
    assert.equal(after.workspace.spec.authoringState, "new");
    assert.equal(after.workspace.spec.openAssignment, null);
  },
);
