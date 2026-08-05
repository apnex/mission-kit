import assert from "node:assert/strict";
import test from "node:test";
import {
  resealWorkspace,
} from "../../../source/authoring/runtime/workspace-application.mjs";
import {
  appendTransitionScenario,
  errorCode,
  rehashRecord,
  replayScenario,
} from "./support.mjs";

test("the replayed authoring head closes the terminal Workspace state", () => {
  const scenario = appendTransitionScenario();
  const workspace = structuredClone(scenario.workspace);
  workspace.spec.authoringState = "other";
  const resealed = resealWorkspace(workspace);
  const journal = structuredClone(scenario.journal);
  journal[1].after.semanticStateDigest =
    resealed.spec.integrity.semanticStateDigest;
  journal[1].afterWorkspaceIntegrityDigest =
    resealed.spec.integrity.workspaceIntegrityDigest;
  rehashRecord(journal[1], scenario.identity.identity);
  const outcomes = structuredClone(scenario.outcomes);
  outcomes[1].recordDigest = journal[1].recordDigest;
  assert.equal(errorCode(() => replayScenario(scenario, {
    workspace: resealed,
    journal,
    idempotencyOutcomeView: outcomes,
  })), "JOURNAL_TERMINAL_AUTHORING_STATE_MISMATCH");
});
