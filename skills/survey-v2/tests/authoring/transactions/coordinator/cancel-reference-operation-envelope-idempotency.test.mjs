import assert from "node:assert/strict";
import test from "node:test";
import {
  assignmentBinding,
  createCoordinatorHarness,
  digest,
  issueAssignment,
  writeCountingStoreTransform,
} from "./support.mjs";

test(
  "cancel replay rejects a changed Assignment reference without mutation",
  async () => {
    const writes = { count: 0 };
    const harness = await createCoordinatorHarness({
      storeTransform: writeCountingStoreTransform(writes),
    });
    const issued = await issueAssignment(harness);
    const command = {
      class: "cancel",
      assignment: assignmentBinding(issued),
      cancellationEvidenceDigest: digest("c"),
    };
    await harness.coordinator.execute(
      harness.storeId,
      command,
    );
    const changed = structuredClone(command);
    changed.assignment.reference.name =
      `${changed.assignment.reference.name}-alias`;
    const before = await harness.store.read(harness.storeId);
    const callbacksBefore = { ...harness.callbackCounts };
    const writesBefore = writes.count;

    await assert.rejects(
      harness.coordinator.execute(
        harness.storeId,
        changed,
      ),
      (error) =>
        error?.code ===
          "TRANSACTION_RESOURCE_RESOLUTION_FAILED",
    );

    assert.deepEqual(
      await harness.store.read(harness.storeId),
      before,
    );
    assert.deepEqual(
      harness.callbackCounts,
      callbacksBefore,
    );
    assert.equal(writes.count, writesBefore);
  },
);
