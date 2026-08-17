import { canonicalBytes } from "../engine/canonical-json.mjs";
import { ValidationError } from "../engine/errors.mjs";
import { hashCanonical } from "../engine/hash.mjs";
import {
  stabilizeConfigWithTrustedFields,
  stabilizeJson,
  stabilizeTrustedCallbackConfig,
  stabilizeTrustedCallbackRecords,
} from "./input-boundary.mjs";

function collectDifferencePaths(left, right, path = "$", output = []) {
  if (canonicalBytes(left).equals(canonicalBytes(right))) return output;
  if (
    left === null ||
    right === null ||
    typeof left !== "object" ||
    typeof right !== "object" ||
    Array.isArray(left) !== Array.isArray(right)
  ) {
    output.push(path);
    return output;
  }
  if (Array.isArray(left)) {
    const length = Math.max(left.length, right.length);
    for (let index = 0; index < length; index += 1) {
      if (index >= left.length || index >= right.length) {
        output.push(`${path}[${index}]`);
      } else {
        collectDifferencePaths(left[index], right[index], `${path}[${index}]`, output);
      }
    }
    return output;
  }
  const keys = [...new Set([...Object.keys(left), ...Object.keys(right)])].sort(
    (first, second) =>
      Buffer.compare(Buffer.from(first, "utf8"), Buffer.from(second, "utf8")),
  );
  for (const key of keys) {
    if (!Object.hasOwn(left, key) || !Object.hasOwn(right, key)) {
      output.push(`${path}.${key}`);
    } else {
      collectDifferencePaths(left[key], right[key], `${path}.${key}`, output);
    }
  }
  return output;
}

function pathAllowed(path, allowedPaths) {
  return allowedPaths.some(
    (allowed) =>
      path === allowed ||
      path.startsWith(`${allowed}.`) ||
      path.startsWith(`${allowed}[`),
  );
}

export function labelSwapControl(
  observations,
  options,
) {
  observations = stabilizeJson(observations);
  const boundary = stabilizeTrustedCallbackConfig(
    options,
    ["statistic"],
    "Label-swap control configuration",
  );
  const {
    statistic,
  } = boundary.callbacks;
  const {
    armField = "arm",
    treatmentArm = "treatment",
    controlArm = "control",
    tolerance = 1e-12,
  } = boundary.config;
  if (
    !Array.isArray(observations) ||
    typeof statistic !== "function" ||
    !Number.isFinite(tolerance) ||
    tolerance < 0
  ) {
    throw new ValidationError("Label-swap control configuration is invalid");
  }
  const original = statistic(observations);
  const swappedRows = observations.map((row) => ({
    ...row,
    [armField]:
      row[armField] === treatmentArm
        ? controlArm
        : row[armField] === controlArm
          ? treatmentArm
          : row[armField],
  }));
  const swapped = statistic(swappedRows);
  if (!Number.isFinite(original) || !Number.isFinite(swapped)) {
    throw new ValidationError("Label-swap statistic must be finite");
  }
  return {
    original,
    swapped,
    expectedSwapped: -original,
    tolerance,
    antisymmetric: Math.abs(swapped + original) <= tolerance,
    originalInputDigest: hashCanonical("label-swap-input/v1", observations),
    swappedInputDigest: hashCanonical("label-swap-input/v1", swappedRows),
    statisticTrustBoundary: boundary.trustedCodeBoundary,
  };
}

export function metamorphicInvariant(input) {
  const boundary = stabilizeTrustedCallbackConfig(
    input,
    ["projector"],
    "Metamorphic control configuration",
  );
  const {
    baseline,
    variants,
    invariantId = "metamorphic-invariant",
  } = boundary.config;
  const { projector } = boundary.callbacks;
  if (!Array.isArray(variants) || typeof projector !== "function") {
    throw new ValidationError("Metamorphic control requires variants and a projector");
  }
  const baselineProjection = projector(baseline);
  const baselineBytes = canonicalBytes(baselineProjection);
  const results = variants.map((variant, index) => {
    const projection = projector(variant);
    return {
      index,
      invariant: canonicalBytes(projection).equals(baselineBytes),
      projectionDigest: hashCanonical("metamorphic-projection/v1", projection),
    };
  });
  return {
    invariantId,
    baselineProjectionDigest: hashCanonical(
      "metamorphic-projection/v1",
      baselineProjection,
    ),
    variants: results,
    passed: results.every((result) => result.invariant),
    projectorTrustBoundary: boundary.trustedCodeBoundary,
  };
}

