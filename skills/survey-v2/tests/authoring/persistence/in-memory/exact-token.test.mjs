import assert from "node:assert/strict";
import test from "node:test";
import {
  snapshotExpectedToken,
} from "../../../../source/authoring/runtime/store-port.mjs";
import {
  createStoreHarness,
  evidencePostImage,
} from "./support.mjs";

test("compare-and-commit rejects any expected token beyond the exact four fields", async () => {
  const harness = await createStoreHarness();
  await harness.store.withWriter(
    harness.storeId,
    async (writer) => {
      const current = await writer.read();
      const expected = {
        ...snapshotExpectedToken(current, harness.identity),
        semanticRevision:
          current.workspace.spec.semanticRevision,
      };
      await assert.rejects(
        writer.compareAndCommit({
          expected,
          next: evidencePostImage(current),
        }),
        (error) =>
          error.code === "STORE_EXPECTED_TOKEN_FIELDS_INVALID",
      );
    },
  );
});
