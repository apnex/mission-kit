import assert from "node:assert/strict";
import test from "node:test";
import {
  consumeScenarioCohortUse,
} from "../../source/executables/orchestrator/index.mjs";

const request = (useId) => ({
  useId,
  lineageId: "lineage-a",
  scenarioAuthorityExposure: "candidate_independent",
  candidateMaterialExposed: false,
  armMapExposed: false,
  expectedDirectionExposed: false,
});

test("EM03 sequences a bounded holdout without exposing candidate truth or refunding uses", () => {
  const initial = {
    cohortId: "bounded-holdout",
    mode: "bounded_reusable_holdout",
    lineageId: "lineage-a",
    revision: 0,
    remainingUses: 2,
    consumptions: [],
  };
  const first = consumeScenarioCohortUse(initial, request("use-1"));
  const second = consumeScenarioCohortUse(first.state, request("use-2"));
  assert.equal(second.state.remainingUses, 0);
  assert.deepEqual(
    second.state.consumptions.map((entry) => entry.useId),
    ["use-1", "use-2"],
  );
  assert.throws(
    () => consumeScenarioCohortUse(second.state, request("use-3")),
    /cannot be refunded/u,
  );
});
