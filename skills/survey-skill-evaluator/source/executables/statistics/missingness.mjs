import { ValidationError } from "../engine/errors.mjs";
import { mean, sum } from "./descriptive.mjs";
import { stabilizeJson } from "./input-boundary.mjs";

const OBSERVED = "observed";
const CANDIDATE_ADVERSE = new Set([
  "candidate_failure",
  "candidate_harm",
  "candidate_protocol_failure",
  "candidate_semantic_failure",
  "candidate_authority_incident",
]);
const EXOGENOUS_MISSING = new Set([
  "exogenous_invalidity",
  "instrument_invalidity",
  "harness_contamination",
  "infrastructure_failure",
  "unverifiable",
  "not_judgeable",
  "not_observed",
  "typed_not_observed",
  "typed_unavailable",
  "not_rankable",
  "source_artifact_unavailable",
  "structural_missing",
]);
const STRUCTURAL_MISSING_POLICIES = new Set([
  "not_judgeable",
  "not_rankable",
  "typed_not_observed",
  "typed_unavailable",
]);

function assertBounds(lowerBound, upperBound) {
  if (
    !Number.isFinite(lowerBound) ||
    !Number.isFinite(upperBound) ||
    lowerBound > upperBound
  ) {
    throw new ValidationError("Outcome bounds must be finite and ordered", {
      lowerBound,
      upperBound,
    });
  }
}

export function mapInstrumentOutcomes(
  records,
  options,
) {
  records = stabilizeJson(records);
  const {
    outcomeField = "outcome",
    statusField = "status",
    direction = "higher_better",
    lowerBound,
    upperBound,
    failureMapping = "registered_adverse",
    missingMapping = "typed_not_observed",
  } = stabilizeJson(options);
  if (!Array.isArray(records)) {
    throw new ValidationError("Instrument records must be an array");
  }
  assertBounds(lowerBound, upperBound);
  if (!["higher_better", "lower_better"].includes(direction)) {
    throw new ValidationError("Outcome direction is unknown", { direction });
  }
  if (
    failureMapping !== "registered_adverse" &&
    !STRUCTURAL_MISSING_POLICIES.has(failureMapping)
  ) {
    throw new ValidationError("Outcome failure mapping is unknown", {
      failureMapping,
    });
  }
  if (!STRUCTURAL_MISSING_POLICIES.has(missingMapping)) {
    throw new ValidationError("Outcome missing mapping is unknown", {
      missingMapping,
    });
  }
  const adverseValue = direction === "higher_better" ? lowerBound : upperBound;
  return records.map((record) => {
    const status = record[statusField] ?? OBSERVED;
    const raw = record[outcomeField];
    if (
      status === OBSERVED &&
      Number.isFinite(raw) &&
      raw >= lowerBound &&
      raw <= upperBound
    ) {
      return {
        record,
        value: raw,
        mapping: OBSERVED,
        missing: false,
        failure: false,
      };
    }
    if (status === OBSERVED && Number.isFinite(raw)) {
      throw new ValidationError(
        "Observed outcome is outside its declared bounded domain",
        { raw, lowerBound, upperBound },
      );
    }
    if (CANDIDATE_ADVERSE.has(status)) {
      if (failureMapping !== "registered_adverse") {
        return {
          record,
          value: null,
          mapping: `failure_${failureMapping}`,
          missing: true,
          failure: true,
        };
      }
      return {
        record,
        value: adverseValue,
        mapping: "candidate_adverse",
        missing: false,
        failure: true,
      };
    }
    if (EXOGENOUS_MISSING.has(status)) {
      return {
        record,
        value: null,
        mapping: `exogenous_${missingMapping}`,
        missing: true,
        failure: false,
      };
    }
    if (
      status === "unresolved" ||
      status === "unresolved_bounded"
    ) {
      return {
        record,
        value: null,
        mapping: "unresolved_bounded",
        missing: true,
        failure: false,
      };
    }
    throw new ValidationError("Outcome has no registered failure mapping", {
      status,
    });
  });
}

