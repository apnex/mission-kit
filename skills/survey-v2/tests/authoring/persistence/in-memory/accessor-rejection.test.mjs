import assert from "node:assert/strict";
import test from "node:test";
import {
  assertAuthoringStoreSnapshot,
} from "../../../../source/authoring/runtime/store-port.mjs";
import {
  createStoreHarness,
} from "./support.mjs";

test("snapshot validation rejects an accessor without invoking it", async () => {
  const harness = await createStoreHarness();
  const snapshot = structuredClone(
    await harness.store.read(harness.storeId),
  );
  let invoked = false;
  Object.defineProperty(snapshot, "storeId", {
    enumerable: true,
    configurable: true,
    get() {
      invoked = true;
      throw new Error("accessor must not run");
    },
  });
  assert.throws(
    () => assertAuthoringStoreSnapshot(snapshot),
    (error) =>
      error.code === "STORE_CANONICAL_ACCESSOR_FORBIDDEN",
  );
  assert.equal(invoked, false);
});
