import assert from "node:assert/strict";
import test from "node:test";
import {
  measureConformanceRegistry,
} from "../../source/executables/evidence/index.mjs";

test("EM09 keeps objective conformance failures distinct from semantic quality", () => {
  const result = measureConformanceRegistry({
    registryId: "objective-lens",
    rules: [
      {
        ruleId: "state-resume",
        dimension: "state_resume",
        criterion: "Resume preserves exact revision ancestry.",
      },
      {
        ruleId: "artifact",
        dimension: "artifact",
        criterion: "Artifact digest matches frozen bytes.",
      },
    ],
    observations: [
      {
        ruleId: "state-resume",
        status: "pass",
        evidenceRefs: ["event:resume"],
      },
      {
        ruleId: "artifact",
        status: "fail",
        evidenceRefs: ["finding:digest-drift"],
      },
    ],
  });
  assert.equal(result.semanticJudgmentIncluded, false);
  assert.equal(result.results.find((entry) => entry.ruleId === "artifact").status, "fail");
  assert.equal(result.fixedRuleDenominator, 2);
});
