import assert from "node:assert/strict";
import test from "node:test";
import {
  IN_MEMORY_STORE_FAULT_POINTS,
} from "../../../../source/authoring/adapters/in-memory-store.mjs";
import {
  commitEvidence,
  createStoreHarness,
} from "./support.mjs";

test("a logical crash before publication leaves the exact old root visible", async () => {
  const fault = new Error("logical crash before publish");
  const harness = await createStoreHarness({
    faultInjector: ({ point }) => {
      if (
        point ===
        IN_MEMORY_STORE_FAULT_POINTS
          .AFTER_PREPARATION_BEFORE_PUBLISH
      ) {
        throw fault;
      }
    },
  });
  const before = await harness.store.read(harness.storeId);
  await assert.rejects(commitEvidence(harness), fault);
  const after = await harness.store.read(harness.storeId);
  assert.deepEqual(after, before);
});
