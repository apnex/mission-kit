import {
  canonicalBytes,
  deepCloneCanonical,
  deepFreeze,
} from "../engine/canonical-json.mjs";
import {
  IntegrityError,
  ValidationError,
} from "../engine/errors.mjs";
import {
  hashCanonical,
} from "../engine/hash.mjs";
import {
  assignmentRandomizationInference,
  createDeterministicRng,
  differentialMissingnessBounds,
  empiricalDistribution,
  estimateBlockedContrast,
  holmStrongFwer,
  mapInstrumentOutcomes,
  mean,
  randomizeWithinBlocks,
  rankCandidates,
  rankStabilityFromDraws,
  quantile,
} from "../statistics/index.mjs";

const METRIC_DIRECTION = new Map([
  ["higher-is-better", "higher_better"],
  ["lower-is-better", "lower_better"],
]);
const SUPPORTED_CAUSAL_METRICS = new Map([
  [
    "SEMANTIC_INTENT_ATOMS",
    {
      direction: "higher-is-better",
      nativeUnit: "ordinal_score",
      denominatorClass: "obligation_exposure",
      missingMapping: "not_judgeable",
      failureMapping: "registered_adverse",
      aggregationRecipeId:
        "fixed_exposure_obligation_summary",
      lowerBound: 0,
      upperBound: 1,
    },
  ],
  [
    "DOWNSTREAM_UTILITY",
    {
      direction: "higher-is-better",
      nativeUnit: "rubric_score",
      denominatorClass: "downstream_itt",
      missingMapping: "typed_not_observed",
      failureMapping: "registered_adverse",
      aggregationRecipeId: "blind_downstream_itt",
      lowerBound: 0,
      upperBound: 1,
    },
  ],
]);

function compareUtf8(left, right) {
  return Buffer.from(left, "utf8").compare(Buffer.from(right, "utf8"));
}

function assertRegisteredMetrics(analysisPlan, metricRegistry) {
  if (analysisPlan.multiplicity?.procedure !== "holm") {
    throw new ValidationError(
      "Production campaign analysis implements only the registered Holm strong-FWER procedure",
      {
        procedure:
          analysisPlan.multiplicity?.procedure ?? null,
      },
    );
  }
  if (
    metricRegistry === null ||
    typeof metricRegistry !== "object" ||
    Array.isArray(metricRegistry) ||
    metricRegistry.schemaVersion !== "1.0.0" ||
    metricRegistry.hashProfileId !==
      "survey-evaluator-sha256-jcs-v1" ||
    !Array.isArray(metricRegistry.metrics)
  ) {
    throw new ValidationError(
      "Campaign analysis requires the canonical metric registry",
    );
  }
  const byId = new Map();
  for (const descriptor of metricRegistry.metrics) {
    if (
      descriptor === null ||
      typeof descriptor !== "object" ||
      Array.isArray(descriptor) ||
      typeof descriptor.metricId !== "string" ||
      byId.has(descriptor.metricId)
    ) {
      throw new ValidationError(
        "Canonical metric registry has an invalid or duplicate metric",
        { metricId: descriptor?.metricId ?? null },
      );
    }
    byId.set(descriptor.metricId, descriptor);
  }
  const primary = new Set(analysisPlan.primaryMetricIds);
  const secondary = new Set(analysisPlan.secondaryMetricIds);
  const diagnostic = new Set(analysisPlan.diagnosticMetricIds);
  const registered = new Set([
    ...analysisPlan.primaryMetricIds,
    ...analysisPlan.secondaryMetricIds,
    ...analysisPlan.diagnosticMetricIds,
  ]);
  const unsupported = [...registered].filter(
    (metricId) => !byId.has(metricId),
  );
  if (unsupported.length > 0) {
    throw new ValidationError(
      "Campaign analysis plan references a metric outside the canonical registry",
      { unsupported: unsupported.sort(compareUtf8) },
    );
  }
  const metrics = [...registered]
    .sort(compareUtf8)
    .map((metricId) => {
      const descriptor = byId.get(metricId);
      const role = primary.has(metricId)
        ? "primary"
        : secondary.has(metricId)
          ? "secondary"
          : diagnostic.has(metricId)
            ? "diagnostic"
            : null;
      const normalizedDirection =
        METRIC_DIRECTION.get(descriptor.direction) ?? null;
      const causalRecipe =
        role === "diagnostic"
          ? null
          : SUPPORTED_CAUSAL_METRICS.get(metricId) ?? null;
      if (
        role !== "diagnostic" &&
        (
          descriptor.primaryEligible !== true ||
          normalizedDirection === null ||
          causalRecipe === null ||
          descriptor.direction !== causalRecipe.direction ||
          descriptor.nativeUnit !== causalRecipe.nativeUnit ||
          descriptor.denominatorClass !==
            causalRecipe.denominatorClass ||
          descriptor.missingMapping !==
            causalRecipe.missingMapping ||
          descriptor.failureMapping !==
            causalRecipe.failureMapping ||
          descriptor.aggregationRecipeId !==
            causalRecipe.aggregationRecipeId ||
          analysisPlan.missingness.lowerBound !==
            causalRecipe.lowerBound ||
          analysisPlan.missingness.upperBound !==
            causalRecipe.upperBound
        )
      ) {
        throw new ValidationError(
          "Primary and secondary campaign metrics must have an implemented canonical causal recipe and exact bounded domain",
          {
            metricId,
            direction: descriptor.direction,
            primaryEligible: descriptor.primaryEligible,
            aggregationRecipeId:
              descriptor.aggregationRecipeId,
            nativeUnit: descriptor.nativeUnit,
            denominatorClass: descriptor.denominatorClass,
            missingMapping: descriptor.missingMapping,
            failureMapping: descriptor.failureMapping,
            lowerBound: analysisPlan.missingness.lowerBound,
            upperBound: analysisPlan.missingness.upperBound,
          },
        );
      }
      return {
        ...deepCloneCanonical(descriptor),
        role,
        normalizedDirection,
        lowerBound:
          causalRecipe?.lowerBound ??
          analysisPlan.missingness.lowerBound,
        upperBound:
          causalRecipe?.upperBound ??
          analysisPlan.missingness.upperBound,
      };
    });
  return {
    metrics,
    metricRegistryDigest: hashCanonical(
      "metric-registry/v1",
      metricRegistry,
    ),
  };
}

