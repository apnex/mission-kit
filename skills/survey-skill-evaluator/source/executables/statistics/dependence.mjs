import { ValidationError } from "../engine/errors.mjs";
import { validateJsonSchema } from "../engine/schema-validator.mjs";
import { ANALYTICAL_SCHEMA_CONTRACTS } from "./contracts.mjs";
import {
  stabilizeConfigWithTrustedFields,
  stabilizeJson,
  stabilizeTrustedCallbackConfig,
} from "./input-boundary.mjs";

const FACTOR_KINDS = new Set(["fixed", "sampled"]);
const RELATIONS = new Set(["root", "nested", "crossed"]);
const METHODS = new Set([
  "fixed_design",
  "stratified_cluster_bootstrap",
  "multiway_cluster_bootstrap",
  "assignment_randomization",
]);

function assertFieldList(value, label) {
  if (
    value !== undefined &&
    (!Array.isArray(value) ||
      value.some((field) => typeof field !== "string" || field.length === 0) ||
      new Set(value).size !== value.length)
  ) {
    throw new ValidationError(`${label} must be a unique string array`);
  }
  return [...(value ?? [])];
}

function fieldValue(row, field) {
  const value = row?.[field];
  if (value === undefined || value === null || value === "") {
    throw new ValidationError("Dependence field is missing from an observation", {
      field,
    });
  }
  return String(value);
}

function compositeKey(row, fields) {
  return fields.map((field) => `${field.length}:${field}=${fieldValue(row, field)}`).join("|");
}

function assertAcyclic(factorsById) {
  const visiting = new Set();
  const visited = new Set();
  function visit(factorId) {
    if (visited.has(factorId)) return;
    if (visiting.has(factorId)) {
      throw new ValidationError("Dependence factor nesting contains a cycle", {
        factorId,
      });
    }
    visiting.add(factorId);
    const parent = factorsById.get(factorId)?.parentFactorId;
    if (parent) visit(parent);
    visiting.delete(factorId);
    visited.add(factorId);
  }
  for (const factorId of factorsById.keys()) visit(factorId);
}

function isNestedUnder(factor, ancestorId, factorsById) {
  let cursor = factor;
  const seen = new Set();
  while (cursor?.parentFactorId) {
    if (seen.has(cursor.factorId)) return false;
    seen.add(cursor.factorId);
    if (cursor.parentFactorId === ancestorId) return true;
    cursor = factorsById.get(cursor.parentFactorId);
  }
  return false;
}

