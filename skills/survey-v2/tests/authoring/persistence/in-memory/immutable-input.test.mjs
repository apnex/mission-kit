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

test("compare-and-commit detaches caller input before asynchronous work", async () => {
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

  let request;
  const committing = harness.store.withWriter(
    harness.storeId,
    async (writer) => {
      const current = await writer.read();
      request = {
        expected: structuredClone(
          snapshotExpectedToken(current, harness.identity),
        ),
        next: evidencePostImage(current),
      };
      return writer.compareAndCommit(request);
    },
  );
  await reached.promise;
  request.next.workspace.spec.evidenceRevision = 99;
  request.next.idempotencyOutcomeView[0].outcome.class =
    "caller-mutated";
  release.resolve();

  const result = await committing;
  assert.equal(result.status, "committed");
  assert.equal(result.snapshot.workspace.spec.evidenceRevision, 1);
  assert.equal(
    result.snapshot.idempotencyOutcomeView[0].outcome.class,
    "event-rejected",
  );
});
