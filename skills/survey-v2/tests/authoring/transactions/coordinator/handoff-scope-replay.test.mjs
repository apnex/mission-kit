import assert from "node:assert/strict";
import test from "node:test";
import {
  journalRecordDigest,
  projectJournalRecordAuthenticationCore,
} from "../../../../source/authoring/kernel/digests.mjs";
import {
  exportInMemoryStoreBacking,
  importInMemoryStoreBacking,
  inMemoryRootSealDigest,
} from "../../../../source/authoring/adapters/in-memory-store.mjs";
import {
  acceptSubmission,
  createCoordinatorHarness,
  issueAssignment,
  submissionFor,
} from "./support.mjs";

test("cold coordinator replay rejects a journal handoff scope outside the manifest-selected transition footprint", async () => {
  const harness = await createCoordinatorHarness();
  const issued = await issueAssignment(harness);
  await acceptSubmission(
    harness,
    issued,
    submissionFor(harness, issued),
  );
  const exported = structuredClone(
    exportInMemoryStoreBacking(harness.persistence),
  );
  const snapshot = exported.snapshots[0];
  snapshot.journal[1].workspaceEffect.handoffSlots.push(
    "unselected-slot",
  );
  snapshot.journal[1].authenticationDigest =
    harness.identity.recordAuthenticationDigest(
      projectJournalRecordAuthenticationCore(
        snapshot.journal[1],
      ),
    );
  snapshot.journal[1].recordDigest =
    journalRecordDigest(snapshot.journal[1]);
  snapshot.idempotencyOutcomeView[1].recordDigest =
    snapshot.journal[1].recordDigest;
  snapshot.rootSealDigest = inMemoryRootSealDigest(snapshot);
  const persistence = importInMemoryStoreBacking(exported);
  const cold = await createCoordinatorHarness({
    persistence,
    initialize: false,
  });

  await assert.rejects(
    () => cold.coordinator.read(cold.storeId),
    (error) =>
      error.code ===
      "TRANSACTION_JOURNAL_HANDOFF_SCOPE_INVALID",
  );
});
