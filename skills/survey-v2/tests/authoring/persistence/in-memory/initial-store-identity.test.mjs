import assert from "node:assert/strict";
import test from "node:test";
import {
  exportInMemoryStoreBacking,
  importInMemoryStoreBacking,
  inMemoryRootSealDigest,
} from "../../../../source/authoring/adapters/in-memory-store.mjs";
import {
  createStoreHarness,
} from "./support.mjs";

test("initial store accepts its exact identity scope and rejects a resealed tamper", async () => {
  const harness = await createStoreHarness();
  const accepted = await harness.store.read(harness.storeId);
  assert.equal(
    accepted.identityBinding.scopeDigest,
    harness.identity.binding.scopeDigest,
  );

  const exported = structuredClone(
    exportInMemoryStoreBacking(harness.backing),
  );
  const tampered = exported.snapshots[0];
  tampered.identityScope.adapterScope.storeId = "different-store";
  tampered.rootSealDigest = inMemoryRootSealDigest(tampered);
  assert.throws(
    () => importInMemoryStoreBacking(exported),
    (error) =>
      error.code === "STORE_IDENTITY_SCOPE_DIGEST_MISMATCH",
  );
});
