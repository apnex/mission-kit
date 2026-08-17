import { ValidationError } from "../engine/errors.mjs";
import { hashCanonical } from "../engine/hash.mjs";
import {
  normalizeDependencePlan,
  randomizeWithinBlocks,
  resampleByDependence,
} from "./dependence.mjs";
import { mean, quantile, sampleVariance } from "./descriptive.mjs";
import { createDeterministicRng } from "./random.mjs";
import {
  stabilizeJson,
  stabilizeTrustedCallbackConfig,
} from "./input-boundary.mjs";

function valueAt(row, field) {
  const value = row?.[field];
  return value;
}

function keyFor(row, fields) {
  return fields.map((field) => `${field}=${String(valueAt(row, field))}`).join("|");
}

function unpackWeighted(input) {
  return input.map((item) =>
    item &&
    typeof item === "object" &&
    Object.hasOwn(item, "row") &&
    Object.hasOwn(item, "weight")
      ? item
      : { row: item, weight: 1 },
  );
}

function weightedMean(items) {
  let numerator = 0;
  let denominator = 0;
  for (const { value, weight } of items) {
    if (!Number.isFinite(value) || !Number.isFinite(weight) || weight < 0) {
      throw new ValidationError("Weighted estimate contains an invalid value", {
        value,
        weight,
      });
    }
    numerator += value * weight;
    denominator += weight;
  }
  return denominator === 0 ? null : numerator / denominator;
}

function normalizedWeights(ids, supplied) {
  if (supplied === undefined) {
    return Object.fromEntries(ids.map((id) => [id, 1 / ids.length]));
  }
  const weights = {};
  let total = 0;
  for (const id of ids) {
    const value = supplied[id];
    if (!Number.isFinite(value) || value < 0) {
      throw new ValidationError("Stratum weights must be finite and non-negative", {
        stratumId: id,
        value,
      });
    }
    weights[id] = value;
    total += value;
  }
  const extra = Object.keys(supplied).filter((id) => !ids.includes(id));
  if (extra.length > 0 || total <= 0) {
    throw new ValidationError("Stratum weights do not match observed strata", {
      extra,
      total,
    });
  }
  for (const id of ids) weights[id] /= total;
  return weights;
}

export function estimateBlockedContrast(
  input,
  options = {},
) {
  input = stabilizeJson(input);
  const {
    armField = "arm",
    outcomeField = "outcome",
    treatmentArm = "treatment",
    controlArm = "control",
    blockFields = ["blockId"],
    stratumFields = [],
    stratumWeights = undefined,
  } = stabilizeJson(options);
  if (
    !Array.isArray(input) ||
    !Array.isArray(blockFields) ||
    blockFields.length === 0 ||
    !Array.isArray(stratumFields)
  ) {
    throw new ValidationError(
      "Blocked contrast requires observations and non-empty block fields",
    );
  }
  const weighted = unpackWeighted(input);
  const groups = new Map();
  for (const item of weighted) {
    const blockId = keyFor(item.row, [...stratumFields, ...blockFields]);
    if (!groups.has(blockId)) {
      groups.set(blockId, {
        blockId,
        stratumId:
          stratumFields.length === 0 ? "__all__" : keyFor(item.row, stratumFields),
        treatment: [],
        control: [],
      });
    }
    const arm = item.row[armField];
    const outcome = item.row[outcomeField];
    if (!Number.isFinite(outcome)) continue;
    if (arm === treatmentArm) {
      groups.get(blockId).treatment.push({ value: outcome, weight: item.weight });
    } else if (arm === controlArm) {
      groups.get(blockId).control.push({ value: outcome, weight: item.weight });
    }
  }
  const effects = [];
  const missingBlocks = [];
  for (const group of groups.values()) {
    const treatment = weightedMean(group.treatment);
    const control = weightedMean(group.control);
    if (treatment === null || control === null) {
      missingBlocks.push({
        blockId: group.blockId,
        stratumId: group.stratumId,
        treatmentObserved: treatment !== null,
        controlObserved: control !== null,
      });
    } else {
      const treatmentWeight = mean(
        group.treatment.map((item) => item.weight),
      );
      const controlWeight = mean(group.control.map((item) => item.weight));
      effects.push({
        blockId: group.blockId,
        stratumId: group.stratumId,
        treatment,
        control,
        effect: treatment - control,
        // A resampled block must contribute according to its multiplicity. The
        // smaller supported arm weight is conservative when a crossed
        // resample gives the two arms unequal row multiplicities.
        weight: Math.min(treatmentWeight, controlWeight),
      });
    }
  }
  if (effects.length === 0) {
    return {
      estimate: null,
      validBlockCount: 0,
      allBlockCount: groups.size,
      effects,
      missingBlocks,
      byStratum: {},
      effectiveExperimentalN: 0,
    };
  }
  const stratumIds = [...new Set(effects.map((effect) => effect.stratumId))].sort();
  const weights = normalizedWeights(stratumIds, stratumWeights);
  const byStratum = {};
  let estimate = 0;
  for (const stratumId of stratumIds) {
    const stratumEffects = effects.filter(
      (effect) => effect.stratumId === stratumId,
    );
    const stratumMean = weightedMean(
      stratumEffects.map((effect) => ({
        value: effect.effect,
        weight: effect.weight,
      })),
    );
    if (stratumMean === null) {
      throw new ValidationError(
        "Resampled stratum has no arm-supported block weight",
        { stratumId },
      );
    }
    byStratum[stratumId] = {
      blockCount: stratumEffects.length,
      resampledBlockWeight: stratumEffects.reduce(
        (total, effect) => total + effect.weight,
        0,
      ),
      meanEffect: stratumMean,
      targetWeight: weights[stratumId],
    };
    estimate += stratumMean * weights[stratumId];
  }
  return {
    estimate,
    validBlockCount: effects.length,
    allBlockCount: groups.size,
    effects,
    missingBlocks,
    byStratum,
    effectiveExperimentalN: effects.reduce(
      (total, effect) => total + effect.weight,
      0,
    ),
  };
}

