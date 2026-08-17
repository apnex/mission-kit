import { validateJsonSchema } from "../engine/schema-validator.mjs";
import { ValidationError } from "../engine/errors.mjs";
import { ANALYTICAL_SCHEMA_CONTRACTS } from "./contracts.mjs";
import { stabilizeJson } from "./input-boundary.mjs";

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function unique(values) {
  return new Set(values).size === values.length;
}

function disjoint(groups) {
  const all = groups.flat();
  return unique(all);
}

const semanticChecks = {
  "analysis-plan.schema.json"(value) {
    const metricIds = [
      ...value.primaryMetricIds,
      ...value.secondaryMetricIds,
      ...value.diagnosticMetricIds,
    ];
    const stratumWeight = value.stratumWeights.reduce(
      (total, entry) => total + entry.weight,
      0,
    );
    if (
      !unique(metricIds) ||
      !unique(value.stratumWeights.map((entry) => entry.stratumId)) ||
      Math.abs(stratumWeight - 1) > 1e-12 ||
      value.multiplicity.alpha <= 0 ||
      value.multiplicity.alpha >= 1 ||
      (value.multiplicity.purpose !== "exploratory_diagnostic" &&
        value.multiplicity.procedure === "fdr")
    ) {
      throw new ValidationError("Analysis plan violates sealed analytical invariants");
    }
  },
  "analysis-result.schema.json"(value) {
    const populationClasses = value.populationViews.map(
      (view) => view.populationClass,
    );
    const metricResultPairs = value.metricResults.map(
      (result) => `${result.metricId}\u0000${result.armId}`,
    );
    const metricResultSemanticsValid = value.metricResults.every(
      (result) => {
        if (
          result.metricResultId !==
          `${result.metricId}:${result.armId}`
        ) {
          return false;
        }
        if (result.status === "observed") {
          return (
            Number.isFinite(result.value) &&
            Number.isFinite(result.lower) &&
            Number.isFinite(result.upper) &&
            result.lower <= result.value &&
            result.value <= result.upper
          );
        }
        if (
          [
            "not_observed",
            "not_judgeable",
            "structural_missing",
          ].includes(result.status)
        ) {
          return (
            result.value === null &&
            result.lower === null &&
            result.upper === null
          );
        }
        if (result.status === "unresolved_bounded") {
          return (
            result.value === null &&
            Number.isFinite(result.lower) &&
            Number.isFinite(result.upper) &&
            result.lower <= result.upper
          );
        }
        return false;
      },
    );
    if (
      !unique(
        value.metricResults.map(
          (result) => result.metricResultId,
        ),
      ) ||
      !unique(metricResultPairs) ||
      !metricResultSemanticsValid ||
      !unique(value.effects.map((effect) => effect.effectId)) ||
      value.effects.some(
        (effect) =>
          effect.interval.lower > effect.interval.upper ||
          (
            effect.status === "estimated" &&
            !Number.isFinite(effect.estimate)
          ) ||
          (
            effect.status === "not_estimable" &&
            (
              effect.estimate !== null ||
              effect.practicalClass !== "uncertain"
            )
          ),
      ) ||
      !unique(populationClasses) ||
      ![
        "all_assigned",
        "instrument_valid",
        "release_eligible",
      ].every((populationClass) => populationClasses.includes(populationClass)) ||
      value.populationViews.some(
        (view) =>
          view.observedCount + view.missingCount !== view.assignmentCount,
      ) ||
      value.missingnessResults.some(
        (result) =>
          result.treatmentObservedCount +
              result.treatmentMissingCount !==
            result.treatmentAssignmentCount ||
          result.controlObservedCount +
              result.controlMissingCount !==
            result.controlAssignmentCount ||
          result.treatmentFailureCount >
            result.treatmentAssignmentCount ||
          result.controlFailureCount >
            result.controlAssignmentCount ||
          result.lowerContrastBound >
            result.upperContrastBound ||
          result.treatmentMissingRate !==
            (
              result.treatmentAssignmentCount === 0
                ? null
                : result.treatmentMissingCount /
                  result.treatmentAssignmentCount
            ) ||
          result.controlMissingRate !==
            (
              result.controlAssignmentCount === 0
                ? null
                : result.controlMissingCount /
                  result.controlAssignmentCount
            ),
      )
    ) {
      throw new ValidationError(
        "Analysis result violates population or identity invariants",
      );
    }
  },
  "agreement-report.schema.json"(value) {
    if (
      (value.status === "estimated") !== Number.isFinite(value.estimate) ||
      (value.status === "estimated") !== (value.interval !== null) ||
      value.ratingCount < value.unitCount ||
      value.judgeCount < 2
    ) {
      throw new ValidationError("Agreement report status is internally inconsistent");
    }
  },
  "review-aggregation.schema.json"(value) {
    if (
      !disjoint([
        value.validResultIds,
        value.failedSlotIds,
        value.unusedCapacityIds,
      ]) ||
      value.minimumValidSatisfied !==
        (value.validResultIds.length >= value.minimumValidCount) ||
      (value.measurementStatus === "judgeable" &&
        value.agreementReportDigest === null) ||
      value.adjudicationTriggered !== (value.triggerReasonIds.length > 0)
    ) {
      throw new ValidationError(
        "Review aggregation violates registered slot or trigger invariants",
      );
    }
  },
  "rubric.schema.json"(value) {
    const dimensionIds = value.dimensions.map(
      (dimension) => dimension.dimensionId,
    );
    const denominatorIds = value.fixedExposureDenominators.map(
      (entry) => entry.dimensionId,
    );
    if (
      !unique(dimensionIds) ||
      !unique(denominatorIds) ||
      dimensionIds.length !== denominatorIds.length ||
      dimensionIds.some((dimensionId) => !denominatorIds.includes(dimensionId)) ||
      value.dimensions.some(
        (dimension) =>
          !unique(dimension.obligationIds) ||
          !unique(dimension.anchors.map((anchor) => JSON.stringify(anchor.value))),
      )
    ) {
      throw new ValidationError("Rubric violates dimension or exposure invariants");
    }
  },
  "metric-descriptor.schema.json"(value) {
    if (
      value.attentionEconomicClass === "learning_investment" &&
      !["descriptive", "protected-descriptive"].includes(value.direction)
    ) {
      throw new ValidationError(
        "Learning-investment metric cannot be an adverse decision objective",
      );
    }
  },
  "qualification-overlay.schema.json"(value) {
    if (!unique(value.mappings.map((mapping) => mapping.metricId))) {
      throw new ValidationError("Qualification overlay repeats a metric mapping");
    }
  },
  "recommendation.schema.json"(value) {
    if (
      value.class === "insufficient_or_invalid_evidence" &&
      value.supportedClaimIds.length > 0
    ) {
      throw new ValidationError(
        "Insufficient evidence recommendation cannot support claims",
      );
    }
  },
  "calibration-corpus.schema.json"(value) {
    if (value.calibrationCohortDigest === value.holdoutCohortDigest) {
      throw new ValidationError(
        "Calibration and holdout cohorts must be independently sealed",
      );
    }
  },
  "control-delta-audit.schema.json"(value) {
    const expectedPassed =
      value.forbiddenDifferencePaths.length === 0 &&
      value.doctrineLeakTerms.length === 0 &&
      value.manipulationChecks.every((check) => check.passed);
    if (value.passed !== expectedPassed) {
      throw new ValidationError(
        "Control-delta audit pass state contradicts its evidence",
      );
    }
  },
};

