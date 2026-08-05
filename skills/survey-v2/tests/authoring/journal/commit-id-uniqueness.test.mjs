import assert from "node:assert/strict";
import test from "node:test";
import {
  appendTransitionScenario,
  errorCode,
  rehashRecord,
  replayScenario,
} from "./support.mjs";

test("a commit ID is globally unique within one journal", () => {
  const scenario = appendTransitionScenario();
  const journal = structuredClone(scenario.journal);
  journal[1].commitId = journal[0].commitId;
  rehashRecord(journal[1], scenario.identity.identity);
  assert.equal(errorCode(() => replayScenario(scenario, {
    journal,
  })), "JOURNAL_COMMIT_ID_DUPLICATE");
});