function armValues(observations, armId) {
  return observations
    .filter(
      (row) =>
        row.armId === armId &&
        Number.isFinite(row.metricValue),
    )
    .map((row) => row.metricValue);
}

function assertImplementedAnalysisCapability(
  analysisPlan,
  dependencePlan,
) {
  const suppliedDependencePlanDigest = hashCanonical(
    "campaign-dependence-plan/v1",
    dependencePlan,
  );
  const assignmentMechanisms = dependencePlan.factors
    .map((factor) => factor.assignmentMechanism)
    .filter((mechanism) => mechanism !== null);
  const supported =
    analysisPlan.dependencePlanDigest ===
      suppliedDependencePlanDigest &&
    analysisPlan.inference.method ===
      "assignment_randomization" &&
    dependencePlan.assignmentBased === true &&
    dependencePlan.resamplingMethod ===
      "assignment_randomization" &&
    dependencePlan.resamplerId ===
      "sealed_assignment_randomization_v1" &&
    assignmentMechanisms.length === 1 &&
    assignmentMechanisms[0] ===
      "within_block_permutation" &&
    analysisPlan.estimand.analysisUnit === "assignment" &&
    analysisPlan.estimand.contrastFunction ===
      "difference_in_means" &&
    analysisPlan.ranking.usePareto === true &&
    analysisPlan.ranking.tieRecipeId ===
      "non_dominating_front" &&
    analysisPlan.missingness.candidateFailureMapping ===
      "registered_adverse" &&
    analysisPlan.missingness.exogenousMissingRule ===
      "typed_missing" &&
    analysisPlan.missingness.completeCasePrimaryForbidden ===
      true;
  if (!supported) {
    throw new ValidationError(
      "Campaign analysis plan requests a capability outside the implemented sealed analysis adapter",
      {
        analysisDependencePlanDigest:
          analysisPlan.dependencePlanDigest,
        suppliedDependencePlanDigest,
        inferenceMethod: analysisPlan.inference.method,
        resamplingMethod: dependencePlan.resamplingMethod,
        resamplerId: dependencePlan.resamplerId,
        assignmentMechanisms,
        assignmentBased: dependencePlan.assignmentBased,
        analysisUnit: analysisPlan.estimand.analysisUnit,
        contrastFunction:
          analysisPlan.estimand.contrastFunction,
        usePareto: analysisPlan.ranking.usePareto,
        tieRecipeId: analysisPlan.ranking.tieRecipeId,
        candidateFailureMapping:
          analysisPlan.missingness.candidateFailureMapping,
        exogenousMissingRule:
          analysisPlan.missingness.exogenousMissingRule,
        completeCasePrimaryForbidden:
          analysisPlan.missingness
            .completeCasePrimaryForbidden,
      },
    );
  }
}

function practicalClass({ rejected, lower, upper, direction }) {
  if (!rejected) return "uncertain";
  if (direction === "lower_better") {
    if (upper < 0) return "superior";
    if (lower > 0) return "inferior";
  } else {
    if (lower > 0) return "superior";
    if (upper < 0) return "inferior";
  }
  if (lower === 0 && upper === 0) return "equivalent";
  return "uncertain";
}