function compileDependencePlan(plan, observations = []) {
  plan = stabilizeJson(plan);
  observations = stabilizeJson(observations);
  const schemaResult = validateJsonSchema(
    plan,
    ANALYTICAL_SCHEMA_CONTRACTS["dependence-plan.schema.json"],
  );
  if (!schemaResult.valid) {
    throw new ValidationError(
      "Dependence plan does not satisfy its sealed schema contract",
      { errors: schemaResult.errors },
    );
  }
  if (!Array.isArray(observations)) {
    throw new ValidationError("Observations must be an array");
  }
  const factorIds = new Set();
  const factors = plan.factors.map((factor) => {
    if (
      factorIds.has(factor.factorId)
    ) {
      throw new ValidationError("Dependence factor IDs must be unique", {
        factorId: factor?.factorId,
      });
    }
    factorIds.add(factor.factorId);
    const { sampling, relation, field } = factor;
    if (!FACTOR_KINDS.has(sampling) || !RELATIONS.has(relation)) {
      throw new ValidationError("Dependence factor has an unknown sampling/relation", {
        factorId: factor.factorId,
        sampling,
        relation,
      });
    }
    if (
      relation === "nested" &&
      (typeof factor.parentFactorId !== "string" ||
        factor.parentFactorId.length === 0)
    ) {
      throw new ValidationError("Nested factor requires parentFactorId", {
        factorId: factor.factorId,
      });
    }
    if (relation !== "nested" && factor.parentFactorId !== null) {
      throw new ValidationError("Only nested factors may name a parent", {
        factorId: factor.factorId,
      });
    }
    if (
      sampling === "sampled" &&
      (typeof factor.generalizationPopulation !== "string" ||
        factor.generalizationPopulation.length === 0)
    ) {
      throw new ValidationError(
        "Sampled factor requires a declared generalization population",
        { factorId: factor.factorId },
      );
    }
    return {
      factorId: factor.factorId,
      sampling,
      relation,
      field,
      parentFactorId: factor.parentFactorId,
      generalizationPopulation: factor.generalizationPopulation,
      assignmentMechanism: factor.assignmentMechanism,
      clusterCountFloor: factor.clusterCountFloor,
    };
  });
  const factorsById = new Map(factors.map((factor) => [factor.factorId, factor]));
  for (const factor of factors) {
    if (
      factor.parentFactorId &&
      (!factorsById.has(factor.parentFactorId) ||
        factor.parentFactorId === factor.factorId)
    ) {
      throw new ValidationError("Nested factor references an unknown parent", {
        factorId: factor.factorId,
        parentFactorId: factor.parentFactorId,
      });
    }
  }
  assertAcyclic(factorsById);

  const stratumFields = assertFieldList(plan.stratumFields, "stratumFields");
  const blockFields = assertFieldList(plan.blockFields, "blockFields");
  const sampled = factors.filter((factor) => factor.sampling === "sampled");
  const sampledRoots = sampled.filter(
    (factor) =>
      factor.relation !== "nested" ||
      factorsById.get(factor.parentFactorId)?.sampling !== "sampled",
  );
  const hasCrossedSampled = sampled.some((factor) => factor.relation === "crossed");
  if (
    plan.assignmentBased === true &&
    !factors.some((factor) => factor.assignmentMechanism !== null)
  ) {
    throw new ValidationError(
      "Assignment-based dependence plan requires a sealed assignment mechanism",
    );
  }
  let inferredMethod = "fixed_design";
  if (plan.assignmentBased === true) {
    inferredMethod = "assignment_randomization";
  } else if (
    sampled.length > 0 &&
    sampledRoots.length === 1 &&
    !hasCrossedSampled &&
    sampled.every(
      (factor) =>
        factor.factorId === sampledRoots[0].factorId ||
        isNestedUnder(factor, sampledRoots[0].factorId, factorsById),
    )
  ) {
    inferredMethod = "stratified_cluster_bootstrap";
  } else if (sampled.length > 0) {
    inferredMethod = "multiway_cluster_bootstrap";
  }
  const requestedMethod = plan.resamplingMethod;
  if (!METHODS.has(requestedMethod)) {
    throw new ValidationError("Unknown dependence-plan inference method", {
      requestedMethod,
    });
  }
  if (requestedMethod !== inferredMethod) {
    throw new ValidationError(
      "Sealed dependence-plan resampling method conflicts with its factor graph",
      {
        requestedMethod,
        inferredMethod,
        sampledFactorIds: sampled.map((factor) => factor.factorId),
      },
    );
  }
  const observedEffectiveCounts = Object.fromEntries(
    sampled.map((factor) => [
      factor.factorId,
      observations.length === 0
        ? null
        : new Set(observations.map((row) => fieldValue(row, factor.field))).size,
    ]),
  );
  const declaredCounts = new Map();
  for (const entry of plan.effectiveIndependentClusterCounts) {
    if (
      !factorIds.has(entry.factorId) ||
      declaredCounts.has(entry.factorId)
    ) {
      throw new ValidationError(
        "Effective independent cluster counts must name each sampled factor once",
        { factorId: entry.factorId },
      );
    }
    declaredCounts.set(entry.factorId, entry.count);
  }
  if (
    declaredCounts.size !== sampled.length ||
    sampled.some((factor) => !declaredCounts.has(factor.factorId))
  ) {
    throw new ValidationError(
      "Effective independent cluster counts do not match sampled factors",
    );
  }
  for (const factor of sampled) {
    const declared = declaredCounts.get(factor.factorId);
    const observed = observedEffectiveCounts[factor.factorId];
    if (declared < factor.clusterCountFloor) {
      throw new ValidationError(
        "Declared effective cluster count is below its registered floor",
        {
          factorId: factor.factorId,
          declared,
          floor: factor.clusterCountFloor,
        },
      );
    }
    if (observed !== null && observed !== declared) {
      throw new ValidationError(
        "Observed effective cluster count differs from the sealed plan",
        { factorId: factor.factorId, declared, observed },
      );
    }
  }
  const sealedPlan = Object.freeze(stabilizeJson(plan));
  return Object.freeze({
    sealedPlan,
    factors,
    stratumFields,
    blockFields,
    resamplingMethod: requestedMethod,
    inferredResamplingMethod: inferredMethod,
    sampledFactorIds: sampled.map((factor) => factor.factorId),
    highestIndependentFactorId:
      inferredMethod === "stratified_cluster_bootstrap"
        ? sampledRoots[0]?.factorId ?? null
        : null,
    observedEffectiveIndependentClusterCounts: observedEffectiveCounts,
    assignmentBased: plan.assignmentBased === true,
  });
}

export function normalizeDependencePlan(plan, observations = []) {
  return compileDependencePlan(plan, observations).sealedPlan;
}

