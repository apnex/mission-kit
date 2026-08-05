import assert from "node:assert/strict";
import test from "node:test";
import {
  errorCode,
  makeEvidenceJournalScenario,
  rehashRecord,
  replayScenario,
} from "./support.mjs";

test("the first WorkspaceEffect open-assignment pre-image is anchored by the genesis Workspace digest", () => {
  const scenario = makeEvidenceJournalScenario();
  const journal = structuredClone(scenario.journal);
  const outcomes = structuredClone(scenario.outcomes);
  journal[0].workspaceEffect.openAssignment.before =
    structuredClone(
      journal[0].workspaceEffect.openAssignment.after,
    );
  rehashRecord(journal[0], scenario.identity.identity);
  outcomes[0].recordDigest = journal[0].recordDigest;

  assert.equal(
    errorCode(() => replayScenario(scenario, {
      journal,
      idempotencyOutcomeView: outcomes,
    })),
    "JOURNAL_WORKSPACE_INTEGRITY_TAMPERED",
  );
});
