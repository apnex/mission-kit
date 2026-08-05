import assert from "node:assert/strict";
import test from "node:test";
import {
  journalRecordDigest,
} from "../../../../source/authoring/kernel/digests.mjs";
import {
  snapshotExpectedToken,
} from "../../../../source/authoring/runtime/store-port.mjs";
import {
  createStoreHarness,
  evidencePostImage,
} from "./support.mjs";

test("the adapter refuses an unauthenticated post-image before publication and preserves the readable old root", async () => {
  const observedFaultPoints = [];
  const harness = await createStoreHarness({
    faultInjector({ point }) {
      observedFaultPoints.push(point);
    },
  });
  const before = await harness.store.read(harness.storeId);

  await assert.rejects(
    harness.store.withWriter(
      harness.storeId,
      async (writer) => {
        const current = await writer.read();
        const next = evidencePostImage(current);
        const record = next.journal[0];

        record.actor.id = "forged-public-writer";
        record.recordDigest = journalRecordDigest(record);
        next.idempotencyOutcomeView[0].recordDigest =
          record.recordDigest;

        return writer.compareAndCommit({
          expected: snapshotExpectedToken(
            current,
            harness.identity,
          ),
          next,
        });
      },
    ),
    (error) =>
      error.code === "JOURNAL_AUTHENTICATION_MISMATCH",
  );

  assert.deepEqual(
    await harness.store.read(harness.storeId),
    before,
  );
  assert.deepEqual(observedFaultPoints, [
    "before-assembly",
    "during-assembly",
  ]);
});
