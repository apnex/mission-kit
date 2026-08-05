import assert from "node:assert/strict";
import test from "node:test";
import {
  assertAuthoringStoreSnapshot,
} from "../../../../source/authoring/runtime/store-port.mjs";
import {
  createStoreHarness,
} from "./support.mjs";

test("snapshot validation rejects a sparse array", async () => {
  const harness = await createStoreHarness();
  const snapshot = structuredClone(
    await harness.store.read(harness.storeId),
  );
  snapshot.journal = new Array(1);
  snapshot.commitRevision = 1;
  assert.throws(
    () => assertAuthoringStoreSnapshot(snapshot),
    (error) => error.code === "STORE_CANONICAL_ARRAY_INVALID",
  );
});
