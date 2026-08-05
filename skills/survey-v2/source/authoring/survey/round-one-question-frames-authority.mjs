import { validateById } from "../../../generated/validators.mjs";
import { canonicalize, stableValue } from "../kernel/canonical.mjs";
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
const scopeRelations = new Set(["narrows", "partitions", "qualifies"]);
const givenClasses = new Set(["fact", "assumption", "constraint"]);

export class RoundOneQuestionFramesAuthorityError extends Error {
  constructor(code, field, message) {
    super(message);
    this.name = "RoundOneQuestionFramesAuthorityError";
    this.code = code;
    this.field = field;
  }
}

function fail(code, field, message) {
  throw new RoundOneQuestionFramesAuthorityError(code, field, message);
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function freezeValue(value) {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freezeValue(child);
    Object.freeze(value);
  }
  return value;
}

function exactKeys(value, required, optional = []) {
  if (!isRecord(value)) return false;
  const admitted = new Set([...required, ...optional]);
  return (
    required.every((key) => Object.hasOwn(value, key)) &&
    Object.keys(value).every((key) => admitted.has(key))
  );
}

function requiredText(value, field, maximum) {
  if (
    typeof value !== "string" ||
    !value.isWellFormed() ||
    [...value].length < 1 ||
    [...value].length > maximum ||
    !semanticText.test(value)
  ) {
    fail(
      "ROUND_ONE_QUESTION_FRAME_FIELD_INVALID",
      `/${field}`,
      `${field} must be one bounded non-whitespace string`,
    );
  }
  return value;
}

function list(value, field, minimum, maximum, itemMaximum) {
  if (!Array.isArray(value) || value.length < minimum || value.length > maximum) {
    fail(
      "ROUND_ONE_QUESTION_FRAME_FIELD_INVALID",
      `/${field}`,
      `${field} must contain ${minimum} through ${maximum} ordered items`,
    );
  }
  const seen = new Set();
  return value.map((item, index) => {
    const selected = requiredText(item, `${field}/${index}`, itemMaximum);
    if (seen.has(selected)) {
      fail(
        "ROUND_ONE_QUESTION_FRAME_FIELD_DUPLICATE",
        `/${field}/${index}`,
        `${field} contains a duplicate item`,
      );
    }
    seen.add(selected);
    return selected;
  });
}

function pair(value, field, index) {
  const delimiter = " | ";
  const at = value.indexOf(delimiter);
  if (at < 1 || at + delimiter.length >= value.length) {
    fail(
      "ROUND_ONE_QUESTION_FRAME_RECORD_INVALID",
      `/${field}/${index}`,
      `${field} item must contain one non-empty pair separated by ' | '; later delimiters remain in the right-hand text`,
    );
  }
  return [value.slice(0, at), value.slice(at + delimiter.length)];
}

function givens(values, field) {
  const seen = new Set();
  return values.map((value, index) => {
    const [classification, text] = pair(value, field, index);
    if (!givenClasses.has(classification)) {
      fail(
        "ROUND_ONE_QUESTION_FRAME_GIVEN_CLASS_INVALID",
        `/${field}/${index}`,
        "given classification must be fact, assumption, or constraint",
      );
    }
    requiredText(text, `${field}/${index}`, 500);
    if (seen.has(text)) fail(
      "ROUND_ONE_QUESTION_FRAME_GIVEN_DUPLICATE",
      `/${field}/${index}`,
      "given text must be unique independent of classification",
    );
    seen.add(text);
    return { classification, text };
  });
}

function terms(values, field) {
  const seen = new Set();
  return values.map((value, index) => {
    const [term, meaning] = pair(value, field, index);
    requiredText(term, `${field}/${index}/term`, 80);
    requiredText(meaning, `${field}/${index}/meaning`, 280);
    if (seen.has(term)) fail(
      "ROUND_ONE_QUESTION_FRAME_TERM_DUPLICATE",
      `/${field}/${index}`,
      "term names must be unique",
    );
    seen.add(term);
    return { term, meaning };
  });
}

