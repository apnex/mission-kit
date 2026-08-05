import assert from "node:assert/strict";
import test from "node:test";
import {
  assertAuthoringStoreSnapshot,
} from "../../../../source/authoring/runtime/store-port.mjs";
import {
  createStoreHarness,
  digest,
} from "./support.mjs";

test("snapshot validation rejects non-UTF-8-ordered machine heads", async () => {
  const harness = await createStoreHarness();
  const snapshot = structuredClone(
    await harness.store.read(harness.storeId),
  );
  snapshot.machineHeads = [
    ...snapshot.machineHeads,
    {
      machineId: "a-external",
      state: "ready",
      stateDigest: digest("b"),
    },
  ];
  assert.throws(
    () => assertAuthoringStoreSnapshot(snapshot),
    (error) => error.code === "STORE_MACHINE_HEAD_ORDER_INVALID",
  );
});