function intervalFrom(values, confidence) {
  const alpha = 1 - confidence;
  return {
    lower: quantile(values, alpha / 2),
    upper: quantile(values, 1 - alpha / 2),
  };
}

function bytewiseCompare(left, right) {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));
}

function nonEmptyResample(observations, plan, rng) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const sampled = resampleByDependence(observations, plan, rng);
    if (
      sampled.length > 0 &&
      sampled.some(({ weight }) => Number.isFinite(weight) && weight > 0)
    ) {
      return { sampled, rejectedEmptyDraws: attempt };
    }
  }
  throw new ValidationError(
    "Dependence resampler produced 100 all-zero-weight samples",
    {
      dependencePlanId: plan.dependencePlanId,
      resamplingMethod: plan.resamplingMethod,
    },
  );
}

function convergenceEvidence(values, confidence, tolerance) {
  const midpoint = Math.floor(values.length / 2);
  const first = intervalFrom(values.slice(0, midpoint), confidence);
  const second = intervalFrom(values.slice(midpoint), confidence);
  const scale =
    Math.max(...values) - Math.min(...values) || Math.max(1, Math.abs(mean(values)));
  const endpointDelta = Math.max(
    Math.abs(first.lower - second.lower),
    Math.abs(first.upper - second.upper),
  );
  return {
    firstHalfInterval: first,
    secondHalfInterval: second,
    normalizedEndpointDelta: endpointDelta / scale,
    tolerance,
    stable: endpointDelta / scale <= tolerance,
  };
}

