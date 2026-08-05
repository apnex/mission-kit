import assert from "node:assert/strict";
import test from "node:test";
import {
  appendTransitionScenario,
  errorCode,
  replayScenario,
} from "./support.mjs";

test("a journal outcome must resolve its exact retained result ancestry", () => {
  const scenario = appendTransitionScenario();
  const outcomes = structuredClone(scenario.outcomes);
  outcomes[1].outcome.receipt.reference.name = "missing-receipt";
  assert.equal(errorCode(() => replayScenario(scenario, {
    idempotencyOutcomeView: outcomes,
  })), "JOURNAL_OUTCOME_ANCESTRY_UNRESOLVED");
});
