import test from "node:test";
import assert from "node:assert/strict";
import {
  dependenceDiagnostics,
  normalizeDependencePlan,
} from "../../source/executables/statistics/index.mjs";

test("one sampled root with nested sampled children dispatches one-way cluster bootstrap", () => {
  const observations = [
    { campaignId: "c1", runId: "r1" },
    { campaignId: "c1", runId: "r2" },
    { campaignId: "c2", runId: "r3" },
  ];
  const plan = {
      schemaVersion: "1.0.0",
      hashProfileId: "survey-evaluator-sha256-jcs-v1",
      dependencePlanId: "nested",
      factors: [
        {
          factorId: "campaign",
          sampling: "sampled",
          relation: "root",
          field: "campaignId",
          parentFactorId: null,
          generalizationPopulation: "campaigns",
          assignmentMechanism: null,
          clusterCountFloor: 2,
        },
        {
          factorId: "run",
          sampling: "sampled",
          relation: "nested",
          field: "runId",
          parentFactorId: "campaign",
          generalizationPopulation: "runs_within_campaign",
          assignmentMechanism: null,
          clusterCountFloor: 3,
        },
      ],
      stratumFields: [],
      blockFields: ["campaignId"],
      assignmentBased: false,
      resamplingMethod: "stratified_cluster_bootstrap",
      targetPopulation: "campaign_trials",
      effectiveIndependentClusterCounts: [
        { factorId: "campaign", count: 2 },
        { factorId: "run", count: 3 },
      ],
      estimatorId: "blocked_contrast_v1",
      resamplerId: "cluster_bootstrap_v1",
      seedCommitmentDigest: "a".repeat(64),
    };
  const result = normalizeDependencePlan(plan, observations);
  const diagnostics = dependenceDiagnostics(plan, observations);
  assert.equal(result.resamplingMethod, "stratified_cluster_bootstrap");
  assert.equal(diagnostics.highestIndependentFactorId, "campaign");
  assert.equal(
    diagnostics.observedEffectiveIndependentClusterCounts.campaign,
    2,
  );
});
