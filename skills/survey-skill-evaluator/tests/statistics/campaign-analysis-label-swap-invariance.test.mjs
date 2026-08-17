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

const ARM_SWAP = Object.freeze({
  candidate: "control",
  control: "candidate",
});

function observed(value) {
  return { status: "observed", value };
}

function approximatelyEqual(actual, expected, message) {
  assert.ok(
    Math.abs(actual - expected) <= Number.EPSILON * 8,
    `${message}: expected ${expected}, received ${actual}`,
  );
}

function assignment({
  assignmentId,
  armId,
  scenarioId,
  semanticIntent,
  downstreamUtility,
}) {
  return {
    assignmentId,
    armId,
    blockId: scenarioId,
    scenarioId,
    stratumId: "all",
    metricOutcomes: {
      SEMANTIC_INTENT_ATOMS: observed(semanticIntent),
      DOWNSTREAM_UTILITY: observed(downstreamUtility),
    },
  };
}

function byMetric(entries) {
  return new Map(entries.map((entry) => [entry.metricId, entry]));
}

function byCandidate(entries) {
  return new Map(
    entries.map((entry) => [entry.candidateId, entry]),
  );
}

function withoutCandidateId(entry) {
  const { candidateId: _candidateId, ...rest } = entry;
  return rest;
}

