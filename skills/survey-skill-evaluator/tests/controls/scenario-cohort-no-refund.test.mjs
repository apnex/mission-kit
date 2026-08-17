import assert from "node:assert/strict";
import test from "node:test";
import {
  consumeScenarioCohortUse,
} from "../../source/executables/orchestrator/index.mjs";

test("candidate-independent scenario cohort use is exact-replay only and never refunded", () => {
  const state = {
    cohortId: "holdout-1",
    mode: "single_use",
    lineageId: "decision-lineage-7",
    revision: 0,
    remainingUses: 1,
    consumptions: [],
  };
  const request = {
    useId: "use-1",
    lineageId: "decision-lineage-7",
    scenarioAuthorityExposure: "candidate_independent",
    candidateMaterialExposed: false,
    armMapExposed: false,
    expectedDirectionExposed: false,
  };
  const consumed = consumeScenarioCohortUse(state, request);
  assert.equal(consumed.replayed, false);
  assert.equal(consumed.state.remainingUses, 0);
  assert.equal(consumed.receipt.noRefund, true);
  const replay = consumeScenarioCohortUse(consumed.state, request);
  assert.equal(replay.replayed, true);
  assert.equal(replay.receipt.receiptDigest, consumed.receipt.receiptDigest);

  assert.throws(
    () =>
      consumeScenarioCohortUse(consumed.state, {
        ...request,
        useId: "use-2",
      }),
    /cannot be refunded/u,
  );
  assert.throws(
    () =>
      consumeScenarioCohortUse(state, {
        ...request,
        candidateMaterialExposed: true,
      }),
    /candidate-independently/u,
  );
});
