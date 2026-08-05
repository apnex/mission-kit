import assert from "node:assert/strict";
import test from "node:test";
import {
  createIdempotencyOutcomeEntry,
} from "../../../source/authoring/runtime/commit-records.mjs";
import {
  errorCode,
  makeEvidenceJournalScenario,
} from "./support.mjs";

test("an evidence outcome must equal the outcome sealed by its plan", () => {
  const scenario = makeEvidenceJournalScenario();

  assert.equal(errorCode(() => createIdempotencyOutcomeEntry({
    record: scenario.record,
    evidencePlan: scenario.plan,
    outcome: {
      class: "assignment-cancelled",
      assignment: scenario.outcome.assignment,
    },
  })), "EVIDENCE_COMMIT_PLAN_OUTCOME_MISMATCH");
});
