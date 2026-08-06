import { validateById } from "../../../generated/validators.mjs";
import {
  canonicalize,
  sha256Value,
  stableValue,
} from "../kernel/canonical.mjs";
import {
  contextSelectorDigest,
  contextClosureDigest,
  formDefinitionDigest,
  lifecycleRuleDigest,
  resourceReferenceFrom,
  resourceIntegrityDigest,
  resourceSemanticDigest,
} from "../kernel/digests.mjs";
import {
  validateSurveyQuestionBindingQuestionSemantics,
} from "./resource-semantics.mjs";
import {
  validateQuestionSemantics,
} from "../../../dependencies/shared-schemas/v1/snapshot/question/v1alpha1/question.validator.mjs";

const zeroDigest = `sha256:${"0".repeat(64)}`;
const semanticText = /\S/u;
const optionRelationships = new Set([
  "composable",
  "exclusive",
  "mixed",
]);
const optionIds = Object.freeze(["a", "b", "c", "d"]);
const frameSetProjection = Object.freeze([
  "/spec/slots/0/intentDimension",
  "/spec/slots/0/outcomeAxisAnchors",
  "/spec/slots/1/intentDimension",
  "/spec/slots/1/outcomeAxisAnchors",
  "/spec/slots/2/intentDimension",
  "/spec/slots/2/outcomeAxisAnchors",
  "/spec/coverageRationale",
  "/spec/orthogonalityRationale",
]);
const policyProjection = Object.freeze([
  "/spec/geometry/questionsPerRound",
  "/spec/geometry/choiceOptions",
  "/spec/disclosure/mode",
  "/spec/disclosure/siblingQuestionFramesVisible",
  "/spec/disclosure/futureQuestionsVisible",
  "/spec/disclosure/interimInterpretationVisible",
  "/spec/validation/rationaleRequired",
  "/spec/validation/authority",
]);
const at05SelectorDefinitions = Object.freeze([
  Object.freeze({
    id: "round-one-questions-survey-frame",
    ordinal: 1,
    role: "survey-frame",
    apiVersion: "schemas.mission-kit/v1alpha1",
    kind: "ContextFrame",
    slot: "survey-frame",
    paths: Object.freeze(["/spec"]),
  }),
  Object.freeze({
    id: "round-one-questions-round-frame",
    ordinal: 2,
    role: "round-frame",
    apiVersion: "schemas.mission-kit/v1alpha1",
    kind: "ContextFrame",
    slot: "round-1-frame",
    paths: Object.freeze(["/spec"]),
  }),
  Object.freeze({
    id: "round-one-questions-frame-set",
    ordinal: 3,
    role: "question-frame-set",
    apiVersion: "survey.mission-kit/v1alpha1",
    kind: "QuestionFrameSet",
    slot: "round-1-question-frame-set",
    paths: frameSetProjection,
  }),
  ...[1, 2, 3].map((ordinal) => Object.freeze({
    id: `round-one-questions-frame-${ordinal}`,
    ordinal: ordinal + 3,
    role: `question-frame-${ordinal}`,
    apiVersion: "schemas.mission-kit/v1alpha1",
    kind: "ContextFrame",
    slot: `round-1-question-frame-${ordinal}`,
    paths: Object.freeze(["/spec"]),
  })),
  Object.freeze({
    id: "round-one-questions-policy",
    ordinal: 7,
    role: "policy",
    apiVersion: "survey.mission-kit/v1alpha1",
    kind: "SurveyPolicySnapshot",
    slot: "policy",
    paths: policyProjection,
  }),
]);

export class RoundOneQuestionsAuthorityError extends Error {
  constructor(code, field, message) {
    super(message);
    this.name = "RoundOneQuestionsAuthorityError";
    this.code = code;
    this.field = field;
  }
}

function fail(code, field, message) {
  throw new RoundOneQuestionsAuthorityError(code, field, message);
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
      "ROUND_ONE_QUESTION_FIELD_INVALID",
      `/${field}`,
      `${field} must be one bounded non-whitespace string`,
    );
  }
  return value;
}

function list(value, field, minimum, maximum, itemMinimum, itemMaximum) {
  if (!Array.isArray(value) || value.length < minimum || value.length > maximum) {
    fail(
      "ROUND_ONE_QUESTION_FIELD_INVALID",
      `/${field}`,
      `${field} must contain ${minimum} through ${maximum} ordered items`,
    );
  }
  const seen = new Set();
  return value.map((item, index) => {
    if (
      typeof item !== "string" ||
      !item.isWellFormed() ||
      [...item].length < itemMinimum ||
      [...item].length > itemMaximum ||
      !semanticText.test(item)
    ) {
      fail(
        "ROUND_ONE_QUESTION_FIELD_INVALID",
        `/${field}/${index}`,
        `${field} item is outside its canonical text bounds`,
      );
    }
    if (seen.has(item)) {
      fail(
        "ROUND_ONE_QUESTION_FIELD_DUPLICATE",
        `/${field}/${index}`,
        `${field} contains a duplicate item`,
      );
    }
    seen.add(item);
    return item;
  });
}

function option(value, field, index, id) {
  const delimiter = " | ";
  const at = value.indexOf(delimiter);
  if (at < 1 || at + delimiter.length >= value.length) {
    fail(
      "ROUND_ONE_QUESTION_OPTION_INVALID",
      `/${field}/${index}`,
      "option must contain non-empty label and meaning separated by the first exact ' | ' delimiter",
    );
  }
  const label = value.slice(0, at);
  const meaning = value.slice(at + delimiter.length);
  requiredText(label, `${field}/${index}/label`, 513);
  requiredText(meaning, `${field}/${index}/meaning`, 513);
  return { id, label, meaning };
}