function anchors(values, field, outcomeAxes) {
  const seen = new Set();
  return values.map((value, index) => {
    const [axis, anchor] = pair(value, field, index);
    requiredText(axis, `${field}/${index}/axis`, 512);
    requiredText(anchor, `${field}/${index}/anchor`, 512);
    if (!outcomeAxes.has(axis)) fail(
      "ROUND_ONE_QUESTION_FRAME_AXIS_UNKNOWN",
      `/${field}/${index}/axis`,
      "anchor axis must exactly name one frozen Survey outcome axis",
    );
    if (seen.has(axis)) fail(
      "ROUND_ONE_QUESTION_FRAME_AXIS_DUPLICATE",
      `/${field}/${index}`,
      "outcome-axis anchor names must be unique",
    );
    seen.add(axis);
    return { axis, anchor };
  });
}

function deterministicName(prefix, resource) {
  resource.metadata.name =
    `${prefix}-${resourceSemanticDigest(resource).slice("sha256:".length)}`;
  return resource;
}

function formField(id, ordinal, heading, instruction, type, required, constraints) {
  return {
    id,
    ordinal,
    heading,
    instruction,
    type,
    required,
    placeholder: `Enter ${heading.toLowerCase()}`,
    constraints,
  };
}

export function createRoundOneQuestionFramesFormDefinition() {
  const fields = [];
  let ordinal = 1;
  for (let question = 1; question <= 3; question += 1) {
    const prefix = `q${question}-`;
    const add = (suffix, heading, instruction, type, required, constraints) =>
      fields.push(formField(
        `${prefix}${suffix}`,
        ordinal++,
        `Frame ${question} ${heading}`,
        instruction,
        type,
        required,
        constraints,
      ));
    add("subject", "subject", "Name this frame's bounded subject.", "paragraph", true, { minLength: 1, maxLength: 160 });
    add("purpose", "purpose", "State why this scoped subject requires Director judgment.", "paragraph", true, { minLength: 1, maxLength: 1000 });
    add("scope-included", "included scope", "List its ordered included boundaries.", "string-list", true, { minItems: 1, maxItems: 16, itemMinLength: 1, itemMaxLength: 280, uniqueItems: true });
    add("scope-excluded", "excluded scope", "Optionally list excluded boundaries.", "string-list", false, { minItems: 0, maxItems: 16, itemMinLength: 1, itemMaxLength: 280, uniqueItems: true });
    add("givens", "givens", "Optionally enter '<fact|assumption|constraint> | <text>'.", "string-list", false, { minItems: 0, maxItems: 24, itemMinLength: 8, itemMaxLength: 513, uniqueItems: true });
    add("synopsis", "synopsis", "Write one neutral declarative Director-visible context sentence: no interrogative prompt, option, recommendation, answer implication, or preferred direction.", "paragraph", true, { minLength: 1, maxLength: 320 });
    add("terms", "terms", "Optionally enter '<term> | <meaning>'.", "string-list", false, { minItems: 0, maxItems: 16, itemMinLength: 5, itemMaxLength: 363, uniqueItems: true });
    add("scope-relation", "scope relation", "Declare how this frame relates to the Round frame.", "enum", true, { members: ["narrows", "partitions", "qualifies"] });
    add("containment-rationale", "containment rationale", "Explain why this frame remains within the Round frame.", "paragraph", true, { minLength: 1, maxLength: 2000 });
    add("intent-dimension", "intent dimension", "Name the orthogonal intent dimension elicited.", "paragraph", true, { minLength: 1, maxLength: 512 });
    add("outcome-axis-anchors", "outcome-axis anchors", "Enter '<exact Survey axis> | <neutral coverage target explaining how this frame elicits relevant evidence>', one per line; never imply a preferred answer.", "string-list", true, { minItems: 1, maxItems: 16, itemMinLength: 5, itemMaxLength: 1027, uniqueItems: true });
  }
  fields.push(
    formField("coverage-rationale", ordinal++, "Coverage rationale", "Explain how the three frames cover the Round boundary.", "paragraph", true, { minLength: 1, maxLength: 2000 }),
    formField("orthogonality-rationale", ordinal, "Orthogonality rationale", "Explain how the three intent dimensions remain distinct.", "paragraph", true, { minLength: 1, maxLength: 2000 }),
  );
  const form = {
    apiVersion: "authoring.mission-kit/v1alpha1",
    kind: "AuthoringFormDefinition",
    metadata: { name: "round-one-question-frames-form" },
    spec: {
      formDigest: zeroDigest,
      grammarVersion: "mission-kit-authoring-text/v1",
      title: "Define the Round 1 Question context frames",
      introduction: "Author exactly three orthogonal QuestionFrames within the frozen Survey and Round boundaries. No Question wording is authored here.",
      fields,
    },
  };
  form.spec.formDigest = formDefinitionDigest(form);
  return Object.freeze(stableValue(form));
}

