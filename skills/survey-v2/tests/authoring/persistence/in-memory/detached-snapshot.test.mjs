import assert from "node:assert/strict";
import test from "node:test";
import {
  assertDeepFrozen,
  createStoreHarness,
} from "./support.mjs";

test("store reads are detached deeply frozen canonical snapshots", async () => {
  const harness = await createStoreHarness();
  const first = await harness.store.read(harness.storeId);
  const second = await harness.store.read(harness.storeId);

  assertDeepFrozen(first);
  assertDeepFrozen(second);
  assert.notStrictEqual(first, second);
  assert.notStrictEqual(first.workspace, second.workspace);
  assert.throws(() => {
    first.workspace.spec.evidenceRevision = 99;
  }, TypeError);
  assert.equal(second.workspace.spec.evidenceRevision, 0);
});
