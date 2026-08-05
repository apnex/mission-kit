import assert from "node:assert/strict";
import test from "node:test";
import {
  createInMemoryAuthoringStore,
  exportInMemoryStoreBacking,
  importInMemoryStoreBacking,
  inMemoryRootSealDigest,
} from "../../../../source/authoring/adapters/in-memory-store.mjs";
import {
  journalRecordDigest,
} from "../../../../source/authoring/kernel/digests.mjs";
import {
  commitEvidence,
  createStoreHarness,
} from "./support.mjs";

test("the adapter rejects a publicly rehashed journal rewrite after physical root resealing", async () => {
  const warm = await createStoreHarness();
  await commitEvidence(warm);
  const exported = exportInMemoryStoreBacking(warm.backing);
  const rewritten = structuredClone(exported);
  const snapshot = rewritten.snapshots[0];
  const record = snapshot.journal[0];

  record.actor.id = "forged-storage-writer";
  record.recordDigest = journalRecordDigest(record);
  snapshot.idempotencyOutcomeView[0].recordDigest =
    record.recordDigest;
  snapshot.rootSealDigest = inMemoryRootSealDigest(snapshot);

  const resealedBacking = importInMemoryStoreBacking(rewritten);
  assert.throws(
    () => createInMemoryAuthoringStore({
      backing: resealedBacking,
      identityAuthority: warm.identity,
      authoringMachineId: "authoring-kernel",
    }),
    (error) =>
      error.code === "JOURNAL_AUTHENTICATION_MISMATCH",
  );
});
