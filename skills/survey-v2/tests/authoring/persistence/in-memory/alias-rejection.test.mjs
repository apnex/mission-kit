import assert from "node:assert/strict";
import test from "node:test";
import {
  assertAuthoringStoreSnapshot,
} from "../../../../source/authoring/runtime/store-port.mjs";
import {
  createStoreHarness,
} from "./support.mjs";

test("snapshot validation rejects an aliased canonical object graph", async () => {
  const harness = await createStoreHarness();
  const snapshot = structuredClone(
    await harness.store.read(harness.storeId),
  );
  snapshot.workspace.spec.protocol.reference =
    snapshot.workspace.spec.profile.reference;
  assert.throws(
    () => assertAuthoringStoreSnapshot(snapshot),
    (error) => error.code === "STORE_CANONICAL_ALIAS_FORBIDDEN",
  );
});
