import assert from "node:assert/strict";
import test from "node:test";
import {
  IN_MEMORY_STORE_FAULT_POINTS,
} from "../../../../source/authoring/adapters/in-memory-store.mjs";
import {
  commitEvidence,
  createStoreHarness,
} from "./support.mjs";

test("a logical crash at BEFORE_ASSEMBLY leaves the exact old root", async () => {
  const fault = new Error("logical crash before assembly");
  const harness = await createStoreHarness({
    faultInjector: ({ point }) => {
      if (
        point ===
        IN_MEMORY_STORE_FAULT_POINTS.BEFORE_ASSEMBLY
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
