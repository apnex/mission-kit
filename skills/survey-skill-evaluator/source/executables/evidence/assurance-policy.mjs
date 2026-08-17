import {
  deepCloneCanonical,
  deepFreeze,
} from "../engine/canonical-json.mjs";
import { ValidationError } from "../engine/errors.mjs";
import { HASH_PROFILE_ID, hashCanonical } from "../engine/hash.mjs";

const OBSERVABLE_SECTIONS = Object.freeze([
  "inputs",
  "outputs",
  "sessionState",
  "toolActions",
  "telemetry",
  "failures",
  "provenance",
]);

const PRIVATE_REASONING_KEYS = new Set([
  "chainOfThought",
  "privateReasoning",
  "reasoningTrace",
]);

const CONFORMANCE_DIMENSIONS = Object.freeze([
  "protocol",
  "disclosure",
  "authority",
  "state_resume",
  "artifact",
  "isolation",
  "execution",
]);

const TELEMETRY_KINDS = Object.freeze([
  "tokens",
  "loaded_bytes",
  "reference_hops",
  "turns",
  "tool_calls",
  "invalid_actions",
  "retries",
  "elapsed_ms",
  "interventions",
]);

const ATTENTION_CLASSES = new Set([
  "toil",
  "learning_investment",
  "director_strategic_judgment",
  "not_applicable",
  "unresolved",
]);

function exactKeys(value, expected, label) {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(value).sort().join(",") !== [...expected].sort().join(",")
  ) {
    throw new ValidationError(`${label} has an invalid field set`);
  }
}

function nonEmptyIdentifier(value, label) {
  if (
    typeof value !== "string" ||
    !/^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$/u.test(value)
  ) {
    throw new ValidationError(`${label} must be a non-empty identifier`);
  }
}

function rejectPrivateReasoning(value, path = "$") {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      rejectPrivateReasoning(item, `${path}[${index}]`),
    );
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    if (PRIVATE_REASONING_KEYS.has(key)) {
      throw new ValidationError(
        "Observable evidence must not capture private reasoning",
        { path: `${path}.${key}` },
      );
    }
    rejectPrivateReasoning(child, `${path}.${key}`);
  }
}

function bytewise(left, right) {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));
}

export function captureObservableEvidence(unsafeInput) {
  const input = deepCloneCanonical(unsafeInput);
  exactKeys(
    input,
    ["captureId", ...OBSERVABLE_SECTIONS],
    "Observable evidence capture",
  );
  nonEmptyIdentifier(input.captureId, "Capture ID");
  rejectPrivateReasoning(input);
  const sections = {};
  for (const section of OBSERVABLE_SECTIONS) {
    if (input[section] === undefined) {
      throw new ValidationError("Observable evidence section is absent", {
        section,
      });
    }
    sections[section] = {
      value: deepCloneCanonical(input[section]),
      digest: hashCanonical(`observable-${section}/v1`, input[section]),
    };
  }
  const core = {
    hashProfileId: HASH_PROFILE_ID,
    captureId: input.captureId,
    sections,
    privateReasoningCaptured: false,
  };
  return deepFreeze({
    ...core,
    captureDigest: hashCanonical("observable-evidence-capture/v1", core),
  });
}

