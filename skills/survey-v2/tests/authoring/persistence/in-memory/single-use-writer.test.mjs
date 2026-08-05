import assert from "node:assert/strict";
import test from "node:test";
import {
  createStoreHarness,
  evidencePostImage,
} from "./support.mjs";
import {
  snapshotExpectedToken,
} from "../../../../source/authoring/runtime/store-port.mjs";

test("one writer capability can attempt compare-and-commit only once", async () => {
  const harness = await createStoreHarness();
  await harness.store.withWriter(
    harness.storeId,
    async (writer) => {
      const current = await writer.read();
      const request = {
        expected: snapshotExpectedToken(
          current,
          harness.identity,
        ),
        next: evidencePostImage(current),
      };
      const committed = await writer.compareAndCommit(request);
      assert.equal(committed.status, "committed");
      await assert.rejects(
        writer.compareAndCommit(request),
        (error) =>
          error.code === "IN_MEMORY_WRITER_ALREADY_USED",
      );
    },
  );
});
