import assert from "node:assert/strict";
import test from "node:test";
import {
  evidenceMutationDigest,
} from "../../../source/authoring/runtime/commit-records.mjs";
import {
  resealWorkspace,
} from "../../../source/authoring/runtime/workspace-application.mjs";
import {
  createCoordinatorHarness,
  issueAssignment,
} from "../transactions/coordinator/support.mjs";
import {
  rehashJournalRecord,
  replayCoordinatorSnapshot,
} from "./coordinator-snapshot-support.mjs";

test("assignment issuance replay requires the retained Request ContextClosure and ProjectionArtifact DAG", async () => {
  const harness = await createCoordinatorHarness();
  await issueAssignment(harness);
  const snapshot = await harness.store.read(harness.storeId);
  const removedKinds = new Set([
    "AuthoringRequest",
    "ContextClosure",
    "ProjectionArtifact",
  ]);
  const rewritten = structuredClone(snapshot.workspace);
  rewritten.spec.resourceVersions =
    rewritten.spec.resourceVersions.filter(
      ({ resource }) => !removedKinds.has(resource.kind),
    );
  rewritten.spec.history = rewritten.spec.history.filter(
    (reference) => !removedKinds.has(reference.kind),
  );
  const workspace = resealWorkspace(rewritten);
  const journal = structuredClone(snapshot.journal);
  const outcomes = structuredClone(
    snapshot.idempotencyOutcomeView,
  );
  const record = journal[0];
  record.workspaceEffect.retainedResources =
    record.workspaceEffect.retainedResources.filter(
      ({ reference }) => !removedKinds.has(reference.kind),
    );
  record.workspaceEffect.historyReferences =
    record.workspaceEffect.historyReferences.filter(
      (reference) => !removedKinds.has(reference.kind),
    );
  record.afterWorkspaceIntegrityDigest =
    workspace.spec.integrity.workspaceIntegrityDigest;
  record.mutationDigest = evidenceMutationDigest({
    priorJournalHeadDigest: record.previousSealDigest,
    idempotency: record.idempotency,
    operationDigest: record.operationDigest,
    commandDigest: record.commandDigest,
    payloadDigest: record.payloadDigest,
    before: record.before,
    after: record.after,
    retainedResources:
      record.workspaceEffect.retainedResources,
    openAssignment: record.workspaceEffect.openAssignment,
    outcome: outcomes[0].outcome,
    mutationDigest: record.mutationDigest,
  });
  rehashJournalRecord(record, harness.identity);
  outcomes[0].recordDigest = record.recordDigest;

  assert.throws(
    () => replayCoordinatorSnapshot(harness, snapshot, {
      workspace,
      journal,
      idempotencyOutcomeView: outcomes,
    }),
    (error) =>
      error.code ===
      "JOURNAL_OUTCOME_ANCESTRY_UNRESOLVED",
  );
});
