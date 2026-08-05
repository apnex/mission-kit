import {
  validateById,
} from "../../../generated/validators.mjs";
import {
  validateContractSemantics,
} from "../kernel/contract-semantics.mjs";
import {
  createSurveyGenerationRecord,
} from "./generation-record.mjs";
import {
  buildSurveyFrameProducts,
  SurveyFrameAuthorityError,
} from "./survey-frame-authority.mjs";
import {
  projectSurveyFrameText,
} from "./survey-frame-projector.mjs";
import {
  evaluateSurveyFrameProjectionAdmission,
} from "./survey-frame-projection-admission.mjs";
import {
  createSurveyResourceResolver,
  validateSurveyResourceSemantics,
} from "./resource-semantics.mjs";
import {
  validateContextFrameSemantics,
} from "../../../dependencies/shared-schemas/v1/snapshot/context-frame/v1alpha1/context-frame.validator.mjs";

const schemaIds = Object.freeze({
  authoringSubmission:
    "urn:mission-kit:authoring:schema:authoring-submission:v1alpha1",
  survey: "urn:mission-kit:survey:schema:survey:v1alpha1",
  contextFrame: "urn:mission-kit:schemas:context-frame:v1alpha1",
  generationRecord:
    "urn:mission-kit:survey:schema:generation-record:v1alpha1",
});

function issue(code, field, reason, correction) {
  return { code, field, reason, correction };
}

function reject(code, field, reason, correction) {
  return {
    status: "reject",
    issues: [issue(code, field, reason, correction)],
  };
}

function pass() {
  return { status: "pass" };
}

function accept(products) {
  return { status: "accept", products };
}

function layerIdentity(layer) {
  return {
    role: layer?.role,
    apiVersion: layer?.sourceReference?.apiVersion,
    kind: layer?.sourceReference?.kind,
  };
}

function exactInitializationLayers(input) {
  const layers = input?.contextClosure?.spec?.layers;
  if (!Array.isArray(layers) || layers.length !== 2) return false;
  const identities = layers.map(layerIdentity);
  return (
    layers[0]?.ordinal === 1 &&
    identities[0]?.role === "intake" &&
    identities[0]?.apiVersion === "authoring.mission-kit/v1alpha1" &&
    identities[0]?.kind === "SourceSnapshot" &&
    layers[1]?.ordinal === 2 &&
    identities[1]?.role === "policy" &&
    identities[1]?.apiVersion === "survey.mission-kit/v1alpha1" &&
    identities[1]?.kind === "SurveyPolicySnapshot"
  );
}

function initializedSurveyInputsGuard(input) {
  if (
    input?.phase !== "event" ||
    input?.operation?.eventId !== "BEGIN_AUTHORING" ||
    input?.workspace?.spec?.authoringState !== "new"
  ) {
    return reject(
      "SURVEY_INITIALIZATION_EDGE_INVALID",
      "/operation",
      "Survey initialization requires the exact BEGIN_AUTHORING edge from new.",
      "Restore the kernel-selected AT01 event authority.",
    );
  }
  if (!exactInitializationLayers(input)) {
    return reject(
      "SURVEY_INITIALIZATION_INPUTS_INVALID",
      "/contextClosure/spec/layers",
      "Survey initialization requires exactly the frozen intake and policy layers in that order.",
      "Restore the active SourceSnapshot and SurveyPolicySnapshot heads.",
    );
  }
  const admission = evaluateSurveyFrameProjectionAdmission(
    input.contextClosure,
  );
  return admission.status === "accept"
    ? pass()
    : reject(
      admission.code,
      "/contextClosure/spec/layers",
      admission.reason,
      "Provide complete BOM-free NUL-free source text whose exact SurveyFrame Director view fits the text-form bound.",
    );
}

function currentSurveyFrameAssignmentGuard(input) {
  if (
    input?.phase !== "submission" ||
    input?.operation?.class !== "task-submission" ||
    input?.operation?.task?.id !== "author-survey-frame" ||
    input?.workspace?.spec?.authoringState !== "survey_frame_required"
  ) {
    return reject(
      "SURVEY_FRAME_ASSIGNMENT_INVALID",
      "/operation",
      "SurveyFrame submission must use the current author-survey-frame assignment.",
      "Submit against the current kernel-issued SurveyFrame request.",
    );
  }
  return exactInitializationLayers(input)
    ? pass()
    : reject(
      "SURVEY_FRAME_CONTEXT_INVALID",
      "/contextClosure/spec/layers",
      "SurveyFrame authoring requires exactly the frozen intake and policy layers.",
      "Restore the request-bound intake and policy context closure.",
    );
}

function beginAuthoringHandler() {
  return accept([]);
}

function surveyFrameHandler(input) {
  try {
    return accept(buildSurveyFrameProducts({
      normalizedValues: input?.normalizedValues,
      contextClosure: input?.contextClosure,
    }));
  } catch (error) {
    if (error instanceof SurveyFrameAuthorityError) {
      return reject(
        error.code,
        error.field,
        error.message,
        "Correct the SurveyFrame semantic fields and resubmit the same assignment.",
      );
    }
    return reject(
      "SURVEY_FRAME_HANDLER_INVALID",
      "",
      "SurveyFrame construction rejected a non-canonical handler input.",
      "Restore the exact kernel-issued submission and context closure.",
    );
  }
}

