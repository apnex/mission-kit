import {
  stableValue,
} from "../kernel/canonical.mjs";
import {
  exactTextContent,
  renderBlankTextForm,
} from "../kernel/text-forms.mjs";

function issue(code, field, reason, correction) {
  return { code, field, reason, correction };
}

function reject(code, field, reason, correction) {
  return {
    status: "reject",
    issues: [issue(code, field, reason, correction)],
  };
}

function isRecord(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function exactInput(input) {
  return (
    isRecord(input) &&
    Object.keys(input).sort().join("\0") ===
      [
        "contextClosure",
        "formDefinition",
        "projectionBinding",
        "request",
        "requestHandle",
      ].sort().join("\0")
  );
}

function exactLayer(layer, {
  ordinal,
  role,
  apiVersion,
  kind,
  selectedPath,
  selectedKind,
}) {
  return (
    layer?.ordinal === ordinal &&
    layer?.role === role &&
    layer?.sourceReference?.apiVersion === apiVersion &&
    layer?.sourceReference?.kind === kind &&
    Array.isArray(layer.selectedValue) &&
    layer.selectedValue.length === 1 &&
    layer.selectedValue[0]?.path === selectedPath &&
    (
      selectedKind === "record"
        ? isRecord(layer.selectedValue[0]?.value)
        : Array.isArray(layer.selectedValue[0]?.value)
    )
  );
}

/**
 * Render the exact frozen SurveyFrame and Survey parent closure for Round 1
 * authoring. No intake bytes, Question context, interpretation, or future
 * semantic content can enter this two-layer operational projection.
 */
export function projectRoundOneFrameText(input) {
  if (!exactInput(input)) {
    return reject(
      "ROUND_ONE_PROJECTION_INPUT_INVALID",
      "",
      "Round 1 frame projection requires the exact closed projector input.",
      "Restore the kernel-issued projection input.",
    );
  }
  let closure;
  try {
    closure = stableValue(input.contextClosure);
  } catch {
    return reject(
      "ROUND_ONE_PROJECTION_CONTEXT_INVALID",
      "/contextClosure",
      "Round 1 context must be one canonical immutable value.",
      "Restore the exact retained ContextClosure.",
    );
  }
  const layers = closure?.spec?.layers;
  if (
    !Array.isArray(layers) ||
    layers.length !== 2 ||
    !exactLayer(layers[0], {
      ordinal: 1,
      role: "survey-frame",
      apiVersion: "schemas.mission-kit/v1alpha1",
      kind: "ContextFrame",
      selectedPath: "/spec",
      selectedKind: "record",
    }) ||
    !exactLayer(layers[1], {
      ordinal: 2,
      role: "survey",
      apiVersion: "survey.mission-kit/v1alpha1",
      kind: "Survey",
      selectedPath: "/spec/outcomeAxes",
      selectedKind: "array",
    })
  ) {
    return reject(
      "ROUND_ONE_PROJECTION_PARENT_INVALID",
      "/contextClosure/spec/layers",
      "Round 1 projection requires exactly the frozen SurveyFrame then Survey layers.",
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
      "ROUND_ONE_PROJECTION_RENDER_INVALID",
      "/contextClosure/spec/layers",
      `Round 1 parent context cannot be rendered exactly: ${error.message}`,
      "Restore the bounded canonical parent resources.",
    );
  }
}
