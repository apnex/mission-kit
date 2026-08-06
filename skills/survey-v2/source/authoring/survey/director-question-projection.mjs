import { readFile } from "node:fs/promises";
import { parse } from "acorn";
import {
  canonicalize,
  isUtf8RoundTrip,
  prettyJson,
  sha256Bytes,
  sha256Value,
  stableValue,
} from "../kernel/canonical.mjs";
import {
  resourceIntegrityDigest,
  resourceReferenceFrom,
} from "../kernel/digests.mjs";
import {
  renderCurrentQuestionPresentation as renderDormantPresentation,
} from "./current-question-renderer.mjs";

const definitionDomain =
  "mission-kit:survey-v2:director-current-question-projection-definition/v1";
const rendererClosureDomain =
  "mission-kit:survey-v2:director-current-question-renderer-closure/v1";
const recipeDomain =
  "mission-kit:survey-v2:director-projection-recipe/v1";
const recipeSchemaId =
  "urn:mission-kit:survey-v2:schema:director-projection-recipe:v1";
const outputSchemaId =
  "urn:mission-kit:survey-v2:schema:question-presentation:v2";
const definitionId = "survey.director.current-question/v1";
const rendererId =
  "survey.director.current-question-renderer/v1";
const rendererPath =
  "source/authoring/survey/current-question-renderer.mjs";

const definitionUrl = new URL(
  "./current-question-projection.definition.json",
  import.meta.url,
);
const rendererUrl = new URL(
  "./current-question-renderer.mjs",
  import.meta.url,
);
const outputSchemaUrl = new URL(
  "../../../schemas/v2/question-presentation.schema.json",
  import.meta.url,
);

export class DirectorQuestionProjectionError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "DirectorQuestionProjectionError";
    this.code = code;
  }
}

function fail(code, message) {
  throw new DirectorQuestionProjectionError(code, message);
}

