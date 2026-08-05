import assert from "node:assert/strict";
import test from "node:test";
import {
  appendTransitionScenario,
  errorCode,
  rehashRecord,
  replayScenario,
} from "./support.mjs";

test("a discontinuous before revision is refused even with a valid record digest", () => {
  const scenario = appendTransitionScenario();
  const journal = structuredClone(scenario.journal);
  journal[1].before.evidenceRevision = 0;
  journal[1].after.evidenceRevision = 1;
  rehashRecord(journal[1], scenario.identity.identity);
  assert.equal(errorCode(() => replayScenario(scenario, {
    journal,
  })), "JOURNAL_REVISION_DISCONTINUITY");
});
