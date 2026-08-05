import assert from "node:assert/strict";
import test from "node:test";
import {
  IN_MEMORY_STORE_FAULT_POINTS,
} from "../../../../source/authoring/adapters/in-memory-store.mjs";
import {
  createStoreHarness,
  deferred,
} from "./support.mjs";
import {
  commitEvidence,
} from "./support.mjs";

test("observers see one complete old or new root and no prepared partial state", async () => {
  const prepared = deferred();
  const publish = deferred();
  const harness = await createStoreHarness({
    faultInjector: async ({ point }) => {
      if (
        point ===
        IN_MEMORY_STORE_FAULT_POINTS
          .AFTER_PREPARATION_BEFORE_PUBLISH
      ) {
        prepared.resolve();
        await publish.promise;
      }
    },
  });
  const before = await harness.store.read(harness.storeId);
  const committing = commitEvidence(harness);
  await prepared.promise;
  const whilePrepared =
    await harness.store.read(harness.storeId);
  assert.deepEqual(whilePrepared, before);

  publish.resolve();
  const committed = await committing;
  const after = await harness.store.read(harness.storeId);
  assert.equal(committed.status, "committed");
  assert.deepEqual(after, committed.snapshot);
  assert.equal(after.commitRevision, 1);
  assert.equal(after.journal.length, 1);
  assert.equal(after.idempotencyOutcomeView.length, 1);
  assert.equal(after.workspace.spec.evidenceRevision, 1);
});