function normalizeMetricOutcome(row, metric) {
  const outcome = row.metricOutcomes?.[metric.metricId];
  if (
    outcome === null ||
    typeof outcome !== "object" ||
    Array.isArray(outcome) ||
    !Object.hasOwn(outcome, "status") ||
    !Object.hasOwn(outcome, "value") ||
    Object.keys(outcome).length !== 2 ||
    typeof outcome.status !== "string"
  ) {
    throw new ValidationError(
      "Normalized assignment result omits a registered metric outcome",
      {
        assignmentId: row.assignmentId,
        metricId: metric.metricId,
      },
    );
  }
  if (
    outcome.status === "observed" &&
    (
      !Number.isFinite(outcome.value) ||
      (
        metric.role !== "diagnostic" &&
        (
          outcome.value < metric.lowerBound ||
          outcome.value > metric.upperBound
        )
      )
    )
  ) {
    throw new ValidationError(
      "Observed registered metric outcome is outside its sealed bounds",
      {
        assignmentId: row.assignmentId,
        metricId: metric.metricId,
        value: outcome.value,
        lowerBound: metric.lowerBound,
        upperBound: metric.upperBound,
      },
    );
  }
  if (
    outcome.status !== "observed" &&
    outcome.value !== null
  ) {
    throw new ValidationError(
      "Non-observed registered metric outcomes must not carry invented values",
      {
        assignmentId: row.assignmentId,
        metricId: metric.metricId,
        status: outcome.status,
      },
    );
  }
  return {
    metricValue: outcome.value,
    status: outcome.status,
  };
}

function jointRankResampling({
  analysisPlan,
  dependencePlan,
  armIds,
  metrics,
  rows,
  observedContrastsByMetric,
}) {
  const treatmentArmId = analysisPlan.estimand.treatmentArmId;
  const controlArmId = analysisPlan.estimand.controlArmId;
  if (
    armIds.length !== 2 ||
    !armIds.includes(treatmentArmId) ||
    !armIds.includes(controlArmId)
  ) {
    throw new ValidationError(
      "Implemented joint rank resampling requires the sealed two-arm contrast",
      { armIds, treatmentArmId, controlArmId },
    );
  }
  const stratumWeights =
    dependencePlan.stratumFields.length === 0
      ? undefined
      : Object.fromEntries(
          analysisPlan.stratumWeights.map((entry) => [
            dependencePlan.stratumFields
              .map(
                (field) =>
                  `${field}=${entry.stratumId}`,
              )
              .join("|"),
            entry.weight,
          ]),
        );
  const seed =
    `${analysisPlan.inference.seedCommitmentDigest}:joint-rank-profile`;
  const rng = createDeterministicRng(seed);
  const draws = [];
  const permutedContrastDraws = [];
  const completeRows = rows.filter((row) =>
    metrics.every((metric) =>
      Number.isFinite(row.metricValues[metric.metricId])
    )
  );
  const droppedAssignmentIds = rows
    .filter((row) => !completeRows.includes(row))
    .map((row) => row.assignmentId)
    .sort(compareUtf8);
  const completeArmIds = new Set(
    completeRows.map((row) => row.arm),
  );
  const missingObservedContrastMetricIds = metrics
    .filter(
      (metric) =>
        !Number.isFinite(
          observedContrastsByMetric.get(metric.metricId),
        ),
    )
    .map((metric) => metric.metricId)
    .sort(compareUtf8);
  if (
    armIds.some((armId) => !completeArmIds.has(armId)) ||
    missingObservedContrastMetricIds.length > 0
  ) {
    return {
      draws,
      evidence: {
        status: "not_rankable_typed_missingness",
        method: "joint_blocked_assignment_randomization",
        seed,
        drawCount: 0,
        sharedArmLabelDrawsAcrossMetrics: true,
        completeProfileCount: completeRows.length,
        droppedAssignmentIds,
        missingObservedContrastMetricIds,
        droppedProfilesAffectSelection: true,
        posteriorProbabilityClaimed: false,
        supportsPublicRankUncertainty: false,
        interpretation:
          "typed_missingness_prevents_complete_profile_null_sensitivity",
      },
    };
  }
  for (
    let drawIndex = 0;
    drawIndex < analysisPlan.inference.resampleCount;
    drawIndex += 1
  ) {
    const randomized = randomizeWithinBlocks(
      completeRows,
      {
        armField: "arm",
        blockFields: [
          ...dependencePlan.stratumFields,
          ...dependencePlan.blockFields,
        ],
        seedRng: rng,
      },
    );
    const profiles = Object.fromEntries(
      armIds.map((armId) => [armId, {}]),
    );
    const permutedContrasts = {};
    for (const metric of metrics) {
      const estimate = estimateBlockedContrast(
        randomized.map((row) => ({
          ...row,
          metricValue:
            row.metricValues[metric.metricId],
        })),
        {
          armField: "arm",
          outcomeField: "metricValue",
          treatmentArm: treatmentArmId,
          controlArm: controlArmId,
          blockFields: dependencePlan.blockFields,
          stratumFields: dependencePlan.stratumFields,
          ...(stratumWeights
            ? { stratumWeights }
            : {}),
        },
      );
      if (estimate.validBlockCount === 0) {
        throw new IntegrityError(
          "Joint rank resampling produced no matched complete block",
          { metricId: metric.metricId, drawIndex },
        );
      }
      const observed = observedContrastsByMetric.get(
        metric.metricId,
      );
      if (!Number.isFinite(observed)) {
        throw new IntegrityError(
          "Joint rank resampling lacks the registered observed contrast",
          { metricId: metric.metricId },
        );
      }
      permutedContrasts[metric.metricId] =
        estimate.estimate;
      profiles[treatmentArmId][metric.metricId] = Math.max(
        metric.lowerBound - metric.upperBound,
        Math.min(
          metric.upperBound - metric.lowerBound,
          observed - estimate.estimate,
        ),
      );
      profiles[controlArmId][metric.metricId] = 0;
    }
    draws.push(
      armIds.map((armId) => ({
        candidateId: armId,
        dimensions: profiles[armId],
      })),
    );
    permutedContrastDraws.push(permutedContrasts);
  }
  return {
    draws,
    permutedContrastDraws,
    evidence: {
      status:
        droppedAssignmentIds.length === 0
          ? "complete_randomization_pivot"
          : "instrument_valid_sensitivity_only",
      method:
        "joint_blocked_assignment_randomization_pivot",
      seed,
      drawCount: draws.length,
      sharedArmLabelDrawsAcrossMetrics: true,
      completeProfileCount: completeRows.length,
      droppedAssignmentIds,
      missingObservedContrastMetricIds: [],
      droppedProfilesAffectSelection:
        droppedAssignmentIds.length > 0,
      posteriorProbabilityClaimed: false,
      supportsPublicRankUncertainty:
        droppedAssignmentIds.length === 0,
      interpretation:
        droppedAssignmentIds.length === 0
          ? "design_based_randomization_pivot_rank_uncertainty"
          : "complete_case_sensitivity_not_public_rank_uncertainty",
    },
  };
}

