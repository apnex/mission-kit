import assert from "node:assert/strict";
import test from "node:test";
import {
  exportInMemoryStoreBacking,
  importInMemoryStoreBacking,
} from "../../../../source/authoring/adapters/in-memory-store.mjs";
import {
  createStoreHarness,
  digest,
} from "./support.mjs";

test("cold backing import rejects a changed physical root seal", async () => {
  const harness = await createStoreHarness();
  const exported = structuredClone(
    exportInMemoryStoreBacking(harness.backing),
  );
  exported.snapshots[0].rootSealDigest = digest("f");

  assert.throws(
    () => importInMemoryStoreBacking(exported),
    (error) => error.code === "IN_MEMORY_ROOT_SEAL_MISMATCH",
  );
});
