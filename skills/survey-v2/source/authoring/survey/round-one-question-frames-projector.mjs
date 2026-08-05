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

function exactFrameLayer(layer, ordinal, role) {
  return (
    layer?.ordinal === ordinal &&
    layer?.role === role &&
    layer?.sourceReference?.apiVersion === "schemas.mission-kit/v1alpha1" &&
    layer?.sourceReference?.kind === "ContextFrame" &&
    layer?.sourceSnapshot?.apiVersion === "schemas.mission-kit/v1alpha1" &&
    layer?.sourceSnapshot?.kind === "ContextFrame" &&
    canonicalize(resourceReferenceFrom(layer.sourceSnapshot)) ===
      canonicalize(layer.sourceReference) &&
    Array.isArray(layer.selectedValue) &&
    layer.selectedValue.length === 1 &&
    exactKeys(layer.selectedValue[0], ["path", "value"]) &&
    layer.selectedValue[0]?.path === "/spec" &&
    isRecord(layer.selectedValue[0]?.value) &&
    canonicalize(layer.selectedValue[0].value) ===
      canonicalize(layer.sourceSnapshot.spec)
  );
}

function exactSurveyLayer(layer) {
  return (
    layer?.ordinal === 3 &&
    layer?.role === "survey" &&
    layer?.sourceReference?.apiVersion === "survey.mission-kit/v1alpha1" &&
    layer?.sourceReference?.kind === "Survey" &&
    layer?.sourceSnapshot?.apiVersion === "survey.mission-kit/v1alpha1" &&
    layer?.sourceSnapshot?.kind === "Survey" &&
    canonicalize(resourceReferenceFrom(layer.sourceSnapshot)) ===
      canonicalize(layer.sourceReference) &&
    Array.isArray(layer.selectedValue) &&
    layer.selectedValue.length === 1 &&
    exactKeys(layer.selectedValue[0], ["path", "value"]) &&
    layer.selectedValue[0]?.path === "/spec/outcomeAxes" &&
    Array.isArray(layer.selectedValue[0]?.value) &&
    canonicalize(layer.selectedValue[0].value) ===
      canonicalize(layer.sourceSnapshot.spec?.outcomeAxes)
  );
}

/**
 * Project only the Survey and Round ContextFrame specs needed to author the
 * three Round-1 QuestionFrames and the Survey outcome axes needed to ground
 * neutral coverage anchors. Identity, graph wiring, policy, evidence,
 * runtime state, and future-round semantics remain outside the producer view.
 */
export function projectRoundOneQuestionFramesText(input) {
  if (
    !isRecord(input) ||
    Object.keys(input).sort().join("\0") !== [
      "contextClosure",
      "formDefinition",
      "projectionBinding",
      "request",
      "requestHandle",
    ].sort().join("\0")
  ) {
    return reject(
      "ROUND_ONE_QUESTION_FRAMES_PROJECTION_INPUT_INVALID",
      "",
      "QuestionFrame projection requires the exact closed projector input.",
      "Restore the kernel-issued projection input.",
    );
  }
  let closure;
  try {
    closure = stableValue(input.contextClosure);
  } catch {
    return reject(
      "ROUND_ONE_QUESTION_FRAMES_PROJECTION_CONTEXT_INVALID",
      "/contextClosure",
      "QuestionFrame context must be one canonical immutable value.",
      "Restore the exact retained ContextClosure.",
    );
  }
  const layers = closure?.spec?.layers;
  if (
    !Array.isArray(layers) ||
    layers.length !== 3 ||
    !exactFrameLayer(layers[0], 1, "survey-frame") ||
    !exactFrameLayer(layers[1], 2, "round-frame") ||
    !exactSurveyLayer(layers[2])
  ) {
    return reject(
      "ROUND_ONE_QUESTION_FRAMES_PROJECTION_PARENT_INVALID",
      "/contextClosure/spec/layers",
      "QuestionFrame projection requires the frozen Survey and Round ContextFrame specs plus Survey outcome axes.",
      "Restore the profile-selected active parent heads.",
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
      "ROUND_ONE_QUESTION_FRAMES_PROJECTION_RENDER_INVALID",
      "/contextClosure/spec/layers",
      `QuestionFrame parent context cannot be rendered exactly: ${error.message}`,
      "Restore the bounded canonical parent resources.",
    );
  }
}
