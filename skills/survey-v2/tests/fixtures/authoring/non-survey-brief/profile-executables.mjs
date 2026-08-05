import {
  exactTextContent,
  renderBlankTextForm,
} from "../../../../source/authoring/kernel/text-forms.mjs";

function issue(code, field, reason, correction) {
  return { code, field, reason, correction };
}

function rejected(code, field, reason, correction) {
  return {
    status: "reject",
    issues: [issue(code, field, reason, correction)],
  };
}

function pass() {
  return { status: "pass" };
}

function selectedValue(layer, path) {
  const matches = layer?.selectedValue?.filter(
    (entry) => entry.path === path,
  ) ?? [];
  return matches.length === 1 ? matches[0].value : undefined;
}

function textProjector(input) {
  return {
    status: "accept",
    content: exactTextContent(renderBlankTextForm({
      formDefinition: input.formDefinition,
      contextClosure: input.contextClosure,
      requestHandle: input.requestHandle,
    })),
  };
}

function outlineHandler(input) {
  const objective = input?.normalizedValues?.objective;
  if (typeof objective !== "string" || objective.trim().length === 0) {
    return rejected(
      "BRIEF_OBJECTIVE_REQUIRED",
      "/objective",
      "The Brief outline requires one non-empty objective.",
      "Provide the bounded objective.",
    );
  }
  return {
    status: "accept",
    products: [{
      slot: "outline",
      resource: {
        apiVersion: "brief.example/v1alpha1",
        kind: "BriefOutline",
        metadata: { name: "brief-outline" },
        spec: { objective },
      },
      dependencies: [
        {
          relation: "derived-from",
          selector: { mode: "context-layer", ordinal: 1 },
        },
        {
          relation: "constrained-by",
          selector: { mode: "context-layer", ordinal: 2 },
        },
      ],
    }],
  };
}

function briefHandler(input) {
  const outlineLayers = input?.contextClosure?.spec?.layers?.filter(
    (layer) => layer.role === "outline",
  ) ?? [];
  const objective = outlineLayers.length === 1
    ? selectedValue(outlineLayers[0], "/spec/objective")
    : undefined;
  const summary = input?.normalizedValues?.summary;
  if (typeof objective !== "string" || objective.length === 0) {
    return rejected(
      "BRIEF_OUTLINE_CONTEXT_REQUIRED",
      "/context/outline",
      "The complete Brief requires one exact outline context layer.",
      "Restore the frozen outline context before authoring the Brief.",
    );
  }
  if (typeof summary !== "string" || summary.trim().length === 0) {
    return rejected(
      "BRIEF_SUMMARY_REQUIRED",
      "/summary",
      "The complete Brief requires one non-empty summary.",
      "Provide the bounded summary.",
    );
  }
  return {
    status: "accept",
    products: [{
      slot: "brief",
      resource: {
        apiVersion: "brief.example/v1alpha1",
        kind: "Brief",
        metadata: { name: "brief" },
        spec: { objective, summary },
      },
      dependencies: [
        {
          relation: "derived-from",
          selector: { mode: "context-layer", ordinal: 3 },
        },
        {
          relation: "constrained-by",
          selector: { mode: "context-layer", ordinal: 2 },
        },
      ],
    }],
  };
}

function outlineSemantics(input) {
  const objective = input?.resource?.spec?.objective;
  return (
    typeof objective === "string" &&
    objective.trim().length > 0
  )
    ? pass()
    : rejected(
      "BRIEF_OUTLINE_SEMANTICS_INVALID",
      "/spec/objective",
      "The Brief outline objective must contain non-whitespace text.",
      "Provide a concrete objective.",
    );
}

function briefSemantics(input) {
  const objective = input?.resource?.spec?.objective;
  const summary = input?.resource?.spec?.summary;
  return (
    typeof objective === "string" &&
    objective.trim().length > 0 &&
    typeof summary === "string" &&
    summary.trim().length > 0
  )
    ? pass()
    : rejected(
      "BRIEF_SEMANTICS_INVALID",
      "/spec",
      "The Brief objective and summary must contain non-whitespace text.",
      "Provide a concrete objective and summary.",
    );
}

export function createBriefExecutableRegistry({
  bindings,
  validateBriefResource,
}) {
  if (
    typeof validateBriefResource !== "function" ||
    bindings === null ||
    typeof bindings !== "object"
  ) {
    throw new TypeError(
      "Brief executable registry requires exact bindings and a resource validator",
    );
  }
  return {
    guards: [],
    projectors: [
      {
        ...bindings.projectionEngine,
        invoke: textProjector,
      },
    ],
    handlers: [
      {
        ...bindings.outlineHandler,
        invoke: outlineHandler,
      },
      {
        ...bindings.briefHandler,
        invoke: briefHandler,
      },
    ],
    validators: [
      {
        ...bindings.resourceSchema,
        invoke(input) {
          return validateBriefResource(input?.resource)
            ? pass()
            : rejected(
              "BRIEF_RESOURCE_SCHEMA_INVALID",
              "",
              "The candidate does not satisfy the closed Brief resource schema.",
              "Return exactly one schema-valid Brief profile resource.",
            );
        },
      },
      {
        ...bindings.outlineValidator,
        invoke: outlineSemantics,
      },
      {
        ...bindings.briefValidator,
        invoke: briefSemantics,
      },
    ],
  };
}
