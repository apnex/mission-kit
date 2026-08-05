import assert from "node:assert/strict";
import test from "node:test";
import {
  IN_MEMORY_STORE_FAULT_POINTS,
} from "../../../../source/authoring/adapters/in-memory-store.mjs";
import {
  snapshotExpectedToken,
} from "../../../../source/authoring/runtime/store-port.mjs";
import {
  commitEvidence,
  createStoreHarness,
  evidencePostImage,
} from "./support.mjs";

test("a logical crash after publication leaves the exact complete new root visible", async () => {
  const fault = new Error("logical crash after publish");
  const harness = await createStoreHarness({
    faultInjector: ({ point }) => {
      if (
        point ===
        IN_MEMORY_STORE_FAULT_POINTS
          .AFTER_PUBLISH_BEFORE_ACKNOWLEDGEMENT
      ) {
        throw fault;
      }
    },
  });
  const before = await harness.store.read(harness.storeId);
  await assert.rejects(commitEvidence(harness), fault);
  const after = await harness.store.read(harness.storeId);
  assert.equal(after.commitRevision, 1);
  assert.equal(after.journal.length, 1);
  assert.equal(after.idempotencyOutcomeView.length, 1);
  assert.equal(after.workspace.spec.evidenceRevision, 1);

  const retry = await harness.store.withWriter(
    harness.storeId,
    async (writer) =>
      writer.compareAndCommit({
        expected: snapshotExpectedToken(
          before,
          harness.identity,
        ),
        next: evidencePostImage(before),
      }),
  );
  assert.deepEqual(retry, { status: "conflict" });
});
