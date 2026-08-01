import { deepCloneCanonical } from "../engine/canonical-json.mjs";
import { hashCanonical, HASH_PROFILE_ID } from "../engine/hash.mjs";
import { ValidationError } from "../engine/errors.mjs";

function getPath(value, path) {
  return path.split(".").reduce((cursor, segment) => cursor?.[segment], value);
}

const TOIL_SUBTYPES = new Set([
  "transcription",
  "chasing",
  "archaeology",
  "refighting",
]);
const LEARNING_SUBTYPES = new Set([
  "clarification",
  "tension_probe",
  "meta_question",
  "root_cause_mining",
  "co_design",
  "director_strategic_judgment",
]);

function protectedLearning(dimension) {
  return (
    dimension.attentionEconomicClass === "learning_investment" ||
    dimension.subtype === "director_strategic_judgment" ||
    ["protected_descriptive", "protected-descriptive"].includes(
      dimension.direction,
    )
  );
}

function bytewiseCompare(left, right) {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));
}

export function scoreRegisteredRubric(observation, rubric) {
  observation = deepCloneCanonical(observation);
  rubric = deepCloneCanonical(rubric);
  if (!Array.isArray(rubric?.dimensions) || rubric.dimensions.length === 0) {
    throw new ValidationError("Rubric requires at least one dimension");
  }
  const dimensions = rubric.dimensions.map((dimension) => {
    const observed = getPath(observation, dimension.sourcePath);
    if (observed === undefined || observed === null) {
      return {
        dimensionId: dimension.dimensionId,
        status: "not_observable",
        value: null,
        nativeValue: null,
        normalizedValue: null,
        reason: "registered_source_missing",
        adverseAggregationEligible: false,
      };
    }
    let normalizedValue;
    switch (dimension.transform ?? "identity") {
      case "identity":
        normalizedValue = observed;
        break;
      case "boolean":
        if (typeof observed !== "boolean") {
          throw new ValidationError(
            "Boolean scoring transform requires a native boolean",
            { dimensionId: dimension.dimensionId, observed },
          );
        }
        normalizedValue = observed ? 1 : 0;
        break;
      case "bounded": {
        const nativeValue = Number(observed);
        if (
          !Number.isFinite(nativeValue) ||
          !Number.isFinite(dimension.minimum) ||
          !Number.isFinite(dimension.maximum) ||
          dimension.minimum >= dimension.maximum ||
          nativeValue < dimension.minimum ||
          nativeValue > dimension.maximum
        ) {
          throw new ValidationError(
            "Bounded scoring observation is outside its registered domain",
            {
              dimensionId: dimension.dimensionId,
              observed,
              minimum: dimension.minimum,
              maximum: dimension.maximum,
            },
          );
        }
        normalizedValue =
          (nativeValue - dimension.minimum) /
          (dimension.maximum - dimension.minimum);
        break;
      }
      case "inverse":
        normalizedValue = -Number(observed);
        break;
      default:
        throw new ValidationError("Unknown registered scoring transform", {
          dimensionId: dimension.dimensionId,
          transform: dimension.transform,
        });
    }
    if (
      typeof normalizedValue !== "number" ||
      !Number.isFinite(normalizedValue)
    ) {
      throw new ValidationError("Rubric transform did not produce a finite number", {
        dimensionId: dimension.dimensionId,
      });
    }
    const isProtected = protectedLearning(dimension);
    if (
      isProtected &&
      !["protected_descriptive", "protected-descriptive", "descriptive", undefined].includes(
        dimension.direction,
      )
    ) {
      throw new ValidationError(
        "Protected learning cannot have an adverse decision direction",
        {
          dimensionId: dimension.dimensionId,
          direction: dimension.direction,
        },
      );
    }
    return {
      dimensionId: dimension.dimensionId,
      status: "observed",
      value: normalizedValue,
      nativeValue: observed,
      normalizedValue,
      nativeUnit: dimension.nativeUnit ?? null,
      attentionEconomicClass: dimension.attentionEconomicClass ?? null,
      adverseAggregationEligible: !isProtected,
    };
  });
  const core = {
    hashProfileId: HASH_PROFILE_ID,
    rubricId: rubric.rubricId,
    observationDigest: hashCanonical("scoring-observation/v1", observation),
    dimensions,
  };
  return {
    ...core,
    scoringResultDigest: hashCanonical("scoring-result/v1", core),
  };
}

