import {
  validateById,
} from "../../../generated/validators.mjs";
import {
  validateContractSemantics,
} from "../kernel/contract-semantics.mjs";
import {
  canonicalize,
} from "../kernel/canonical.mjs";
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
  buildRoundOneFrameProducts,
  RoundOneFrameAuthorityError,
} from "./round-one-frame-authority.mjs";
import {
  projectRoundOneFrameText,
} from "./round-one-frame-projector.mjs";
import {
  buildRoundOneQuestionFrameProducts,
  RoundOneQuestionFramesAuthorityError,
} from "./round-one-question-frames-authority.mjs";
import {
  projectRoundOneQuestionFramesText,
} from "./round-one-question-frames-projector.mjs";
import {
  assertRoundOneInstrumentUnitSemantics,
  buildRoundOneQuestionProducts,
  RoundOneQuestionsAuthorityError,
} from "./round-one-questions-authority.mjs";
import {
  projectRoundOneQuestionsText,
} from "./round-one-questions-projector.mjs";
import {
  validateContextFrameSemantics,
} from "../../../dependencies/shared-schemas/v1/snapshot/context-frame/v1alpha1/context-frame.validator.mjs";
import {
  validateQuestionSemantics,
} from "../../../dependencies/shared-schemas/v1/snapshot/question/v1alpha1/question.validator.mjs";