export function measureConformanceRegistry(unsafeInput) {
  const input = deepCloneCanonical(unsafeInput);
  exactKeys(
    input,
    ["registryId", "rules", "observations"],
    "Conformance registry input",
  );
  nonEmptyIdentifier(input.registryId, "Conformance registry ID");
  if (
    !Array.isArray(input.rules) ||
    input.rules.length === 0 ||
    !Array.isArray(input.observations)
  ) {
    throw new ValidationError(
      "Conformance registry requires rules and observations",
    );
  }
  const rules = new Map();
  for (const rule of input.rules) {
    exactKeys(rule, ["ruleId", "dimension", "criterion"], "Conformance rule");
    nonEmptyIdentifier(rule.ruleId, "Conformance rule ID");
    if (
      !CONFORMANCE_DIMENSIONS.includes(rule.dimension) ||
      typeof rule.criterion !== "string" ||
      rule.criterion.length === 0 ||
      rules.has(rule.ruleId)
    ) {
      throw new ValidationError(
        "Conformance rules must be unique, typed, and objective",
        { ruleId: rule.ruleId, dimension: rule.dimension },
      );
    }
    rules.set(rule.ruleId, rule);
  }
  const observations = new Map();
  for (const observation of input.observations) {
    exactKeys(
      observation,
      ["ruleId", "status", "evidenceRefs"],
      "Conformance observation",
    );
    if (
      !rules.has(observation.ruleId) ||
      observations.has(observation.ruleId) ||
      !["pass", "fail", "not_observed"].includes(observation.status) ||
      !Array.isArray(observation.evidenceRefs) ||
      observation.evidenceRefs.some(
        (reference) => typeof reference !== "string" || reference.length === 0,
      ) ||
      (observation.status !== "not_observed" &&
        observation.evidenceRefs.length === 0)
    ) {
      throw new ValidationError(
        "Every conformance observation must bind one registered rule",
        { ruleId: observation.ruleId },
      );
    }
    observations.set(observation.ruleId, observation);
  }
  const results = [...rules.values()]
    .sort((left, right) => bytewise(left.ruleId, right.ruleId))
    .map((rule) => {
      const observation = observations.get(rule.ruleId) ?? {
        ruleId: rule.ruleId,
        status: "not_observed",
        evidenceRefs: [],
      };
      return {
        ruleId: rule.ruleId,
        dimension: rule.dimension,
        criterion: rule.criterion,
        status: observation.status,
        evidenceRefs: [...observation.evidenceRefs],
      };
    });
  const dimensionResults = CONFORMANCE_DIMENSIONS.map((dimension) => {
    const members = results.filter((result) => result.dimension === dimension);
    return {
      dimension,
      ruleCount: members.length,
      passCount: members.filter((result) => result.status === "pass").length,
      failCount: members.filter((result) => result.status === "fail").length,
      notObservedCount: members.filter(
        (result) => result.status === "not_observed",
      ).length,
    };
  });
  const core = {
    hashProfileId: HASH_PROFILE_ID,
    registryId: input.registryId,
    fixedRuleDenominator: results.length,
    results,
    dimensionResults,
    semanticJudgmentIncluded: false,
  };
  return deepFreeze({
    ...core,
    conformanceResultDigest: hashCanonical("conformance-result/v1", core),
  });
}