const OBLIGATION_SCALES = Object.freeze({
  intent_atom: { absent: 0, partial: 0.5, preserved: 1 },
  constraint: { fail: 0, partial: 0.5, pass: 1 },
  priority: { inverted: 0, unresolved: 0.5, preserved: 1 },
  tension: { collapsed: 0, partial: 0.5, retained: 1 },
  correction: { ignored: 0, ambiguous: 0.5, superseded: 1 },
  uncertainty: { falsely_collapsed: 0, legitimately_resolved: 1, retained: 1 },
  traceability: { unlinked: 0, partial: 0.5, linked: 1 },
  utility: { absent: 0, partial: 0.5, preserved: 1 },
});

export function scoreObligationRegistry(input) {
  const {
    registryId,
    obligations,
    findings,
    missingRule = "not_judgeable",
  } = deepCloneCanonical(input);
  if (
    typeof registryId !== "string" ||
    registryId.length === 0 ||
    !Array.isArray(obligations) ||
    obligations.length === 0 ||
    !Array.isArray(findings) ||
    !["not_judgeable", "absent"].includes(missingRule)
  ) {
    throw new ValidationError("Obligation scoring registry is invalid");
  }
  const obligationIds = obligations.map((obligation) => obligation.obligationId);
  if (
    obligationIds.some(
      (obligationId) =>
        typeof obligationId !== "string" || obligationId.length === 0,
    ) ||
    new Set(obligationIds).size !== obligationIds.length
  ) {
    throw new ValidationError("Obligation IDs must be non-empty and unique");
  }
  const findingById = new Map();
  for (const finding of findings) {
    if (
      !obligationIds.includes(finding.obligationId) ||
      findingById.has(finding.obligationId)
    ) {
      throw new ValidationError(
        "Finding references an unknown or duplicate obligation",
        { obligationId: finding.obligationId },
      );
    }
    findingById.set(finding.obligationId, finding);
  }
  const results = obligations.map((obligation) => {
    const scale = OBLIGATION_SCALES[obligation.kind];
    if (!scale) {
      throw new ValidationError("Obligation kind has no registered native scale", {
        obligationId: obligation.obligationId,
        kind: obligation.kind,
      });
    }
    const finding = findingById.get(obligation.obligationId);
    if (!finding) {
      const missingStatus =
        missingRule === "absent" ? Object.keys(scale)[0] : "not_judgeable";
      return {
        obligationId: obligation.obligationId,
        kind: obligation.kind,
        required: obligation.required !== false,
        weight: obligation.weight ?? 1,
        status: missingStatus,
        normalizedValue:
          missingStatus === "not_judgeable" ? null : scale[missingStatus],
        evidenceCitations: [],
        reason: "registered_finding_missing",
      };
    }
    if (!Object.hasOwn(scale, finding.status)) {
      throw new ValidationError("Finding status is outside its obligation scale", {
        obligationId: obligation.obligationId,
        status: finding.status,
      });
    }
    if (
      !Array.isArray(finding.evidenceCitations) ||
      finding.evidenceCitations.length === 0
    ) {
      throw new ValidationError("Observed semantic finding requires a citation", {
        obligationId: obligation.obligationId,
      });
    }
    return {
      obligationId: obligation.obligationId,
      kind: obligation.kind,
      required: obligation.required !== false,
      weight: obligation.weight ?? 1,
      status: finding.status,
      normalizedValue: scale[finding.status],
      evidenceCitations: [...finding.evidenceCitations],
    };
  });
  for (const result of results) {
    if (!Number.isFinite(result.weight) || result.weight < 0) {
      throw new ValidationError("Obligation weight must be non-negative", {
        obligationId: result.obligationId,
      });
    }
  }
  const judgeable = results.filter((result) => result.normalizedValue !== null);
  const weightDenominator = judgeable.reduce(
    (total, result) => total + result.weight,
    0,
  );
  const normalizedSummary =
    weightDenominator === 0
      ? null
      : judgeable.reduce(
          (total, result) => total + result.normalizedValue * result.weight,
          0,
        ) / weightDenominator;
  const core = {
    hashProfileId: HASH_PROFILE_ID,
    registryId,
    fixedObligationDenominator: obligations.length,
    judgeableObligationCount: judgeable.length,
    notJudgeableObligationCount: obligations.length - judgeable.length,
    normalizedSummary,
    obligations: results.sort((left, right) =>
      bytewiseCompare(left.obligationId, right.obligationId),
    ),
  };
  return {
    ...core,
    scoringResultDigest: hashCanonical("obligation-scoring-result/v1", core),
  };
}