function futureReject(className, id) {
  return reject(
    "SURVEY_PROFILE_FEATURE_UNAVAILABLE",
    "",
    `${className} ${id} is declared for canonical closure but is outside the active S11 implementation stage.`,
    "Use only transitions admitted by the profile execution closure.",
  );
}

function structuralValidator(schemaId, label) {
  return (input) => {
    const result = validateById(schemaId, input?.resource);
    if (result.valid) return pass();
    const detail = result.errors?.[0] ?? "closed schema validation failed";
    return reject(
      "SURVEY_RESOURCE_SCHEMA_INVALID",
      "",
      `${label} does not satisfy its pinned closed schema: ${detail}`,
      `Return exactly one schema-valid ${label} resource.`,
    );
  };
}

function semanticResult(issues, label) {
  if (issues.length === 0) return pass();
  const first = issues[0];
  return reject(
    first.code,
    first.field ?? first.path ?? "",
    first.reason ?? first.message ?? `${label} semantics are invalid.`,
    `Correct the ${label} semantic contract without changing its declared type.`,
  );
}

function authoringSubmissionSemantics(input) {
  return semanticResult(
    validateContractSemantics(input?.resource),
    "AuthoringSubmission",
  );
}

function surveySemantics(input) {
  let resolver;
  try {
    resolver = Array.isArray(input?.resources)
      ? createSurveyResourceResolver(input.resources)
      : undefined;
  } catch (error) {
    return reject(
      "SURVEY_RESOURCE_INVENTORY_INVALID",
      "/resources",
      error.message,
      "Restore the exact unique resource inventory.",
    );
  }
  return semanticResult(
    validateSurveyResourceSemantics(input?.resource, {
      resolveReference: resolver,
    }),
    input?.resource?.kind ?? "Survey resource",
  );
}

function contextFrameSemantics(input) {
  return semanticResult(
    validateContextFrameSemantics(input?.resource),
    "ContextFrame",
  );
}

function generationRecordSidecar(input) {
  try {
    return {
      status: "accept",
      resources: [createSurveyGenerationRecord(input)],
    };
  } catch (error) {
    return reject(
      error?.code ?? "SURVEY_GENERATION_RECORD_INVALID",
      error?.field ?? "",
      error?.message ??
        "GenerationRecord construction rejected its exact commit ancestry.",
      "Restore the exact accepted cognitive commit graph and producer generation evidence.",
    );
  }
}

function assertBindings(bindings) {
  if (
    bindings === null ||
    typeof bindings !== "object" ||
    Array.isArray(bindings) ||
    bindings.guards === null ||
    typeof bindings.guards !== "object" ||
    bindings.handlers === null ||
    typeof bindings.handlers !== "object" ||
    bindings.validators === null ||
    typeof bindings.validators !== "object" ||
    bindings.projectors === null ||
    typeof bindings.projectors !== "object" ||
    bindings.sidecars === null ||
    typeof bindings.sidecars !== "object"
  ) {
    throw new TypeError(
      "Survey executable registry requires the exact profile binding inventory",
    );
  }
}

/**
 * Bind pure Survey callbacks to the exact id-and-digest inventory produced by
 * profile-authority.mjs. Functions never enter profile identity; their pins do.
 */
export function createSurveyProfileExecutableRegistry({ bindings }) {
  assertBindings(bindings);
  return {
    guards: Object.entries(bindings.guards).map(([guardId, binding]) => ({
      ...binding,
      invoke:
        guardId === "initialized-survey-inputs"
          ? initializedSurveyInputsGuard
          : guardId === "current-survey-frame-assignment"
            ? currentSurveyFrameAssignmentGuard
            : () => futureReject("guard", guardId),
    })),
    handlers: Object.entries(bindings.handlers).map(
      ([transitionId, binding]) => ({
        ...binding,
        invoke:
          transitionId === "AT01"
            ? beginAuthoringHandler
            : transitionId === "AT02"
              ? surveyFrameHandler
              : () => futureReject("handler", transitionId),
      }),
    ),
    validators: [
      {
        ...bindings.validators.authoringSubmissionSchema,
        invoke: structuralValidator(
          schemaIds.authoringSubmission,
          "AuthoringSubmission",
        ),
      },
      {
        ...bindings.validators.authoringSubmissionSemantics,
        invoke: authoringSubmissionSemantics,
      },
      {
        ...bindings.validators.surveySchema,
        invoke: structuralValidator(schemaIds.survey, "Survey"),
      },
      {
        ...bindings.validators.surveySemantics,
        invoke: surveySemantics,
      },
      {
        ...bindings.validators.contextFrameSchema,
        invoke: structuralValidator(schemaIds.contextFrame, "ContextFrame"),
      },
      {
        ...bindings.validators.contextFrameSemantics,
        invoke: contextFrameSemantics,
      },
      {
        ...bindings.validators.generationRecordSchema,
        invoke: structuralValidator(
          schemaIds.generationRecord,
          "GenerationRecord",
        ),
      },
      {
        ...bindings.validators.generationRecordSemantics,
        invoke: surveySemantics,
      },
    ],
    projectors: [
      {
        ...bindings.projectors.surveyFrame,
        invoke: projectSurveyFrameText,
      },
      {
        ...bindings.projectors.future,
        invoke: () => futureReject("projector", "future"),
      },
    ],
    sidecars: [
      {
        ...bindings.sidecars.generationRecord,
        invoke: generationRecordSidecar,
      },
    ],
  };
}
