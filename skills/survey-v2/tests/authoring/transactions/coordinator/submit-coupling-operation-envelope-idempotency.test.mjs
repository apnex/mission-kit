import assert from "node:assert/strict";
import test from "node:test";
import {
  createCoordinatorHarness,
  issueAssignment,
  submissionFor,
  submitCommand,
  writeCountingStoreTransform,
} from "./support.mjs";

test(
  "submit idempotency rejects a reordered external-coupling envelope without mutation",
  async () => {
    const writes = { count: 0 };
    const harness = await createCoordinatorHarness({
      storeTransform: writeCountingStoreTransform(writes),
    });
    const issued = await issueAssignment(harness);
    const command = await submitCommand(
      harness,
      issued,
      submissionFor(harness, issued),
    );
    assert.ok(
      command.externalCouplings.length > 1,
      "the fixture must expose an order-sensitive coupling sequence",
    );
    await harness.coordinator.execute(
      harness.storeId,
      command,
    );
    const changed = structuredClone(command);
    changed.externalCouplings.reverse();
    const before = await harness.store.read(harness.storeId);
    const callbacksBefore = { ...harness.callbackCounts };
    const writesBefore = writes.count;

    await assert.rejects(
      harness.coordinator.execute(
        harness.storeId,
        changed,
      ),
      (error) => error?.code === "IDEMPOTENCY_KEY_REUSED",
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
