import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import {
  analyzeCampaignAssignments,
} from "../../source/executables/orchestrator/index.mjs";
import {
  campaignAnalysisPlanFixture,
  campaignDependencePlanFixture,
  packageRoot,
} from "../helpers/campaign-fixture.mjs";

function observed(value) {
  return { status: "observed", value };
}

function unavailable() {
  return { status: "infrastructure_failure", value: null };
}

function notJudgeable() {
  return { status: "not_judgeable", value: null };
}

test("campaign analysis retains typed exogenous missingness in the all-assigned cut without inventing a metric value", async () => {
  const metricRegistry = JSON.parse(
    await readFile(
      join(packageRoot, "source/manifests/metrics.json"),
      "utf8",
    ),
  );
  const result = analyzeCampaignAssignments({
    campaignId: "campaign-analysis-missingness",
    analysisPlan: campaignAnalysisPlanFixture(),
    metricRegistry,
    dependencePlan: campaignDependencePlanFixture(),
    assignmentResults: [
      {
        assignmentId: "candidate-1",
        armId: "candidate",
        blockId: "block-1",
        scenarioId: "scenario-1",
        stratumId: "all",
        metricOutcomes: {
          SEMANTIC_INTENT_ATOMS: notJudgeable(),
          DOWNSTREAM_UTILITY: unavailable(),
        },
      },
      {
        assignmentId: "control-1",
        armId: "control",
        blockId: "block-1",
        scenarioId: "scenario-1",
        stratumId: "all",
        metricOutcomes: {
          SEMANTIC_INTENT_ATOMS: observed(0),
          DOWNSTREAM_UTILITY: observed(0),
        },
      },
      {
        assignmentId: "candidate-2",
        armId: "candidate",
        blockId: "block-2",
        scenarioId: "scenario-2",
        stratumId: "all",
        metricOutcomes: {
          SEMANTIC_INTENT_ATOMS: observed(1),
          DOWNSTREAM_UTILITY: observed(1),
        },
      },
      {
        assignmentId: "control-2",
        armId: "control",
        blockId: "block-2",
        scenarioId: "scenario-2",
        stratumId: "all",
        metricOutcomes: {
          SEMANTIC_INTENT_ATOMS: observed(0),
          DOWNSTREAM_UTILITY: observed(0),
        },
      },
    ],
    evidenceRefs: ["b".repeat(64)],
  });

  assert.equal(result.effects.length, 2);
  assert.equal(
    result.effects.every(
      (effect) =>
        effect.status === "not_estimable" &&
        effect.estimate === null &&
        effect.practicalClass === "uncertain",
    ),
    true,
  );
  assert.equal(result.missingnessResults.length, 2);
  for (const missingness of result.missingnessResults) {
    assert.equal(missingness.treatmentMissingRate, 0.5);
    assert.equal(missingness.controlMissingRate, 0);
    assert.equal(missingness.treatmentAssignmentCount, 2);
    assert.equal(missingness.treatmentObservedCount, 1);
    assert.equal(missingness.treatmentMissingCount, 1);
    assert.equal(missingness.controlAssignmentCount, 2);
    assert.equal(missingness.controlObservedCount, 2);
    assert.equal(missingness.controlMissingCount, 0);
    assert.match(
      missingness.denominatorDigest,
      /^[a-f0-9]{64}$/u,
    );
  }
  for (const product of result.derivation.missingnessProducts) {
    assert.equal(product.result.allAssignedCount, 4);
    assert.equal(product.result.treatment.missingCount, 1);
    assert.equal(product.result.control.missingCount, 0);
  }
  assert.equal(result.ranking.totalOrderSupported, false);
  assert.deepEqual(result.ranking.candidateRankResults, []);
  assert.equal(
    result.derivation.jointRankResampling.status,
    "not_rankable_typed_missingness",
  );
});
