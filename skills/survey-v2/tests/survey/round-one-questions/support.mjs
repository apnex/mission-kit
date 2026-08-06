import {
  contextClosureDigest,
  resourceReferenceFrom,
} from "../../../source/authoring/kernel/digests.mjs";
import {
  buildRoundOneFrameProducts,
} from "../../../source/authoring/survey/round-one-frame-authority.mjs";
import {
  buildRoundOneQuestionFrameProducts,
} from "../../../source/authoring/survey/round-one-question-frames-authority.mjs";
import {
  buildRoundOneQuestionProducts,
  createRoundOneQuestionsFormDefinition,
} from "../../../source/authoring/survey/round-one-questions-authority.mjs";
import {
  roundOneQuestionFrameValues,
} from "../round-one-question-frames/support.mjs";
import {
  roundOneFrameValues,
  roundOneParentResources,
} from "../round-one/support.mjs";

const frameSetPaths = Object.freeze([
  "/spec/slots/0/intentDimension",
  "/spec/slots/0/outcomeAxisAnchors",
  "/spec/slots/1/intentDimension",
  "/spec/slots/1/outcomeAxisAnchors",
  "/spec/slots/2/intentDimension",
  "/spec/slots/2/outcomeAxisAnchors",
  "/spec/coverageRationale",
  "/spec/orthogonalityRationale",
]);
const policyPaths = Object.freeze([
  "/spec/geometry/questionsPerRound",
  "/spec/geometry/choiceOptions",
  "/spec/disclosure/mode",
  "/spec/disclosure/siblingQuestionFramesVisible",
  "/spec/disclosure/futureQuestionsVisible",
  "/spec/disclosure/interimInterpretationVisible",
  "/spec/validation/rationaleRequired",
  "/spec/validation/authority",
]);
const fakeDigest = (character) => `sha256:${character.repeat(64)}`;

function pointerValue(resource, path) {
  return path.split("/").slice(1).reduce(
    (current, segment) => current[segment],
    resource,
  );
}

function selectedValue(resource, paths) {
  return paths.map((path) => ({
    path,
    value: pointerValue(resource, path),
  }));
}

function layer(ordinal, role, resource, paths) {
  return {
    ordinal,
    role,
    sourceReference: resourceReferenceFrom(resource),
    sourceSnapshot: resource,
    selectedValue: selectedValue(resource, paths),
  };
}

function policySnapshot() {
  return {
    apiVersion: "survey.mission-kit/v1alpha1",
    kind: "SurveyPolicySnapshot",
    metadata: { name: "survey-policy" },
    spec: {
      profileRef: {
        apiVersion: "authoring.mission-kit/v1alpha1",
        kind: "AuthoringProfileManifest",
        name: "survey-profile",
        semanticDigest: fakeDigest("a"),
      },
      geometry: {
        rounds: 2,
        questionsPerRound: 3,
        totalQuestions: 6,
        choiceOptions: { minimum: 3, maximum: 4 },
      },
      disclosure: {
        mode: "single-current-question",
        siblingQuestionFramesVisible: false,
        futureQuestionsVisible: false,
        interimInterpretationVisible: false,
      },
      generation: {
        questionFrameSetSize: 3,
        questionSetSize: 3,
        questionResourceType: {
          apiVersion: "schemas.mission-kit/v1alpha1",
          kind: "Question",
        },
        contextFrameResourceType: {
          apiVersion: "schemas.mission-kit/v1alpha1",
          kind: "ContextFrame",
        },
        roundTwoRelations: [
          "refines",
          "challenges",
          "disambiguates",
          "deepens",
        ],
      },
      validation: {
        rationaleRequired: true,
        authority: "mechanical-only",
        schemaBindings: [{ id: "survey-schemas", digest: fakeDigest("b") }],
        validatorBindings: [{
          id: "survey-validators",
          digest: fakeDigest("c"),
        }],
      },
      contextSelection: {
        preserveLayerRoles: true,
        allowInlineRuntimeState: false,
        selectors: [{ id: "survey-context", digest: fakeDigest("d") }],
      },
    },
  };
}

export function roundOneQuestionValues() {
  return {
    "q1-prompt": "Where should final decision authority reside?",
    "q1-options": [
      "Director | Final intent decisions remain with the Director.",
      "Delegated team | A named team resolves bounded decisions.",
      "Shared boundary | Authority varies by an explicit decision class.",
    ],
    "q1-option-relationship": "composable",
    "q1-design-rationale":
      "Distinguishes concentrated, delegated, and explicitly partitioned authority.",
    "q2-prompt": "Which execution boundary should govern autonomous work?",
    "q2-instruction":
      "Select the single boundary that should govern this work.",
    "q2-options": [
      "Reversible work | Proceed while changes remain safely reversible.",
      "Named checkpoints | Pause only at declared approval boundaries.",
      "Per-step approval | Obtain approval before every implementation step.",
      "No autonomy | Wait for explicit direction before taking action.",
    ],
    "q2-option-relationship": "exclusive",
    "q2-design-rationale":
      "Separates four mutually exclusive operating boundaries for autonomy.",
    "q3-prompt": "Which evidence qualities should acceptance require?",
    "q3-instruction":
      "Select every quality that should form part of the acceptance boundary.",
    "q3-options": [
      "Repeatable | Independent runs produce materially equivalent results.",
      "Fast | The evaluation completes within a short feedback cycle.",
      "Human-reviewed | A person examines the semantic result.",
      "Fully autonomous | No person participates in the evaluation.",
    ],
    "q3-option-relationship": "mixed",
    "q3-incompatibilities": ["1 + 3", "2 + 4"],
    "q3-design-rationale":
      "Elicits an evidence bundle while preserving two explicit incompatibility boundaries.",
  };
}

