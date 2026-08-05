import {
  stableValue,
} from "../kernel/canonical.mjs";
import {
  exactTextContent,
  renderBlankTextForm,
  textContentBytes,
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

function readableInventory(layer) {
  if (
    !Array.isArray(layer.selectedValue) ||
    layer.selectedValue.length !== 1 ||
    !isRecord(layer.selectedValue[0]) ||
    Object.keys(layer.selectedValue[0]).sort().join("\0") !==
      ["path", "value"].sort().join("\0") ||
    layer.selectedValue[0].path !== "/spec/inventory" ||
    !Array.isArray(layer.selectedValue[0].value)
  ) {
    throw new TypeError(
      "intake selectedValue must project exactly /spec/inventory",
    );
  }
  return [{
    path: "/spec/inventory",
    value: {
      documents: layer.selectedValue[0].value.map((entry, index) => {
      if (
        !isRecord(entry) ||
        entry.ordinal !== index + 1 ||
        typeof entry.logicalName !== "string" ||
        !isRecord(entry.content)
      ) {
        throw new TypeError(
          `intake inventory item ${index + 1} is malformed`,
        );
      }
      const bytes = textContentBytes(entry.content);
      return {
        ordinal: entry.ordinal,
        logicalName: entry.logicalName,
        text: bytes.toString("utf8"),
      };
      }),
    },
  }];
}

/**
 * Survey-owned operational projection. The immutable ContextClosure remains
 * unchanged; only the deterministic Director-facing view decodes exact UTF-8
 * intake bytes.
 */
export function projectSurveyFrameText(input) {
  if (!exactInput(input)) {
    return reject(
      "SURVEY_PROJECTION_INPUT_INVALID",
      "",
      "SurveyFrame projection requires the exact closed projector input.",
      "Restore the kernel-issued projection input.",
    );
  }
  let closure;
  try {
    closure = stableValue(input.contextClosure);
  } catch {
    return reject(
      "SURVEY_PROJECTION_CONTEXT_INVALID",
      "/contextClosure",
      "SurveyFrame context must be one canonical immutable value.",
      "Restore the exact retained ContextClosure.",
    );
  }
  const intakeLayers = closure?.spec?.layers?.filter(
    (layer) => layer.role === "intake",
  ) ?? [];
  if (intakeLayers.length !== 1) {
    return reject(
      "SURVEY_PROJECTION_INTAKE_AMBIGUOUS",
      "/contextClosure/spec/layers",
      `SurveyFrame projection requires one intake layer; resolved ${intakeLayers.length}.`,
      "Restore the profile-selected intake SourceSnapshot layer.",
    );
  }
  try {
    intakeLayers[0].selectedValue =
      readableInventory(intakeLayers[0]);
    const bytes = renderBlankTextForm({
      formDefinition: input.formDefinition,
      contextClosure: closure,
      requestHandle: input.requestHandle,
    });
    return {
      status: "accept",
      content: exactTextContent(bytes),
    };
  } catch (error) {
    return reject(
      "SURVEY_PROJECTION_SOURCE_INVALID",
      "/contextClosure/spec/layers",
      `SurveyFrame intake cannot be projected as exact UTF-8 text: ${error.message}`,
      "Provide bounded strict-UTF-8 SourceSnapshot entries.",
    );
  }
}
