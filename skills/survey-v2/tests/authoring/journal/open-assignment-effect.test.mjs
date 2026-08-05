import assert from "node:assert/strict";
import test from "node:test";
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

test("replay rejects a terminal open Assignment that differs from the journaled boundary", async () => {
  const harness = await createCoordinatorHarness();
  await issueAssignment(harness);
  const snapshot = await harness.store.read(harness.storeId);
  const rewritten = structuredClone(snapshot.workspace);
  rewritten.spec.openAssignment = null;
  const workspace = resealWorkspace(rewritten);
  const journal = structuredClone(snapshot.journal);
  const outcomes = structuredClone(
    snapshot.idempotencyOutcomeView,
  );
  journal[0].afterWorkspaceIntegrityDigest =
    workspace.spec.integrity.workspaceIntegrityDigest;
  rehashJournalRecord(journal[0], harness.identity);
  outcomes[0].recordDigest = journal[0].recordDigest;

  assert.throws(
    () => replayCoordinatorSnapshot(harness, snapshot, {
      workspace,
      journal,
      idempotencyOutcomeView: outcomes,
    }),
    (error) =>
      error.code ===
      "JOURNAL_WORKSPACE_EFFECT_POSTIMAGE_MISMATCH",
  );
});
