import {
  canonicalize,
  stableValue,
} from "../kernel/canonical.mjs";
import {
  formDefinitionDigest,
  resourceReferenceFrom,
  resourceSemanticDigest,
} from "../kernel/digests.mjs";
import {
  validateContextFrameSemantics,
} from "../../../dependencies/shared-schemas/v1/snapshot/context-frame/v1alpha1/context-frame.validator.mjs";
import {
  createSurveyResourceResolver,
  validateSurveyResourceSemantics,
} from "./resource-semantics.mjs";

const zeroDigest = `sha256:${"0".repeat(64)}`;
const semanticText = /\S/u;
const scopeRelations = new Set([
  "narrows",
  "partitions",
  "qualifies",
]);
const givenClasses = new Set([
  "fact",
  "assumption",
  "constraint",
]);

export class RoundOneFrameAuthorityError extends Error {
  constructor(code, field, message) {
    super(message);
    this.name = "RoundOneFrameAuthorityError";
    this.code = code;
    this.field = field;
  }
}

function fail(code, field, message) {
  throw new RoundOneFrameAuthorityError(code, field, message);
}

function isRecord(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function freezeValue(value) {
  if (
    value !== null &&
    typeof value === "object" &&
    !Object.isFrozen(value)
  ) {
    for (const child of Object.values(value)) freezeValue(child);
    Object.freeze(value);
  }
  return value;
}

function exactKeys(value, required, optional = []) {
  if (!isRecord(value)) return false;
  const admitted = new Set([...required, ...optional]);
  const keys = Object.keys(value);
  return (
    required.every((key) => Object.hasOwn(value, key)) &&
    keys.every((key) => admitted.has(key))
  );
}

function codePointLength(value) {
  return [...value].length;
}

function field({
  id,
  ordinal,
  heading,
  instruction,
  type,
  required,
  placeholder,
  constraints,
}) {
  return {
    id,
    ordinal,
    heading,
    instruction,
    type,
    required,
    placeholder,
    constraints,
  };
}

export function createRoundOneFrameFormDefinition() {
  const form = {
    apiVersion: "authoring.mission-kit/v1alpha1",
    kind: "AuthoringFormDefinition",
    metadata: { name: "round-one-frame-form" },
    spec: {
      formDigest: zeroDigest,
      grammarVersion: "mission-kit-authoring-text/v1",
      title: "Define the Round 1 context",
      introduction:
        "Frame the foundation Round within the frozen Survey boundary before any QuestionFrame or Question is generated.",
      fields: [
        field({
          id: "subject",
          ordinal: 1,
          heading: "Subject",
          instruction: "Name the bounded subject of Round 1.",
          type: "paragraph",
          required: true,
          placeholder: "Enter the Round 1 subject",
          constraints: { minLength: 1, maxLength: 160 },
        }),
        field({
          id: "purpose",
          ordinal: 2,
          heading: "Purpose",
          instruction:
            "State why Director judgment is required in this foundation Round.",
          type: "paragraph",
          required: true,
          placeholder: "Enter the Round 1 purpose",
          constraints: { minLength: 1, maxLength: 1000 },
        }),
        field({
          id: "scope-included",
          ordinal: 3,
          heading: "Included scope",
          instruction:
            "List the ordered Round boundaries inside the frozen Survey frame.",
          type: "string-list",
          required: true,
          placeholder: "Enter one included Round boundary",
          constraints: {
            minItems: 1,
            maxItems: 16,
            itemMinLength: 1,
            itemMaxLength: 280,
            uniqueItems: true,
          },
        }),
        field({
          id: "scope-excluded",
          ordinal: 4,
          heading: "Excluded scope",
          instruction:
            "Optionally list boundaries explicitly outside this Round.",
          type: "string-list",
          required: false,
          placeholder: "Enter one excluded Round boundary",
          constraints: {
            minItems: 0,
            maxItems: 16,
            itemMinLength: 1,
            itemMaxLength: 280,
            uniqueItems: true,
          },
        }),
        field({
          id: "givens",
          ordinal: 5,
          heading: "Givens",
          instruction:
            "Optionally enter '<fact|assumption|constraint> | <text>', one item per line.",
          type: "string-list",
          required: false,
          placeholder: "constraint | Enter one fixed Round condition",
          constraints: {
            minItems: 0,
            maxItems: 24,
            itemMinLength: 8,
            itemMaxLength: 513,
            uniqueItems: true,
          },
        }),
        field({
          id: "synopsis",
          ordinal: 6,
          heading: "Synopsis",
          instruction:
            "Write the exact short Round context wording suitable for deterministic projection.",
          type: "paragraph",
          required: true,
          placeholder: "Enter the bounded Round 1 synopsis",
          constraints: { minLength: 1, maxLength: 320 },
        }),
        field({
          id: "terms",
          ordinal: 7,
          heading: "Terms",
          instruction:
            "Optionally enter '<term> | <meaning>', one item per line.",
          type: "string-list",
          required: false,
          placeholder: "term | Enter its fixed meaning",
          constraints: {
            minItems: 0,
            maxItems: 16,
            itemMinLength: 5,
            itemMaxLength: 363,
            uniqueItems: true,
          },
        }),
        field({
          id: "scope-relation",
          ordinal: 8,
          heading: "Scope relation",
          instruction:
            "Declare how this Round relates to the frozen Survey frame.",
          type: "enum",
          required: true,
          placeholder: "Select one scope relation",
          constraints: {
            members: ["narrows", "partitions", "qualifies"],
          },
        }),
        field({
          id: "containment-rationale",
          ordinal: 9,
          heading: "Containment rationale",
          instruction:
            "Explain why the declared Round scope remains within the frozen Survey frame.",
          type: "paragraph",
          required: true,
          placeholder: "Enter the authored containment rationale",
          constraints: { minLength: 1, maxLength: 2000 },
        }),
      ],
    },
  };
  form.spec.formDigest = formDefinitionDigest(form);
  return Object.freeze(stableValue(form));
}

function requiredText(value, fieldId, maximum) {
  if (
    typeof value !== "string" ||
    !value.isWellFormed() ||
    codePointLength(value) < 1 ||
    codePointLength(value) > maximum ||
    !semanticText.test(value)
  ) {
    fail(
      "ROUND_ONE_FRAME_FIELD_INVALID",
      `/${fieldId}`,
      `${fieldId} must be one bounded non-whitespace string`,
    );
  }
  return value;
}

function stringList(value, fieldId, {
  minimum,
  maximum,
  itemMaximum,
}) {
  if (
    !Array.isArray(value) ||
    value.length < minimum ||
    value.length > maximum
  ) {
    fail(
      "ROUND_ONE_FRAME_FIELD_INVALID",
      `/${fieldId}`,
      `${fieldId} must contain ${minimum} through ${maximum} ordered items`,
    );
  }
  const seen = new Set();
  return value.map((item, index) => {
    const selected = requiredText(
      item,
      `${fieldId}/${index}`,
      itemMaximum,
    );
    if (seen.has(selected)) {
      fail(
        "ROUND_ONE_FRAME_FIELD_DUPLICATE",
        `/${fieldId}/${index}`,
        `${fieldId} contains a duplicate item`,
      );
    }
    seen.add(selected);
    return selected;
  });
}

function splitRecord(value, fieldId, index) {
  const delimiter = " | ";
  const position = value.indexOf(delimiter);
  if (position < 1 || position + delimiter.length >= value.length) {
    fail(
      "ROUND_ONE_FRAME_RECORD_INVALID",
      `/${fieldId}/${index}`,
      `${fieldId} item must contain one non-empty pair separated by ' | '`,
    );
  }
  return [
    value.slice(0, position),
    value.slice(position + delimiter.length),
  ];
}

function givens(values) {
  const seen = new Set();
  return values.map((value, index) => {
    const [classification, text] = splitRecord(value, "givens", index);
    if (!givenClasses.has(classification)) {
      fail(
        "ROUND_ONE_FRAME_GIVEN_CLASS_INVALID",
        `/givens/${index}`,
        "given classification must be fact, assumption, or constraint",
      );
    }
    requiredText(text, `givens/${index}`, 500);
    if (seen.has(text)) {
      fail(
        "ROUND_ONE_FRAME_GIVEN_DUPLICATE",
        `/givens/${index}`,
        "given text must be unique independent of classification",
      );
    }
    seen.add(text);
    return { classification, text };
  });
}

function terms(values) {
  const seen = new Set();
  return values.map((value, index) => {
    const [term, meaning] = splitRecord(value, "terms", index);
    requiredText(term, `terms/${index}/term`, 80);
    requiredText(meaning, `terms/${index}/meaning`, 280);
    if (seen.has(term)) {
      fail(
        "ROUND_ONE_FRAME_TERM_DUPLICATE",
        `/terms/${index}`,
        "term names must be unique",
      );
    }
    seen.add(term);
    return { term, meaning };
  });
}

function deterministicName(prefix, resource) {
  const digest = resourceSemanticDigest(resource)
    .slice("sha256:".length);
  resource.metadata.name = `${prefix}-${digest}`;
  return resource;
}

function exactLayer(contextClosure, {
  ordinal,
  role,
  apiVersion,
  kind,
  selectedPath,
  selectedValue,
}) {
  const layers = contextClosure?.spec?.layers;
  if (!Array.isArray(layers) || layers.length !== 2) {
    fail(
      "ROUND_ONE_FRAME_CONTEXT_INVALID",
      "/contextClosure/spec/layers",
      "Round 1 frame construction requires exactly two frozen parent layers",
    );
  }
  const layer = layers[ordinal - 1];
  if (
    layer?.ordinal !== ordinal ||
    layer?.role !== role ||
    layer?.sourceReference?.apiVersion !== apiVersion ||
    layer?.sourceReference?.kind !== kind ||
    layer?.sourceSnapshot?.apiVersion !== apiVersion ||
    layer?.sourceSnapshot?.kind !== kind ||
    canonicalize(resourceReferenceFrom(layer.sourceSnapshot)) !==
      canonicalize(layer.sourceReference) ||
    !Array.isArray(layer.selectedValue) ||
    layer.selectedValue.length !== 1 ||
    layer.selectedValue[0]?.path !== selectedPath ||
    canonicalize(layer.selectedValue[0]?.value) !==
      canonicalize(selectedValue(layer.sourceSnapshot))
  ) {
    fail(
      "ROUND_ONE_FRAME_CONTEXT_INVALID",
      `/contextClosure/spec/layers/${ordinal - 1}`,
      `Round 1 frame ${role} layer differs from its exact frozen authority`,
    );
  }
  return layer;
}

function exactParentClosure(contextClosure) {
  const surveyFrame = exactLayer(contextClosure, {
    ordinal: 1,
    role: "survey-frame",
    apiVersion: "schemas.mission-kit/v1alpha1",
    kind: "ContextFrame",
    selectedPath: "/spec",
    selectedValue: (resource) => resource.spec,
  });
  const survey = exactLayer(contextClosure, {
    ordinal: 2,
    role: "survey",
    apiVersion: "survey.mission-kit/v1alpha1",
    kind: "Survey",
    selectedPath: "/spec/outcomeAxes",
    selectedValue: (resource) => resource.spec?.outcomeAxes,
  });
  if (
    canonicalize(survey.sourceSnapshot.spec?.surveyFrameRef) !==
      canonicalize(surveyFrame.sourceReference)
  ) {
    fail(
      "ROUND_ONE_PARENT_ANCESTRY_MISMATCH",
      "/contextClosure/spec/layers/1/sourceSnapshot/spec/surveyFrameRef",
      "The frozen Survey must bind the exact active Survey ContextFrame",
    );
  }
  return { surveyFrame, survey };
}

export function buildRoundOneFrameProducts({
  normalizedValues,
  contextClosure,
}) {
  if (
    !exactKeys(
      normalizedValues,
      [
        "subject",
        "purpose",
        "scope-included",
        "synopsis",
        "scope-relation",
        "containment-rationale",
      ],
      ["scope-excluded", "givens", "terms"],
    )
  ) {
    fail(
      "ROUND_ONE_FRAME_VALUES_INVALID",
      "/normalizedValues",
      "Round 1 frame values contain missing or ambient fields",
    );
  }
  const scopeRelation = normalizedValues["scope-relation"];
  if (!scopeRelations.has(scopeRelation)) {
    fail(
      "ROUND_ONE_SCOPE_RELATION_INVALID",
      "/scope-relation",
      "scope-relation must be narrows, partitions, or qualifies",
    );
  }
  const { surveyFrame, survey } = exactParentClosure(contextClosure);
  const included = stringList(
    normalizedValues["scope-included"],
    "scope-included",
    { minimum: 1, maximum: 16, itemMaximum: 280 },
  );
  const excluded = stringList(
    normalizedValues["scope-excluded"] ?? [],
    "scope-excluded",
    { minimum: 0, maximum: 16, itemMaximum: 280 },
  );
  const givenValues = stringList(
    normalizedValues.givens ?? [],
    "givens",
    { minimum: 0, maximum: 24, itemMaximum: 513 },
  );
  const termValues = stringList(
    normalizedValues.terms ?? [],
    "terms",
    { minimum: 0, maximum: 16, itemMaximum: 363 },
  );
  const frame = deterministicName("round-one-frame", {
    apiVersion: "schemas.mission-kit/v1alpha1",
    kind: "ContextFrame",
    metadata: { name: "pending" },
    spec: {
      subject: requiredText(normalizedValues.subject, "subject", 160),
      purpose: requiredText(normalizedValues.purpose, "purpose", 1000),
      scope: { included, excluded },
      givens: givens(givenValues),
      synopsis: requiredText(normalizedValues.synopsis, "synopsis", 320),
      terms: terms(termValues),
    },
  });
  const frameIssues = validateContextFrameSemantics(frame);
  if (frameIssues.length > 0) {
    const first = frameIssues[0];
    fail(first.code, first.path, first.message);
  }
  const round = deterministicName("round-one", {
    apiVersion: "survey.mission-kit/v1alpha1",
    kind: "SurveyRound",
    metadata: { name: "pending" },
    spec: {
      surveyRef: stableValue(survey.sourceReference),
      ordinal: 1,
      role: "foundation",
      surveyFrameRef: stableValue(surveyFrame.sourceReference),
      roundFrameRef: resourceReferenceFrom(frame),
      parentBinding: {
        parentFrameRef: stableValue(surveyFrame.sourceReference),
        scopeRelation,
        containmentRationale: requiredText(
          normalizedValues["containment-rationale"],
          "containment-rationale",
          2000,
        ),
      },
    },
  });
  const roundIssues = validateSurveyResourceSemantics(round, {
    resolveReference: createSurveyResourceResolver([
      surveyFrame.sourceSnapshot,
      survey.sourceSnapshot,
      frame,
      round,
    ]),
  });
  if (roundIssues.length > 0) {
    const first = roundIssues[0];
    fail(first.code, first.field, first.reason);
  }
  return freezeValue([
    {
      slot: "round-1-frame",
      resource: stableValue(frame),
      dependencies: [{
        relation: "derived-from",
        selector: {
          mode: "context-layer",
          ordinal: surveyFrame.ordinal,
        },
      }],
    },
    {
      slot: "round-1",
      resource: stableValue(round),
      dependencies: [
        {
          relation: "belongs-to",
          selector: {
            mode: "context-layer",
            ordinal: survey.ordinal,
          },
        },
        {
          relation: "frames",
          selector: {
            mode: "created-slot",
            slot: "round-1-frame",
          },
        },
        {
          relation: "parent-frame",
          selector: {
            mode: "context-layer",
            ordinal: surveyFrame.ordinal,
          },
        },
      ],
    },
  ]);
}
