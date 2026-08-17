import assert from "node:assert/strict";
import test from "node:test";
import {
  CONFORMANCE_DIMENSIONS,
  measureConformanceRegistry,
} from "../../source/executables/evidence/index.mjs";

test("conformance registry measures one objective observation per typed rule without semantic judgment", () => {
  const rules = CONFORMANCE_DIMENSIONS.map((dimension, index) => ({
    ruleId: `rule-${String(index + 1).padStart(2, "0")}`,
    dimension,
    criterion: `${dimension} evidence satisfies its registered invariant`,
  }));
  const result = measureConformanceRegistry({
    registryId: "conformance-v1",
    rules,
    observations: rules.slice(0, -1).map((rule, index) => ({
      ruleId: rule.ruleId,
      status: index === 2 ? "fail" : "pass",
      evidenceRefs: [`evidence:${rule.ruleId}`],
    })),
  });
  assert.equal(result.fixedRuleDenominator, 7);
  assert.equal(result.results.filter((entry) => entry.status === "pass").length, 5);
  assert.equal(result.results.filter((entry) => entry.status === "fail").length, 1);
  assert.equal(
    result.results.filter((entry) => entry.status === "not_observed").length,
    1,
  );
  assert.equal(result.semanticJudgmentIncluded, false);
  assert.deepEqual(
    result.dimensionResults.map((entry) => entry.dimension),
    CONFORMANCE_DIMENSIONS,
  );

  assert.throws(
    () =>
      measureConformanceRegistry({
        registryId: "conformance-v1",
        rules: [
          {
            ruleId: "semantic-score",
            dimension: "semantic",
            criterion: "The answer is good.",
          },
        ],
        observations: [],
      }),
    /objective/u,
  );
});
