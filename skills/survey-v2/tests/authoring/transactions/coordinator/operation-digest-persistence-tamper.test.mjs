import assert from "node:assert/strict";
import test from "node:test";
import {
  exportInMemoryStoreBacking,
  importInMemoryStoreBacking,
  inMemoryRootSealDigest,
} from "../../../../source/authoring/adapters/in-memory-store.mjs";
import {
  journalRecordDigest,
} from "../../../../source/authoring/kernel/digests.mjs";
import {
  createCoordinatorHarness,
  digest,
  issueAssignment,
} from "./support.mjs";

test(
  "persisted operation identity rejects unauthenticated journal and outcome-link tampering",
  async () => {
    const warm = await createCoordinatorHarness();
    await issueAssignment(warm);
    const exported = structuredClone(
      exportInMemoryStoreBacking(warm.persistence),
    );

    const unauthenticated = structuredClone(exported);
    const unauthenticatedSnapshot =
      unauthenticated.snapshots[0];
    const unauthenticatedRecord =
      unauthenticatedSnapshot.journal[0];
    unauthenticatedRecord.operationDigest = digest("7");
    unauthenticatedRecord.recordDigest =
      journalRecordDigest(unauthenticatedRecord);
    unauthenticatedSnapshot.idempotencyOutcomeView[0]
      .operationDigest = unauthenticatedRecord.operationDigest;
    unauthenticatedSnapshot.idempotencyOutcomeView[0]
      .recordDigest = unauthenticatedRecord.recordDigest;
    unauthenticatedSnapshot.rootSealDigest =
      inMemoryRootSealDigest(unauthenticatedSnapshot);
    const unauthenticatedPersistence =
      importInMemoryStoreBacking(unauthenticated);

    await assert.rejects(
      createCoordinatorHarness({
        persistence: unauthenticatedPersistence,
        initialize: false,
      }),
      (error) =>
        error?.code === "JOURNAL_AUTHENTICATION_MISMATCH",
    );

    const unlinked = structuredClone(exported);
    const unlinkedSnapshot = unlinked.snapshots[0];
    unlinkedSnapshot.idempotencyOutcomeView[0]
      .operationDigest = digest("8");
    unlinkedSnapshot.rootSealDigest =
      inMemoryRootSealDigest(unlinkedSnapshot);

    assert.throws(
      () => importInMemoryStoreBacking(unlinked),
      (error) =>
        error?.code === "STORE_OUTCOME_JOURNAL_MISMATCH",
    );
  },
);