export function sealAnalyticalContract(filename, input) {
  filename = stabilizeJson(filename);
  const schema = ANALYTICAL_SCHEMA_CONTRACTS[filename];
  if (!schema) {
    throw new ValidationError("Unknown analytical schema contract", { filename });
  }
  const inert = stabilizeJson(input);
  const result = validateJsonSchema(inert, schema);
  if (!result.valid) {
    throw new ValidationError("Analytical object violates its sealed contract", {
      filename,
      errors: result.errors,
    });
  }
  semanticChecks[filename]?.(inert);
  return deepFreeze(inert);
}

export const sealAnalysisPlan = (input) =>
  sealAnalyticalContract("analysis-plan.schema.json", input);
export const sealAnalysisResult = (input) =>
  sealAnalyticalContract("analysis-result.schema.json", input);
export const sealAgreementReport = (input) =>
  sealAnalyticalContract("agreement-report.schema.json", input);
export const sealReviewAggregation = (input) =>
  sealAnalyticalContract("review-aggregation.schema.json", input);
export const sealRubric = (input) =>
  sealAnalyticalContract("rubric.schema.json", input);
export const sealMetricDescriptor = (input) =>
  sealAnalyticalContract("metric-descriptor.schema.json", input);
export const sealQualificationOverlay = (input) =>
  sealAnalyticalContract("qualification-overlay.schema.json", input);
export const sealRecommendation = (input) =>
  sealAnalyticalContract("recommendation.schema.json", input);
export const sealCalibrationCorpus = (input) =>
  sealAnalyticalContract("calibration-corpus.schema.json", input);
export const sealControlDeltaAudit = (input) =>
  sealAnalyticalContract("control-delta-audit.schema.json", input);
