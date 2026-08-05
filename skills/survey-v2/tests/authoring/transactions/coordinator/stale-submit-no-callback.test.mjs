import assert from "node:assert/strict";
import test from "node:test";
import {
  assignmentBinding,
  createCoordinatorHarness,
  digest,
  issueAssignment,
  submissionFor,
  submitCommand,
} from "./support.mjs";

test(
  "a cancelled Assignment is refused before any profile callback or write",
  async () => {
    const harness = await createCoordinatorHarness();
    const issued = await issueAssignment(harness);
    const submission = submissionFor(harness, issued);
    const submit = await submitCommand(
      harness,
      issued,
      submission,
    );
    await harness.coordinator.execute(
      harness.storeId,
      {
        class: "cancel",
        assignment: assignmentBinding(issued),
        cancellationEvidenceDigest: digest("c"),
      },
    );
    const before = await harness.store.read(harness.storeId);
    const callbacksBefore = { ...harness.callbackCounts };

    await assert.rejects(
      harness.coordinator.execute(
        harness.storeId,
        submit,
      ),
      (error) => error?.code === "ASSIGNMENT_NOT_OPEN",
    );

    const after = await harness.store.read(harness.storeId);
    assert.deepEqual(harness.callbackCounts, callbacksBefore);
    assert.deepEqual(after, before);
  },
);
