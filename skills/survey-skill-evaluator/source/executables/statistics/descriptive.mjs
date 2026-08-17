import { ValidationError } from "../engine/errors.mjs";
import { stabilizeJson } from "./input-boundary.mjs";

function finite(values) {
  values = stabilizeJson(values);
  if (!Array.isArray(values) || values.some((value) => !Number.isFinite(value))) {
    throw new ValidationError("Statistic input must be an array of finite numbers");
  }
  return values;
}

function assertProbability(value, label = "Probability") {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new ValidationError(`${label} must be in [0, 1]`, { value });
  }
}

export function sum(values) {
  values = finite(values);
  return values.reduce((total, value) => total + value, 0);
}

export function mean(values) {
  values = finite(values);
  return values.length === 0 ? null : sum(values) / values.length;
}

export function quantile(values, probability) {
  values = finite(values);
  probability = stabilizeJson(probability);
  if (values.length === 0) return null;
  if (!(probability >= 0 && probability <= 1)) {
    throw new ValidationError("Quantile probability must be in [0, 1]");
  }
  const ordered = [...values].sort((a, b) => a - b);
  const index = (ordered.length - 1) * probability;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return ordered[lower];
  return ordered[lower] + (ordered[upper] - ordered[lower]) * (index - lower);
}

export function median(values) {
  return quantile(values, 0.5);
}

export function sampleVariance(values) {
  values = finite(values);
  if (values.length < 2) return null;
  const center = mean(values);
  return (
    values.reduce((total, value) => total + (value - center) ** 2, 0) /
    (values.length - 1)
  );
}

export function summarize(values) {
  values = finite(values);
  return {
    count: values.length,
    mean: mean(values),
    median: median(values),
    standardDeviation:
      values.length < 2 ? null : Math.sqrt(sampleVariance(values)),
    minimum: values.length === 0 ? null : Math.min(...values),
    q1: quantile(values, 0.25),
    q3: quantile(values, 0.75),
    maximum: values.length === 0 ? null : Math.max(...values),
  };
}

export function empiricalDistribution(
  values,
  options = {},
) {
  values = finite(values);
  if (
    options === null ||
    typeof options !== "object" ||
    Array.isArray(options) ||
    Object.keys(options).some(
      (key) => !["quantiles", "lowerTail", "upperTail"].includes(key),
    )
  ) {
    throw new ValidationError(
      "Empirical distribution accepts no implicit model assumption",
    );
  }
  const {
    quantiles = [0.05, 0.1, 0.25, 0.5, 0.75, 0.9, 0.95],
    lowerTail = undefined,
    upperTail = undefined,
  } = stabilizeJson(options);
  if (
    !Array.isArray(quantiles) ||
    quantiles.some((probability) => {
      try {
        assertProbability(probability, "Quantile");
        return false;
      } catch {
        return true;
      }
    })
  ) {
    throw new ValidationError("Empirical quantiles must be probabilities");
  }
  const ordered = [...values].sort((left, right) => left - right);
  const center = median(ordered);
  const absoluteDeviations =
    center === null ? [] : ordered.map((value) => Math.abs(value - center));
  const quantileValues = Object.fromEntries(
    [...new Set(quantiles)]
      .sort((left, right) => left - right)
      .map((probability) => [String(probability), quantile(ordered, probability)]),
  );
  const tailRates = {
    lower:
      lowerTail === undefined
        ? null
        : ordered.filter((value) => value <= lowerTail).length / ordered.length || 0,
    upper:
      upperTail === undefined
        ? null
        : ordered.filter((value) => value >= upperTail).length / ordered.length || 0,
  };
  return {
    count: ordered.length,
    mean: mean(ordered),
    median: center,
    minimum: ordered.length === 0 ? null : ordered[0],
    maximum: ordered.length === 0 ? null : ordered.at(-1),
    interquartileRange:
      ordered.length === 0
        ? null
        : quantile(ordered, 0.75) - quantile(ordered, 0.25),
    medianAbsoluteDeviation: median(absoluteDeviations),
    quantiles: quantileValues,
    empiricalCdf: ordered.map((value, index) => ({
      value,
      cumulativeProbability: (index + 1) / ordered.length,
    })),
    tailRates,
    distributionAssumption: "empirical_nonparametric",
    normalityAssumed: false,
  };
}