export function auditControlDelta(input) {
  const boundary = stabilizeConfigWithTrustedFields(
    input,
    ["manipulationChecks"],
    "Control-delta audit configuration",
    [],
  );
  const {
    treatment,
    control,
    allowedDifferencePaths,
    forbiddenDoctrineTerms = [],
  } = boundary.config;
  const manipulationChecks =
    boundary.trusted.manipulationChecks === undefined
      ? []
      : stabilizeTrustedCallbackRecords(
          boundary.trusted.manipulationChecks,
          "evaluate",
          "Control manipulation checks",
        );
  if (
    !Array.isArray(allowedDifferencePaths) ||
    allowedDifferencePaths.some(
      (path) => typeof path !== "string" || !path.startsWith("$"),
    ) ||
    !Array.isArray(forbiddenDoctrineTerms) ||
    !Array.isArray(manipulationChecks)
  ) {
    throw new ValidationError("Control-delta audit configuration is invalid");
  }
  const differencePaths = collectDifferencePaths(treatment, control);
  const forbiddenDifferences = differencePaths.filter(
    (path) => !pathAllowed(path, allowedDifferencePaths),
  );
  const controlText = JSON.stringify(control).toLowerCase();
  const doctrineLeaks = forbiddenDoctrineTerms
    .filter((term) => {
      if (typeof term !== "string" || term.length === 0) {
        throw new ValidationError("Forbidden doctrine terms must be strings");
      }
      return controlText.includes(term.toLowerCase());
    })
    .sort();
  const manipulationResults = manipulationChecks.map((check, index) => {
    if (
      !check ||
      typeof check.checkId !== "string" ||
      typeof check.evaluate !== "function"
    ) {
      throw new ValidationError("Manipulation check is malformed", { index });
    }
    return { checkId: check.checkId, passed: check.evaluate(treatment, control) === true };
  });
  return {
    differencePaths,
    forbiddenDifferences,
    doctrineLeaks,
    manipulationResults,
    passed:
      forbiddenDifferences.length === 0 &&
      doctrineLeaks.length === 0 &&
      manipulationResults.every((result) => result.passed),
    expectedDirectionConsumed: false,
    manipulationCheckTrustBoundary:
      manipulationChecks.length === 0
        ? "none"
        : "registered_package_function",
  };
}

export function negativeControlResult(effect, equivalenceMargin) {
  [effect, equivalenceMargin] = stabilizeJson([effect, equivalenceMargin]);
  if (
    !Number.isFinite(effect) ||
    !Number.isFinite(equivalenceMargin) ||
    equivalenceMargin < 0
  ) {
    throw new ValidationError("Negative-control effect region is invalid");
  }
  return {
    effect,
    equivalenceMargin,
    passed: Math.abs(effect) <= equivalenceMargin,
    expectedRelation: "no_material_difference",
  };
}

export function positiveControlResult(effect, expectedDirection, minimumEffect = 0) {
  [effect, expectedDirection, minimumEffect] = stabilizeJson([
    effect,
    expectedDirection,
    minimumEffect,
  ]);
  if (
    !Number.isFinite(effect) ||
    !["positive", "negative"].includes(expectedDirection) ||
    !Number.isFinite(minimumEffect) ||
    minimumEffect < 0
  ) {
    throw new ValidationError("Positive-control expectation is invalid");
  }
  return {
    effect,
    expectedDirection,
    minimumEffect,
    passed:
      expectedDirection === "positive"
        ? effect > minimumEffect
        : effect < -minimumEffect,
  };
}
