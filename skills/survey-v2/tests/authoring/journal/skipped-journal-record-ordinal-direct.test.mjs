import assert from "node:assert/strict";
import test from "node:test";
import {
  appendTransitionScenario,
  errorCode,
  rehashRecord,
  replayScenario,
} from "./support.mjs";

test("replay directly rejects a skipped JournalRecord ordinal", () => {
  const scenario = appendTransitionScenario();
  const journal = structuredClone(scenario.journal);
  journal[1].ordinal = 3;
  rehashRecord(journal[1], scenario.identity.identity);

  assert.equal(
    errorCode(() => replayScenario(scenario, { journal })),
    "JOURNAL_ORDINAL_DISCONTINUITY",
  );
});
