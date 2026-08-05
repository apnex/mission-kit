import assert from "node:assert/strict";
import test from "node:test";
import {
  journalRecordDigest,
  projectJournalRecordAuthenticationCore,
  resourceIntegrityDigest,
  workspaceIntegrityDigest,
} from "../../../source/authoring/kernel/digests.mjs";
import {
  acceptSubmission,
  createCoordinatorHarness,
  issueAssignment,
  submissionFor,
} from "../transactions/coordinator/support.mjs";
import {
  replayCoordinatorSnapshot,
} from "./coordinator-snapshot-support.mjs";
import {
  fullyResealRawSubmissionRewrite,
} from "./fully-resealed-submission-support.mjs";

test("accepted-transition replay rejects rewritten raw Submission bytes under the same semantic reference", async () => {
  const harness = await createCoordinatorHarness();
  const issued = await issueAssignment(harness);
  await acceptSubmission(
    harness,
    issued,
    submissionFor(harness, issued),
  );
  const snapshot = await harness.store.read(harness.storeId);
  const resealed = fullyResealRawSubmissionRewrite(
    snapshot,
    Buffer.from("rewritten accepted evidence\n", "utf8"),
  );

  assert.deepEqual(
    resealed.storedSubmission.reference,
    resealed.original.resourceReference,
    "raw evidence remains outside Submission semantic identity",
  );
  assert.notEqual(
    resealed.storedSubmission.integrityDigest,
    resealed.original.resourceIntegrityDigest,
  );
  assert.equal(
    resealed.storedSubmission.integrityDigest,
    resourceIntegrityDigest(
      resealed.storedSubmission.resource,
    ),
  );
  assert.notEqual(
    resealed.workspace.spec.integrity.workspaceIntegrityDigest,
    resealed.original.workspaceIntegrityDigest,
  );
  assert.equal(
    resealed.workspace.spec.integrity.workspaceIntegrityDigest,
    workspaceIntegrityDigest(resealed.workspace),
  );
  assert.equal(
    resealed.record.mutationDigest,
    resealed.original.mutationDigest,
    "raw evidence does not alter accepted semantic mutation ancestry",
  );
  assert.equal(
    resealed.record.authenticationDigest,
    resealed.original.authenticationDigest,
    "a public reseal cannot replace the authority-only authenticator",
  );
  assert.notEqual(
    resealed.record.authenticationDigest,
    harness.identity.recordAuthenticationDigest(
      projectJournalRecordAuthenticationCore(
        resealed.record,
      ),
    ),
  );
  assert.notEqual(
    resealed.record.recordDigest,
    resealed.original.recordDigest,
  );
  assert.equal(
    resealed.record.recordDigest,
    journalRecordDigest(resealed.record),
  );
  assert.equal(
    resealed.idempotencyOutcomeView.at(-1).recordDigest,
    resealed.record.recordDigest,
  );

  assert.throws(
    () => replayCoordinatorSnapshot(harness, snapshot, {
      workspace: resealed.workspace,
      journal: resealed.journal,
      idempotencyOutcomeView:
        resealed.idempotencyOutcomeView,
    }),
    (error) =>
      error.code ===
      "JOURNAL_AUTHENTICATION_MISMATCH",
  );
});