export function resamplingInference(input) {
  const boundary = stabilizeTrustedCallbackConfig(
    input,
    ["statistic"],
    "Resampling inference configuration",
  );
  const {
    observations,
    dependencePlan,
    iterations = 1000,
    seed = "survey-evaluator-resampling",
    confidence = 0.95,
    convergenceTolerance = 0.05,
  } = boundary.config;
  const { statistic } = boundary.callbacks;
  if (
    !Array.isArray(observations) ||
    typeof statistic !== "function" ||
    !Number.isSafeInteger(iterations) ||
    iterations < 100 ||
    !(confidence > 0 && confidence < 1) ||
    !Number.isFinite(convergenceTolerance) ||
    convergenceTolerance <= 0
  ) {
    throw new ValidationError("Resampling inference configuration is invalid");
  }
  const plan = normalizeDependencePlan(dependencePlan, observations);
  if (
    ![
      "stratified_cluster_bootstrap",
      "multiway_cluster_bootstrap",
    ].includes(plan.resamplingMethod)
  ) {
    throw new ValidationError(
      "Resampling inference requires a registered bootstrap dependence method",
      { resamplingMethod: plan.resamplingMethod },
    );
  }
  const pointEstimate = statistic(
    observations.map((row) => ({ row, weight: 1 })),
  );
  if (!Number.isFinite(pointEstimate)) {
    throw new ValidationError("Registered statistic returned a non-finite point estimate");
  }
  const rng = createDeterministicRng({
    seed,
    dependencePlanId: plan.dependencePlanId,
  });
  const draws = [];
  let rejectedEmptyDraws = 0;
  for (let index = 0; index < iterations; index += 1) {
    const resample = nonEmptyResample(observations, plan, rng);
    rejectedEmptyDraws += resample.rejectedEmptyDraws;
    const draw = statistic(resample.sampled);
    if (!Number.isFinite(draw)) {
      throw new ValidationError("Registered statistic returned an invalid resample", {
        index,
      });
    }
    draws.push(draw);
  }
  const core = {
    method: plan.resamplingMethod,
    dependencePlanId: plan.dependencePlanId,
    pointEstimate,
    confidence,
    interval: intervalFrom(draws, confidence),
    resampleCount: draws.length,
    seedDigest: hashCanonical("statistics-seed-evidence/v1", { seed }),
    inputDigest: hashCanonical("statistics-input/v1", observations),
    convergence: convergenceEvidence(draws, confidence, convergenceTolerance),
    rejectedEmptyDraws,
    drawVectorDigest: hashCanonical("statistics-resample-draw-vector/v1", draws),
    statisticTrustBoundary: boundary.trustedCodeBoundary,
  };
  return {
    ...core,
    resultDigest: hashCanonical("resampling-result/v1", core),
    draws,
  };
}

export function assignmentRandomizationInference(input) {
  const boundary = stabilizeTrustedCallbackConfig(
    input,
    ["statistic"],
    "Randomization inference configuration",
  );
  const {
    observations,
    dependencePlan,
    iterations = 1000,
    seed = "survey-evaluator-randomization",
    armField = "arm",
    alternative = "two_sided",
  } = boundary.config;
  const { statistic } = boundary.callbacks;
  if (
    !Array.isArray(observations) ||
    typeof statistic !== "function" ||
    !Number.isSafeInteger(iterations) ||
    iterations < 100 ||
    !["two_sided", "greater", "less"].includes(alternative)
  ) {
    throw new ValidationError("Randomization-inference configuration is invalid");
  }
  const plan = normalizeDependencePlan(dependencePlan, observations);
  if (
    plan.resamplingMethod !== "assignment_randomization" ||
    plan.blockFields.length === 0
  ) {
    throw new ValidationError(
      "Randomization inference requires a sealed blocked assignment mechanism",
    );
  }
  const observed = statistic(observations);
  if (!Number.isFinite(observed)) {
    throw new ValidationError("Observed randomization statistic is not finite");
  }
  const rng = createDeterministicRng({
    seed,
    dependencePlanId: plan.dependencePlanId,
  });
  let atLeastAsExtreme = 0;
  const draws = [];
  for (let index = 0; index < iterations; index += 1) {
    const randomized = randomizeWithinBlocks(observations, {
      armField,
      blockFields: [
        ...plan.stratumFields,
        ...plan.blockFields,
      ],
      seedRng: rng,
    });
    const value = statistic(randomized);
    if (!Number.isFinite(value)) {
      throw new ValidationError(
        "Registered statistic returned an invalid randomized draw",
        { index },
      );
    }
    draws.push(value);
    const extreme =
      alternative === "greater"
        ? value >= observed
        : alternative === "less"
          ? value <= observed
          : Math.abs(value) >= Math.abs(observed);
    if (extreme) atLeastAsExtreme += 1;
  }
  const core = {
    method: "assignment_randomization",
    dependencePlanId: plan.dependencePlanId,
    observed,
    alternative,
    randomizationCount: iterations,
    pValue: (atLeastAsExtreme + 1) / (iterations + 1),
    seedDigest: hashCanonical("statistics-seed-evidence/v1", { seed }),
    drawVectorDigest: hashCanonical(
      "statistics-randomization-draw-vector/v1",
      draws,
    ),
    statisticTrustBoundary: boundary.trustedCodeBoundary,
  };
  return {
    ...core,
    resultDigest: hashCanonical("randomization-result/v1", core),
    draws,
  };
}

