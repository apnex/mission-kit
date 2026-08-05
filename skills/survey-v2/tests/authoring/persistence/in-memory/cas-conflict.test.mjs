import assert from "node:assert/strict";
import test from "node:test";
import {
  createStoreHarness,
  digest,
  evidencePostImage,
} from "./support.mjs";
import {
  snapshotExpectedToken,
} from "../../../../source/authoring/runtime/store-port.mjs";

test("a mismatched exact compare token returns a read-only conflict", async () => {
  const harness = await createStoreHarness();
  const before = await harness.store.read(harness.storeId);
  const result = await harness.store.withWriter(
    harness.storeId,
    async (writer) => {
      const current = await writer.read();
      const expected = {
        ...snapshotExpectedToken(current, harness.identity),
        rootSealDigest: digest("f"),
      };
      return writer.compareAndCommit({
        expected,
        next: evidencePostImage(current),
      });
    },
  );
  const after = await harness.store.read(harness.storeId);

  assert.deepEqual(result, { status: "conflict" });
  assert.deepEqual(after, before);
});
