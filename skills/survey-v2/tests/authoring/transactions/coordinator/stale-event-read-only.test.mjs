import assert from "node:assert/strict";
import test from "node:test";
import {
  acceptSubmission,
  createCoordinatorHarness,
  eventCommand,
  issueAssignment,
  submissionFor,
} from "./support.mjs";

test(
  "a stale event is rejected before profile callbacks and remains read-only",
  async () => {
    const harness = await createCoordinatorHarness();
    const issued = await issueAssignment(harness);
    await acceptSubmission(
      harness,
      issued,
      submissionFor(harness, issued),
    );
    const stale = await eventCommand(harness, {
      commandFill: "4",
      payloadFill: "5",
      evidenceFill: "6",
    });
    await harness.coordinator.execute(
      harness.storeId,
      await eventCommand(harness),
    );
    const before = await harness.store.read(harness.storeId);
    const callbacksBefore = { ...harness.callbackCounts };
    const result = await harness.coordinator.execute(
      harness.storeId,
      stale,
    );
    const after = await harness.store.read(harness.storeId);

    assert.equal(result.kind, "rejected");
    assert.equal(
      result.issues[0].spec.boundary,
      "kernel.freshness",
    );
    assert.deepEqual(harness.callbackCounts, callbacksBefore);
    assert.deepEqual(after, before);
  },
);