function incompatibilityPairs(values, field, count, relationship) {
  const pairs = values.map((value, index) => {
    const match = /^([1-9][0-9]*) \+ ([1-9][0-9]*)$/u.exec(value);
    if (!match) {
      fail(
        "ROUND_ONE_QUESTION_INCOMPATIBILITY_INVALID",
        `/${field}/${index}`,
        "incompatibility must be exactly '<position> + <position>'",
      );
    }
    const left = Number(match[1]);
    const right = Number(match[2]);
    if (left >= right || right > count) {
      fail(
        "ROUND_ONE_QUESTION_INCOMPATIBILITY_INVALID",
        `/${field}/${index}`,
        "incompatibility positions must exist, be distinct, and place the lower position first",
      );
    }
    return [left, right];
  });
  const canonical = [...pairs].sort((left, right) =>
    left[0] - right[0] || left[1] - right[1]
  );
  if (canonical.some((pair, index) =>
    pair[0] !== pairs[index]?.[0] || pair[1] !== pairs[index]?.[1]
  )) {
    fail(
      "ROUND_ONE_QUESTION_INCOMPATIBILITY_ORDER_INVALID",
      `/${field}`,
      "incompatibility pairs must follow canonical option order",
    );
  }
  const pairKeys = new Set(pairs.map((pair) => pair.join("\0")));
  if (pairKeys.size !== pairs.length) {
    fail(
      "ROUND_ONE_QUESTION_INCOMPATIBILITY_DUPLICATE",
      `/${field}`,
      "incompatibility pairs must be unique",
    );
  }
  const completeCount = (count * (count - 1)) / 2;
  if (
    (relationship === "composable" || relationship === "exclusive") &&
    pairs.length !== 0
  ) {
    fail(
      "ROUND_ONE_QUESTION_RELATIONSHIP_DIVERGENT",
      `/${field}`,
      `${relationship} requires an empty authored incompatibility list`,
    );
  }
  if (
    relationship === "mixed" &&
    (pairs.length === 0 || pairs.length === completeCount)
  ) {
    fail(
      "ROUND_ONE_QUESTION_RELATIONSHIP_DIVERGENT",
      `/${field}`,
      "mixed requires a nonempty but incomplete incompatibility graph",
    );
  }
  return pairs;
}

function deterministicName(prefix, resource) {
  resource.metadata.name =
    `${prefix}-${resourceSemanticDigest(resource).slice("sha256:".length)}`;
  return resource;
}

