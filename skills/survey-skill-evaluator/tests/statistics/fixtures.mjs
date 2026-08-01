export const blockedObservations = Object.freeze([
  { blockId: "b1", stratum: "s1", arm: "treatment", outcome: 8 },
  { blockId: "b1", stratum: "s1", arm: "control", outcome: 5 },
  { blockId: "b2", stratum: "s1", arm: "treatment", outcome: 5 },
  { blockId: "b2", stratum: "s1", arm: "control", outcome: 4 },
  { blockId: "b3", stratum: "s2", arm: "treatment", outcome: 9 },
  { blockId: "b3", stratum: "s2", arm: "control", outcome: 5 },
  { blockId: "b4", stratum: "s2", arm: "treatment", outcome: 3 },
  { blockId: "b4", stratum: "s2", arm: "control", outcome: 4 },
]);

const HASH_PROFILE_ID = "survey-evaluator-sha256-jcs-v1";
const DIGEST = "a".repeat(64);

function planEnvelope(dependencePlanId) {
  return {
    schemaVersion: "1.0.0",
    hashProfileId: HASH_PROFILE_ID,
    dependencePlanId,
    targetPopulation: "eligible_trials",
    estimatorId: "blocked_contrast_v1",
    resamplerId: "dependence_resampler_v1",
    seedCommitmentDigest: DIGEST,
  };
}

export function clusteredPlan(overrides = {}) {
  return {
    ...planEnvelope("clustered-blocks"),
    factors: [
      {
        factorId: "block",
        sampling: "sampled",
        relation: "root",
        field: "blockId",
        parentFactorId: null,
        generalizationPopulation: "eligible_blocks",
        assignmentMechanism: null,
        clusterCountFloor: 2,
      },
    ],
    stratumFields: ["stratum"],
    blockFields: ["blockId"],
    assignmentBased: false,
    resamplingMethod: "stratified_cluster_bootstrap",
    effectiveIndependentClusterCounts: [
      { factorId: "block", count: 4 },
    ],
    ...overrides,
  };
}

export function crossedPlan(overrides = {}) {
  return {
    ...planEnvelope("crossed-scenario-director"),
    factors: [
      {
        factorId: "scenario",
        sampling: "sampled",
        relation: "root",
        field: "scenarioId",
        parentFactorId: null,
        generalizationPopulation: "eligible_scenarios",
        assignmentMechanism: null,
        clusterCountFloor: 2,
      },
      {
        factorId: "director",
        sampling: "sampled",
        relation: "crossed",
        field: "directorId",
        parentFactorId: null,
        generalizationPopulation: "eligible_directors",
        assignmentMechanism: null,
        clusterCountFloor: 2,
      },
    ],
    stratumFields: [],
    blockFields: ["scenarioId"],
    assignmentBased: false,
    resamplingMethod: "multiway_cluster_bootstrap",
    effectiveIndependentClusterCounts: [
      { factorId: "scenario", count: 2 },
      { factorId: "director", count: 2 },
    ],
    ...overrides,
  };
}

export function assignmentPlan() {
  return {
    ...planEnvelope("sealed-block-assignment"),
    factors: [
      {
        factorId: "block",
        sampling: "fixed",
        relation: "root",
        field: "blockId",
        parentFactorId: null,
        generalizationPopulation: null,
        assignmentMechanism: "within_block_permutation",
        clusterCountFloor: 0,
      },
    ],
    blockFields: ["blockId"],
    stratumFields: [],
    assignmentBased: true,
    resamplingMethod: "assignment_randomization",
    effectiveIndependentClusterCounts: [],
  };
}
