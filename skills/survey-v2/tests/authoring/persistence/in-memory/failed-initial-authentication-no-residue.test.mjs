import assert from "node:assert/strict";
import test from "node:test";
import {
  createInMemoryAuthoringStore,
  createInMemoryStoreBacking,
  exportInMemoryStoreBacking,
} from "../../../../source/authoring/adapters/in-memory-store.mjs";
import {
  journalRecordDigest,
} from "../../../../source/authoring/kernel/digests.mjs";
import {
  commitEvidence,
  createStoreHarness,
} from "./support.mjs";

test("failed initial authentication leaves the supplied backing byte-identical", async () => {
  const warm = await createStoreHarness();
  await commitEvidence(warm);
  const invalid = structuredClone(
    exportInMemoryStoreBacking(warm.backing).snapshots[0],
  );
  delete invalid.rootSealDigest;
  invalid.journal[0].actor.id = "forged-initial-writer";
  invalid.journal[0].recordDigest =
    journalRecordDigest(invalid.journal[0]);
  invalid.idempotencyOutcomeView[0].recordDigest =
    invalid.journal[0].recordDigest;

  const backing = createInMemoryStoreBacking();
  const before = exportInMemoryStoreBacking(backing);

  assert.throws(
    () => createInMemoryAuthoringStore({
      backing,
      initialSnapshots: [invalid],
      identityAuthority: warm.identity,
      authoringMachineId: "authoring-kernel",
    }),
    (error) =>
      error.code === "JOURNAL_AUTHENTICATION_MISMATCH",
  );

  assert.deepEqual(
    exportInMemoryStoreBacking(backing),
    before,
  );
});
