import {
  canonicalize,
  stableValue,
} from "../kernel/canonical.mjs";
import {
  resourceIntegrityDigest,
  resourceReferenceFrom,
} from "../kernel/digests.mjs";
import {
  textContentBytes,
} from "../kernel/text-forms.mjs";
import {
  createSurveyFrameFormDefinition,
} from "./survey-frame-authority.mjs";
import {
  projectSurveyFrameText,
} from "./survey-frame-projector.mjs";

const admissionRequestHandle = "0".repeat(64);

export class SurveyFrameProjectionAdmissionError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "SurveyFrameProjectionAdmissionError";
    this.code = code;
  }
}

function fail(code, message) {
  throw new SurveyFrameProjectionAdmissionError(code, message);
}

function isRecord(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function same(left, right) {
  return canonicalize(left) === canonicalize(right);
}

function exactActiveResource(workspace, {
  slot,
  apiVersion,
  kind,
}) {
  const heads = workspace?.spec?.activeHeads?.filter(
    (head) => head?.slot === slot,
  ) ?? [];
  if (heads.length !== 1) {
    fail(
      "SURVEY_INITIALIZATION_PROJECTION_AUTHORITY_INVALID",
      `SurveyFrame projection admission requires one active ${slot} head`,
    );
  }
  const versions = workspace?.spec?.resourceVersions?.filter(
    (stored) => same(stored?.reference, heads[0].reference),
  ) ?? [];
  if (versions.length !== 1) {
    fail(
      "SURVEY_INITIALIZATION_PROJECTION_AUTHORITY_INVALID",
      `SurveyFrame projection admission requires one exact ${slot} resource version`,
    );
  }
  const stored = versions[0];
  const resource = stored.resource;
  if (
    !isRecord(resource) ||
    resource.apiVersion !== apiVersion ||
    resource.kind !== kind ||
    !same(stored.reference, resourceReferenceFrom(resource)) ||
    stored.integrityDigest !== resourceIntegrityDigest(resource)
  ) {
    fail(
      "SURVEY_INITIALIZATION_PROJECTION_AUTHORITY_INVALID",
      `SurveyFrame ${slot} resource differs from its exact retained authority`,
    );
  }
  return resource;
}

function assertCognitiveText(sourceSnapshot) {
  const inventory = sourceSnapshot?.spec?.inventory;
  if (!Array.isArray(inventory) || inventory.length === 0) {
    fail(
      "SURVEY_INITIALIZATION_SOURCE_TEXT_UNSUITABLE",
      "SurveyFrame intake requires one or more exact text entries",
    );
  }
  for (const [index, entry] of inventory.entries()) {
    try {
      textContentBytes(entry?.content);
    } catch {
      fail(
        "SURVEY_INITIALIZATION_SOURCE_TEXT_UNSUITABLE",
        `SurveyFrame intake entry ${index + 1} is not BOM-free NUL-free strict UTF-8 text`,
      );
    }
  }
}

function projectionContext(sourceSnapshot, policySnapshot) {
  return {
    apiVersion: "authoring.mission-kit/v1alpha1",
    kind: "ContextClosure",
    metadata: { name: "survey-frame-projection-admission" },
    spec: {
      layers: [
        {
          ordinal: 1,
          role: "intake",
          selectedValue: [{
            path: "/spec/inventory",
            value: sourceSnapshot.spec.inventory,
          }],
        },
        {
          ordinal: 2,
          role: "policy",
          selectedValue: [{
            path: "/spec",
            value: policySnapshot.spec,
          }],
        },
      ],
    },
  };
}

/**
 * Evaluate one already resolved SurveyFrame ContextClosure with the exact
 * Survey-owned projector and form. The maximum-length legal request handle
 * proves that every collision-free runtime handle can fit the same view.
 */
export function evaluateSurveyFrameProjectionAdmission(
  contextClosure,
) {
  const projected = projectSurveyFrameText({
    request: {},
    contextClosure,
    formDefinition: createSurveyFrameFormDefinition(),
    requestHandle: admissionRequestHandle,
    projectionBinding: {},
  });
  if (projected.status !== "accept") {
    return Object.freeze({
      status: "reject",
      code: "SURVEY_INITIALIZATION_PROJECTION_UNFIT",
      reason:
        "SurveyFrame intake cannot fit the exact deterministic Director projection",
    });
  }
  return Object.freeze({
    status: "accept",
    projectedByteLength:
      textContentBytes(projected.content).byteLength,
  });
}

/**
 * Prove that the immutable initialization heads can produce the exact
 * SurveyFrame Director view before AT01 is allowed to commit.
 *
 * SourceSnapshot retains its generic 16 MiB authority. This Survey-owned
 * admission is intentionally narrower: the ordinary SurveyFrame form and
 * projector must be able to render the complete cognitive view within the
 * one-MiB text-form boundary. The maximum-length legal request handle makes
 * this proof safe for every deterministic runtime collision suffix.
 */
export function assertSurveyFrameProjectionAdmission(
  workspaceInput,
) {
  let workspace;
  try {
    workspace = stableValue(workspaceInput);
  } catch {
    fail(
      "SURVEY_INITIALIZATION_PROJECTION_AUTHORITY_INVALID",
      "SurveyFrame projection admission requires one canonical Workspace",
    );
  }
  const sourceSnapshot = exactActiveResource(workspace, {
    slot: "intake",
    apiVersion: "authoring.mission-kit/v1alpha1",
    kind: "SourceSnapshot",
  });
  const policySnapshot = exactActiveResource(workspace, {
    slot: "policy",
    apiVersion: "survey.mission-kit/v1alpha1",
    kind: "SurveyPolicySnapshot",
  });
  assertCognitiveText(sourceSnapshot);

  const admission = evaluateSurveyFrameProjectionAdmission(
    projectionContext(sourceSnapshot, policySnapshot),
  );
  if (admission.status !== "accept") {
    fail(
      admission.code,
      admission.reason,
    );
  }
  return Object.freeze({
    projectedByteLength: admission.projectedByteLength,
  });
}