export function scoreNonInvention(input) {
  const {
    unsupportedMaterialClaims,
    fixedExposureDenominator,
    evidenceCitations = [],
  } = deepCloneCanonical(input);
  if (
    !Number.isSafeInteger(unsupportedMaterialClaims) ||
    unsupportedMaterialClaims < 0 ||
    !Number.isSafeInteger(fixedExposureDenominator) ||
    fixedExposureDenominator <= 0 ||
    !Array.isArray(evidenceCitations)
  ) {
    throw new ValidationError("Non-invention scoring input is invalid");
  }
  return {
    unsupportedMaterialClaims,
    fixedExposureDenominator,
    unsupportedClaimRate:
      unsupportedMaterialClaims / fixedExposureDenominator,
    exposureSource: "sealed_semantic_key",
    candidateVerbosityCanEnlargeDenominator: false,
    evidenceCitations: [...evidenceCitations],
  };
}

export function scoreDownstreamUtility(input) {
  const { utilityKeyId, obligations, findings } = deepCloneCanonical(input);
  return scoreObligationRegistry({
    registryId: utilityKeyId,
    obligations: obligations.map((obligation) => ({
      ...obligation,
      kind: "utility",
    })),
    findings,
    missingRule: "not_judgeable",
  });
}

function validateAttentionComponent(component, source) {
  if (
    !component ||
    !["toil", "learning_investment"].includes(component.class) ||
    !Number.isFinite(component.nativeMeasure) ||
    component.nativeMeasure < 0 ||
    component.nativeUnit !== source.nativeUnit
  ) {
    throw new ValidationError("Attention component is invalid", {
      sourceEventDigest: source.sourceEventDigest,
    });
  }
  const allowed =
    component.class === "toil" ? TOIL_SUBTYPES : LEARNING_SUBTYPES;
  if (!allowed.has(component.subtype)) {
    throw new ValidationError("Attention subtype is assigned to the wrong class", {
      sourceEventDigest: source.sourceEventDigest,
      class: component.class,
      subtype: component.subtype,
    });
  }
}

export function projectAttentionLedger(input) {
  const {
    attentionLedgerId,
    sourceCutRoot,
    observations,
    paybackObservationRefs = [],
  } = deepCloneCanonical(input);
  if (
    typeof attentionLedgerId !== "string" ||
    attentionLedgerId.length === 0 ||
    typeof sourceCutRoot !== "string" ||
    sourceCutRoot.length === 0 ||
    !Array.isArray(observations) ||
    !Array.isArray(paybackObservationRefs)
  ) {
    throw new ValidationError("Attention ledger projection input is invalid");
  }
  const components = [];
  const unresolvedObservationRefs = [];
  const sourceIds = new Set();
  for (const observation of observations) {
    if (
      typeof observation?.sourceEventDigest !== "string" ||
      observation.sourceEventDigest.length === 0 ||
      sourceIds.has(observation.sourceEventDigest) ||
      !Number.isFinite(observation.nativeMeasure) ||
      observation.nativeMeasure < 0 ||
      typeof observation.nativeUnit !== "string" ||
      observation.nativeUnit.length === 0 ||
      !Array.isArray(observation.evidenceRefs) ||
      observation.evidenceRefs.length === 0
    ) {
      throw new ValidationError("Attention source observation is invalid");
    }
    sourceIds.add(observation.sourceEventDigest);
    if (
      observation.classificationStatus === "unresolved" ||
      !Array.isArray(observation.components)
    ) {
      unresolvedObservationRefs.push(observation.sourceEventDigest);
      continue;
    }
    observation.components.forEach((component) =>
      validateAttentionComponent(component, observation),
    );
    const total = observation.components.reduce(
      (sum, component) => sum + component.nativeMeasure,
      0,
    );
    if (Math.abs(total - observation.nativeMeasure) > 1e-12) {
      throw new ValidationError(
        "Mixed attention observation must split its complete native measure",
        {
          sourceEventDigest: observation.sourceEventDigest,
          observed: observation.nativeMeasure,
          splitTotal: total,
        },
      );
    }
    for (const component of observation.components) {
      components.push({
        sourceEventDigest: observation.sourceEventDigest,
        class: component.class,
        subtype: component.subtype,
        nativeMeasure: component.nativeMeasure,
        nativeUnit: component.nativeUnit,
        evidenceRefs: [...observation.evidenceRefs],
        adverselyOptimizable: component.class === "toil",
      });
    }
  }
  return {
    schemaVersion: "1.0.0",
    hashProfileId: HASH_PROFILE_ID,
    attentionLedgerId,
    sourceCutRoot,
    components,
    unresolvedObservationRefs,
    paybackObservationRefs: [...paybackObservationRefs],
    projectionOnly: true,
  };
}

