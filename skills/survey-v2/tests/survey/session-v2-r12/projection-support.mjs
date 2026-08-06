import {
  resourceIntegrityDigest,
  resourceReferenceFrom,
} from "../../../source/authoring/kernel/digests.mjs";

export const excludedProjectionSentinels = Object.freeze([
  "FORBIDDEN_SURVEY_PURPOSE",
  "FORBIDDEN_ROUND_SCOPE",
  "FORBIDDEN_FRAME_SET_AXES",
  "FORBIDDEN_QUESTION_FRAME_RATIONALE",
  "FORBIDDEN_CONTEXT_SELECTED_VALUE",
  "FORBIDDEN_POLICY_INTERNALS",
  "FORBIDDEN_QUESTION_CONSTRAINT",
  "FORBIDDEN_QUESTION_EVIDENCE",
  "FORBIDDEN_BINDING_RATIONALE",
  "FORBIDDEN_FUTURE_QUESTION",
  "FORBIDDEN_SIBLING_RESOURCE",
]);

export const expectedQuestionProjection = Object.freeze({
  surveySynopsis:
    "Frame the complete Survey before asking its first question.",
  roundSynopsis:
    "Establish the Director's initial decision-authority preference.",
  questionSynopsis:
    "Clarify where final decision authority should reside.",
  prompt: Object.freeze({
    text: "Where should final decision authority reside?",
    instruction: "Select every compatible choice.",
  }),
  options: Object.freeze([
    Object.freeze({
      id: "a",
      label: "Director",
      meaning: "The Director retains the final decision.",
    }),
    Object.freeze({
      id: "b",
      label: "Delegated agent",
      meaning: "A bounded agent may make the final decision.",
    }),
    Object.freeze({
      id: "c",
      label: "Shared",
      meaning: "The Director and agent decide jointly.",
    }),
  ]),
  cardinality: Object.freeze({
    minimum: 1,
    maximum: 2,
  }),
});

function stored(resource) {
  const value = structuredClone(resource);
  return {
    reference: resourceReferenceFrom(value),
    integrityDigest: resourceIntegrityDigest(value),
    resource: value,
  };
}

function layer(
  ordinal,
  role,
  resource,
  sentinel,
  selectedPath = "/spec/privateEvidence",
) {
  const snapshot = structuredClone(resource);
  return {
    ordinal,
    role,
    sourceReference: resourceReferenceFrom(snapshot),
    sourceIntegrityDigest: resourceIntegrityDigest(snapshot),
    sourceSnapshot: snapshot,
    selectedValue: [{
      path: selectedPath,
      value: sentinel,
    }],
  };
}

function frame(name, synopsis, extra = {}) {
  return {
    apiVersion: "schemas.mission-kit/v1alpha1",
    kind: "ContextFrame",
    metadata: { name },
    spec: {
      subject: `${name} subject`,
      purpose: `${name} purpose`,
      scope: {
        included: [`${name} included`],
        excluded: [`${name} excluded`],
      },
      givens: [],
      synopsis,
      terms: [],
      ...extra,
    },
  };
}

function question(name, ordinal) {
  return {
    apiVersion: "schemas.mission-kit/v1alpha1",
    kind: "Question",
    metadata: { name },
    spec: {
      prompt: {
        text: `Future question ${ordinal}`,
      },
      response: {
        type: "Choice",
        cardinality: {
          minimum: 1,
          maximum: 1,
        },
        options: [
          { id: "a", label: "A", meaning: "Future A" },
          { id: "b", label: "B", meaning: "Future B" },
          { id: "c", label: "C", meaning: "Future C" },
        ],
        constraints: [],
      },
      privateEvidence: "FORBIDDEN_FUTURE_QUESTION",
    },
  };
}

/**
 * Build complete stored-resource inputs with ambient content planted at every
 * boundary that the closed director projection is forbidden to select.
 */