function exactFrameLayer(layer, ordinal, role) {
  if (
    layer?.ordinal !== ordinal ||
    layer?.role !== role ||
    layer?.sourceReference?.apiVersion !== "schemas.mission-kit/v1alpha1" ||
    layer?.sourceReference?.kind !== "ContextFrame" ||
    layer?.sourceSnapshot?.apiVersion !== "schemas.mission-kit/v1alpha1" ||
    layer?.sourceSnapshot?.kind !== "ContextFrame" ||
    canonicalize(resourceReferenceFrom(layer.sourceSnapshot)) !== canonicalize(layer.sourceReference) ||
    !Array.isArray(layer.selectedValue) ||
    layer.selectedValue.length !== 1 ||
    layer.selectedValue[0]?.path !== "/spec" ||
    canonicalize(layer.selectedValue[0]?.value) !== canonicalize(layer.sourceSnapshot.spec)
  ) fail(
    "ROUND_ONE_QUESTION_FRAMES_CONTEXT_INVALID",
    `/contextClosure/spec/layers/${ordinal - 1}`,
    `${role} differs from its exact frozen authority`,
  );
  return layer;
}

function exactSurveyLayer(layer) {
  if (
    layer?.ordinal !== 3 ||
    layer?.role !== "survey" ||
    layer?.sourceReference?.apiVersion !== "survey.mission-kit/v1alpha1" ||
    layer?.sourceReference?.kind !== "Survey" ||
    layer?.sourceSnapshot?.apiVersion !== "survey.mission-kit/v1alpha1" ||
    layer?.sourceSnapshot?.kind !== "Survey" ||
    canonicalize(resourceReferenceFrom(layer.sourceSnapshot)) !== canonicalize(layer.sourceReference) ||
    !Array.isArray(layer.selectedValue) ||
    layer.selectedValue.length !== 1 ||
    layer.selectedValue[0]?.path !== "/spec/outcomeAxes" ||
    canonicalize(layer.selectedValue[0]?.value) !==
      canonicalize(layer.sourceSnapshot.spec?.outcomeAxes)
  ) fail(
    "ROUND_ONE_QUESTION_FRAMES_CONTEXT_INVALID",
    "/contextClosure/spec/layers/2",
    "survey differs from its exact frozen outcome-axis authority",
  );
  return layer;
}

function active(workspace, slot) {
  const matches = workspace?.spec?.activeHeads?.filter((head) => head.slot === slot) ?? [];
  if (matches.length !== 1) fail(
    "ROUND_ONE_QUESTION_FRAMES_ACTIVE_HEAD_INVALID",
    `/workspace/spec/activeHeads/${slot}`,
    `${slot} must resolve to exactly one active head`,
  );
  return matches[0].reference;
}

function hasEdge(workspace, from, relation, to) {
  return workspace.spec.dependencyEdges.some((edge) =>
    edge.relation === relation &&
    canonicalize(edge.from) === canonicalize(from) &&
    canonicalize(edge.to) === canonicalize(to)
  );
}

