import assert from "node:assert/strict";
import test from "node:test";
import {
  IN_MEMORY_STORE_FAULT_POINTS,
} from "../../../../source/authoring/adapters/in-memory-store.mjs";
import {
  snapshotExpectedToken,
} from "../../../../source/authoring/runtime/store-port.mjs";
import {
  createStoreHarness,
  deferred,
  evidencePostImage,
} from "./support.mjs";

test("an unawaited writer operation finishes inside the lease lifetime", async () => {
  const reached = deferred();
  const release = deferred();
  const harness = await createStoreHarness({
    faultInjector: async ({ point }) => {
      if (
        point ===
        IN_MEMORY_STORE_FAULT_POINTS.BEFORE_ASSEMBLY
      ) {
        reached.resolve();
        await release.promise;
      }
    },
  });
  let operation;
  let leaseSettled = false;
  const lease = harness.store.withWriter(
    harness.storeId,
    async (writer) => {
      const current = await writer.read();
      operation = writer.compareAndCommit({
        expected: snapshotExpectedToken(
          current,
          harness.identity,
        ),
        next: evidencePostImage(current),
      });
    },
  ).then(() => {
    leaseSettled = true;
  });

  await reached.promise;
  await Promise.resolve();
  assert.equal(leaseSettled, false);
  release.resolve();
  await lease;
  assert.equal((await operation).status, "committed");
});
