import assert from "node:assert/strict";
import test from "node:test";
import {
  createCoordinatorHarness,
  issueAssignment,
  submissionFor,
  submitCommand,
} from "./support.mjs";

test(
  "concurrent different submissions for one Assignment produce one winner and one consumed conflict",
  async () => {
    const harness = await createCoordinatorHarness();
    const issued = await issueAssignment(harness);
    const firstSubmission = submissionFor(harness, issued, {
      name: "submission-one",
      summary: "First bounded brief.",
    });
    const secondSubmission = submissionFor(harness, issued, {
      name: "submission-two",
      summary: "Second bounded brief.",
    });
    const firstCommand = await submitCommand(
      harness,
      issued,
      firstSubmission,
    );
    const secondCommand = await submitCommand(
      harness,
      issued,
      secondSubmission,
    );
    const settled = await Promise.allSettled([
      harness.coordinator.execute(
        harness.storeId,
        firstCommand,
      ),
      harness.coordinator.execute(
        harness.storeId,
        secondCommand,
      ),
    ]);
    const fulfilled = settled.filter(
      (result) => result.status === "fulfilled",
    );
    const rejected = settled.filter(
      (result) => result.status === "rejected",
    );
    const snapshot = await harness.store.read(harness.storeId);

    assert.equal(fulfilled.length, 1);
    assert.equal(fulfilled[0].value.kind, "committed");
    assert.equal(rejected.length, 1);
    assert.equal(
      rejected[0].reason.code,
      "REQUEST_ALREADY_CONSUMED",
    );
    assert.equal(snapshot.commitRevision, 2);
    assert.equal(snapshot.journal.length, 2);
  },
);