function jointRandomizationIntervals({
  analysisPlan,
  metrics,
  jointRank,
  observedContrastsByMetric,
}) {
  if (
    jointRank.draws.length === 0 ||
    jointRank.evidence.supportsPublicRankUncertainty !== true
  ) {
    return {
      status: "not_estimable",
      intervals: {},
      criticalValue: null,
      convergence: null,
      drawCount: jointRank.draws.length,
    };
  }
  const maximumErrors = jointRank.permutedContrastDraws.map(
    (permutedContrasts) =>
      Math.max(
        ...metrics.map((metric) => {
          const permuted =
            permutedContrasts[metric.metricId];
          if (!Number.isFinite(permuted)) {
            throw new IntegrityError(
              "Joint randomization draw omits a registered permuted contrast",
              { metricId: metric.metricId },
            );
          }
          return Math.abs(permuted);
        }),
      ),
  );
  const confidence =
    analysisPlan.ranking.rankIntervalConfidence;
  const criticalValue = quantile(
    maximumErrors,
    confidence,
  );
  const midpoint = Math.floor(maximumErrors.length / 2);
  const firstCritical = quantile(
    maximumErrors.slice(0, midpoint),
    confidence,
  );
  const secondCritical = quantile(
    maximumErrors.slice(midpoint),
    confidence,
  );
  const maximumEffectRange = Math.max(
    ...metrics.map(
      (metric) =>
        metric.upperBound - metric.lowerBound,
    ),
  ) * 2;
  const endpointDelta = Math.abs(
    firstCritical - secondCritical,
  );
  const tolerance =
    analysisPlan.inference.convergenceTolerance *
    Math.max(1, maximumEffectRange);
  const convergence = {
    firstHalfCriticalValue: firstCritical,
    secondHalfCriticalValue: secondCritical,
    endpointDelta,
    tolerance,
    stable: endpointDelta <= tolerance,
  };
  const intervals = Object.fromEntries(
    metrics.map((metric) => {
      const observed = observedContrastsByMetric.get(
        metric.metricId,
      );
      const minimumEffect =
        metric.lowerBound - metric.upperBound;
      const maximumEffect =
        metric.upperBound - metric.lowerBound;
      return [
        metric.metricId,
        {
          lower: Math.max(
            minimumEffect,
            observed - criticalValue,
          ),
          upper: Math.min(
            maximumEffect,
            observed + criticalValue,
          ),
        },
      ];
    }),
  );
  return {
    status: convergence.stable
      ? "admissible_simultaneous_randomization_pivot"
      : "qualified_unstable_randomization_pivot",
    intervals,
    criticalValue,
    confidence,
    simultaneous: true,
    method:
      "joint_max_absolute_blocked_randomization_pivot",
    convergence,
    drawCount: maximumErrors.length,
    maximumErrorDrawDigest: hashCanonical(
      "joint-randomization-maximum-error-draws/v1",
      maximumErrors,
    ),
  };
}