export function holmStrongFwer(pValues, alpha = 0.05) {
  pValues = stabilizeJson(pValues);
  alpha = stabilizeJson(alpha);
  if (
    !Array.isArray(pValues) ||
    pValues.length === 0 ||
    !Number.isFinite(alpha) ||
    alpha <= 0 ||
    alpha >= 1
  ) {
    throw new ValidationError("Holm FWER requires p-values and alpha in (0, 1)");
  }
  const ordered = pValues
    .map((entry, index) => {
      const hypothesisId =
        typeof entry === "number" ? `hypothesis-${index + 1}` : entry.hypothesisId;
      const pValue = typeof entry === "number" ? entry : entry.pValue;
      if (
        typeof hypothesisId !== "string" ||
        hypothesisId.length === 0 ||
        !Number.isFinite(pValue) ||
        pValue < 0 ||
        pValue > 1
      ) {
        throw new ValidationError("Holm FWER input is invalid", { entry });
      }
      return { hypothesisId, pValue };
    })
    .sort(
      (left, right) =>
        left.pValue - right.pValue ||
        bytewiseCompare(left.hypothesisId, right.hypothesisId),
    );
  if (new Set(ordered.map(({ hypothesisId }) => hypothesisId)).size !== ordered.length) {
    throw new ValidationError("Holm FWER hypothesis IDs must be unique");
  }
  let runningAdjusted = 0;
  let previousRejected = true;
  const results = ordered.map((entry, index) => {
    const multiplier = ordered.length - index;
    runningAdjusted = Math.max(runningAdjusted, Math.min(1, entry.pValue * multiplier));
    const localThreshold = alpha / multiplier;
    const rejected = previousRejected && entry.pValue <= localThreshold;
    previousRejected = rejected;
    return {
      ...entry,
      localThreshold,
      adjustedPValue: runningAdjusted,
      rejected,
    };
  });
  return {
    method: "holm_bonferroni_strong_fwer",
    alpha,
    familySize: ordered.length,
    strongFwerControlled: true,
    results,
  };
}

export function validateMultiplicityProcedure(input) {
  const { evidencePurpose, procedure } = stabilizeJson(input);
  const confirmatory = new Set([
    "confirmatory_causal",
    "release_assurance",
    "candidate_selection",
    "equivalence",
  ]);
  if (
    confirmatory.has(evidencePurpose) &&
    ["benjamini_hochberg_fdr", "fdr"].includes(procedure)
  ) {
    throw new ValidationError(
      "FDR cannot satisfy a confirmatory or release decision family",
      { evidencePurpose, procedure },
    );
  }
  return {
    evidencePurpose,
    procedure,
    admissible:
      !confirmatory.has(evidencePurpose) ||
      ["holm", "max_t", "simultaneous_coverage"].includes(procedure),
  };
}

function standardError(values) {
  const variance = sampleVariance(values);
  return variance === null ? null : Math.sqrt(variance / values.length);
}

