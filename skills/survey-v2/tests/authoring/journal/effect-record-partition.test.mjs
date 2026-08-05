import assert from "node:assert/strict";
import test from "node:test";
import { canonicalize } from "../../../source/authoring/kernel/canonical.mjs";
import {
  createEvidenceCommitPlan,
} from "../../../source/authoring/runtime/commit-records.mjs";
import {
  createCoordinatorHarness,
  issueAssignment,
  submissionFor,
  submitCommand,
} from "../transactions/coordinator/support.mjs";
import {
  rehashJournalRecord,
  replayCoordinatorSnapshot,
} from "./coordinator-snapshot-support.mjs";

function rejectingHandler(input) {
  if (input.phase !== "submission") {
    return { status: "accept", products: [] };
  }
  return {
    status: "reject",
    issues: [{
      code: "PARTITION_TEST_REJECTION",
      field: "/summary",
      reason: "Retain one orthogonal rejection record.",
      correction: "Use a different summary.",
    }],
  };
}

function refreshEvidenceRecord(
  record,
  outcome,
  priorJournalHeadDigest,
  storedByReference,
  identity,
) {
  const retainedResourceVersions =
    record.workspaceEffect.retainedResources.map(
      (binding) => storedByReference.get(
        canonicalize(binding.reference),
      ),
    );
  const plan = createEvidenceCommitPlan({
    priorJournalHeadDigest,
    idempotency: record.idempotency,
    operationDigest: record.operationDigest,
    commandDigest: record.commandDigest,
    payloadDigest: record.payloadDigest,
    before: record.before,
    after: record.after,
    retainedResourceVersions,
    openAssignment: record.workspaceEffect.openAssignment,
    outcome,
  });
  record.previousSealDigest = priorJournalHeadDigest;
  record.mutationDigest = plan.mutationDigest;
  rehashJournalRecord(record, identity);
}

test("one record cannot claim the leading resource and history effects owned by the next record", async () => {
  const harness = await createCoordinatorHarness({
    handlerInvoke: rejectingHandler,
  });
  const issued = await issueAssignment(harness);
  const submission = submissionFor(harness, issued);
  await harness.coordinator.execute(
    harness.storeId,
    await submitCommand(harness, issued, submission),
  );
  const snapshot = await harness.store.read(harness.storeId);
  const journal = structuredClone(snapshot.journal);
  const outcomes = structuredClone(
    snapshot.idempotencyOutcomeView,
  );
  const storedByReference = new Map(
    snapshot.workspace.spec.resourceVersions.map(
      (stored) => [canonicalize(stored.reference), stored],
    ),
  );

  journal[0].workspaceEffect.retainedResources.push(
    journal[1].workspaceEffect.retainedResources.shift(),
  );
  journal[0].workspaceEffect.historyReferences.push(
    journal[1].workspaceEffect.historyReferences.shift(),
  );
  refreshEvidenceRecord(
    journal[0],
    outcomes[0].outcome,
    harness.identity.genesisChainDigest(),
    storedByReference,
    harness.identity,
  );
  outcomes[0].recordDigest = journal[0].recordDigest;
  refreshEvidenceRecord(
    journal[1],
    outcomes[1].outcome,
    journal[0].recordDigest,
    storedByReference,
    harness.identity,
  );
  outcomes[1].recordDigest = journal[1].recordDigest;

  assert.throws(
    () => replayCoordinatorSnapshot(harness, snapshot, {
      journal,
      idempotencyOutcomeView: outcomes,
    }),
    (error) =>
      error.code === "JOURNAL_WORKSPACE_EFFECT_POSTIMAGE_MISMATCH" ||
      error.code === "JOURNAL_WORKSPACE_EFFECT_MISMATCH",
  );
});
