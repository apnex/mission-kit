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

test("campaign analysis resolves canonical registered metrics and emits effects, missingness bounds, Holm FWER, and uncertainty-aware ranking", async () => {
  const metricRegistry = JSON.parse(
    await readFile(
      join(packageRoot, "source/manifests/metrics.json"),
      "utf8",
    ),
  );
  const result = analyzeCampaignAssignments({
    campaignId: "campaign-analysis-fixture",
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
          SEMANTIC_INTENT_ATOMS: {
            status: "observed",
            value: 1,
          },
          DOWNSTREAM_UTILITY: {
            status: "observed",
            value: 1,
          },
        },
      },
      {
        assignmentId: "control-1",
        armId: "control",
        blockId: "block-1",
        scenarioId: "scenario-1",
        stratumId: "all",
        metricOutcomes: {
          SEMANTIC_INTENT_ATOMS: {
            status: "observed",
            value: 0,
          },
          DOWNSTREAM_UTILITY: {
            status: "observed",
            value: 0,
          },
        },
      },
    ],
    evidenceRefs: ["a".repeat(64)],
  });

  assert.equal(result.metricResults.length, 4);
  assert.deepEqual(
    [...new Set(
      result.metricResults.map((entry) => entry.metricId),
    )].sort(),
    ["DOWNSTREAM_UTILITY", "SEMANTIC_INTENT_ATOMS"],
  );
  assert.equal(
    new Set(
      result.metricResults.map(
        (entry) => entry.metricResultId,
      ),
    ).size,
    4,
  );
  assert.equal(result.effects.length, 2);
  assert.equal(result.missingnessResults.length, 2);
  assert.equal(result.multiplicityResult.strongFwerControlled, true);
  assert.deepEqual(
    result.effects.map((effect) => effect.metricId).sort(),
    ["DOWNSTREAM_UTILITY", "SEMANTIC_INTENT_ATOMS"],
  );
  assert.deepEqual(
    result.ranking.nonDominatedCandidateIds,
    ["candidate", "control"],
  );
  assert.equal(result.ranking.candidateRankResults.length, 2);
  assert.equal(result.ranking.totalOrderSupported, false);
  assert.equal(result.derivation.rankStability.resampleCount, 100);
  assert.equal(
    result.derivation.rankStability.status,
    "estimated_randomization_pivot",
  );
  assert.equal(
    result.derivation.jointRankResampling
      .sharedArmLabelDrawsAcrossMetrics,
    true,
  );
  assert.equal(
    result.derivation.jointRankResampling
      .supportsPublicRankUncertainty,
    true,
  );
  assert.equal(
    result.effects.every(
      (effect) =>
        effect.interval.method ===
          "joint_max_absolute_blocked_randomization_pivot" &&
        effect.interval.simultaneous === true,
    ),
    true,
  );
  assert.equal(
    result.effects.every(
      (effect) => effect.interval.confidence === 0.95,
    ),
    true,
  );
  assert.match(result.derivation.derivationDigest, /^[a-f0-9]{64}$/u);
});