/**
 * Runs the registered production analysis over the complete assignment cut.
 *
 * This function deliberately consumes only sealed analysis configuration and
 * normalized assignment outcomes. It returns schema-facing summaries plus a
 * complete protected derivation record containing the underlying
 * randomization, missingness, distribution, FWER, and ranking products.
 */
export function analyzeCampaignAssignments({
  campaignId,
  analysisPlan,
  metricRegistry,
  dependencePlan,
  assignmentResults,
  evidenceRefs,
}) {
  if (
    !Array.isArray(assignmentResults) ||
    assignmentResults.length === 0 ||
    !Array.isArray(evidenceRefs)
  ) {
    throw new ValidationError(
      "Registered campaign analysis requires assignments and evidence roots",
    );
  }
  const {
    metrics,
    metricRegistryDigest,
  } = assertRegisteredMetrics(analysisPlan, metricRegistry);
  if (metrics.length === 0) {
    throw new ValidationError(
      "Registered campaign analysis has no executable metric",
    );
  }
  const treatmentArmId = analysisPlan.estimand.treatmentArmId;
  const controlArmId = analysisPlan.estimand.controlArmId;
  const armIds = [...new Set(
    assignmentResults.map((row) => row.armId),
  )].sort(compareUtf8);
  if (
    !armIds.includes(treatmentArmId) ||
    !armIds.includes(controlArmId)
  ) {
    throw new IntegrityError(
      "Assignment cut does not contain both registered contrast arms",
      { treatmentArmId, controlArmId, armIds },
    );
  }
  assertImplementedAnalysisCapability(
    analysisPlan,
    dependencePlan,
  );

  const registeredDependenceFields = new Set([
    ...dependencePlan.blockFields,
    ...dependencePlan.stratumFields,
    ...dependencePlan.factors.map((factor) => factor.field),
  ]);
  const observations = assignmentResults.map((row) => {
    if (
      typeof row.assignmentId !== "string" ||
      typeof row.armId !== "string" ||
      typeof row.blockId !== "string" ||
      typeof row.stratumId !== "string" ||
      row.metricOutcomes === null ||
      typeof row.metricOutcomes !== "object" ||
      Array.isArray(row.metricOutcomes)
    ) {
      throw new ValidationError(
        "Normalized assignment result is incomplete",
        { assignmentId: row?.assignmentId ?? null },
      );
    }
    const observation = {
      assignmentId: row.assignmentId,
      armId: row.armId,
      arm: row.armId,
      blockId: row.blockId,
      stratumId: row.stratumId,
      metricOutcomes: deepCloneCanonical(row.metricOutcomes),
    };
    for (const field of registeredDependenceFields) {
      if (!Object.hasOwn(row, field)) {
        throw new ValidationError(
          "Normalized assignment result omits a registered dependence field",
          { assignmentId: row.assignmentId, field },
        );
      }
      observation[field] = row[field];
    }
    return observation;
  });

  const metricResults = [];
  const effectDrafts = [];
  const missingnessResults = [];
  const inferenceProducts = [];
  const distributionProducts = [];
  const missingnessProducts = [];
  const pValues = [];
  const rankDimensions = [];
  const observedContrastsByMetric = new Map();
  const decisionMetrics = metrics.filter(
    (metric) => metric.role !== "diagnostic",
  );
  const decisionAssignmentState = new Map(
    observations.map((row) => [
      row.assignmentId,
      {
        missing: false,
        failure: false,
        contamination: false,
      },
    ]),
  );
  const jointRankRowsById = new Map(
    observations.map((row) => [
      row.assignmentId,
      {
        ...deepCloneCanonical(row),
        metricValues: {},
      },
    ]),
  );
  const rankCandidatesById = new Map(
    [treatmentArmId, controlArmId].map((armId) => [armId, {
      candidateId: armId,
      dimensions: {},
    }]),
  );

  for (const metric of metrics) {
    const rawMetricObservations = observations.map((row) => ({
      ...row,
      ...normalizeMetricOutcome(row, metric),
    }));
    if (metric.role === "diagnostic") {
      for (const armId of armIds) {
        const armRows = rawMetricObservations.filter(
          (row) => row.armId === armId,
        );
        const values = armRows
          .filter(
            (row) =>
              row.status === "observed" &&
              Number.isFinite(row.metricValue),
          )
          .map((row) => row.metricValue);
        const distribution = empiricalDistribution(values);
        const statuses = new Set(
          armRows.map((row) => row.status),
        );
        metricResults.push({
          metricResultId: `${metric.metricId}:${armId}`,
          metricId: metric.metricId,
          armId,
          nativeUnit: metric.nativeUnit,
          status:
            values.length > 0
              ? "observed"
              : statuses.has("not_judgeable")
                ? "not_judgeable"
                : "not_observed",
          value: mean(values),
          lower: distribution.minimum,
          upper: distribution.maximum,
          evidenceRefs: [
            ...new Set(evidenceRefs),
          ].sort(compareUtf8),
        });
        distributionProducts.push({
          metricId: metric.metricId,
          armId,
          diagnostic: true,
          distribution,
          statuses: [...statuses].sort(compareUtf8),
        });
      }
      continue;
    }
    const mappedMetricOutcomes = mapInstrumentOutcomes(
      rawMetricObservations,
      {
        outcomeField: "metricValue",
        statusField: "status",
        direction:
          metric.normalizedDirection ?? "higher_better",
        lowerBound: metric.lowerBound,
        upperBound: metric.upperBound,
        failureMapping: metric.failureMapping,
        missingMapping: metric.missingMapping,
      },
    );
    const metricObservations = mappedMetricOutcomes.map(
      ({ record, value, mapping, missing, failure }) => {
        const assignmentState = decisionAssignmentState.get(
          record.assignmentId,
        );
        const jointRow = jointRankRowsById.get(
          record.assignmentId,
        );
        if (!assignmentState || !jointRow) {
          throw new IntegrityError(
            "Registered metric outcome lost its assignment identity",
            {
              assignmentId: record.assignmentId,
              metricId: metric.metricId,
            },
          );
        }
        assignmentState.missing ||= missing;
        assignmentState.failure ||= failure;
        assignmentState.contamination ||=
          record.status === "harness_contamination";
        jointRow.metricValues[metric.metricId] = value;
        return {
          ...record,
          metricValue: value,
          metricMapping: mapping,
          metricMissing: missing,
        };
      },
    );
    const treatmentValues = armValues(
      metricObservations,
      treatmentArmId,
    );
    const controlValues = armValues(
      metricObservations,
      controlArmId,
    );
    const contrastOptions = {
        armField: "arm",
        outcomeField: "metricValue",
        treatmentArm: treatmentArmId,
        controlArm: controlArmId,
        blockFields: dependencePlan.blockFields,
        stratumFields: dependencePlan.stratumFields,
      };
    if (dependencePlan.stratumFields.length > 0) {
      contrastOptions.stratumWeights = Object.fromEntries(
        analysisPlan.stratumWeights.map((entry) => [
          dependencePlan.stratumFields
            .map((field) => `${field}=${entry.stratumId}`)
            .join("|"),
          entry.weight,
        ]),
      );
    }
    const statistic = (rows) =>
      estimateBlockedContrast(rows, contrastOptions).estimate;
    const observedContrast = estimateBlockedContrast(
      metricObservations,
      contrastOptions,
    );
    const missingness = differentialMissingnessBounds(
      rawMetricObservations.map((row) => ({
        ...row,
        outcome: row.metricValue,
      })),
      {
        armField: "arm",
        treatmentArm: treatmentArmId,
        controlArm: controlArmId,
        outcomeField: "outcome",
        statusField: "status",
        direction:
          metric.normalizedDirection ?? "higher_better",
        lowerBound: metric.lowerBound,
        upperBound: metric.upperBound,
        failureMapping: metric.failureMapping,
        missingMapping: metric.missingMapping,
      },
    );
    const treatmentDistribution = empiricalDistribution(treatmentValues);
    const controlDistribution = empiricalDistribution(controlValues);
    if (
      treatmentValues.length > 0 &&
      controlValues.length > 0 &&
      Number.isFinite(observedContrast.estimate) &&
      missingness.treatment.missingCount === 0 &&
      missingness.control.missingCount === 0
    ) {
      observedContrastsByMetric.set(
        metric.metricId,
        observedContrast.estimate,
      );
      const randomization = assignmentRandomizationInference({
        observations: metricObservations,
        dependencePlan,
        statistic,
        iterations: analysisPlan.inference.resampleCount,
        seed:
          `${analysisPlan.inference.seedCommitmentDigest}:${metric.metricId}`,
        armField: "arm",
        alternative: "two_sided",
      });
      const effectId =
        `${analysisPlan.estimand.estimandId}:${metric.metricId}`;
      pValues.push({
        hypothesisId: effectId,
        pValue: randomization.pValue,
      });
      inferenceProducts.push({
        metricId: metric.metricId,
        randomization,
      });
      effectDrafts.push({
        effectId,
        metricId: metric.metricId,
        estimandId: analysisPlan.estimand.estimandId,
        status: "estimated",
        estimate: randomization.observed,
        interval: {
          lower: missingness.contrastBounds.lower,
          upper: missingness.contrastBounds.upper,
          confidence: 1,
          simultaneous: false,
          method:
            "worst_best_missingness_identification_region",
        },
        effectiveClusterCounts: [
          {
            factorId: "assignment_block",
            count: observedContrast.validBlockCount,
          },
        ],
        direction: metric.normalizedDirection,
      });
    } else {
      const effectId =
        `${analysisPlan.estimand.estimandId}:${metric.metricId}`;
      pValues.push({
        hypothesisId: effectId,
        pValue: 1,
      });
      inferenceProducts.push({
        metricId: metric.metricId,
        status: "not_estimable",
        reason: "no_matched_instrument_valid_arm_contrast",
        pValueContribution: 1,
        observedContrast,
      });
      effectDrafts.push({
        effectId,
        metricId: metric.metricId,
        estimandId: analysisPlan.estimand.estimandId,
        status: "not_estimable",
        estimate: null,
        interval: {
          lower: missingness.contrastBounds.lower,
          upper: missingness.contrastBounds.upper,
          confidence: 1,
          simultaneous: false,
          method:
            "worst_best_missingness_identification_region",
        },
        effectiveClusterCounts: [
          {
            factorId: "assignment_block",
            count: observedContrast.validBlockCount,
          },
        ],
        direction: metric.normalizedDirection,
      });
    }
    missingnessProducts.push({
      metricId: metric.metricId,
      result: missingness,
    });
    distributionProducts.push({
      metricId: metric.metricId,
      treatment: treatmentDistribution,
      control: controlDistribution,
    });
    missingnessResults.push({
      metricId: metric.metricId,
      denominatorDigest: hashCanonical(
        "metric-missingness-denominator/v1",
        {
          campaignId,
          metricId: metric.metricId,
          treatmentAssignmentIds: rawMetricObservations
            .filter(
              (row) => row.armId === treatmentArmId,
            )
            .map((row) => row.assignmentId)
            .sort(compareUtf8),
          controlAssignmentIds: rawMetricObservations
            .filter(
              (row) => row.armId === controlArmId,
            )
            .map((row) => row.assignmentId)
            .sort(compareUtf8),
        },
      ),
      treatmentAssignmentCount:
        missingness.treatment.allAssignedCount,
      treatmentObservedCount:
        missingness.treatment.observedCount,
      treatmentMissingCount:
        missingness.treatment.missingCount,
      treatmentFailureCount:
        missingness.treatment.failureCount,
      controlAssignmentCount:
        missingness.control.allAssignedCount,
      controlObservedCount:
        missingness.control.observedCount,
      controlMissingCount:
        missingness.control.missingCount,
      controlFailureCount:
        missingness.control.failureCount,
      treatmentMissingRate: missingness.treatment.missingRate,
      controlMissingRate: missingness.control.missingRate,
      lowerContrastBound: missingness.contrastBounds.lower,
      upperContrastBound: missingness.contrastBounds.upper,
    });
    for (const armId of armIds) {
      const values = armValues(metricObservations, armId);
      const distribution = empiricalDistribution(values);
      const armStatuses = new Set(
        rawMetricObservations
          .filter((row) => row.armId === armId)
          .map((row) => row.status),
      );
      const unresolvedBounded =
        values.length === 0 &&
        armStatuses.size > 0 &&
        [...armStatuses].every((status) =>
          ["unresolved", "unresolved_bounded"].includes(status)
        );
      const resultId = `${metric.metricId}:${armId}`;
      metricResults.push({
        metricResultId: resultId,
        metricId: metric.metricId,
        armId,
        nativeUnit: metric.nativeUnit,
        status:
          values.length > 0
            ? "observed"
            : unresolvedBounded
              ? "unresolved_bounded"
            : armStatuses.has("not_judgeable")
              ? "not_judgeable"
              : "not_observed",
        value: mean(values),
        lower:
          unresolvedBounded
            ? metric.lowerBound
            : distribution.minimum,
        upper:
          unresolvedBounded
            ? metric.upperBound
            : distribution.maximum,
        evidenceRefs: [...new Set(evidenceRefs)].sort(compareUtf8),
      });
      if (
        metric.role !== "diagnostic" &&
        rankCandidatesById.has(armId)
      ) {
        const armBounds =
          armId === treatmentArmId
            ? missingness.treatment
            : missingness.control;
        rankCandidatesById.get(armId).dimensions[metric.metricId] = {
          lower: armBounds.lowerMean,
          upper: armBounds.upperMean,
        };
      }
    }
    if (metric.role !== "diagnostic") {
      rankDimensions.push({
        dimensionId: metric.metricId,
        direction: metric.normalizedDirection,
        minimumRelevantEffect: 0,
        equivalenceMargin: 0,
      });
    }
  }

  const fwer = holmStrongFwer(
    pValues,
    analysisPlan.multiplicity.alpha,
  );
  const rejected = new Set(
    fwer.results
      .filter((result) => result.rejected)
      .map((result) => result.hypothesisId),
  );
  const jointRank = jointRankResampling({
    analysisPlan,
    dependencePlan,
    armIds,
    metrics: decisionMetrics,
    rows: [...jointRankRowsById.values()],
    observedContrastsByMetric,
  });
  const jointIntervals = jointRandomizationIntervals({
    analysisPlan,
    metrics: decisionMetrics,
    jointRank,
    observedContrastsByMetric,
  });
  const effects = effectDrafts.map((effect) => {
    const { direction, ...schemaEffect } = effect;
    const randomizationInterval =
      jointIntervals.intervals[effect.metricId] ?? null;
    const interval =
      effect.status === "estimated" &&
      randomizationInterval
        ? {
            ...randomizationInterval,
            confidence: jointIntervals.confidence,
            simultaneous:
              jointIntervals.status ===
              "admissible_simultaneous_randomization_pivot",
            method: jointIntervals.method,
          }
        : effect.interval;
    return {
      ...schemaEffect,
      interval,
      practicalClass:
        effect.status === "not_estimable" ||
        interval.simultaneous !== true
          ? "uncertain"
          : practicalClass({
              rejected: rejected.has(effect.effectId),
              lower: interval.lower,
              upper: interval.upper,
              direction,
            }),
    };
  });
  for (const effect of effects) {
    const candidate = rankCandidatesById.get(
      treatmentArmId,
    );
    const control = rankCandidatesById.get(controlArmId);
    if (candidate && control) {
      candidate.dimensions[effect.metricId] = {
        lower: effect.interval.lower,
        upper: effect.interval.upper,
      };
      control.dimensions[effect.metricId] = {
        lower: 0,
        upper: 0,
      };
    }
  }
  const rank = rankCandidates(
    [...rankCandidatesById.values()],
    rankDimensions,
  );
  const rankStability =
    jointRank.draws.length === 0
      ? {
          status: "not_rankable_typed_missingness",
          resampleCount: 0,
          candidateStability: {},
          pairwiseStability: {},
        }
      : {
          status:
            jointIntervals.status ===
              "admissible_simultaneous_randomization_pivot"
              ? "estimated_randomization_pivot"
              : "qualified_randomization_pivot",
          ...rankStabilityFromDraws(
            jointRank.draws,
            rankDimensions,
            {
              confidence:
                analysisPlan.ranking.rankIntervalConfidence,
            },
          ),
        };
  const decisionStates = [
    ...decisionAssignmentState.values(),
  ];
  const populationSummary = {
    assignmentCount: decisionStates.length,
    instrumentValidObservedCount:
      decisionStates.filter((state) => !state.missing).length,
    instrumentValidMissingCount:
      decisionStates.filter((state) => state.missing).length,
    failureCount:
      decisionStates.filter((state) => state.failure).length,
    contaminationCount:
      decisionStates.filter(
        (state) => state.contamination,
      ).length,
  };
  const publicRankAdmissible =
    jointIntervals.status ===
      "admissible_simultaneous_randomization_pivot" &&
    jointRank.evidence.supportsPublicRankUncertainty === true;
  const nonDominatedCandidateIds = publicRankAdmissible
    ? [...rank.nonDominated]
    : [...armIds];
  const candidateRankResults = publicRankAdmissible
    ? Object.entries(rankStability.candidateStability)
        .sort(([left], [right]) =>
          compareUtf8(left, right),
        )
        .map(([candidateId, stability]) => ({
          candidateId,
          medianRank: stability.medianRank,
          lowerRank: stability.rankInterval.lower,
          upperRank: stability.rankInterval.upper,
          proportionRankedBest:
            stability.proportionRankedBest,
        }))
    : [];
  const totalOrderSupported =
    publicRankAdmissible &&
    rank.totalOrderSupported &&
    Object.values(rankStability.candidateStability).every(
      (stability) =>
        stability.rankInterval.lower ===
        stability.rankInterval.upper,
    );
  const derivationCore = {
    schemaVersion: "1.0.0",
    campaignId,
    analysisPlanDigest: hashCanonical("analysis-plan/v1", analysisPlan),
    metricRegistryDigest,
    dependencePlanDigest: analysisPlan.dependencePlanDigest,
    assignmentResultDigest: hashCanonical(
      "normalized-assignment-results/v1",
      observations,
    ),
    inferenceProducts,
    distributionProducts,
    missingnessProducts,
    fwer,
    rank,
    rankStability,
    jointRankResampling: jointRank.evidence,
    jointRandomizationIntervals: jointIntervals,
    populationSummary,
    metricResults,
    effects,
    missingnessResults,
    immutable: true,
  };
  const derivation = deepFreeze({
    ...deepCloneCanonical(derivationCore),
    derivationDigest: hashCanonical(
      "registered-campaign-analysis-derivation/v1",
      derivationCore,
    ),
  });
  return deepFreeze({
    metricResults: deepCloneCanonical(metricResults),
    effects: deepCloneCanonical(effects),
    multiplicityResult: {
      procedure: analysisPlan.multiplicity.procedure,
      strongFwerControlled: fwer.strongFwerControlled,
      adjustedFindingIds: [...rejected].sort(compareUtf8),
    },
    missingnessResults: deepCloneCanonical(missingnessResults),
    ranking: {
      nonDominatedCandidateIds,
      candidateRankResults,
      totalOrderSupported,
    },
    sensitivityResultIds: missingnessResults.map((result) =>
      `${result.metricId}:worst_best_bounds`
    ),
    populationSummary: deepCloneCanonical(populationSummary),
    derivation,
  });
}
