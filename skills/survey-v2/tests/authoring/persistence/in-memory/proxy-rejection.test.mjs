import assert from "node:assert/strict";
import test from "node:test";
import {
  assertAuthoringStoreSnapshot,
} from "../../../../source/authoring/runtime/store-port.mjs";
import {
  createStoreHarness,
} from "./support.mjs";

test("snapshot validation rejects a proxy without consulting its traps", async () => {
  const harness = await createStoreHarness();
  const snapshot = structuredClone(
    await harness.store.read(harness.storeId),
  );
  let consulted = false;
  snapshot.identityScope.adapterScope = new Proxy({}, {
    ownKeys() {
      consulted = true;
      throw new Error("proxy trap must not run");
    },
  });
  assert.throws(
    () => assertAuthoringStoreSnapshot(snapshot),
    (error) => error.code === "STORE_CANONICAL_PROXY_FORBIDDEN",
  );
  assert.equal(consulted, false);
});