export function dependenceDiagnostics(plan, observations) {
  const compiled = compileDependencePlan(plan, observations);
  const fixedFactorIds = compiled.factors
    .filter((factor) => factor.sampling === "fixed")
    .map((factor) => factor.factorId);
  return {
    dependencePlan: compiled.sealedPlan,
    inferredResamplingMethod: compiled.inferredResamplingMethod,
    sampledFactorIds: compiled.sampledFactorIds,
    highestIndependentFactorId: compiled.highestIndependentFactorId,
    observedEffectiveIndependentClusterCounts:
      compiled.observedEffectiveIndependentClusterCounts,
    observationCount: observations.length,
    fixedFactorIds,
    independentExperimentalUnitCount:
      compiled.highestIndependentFactorId === null
        ? null
        : compiled.observedEffectiveIndependentClusterCounts[
            compiled.highestIndependentFactorId
          ],
    judgeOrMessageCountInflatesExperimentalN: false,
  };
}

function weightedRows(rows, multiplicityByField) {
  const result = [];
  for (const row of rows) {
    let weight = 1;
    for (const [field, multiplicity] of multiplicityByField) {
      weight *= multiplicity.get(fieldValue(row, field)) ?? 0;
    }
    if (weight > 0) result.push({ row, weight });
  }
  return result;
}

function sampledMultiplicities(levels, rng) {
  const counts = new Map(levels.map((level) => [level, 0]));
  for (let index = 0; index < levels.length; index += 1) {
    const selected = levels[rng.integer(levels.length)];
    counts.set(selected, counts.get(selected) + 1);
  }
  return counts;
}

export function resampleByDependence(observations, plan, rng) {
  observations = stabilizeJson(observations);
  plan = stabilizeJson(plan);
  rng = stabilizeTrustedCallbackConfig(
    rng,
    ["nextUint64", "next", "integer"],
    "Dependence resampling RNG",
    ["integer"],
  ).callbacks;
  if (!Array.isArray(observations)) {
    throw new ValidationError(
      "Dependence resampling requires observations and a deterministic RNG",
    );
  }
  const normalized = compileDependencePlan(plan, observations);
  if (normalized.resamplingMethod === "fixed_design") {
    return observations.map((row) => ({ row, weight: 1 }));
  }
  if (normalized.resamplingMethod === "assignment_randomization") {
    throw new ValidationError(
      "Assignment randomization changes labels and must use randomizeWithinBlocks",
    );
  }
  if (normalized.resamplingMethod === "stratified_cluster_bootstrap") {
    const root = normalized.factors.find(
      (factor) => factor.factorId === normalized.highestIndependentFactorId,
    );
    const byStratum = new Map();
    for (const row of observations) {
      const key = compositeKey(row, normalized.stratumFields);
      if (!byStratum.has(key)) byStratum.set(key, []);
      byStratum.get(key).push(row);
    }
    const output = [];
    for (const rows of byStratum.values()) {
      const levels = [...new Set(rows.map((row) => fieldValue(row, root.field)))].sort();
      const multiplicity = sampledMultiplicities(levels, rng);
      output.push(...weightedRows(rows, [[root.field, multiplicity]]));
    }
    return output;
  }
  const sampledFactors = normalized.factors.filter(
    (factor) => factor.sampling === "sampled",
  );
  const multiplicities = sampledFactors.map((factor) => {
    const levels = [
      ...new Set(observations.map((row) => fieldValue(row, factor.field))),
    ].sort();
    return [factor.field, sampledMultiplicities(levels, rng)];
  });
  return weightedRows(observations, multiplicities);
}

export function randomizeWithinBlocks(
  observations,
  options,
) {
  observations = stabilizeJson(observations);
  const stabilizedOptions = stabilizeConfigWithTrustedFields(
    options,
    ["seedRng"],
    "Blocked randomization configuration",
  );
  const { armField = "arm", blockFields } = stabilizedOptions.config;
  const seedRng = stabilizeTrustedCallbackConfig(
    stabilizedOptions.trusted.seedRng,
    ["nextUint64", "next", "integer"],
    "Blocked randomization RNG",
    ["integer"],
  ).callbacks;
  if (
    !Array.isArray(observations) ||
    !Array.isArray(blockFields) ||
    typeof seedRng.integer !== "function"
  ) {
    throw new ValidationError(
      "Blocked randomization requires rows, block fields, and deterministic RNG",
    );
  }
  const groups = new Map();
  observations.forEach((row, index) => {
    const key = compositeKey(row, blockFields);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ row, index });
  });
  const randomized = observations.map((row) => ({ ...row }));
  for (const members of groups.values()) {
    const labels = members.map(({ row }) => row[armField]);
    for (let index = labels.length - 1; index > 0; index -= 1) {
      const other = seedRng.integer(index + 1);
      [labels[index], labels[other]] = [labels[other], labels[index]];
    }
    members.forEach(({ index }, memberIndex) => {
      randomized[index][armField] = labels[memberIndex];
    });
  }
  return randomized;
}
