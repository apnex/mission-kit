import assert from "node:assert/strict";
import test from "node:test";
import {
  createInMemoryAuthoringStore,
  createInMemoryJournalIdentityConfiguration,
  exportInMemoryStoreBacking,
  importInMemoryStoreBacking,
} from "../../../../source/authoring/adapters/in-memory-store.mjs";
import {
  compileJournalIdentityPort,
} from "../../../../source/authoring/runtime/journal-replay.mjs";
import {
  commitEvidence,
  createStoreHarness,
  journalAuthenticationKey,
} from "./support.mjs";

test("cold reconstruction with the same external authentication key verifies the exact journal", async () => {
  const warm = await createStoreHarness();
  await commitEvidence(warm);
  const expected = await warm.store.read(warm.storeId);
  const exported = exportInMemoryStoreBacking(warm.backing);
  const coldBacking = importInMemoryStoreBacking(
    structuredClone(exported),
  );
  const coldIdentity = compileJournalIdentityPort(
    createInMemoryJournalIdentityConfiguration(
      expected.identityScope,
      journalAuthenticationKey,
    ),
  );
  assert.notStrictEqual(coldIdentity, warm.identity);
  assert.deepEqual(
    coldIdentity.binding,
    warm.identity.binding,
  );

  const coldStore = createInMemoryAuthoringStore({
    backing: coldBacking,
    identityAuthority: coldIdentity,
    authoringMachineId: "authoring-kernel",
  });
  assert.deepEqual(
    await coldStore.read(warm.storeId),
    expected,
  );
});