const schemaIds = Object.freeze({
  authoringSubmission:
    "urn:mission-kit:authoring:schema:authoring-submission:v1alpha1",
  survey: "urn:mission-kit:survey:schema:survey:v1alpha1",
  surveyRound:
    "urn:mission-kit:survey:schema:survey-round:v1alpha1",
  contextFrame: "urn:mission-kit:schemas:context-frame:v1alpha1",
  generationRecord:
    "urn:mission-kit:survey:schema:generation-record:v1alpha1",
  questionFrameSet:
    "urn:mission-kit:survey:schema:question-frame-set:v1alpha1",
  question:
    "urn:mission-kit:schemas:question:v1alpha1",
  surveyQuestionBinding:
    "urn:mission-kit:survey:schema:survey-question-binding:v1alpha1",
  roundInstrument:
    "urn:mission-kit:survey:schema:round-instrument:v1alpha1",
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

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
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

function exactRoundOneLayers(input) {
  const layers = input?.contextClosure?.spec?.layers;
  if (!Array.isArray(layers) || layers.length !== 2) return false;
  return (
    layers[0]?.ordinal === 1 &&
    layers[0]?.role === "survey-frame" &&
    layers[0]?.sourceReference?.apiVersion ===
      "schemas.mission-kit/v1alpha1" &&
    layers[0]?.sourceReference?.kind === "ContextFrame" &&
    layers[1]?.ordinal === 2 &&
    layers[1]?.role === "survey" &&
    layers[1]?.sourceReference?.apiVersion ===
      "survey.mission-kit/v1alpha1" &&
    layers[1]?.sourceReference?.kind === "Survey" &&
    layers[1]?.sourceSnapshot?.apiVersion ===
      "survey.mission-kit/v1alpha1" &&
    layers[1]?.sourceSnapshot?.kind === "Survey" &&
    layers[1]?.sourceSnapshot?.spec?.surveyFrameRef !== null &&
    typeof layers[1]?.sourceSnapshot?.spec?.surveyFrameRef ===
      "object" &&
    canonicalize(
      layers[1]?.sourceSnapshot?.spec?.surveyFrameRef,
    ) === canonicalize(layers[0]?.sourceReference)
  );
}

function frozenSurveyFrameGuard(input) {
  if (
    input?.phase !== "submission" ||
    input?.operation?.class !== "task-submission" ||
    input?.operation?.task?.id !== "author-round-1-frame" ||
    input?.workspace?.spec?.authoringState !==
      "round_1_frame_required"
  ) {
    return reject(
      "ROUND_ONE_FRAME_ASSIGNMENT_INVALID",
      "/operation",
      "Round 1 frame submission must use the current author-round-1-frame assignment.",
      "Submit against the current kernel-issued Round 1 frame request.",
    );
  }
  if (!exactRoundOneLayers(input)) {
    return reject(
      "ROUND_ONE_FRAME_CONTEXT_INVALID",
      "/contextClosure/spec/layers",
      "Round 1 frame authoring requires exactly the frozen SurveyFrame then Survey layers.",
      "Restore the active SurveyFrame and Survey parent heads.",
    );
  }
  const inputs = input.operation.inputs;
  if (
    inputs === null ||
    typeof inputs !== "object" ||
    Array.isArray(inputs) ||
    Object.keys(inputs).sort().join("\0") !==
      ["survey", "survey-frame"].sort().join("\0") ||
    canonicalize(inputs["survey-frame"]) !==
      canonicalize(
        input.contextClosure.spec.layers[0].sourceReference,
      ) ||
    canonicalize(inputs.survey) !==
      canonicalize(
        input.contextClosure.spec.layers[1].sourceReference,
      )
  ) {
    return reject(
      "ROUND_ONE_FRAME_INPUT_BINDING_INVALID",
      "/operation/inputs",
      "Round 1 request inputs must bind the exact SurveyFrame and Survey context sources.",
      "Restore the kernel-derived parent input bindings.",
    );
  }
  return pass();
}

function activeReference(workspace, slot) {
  const matches = workspace?.spec?.activeHeads?.filter(
    (head) => head.slot === slot,
  ) ?? [];
  return matches.length === 1 ? matches[0].reference : undefined;
}

function hasDependency(workspace, from, relation, to) {
  return workspace?.spec?.dependencyEdges?.some((edge) =>
    edge.relation === relation &&
    canonicalize(edge.from) === canonicalize(from) &&
    canonicalize(edge.to) === canonicalize(to)
  ) === true;
}

function frozenRoundOneParentClosureGuard(input) {
  if (
    input?.phase !== "submission" ||
    input?.operation?.class !== "task-submission" ||
    input?.operation?.task?.id !== "author-round-1-frame-set" ||
    input?.workspace?.spec?.authoringState !==
      "round_1_question_frames_required"
  ) {
    return reject(
      "ROUND_ONE_QUESTION_FRAMES_ASSIGNMENT_INVALID",
      "/operation",
      "Round 1 QuestionFrame submission must use the current frame-set assignment.",
      "Submit against the current kernel-issued Round 1 QuestionFrame request.",
    );
  }
  const layers = input?.contextClosure?.spec?.layers;
  if (
    !Array.isArray(layers) ||
    layers.length !== 3 ||
    layers[0]?.ordinal !== 1 ||
    layers[0]?.role !== "survey-frame" ||
    layers[0]?.sourceReference?.apiVersion !==
      "schemas.mission-kit/v1alpha1" ||
    layers[0]?.sourceReference?.kind !== "ContextFrame" ||
    layers[1]?.ordinal !== 2 ||
    layers[1]?.role !== "round-frame" ||
    layers[1]?.sourceReference?.apiVersion !==
      "schemas.mission-kit/v1alpha1" ||
    layers[1]?.sourceReference?.kind !== "ContextFrame" ||
    layers[2]?.ordinal !== 3 ||
    layers[2]?.role !== "survey" ||
    layers[2]?.sourceReference?.apiVersion !==
      "survey.mission-kit/v1alpha1" ||
    layers[2]?.sourceReference?.kind !== "Survey"
  ) {
    return reject(
      "ROUND_ONE_QUESTION_FRAMES_CONTEXT_INVALID",
      "/contextClosure/spec/layers",
      "QuestionFrame authoring requires the frozen Survey and Round ContextFrames plus Survey outcome axes.",
      "Restore the profile-selected active parent heads.",
    );
  }
  const surveyFrame = activeReference(input.workspace, "survey-frame");
  const survey = activeReference(input.workspace, "survey");
  const roundFrame = activeReference(input.workspace, "round-1-frame");
  const round = activeReference(input.workspace, "round-1");
  const inputs = input.operation.inputs;
  if (
    round?.apiVersion !== "survey.mission-kit/v1alpha1" ||
    round?.kind !== "SurveyRound"
  ) {
    return reject(
      "ROUND_ONE_QUESTION_FRAMES_ROUND_HEAD_INVALID",
      "/workspace/spec/activeHeads",
      "QuestionFrame authority requires the active round-1 head to be exactly one SurveyRound reference.",
      "Restore the exact active Round-1 SurveyRound head.",
    );
  }
  if (
    surveyFrame === undefined ||
    survey === undefined ||
    roundFrame === undefined ||
    round === undefined ||
    !isRecord(inputs) ||
    Object.keys(inputs).sort().join("\0") !==
      ["round-frame", "survey", "survey-frame"].join("\0") ||
    canonicalize(layers[0].sourceReference) !==
      canonicalize(surveyFrame) ||
    canonicalize(layers[1].sourceReference) !==
      canonicalize(roundFrame) ||
    canonicalize(layers[2].sourceReference) !==
      canonicalize(survey) ||
    canonicalize(inputs["survey-frame"]) !==
      canonicalize(surveyFrame) ||
    canonicalize(inputs["round-frame"]) !==
      canonicalize(roundFrame) ||
    canonicalize(inputs.survey) !== canonicalize(survey)
  ) {
    return reject(
      "ROUND_ONE_QUESTION_FRAMES_INPUT_BINDING_INVALID",
      "/operation/inputs",
      "QuestionFrame request inputs and closure must bind the exact active Survey and Round frame heads.",
      "Restore the kernel-derived parent input bindings.",
    );
  }
  if (
    !hasDependency(
      input.workspace,
      roundFrame,
      "derived-from",
      surveyFrame,
    ) ||
    !hasDependency(input.workspace, round, "belongs-to", survey) ||
    !hasDependency(input.workspace, round, "frames", roundFrame) ||
    !hasDependency(
      input.workspace,
      round,
      "parent-frame",
      surveyFrame,
    )
  ) {
    return reject(
      "ROUND_ONE_QUESTION_FRAMES_ANCESTRY_INVALID",
      "/workspace/spec/dependencyEdges",
      "QuestionFrame authority requires the exact authenticated Round-1 parent graph.",
      "Restore the R10-derived Round ancestry before submitting.",
    );
  }
  return pass();
}

function frozenRoundOneFrameSetGuard(input) {
  if (
    input?.phase !== "submission" ||
    input?.operation?.class !== "task-submission" ||
    input?.operation?.task?.id !== "author-round-1-questions" ||
    input?.workspace?.spec?.authoringState !==
      "round_1_questions_required"
  ) {
    return reject(
      "ROUND_ONE_QUESTIONS_ASSIGNMENT_INVALID",
      "/operation",
      "Round 1 Question submission must use the current complete Question-set assignment.",
      "Submit against the current kernel-issued Round 1 Question request.",
    );
  }
  const layers = input?.contextClosure?.spec?.layers;
  const expectedLayers = [
    ["survey-frame", "schemas.mission-kit/v1alpha1", "ContextFrame"],
    ["round-frame", "schemas.mission-kit/v1alpha1", "ContextFrame"],
    ["question-frame-set", "survey.mission-kit/v1alpha1", "QuestionFrameSet"],
    ["question-frame-1", "schemas.mission-kit/v1alpha1", "ContextFrame"],
    ["question-frame-2", "schemas.mission-kit/v1alpha1", "ContextFrame"],
    ["question-frame-3", "schemas.mission-kit/v1alpha1", "ContextFrame"],
    ["policy", "survey.mission-kit/v1alpha1", "SurveyPolicySnapshot"],
  ];
  if (
    !Array.isArray(layers) ||
    layers.length !== expectedLayers.length ||
    expectedLayers.some(
      ([role, apiVersion, kind], index) => {
        const layer = layers[index];
        return (
          layer?.ordinal !== index + 1 ||
          layer?.role !== role ||
          layer?.sourceReference?.apiVersion !== apiVersion ||
          layer?.sourceReference?.kind !== kind ||
          layer?.sourceSnapshot?.apiVersion !== apiVersion ||
          layer?.sourceSnapshot?.kind !== kind
        );
      },
    )
  ) {
    return reject(
      "ROUND_ONE_QUESTIONS_CONTEXT_INVALID",
      "/contextClosure/spec/layers",
      "Question construction requires exactly the seven frozen Survey, Round, frame-set, QuestionFrame, and policy layers.",
      "Restore the exact profile-selected active context heads.",
    );
  }
  const slotByLayer = [
    "survey-frame",
    "round-1-frame",
    "round-1-question-frame-set",
    "round-1-question-frame-1",
    "round-1-question-frame-2",
    "round-1-question-frame-3",
    "policy",
  ];
  const active = slotByLayer.map(
    (slot) => activeReference(input.workspace, slot),
  );
  const round = activeReference(input.workspace, "round-1");
  const survey = activeReference(input.workspace, "survey");
  if (
    active.some((reference) => reference === undefined) ||
    round?.apiVersion !== "survey.mission-kit/v1alpha1" ||
    round?.kind !== "SurveyRound" ||
    survey?.apiVersion !== "survey.mission-kit/v1alpha1" ||
    survey?.kind !== "Survey" ||
    layers.some(
      (layer, index) =>
        canonicalize(layer.sourceReference) !==
          canonicalize(active[index]),
    )
  ) {
    return reject(
      "ROUND_ONE_QUESTIONS_ACTIVE_HEAD_INVALID",
      "/workspace/spec/activeHeads",
      "Every Question-set context source must be its exact typed active head.",
      "Restore the exact active Survey, Round, frame-set, QuestionFrame, and policy heads.",
    );
  }
  const inputs = input.operation.inputs;
  const expectedInputKeys = [
    "survey-frame",
    "round-frame",
    "question-frame-set",
    "question-frame-1",
    "question-frame-2",
    "question-frame-3",
    "policy",
  ].sort();
  if (
    !isRecord(inputs) ||
    Object.keys(inputs).sort().join("\0") !==
      expectedInputKeys.join("\0") ||
    expectedInputKeys.some((inputKey) => {
      const index = [
        "survey-frame",
        "round-frame",
        "question-frame-set",
        "question-frame-1",
        "question-frame-2",
        "question-frame-3",
        "policy",
      ].indexOf(inputKey);
      return canonicalize(inputs[inputKey]) !==
        canonicalize(layers[index].sourceReference);
    })
  ) {
    return reject(
      "ROUND_ONE_QUESTIONS_INPUT_BINDING_INVALID",
      "/operation/inputs",
      "Question-set request inputs must bind exactly the seven ordered context sources.",
      "Restore the kernel-derived Question-set request input bindings.",
    );
  }
  const frameSet = layers[2].sourceSnapshot;
  const frameRefs = active.slice(3, 6);
  if (
    canonicalize(frameSet.spec?.roundRef) !== canonicalize(round) ||
    canonicalize(frameSet.spec?.parentFrameRef) !==
      canonicalize(active[1]) ||
    !Array.isArray(frameSet.spec?.slots) ||
    frameSet.spec.slots.length !== 3 ||
    frameSet.spec.slots.some(
      (slot, index) =>
        slot.slot !== index + 1 ||
        slot.questionOrdinal !== index + 1 ||
        canonicalize(slot.contextFrameRef) !==
          canonicalize(frameRefs[index]),
    )
  ) {
    return reject(
      "ROUND_ONE_QUESTIONS_FRAME_SET_INVALID",
      "/contextClosure/spec/layers/2",
      "The frozen QuestionFrameSet does not bind the exact Round and three active QuestionFrames.",
      "Restore the R11-authored active QuestionFrameSet.",
    );
  }
  if (
    !hasDependency(input.workspace, round, "belongs-to", survey) ||
    !hasDependency(input.workspace, round, "frames", active[1]) ||
    !hasDependency(
      input.workspace,
      round,
      "parent-frame",
      active[0],
    ) ||
    !hasDependency(
      input.workspace,
      active[1],
      "derived-from",
      active[0],
    ) ||
    !hasDependency(
      input.workspace,
      active[2],
      "belongs-to",
      round,
    ) ||
    !hasDependency(
      input.workspace,
      active[2],
      "parent-frame",
      active[1],
    ) ||
    frameRefs.some(
      (frameRef) =>
        !hasDependency(
          input.workspace,
          frameRef,
          "derived-from",
          active[1],
        ) ||
        !hasDependency(
          input.workspace,
          active[2],
          "frames",
          frameRef,
        ),
    )
  ) {
    return reject(
      "ROUND_ONE_QUESTIONS_ANCESTRY_INVALID",
      "/workspace/spec/dependencyEdges",
      "Question-set authority requires the exact authenticated Survey, Round, and QuestionFrameSet graph.",
      "Restore the R10 and R11 dependency ancestry before submitting.",
    );
  }
  return pass();
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

function roundOneFrameHandler(input) {
  try {
    return accept(buildRoundOneFrameProducts({
      normalizedValues: input?.normalizedValues,
      contextClosure: input?.contextClosure,
    }));
  } catch (error) {
    if (error instanceof RoundOneFrameAuthorityError) {
      return reject(
        error.code,
        error.field,
        error.message,
        "Correct the Round 1 frame semantic fields and resubmit the same assignment.",
      );
    }
    return reject(
      "ROUND_ONE_FRAME_HANDLER_INVALID",
      "",
      "Round 1 frame construction rejected a non-canonical handler input.",
      "Restore the exact kernel-issued submission and parent context closure.",
    );
  }
}

function roundOneQuestionFramesHandler(input) {
  try {
    return accept(buildRoundOneQuestionFrameProducts({
      normalizedValues: input?.normalizedValues,
      contextClosure: input?.contextClosure,
      workspace: input?.workspace,
    }));
  } catch (error) {
    if (error instanceof RoundOneQuestionFramesAuthorityError) {
      return reject(
        error.code,
        error.field,
        error.message,
        "Correct the QuestionFrame semantic fields and resubmit the same assignment.",
      );
    }
    return reject(
      "ROUND_ONE_QUESTION_FRAMES_HANDLER_INVALID",
      "",
      "QuestionFrame construction rejected a non-canonical handler input.",
      "Restore the exact kernel-issued submission, workspace, and parent closure.",
    );
  }
}

function roundOneQuestionsHandler(input) {
  try {
    const products = buildRoundOneQuestionProducts({
      normalizedValues: input?.normalizedValues,
      contextClosure: input?.contextClosure,
      workspace: input?.workspace,
    });
    assertRoundOneInstrumentUnitSemantics({
      profile: input?.profile,
      workspace: input?.workspace,
      contextClosure: input?.contextClosure,
      products,
    });
    return accept(products);
  } catch (error) {
    if (error instanceof RoundOneQuestionsAuthorityError) {
      return reject(
        error.code,
        error.field,
        error.message,
        "Correct the Question, option-relationship, or rationale fields and resubmit the same assignment.",
      );
    }
    return reject(
      "ROUND_ONE_QUESTIONS_HANDLER_INVALID",
      "",
      "Question-set construction rejected a non-canonical handler input.",
      "Restore the exact kernel-issued submission, workspace, and seven-layer closure.",
    );
  }
}

function futureReject(className, id) {
  return reject(
    "SURVEY_PROFILE_FEATURE_UNAVAILABLE",
    "",
    `${className} ${id} is declared for canonical closure but is outside the active R12 implementation stage.`,
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

function questionSemantics(input) {
  return semanticResult(
    validateQuestionSemantics(input?.resource),
    "Question",
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
            : guardId === "frozen-survey-frame"
              ? frozenSurveyFrameGuard
              : guardId === "frozen-round-1-parent-closure"
                ? frozenRoundOneParentClosureGuard
                : guardId === "frozen-round-1-frame-set"
                  ? frozenRoundOneFrameSetGuard
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
              : transitionId === "AT03"
                ? roundOneFrameHandler
              : transitionId === "AT04"
                ? roundOneQuestionFramesHandler
              : transitionId === "AT05"
                ? roundOneQuestionsHandler
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
        ...bindings.validators.surveyRoundSchema,
        invoke: structuralValidator(
          schemaIds.surveyRound,
          "SurveyRound",
        ),
      },
      {
        ...bindings.validators.surveyRoundSemantics,
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
      {
        ...bindings.validators.questionFrameSetSchema,
        invoke: structuralValidator(
          schemaIds.questionFrameSet,
          "QuestionFrameSet",
        ),
      },
      {
        ...bindings.validators.questionFrameSetSemantics,
        invoke: surveySemantics,
      },
      {
        ...bindings.validators.questionSchema,
        invoke: structuralValidator(
          schemaIds.question,
          "Question",
        ),
      },
      {
        ...bindings.validators.questionSemantics,
        invoke: questionSemantics,
      },
      {
        ...bindings.validators.surveyQuestionBindingSchema,
        invoke: structuralValidator(
          schemaIds.surveyQuestionBinding,
          "SurveyQuestionBinding",
        ),
      },
      {
        ...bindings.validators.surveyQuestionBindingSemantics,
        invoke: surveySemantics,
      },
      {
        ...bindings.validators.roundInstrumentSchema,
        invoke: structuralValidator(
          schemaIds.roundInstrument,
          "RoundInstrument",
        ),
      },
      {
        ...bindings.validators.roundInstrumentSemantics,
        invoke: surveySemantics,
      },
    ],
    projectors: [
      {
        ...bindings.projectors.surveyFrame,
        invoke: projectSurveyFrameText,
      },
      {
        ...bindings.projectors.roundOneFrame,
        invoke: projectRoundOneFrameText,
      },
      {
        ...bindings.projectors.roundOneQuestionFrames,
        invoke: projectRoundOneQuestionFramesText,
      },
      {
        ...bindings.projectors.roundOneQuestions,
        invoke: projectRoundOneQuestionsText,
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