export function projectionFixtureSources() {
  const surveyFrame = frame(
    "survey-frame-r12",
    expectedQuestionProjection.surveySynopsis,
    {
      purpose: "FORBIDDEN_SURVEY_PURPOSE",
    },
  );
  const roundFrame = frame(
    "round-one-frame-r12",
    expectedQuestionProjection.roundSynopsis,
    {
      scope: {
        included: ["decision authority"],
        excluded: ["FORBIDDEN_ROUND_SCOPE"],
      },
    },
  );
  const questionFrame = frame(
    "round-one-question-frame-one-r12",
    expectedQuestionProjection.questionSynopsis,
    {
      outcomeAxisAnchors: [{
        axis: "authority",
        evidence: "FORBIDDEN_QUESTION_FRAME_RATIONALE",
      }],
    },
  );
  const questionFrameSet = {
    apiVersion: "survey.mission-kit/v1alpha1",
    kind: "QuestionFrameSet",
    metadata: { name: "round-one-question-frame-set-r12" },
    spec: {
      synopsis: "FORBIDDEN_SIBLING_RESOURCE",
      outcomeAxes: ["FORBIDDEN_FRAME_SET_AXES"],
      frames: [resourceReferenceFrom(questionFrame)],
    },
  };
  const secondFrame = frame(
    "round-one-question-frame-two-r12",
    "FORBIDDEN_SIBLING_RESOURCE",
  );
  const thirdFrame = frame(
    "round-one-question-frame-three-r12",
    "FORBIDDEN_SIBLING_RESOURCE",
  );

  const firstQuestion = {
    apiVersion: "schemas.mission-kit/v1alpha1",
    kind: "Question",
    metadata: { name: "round-one-question-one-r12" },
    spec: {
      prompt: structuredClone(expectedQuestionProjection.prompt),
      response: {
        type: "Choice",
        cardinality:
          structuredClone(expectedQuestionProjection.cardinality),
        options:
          structuredClone(expectedQuestionProjection.options),
        constraints: [{
          type: "MutuallyExclusive",
          optionIds: ["a", "b"],
          privateRationale: "FORBIDDEN_QUESTION_CONSTRAINT",
        }],
      },
      privateEvidence: "FORBIDDEN_QUESTION_EVIDENCE",
    },
  };
  const secondQuestion = question(
    "round-one-question-two-r12",
    2,
  );
  const thirdQuestion = question(
    "round-one-question-three-r12",
    3,
  );
  const firstBinding = {
    apiVersion: "survey.mission-kit/v1alpha1",
    kind: "SurveyQuestionBinding",
    metadata: { name: "round-one-question-binding-one-r12" },
    spec: {
      designRationale: "FORBIDDEN_BINDING_RATIONALE",
    },
  };
  const secondBinding = {
    ...structuredClone(firstBinding),
    metadata: { name: "round-one-question-binding-two-r12" },
  };
  const thirdBinding = {
    ...structuredClone(firstBinding),
    metadata: { name: "round-one-question-binding-three-r12" },
  };
  const policySnapshot = {
    apiVersion: "survey.mission-kit/v1alpha1",
    kind: "SurveyPolicySnapshot",
    metadata: {
      name: "survey-policy-r12",
      annotations: {
        "mission-kit.test/exclusion-sentinel":
          "FORBIDDEN_POLICY_INTERNALS",
      },
    },
    spec: {
      profileRef: {
        apiVersion: "authoring.mission-kit/v1alpha1",
        kind: "AuthoringProfileManifest",
        name: "survey-profile-r12",
        semanticDigest: `sha256:${"a".repeat(64)}`,
      },
      geometry: {
        rounds: 2,
        questionsPerRound: 3,
        totalQuestions: 6,
        choiceOptions: {
          minimum: 3,
          maximum: 4,
        },
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
        schemaBindings: [{
          id: "survey-schemas",
          digest: `sha256:${"b".repeat(64)}`,
        }],
        validatorBindings: [{
          id: "survey-validators",
          digest: `sha256:${"c".repeat(64)}`,
        }],
      },
      contextSelection: {
        preserveLayerRoles: true,
        allowInlineRuntimeState: false,
        selectors: [{
          id: "survey-context",
          digest: `sha256:${"d".repeat(64)}`,
        }],
      },
    },
  };

  const generationContext = {
    apiVersion: "authoring.mission-kit/v1alpha1",
    kind: "ContextClosure",
    metadata: { name: "round-one-question-generation-r12" },
    spec: {
      layers: [
        layer(
          1,
          "survey-frame",
          surveyFrame,
          "FORBIDDEN_CONTEXT_SELECTED_VALUE",
        ),
        layer(
          2,
          "round-frame",
          roundFrame,
          "FORBIDDEN_CONTEXT_SELECTED_VALUE",
        ),
        layer(
          3,
          "question-frame-set",
          questionFrameSet,
          "FORBIDDEN_CONTEXT_SELECTED_VALUE",
        ),
        layer(
          4,
          "question-frame-1",
          questionFrame,
          "FORBIDDEN_CONTEXT_SELECTED_VALUE",
        ),
        layer(
          5,
          "question-frame-2",
          secondFrame,
          "FORBIDDEN_CONTEXT_SELECTED_VALUE",
        ),
        layer(
          6,
          "question-frame-3",
          thirdFrame,
          "FORBIDDEN_CONTEXT_SELECTED_VALUE",
        ),
        layer(
          7,
          "policy",
          policySnapshot,
          "FORBIDDEN_POLICY_INTERNALS",
          "/metadata/annotations/mission-kit.test~1exclusion-sentinel",
        ),
      ],
    },
  };

  const instrument = {
    apiVersion: "survey.mission-kit/v1alpha1",
    kind: "RoundInstrument",
    metadata: { name: "round-one-instrument-r12" },
    spec: {
      roundOrdinal: 1,
      policySnapshotRef:
        resourceReferenceFrom(policySnapshot),
      generationContextRef:
        resourceReferenceFrom(generationContext),
      units: [
        {
          slot: 1,
          questionOrdinal: 1,
          questionFrameRef: resourceReferenceFrom(questionFrame),
          bindingRef: resourceReferenceFrom(firstBinding),
          questionRef: resourceReferenceFrom(firstQuestion),
        },
        {
          slot: 2,
          questionOrdinal: 2,
          questionFrameRef: resourceReferenceFrom(secondFrame),
          bindingRef: resourceReferenceFrom(secondBinding),
          questionRef: resourceReferenceFrom(secondQuestion),
        },
        {
          slot: 3,
          questionOrdinal: 3,
          questionFrameRef: resourceReferenceFrom(thirdFrame),
          bindingRef: resourceReferenceFrom(thirdBinding),
          questionRef: resourceReferenceFrom(thirdQuestion),
        },
      ],
      privateEvidence: "FORBIDDEN_SIBLING_RESOURCE",
    },
  };

  return {
    instrumentVersion: stored(instrument),
    generationContextVersion: stored(generationContext),
    questionFrameVersion: stored(questionFrame),
    questionVersion: stored(firstQuestion),
    nonAdmittedVersions: [
      stored(firstBinding),
      stored(secondBinding),
      stored(thirdBinding),
      stored(secondQuestion),
      stored(thirdQuestion),
    ],
  };
}

export function expectedPresentation() {
  return {
    $schema:
      "urn:mission-kit:survey-v2:schema:question-presentation:v2",
    schemaVersion: "2.0.0",
    kind: "question",
    questionId: "Q1",
    context: {
      surveySynopsis: expectedQuestionProjection.surveySynopsis,
      roundSynopsis: expectedQuestionProjection.roundSynopsis,
      questionSynopsis:
        expectedQuestionProjection.questionSynopsis,
    },
    prompt: structuredClone(expectedQuestionProjection.prompt),
    options: structuredClone(expectedQuestionProjection.options),
    responseGuidance: {
      syntax: "Pick one or more option letters.",
      minimum: expectedQuestionProjection.cardinality.minimum,
      maximum: expectedQuestionProjection.cardinality.maximum,
    },
  };
}
