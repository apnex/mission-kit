import assert from "node:assert/strict";
import test from "node:test";
import {
  createInMemoryAuthoringStore,
  exportInMemoryStoreBacking,
  importInMemoryStoreBacking,
} from "../../../../source/authoring/adapters/in-memory-store.mjs";
import {
  commitEvidence,
  createStoreHarness,
} from "./support.mjs";

test("exported backing cold-rehydrates the exact neutral snapshot", async () => {
  const warm = await createStoreHarness();
  await commitEvidence(warm);
  const expected = await warm.store.read(warm.storeId);
  const exported = exportInMemoryStoreBacking(warm.backing);
  const coldBacking = importInMemoryStoreBacking(
    structuredClone(exported),
  );
  const coldStore = createInMemoryAuthoringStore({
    backing: coldBacking,
    identityAuthority: warm.identity,
    authoringMachineId: "authoring-kernel",
  });
  const rehydrated = await coldStore.read(warm.storeId);

  assert.deepEqual(rehydrated, expected);
  assert.notStrictEqual(rehydrated, expected);
  assert.notStrictEqual(rehydrated.workspace, expected.workspace);
});