export function maxStatisticSimultaneousIntervals(input) {
  const {
    units,
    hypothesisIds,
    dependencePlan,
    iterations = 1000,
    seed = "survey-evaluator-max-t",
    confidence = 0.95,
    convergenceTolerance = 0.05,
  } = stabilizeJson(input);
  if (
    !Array.isArray(units) ||
    !Array.isArray(hypothesisIds) ||
    hypothesisIds.length === 0 ||
    new Set(hypothesisIds).size !== hypothesisIds.length ||
    hypothesisIds.some(
      (hypothesisId) =>
        typeof hypothesisId !== "string" || hypothesisId.length === 0,
    ) ||
    !Number.isSafeInteger(iterations) ||
    iterations < 100 ||
    !(confidence > 0 && confidence < 1) ||
    !Number.isFinite(convergenceTolerance) ||
    convergenceTolerance <= 0
  ) {
    throw new ValidationError("Max-statistic inference requires unique hypotheses");
  }
  const plan = normalizeDependencePlan(dependencePlan, units);
  if (
    ![
      "stratified_cluster_bootstrap",
      "multiway_cluster_bootstrap",
    ].includes(plan.resamplingMethod)
  ) {
    throw new ValidationError("Max-statistic inference requires bootstrap dispatch");
  }
  const estimates = {};
  const naiveErrors = {};
  for (const hypothesisId of hypothesisIds) {
    const values = units.map((unit) => unit[hypothesisId]);
    if (values.some((value) => !Number.isFinite(value))) {
      throw new ValidationError("Max-statistic unit is missing a hypothesis value", {
        hypothesisId,
      });
    }
    estimates[hypothesisId] = mean(values);
    naiveErrors[hypothesisId] = standardError(values);
  }
  const rng = createDeterministicRng({
    seed,
    dependencePlanId: plan.dependencePlanId,
  });
  const bootstrapEstimates = Object.fromEntries(
    hypothesisIds.map((hypothesisId) => [hypothesisId, []]),
  );
  let rejectedEmptyDraws = 0;
  for (let index = 0; index < iterations; index += 1) {
    const resample = nonEmptyResample(units, plan, rng);
    rejectedEmptyDraws += resample.rejectedEmptyDraws;
    for (const hypothesisId of hypothesisIds) {
      const estimate = weightedMean(
        resample.sampled.map(({ row, weight }) => ({
          value: row[hypothesisId],
          weight,
        })),
      );
      if (!Number.isFinite(estimate)) {
        throw new ValidationError(
          "Dependence resample yielded an invalid hypothesis estimate",
          { hypothesisId, index },
        );
      }
      bootstrapEstimates[hypothesisId].push(estimate);
    }
  }
  const dependenceAwareScales = {};
  for (const hypothesisId of hypothesisIds) {
    const scale = Math.sqrt(sampleVariance(bootstrapEstimates[hypothesisId]));
    if (!Number.isFinite(scale) || scale === 0) {
      throw new ValidationError(
        "Max-statistic hypothesis has zero dependence-aware bootstrap scale",
        { hypothesisId },
      );
    }
    dependenceAwareScales[hypothesisId] = scale;
  }
  const maxima = [];
  for (let index = 0; index < iterations; index += 1) {
    let maximum = 0;
    for (const hypothesisId of hypothesisIds) {
      maximum = Math.max(
        maximum,
        Math.abs(
          (bootstrapEstimates[hypothesisId][index] - estimates[hypothesisId]) /
            dependenceAwareScales[hypothesisId],
        ),
      );
    }
    maxima.push(maximum);
  }
  const criticalValue = quantile(maxima, confidence);
  const convergence = convergenceEvidence(
    maxima,
    confidence,
    convergenceTolerance,
  );
  const intervals = {};
  for (const hypothesisId of hypothesisIds) {
    const halfWidth = criticalValue * dependenceAwareScales[hypothesisId];
    const observedT = Math.abs(
      estimates[hypothesisId] / dependenceAwareScales[hypothesisId],
    );
    intervals[hypothesisId] = {
      estimate: estimates[hypothesisId],
      dependenceAwareBootstrapScale: dependenceAwareScales[hypothesisId],
      naiveRowStandardErrorForInspection: naiveErrors[hypothesisId],
      lower: estimates[hypothesisId] - halfWidth,
      upper: estimates[hypothesisId] + halfWidth,
      adjustedPValue:
        (1 + maxima.filter((value) => value >= observedT).length) /
        (maxima.length + 1),
    };
  }
  const core = {
    method: "dependence_dispatched_bootstrap_max_t",
    dependencePlanId: plan.dependencePlanId,
    strongFwerControlled: convergence.stable,
    inferenceStatus: convergence.stable
      ? "admissible_simultaneous_inference"
      : "qualified_unstable_resampling",
    simultaneousIntervalsAdmissible: convergence.stable,
    simultaneousCoverage: confidence,
    criticalValue,
    resampleCount: iterations,
    intervals,
    rejectedEmptyDraws,
    convergence,
    seedDigest: hashCanonical("statistics-seed-evidence/v1", { seed }),
    bootstrapEstimateDigest: hashCanonical(
      "statistics-max-t-bootstrap-estimates/v1",
      bootstrapEstimates,
    ),
    maxStatisticDrawDigest: hashCanonical(
      "statistics-max-t-draw-vector/v1",
      maxima,
    ),
  };
  return {
    ...core,
    resultDigest: hashCanonical("statistics-max-t-result/v1", core),
  };
}
