import assert from "node:assert/strict";
import test from "node:test";
import {
  resealWorkspace,
} from "../../../source/authoring/runtime/workspace-application.mjs";
import {
  errorCode,
  makeEvidenceJournalScenario,
  rehashRecord,
  replayScenario,
} from "./support.mjs";

test("replay rejects an undeclared Workspace metadata rewrite even after terminal and record digests are recomputed", () => {
  const scenario = makeEvidenceJournalScenario();
  const rewritten = structuredClone(scenario.workspace);
  rewritten.metadata.name = "rewritten-workspace";
  const workspace = resealWorkspace(rewritten);
  const journal = structuredClone(scenario.journal);
  const outcomes = structuredClone(scenario.outcomes);
  journal[0].afterWorkspaceIntegrityDigest =
    workspace.spec.integrity.workspaceIntegrityDigest;
  rehashRecord(journal[0], scenario.identity.identity);
  outcomes[0].recordDigest = journal[0].recordDigest;

  assert.equal(
    errorCode(() => replayScenario(scenario, {
      workspace,
      journal,
      idempotencyOutcomeView: outcomes,
    })),
    "JOURNAL_WORKSPACE_INTEGRITY_TAMPERED",
  );
});