function isRecord(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function exactKeys(value, required, optional = []) {
  if (!isRecord(value)) return false;
  const allowed = new Set([...required, ...optional]);
  const keys = Object.keys(value);
  return (
    required.every((key) => Object.hasOwn(value, key)) &&
    keys.every((key) => allowed.has(key))
  );
}

function sameValue(left, right) {
  return canonicalize(left) === canonicalize(right);
}

function deepFreeze(value) {
  if (value === null || typeof value !== "object") return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function frozen(value) {
  return deepFreeze(stableValue(value));
}

function parseCanonicalJsonBytes(bytes, label) {
  const source = Buffer.from(bytes);
  if (
    source.length === 0 ||
    !isUtf8RoundTrip(source) ||
    source.includes(0) ||
    (
      source[0] === 0xef &&
      source[1] === 0xbb &&
      source[2] === 0xbf
    )
  ) {
    fail(
      "DIRECTOR_PROJECTION_AUTHORITY_SOURCE_INVALID",
      `${label} must be nonempty canonical UTF-8 JSON`,
    );
  }
  let value;
  try {
    value = JSON.parse(source.toString("utf8"));
  } catch (error) {
    fail(
      "DIRECTOR_PROJECTION_AUTHORITY_SOURCE_INVALID",
      `${label} is not strict JSON: ${error.message}`,
    );
  }
  if (!source.equals(Buffer.from(prettyJson(value), "utf8"))) {
    fail(
      "DIRECTOR_PROJECTION_AUTHORITY_SOURCE_NONCANONICAL",
      `${label} must be canonical pretty JSON`,
    );
  }
  return value;
}

function parseStrictJsonBytes(bytes, label) {
  const source = Buffer.from(bytes);
  if (
    source.length === 0 ||
    !isUtf8RoundTrip(source) ||
    source.includes(0) ||
    (
      source[0] === 0xef &&
      source[1] === 0xbb &&
      source[2] === 0xbf
    )
  ) {
    fail(
      "DIRECTOR_PROJECTION_AUTHORITY_SOURCE_INVALID",
      `${label} must be nonempty UTF-8 JSON`,
    );
  }
  try {
    return JSON.parse(source.toString("utf8"));
  } catch (error) {
    fail(
      "DIRECTOR_PROJECTION_AUTHORITY_SOURCE_INVALID",
      `${label} is not strict JSON: ${error.message}`,
    );
  }
}

function assertClosedRendererModule(rendererSource) {
  let program;
  try {
    program = parse(rendererSource.toString("utf8"), {
      ecmaVersion: "latest",
      sourceType: "module",
      allowHashBang: true,
    });
  } catch (error) {
    fail(
      "DIRECTOR_PROJECTION_RENDERER_CLOSURE_INVALID",
      `current-question renderer is not a valid closed module: ${error.message}`,
    );
  }
  const pending = [program];
  while (pending.length > 0) {
    const node = pending.pop();
    if (
      node?.type === "ImportDeclaration" ||
      node?.type === "ImportExpression" ||
      (
        (
          node?.type === "ExportNamedDeclaration" ||
          node?.type === "ExportAllDeclaration"
        ) &&
        node.source !== null
      )
    ) {
      fail(
        "DIRECTOR_PROJECTION_RENDERER_CLOSURE_INVALID",
        "current-question renderer declares a dependency outside its exact one-member closure",
      );
    }
    for (const child of Object.values(node ?? {})) {
      if (
        child !== null &&
        typeof child === "object" &&
        (
          Array.isArray(child) ||
          typeof child.type === "string"
        )
      ) {
        if (Array.isArray(child)) {
          for (let index = child.length - 1; index >= 0; index -= 1) {
            if (
              child[index] !== null &&
              typeof child[index] === "object"
            ) {
              pending.push(child[index]);
            }
          }
        } else {
          pending.push(child);
        }
      }
    }
  }
}

const expectedDefinitionSelections = Object.freeze([
  Object.freeze({
    ordinal: 1,
    role: "survey-frame",
    paths: Object.freeze(["/spec/synopsis"]),
  }),
  Object.freeze({
    ordinal: 2,
    role: "round-frame",
    paths: Object.freeze(["/spec/synopsis"]),
  }),
  Object.freeze({
    ordinal: 3,
    role: "question-frame",
    paths: Object.freeze(["/spec/synopsis"]),
  }),
  Object.freeze({
    ordinal: 4,
    role: "question",
    paths: Object.freeze([
      "/spec/prompt",
      "/spec/response/options",
      "/spec/response/cardinality",
    ]),
  }),
]);

const expectedProjectionDefinition = Object.freeze({
  absencePreservation: Object.freeze([Object.freeze({
    rule: "omit-target-when-source-absent",
    source: Object.freeze({
      ordinal: 4,
      path: "/spec/prompt/instruction",
    }),
    target: "/prompt/instruction",
  })]),
  constants: Object.freeze([
    Object.freeze({
      target: "/kind",
      value: "question",
    }),
    Object.freeze({
      target: "/responseGuidance/syntax",
      value: "Pick one or more option letters.",
    }),
  ]),
  derivedMappings: Object.freeze([Object.freeze({
    expression: "Q${questionOrdinal}",
    source: "/unit/questionOrdinal",
    target: "/questionId",
  })]),
  targetMappings: Object.freeze([
    Object.freeze({
      source: Object.freeze({
        ordinal: 1,
        path: "/spec/synopsis",
      }),
      target: "/context/surveySynopsis",
    }),
    Object.freeze({
      source: Object.freeze({
        ordinal: 2,
        path: "/spec/synopsis",
      }),
      target: "/context/roundSynopsis",
    }),
    Object.freeze({
      source: Object.freeze({
        ordinal: 3,
        path: "/spec/synopsis",
      }),
      target: "/context/questionSynopsis",
    }),
    Object.freeze({
      source: Object.freeze({
        ordinal: 4,
        path: "/spec/prompt",
      }),
      target: "/prompt",
    }),
    Object.freeze({
      source: Object.freeze({
        ordinal: 4,
        path: "/spec/response/options",
      }),
      target: "/options",
    }),
    Object.freeze({
      source: Object.freeze({
        ordinal: 4,
        path: "/spec/response/cardinality",
      }),
      target: "/responseGuidance",
      transform: "copy-minimum-and-maximum",
    }),
  ]),
});

function assertClosedDefinition(value) {
  if (
    !exactKeys(value, [
      "schemaVersion",
      "id",
      "viewKind",
      "sourceSelections",
      "outputSchema",
      "projection",
    ]) ||
    value.schemaVersion !== "1.0.0" ||
    value.id !== definitionId ||
    value.viewKind !== "question" ||
    !sameValue(
      value.sourceSelections,
      expectedDefinitionSelections,
    ) ||
    !sameValue(
      value.projection,
      expectedProjectionDefinition,
    ) ||
    !exactKeys(
      value.outputSchema,
      ["id", "schemaVersion"],
    ) ||
    value.outputSchema.id !== outputSchemaId ||
    value.outputSchema.schemaVersion !== "2.0.0"
  ) {
    fail(
      "DIRECTOR_PROJECTION_DEFINITION_INVALID",
      "current-question projection definition differs from its exact closed authority",
    );
  }
  return value;
}

function assertOutputSchema(value) {
  if (
    !isRecord(value) ||
    value.$id !== outputSchemaId ||
    value.properties?.schemaVersion?.const !== "2.0.0"
  ) {
    fail(
      "DIRECTOR_PROJECTION_OUTPUT_SCHEMA_INVALID",
      "question-presentation schema differs from its exact ID and version",
    );
  }
}

/**
 * Derive the three immutable pins from relocatable source bytes.
 */
export function deriveDirectorQuestionProjectionAuthority({
  definitionBytes,
  rendererBytes,
  outputSchemaBytes,
}) {
  const definition = assertClosedDefinition(
    parseCanonicalJsonBytes(
      definitionBytes,
      "current-question projection definition",
    ),
  );
  const rendererSource = Buffer.from(rendererBytes);
  if (
    !isUtf8RoundTrip(rendererSource) ||
    rendererSource.includes(0)
  ) {
    fail(
      "DIRECTOR_PROJECTION_RENDERER_CLOSURE_INVALID",
      "current-question renderer must be one exact UTF-8 module with no imports",
    );
  }
  assertClosedRendererModule(rendererSource);
  const outputSchema = parseStrictJsonBytes(
    outputSchemaBytes,
    "question-presentation schema",
  );
  assertOutputSchema(outputSchema);
  const members = [{
    path: rendererPath,
    sourceDigest: sha256Bytes(rendererSource),
  }].sort((left, right) =>
    Buffer.compare(
      Buffer.from(left.path, "utf8"),
      Buffer.from(right.path, "utf8"),
    ));
  return frozen({
    definition: {
      id: definitionId,
      digest: sha256Value({
        domain: definitionDomain,
        definition,
      }),
    },
    engine: {
      id: rendererId,
      executableClosureDigest: sha256Value({
        domain: rendererClosureDomain,
        entryPath: rendererPath,
        members,
      }),
    },
    outputSchema: {
      id: outputSchemaId,
      sourceDigest: sha256Bytes(outputSchemaBytes),
    },
  });
}

export const DIRECTOR_QUESTION_PROJECTION_AUTHORITY =
  await deriveDirectorQuestionProjectionAuthority({
    definitionBytes: await readFile(definitionUrl),
    rendererBytes: await readFile(rendererUrl),
    outputSchemaBytes: await readFile(outputSchemaUrl),
  });

function assertStoredVersion(value, label, kind) {
  if (
    !exactKeys(
      value,
      ["reference", "integrityDigest", "resource"],
    ) ||
    !isRecord(value.resource) ||
    value.resource.kind !== kind
  ) {
    fail(
      "DIRECTOR_PROJECTION_STORED_VERSION_INVALID",
      `${label} must be one exact stored ${kind} version`,
    );
  }
  let reference;
  let integrityDigest;
  try {
    reference = resourceReferenceFrom(value.resource);
    integrityDigest = resourceIntegrityDigest(value.resource);
  } catch (error) {
    fail(
      "DIRECTOR_PROJECTION_STORED_VERSION_INVALID",
      `${label} resource is invalid: ${error.message}`,
    );
  }
  if (
    !sameValue(value.reference, reference) ||
    value.integrityDigest !== integrityDigest
  ) {
    fail(
      "DIRECTOR_PROJECTION_STORED_VERSION_DIVERGENT",
      `${label} reference or integrity digest differs from its resource`,
    );
  }
  return stableValue(value);
}

function exactLayer(
  closure,
  ordinal,
  role,
  expectedReference = undefined,
) {
  const layer = closure.spec?.layers?.[ordinal - 1];
  if (
    !isRecord(layer) ||
    layer.ordinal !== ordinal ||
    layer.role !== role ||
    !isRecord(layer.sourceSnapshot) ||
    !sameValue(
      layer.sourceReference,
      resourceReferenceFrom(layer.sourceSnapshot),
    ) ||
    layer.sourceIntegrityDigest !==
      resourceIntegrityDigest(layer.sourceSnapshot) ||
    (
      expectedReference !== undefined &&
      !sameValue(layer.sourceReference, expectedReference)
    ) ||
    typeof layer.sourceSnapshot.spec?.synopsis !== "string" ||
    !/\S/u.test(layer.sourceSnapshot.spec.synopsis)
  ) {
    fail(
      "DIRECTOR_PROJECTION_CONTEXT_LAYER_INVALID",
      `generation ContextClosure layer ${ordinal} is not the exact ${role} authority`,
    );
  }
  return layer;
}

function selectedSynopsis(layer, ordinal, role) {
  return {
    ordinal,
    role,
    sourceReference: stableValue(layer.sourceReference),
    sourceIntegrityDigest: layer.sourceIntegrityDigest,
    selectedValues: [{
      path: "/spec/synopsis",
      value: layer.sourceSnapshot.spec.synopsis,
    }],
  };
}

function questionSelectedValues(question) {
  const prompt = question.spec?.prompt;
  const response = question.spec?.response;
  if (
    !exactKeys(prompt, ["text"], ["instruction"]) ||
    response?.type !== "Choice" ||
    !Array.isArray(response.options) ||
    response.options.length < 3 ||
    response.options.length > 4 ||
    !exactKeys(response.cardinality, ["minimum", "maximum"])
  ) {
    fail(
      "DIRECTOR_PROJECTION_QUESTION_INVALID",
      "current Question lacks the exact prompt, options, and cardinality projection",
    );
  }
  return [
    { path: "/spec/prompt", value: stableValue(prompt) },
    {
      path: "/spec/response/options",
      value: stableValue(response.options),
    },
    {
      path: "/spec/response/cardinality",
      value: stableValue(response.cardinality),
    },
  ];
}

export function directorProjectionRecipeDigest(recipeValue) {
  const recipe = stableValue(recipeValue);
  delete recipe.recipeDigest;
  return sha256Value({
    domain: recipeDomain,
    recipe,
  });
}

/**
 * Derive the immutable Q1 recipe from four complete stored-resource versions.
 */
export function deriveCurrentQuestionProjectionRecipe({
  instrumentVersion,
  generationContextVersion,
  questionFrameVersion,
  questionVersion,
}) {
  const instrument = assertStoredVersion(
    instrumentVersion,
    "instrumentVersion",
    "RoundInstrument",
  );
  const generationContext = assertStoredVersion(
    generationContextVersion,
    "generationContextVersion",
    "ContextClosure",
  );
  const questionFrame = assertStoredVersion(
    questionFrameVersion,
    "questionFrameVersion",
    "ContextFrame",
  );
  const question = assertStoredVersion(
    questionVersion,
    "questionVersion",
    "Question",
  );
  const unit = instrument.resource.spec?.units?.[0];
  if (
    instrument.resource.spec?.roundOrdinal !== 1 ||
    !Array.isArray(instrument.resource.spec?.units) ||
    instrument.resource.spec.units.length !== 3 ||
    !exactKeys(unit, [
      "slot",
      "questionOrdinal",
      "questionFrameRef",
      "bindingRef",
      "questionRef",
    ]) ||
    unit.slot !== 1 ||
    unit.questionOrdinal !== 1 ||
    !sameValue(
      instrument.resource.spec.generationContextRef,
      generationContext.reference,
    ) ||
    !sameValue(unit.questionFrameRef, questionFrame.reference) ||
    !sameValue(unit.questionRef, question.reference)
  ) {
    fail(
      "DIRECTOR_PROJECTION_INSTRUMENT_INVALID",
      "RoundInstrument does not bind the exact Q1 generation closure, frame, and Question",
    );
  }
  const surveyLayer = exactLayer(
    generationContext.resource,
    1,
    "survey-frame",
  );
  const roundLayer = exactLayer(
    generationContext.resource,
    2,
    "round-frame",
  );
  const questionLayer = exactLayer(
    generationContext.resource,
    4,
    "question-frame-1",
    questionFrame.reference,
  );
  if (
    !sameValue(
      questionLayer.sourceSnapshot,
      questionFrame.resource,
    ) ||
    questionLayer.sourceIntegrityDigest !==
      questionFrame.integrityDigest
  ) {
    fail(
      "DIRECTOR_PROJECTION_QUESTION_FRAME_DIVERGENT",
      "Q1 ContextClosure snapshot differs from the exact stored QuestionFrame version",
    );
  }
  const recipe = {
    $schema: recipeSchemaId,
    schemaVersion: "1.0.0",
    viewKind: "question",
    instrument: {
      reference: instrument.reference,
      integrityDigest: instrument.integrityDigest,
    },
    generationContext: {
      reference: generationContext.reference,
      integrityDigest: generationContext.integrityDigest,
    },
    unit: stableValue(unit),
    sourceSelections: [
      selectedSynopsis(surveyLayer, 1, "survey-frame"),
      selectedSynopsis(roundLayer, 2, "round-frame"),
      selectedSynopsis(
        questionLayer,
        3,
        "question-frame",
      ),
      {
        ordinal: 4,
        role: "question",
        sourceReference: question.reference,
        sourceIntegrityDigest: question.integrityDigest,
        selectedValues:
          questionSelectedValues(question.resource),
      },
    ],
    projection: DIRECTOR_QUESTION_PROJECTION_AUTHORITY,
  };
  return frozen({
    ...recipe,
    recipeDigest: directorProjectionRecipeDigest(recipe),
  });
}

function resolveOneVersion(resourceVersions, reference, label) {
  const matches = resourceVersions.filter(({ reference: candidate }) =>
    sameValue(candidate, reference));
  if (matches.length !== 1) {
    fail(
      "DIRECTOR_PROJECTION_RESOURCE_RESOLUTION_INVALID",
      `${label} must resolve to exactly one immutable stored version`,
    );
  }
  return matches[0];
}

function sessionRecipeSources(session) {
  const workspace = session?.authoring?.workspace;
  const versions = workspace?.spec?.resourceVersions;
  const handoffs = workspace?.spec?.handoffProducts;
  if (!Array.isArray(versions) || !Array.isArray(handoffs)) {
    fail(
      "DIRECTOR_PROJECTION_SESSION_WORKSPACE_INVALID",
      "session lacks one authenticated resource inventory and handoff view",
    );
  }
  const instrumentHandoffs = handoffs.filter(
    (handoff) => handoff.slot === "round-1-instrument",
  );
  if (
    instrumentHandoffs.length !== 1 ||
    !exactKeys(
      instrumentHandoffs[0],
      ["slot", "reference"],
    )
  ) {
    fail(
      "DIRECTOR_PROJECTION_HANDOFF_INVALID",
      "session must hand off exactly one round-1-instrument",
    );
  }
  const instrumentVersion = resolveOneVersion(
    versions,
    instrumentHandoffs[0].reference,
    "RoundInstrument",
  );
  const instrument = instrumentVersion.resource;
  const unit = instrument.spec?.units?.[0];
  return {
    instrumentVersion,
    generationContextVersion: resolveOneVersion(
      versions,
      instrument.spec?.generationContextRef,
      "AT05 ContextClosure",
    ),
    questionFrameVersion: resolveOneVersion(
      versions,
      unit?.questionFrameRef,
      "Q1 ContextFrame",
    ),
    questionVersion: resolveOneVersion(
      versions,
      unit?.questionRef,
      "Q1 Question",
    ),
  };
}

export function deriveCurrentQuestionProjectionRecipeFromSession(
  session,
) {
  if (
    session?.phase !== "round_1_q1_ready" ||
    session?.authoring?.workspace?.spec?.authoringState !==
      "waiting_for_round_1_responses"
  ) {
    fail(
      "DIRECTOR_PROJECTION_SESSION_STATE_INVALID",
      "Q1 recipe derivation requires the exact R12 paired postcondition",
    );
  }
  return deriveCurrentQuestionProjectionRecipe(
    sessionRecipeSources(session),
  );
}

export function verifyCurrentQuestionProjectionRecipe(
  recipe,
  sources,
) {
  const expected =
    deriveCurrentQuestionProjectionRecipe(sources);
  if (
    !sameValue(recipe, expected) ||
    recipe?.recipeDigest !==
      directorProjectionRecipeDigest(recipe) ||
    !sameValue(
      recipe?.projection,
      DIRECTOR_QUESTION_PROJECTION_AUTHORITY,
    )
  ) {
    fail(
      "DIRECTOR_PROJECTION_RECIPE_DIVERGENT",
      "persisted current-question recipe differs from deterministic authority",
    );
  }
  return expected;
}

export function verifyCurrentQuestionProjectionRecipeFromSession(
  session,
) {
  if (session?.phase !== "round_1_q1_ready") {
    if (session?.pendingProjection !== null) {
      fail(
        "DIRECTOR_PROJECTION_PHASE_DIVERGENT",
        "pendingProjection must be null outside round_1_q1_ready",
      );
    }
    return null;
  }
  const sources = sessionRecipeSources(session);
  return verifyCurrentQuestionProjectionRecipe(
    session.pendingProjection,
    sources,
  );
}

export function renderCurrentQuestionPresentation(recipe) {
  if (
    !sameValue(
      recipe?.projection,
      DIRECTOR_QUESTION_PROJECTION_AUTHORITY,
    ) ||
    recipe?.recipeDigest !==
      directorProjectionRecipeDigest(recipe)
  ) {
    fail(
      "DIRECTOR_PROJECTION_RENDER_ADMISSION_INVALID",
      "renderer admission requires a self-consistent recipe pinned to the current projection authority",
    );
  }
  return renderDormantPresentation(recipe);
}
