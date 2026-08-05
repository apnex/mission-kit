import assert from "node:assert/strict";
import test from "node:test";
import {
  createStoreHarness,
  deferred,
} from "./support.mjs";

test("a capability from an older private writer fence is rejected", async () => {
  const harness = await createStoreHarness();
  let staleWriter;
  await harness.store.withWriter(
    harness.storeId,
    async (writer) => {
      staleWriter = writer;
    },
  );

  const secondEntered = deferred();
  const releaseSecond = deferred();
  const active = harness.store.withWriter(
    harness.storeId,
    async () => {
      secondEntered.resolve();
      await releaseSecond.promise;
    },
  );
  await secondEntered.promise;
  await assert.rejects(
    staleWriter.read(),
    (error) => error.code === "IN_MEMORY_WRITER_FENCE_STALE",
  );
  releaseSecond.resolve();
  await active;
});
