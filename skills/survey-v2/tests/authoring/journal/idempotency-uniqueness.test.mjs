import assert from "node:assert/strict";
import test from "node:test";
import {
  appendTransitionScenario,
  errorCode,
  rehashRecord,
  replayScenario,
} from "./support.mjs";

test("a machine-qualified idempotency tuple identifies only one journal record", () => {
  const scenario = appendTransitionScenario();
  const journal = structuredClone(scenario.journal);
  journal[1].idempotency =
    structuredClone(journal[0].idempotency);
  rehashRecord(journal[1], scenario.identity.identity);
  assert.equal(errorCode(() => replayScenario(scenario, {
    journal,
  })), "JOURNAL_IDEMPOTENCY_DUPLICATE");
});
