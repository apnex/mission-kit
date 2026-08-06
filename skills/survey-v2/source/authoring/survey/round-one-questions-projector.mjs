import {
  canonicalize,
  stableValue,
} from "../kernel/canonical.mjs";
import {
  resourceReferenceFrom,
} from "../kernel/digests.mjs";
import {
  exactTextContent,
  renderBlankTextForm,
} from "../kernel/text-forms.mjs";

const frameSetProjection = Object.freeze([
  "/spec/slots/0/intentDimension",
  "/spec/slots/0/outcomeAxisAnchors",
  "/spec/slots/1/intentDimension",
  "/spec/slots/1/outcomeAxisAnchors",
  "/spec/slots/2/intentDimension",
  "/spec/slots/2/outcomeAxisAnchors",
  "/spec/coverageRationale",
  "/spec/orthogonalityRationale",
]);
const policyProjection = Object.freeze([
  "/spec/geometry/questionsPerRound",
  "/spec/geometry/choiceOptions",
  "/spec/disclosure/mode",
  "/spec/disclosure/siblingQuestionFramesVisible",
  "/spec/disclosure/futureQuestionsVisible",
  "/spec/disclosure/interimInterpretationVisible",
  "/spec/validation/rationaleRequired",
  "/spec/validation/authority",
]);

function issue(code, field, reason, correction) {
  return { code, field, reason, correction };
}

function reject(code, field, reason, correction) {
  return { status: "reject", issues: [issue(code, field, reason, correction)] };
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function exactKeys(value, expected) {
  return (
    isRecord(value) &&
    Object.keys(value).sort().join("\0") ===
      [...expected].sort().join("\0")
  );
}

function pointerValue(resource, path) {
  let current = resource;
  for (const segment of path.split("/").slice(1)) {
    if (
      (Array.isArray(current) && /^(?:0|[1-9][0-9]*)$/u.test(segment)) ||
      (isRecord(current) && Object.hasOwn(current, segment))
    ) {
      current = current[segment];
    } else {
      return undefined;
    }
  }
  return current;
}

function exactLayer(layer, {
  ordinal,
  role,
  apiVersion,
  kind,
  paths,
}) {
  try {
    return (
      layer?.ordinal === ordinal &&
      layer?.role === role &&
      layer?.sourceReference?.apiVersion === apiVersion &&
      layer?.sourceReference?.kind === kind &&
      layer?.sourceSnapshot?.apiVersion === apiVersion &&
      layer?.sourceSnapshot?.kind === kind &&
      canonicalize(resourceReferenceFrom(layer.sourceSnapshot)) ===
        canonicalize(layer.sourceReference) &&
      Array.isArray(layer.selectedValue) &&
      layer.selectedValue.length === paths.length &&
      paths.every((path, index) =>
        exactKeys(layer.selectedValue[index], ["path", "value"]) &&
        layer.selectedValue[index].path === path &&
        pointerValue(layer.sourceSnapshot, path) !== undefined &&
        canonicalize(layer.selectedValue[index].value) ===
          canonicalize(pointerValue(layer.sourceSnapshot, path))
      )
    );
  } catch {
    return false;
  }
}

function exactSevenLayers(layers) {
  if (
    !Array.isArray(layers) ||
    layers.length !== 7 ||
    !exactLayer(layers[0], {
      ordinal: 1,
      role: "survey-frame",
      apiVersion: "schemas.mission-kit/v1alpha1",
      kind: "ContextFrame",
      paths: ["/spec"],
    }) ||
    !exactLayer(layers[1], {
      ordinal: 2,
      role: "round-frame",
      apiVersion: "schemas.mission-kit/v1alpha1",
      kind: "ContextFrame",
      paths: ["/spec"],
    }) ||
    !exactLayer(layers[2], {
      ordinal: 3,
      role: "question-frame-set",
      apiVersion: "survey.mission-kit/v1alpha1",
      kind: "QuestionFrameSet",
      paths: frameSetProjection,
    }) ||
    ![1, 2, 3].every((number) =>
      exactLayer(layers[number + 2], {
        ordinal: number + 3,
        role: `question-frame-${number}`,
        apiVersion: "schemas.mission-kit/v1alpha1",
        kind: "ContextFrame",
        paths: ["/spec"],
      })
    ) ||
    !exactLayer(layers[6], {
      ordinal: 7,
      role: "policy",
      apiVersion: "survey.mission-kit/v1alpha1",
      kind: "SurveyPolicySnapshot",
      paths: policyProjection,
    })
  ) {
    return false;
  }
  const values = policyProjection.map((path) =>
    pointerValue(layers[6].sourceSnapshot, path)
  );
  return (
    values[0] === 3 &&
    canonicalize(values[1]) ===
      canonicalize({ minimum: 3, maximum: 4 }) &&
    values[2] === "single-current-question" &&
    values.slice(3, 6).every((value) => value === false) &&
    values[6] === true &&
    values[7] === "mechanical-only"
  );
}

/**
 * Project only the seven frozen semantic layers needed to author the complete
 * Round-1 Question instrument. The producer sees no SurveyRound body,
 * QuestionFrameSet wiring, broad policy internals, resource identities,
 * runtime state, responses, interpretations, or future-Round content.
 */
export function projectRoundOneQuestionsText(input) {
  if (
    !exactKeys(input, [
      "contextClosure",
      "formDefinition",
      "projectionBinding",
      "request",
      "requestHandle",
    ])
  ) {
    return reject(
      "ROUND_ONE_QUESTIONS_PROJECTION_INPUT_INVALID",
      "",
      "Round-1 Question projection requires the exact closed projector input.",
      "Restore the kernel-issued projection input.",
    );
  }
  let closure;
  try {
    closure = stableValue(input.contextClosure);
  } catch {
    return reject(
      "ROUND_ONE_QUESTIONS_PROJECTION_CONTEXT_INVALID",
      "/contextClosure",
      "Round-1 Question context must be one canonical immutable value.",
      "Restore the exact retained ContextClosure.",
    );
  }
  if (!exactSevenLayers(closure?.spec?.layers)) {
    return reject(
      "ROUND_ONE_QUESTIONS_PROJECTION_CONTEXT_INVALID",
      "/contextClosure/spec/layers",
      "Round-1 Question projection requires exactly seven ordered least-context layers with exact selected-value records.",
      "Restore the profile-selected active semantic heads and bounded projections.",
    );
  }
  try {
    return {
      status: "accept",
      content: exactTextContent(renderBlankTextForm({
        formDefinition: input.formDefinition,
        contextClosure: closure,
        requestHandle: input.requestHandle,
      })),
    };
  } catch (error) {
    return reject(
      "ROUND_ONE_QUESTIONS_PROJECTION_RENDER_INVALID",
      "/contextClosure/spec/layers",
      `Round-1 Question context cannot be rendered exactly: ${error.message}`,
      "Restore the bounded canonical semantic layers.",
    );
  }
}
