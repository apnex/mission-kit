import {
  resourceReferenceFrom,
} from "../../../source/authoring/kernel/digests.mjs";

function digest(fill) {
  return `sha256:${fill.repeat(64)}`;
}

export function roundOneParentResources() {
  const surveyFrame = {
    apiVersion: "schemas.mission-kit/v1alpha1",
    kind: "ContextFrame",
    metadata: { name: "survey-frame-parent" },
    spec: {
      subject: "Context-aware Survey authoring",
      purpose:
        "Capture Director intent before generating Round or Question content.",
      scope: {
        included: ["Survey authoring workflow"],
        excluded: ["Runtime response collection"],
      },
      givens: [{
        classification: "constraint",
        text: "The Survey contains two rounds of three questions.",
      }],
      synopsis:
        "Frame the complete Survey before authoring its foundation Round.",
      terms: [{
        term: "foundation Round",
        meaning: "Round 1 establishes the initial intent dimensions.",
      }],
    },
  };
  const survey = {
    apiVersion: "survey.mission-kit/v1alpha1",
    kind: "Survey",
    metadata: { name: "survey-parent" },
    spec: {
      policySnapshotRef: {
        apiVersion: "survey.mission-kit/v1alpha1",
        kind: "SurveyPolicySnapshot",
        name: "survey-policy",
        semanticDigest: digest("a"),
      },
      surveyFrameRef: resourceReferenceFrom(surveyFrame),
      outcomeAxes: [
        "intent fidelity",
        "question-generation quality",
      ],
    },
  };
  return { surveyFrame, survey };
}

export function roundOneContextClosure() {
  const { surveyFrame, survey } = roundOneParentResources();
  return {
    apiVersion: "authoring.mission-kit/v1alpha1",
    kind: "ContextClosure",
    metadata: { name: "round-one-parent-closure" },
    spec: {
      layers: [
        {
          ordinal: 1,
          role: "survey-frame",
          sourceReference: resourceReferenceFrom(surveyFrame),
          sourceSnapshot: surveyFrame,
          selectedValue: [{
            path: "/spec",
            value: surveyFrame.spec,
          }],
        },
        {
          ordinal: 2,
          role: "survey",
          sourceReference: resourceReferenceFrom(survey),
          sourceSnapshot: survey,
          selectedValue: [{
            path: "/spec/outcomeAxes",
            value: survey.spec.outcomeAxes,
          }],
        },
      ],
    },
  };
}

export function roundOneFrameValues() {
  return {
    subject: "Foundation intent dimensions",
    purpose:
      "Establish the Director's initial priorities before refinement.",
    "scope-included": [
      "Primary intent dimensions",
      "Initial trade-off preferences",
    ],
    "scope-excluded": ["Round 2 disambiguation"],
    givens: [
      "fact | Round 1 contains exactly three questions.",
      "constraint | No Question is generated before this frame freezes.",
    ],
    synopsis:
      "Establish initial intent dimensions and priority trade-offs.",
    terms: [
      "priority | The relative importance of an outcome axis.",
    ],
    "scope-relation": "narrows",
    "containment-rationale":
      "The Round selects the initial intent dimensions already inside the complete Survey authoring workflow.",
  };
}