test("production campaign analysis is antisymmetric under an exact arm-label swap", async () => {
  const metricRegistry = JSON.parse(
    await readFile(
      join(packageRoot, "source/manifests/metrics.json"),
      "utf8",
    ),
  );
  const assignments = [
    assignment({
      assignmentId: "unit-1",
      armId: "candidate",
      scenarioId: "scenario-1",
      semanticIntent: 0.9,
      downstreamUtility: 0.8,
    }),
    assignment({
      assignmentId: "unit-2",
      armId: "control",
      scenarioId: "scenario-1",
      semanticIntent: 0.2,
      downstreamUtility: 0.3,
    }),
    assignment({
      assignmentId: "unit-3",
      armId: "candidate",
      scenarioId: "scenario-2",
      semanticIntent: 0.7,
      downstreamUtility: 0.9,
    }),
    assignment({
      assignmentId: "unit-4",
      armId: "control",
      scenarioId: "scenario-2",
      semanticIntent: 0.3,
      downstreamUtility: 0.4,
    }),
    assignment({
      assignmentId: "unit-5",
      armId: "candidate",
      scenarioId: "scenario-3",
      semanticIntent: 0.8,
      downstreamUtility: 0.7,
    }),
    assignment({
      assignmentId: "unit-6",
      armId: "control",
      scenarioId: "scenario-3",
      semanticIntent: 0.1,
      downstreamUtility: 0.2,
    }),
    assignment({
      assignmentId: "unit-7",
      armId: "candidate",
      scenarioId: "scenario-4",
      semanticIntent: 0.6,
      downstreamUtility: 0.8,
    }),
    assignment({
      assignmentId: "unit-8",
      armId: "control",
      scenarioId: "scenario-4",
      semanticIntent: 0.4,
      downstreamUtility: 0.5,
    }),
  ];
  const commonInput = {
    campaignId: "campaign-analysis-label-swap",
    analysisPlan: campaignAnalysisPlanFixture(),
    metricRegistry,
    dependencePlan: campaignDependencePlanFixture(),
    evidenceRefs: ["d".repeat(64)],
  };
  const original = analyzeCampaignAssignments({
    ...commonInput,
    assignmentResults: assignments,
  });
  const swapped = analyzeCampaignAssignments({
    ...commonInput,
    assignmentResults: assignments.map((row) => ({
      ...row,
      armId: ARM_SWAP[row.armId],
    })),
  });

  const originalEffects = byMetric(original.effects);
  const swappedEffects = byMetric(swapped.effects);
  assert.deepEqual(
    [...originalEffects.keys()],
    [...swappedEffects.keys()],
  );
  for (const [metricId, effect] of originalEffects) {
    const mirror = swappedEffects.get(metricId);
    assert.equal(effect.status, "estimated");
    assert.equal(mirror.status, "estimated");
    approximatelyEqual(
      mirror.estimate,
      -effect.estimate,
      `${metricId} signed contrast`,
    );
    approximatelyEqual(
      mirror.interval.lower,
      -effect.interval.upper,
      `${metricId} lower interval endpoint`,
    );
    approximatelyEqual(
      mirror.interval.upper,
      -effect.interval.lower,
      `${metricId} upper interval endpoint`,
    );
    assert.deepEqual(
      {
        effectId: mirror.effectId,
        estimandId: mirror.estimandId,
        effectiveClusterCounts:
          mirror.effectiveClusterCounts,
        intervalConfidence: mirror.interval.confidence,
        intervalMethod: mirror.interval.method,
        intervalSimultaneous: mirror.interval.simultaneous,
      },
      {
        effectId: effect.effectId,
        estimandId: effect.estimandId,
        effectiveClusterCounts:
          effect.effectiveClusterCounts,
        intervalConfidence: effect.interval.confidence,
        intervalMethod: effect.interval.method,
        intervalSimultaneous: effect.interval.simultaneous,
      },
    );
  }

  assert.deepEqual(
    swapped.multiplicityResult,
    original.multiplicityResult,
  );
  const originalInference = byMetric(
    original.derivation.inferenceProducts,
  );
  const swappedInference = byMetric(
    swapped.derivation.inferenceProducts,
  );
  for (const [metricId, product] of originalInference) {
    const mirror = swappedInference.get(metricId);
    approximatelyEqual(
      mirror.randomization.observed,
      -product.randomization.observed,
      `${metricId} registered randomization statistic`,
    );
    assert.deepEqual(
      {
        method: mirror.randomization.method,
        dependencePlanId:
          mirror.randomization.dependencePlanId,
        alternative: mirror.randomization.alternative,
        randomizationCount:
          mirror.randomization.randomizationCount,
        pValue: mirror.randomization.pValue,
        seedDigest: mirror.randomization.seedDigest,
        statisticTrustBoundary:
          mirror.randomization.statisticTrustBoundary,
      },
      {
        method: product.randomization.method,
        dependencePlanId:
          product.randomization.dependencePlanId,
        alternative: product.randomization.alternative,
        randomizationCount:
          product.randomization.randomizationCount,
        pValue: product.randomization.pValue,
        seedDigest: product.randomization.seedDigest,
        statisticTrustBoundary:
          product.randomization.statisticTrustBoundary,
      },
    );
  }

  const originalMissingness = byMetric(
    original.missingnessResults,
  );
  const swappedMissingness = byMetric(
    swapped.missingnessResults,
  );
  for (const [metricId, result] of originalMissingness) {
    const mirror = swappedMissingness.get(metricId);
    assert.deepEqual(
      {
        treatmentAssignmentCount:
          mirror.treatmentAssignmentCount,
        treatmentObservedCount:
          mirror.treatmentObservedCount,
        treatmentMissingCount: mirror.treatmentMissingCount,
        treatmentFailureCount: mirror.treatmentFailureCount,
        controlAssignmentCount: mirror.controlAssignmentCount,
        controlObservedCount: mirror.controlObservedCount,
        controlMissingCount: mirror.controlMissingCount,
        controlFailureCount: mirror.controlFailureCount,
        treatmentMissingRate: mirror.treatmentMissingRate,
        controlMissingRate: mirror.controlMissingRate,
      },
      {
        treatmentAssignmentCount:
          result.treatmentAssignmentCount,
        treatmentObservedCount:
          result.treatmentObservedCount,
        treatmentMissingCount: result.treatmentMissingCount,
        treatmentFailureCount: result.treatmentFailureCount,
        controlAssignmentCount: result.controlAssignmentCount,
        controlObservedCount: result.controlObservedCount,
        controlMissingCount: result.controlMissingCount,
        controlFailureCount: result.controlFailureCount,
        treatmentMissingRate: result.treatmentMissingRate,
        controlMissingRate: result.controlMissingRate,
      },
    );
    approximatelyEqual(
      mirror.lowerContrastBound,
      -result.upperContrastBound,
      `${metricId} missingness lower contrast bound`,
    );
    approximatelyEqual(
      mirror.upperContrastBound,
      -result.lowerContrastBound,
      `${metricId} missingness upper contrast bound`,
    );
  }

  assert.deepEqual(
    swapped.populationSummary,
    original.populationSummary,
  );
  assert.deepEqual(
    swapped.ranking.nonDominatedCandidateIds,
    original.ranking.nonDominatedCandidateIds,
  );
  assert.equal(
    swapped.ranking.totalOrderSupported,
    original.ranking.totalOrderSupported,
  );
  assert.deepEqual(
    swapped.derivation.rank.fronts,
    original.derivation.rank.fronts,
  );
  assert.deepEqual(
    swapped.derivation.rank.inclusiveCandidateIds,
    original.derivation.rank.inclusiveCandidateIds,
  );
  const originalRanks = byCandidate(
    original.ranking.candidateRankResults,
  );
  const swappedRanks = byCandidate(
    swapped.ranking.candidateRankResults,
  );
  for (const [candidateId, result] of originalRanks) {
    assert.deepEqual(
      withoutCandidateId(
        swappedRanks.get(ARM_SWAP[candidateId]),
      ),
      withoutCandidateId(result),
    );
  }
  assert.deepEqual(
    {
      method:
        swapped.derivation.jointRankResampling.method,
      drawCount:
        swapped.derivation.jointRankResampling.drawCount,
      status:
        swapped.derivation.jointRankResampling.status,
      sharedArmLabelDrawsAcrossMetrics:
        swapped.derivation.jointRankResampling
          .sharedArmLabelDrawsAcrossMetrics,
      posteriorProbabilityClaimed:
        swapped.derivation.jointRankResampling
          .posteriorProbabilityClaimed,
      supportsPublicRankUncertainty:
        swapped.derivation.jointRankResampling
          .supportsPublicRankUncertainty,
      intervalMethod:
        swapped.derivation.jointRandomizationIntervals
          .method,
      intervalConfidence:
        swapped.derivation.jointRandomizationIntervals
          .confidence,
      intervalSimultaneous:
        swapped.derivation.jointRandomizationIntervals
          .simultaneous,
      maximumErrorDrawDigest:
        swapped.derivation.jointRandomizationIntervals
          .maximumErrorDrawDigest,
    },
    {
      method:
        original.derivation.jointRankResampling.method,
      drawCount:
        original.derivation.jointRankResampling.drawCount,
      status:
        original.derivation.jointRankResampling.status,
      sharedArmLabelDrawsAcrossMetrics:
        original.derivation.jointRankResampling
          .sharedArmLabelDrawsAcrossMetrics,
      posteriorProbabilityClaimed:
        original.derivation.jointRankResampling
          .posteriorProbabilityClaimed,
      supportsPublicRankUncertainty:
        original.derivation.jointRankResampling
          .supportsPublicRankUncertainty,
      intervalMethod:
        original.derivation.jointRandomizationIntervals
          .method,
      intervalConfidence:
        original.derivation.jointRandomizationIntervals
          .confidence,
      intervalSimultaneous:
        original.derivation.jointRandomizationIntervals
          .simultaneous,
      maximumErrorDrawDigest:
        original.derivation.jointRandomizationIntervals
          .maximumErrorDrawDigest,
    },
  );
});