export function probabilityOfSuperiority(treatment, control) {
  treatment = finite(treatment);
  control = finite(control);
  if (treatment.length === 0 || control.length === 0) return null;
  let wins = 0;
  let ties = 0;
  for (const treatmentValue of treatment) {
    for (const controlValue of control) {
      if (treatmentValue > controlValue) wins += 1;
      if (treatmentValue === controlValue) ties += 1;
    }
  }
  return (wins + 0.5 * ties) / (treatment.length * control.length);
}

export function cliffsDelta(treatment, control) {
  const probability = probabilityOfSuperiority(treatment, control);
  return probability === null ? null : 2 * probability - 1;
}

export function binaryRiskSummary(treatment, control) {
  treatment = stabilizeJson(treatment);
  control = stabilizeJson(control);
  if (
    !Array.isArray(treatment) ||
    !Array.isArray(control) ||
    [...treatment, ...control].some((value) => value !== 0 && value !== 1)
  ) {
    throw new ValidationError("Binary risk input must contain only 0 and 1");
  }
  const treatmentRisk = mean(treatment);
  const controlRisk = mean(control);
  const stableRatio =
    treatmentRisk !== null && controlRisk !== null && controlRisk > 0;
  return {
    treatmentCount: treatment.length,
    controlCount: control.length,
    treatmentRisk,
    controlRisk,
    riskDifference:
      treatmentRisk === null || controlRisk === null
        ? null
        : treatmentRisk - controlRisk,
    riskRatio: stableRatio ? treatmentRisk / controlRisk : null,
    riskRatioStatus: stableRatio ? "observed" : "unstable_zero_or_empty_control",
  };
}

export function hodgesLehmannShift(treatment, control) {
  treatment = finite(treatment);
  control = finite(control);
  if (treatment.length === 0 || control.length === 0) return null;
  const pairwiseShifts = [];
  for (const treatmentValue of treatment) {
    for (const controlValue of control) {
      pairwiseShifts.push(treatmentValue - controlValue);
    }
  }
  return median(pairwiseShifts);
}

export function pairedEffects(pairs) {
  pairs = stabilizeJson(pairs);
  if (!Array.isArray(pairs)) throw new ValidationError("Pairs must be an array");
  const valid = [];
  const missing = [];
  for (const pair of pairs) {
    if (Number.isFinite(pair.treatment) && Number.isFinite(pair.control)) {
      valid.push({
        pairId: pair.pairId,
        stratum: pair.stratum ?? null,
        difference: pair.treatment - pair.control,
      });
    } else {
      missing.push({
        pairId: pair.pairId,
        treatmentObserved: Number.isFinite(pair.treatment),
        controlObserved: Number.isFinite(pair.control),
      });
    }
  }
  return {
    allAssignedCount: pairs.length,
    validPairCount: valid.length,
    missing,
    differences: valid,
    summary: summarize(valid.map((pair) => pair.difference)),
  };
}

export function boundedMissingness(input) {
  let { observed, missingCount, lowerBound, upperBound } = stabilizeJson(input);
  observed = finite(observed);
  if (!Number.isSafeInteger(missingCount) || missingCount < 0) {
    throw new ValidationError("Missing count must be a non-negative integer");
  }
  const denominator = observed.length + missingCount;
  if (denominator === 0) return { lowerMean: null, upperMean: null, denominator };
  if (
    !Number.isFinite(lowerBound) ||
    !Number.isFinite(upperBound) ||
    lowerBound > upperBound
  ) {
    throw new ValidationError("Missingness bounds must be finite and ordered", {
      lowerBound,
      upperBound,
    });
  }
  return {
    lowerMean: (sum(observed) + missingCount * lowerBound) / denominator,
    upperMean: (sum(observed) + missingCount * upperBound) / denominator,
    denominator,
  };
}
