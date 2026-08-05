import {
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

const zeroDigest = `sha256:${"0".repeat(64)}`;
const semanticText = /\S/u;
const givenClasses = new Set([
  "fact",
  "assumption",
  "constraint",
]);

export class SurveyFrameAuthorityError extends Error {
  constructor(code, field, message) {
    super(message);
    this.name = "SurveyFrameAuthorityError";
    this.code = code;
    this.field = field;
  }
}

function fail(code, field, message) {
  throw new SurveyFrameAuthorityError(code, field, message);
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

export function createSurveyFrameFormDefinition() {
  const form = {
    apiVersion: "authoring.mission-kit/v1alpha1",
    kind: "AuthoringFormDefinition",
    metadata: { name: "survey-frame-form" },
    spec: {
      formDigest: zeroDigest,
      grammarVersion: "mission-kit-authoring-text/v1",
      title: "Define the Survey context",
      introduction:
        "Frame the decision before any Round or Question is generated. Preserve declared order where it conveys priority.",
      fields: [
        field({
          id: "subject",
          ordinal: 1,
          heading: "Subject",
          instruction: "Name the thing being framed.",
          type: "paragraph",
          required: true,
          placeholder: "Enter the bounded Survey subject",
          constraints: { minLength: 1, maxLength: 160 },
        }),
        field({
          id: "purpose",
          ordinal: 2,
          heading: "Purpose",
          instruction: "State why Director judgment is required.",
          type: "paragraph",
          required: true,
          placeholder: "Enter the Survey purpose",
          constraints: { minLength: 1, maxLength: 1000 },
        }),
        field({
          id: "outcome-axes",
          ordinal: 3,
          heading: "Outcome axes",
          instruction:
            "List the ordered dimensions against which the final intent should be useful.",
          type: "string-list",
          required: true,
          placeholder: "Enter one outcome axis",
          constraints: {
            minItems: 1,
            maxItems: 16,
            itemMinLength: 1,
            itemMaxLength: 512,
            uniqueItems: true,
          },
        }),
        field({
          id: "scope-included",
          ordinal: 4,
          heading: "Included scope",
          instruction: "List the ordered boundaries inside this Survey.",
          type: "string-list",
          required: true,
          placeholder: "Enter one included boundary",
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
          ordinal: 5,
          heading: "Excluded scope",
          instruction: "Optionally list boundaries explicitly outside this Survey.",
          type: "string-list",
          required: false,
          placeholder: "Enter one excluded boundary",
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
          ordinal: 6,
          heading: "Givens",
          instruction:
            "Optionally enter '<fact|assumption|constraint> | <text>', one item per line.",
          type: "string-list",
          required: false,
          placeholder: "constraint | Enter one fixed condition",
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
          ordinal: 7,
          heading: "Synopsis",
          instruction:
            "Write the exact short context wording suitable for deterministic projection.",
          type: "paragraph",
          required: true,
          placeholder: "Enter the bounded Survey synopsis",
          constraints: { minLength: 1, maxLength: 320 },
        }),
        field({
          id: "terms",
          ordinal: 8,
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
      "SURVEY_FRAME_FIELD_INVALID",
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
      "SURVEY_FRAME_FIELD_INVALID",
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
        "SURVEY_FRAME_FIELD_DUPLICATE",
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
      "SURVEY_FRAME_RECORD_INVALID",
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
        "SURVEY_FRAME_GIVEN_CLASS_INVALID",
        `/givens/${index}`,
        "given classification must be fact, assumption, or constraint",
      );
    }
    requiredText(text, `givens/${index}`, 500);
    if (seen.has(text)) {
      fail(
        "SURVEY_FRAME_GIVEN_DUPLICATE",
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
        "SURVEY_FRAME_TERM_DUPLICATE",
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

function policyLayer(contextClosure) {
  const layers = contextClosure?.spec?.layers;
  if (!Array.isArray(layers)) {
    fail(
      "SURVEY_FRAME_CONTEXT_INVALID",
      "/contextClosure",
      "SurveyFrame construction requires one ContextClosure",
    );
  }
  const matches = layers.filter((layer) => layer.role === "policy");
  if (matches.length !== 1) {
    fail(
      "SURVEY_FRAME_POLICY_CONTEXT_INVALID",
      "/contextClosure/spec/layers",
      `policy context must resolve exactly once; resolved ${matches.length}`,
    );
  }
  return matches[0];
}

export function buildSurveyFrameProducts({
  normalizedValues,
  contextClosure,
}) {
  if (
    !exactKeys(
      normalizedValues,
      [
        "subject",
        "purpose",
        "outcome-axes",
        "scope-included",
        "synopsis",
      ],
      ["scope-excluded", "givens", "terms"],
    )
  ) {
    fail(
      "SURVEY_FRAME_VALUES_INVALID",
      "/normalizedValues",
      "SurveyFrame values contain missing or ambient fields",
    );
  }
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
  const outcomeAxes = stringList(
    normalizedValues["outcome-axes"],
    "outcome-axes",
    { minimum: 1, maximum: 16, itemMaximum: 512 },
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
  const frame = deterministicName("survey-frame", {
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
    fail(
      first.code,
      first.path,
      first.message,
    );
  }
  const policy = policyLayer(contextClosure);
  const survey = deterministicName("survey", {
    apiVersion: "survey.mission-kit/v1alpha1",
    kind: "Survey",
    metadata: { name: "pending" },
    spec: {
      policySnapshotRef: stableValue(policy.sourceReference),
      surveyFrameRef: resourceReferenceFrom(frame),
      outcomeAxes,
    },
  });
  return freezeValue([
    {
      slot: "survey-frame",
      resource: stableValue(frame),
      dependencies: [
        {
          relation: "derived-from",
          selector: {
            mode: "context-layer",
            ordinal: 1,
          },
        },
        {
          relation: "governed-by",
          selector: {
            mode: "context-layer",
            ordinal: policy.ordinal,
          },
        },
      ],
    },
    {
      slot: "survey",
      resource: stableValue(survey),
      dependencies: [
        {
          relation: "governed-by",
          selector: {
            mode: "context-layer",
            ordinal: policy.ordinal,
          },
        },
        {
          relation: "frames",
          selector: {
            mode: "created-slot",
            slot: "survey-frame",
          },
        },
      ],
    },
  ]);
}