function parentAuthority(contextClosure, workspace) {
  const layers = contextClosure?.spec?.layers;
  if (!Array.isArray(layers) || layers.length !== 3) fail(
    "ROUND_ONE_QUESTION_FRAMES_CONTEXT_INVALID",
    "/contextClosure/spec/layers",
    "QuestionFrame construction requires exactly three frozen authority layers",
  );
  const surveyFrame = exactFrameLayer(layers[0], 1, "survey-frame");
  const roundFrame = exactFrameLayer(layers[1], 2, "round-frame");
  const survey = exactSurveyLayer(layers[2]);
  const surveyFrameHead = active(workspace, "survey-frame");
  const surveyHead = active(workspace, "survey");
  const roundFrameHead = active(workspace, "round-1-frame");
  const roundHead = active(workspace, "round-1");
  if (
    canonicalize(surveyFrameHead) !== canonicalize(surveyFrame.sourceReference) ||
    canonicalize(roundFrameHead) !== canonicalize(roundFrame.sourceReference) ||
    canonicalize(surveyHead) !== canonicalize(survey.sourceReference) ||
    canonicalize(survey.sourceSnapshot.spec?.surveyFrameRef) !==
      canonicalize(surveyFrameHead)
  ) fail(
    "ROUND_ONE_QUESTION_FRAMES_STALE_PARENT",
    "/workspace/spec/activeHeads",
    "closure sources must be the exact active Survey and Round frame heads",
  );
  if (
    roundHead?.apiVersion !== "survey.mission-kit/v1alpha1" ||
    roundHead?.kind !== "SurveyRound"
  ) fail(
    "ROUND_ONE_QUESTION_FRAMES_ROUND_INVALID",
    "/workspace/spec/activeHeads/round-1",
    "active Round head must be one exact SurveyRound reference",
  );
  if (
    !hasEdge(workspace, roundFrameHead, "derived-from", surveyFrameHead) ||
    !hasEdge(workspace, roundHead, "belongs-to", surveyHead) ||
    !hasEdge(workspace, roundHead, "frames", roundFrameHead) ||
    !hasEdge(workspace, roundHead, "parent-frame", surveyFrameHead)
  ) fail(
    "ROUND_ONE_QUESTION_FRAMES_ANCESTRY_INVALID",
    "/workspace/spec/dependencyEdges",
    "active Round ancestry is incomplete or inconsistent",
  );
  return { surveyFrame, roundFrame, survey, roundHead };
}

const requiredPerQuestion = [
  "subject", "purpose", "scope-included", "synopsis", "scope-relation",
  "containment-rationale", "intent-dimension", "outcome-axis-anchors",
];
const optionalPerQuestion = ["scope-excluded", "givens", "terms"];