export function roundOneQuestionsAuthorityInputs() {
  const { surveyFrame, survey } = roundOneParentResources();
  survey.spec.outcomeAxes = ["authority", "determinism"];
  survey.spec.surveyFrameRef = resourceReferenceFrom(surveyFrame);
  const roundClosure = {
    apiVersion: "authoring.mission-kit/v1alpha1",
    kind: "ContextClosure",
    metadata: { name: "round-one-authority-parents" },
    spec: {
      layers: [
        layer(1, "survey-frame", surveyFrame, ["/spec"]),
        layer(2, "survey", survey, ["/spec/outcomeAxes"]),
      ],
    },
  };
  const [roundFrameProduct, roundProduct] = buildRoundOneFrameProducts({
    normalizedValues: roundOneFrameValues(),
    contextClosure: roundClosure,
  });
  const roundFrame = roundFrameProduct.resource;
  const round = roundProduct.resource;
  const references = {
    surveyFrame: resourceReferenceFrom(surveyFrame),
    survey: resourceReferenceFrom(survey),
    roundFrame: resourceReferenceFrom(roundFrame),
    round: resourceReferenceFrom(round),
  };
  const frameClosure = {
    apiVersion: "authoring.mission-kit/v1alpha1",
    kind: "ContextClosure",
    metadata: { name: "round-one-question-frame-parents" },
    spec: {
      layers: [
        layer(1, "survey-frame", surveyFrame, ["/spec"]),
        layer(2, "round-frame", roundFrame, ["/spec"]),
        layer(3, "survey", survey, ["/spec/outcomeAxes"]),
      ],
    },
  };
  const frameWorkspace = {
    spec: {
      activeHeads: [
        { slot: "survey-frame", reference: references.surveyFrame },
        { slot: "survey", reference: references.survey },
        { slot: "round-1-frame", reference: references.roundFrame },
        { slot: "round-1", reference: references.round },
      ],
      dependencyEdges: [
        {
          from: references.roundFrame,
          relation: "derived-from",
          to: references.surveyFrame,
        },
        {
          from: references.round,
          relation: "belongs-to",
          to: references.survey,
        },
        {
          from: references.round,
          relation: "frames",
          to: references.roundFrame,
        },
        {
          from: references.round,
          relation: "parent-frame",
          to: references.surveyFrame,
        },
      ],
    },
  };
  const frameProducts = buildRoundOneQuestionFrameProducts({
    normalizedValues: roundOneQuestionFrameValues(),
    contextClosure: frameClosure,
    workspace: frameWorkspace,
  });
  const questionFrames = frameProducts.slice(0, 3).map(({ resource }) =>
    resource
  );
  const frameSet = frameProducts[3].resource;
  const policy = policySnapshot();
  const questionFrameReferences = questionFrames.map(resourceReferenceFrom);
  const frameSetReference = resourceReferenceFrom(frameSet);
  const policyReference = resourceReferenceFrom(policy);
  const contextClosure = {
    apiVersion: "authoring.mission-kit/v1alpha1",
    kind: "ContextClosure",
    metadata: { name: "round-one-question-authority" },
    spec: {
      closureDigest: fakeDigest("0"),
      layers: [
        layer(1, "survey-frame", surveyFrame, ["/spec"]),
        layer(2, "round-frame", roundFrame, ["/spec"]),
        layer(3, "question-frame-set", frameSet, frameSetPaths),
        ...questionFrames.map((resource, index) =>
          layer(index + 4, `question-frame-${index + 1}`, resource, ["/spec"])
        ),
        layer(7, "policy", policy, policyPaths),
      ],
    },
  };
  contextClosure.spec.closureDigest =
    contextClosureDigest(contextClosure);
  contextClosure.metadata.name =
    `context-${contextClosure.spec.closureDigest.slice("sha256:".length)}`;
  const workspace = {
    spec: {
      activeHeads: [
        ...frameWorkspace.spec.activeHeads,
        ...questionFrameReferences.map((reference, index) => ({
          slot: `round-1-question-frame-${index + 1}`,
          reference,
        })),
        {
          slot: "round-1-question-frame-set",
          reference: frameSetReference,
        },
        { slot: "policy", reference: policyReference },
      ],
      dependencyEdges: [
        ...frameWorkspace.spec.dependencyEdges,
        ...questionFrameReferences.map((reference) => ({
          from: reference,
          relation: "derived-from",
          to: references.roundFrame,
        })),
        {
          from: frameSetReference,
          relation: "belongs-to",
          to: references.round,
        },
        ...questionFrameReferences.map((reference) => ({
          from: frameSetReference,
          relation: "frames",
          to: reference,
        })),
        {
          from: frameSetReference,
          relation: "parent-frame",
          to: references.roundFrame,
        },
      ],
    },
  };
  return {
    normalizedValues: roundOneQuestionValues(),
    contextClosure,
    workspace,
    references: {
      ...references,
      questionFrames: questionFrameReferences,
      frameSet: frameSetReference,
      policy: policyReference,
      contextClosure: resourceReferenceFrom(contextClosure),
    },
    resources: {
      surveyFrame,
      survey,
      roundFrame,
      round,
      questionFrames,
      frameSet,
      policy,
      contextClosure,
    },
  };
}

export function roundOneQuestionProducts() {
  return buildRoundOneQuestionProducts(roundOneQuestionsAuthorityInputs());
}

export function roundOneQuestionsProjectorInput() {
  const input = roundOneQuestionsAuthorityInputs();
  return {
    contextClosure: input.contextClosure,
    formDefinition: createRoundOneQuestionsFormDefinition(),
    projectionBinding: {},
    request: {},
    requestHandle: "1234abcd",
  };
}