export function attentionDecisionSurface(ledger) {
  ledger = deepCloneCanonical(ledger);
  if (!Array.isArray(ledger?.components)) {
    throw new ValidationError("Attention decision surface requires a ledger");
  }
  const toilByUnit = {};
  const learningByUnit = {};
  const directorJudgmentByUnit = {};
  for (const component of ledger.components) {
    const target =
      component.class === "toil"
        ? toilByUnit
        : component.subtype === "director_strategic_judgment"
          ? directorJudgmentByUnit
          : learningByUnit;
    target[component.nativeUnit] =
      (target[component.nativeUnit] ?? 0) + component.nativeMeasure;
  }
  return {
    adverseObjectives: {
      toilByUnit,
    },
    protectedLearningInvestment: {
      learningByUnit,
      directorStrategicJudgmentByUnit: directorJudgmentByUnit,
    },
    unresolvedObservationRefs: [...(ledger.unresolvedObservationRefs ?? [])],
    unresolvedEligibleForComposite:
      (ledger.unresolvedObservationRefs ?? []).length === 0,
    protectedLearningCanWorsenRank: false,
  };
}

export function evaluateRegisteredComposite(input) {
  const { compositeId, components } = deepCloneCanonical(input);
  if (
    typeof compositeId !== "string" ||
    compositeId.length === 0 ||
    !Array.isArray(components) ||
    components.length === 0
  ) {
    throw new ValidationError("Composite definition is invalid");
  }
  let value = 0;
  let totalWeight = 0;
  for (const component of components) {
    if (
      component.status !== "observed" ||
      !Number.isFinite(component.normalizedValue) ||
      !Number.isFinite(component.weight) ||
      component.weight < 0
    ) {
      throw new ValidationError(
        "Composite cannot consume missing, unresolved, or invalid components",
        { componentId: component.componentId },
      );
    }
    if (
      component.attentionEconomicClass === "learning_investment" ||
      component.subtype === "director_strategic_judgment" ||
      component.protected === true
    ) {
      throw new ValidationError(
        "Composite cannot consume protected learning as an objective",
        { componentId: component.componentId },
      );
    }
    value += component.normalizedValue * component.weight;
    totalWeight += component.weight;
  }
  if (totalWeight <= 0) {
    throw new ValidationError("Composite has no positive registered weight");
  }
  return {
    compositeId,
    value: value / totalWeight,
    componentCount: components.length,
    protectedLearningExcluded: true,
  };
}

export function qualifyResult(sourceResult, mappings) {
  sourceResult = deepCloneCanonical(sourceResult);
  mappings = deepCloneCanonical(mappings);
  const qualifications = mappings.map((mapping) => {
    const source = getPath(sourceResult, mapping.sourcePath);
    const matched = mapping.equals === undefined ? Boolean(source) : source === mapping.equals;
    return {
      mappingId: mapping.mappingId,
      matched,
      effect: matched ? mapping.effect : "none",
      affectedDimensions: matched ? [...(mapping.affectedDimensions ?? [])] : [],
    };
  });
  return {
    sourceResultDigest: hashCanonical("qualification-source/v1", sourceResult),
    qualifications,
    sourceResult: deepCloneCanonical(sourceResult),
  };
}