export function buildRoundOneQuestionFrameProducts({
  normalizedValues,
  contextClosure,
  workspace,
}) {
  const required = ["coverage-rationale", "orthogonality-rationale"];
  const optional = [];
  for (let ordinal = 1; ordinal <= 3; ordinal += 1) {
    required.push(...requiredPerQuestion.map((name) => `q${ordinal}-${name}`));
    optional.push(...optionalPerQuestion.map((name) => `q${ordinal}-${name}`));
  }
  if (!exactKeys(normalizedValues, required, optional)) fail(
    "ROUND_ONE_QUESTION_FRAMES_VALUES_INVALID",
    "/normalizedValues",
    "QuestionFrame values contain missing or ambient fields",
  );
  const authority = parentAuthority(contextClosure, workspace);
  const evidenceRefs = [
    stableValue(authority.surveyFrame.sourceReference),
    stableValue(authority.roundFrame.sourceReference),
    stableValue(authority.survey.sourceReference),
  ];
  const outcomeAxes = new Set(
    authority.survey.sourceSnapshot.spec.outcomeAxes,
  );
  const frames = [];
  const slots = [];
  for (let ordinal = 1; ordinal <= 3; ordinal += 1) {
    const prefix = `q${ordinal}-`;
    const relation = normalizedValues[`${prefix}scope-relation`];
    if (!scopeRelations.has(relation)) fail(
      "ROUND_ONE_QUESTION_FRAME_SCOPE_RELATION_INVALID",
      `/${prefix}scope-relation`,
      "scope relation must be narrows, partitions, or qualifies",
    );
    const frame = deterministicName("round-one-question-frame", {
      apiVersion: "schemas.mission-kit/v1alpha1",
      kind: "ContextFrame",
      metadata: { name: "pending" },
      spec: {
        subject: requiredText(normalizedValues[`${prefix}subject`], `${prefix}subject`, 160),
        purpose: requiredText(normalizedValues[`${prefix}purpose`], `${prefix}purpose`, 1000),
        scope: {
          included: list(normalizedValues[`${prefix}scope-included`], `${prefix}scope-included`, 1, 16, 280),
          excluded: list(normalizedValues[`${prefix}scope-excluded`] ?? [], `${prefix}scope-excluded`, 0, 16, 280),
        },
        givens: givens(
          list(normalizedValues[`${prefix}givens`] ?? [], `${prefix}givens`, 0, 24, 513),
          `${prefix}givens`,
        ),
        synopsis: requiredText(normalizedValues[`${prefix}synopsis`], `${prefix}synopsis`, 320),
        terms: terms(
          list(normalizedValues[`${prefix}terms`] ?? [], `${prefix}terms`, 0, 16, 363),
          `${prefix}terms`,
        ),
      },
    });
    const frameIssues = validateContextFrameSemantics(frame);
    if (frameIssues.length > 0) fail(
      frameIssues[0].code,
      frameIssues[0].path,
      frameIssues[0].message,
    );
    frames.push(frame);
    slots.push({
      slot: ordinal,
      questionOrdinal: ordinal,
      contextFrameRef: resourceReferenceFrom(frame),
      parentFrameRef: stableValue(authority.roundFrame.sourceReference),
      scopeRelation: relation,
      containmentRationale: requiredText(normalizedValues[`${prefix}containment-rationale`], `${prefix}containment-rationale`, 2000),
      intentDimension: requiredText(normalizedValues[`${prefix}intent-dimension`], `${prefix}intent-dimension`, 512),
      outcomeAxisAnchors: anchors(
        list(normalizedValues[`${prefix}outcome-axis-anchors`], `${prefix}outcome-axis-anchors`, 1, 16, 1027),
        `${prefix}outcome-axis-anchors`,
        outcomeAxes,
      ),
      sourceEvidenceRefs: evidenceRefs,
    });
  }
  const frameSet = deterministicName("round-one-question-frame-set", {
    apiVersion: "survey.mission-kit/v1alpha1",
    kind: "QuestionFrameSet",
    metadata: { name: "pending" },
    spec: {
      roundRef: stableValue(authority.roundHead),
      roundOrdinal: 1,
      parentFrameRef: stableValue(authority.roundFrame.sourceReference),
      slots,
      coverageRationale: requiredText(normalizedValues["coverage-rationale"], "coverage-rationale", 2000),
      orthogonalityRationale: requiredText(normalizedValues["orthogonality-rationale"], "orthogonality-rationale", 2000),
    },
  });
  const structural = validateById(
    "urn:mission-kit:survey:schema:question-frame-set:v1alpha1",
    frameSet,
  );
  if (!structural.valid) fail(
    "ROUND_ONE_QUESTION_FRAME_SET_SCHEMA_INVALID",
    "/frameSet",
    structural.errors?.[0] ?? "QuestionFrameSet schema validation failed",
  );
  const canonicalFrameDependencies = frames
    .map((frame, index) => ({
      reference: resourceReferenceFrom(frame),
      slot: `round-1-question-frame-${index + 1}`,
    }))
    .sort((left, right) =>
      Buffer.compare(
        Buffer.from(canonicalize(left.reference), "utf8"),
        Buffer.from(canonicalize(right.reference), "utf8"),
      ))
    .map(({ slot }) => ({
      relation: "frames",
      selector: { mode: "created-slot", slot },
    }));
  return freezeValue([
    ...frames.map((resource, index) => ({
      slot: `round-1-question-frame-${index + 1}`,
      resource: stableValue(resource),
      dependencies: [{
        relation: "derived-from",
        selector: { mode: "context-layer", ordinal: 2 },
      }],
    })),
    {
      slot: "round-1-question-frame-set",
      resource: stableValue(frameSet),
      dependencies: [
        {
          relation: "belongs-to",
          selector: { mode: "active-head", slot: "round-1" },
        },
        ...canonicalFrameDependencies,
        {
          relation: "parent-frame",
          selector: { mode: "context-layer", ordinal: 2 },
        },
      ],
    },
  ]);
}