function canonicalContextClosureReference(contextClosure) {
  const closureDigest = contextClosure?.spec?.closureDigest;
  if (
    typeof closureDigest !== "string" ||
    !/^sha256:[0-9a-f]{64}$/u.test(closureDigest)
  ) {
    fail(
      "ROUND_ONE_QUESTIONS_CONTEXT_INVALID",
      "/contextClosure/spec/closureDigest",
      "generation context must carry one canonical closure digest",
    );
  }
  const canonicalName =
    `context-${closureDigest.slice("sha256:".length)}`;
  if (
    contextClosure.metadata !== undefined &&
    contextClosure.metadata?.name !== canonicalName
  ) {
    fail(
      "ROUND_ONE_QUESTIONS_CONTEXT_INVALID",
      "/contextClosure/metadata/name",
      "supplied generation context name differs from its kernel-canonical closure identity",
    );
  }
  // Kernel callbacks intentionally receive projected resource semantics without
  // top-level metadata. Context resolution has already proven the request's
  // supplied reference; bridge that projection back to the same deterministic
  // ContextClosure identity instead of admitting a caller-authored name.
  return resourceReferenceFrom({
    ...contextClosure,
    metadata: {
      name: canonicalName,
    },
  });
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

export function createRoundOneQuestionsFormDefinition() {
  const fields = [];
  let ordinal = 1;
  for (let question = 1; question <= 3; question += 1) {
    const add = (suffix, heading, instruction, type, required, constraints) =>
      fields.push(formField(
        `q${question}-${suffix}`,
        ordinal++,
        `Question ${question} ${heading}`,
        instruction,
        type,
        required,
        constraints,
      ));
    add(
      "prompt",
      "prompt",
      "Author one standalone neutral question for the Director.",
      "paragraph",
      true,
      { minLength: 1, maxLength: 1000 },
    );
    add(
      "instruction",
      "instruction",
      "Optionally author only non-derivable guidance needed to answer this question.",
      "paragraph",
      false,
      { minLength: 1, maxLength: 1000 },
    );
    add(
      "options",
      "options",
      "Enter three or four '<label> | <meaning>' options in presentation order.",
      "string-list",
      true,
      {
        minItems: 3,
        maxItems: 4,
        itemMinLength: 5,
        itemMaxLength: 513,
        uniqueItems: true,
      },
    );
    add(
      "option-relationship",
      "option relationship",
      "Declare whether the options are composable, exclusive, or mixed.",
      "enum",
      true,
      { members: ["composable", "exclusive", "mixed"] },
    );
    add(
      "incompatibilities",
      "incompatibilities",
      "For mixed options only, enter canonical pairs such as '1 + 3'. Leave composable and exclusive empty.",
      "string-list",
      false,
      {
        minItems: 0,
        maxItems: 6,
        itemMinLength: 5,
        itemMaxLength: 5,
        uniqueItems: true,
      },
    );
    add(
      "design-rationale",
      "design rationale",
      "Explain this question's distinct discriminating value without implying a preferred answer.",
      "paragraph",
      true,
      { minLength: 1, maxLength: 2000 },
    );
  }
  const form = {
    apiVersion: "authoring.mission-kit/v1alpha1",
    kind: "AuthoringFormDefinition",
    metadata: { name: "round-one-questions-form" },
    spec: {
      formDigest: zeroDigest,
      grammarVersion: "mission-kit-authoring-text/v1",
      title: "Author the complete Round 1 Question instrument",
      introduction: "Author exactly three standalone Questions as one complete Round-1 unit. Resource identity, position, references, cardinality, option IDs, and constraints are derived.",
      fields,
    },
  };
  form.spec.formDigest = formDefinitionDigest(form);
  return Object.freeze(stableValue(form));
}

function pointerValue(resource, path) {
  let current = resource;
  for (const segment of path.split("/").slice(1)) {
    if (
      (Array.isArray(current) && /^(?:0|[1-9][0-9]*)$/u.test(segment)) ||
      (isRecord(current) && Object.hasOwn(current, segment))
    ) {
      current = current[segment];
    } else {
      return undefined;
    }
  }
  return current;
}

function expectedAt05Selectors() {
  return at05SelectorDefinitions.map((definition) => {
    const projection = {
      id: `${definition.id}-projection`,
      digest: sha256Value({
        domain:
          "mission-kit:survey-v2:context-projection-definition/v1",
        id: `${definition.id}-projection`,
        fields: definition.paths,
      }),
      fields: [...definition.paths],
    };
    const selector = {
      id: definition.id,
      selectorDigest: zeroDigest,
      ordinal: definition.ordinal,
      role: definition.role,
      resourceType: {
        apiVersion: definition.apiVersion,
        kind: definition.kind,
      },
      cardinality: { min: 1, max: 1 },
      requiredLifecycleState: "frozen",
      lifecycleRule: { mode: "workspace-resource-version" },
      selection: { mode: "active-head", slot: definition.slot },
      projection,
    };
    selector.selectorDigest = contextSelectorDigest(selector);
    return selector;
  });
}

function expectedAt05Task(selectors) {
  return {
    id: "author-round-1-questions",
    stateId: "round_1_questions_required",
    target: {
      slot: "round-1-instrument",
      resourceType: {
        apiVersion: "survey.mission-kit/v1alpha1",
        kind: "RoundInstrument",
      },
      cardinality: { min: 1, max: 1 },
    },
    contextSelectors: selectors,
    requestInputBindings: at05SelectorDefinitions.map((definition) => ({
      inputKey: definition.role,
      selectorId: definition.id,
    })),
    submissionSchemaBindingId: "authoring-submission-schema-binding",
    formBindingId: "round-one-questions-form-binding",
    handlerBindingId: "at05-handler-binding",
    projectionBindingId: "round-one-questions-projection-binding",
    validatorSetId: "authoring-submission-validator-set",
  };
}

function exactLayer(layer, {
  ordinal,
  role,
  apiVersion,
  kind,
  paths,
  selector,
}) {
  let valid = false;
  try {
    const selected = layer?.selectedValue;
    const lifecycleProof = selector === undefined
      ? undefined
      : {
        ruleDigest: lifecycleRuleDigest(selector),
        observedState: selector.requiredLifecycleState,
      };
    valid = (
      layer?.ordinal === ordinal &&
      layer?.role === role &&
      layer?.sourceReference?.apiVersion === apiVersion &&
      layer?.sourceReference?.kind === kind &&
      layer?.sourceSnapshot?.apiVersion === apiVersion &&
      layer?.sourceSnapshot?.kind === kind &&
      canonicalize(resourceReferenceFrom(layer.sourceSnapshot)) ===
        canonicalize(layer.sourceReference) &&
      (
        selector === undefined ||
        (
          exactKeys(layer, [
            "ordinal",
            "role",
            "selectorId",
            "selectorDigest",
            "requiredLifecycleState",
            "lifecycleProof",
            "sourceReference",
            "sourceIntegrityDigest",
            "sourceSnapshot",
            "selectedValue",
            "projectionDefinitionDigest",
          ]) &&
          selector.ordinal === ordinal &&
          selector.role === role &&
          selector.resourceType?.apiVersion === apiVersion &&
          selector.resourceType?.kind === kind &&
          canonicalize(selector.projection?.fields) ===
            canonicalize(paths) &&
          layer.selectorId === selector.id &&
          layer.selectorDigest === selector.selectorDigest &&
          selector.selectorDigest === contextSelectorDigest(selector) &&
          layer.requiredLifecycleState ===
            selector.requiredLifecycleState &&
          canonicalize(layer.lifecycleProof) ===
            canonicalize(lifecycleProof) &&
          layer.sourceIntegrityDigest ===
            resourceIntegrityDigest(layer.sourceSnapshot) &&
          layer.projectionDefinitionDigest ===
            selector.projection.digest
        )
      ) &&
      Array.isArray(selected) &&
      selected.length === paths.length &&
      paths.every((path, index) =>
        exactKeys(selected[index], ["path", "value"]) &&
        selected[index].path === path &&
        pointerValue(layer.sourceSnapshot, path) !== undefined &&
        canonicalize(selected[index].value) ===
          canonicalize(pointerValue(layer.sourceSnapshot, path))
      )
    );
  } catch {
    valid = false;
  }
  if (!valid) {
    fail(
      "ROUND_ONE_QUESTIONS_CONTEXT_INVALID",
      `/contextClosure/spec/layers/${ordinal - 1}`,
      `${role} differs from its exact frozen least-context authority`,
    );
  }
  return layer;
}

function active(workspace, slot, apiVersion, kind) {
  const matches =
    workspace?.spec?.activeHeads?.filter((head) => head.slot === slot) ?? [];
  if (
    matches.length !== 1 ||
    matches[0].reference?.apiVersion !== apiVersion ||
    matches[0].reference?.kind !== kind
  ) {
    fail(
      "ROUND_ONE_QUESTIONS_ACTIVE_HEAD_INVALID",
      `/workspace/spec/activeHeads/${slot}`,
      `${slot} must resolve to exactly one typed active head`,
    );
  }
  return matches[0].reference;
}

function hasEdge(workspace, from, relation, to) {
  return workspace.spec.dependencyEdges.some((edge) =>
    edge.relation === relation &&
    canonicalize(edge.from) === canonicalize(from) &&
    canonicalize(edge.to) === canonicalize(to)
  );
}

function assertReferenceEqual(actual, expected, field, message) {
  if (canonicalize(actual) !== canonicalize(expected)) {
    fail("ROUND_ONE_QUESTIONS_ANCESTRY_INVALID", field, message);
  }
}

function parentAuthority(contextClosure, workspace, selectors) {
  const layers = contextClosure?.spec?.layers;
  if (!Array.isArray(layers) || layers.length !== 7) {
    fail(
      "ROUND_ONE_QUESTIONS_CONTEXT_INVALID",
      "/contextClosure/spec/layers",
      "Round-1 Question construction requires exactly seven ordered semantic layers",
    );
  }
  const surveyFrame = exactLayer(layers[0], {
    ordinal: 1,
    role: "survey-frame",
    apiVersion: "schemas.mission-kit/v1alpha1",
    kind: "ContextFrame",
    paths: ["/spec"],
    selector: selectors?.[0],
  });
  const roundFrame = exactLayer(layers[1], {
    ordinal: 2,
    role: "round-frame",
    apiVersion: "schemas.mission-kit/v1alpha1",
    kind: "ContextFrame",
    paths: ["/spec"],
    selector: selectors?.[1],
  });
  const frameSet = exactLayer(layers[2], {
    ordinal: 3,
    role: "question-frame-set",
    apiVersion: "survey.mission-kit/v1alpha1",
    kind: "QuestionFrameSet",
    paths: frameSetProjection,
    selector: selectors?.[2],
  });
  const questionFrames = [1, 2, 3].map((number) =>
    exactLayer(layers[number + 2], {
      ordinal: number + 3,
      role: `question-frame-${number}`,
      apiVersion: "schemas.mission-kit/v1alpha1",
      kind: "ContextFrame",
      paths: ["/spec"],
      selector: selectors?.[number + 2],
    })
  );
  const policy = exactLayer(layers[6], {
    ordinal: 7,
    role: "policy",
    apiVersion: "survey.mission-kit/v1alpha1",
    kind: "SurveyPolicySnapshot",
    paths: policyProjection,
    selector: selectors?.[6],
  });
  const policyValues = policyProjection.map((path) =>
    pointerValue(policy.sourceSnapshot, path)
  );
  if (
    policyValues[0] !== 3 ||
    canonicalize(policyValues[1]) !==
      canonicalize({ minimum: 3, maximum: 4 }) ||
    policyValues[2] !== "single-current-question" ||
    policyValues.slice(3, 6).some((value) => value !== false) ||
    policyValues[6] !== true ||
    policyValues[7] !== "mechanical-only"
  ) {
    fail(
      "ROUND_ONE_QUESTIONS_POLICY_INVALID",
      "/contextClosure/spec/layers/6/selectedValue",
      "Round-1 Question policy must preserve exact option geometry, single-current disclosure, rationale, and mechanical authority",
    );
  }

  const frameSetStructural = validateById(
    "urn:mission-kit:survey:schema:question-frame-set:v1alpha1",
    frameSet.sourceSnapshot,
  );
  if (!frameSetStructural.valid) {
    fail(
      "ROUND_ONE_QUESTIONS_FRAME_SET_INVALID",
      "/contextClosure/spec/layers/2/sourceSnapshot",
      frameSetStructural.errors?.[0] ?? "QuestionFrameSet schema validation failed",
    );
  }

  const surveyFrameHead = active(
    workspace,
    "survey-frame",
    "schemas.mission-kit/v1alpha1",
    "ContextFrame",
  );
  const surveyHead = active(
    workspace,
    "survey",
    "survey.mission-kit/v1alpha1",
    "Survey",
  );
  const roundFrameHead = active(
    workspace,
    "round-1-frame",
    "schemas.mission-kit/v1alpha1",
    "ContextFrame",
  );
  const roundHead = active(
    workspace,
    "round-1",
    "survey.mission-kit/v1alpha1",
    "SurveyRound",
  );
  const questionFrameHeads = [1, 2, 3].map((number) =>
    active(
      workspace,
      `round-1-question-frame-${number}`,
      "schemas.mission-kit/v1alpha1",
      "ContextFrame",
    )
  );
  const frameSetHead = active(
    workspace,
    "round-1-question-frame-set",
    "survey.mission-kit/v1alpha1",
    "QuestionFrameSet",
  );
  const policyHead = active(
    workspace,
    "policy",
    "survey.mission-kit/v1alpha1",
    "SurveyPolicySnapshot",
  );

  assertReferenceEqual(
    surveyFrameHead,
    surveyFrame.sourceReference,
    "/workspace/spec/activeHeads/survey-frame",
    "Survey frame closure source must be the exact active head",
  );
  assertReferenceEqual(
    roundFrameHead,
    roundFrame.sourceReference,
    "/workspace/spec/activeHeads/round-1-frame",
    "Round frame closure source must be the exact active head",
  );
  assertReferenceEqual(
    frameSetHead,
    frameSet.sourceReference,
    "/workspace/spec/activeHeads/round-1-question-frame-set",
    "QuestionFrameSet closure source must be the exact active head",
  );
  assertReferenceEqual(
    policyHead,
    policy.sourceReference,
    "/workspace/spec/activeHeads/policy",
    "policy closure source must be the exact active head",
  );
  questionFrameHeads.forEach((head, index) =>
    assertReferenceEqual(
      head,
      questionFrames[index].sourceReference,
      `/workspace/spec/activeHeads/round-1-question-frame-${index + 1}`,
      "Question frame closure source must be the exact active head",
    )
  );

  const frameSetSpec = frameSet.sourceSnapshot.spec;
  assertReferenceEqual(
    frameSetSpec.roundRef,
    roundHead,
    "/contextClosure/spec/layers/2/sourceSnapshot/spec/roundRef",
    "QuestionFrameSet must bind the exact active Round",
  );
  assertReferenceEqual(
    frameSetSpec.parentFrameRef,
    roundFrameHead,
    "/contextClosure/spec/layers/2/sourceSnapshot/spec/parentFrameRef",
    "QuestionFrameSet must bind the exact active Round frame",
  );
  if (
    frameSetSpec.roundOrdinal !== 1 ||
    !Array.isArray(frameSetSpec.slots) ||
    frameSetSpec.slots.length !== 3
  ) {
    fail(
      "ROUND_ONE_QUESTIONS_FRAME_SET_INVALID",
      "/contextClosure/spec/layers/2/sourceSnapshot/spec",
      "QuestionFrameSet must contain exactly three ordered Round-1 slots",
    );
  }
  frameSetSpec.slots.forEach((slot, index) => {
    if (
      slot?.slot !== index + 1 ||
      slot?.questionOrdinal !== index + 1
    ) {
      fail(
        "ROUND_ONE_QUESTIONS_FRAME_SET_INVALID",
        `/contextClosure/spec/layers/2/sourceSnapshot/spec/slots/${index}`,
        "QuestionFrameSet slot and Question ordinal must follow exact Round-1 order",
      );
    }
    assertReferenceEqual(
      slot.contextFrameRef,
      questionFrameHeads[index],
      `/contextClosure/spec/layers/2/sourceSnapshot/spec/slots/${index}/contextFrameRef`,
      "QuestionFrameSet slot must bind its exact active Question frame",
    );
    assertReferenceEqual(
      slot.parentFrameRef,
      roundFrameHead,
      `/contextClosure/spec/layers/2/sourceSnapshot/spec/slots/${index}/parentFrameRef`,
      "QuestionFrameSet slot must bind the exact active Round frame",
    );
  });

  const requiredEdges = [
    [roundFrameHead, "derived-from", surveyFrameHead],
    [roundHead, "belongs-to", surveyHead],
    [roundHead, "frames", roundFrameHead],
    [roundHead, "parent-frame", surveyFrameHead],
    ...questionFrameHeads.map((head) =>
      [head, "derived-from", roundFrameHead]
    ),
    [frameSetHead, "belongs-to", roundHead],
    ...questionFrameHeads.map((head) =>
      [frameSetHead, "frames", head]
    ),
    [frameSetHead, "parent-frame", roundFrameHead],
  ];
  if (requiredEdges.some(([from, relation, to]) =>
    !hasEdge(workspace, from, relation, to)
  )) {
    fail(
      "ROUND_ONE_QUESTIONS_ANCESTRY_INVALID",
      "/workspace/spec/dependencyEdges",
      "active Round-1 Question ancestry is incomplete or inconsistent",
    );
  }
  return {
    surveyFrame,
    roundFrame,
    frameSet,
    questionFrames,
    policy,
    roundHead,
  };
}

const instrumentUnitAuthority = Object.freeze([
  Object.freeze({
    slot: "round-1-question-1",
    apiVersion: "schemas.mission-kit/v1alpha1",
    kind: "Question",
    namePrefix: "round-one-question",
  }),
  Object.freeze({
    slot: "round-1-question-2",
    apiVersion: "schemas.mission-kit/v1alpha1",
    kind: "Question",
    namePrefix: "round-one-question",
  }),
  Object.freeze({
    slot: "round-1-question-3",
    apiVersion: "schemas.mission-kit/v1alpha1",
    kind: "Question",
    namePrefix: "round-one-question",
  }),
  Object.freeze({
    slot: "round-1-question-binding-1",
    apiVersion: "survey.mission-kit/v1alpha1",
    kind: "SurveyQuestionBinding",
    namePrefix: "round-one-question-binding",
  }),
  Object.freeze({
    slot: "round-1-question-binding-2",
    apiVersion: "survey.mission-kit/v1alpha1",
    kind: "SurveyQuestionBinding",
    namePrefix: "round-one-question-binding",
  }),
  Object.freeze({
    slot: "round-1-question-binding-3",
    apiVersion: "survey.mission-kit/v1alpha1",
    kind: "SurveyQuestionBinding",
    namePrefix: "round-one-question-binding",
  }),
  Object.freeze({
    slot: "round-1-instrument",
    apiVersion: "survey.mission-kit/v1alpha1",
    kind: "RoundInstrument",
    namePrefix: "round-one-instrument",
  }),
]);

function unitFailure(code, field, message) {
  fail(code, field, message);
}

function sameValue(actual, expected) {
  try {
    return canonicalize(actual) === canonicalize(expected);
  } catch {
    return false;
  }
}

function exactAt05Footprint(profile) {
  const bindings = profile?.spec?.transitionBindings;
  const matches = Array.isArray(bindings)
    ? bindings.filter((binding) => binding?.transitionId === "AT05")
    : [];
  if (matches.length !== 1) {
    unitFailure(
      "ROUND_ONE_INSTRUMENT_UNIT_HANDOFF_INVALID",
      "/profile/spec/transitionBindings",
      "Round-1 instrument-unit validation requires exactly one AT05 authority binding",
    );
  }
  const binding = matches[0];
  const footprint = binding.mutationFootprint;
  const slots = instrumentUnitAuthority.map(({ slot }) => slot);
  const expectedCreated = instrumentUnitAuthority.map(
    ({ slot, apiVersion, kind }) => ({
      slot,
      resourceType: { apiVersion, kind },
      cardinality: { min: 1, max: 1 },
    }),
  );
  const exactFields = [
    ["created", expectedCreated],
    ["activeHeadSlots", slots],
    ["supersededSlots", []],
    [
      "dependencyRelations",
      ["belongs-to", "binds", "derived-from", "governed-by"],
    ],
    ["handoffSlots", ["round-1-instrument"]],
  ];
  if (
    binding.triggerClass !== "task-submission" ||
    binding.taskId !== "author-round-1-questions" ||
    !isRecord(footprint) ||
    exactFields.some(([field, expected]) =>
      !sameValue(footprint?.[field], expected)
    )
  ) {
    unitFailure(
      "ROUND_ONE_INSTRUMENT_UNIT_HANDOFF_INVALID",
      "/profile/spec/transitionBindings/AT05/mutationFootprint",
      "AT05 must own exactly seven singleton active products, the closed four-relation graph, and only the RoundInstrument handoff",
    );
  }
  return footprint;
}

function exactInstrumentUnitProducts(products) {
  if (
    !Array.isArray(products) ||
    products.length !== instrumentUnitAuthority.length
  ) {
    unitFailure(
      "ROUND_ONE_INSTRUMENT_UNIT_PRODUCTS_INVALID",
      "/products",
      "Round-1 instrument authority must return exactly seven ordered products",
    );
  }
  const references = [];
  products.forEach((product, index) => {
    const expected = instrumentUnitAuthority[index];
    if (
      !exactKeys(product, ["slot", "resource", "dependencies"]) ||
      product.slot !== expected.slot ||
      product.resource?.apiVersion !== expected.apiVersion ||
      product.resource?.kind !== expected.kind ||
      !Array.isArray(product.dependencies)
    ) {
      unitFailure(
        "ROUND_ONE_INSTRUMENT_UNIT_PRODUCTS_INVALID",
        `/products/${index}`,
        "Round-1 instrument products differ from their exact ordered slots, types, or descriptor shape",
      );
    }
    try {
      references.push(resourceReferenceFrom(product.resource));
    } catch {
      unitFailure(
        "ROUND_ONE_INSTRUMENT_UNIT_PRODUCTS_INVALID",
        `/products/${index}/resource`,
        "Round-1 instrument product does not expose one canonical resource identity",
      );
    }
  });
  if (
    new Set(references.map((reference) => canonicalize(reference))).size !==
      references.length
  ) {
    unitFailure(
      "ROUND_ONE_INSTRUMENT_UNIT_PRODUCTS_INVALID",
      "/products",
      "Round-1 instrument products must have seven distinct resource identities",
    );
  }
  return references;
}

function assertUnitReference(actual, expected, field, message) {
  if (!sameValue(actual, expected)) {
    unitFailure(
      "ROUND_ONE_INSTRUMENT_UNIT_REFERENCE_INVALID",
      field,
      message,
    );
  }
}

function exactInstrumentUnitReferences({
  products,
  references,
  authority,
  closureReference,
}) {
  const questionReferences = references.slice(0, 3);
  const bindingReferences = references.slice(3, 6);
  const frameSetReference = authority.frameSet.sourceReference;
  const questionFrameReferences = authority.questionFrames.map(
    ({ sourceReference }) => sourceReference,
  );

  products.slice(3, 6).forEach(({ resource }, index) => {
    const ordinal = index + 1;
    const binding = resource.spec;
    for (const [field, expected, message] of [
      [
        "frameSetRef",
        frameSetReference,
        "SurveyQuestionBinding must use the exact active QuestionFrameSet",
      ],
      [
        "roundRef",
        authority.roundHead,
        "SurveyQuestionBinding must use the exact active Round",
      ],
      [
        "questionFrameRef",
        questionFrameReferences[index],
        "SurveyQuestionBinding must use its exact active Question ContextFrame",
      ],
      [
        "questionRef",
        questionReferences[index],
        "SurveyQuestionBinding must use its exact sibling Question product",
      ],
    ]) {
      assertUnitReference(
        binding?.[field],
        expected,
        `/products/${index + 3}/resource/spec/${field}`,
        message,
      );
    }
    if (
      binding?.slot !== ordinal ||
      binding?.questionOrdinal !== ordinal
    ) {
      unitFailure(
        "ROUND_ONE_INSTRUMENT_UNIT_REFERENCE_INVALID",
        `/products/${index + 3}/resource/spec`,
        "SurveyQuestionBinding position differs from its exact Round-1 product slot",
      );
    }
  });

  const instrument = products[6].resource.spec;
  for (const [field, expected, message] of [
    [
      "roundRef",
      authority.roundHead,
      "RoundInstrument must use the exact active Round",
    ],
    [
      "frameSetRef",
      frameSetReference,
      "RoundInstrument must use the exact active QuestionFrameSet",
    ],
    [
      "policySnapshotRef",
      authority.policy.sourceReference,
      "RoundInstrument must use the exact active AT05 policy",
    ],
    [
      "generationContextRef",
      closureReference,
      "RoundInstrument must use the exact active AT05 ContextClosure",
    ],
  ]) {
    assertUnitReference(
      instrument?.[field],
      expected,
      `/products/6/resource/spec/${field}`,
      message,
    );
  }
  const expectedUnits = [0, 1, 2].map((index) => ({
    slot: index + 1,
    questionOrdinal: index + 1,
    questionFrameRef: stableValue(questionFrameReferences[index]),
    bindingRef: stableValue(bindingReferences[index]),
    questionRef: stableValue(questionReferences[index]),
  }));
  if (
    instrument?.roundOrdinal !== 1 ||
    !sameValue(instrument?.units, expectedUnits)
  ) {
    unitFailure(
      "ROUND_ONE_INSTRUMENT_UNIT_REFERENCE_INVALID",
      "/products/6/resource/spec/units",
      "RoundInstrument must contain exactly three ordered units bound to the exact frame, binding, and Question products",
    );
  }
  return {
    questionReferences,
    bindingReferences,
    frameSetReference,
  };
}

function expectedInstrumentUnitDependencies({
  questionReferences,
  bindingReferences,
  frameSetReference,
}) {
  const dependencies = [
    ...[0, 1, 2].map((index) => [{
      relation: "derived-from",
      selector: { mode: "context-layer", ordinal: index + 4 },
    }]),
    ...[0, 1, 2].map((index) => [
      {
        relation: "belongs-to",
        selector: { mode: "context-layer", ordinal: 3 },
      },
      {
        relation: "binds",
        selector: {
          mode: "created-slot",
          slot: `round-1-question-${index + 1}`,
        },
      },
      {
        relation: "derived-from",
        selector: { mode: "context-layer", ordinal: index + 4 },
      },
    ]),
  ];
  const bindTargets = [
    {
      reference: frameSetReference,
      selector: { mode: "context-layer", ordinal: 3 },
    },
    ...questionReferences.map((reference, index) => ({
      reference,
      selector: {
        mode: "created-slot",
        slot: `round-1-question-${index + 1}`,
      },
    })),
    ...bindingReferences.map((reference, index) => ({
      reference,
      selector: {
        mode: "created-slot",
        slot: `round-1-question-binding-${index + 1}`,
      },
    })),
  ].sort((left, right) =>
    Buffer.compare(
      Buffer.from(canonicalize(left.reference), "utf8"),
      Buffer.from(canonicalize(right.reference), "utf8"),
    )
  );
  dependencies.push([
    {
      relation: "belongs-to",
      selector: { mode: "active-head", slot: "round-1" },
    },
    ...bindTargets.map(({ selector }) => ({
      relation: "binds",
      selector,
    })),
    {
      relation: "derived-from",
      selector: { mode: "context-closure" },
    },
    {
      relation: "governed-by",
      selector: { mode: "context-layer", ordinal: 7 },
    },
  ]);
  return dependencies;
}

function assertExactInstrumentUnitDependencies(products, expected) {
  const edgeCount = products.reduce(
    (count, product) => count + product.dependencies.length,
    0,
  );
  if (edgeCount !== 22) {
    unitFailure(
      "ROUND_ONE_INSTRUMENT_UNIT_DEPENDENCIES_INVALID",
      "/products",
      "Round-1 instrument products must declare exactly twenty-two directed dependency edges",
    );
  }
  products.forEach((product, index) => {
    if (
      canonicalize(product.dependencies) !== canonicalize(expected[index])
    ) {
      unitFailure(
        "ROUND_ONE_INSTRUMENT_UNIT_DEPENDENCIES_INVALID",
        `/products/${index}/dependencies`,
        "Round-1 instrument dependency declarations are missing, extra, misdirected, or out of canonical order",
      );
    }
  });
}

function assertHandlerOwnedInstrumentUnitIdentity(products) {
  products.forEach(({ resource }, index) => {
    const digest = resourceSemanticDigest(resource);
    const expectedName =
      `${instrumentUnitAuthority[index].namePrefix}-${digest.slice("sha256:".length)}`;
    if (resource.metadata?.name !== expectedName) {
      unitFailure(
        "ROUND_ONE_INSTRUMENT_UNIT_IDENTITY_INVALID",
        `/products/${index}/resource/metadata/name`,
        "Round-1 instrument product name differs from its handler-owned semantic identity",
      );
    }
  });
}

/**
 * Independently close the complete AT05 product group before generic mutation
 * planning. Per-resource validators intentionally receive neither sibling
 * products nor the active ContextClosure, so this Survey-owned boundary proves
 * the exact seven-product, twenty-two-edge, and singleton-handoff unit.
 */
export function assertRoundOneInstrumentUnitSemantics({
  profile,
  workspace,
  contextClosure,
  products,
} = {}) {
  if (
    contextClosure?.apiVersion !== "authoring.mission-kit/v1alpha1" ||
    contextClosure?.kind !== "ContextClosure"
  ) {
    unitFailure(
      "ROUND_ONE_INSTRUMENT_UNIT_CONTEXT_INVALID",
      "/contextClosure",
      "Round-1 instrument-unit validation requires the active AT05 ContextClosure",
    );
  }
  let derivedClosureDigest;
  try {
    derivedClosureDigest = contextClosureDigest(contextClosure);
  } catch {
    derivedClosureDigest = undefined;
  }
  if (
    derivedClosureDigest === undefined ||
    contextClosure.spec?.closureDigest !== derivedClosureDigest
  ) {
    unitFailure(
      "ROUND_ONE_INSTRUMENT_UNIT_CONTEXT_INVALID",
      "/contextClosure/spec/closureDigest",
      "AT05 ContextClosure identity differs from its complete semantic content",
    );
  }
  const authority = parentAuthority(contextClosure, workspace);
  exactAt05Footprint(profile);
  const references = exactInstrumentUnitProducts(products);
  const closureReference = contextClosureReference(contextClosure);
  const group = exactInstrumentUnitReferences({
    products,
    references,
    authority,
    closureReference,
  });
  assertExactInstrumentUnitDependencies(
    products,
    expectedInstrumentUnitDependencies(group),
  );
  assertHandlerOwnedInstrumentUnitIdentity(products);
  return true;
}

function validateQuestion(question) {
  const structural = validateById(
    "urn:mission-kit:schemas:question:v1alpha1",
    question,
  );
  if (!structural.valid) {
    fail(
      "ROUND_ONE_QUESTION_SCHEMA_INVALID",
      "/question",
      structural.errors?.[0] ?? "Question schema validation failed",
    );
  }
  const semantic = validateQuestionSemantics(question);
  if (semantic.length > 0) {
    fail(semantic[0].code, semantic[0].path, semantic[0].message);
  }
}

function canonicalDependencies(entries) {
  return [...entries]
    .sort((left, right) =>
      Buffer.compare(
        Buffer.from(canonicalize(left.reference), "utf8"),
        Buffer.from(canonicalize(right.reference), "utf8"),
      )
    )
    .map(({ selector }) => ({ relation: "binds", selector }));
}

const requiredPerQuestion = [
  "prompt",
  "options",
  "option-relationship",
  "design-rationale",
];
const optionalPerQuestion = ["instruction", "incompatibilities"];

export function buildRoundOneQuestionProducts({
  normalizedValues,
  contextClosure,
  workspace,
}) {
  const required = [];
  const optional = [];
  for (let ordinal = 1; ordinal <= 3; ordinal += 1) {
    required.push(...requiredPerQuestion.map((name) => `q${ordinal}-${name}`));
    optional.push(...optionalPerQuestion.map((name) => `q${ordinal}-${name}`));
  }
  if (!exactKeys(normalizedValues, required, optional)) {
    fail(
      "ROUND_ONE_QUESTIONS_VALUES_INVALID",
      "/normalizedValues",
      "Round-1 Question values contain missing or ambient fields",
    );
  }
  const authority = parentAuthority(contextClosure, workspace);
  const questions = [];
  const bindings = [];
  for (let ordinal = 1; ordinal <= 3; ordinal += 1) {
    const prefix = `q${ordinal}-`;
    const relationship = normalizedValues[`${prefix}option-relationship`];
    if (!optionRelationships.has(relationship)) {
      fail(
        "ROUND_ONE_QUESTION_RELATIONSHIP_INVALID",
        `/${prefix}option-relationship`,
        "option relationship must be composable, exclusive, or mixed",
      );
    }
    const authoredOptions = list(
      normalizedValues[`${prefix}options`],
      `${prefix}options`,
      3,
      4,
      5,
      513,
    );
    const options = authoredOptions.map((value, index) =>
      option(value, `${prefix}options`, index, optionIds[index])
    );
    const authoredIncompatibilities = list(
      normalizedValues[`${prefix}incompatibilities`] ?? [],
      `${prefix}incompatibilities`,
      0,
      6,
      5,
      5,
    );
    const positionPairs = incompatibilityPairs(
      authoredIncompatibilities,
      `${prefix}incompatibilities`,
      options.length,
      relationship,
    );
    const incompatibilities = positionPairs.map(([left, right]) => [
      optionIds[left - 1],
      optionIds[right - 1],
    ]);
    const constraints =
      relationship === "exclusive"
        ? [{
            type: "MutuallyExclusive",
            optionIds: options.map(({ id }) => id),
          }]
        : relationship === "mixed"
          ? incompatibilities.map((ids) => ({
              type: "MutuallyExclusive",
              optionIds: ids,
            }))
          : [];
    const prompt = {
      text: requiredText(
        normalizedValues[`${prefix}prompt`],
        `${prefix}prompt`,
        1000,
      ),
    };
    if (Object.hasOwn(normalizedValues, `${prefix}instruction`)) {
      prompt.instruction = requiredText(
        normalizedValues[`${prefix}instruction`],
        `${prefix}instruction`,
        1000,
      );
    }
    const question = deterministicName("round-one-question", {
      apiVersion: "schemas.mission-kit/v1alpha1",
      kind: "Question",
      metadata: { name: "pending" },
      spec: {
        prompt,
        response: {
          type: "Choice",
          cardinality: {
            minimum: 1,
            maximum: options.length,
          },
          options,
          constraints,
        },
      },
    });
    validateQuestion(question);
    questions.push(question);
    bindings.push(deterministicName("round-one-question-binding", {
      apiVersion: "survey.mission-kit/v1alpha1",
      kind: "SurveyQuestionBinding",
      metadata: { name: "pending" },
      spec: {
        frameSetRef: stableValue(authority.frameSet.sourceReference),
        roundRef: stableValue(authority.roundHead),
        slot: ordinal,
        questionOrdinal: ordinal,
        questionFrameRef:
          stableValue(authority.questionFrames[ordinal - 1].sourceReference),
        questionRef: resourceReferenceFrom(question),
        optionRelationship: relationship,
        incompatibilities,
        designRationale: requiredText(
          normalizedValues[`${prefix}design-rationale`],
          `${prefix}design-rationale`,
          2000,
        ),
      },
    }));
  }

  const instrument = deterministicName("round-one-instrument", {
    apiVersion: "survey.mission-kit/v1alpha1",
    kind: "RoundInstrument",
    metadata: { name: "pending" },
    spec: {
      roundRef: stableValue(authority.roundHead),
      roundOrdinal: 1,
      frameSetRef: stableValue(authority.frameSet.sourceReference),
      policySnapshotRef: stableValue(authority.policy.sourceReference),
      generationContextRef: contextClosureReference(contextClosure),
      units: questions.map((question, index) => ({
        slot: index + 1,
        questionOrdinal: index + 1,
        questionFrameRef:
          stableValue(authority.questionFrames[index].sourceReference),
        bindingRef: resourceReferenceFrom(bindings[index]),
        questionRef: resourceReferenceFrom(question),
      })),
      responsePolicy: {
        capture: "option-id-list",
        rawEvidence: "preserved",
        duplicateSubmission: "idempotent",
        invalidSyntax: "reject-without-advance",
        unknownOption: "reject-without-advance",
        cardinalityViolation: "reject-without-advance",
        declaredConstraintViolation: "preserve-as-contradiction",
      },
    },
  });

  const products = [
    ...questions.map((resource, index) => ({
      slot: `round-1-question-${index + 1}`,
      resource: stableValue(resource),
      dependencies: [{
        relation: "derived-from",
        selector: { mode: "context-layer", ordinal: index + 4 },
      }],
    })),
    ...bindings.map((resource, index) => ({
      slot: `round-1-question-binding-${index + 1}`,
      resource: stableValue(resource),
      dependencies: [
        {
          relation: "belongs-to",
          selector: { mode: "context-layer", ordinal: 3 },
        },
        {
          relation: "binds",
          selector: {
            mode: "created-slot",
            slot: `round-1-question-${index + 1}`,
          },
        },
        {
          relation: "derived-from",
          selector: { mode: "context-layer", ordinal: index + 4 },
        },
      ],
    })),
  ];
  const instrumentBindings = [
    {
      reference: authority.frameSet.sourceReference,
      selector: { mode: "context-layer", ordinal: 3 },
    },
    ...questions.map((question, index) => ({
      reference: resourceReferenceFrom(question),
      selector: {
        mode: "created-slot",
        slot: `round-1-question-${index + 1}`,
      },
    })),
    ...bindings.map((binding, index) => ({
      reference: resourceReferenceFrom(binding),
      selector: {
        mode: "created-slot",
        slot: `round-1-question-binding-${index + 1}`,
      },
    })),
  ];
  products.push({
    slot: "round-1-instrument",
    resource: stableValue(instrument),
    dependencies: [
      {
        relation: "belongs-to",
        selector: { mode: "active-head", slot: "round-1" },
      },
      ...canonicalDependencies(instrumentBindings),
      {
        relation: "derived-from",
        selector: { mode: "context-closure" },
      },
      {
        relation: "governed-by",
        selector: { mode: "context-layer", ordinal: 7 },
      },
    ],
  });
  return freezeValue(products);
}
