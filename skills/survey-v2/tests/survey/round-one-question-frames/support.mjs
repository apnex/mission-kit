export function roundOneQuestionFrameValues() {
  const values = {
    "coverage-rationale":
      "Together the three frames cover authority, execution boundaries, and evidence quality inside the foundation Round.",
    "orthogonality-rationale":
      "Authority asks who decides, execution asks how work proceeds, and evidence asks how results are judged.",
  };
  const frames = [
    {
      subject: "Decision authority",
      purpose: "Determine where final design authority must reside.",
      included: ["Decision ownership", "Escalation boundary"],
      excluded: ["Implementation sequencing"],
      givens: ["constraint | One Director owns final intent decisions."],
      synopsis: "Clarify decision ownership and escalation boundaries.",
      terms: ["Director | The final intent decision authority."],
      relation: "narrows",
      containment:
        "Decision ownership is an explicit part of the Round's initial intent boundary.",
      dimension: "authority",
      anchors: ["authority | evidence about explicit decision ownership"],
    },
    {
      subject: "Execution boundary",
      purpose: "Determine how autonomously the implementation may proceed.",
      included: ["Autonomy level", "Approval checkpoints"],
      excluded: ["Evaluation scoring"],
      givens: ["assumption | Safe reversible work may proceed autonomously."],
      synopsis: "Bound implementation autonomy and approval checkpoints.",
      terms: ["checkpoint | A point requiring explicit authority."],
      relation: "partitions",
      containment:
        "Execution autonomy partitions the Round's operating preference from its outcome preferences.",
      dimension: "execution autonomy",
      anchors: ["determinism | evidence about bounded approval checkpoints"],
    },
    {
      subject: "Evaluation evidence",
      purpose: "Determine what evidence makes a generated result acceptable.",
      included: ["Acceptance evidence", "Repeatability"],
      excluded: ["Question wording"],
      givens: ["fact | Generated products are evaluated after authoring."],
      synopsis: "Define acceptable evidence and repeatability expectations.",
      terms: ["evidence | Observable support for an acceptance claim."],
      relation: "qualifies",
      containment:
        "Evidence quality qualifies how the Round's selected intent will be verified.",
      dimension: "evidence quality",
      anchors: ["determinism | evidence about repeatable acceptance criteria"],
    },
  ];
  frames.forEach((frame, index) => {
    const prefix = `q${index + 1}-`;
    values[`${prefix}subject`] = frame.subject;
    values[`${prefix}purpose`] = frame.purpose;
    values[`${prefix}scope-included`] = frame.included;
    values[`${prefix}scope-excluded`] = frame.excluded;
    values[`${prefix}givens`] = frame.givens;
    values[`${prefix}synopsis`] = frame.synopsis;
    values[`${prefix}terms`] = frame.terms;
    values[`${prefix}scope-relation`] = frame.relation;
    values[`${prefix}containment-rationale`] = frame.containment;
    values[`${prefix}intent-dimension`] = frame.dimension;
    values[`${prefix}outcome-axis-anchors`] = frame.anchors;
  });
  return values;
}

export function roundOneQuestionFramesAuthorityInputs() {
  const { surveyFrame, survey } = roundOneParentResources();
  survey.spec.outcomeAxes = ["authority", "determinism"];
  survey.spec.surveyFrameRef = resourceReferenceFrom(surveyFrame);
  const roundClosure = {
    apiVersion: "authoring.mission-kit/v1alpha1",
    kind: "ContextClosure",
    metadata: { name: "round-one-authority-parents" },
    spec: {
      layers: [
        {
          ordinal: 1,
          role: "survey-frame",
          sourceReference: resourceReferenceFrom(surveyFrame),
          sourceSnapshot: surveyFrame,
          selectedValue: [{ path: "/spec", value: surveyFrame.spec }],
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
  const roundProducts = buildRoundOneFrameProducts({
    normalizedValues: roundOneFrameValues(),
    contextClosure: roundClosure,
  });
  const roundFrame = roundProducts[0].resource;
  const round = roundProducts[1].resource;
  const references = {
    surveyFrame: resourceReferenceFrom(surveyFrame),
    survey: resourceReferenceFrom(survey),
    roundFrame: resourceReferenceFrom(roundFrame),
    round: resourceReferenceFrom(round),
  };
  return {
    normalizedValues: roundOneQuestionFrameValues(),
    contextClosure: {
      apiVersion: "authoring.mission-kit/v1alpha1",
      kind: "ContextClosure",
      metadata: { name: "round-one-question-frame-parents" },
      spec: {
        layers: [
          {
            ordinal: 1,
            role: "survey-frame",
            sourceReference: references.surveyFrame,
            sourceSnapshot: surveyFrame,
            selectedValue: [{ path: "/spec", value: surveyFrame.spec }],
          },
          {
            ordinal: 2,
            role: "round-frame",
            sourceReference: references.roundFrame,
            sourceSnapshot: roundFrame,
            selectedValue: [{ path: "/spec", value: roundFrame.spec }],
          },
          {
            ordinal: 3,
            role: "survey",
            sourceReference: references.survey,
            sourceSnapshot: survey,
            selectedValue: [{
              path: "/spec/outcomeAxes",
              value: survey.spec.outcomeAxes,
            }],
          },
        ],
      },
    },
    workspace: {
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
    },
    references,
  };
}
import {
  resourceReferenceFrom,
} from "../../../source/authoring/kernel/digests.mjs";
import {
  buildRoundOneFrameProducts,
} from "../../../source/authoring/survey/round-one-frame-authority.mjs";
import {
  roundOneFrameValues,
  roundOneParentResources,
} from "../round-one/support.mjs";
