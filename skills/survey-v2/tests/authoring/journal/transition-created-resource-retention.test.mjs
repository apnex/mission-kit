import assert from "node:assert/strict";
import test from "node:test";
import {
  resealWorkspace,
} from "../../../source/authoring/runtime/workspace-application.mjs";
import {
  acceptSubmission,
  createCoordinatorHarness,
  issueAssignment,
  submissionFor,
} from "../transactions/coordinator/support.mjs";
import {
  rehashJournalRecord,
  replayCoordinatorSnapshot,
} from "./coordinator-snapshot-support.mjs";

test("accepted-transition replay requires every resource declared as created by its Mutation", async () => {
  const harness = await createCoordinatorHarness();
  const issued = await issueAssignment(harness);
  await acceptSubmission(
    harness,
    issued,
    submissionFor(harness, issued),
  );
  const snapshot = await harness.store.read(harness.storeId);
  const rewritten = structuredClone(snapshot.workspace);
  rewritten.spec.resourceVersions =
    rewritten.spec.resourceVersions.filter(
      ({ resource }) => resource.kind !== "Brief",
    );
  const workspace = resealWorkspace(rewritten);
  const journal = structuredClone(snapshot.journal);
  const outcomes = structuredClone(
    snapshot.idempotencyOutcomeView,
  );
  journal[1].workspaceEffect.retainedResources =
    journal[1].workspaceEffect.retainedResources.filter(
      ({ reference }) => reference.kind !== "Brief",
    );
  journal[1].afterWorkspaceIntegrityDigest =
    workspace.spec.integrity.workspaceIntegrityDigest;
  rehashJournalRecord(journal[1], harness.identity);
  outcomes[1].recordDigest = journal[1].recordDigest;

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