export function projectEfficiencyTelemetry(unsafeInput) {
  const input = deepCloneCanonical(unsafeInput);
  exactKeys(
    input,
    ["ledgerId", "observations"],
    "Efficiency telemetry input",
  );
  nonEmptyIdentifier(input.ledgerId, "Efficiency ledger ID");
  if (!Array.isArray(input.observations)) {
    throw new ValidationError("Efficiency telemetry observations must be an array");
  }
  const byKind = new Map();
  for (const observation of input.observations) {
    exactKeys(
      observation,
      [
        "kind",
        "status",
        "nativeValue",
        "nativeUnit",
        "attentionEconomicClass",
        "adverseOptimizationEligible",
      ],
      "Efficiency telemetry observation",
    );
    if (
      !TELEMETRY_KINDS.includes(observation.kind) ||
      byKind.has(observation.kind) ||
      !["observed", "unavailable", "unresolved"].includes(observation.status) ||
      typeof observation.nativeUnit !== "string" ||
      observation.nativeUnit.length === 0 ||
      !ATTENTION_CLASSES.has(observation.attentionEconomicClass)
    ) {
      throw new ValidationError(
        "Efficiency telemetry observation is not registered and typed",
        { kind: observation.kind },
      );
    }
    if (
      observation.status === "observed"
        ? !Number.isFinite(observation.nativeValue) ||
          observation.nativeValue < 0
        : observation.nativeValue !== null
    ) {
      throw new ValidationError(
        "Missing telemetry must remain null and observed telemetry must be finite",
        { kind: observation.kind, status: observation.status },
      );
    }
    const mayBeAdverse =
      observation.status === "observed" &&
      observation.attentionEconomicClass === "toil";
    if (observation.adverseOptimizationEligible !== mayBeAdverse) {
      throw new ValidationError(
        "Only observed toil may be minimized adversely",
        { kind: observation.kind },
      );
    }
    byKind.set(observation.kind, observation);
  }
  const observations = TELEMETRY_KINDS.map(
    (kind) =>
      byKind.get(kind) ?? {
        kind,
        status: "unavailable",
        nativeValue: null,
        nativeUnit: kind,
        attentionEconomicClass: "unresolved",
        adverseOptimizationEligible: false,
      },
  );
  const core = {
    hashProfileId: HASH_PROFILE_ID,
    ledgerId: input.ledgerId,
    observations,
    completeRegisteredSurface: observations.length === TELEMETRY_KINDS.length,
    observedToilKinds: observations
      .filter((entry) => entry.adverseOptimizationEligible)
      .map((entry) => entry.kind),
    protectedLearningKinds: observations
      .filter((entry) =>
        [
          "learning_investment",
          "director_strategic_judgment",
        ].includes(entry.attentionEconomicClass),
      )
      .map((entry) => entry.kind),
    unavailableKinds: observations
      .filter((entry) => entry.status !== "observed")
      .map((entry) => entry.kind),
  };
  return deepFreeze({
    ...core,
    telemetryDigest: hashCanonical("efficiency-telemetry/v1", core),
  });
}

function readPath(value, path) {
  return path.split(".").reduce((cursor, segment) => cursor?.[segment], value);
}

function writePath(target, path, value) {
  const segments = path.split(".");
  let cursor = target;
  for (const segment of segments.slice(0, -1)) {
    cursor[segment] ??= {};
    cursor = cursor[segment];
  }
  cursor[segments.at(-1)] = deepCloneCanonical(value);
}

export function projectRedactedDisclosure(unsafeInput) {
  const input = deepCloneCanonical(unsafeInput);
  exactKeys(
    input,
    ["recipeId", "protectedEvidence", "allowedPaths"],
    "Redacted disclosure input",
  );
  nonEmptyIdentifier(input.recipeId, "Disclosure recipe ID");
  if (
    !Array.isArray(input.allowedPaths) ||
    input.allowedPaths.length === 0 ||
    new Set(input.allowedPaths).size !== input.allowedPaths.length ||
    input.allowedPaths.some(
      (path) =>
        typeof path !== "string" ||
        !/^[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*$/u.test(path),
    )
  ) {
    throw new ValidationError(
      "Disclosure recipe must contain unique safe field paths",
    );
  }
  rejectPrivateReasoning(input.protectedEvidence);
  const disclosure = {};
  for (const path of [...input.allowedPaths].sort(bytewise)) {
    const value = readPath(input.protectedEvidence, path);
    if (value === undefined) {
      throw new ValidationError(
        "Disclosure recipe references an absent protected field",
        { path },
      );
    }
    writePath(disclosure, path, value);
  }
  const protectedEvidenceDigest = hashCanonical(
    "protected-evidence/v1",
    input.protectedEvidence,
  );
  const core = {
    hashProfileId: HASH_PROFILE_ID,
    recipeId: input.recipeId,
    protectedEvidenceDigest,
    allowedPaths: [...input.allowedPaths].sort(bytewise),
    disclosure,
  };
  return deepFreeze({
    ...core,
    disclosureDigest: hashCanonical("redacted-disclosure/v1", core),
  });
}

export {
  CONFORMANCE_DIMENSIONS,
  OBSERVABLE_SECTIONS,
  TELEMETRY_KINDS,
};