function armBounds(mapped, lowerBound, upperBound) {
  const observed = mapped.filter((item) => !item.missing).map((item) => item.value);
  const missingCount = mapped.length - observed.length;
  const failureCount = mapped.filter(
    (item) => item.failure,
  ).length;
  const denominator = mapped.length;
  return {
    allAssignedCount: denominator,
    observedCount: observed.length,
    missingCount,
    failureCount,
    missingRate: denominator === 0 ? null : missingCount / denominator,
    observedMean: mean(observed),
    lowerMean:
      denominator === 0
        ? null
        : (sum(observed) + missingCount * lowerBound) / denominator,
    upperMean:
      denominator === 0
        ? null
        : (sum(observed) + missingCount * upperBound) / denominator,
  };
}

export function differentialMissingnessBounds(
  records,
  options,
) {
  records = stabilizeJson(records);
  const {
    armField = "arm",
    treatmentArm = "treatment",
    controlArm = "control",
    outcomeField = "outcome",
    statusField = "status",
    direction = "higher_better",
    lowerBound,
    upperBound,
    failureMapping = "registered_adverse",
    missingMapping = "typed_not_observed",
  } = stabilizeJson(options);
  assertBounds(lowerBound, upperBound);
  const mapped = mapInstrumentOutcomes(records, {
    outcomeField,
    statusField,
    direction,
    lowerBound,
    upperBound,
    failureMapping,
    missingMapping,
  });
  const treatment = mapped.filter(
    ({ record }) => record[armField] === treatmentArm,
  );
  const control = mapped.filter(({ record }) => record[armField] === controlArm);
  if (treatment.length === 0 || control.length === 0) {
    throw new ValidationError(
      "Differential missingness requires both registered contrast arms",
      { treatmentArm, controlArm },
    );
  }
  const treatmentBounds = armBounds(treatment, lowerBound, upperBound);
  const controlBounds = armBounds(control, lowerBound, upperBound);
  const contrast = {
    lower: treatmentBounds.lowerMean - controlBounds.upperMean,
    upper: treatmentBounds.upperMean - controlBounds.lowerMean,
  };
  return {
    treatmentArm,
    controlArm,
    allAssignedCount: treatment.length + control.length,
    treatment: treatmentBounds,
    control: controlBounds,
    differentialMissingRate:
      treatmentBounds.missingRate - controlBounds.missingRate,
    contrastBounds: contrast,
    conclusionInvariant:
      direction === "higher_better" ? contrast.lower > 0 : contrast.upper < 0,
    selectionAssumption: "worst_best_registered_bounds",
    completeCasePrimaryForbidden: true,
  };
}

export function patternMixtureSensitivity(
  observedByArm,
  options,
) {
  observedByArm = stabilizeJson(observedByArm);
  const {
    treatmentArm = "treatment",
    controlArm = "control",
    deltas,
  } = stabilizeJson(options);
  if (
    !Array.isArray(deltas) ||
    deltas.length === 0 ||
    deltas.some((delta) => !Number.isFinite(delta))
  ) {
    throw new ValidationError("Pattern-mixture sensitivity requires finite deltas");
  }
  const treatment = observedByArm[treatmentArm];
  const control = observedByArm[controlArm];
  if (
    !treatment ||
    !control ||
    !Number.isFinite(treatment.observedMean) ||
    !Number.isFinite(control.observedMean)
  ) {
    throw new ValidationError(
      "Pattern-mixture sensitivity requires observed arm means",
    );
  }
  return deltas.map((delta) => {
    const treatmentMean =
      treatment.observedMean + delta * (treatment.missingRate ?? 0);
    const controlMean =
      control.observedMean + delta * (control.missingRate ?? 0);
    return { delta, treatmentMean, controlMean, contrast: treatmentMean - controlMean };
  });
}
