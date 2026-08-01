import { HASH_PROFILE_ID } from "../engine/hash.mjs";
import {
  createDeterministicFixtureExecutionProfiles,
} from "./execution-configuration.mjs";

function common(roleOutputClass, workOrderId) {
  return {
    schemaVersion: "1.0.0",
    hashProfileId: HASH_PROFILE_ID,
    roleOutputClass,
    workOrderId,
    status: "completed",
  };
}

function metacognitiveResponse() {
  return {
    perceivedCondition: "unknown",
    confidence: "low",
    rationale: "No comparative assignment information was visible.",
  };
}

function sectionsFromPackage(subjectPackage) {
  const capabilities = subjectPackage?.capabilities ?? {};
  return [
    ["summary", capabilities.summary],
    ["risk", capabilities.risk],
    ["next-step", capabilities.nextStep],
  ]
    .filter(([, text]) => typeof text === "string" && text.length > 0)
    .map(([sectionId, text]) => ({ sectionId, text }));
}

export function createDeterministicFixtureRoleAdapters({
  onInvocation = null,
} = {}) {
  const observe = async (roleClass, workOrder, input) => {
    await onInvocation?.({ roleClass, workOrder, input });
  };
  const adapters = {
    "synthetic-director": async ({ workOrder }) => async ({ input }) => {
      await observe("synthetic-director", workOrder, input);
      return {
        ...common("synthetic_director_session", workOrder.workOrderId),
        sessionPlan: {
          prompt:
            "Produce a concise survey artifact with a summary, material risk, and next step when supported.",
          artifactContract: ["summary", "risk", "next-step"],
        },
      };
    },
    "survey-executor": async ({ workOrder }) => async ({ input }) => {
      await observe("survey-executor", workOrder, input);
      const subjectArtifact = input.subjectExecution?.artifact;
      const artifact =
        subjectArtifact &&
        typeof subjectArtifact === "object" &&
        !Array.isArray(subjectArtifact)
          ? {
              artifactId: subjectArtifact.artifactId,
              title: subjectArtifact.title,
              sections: subjectArtifact.sections.map((section) => ({
                sectionId: section.sectionId,
                text: section.text,
              })),
            }
          : {
              artifactId: `${input.assignmentRef}:survey-artifact`,
              title: "Blind survey artifact",
              sections: sectionsFromPackage(input.subjectPackage),
            };
      return {
        ...common("survey_execution", workOrder.workOrderId),
        artifact,
        metacognitiveResponse: metacognitiveResponse(),
      };
    },
    "downstream-consumer": async ({ workOrder }) => async ({ input }) => {
      await observe("downstream-consumer", workOrder, input);
      const sectionIds = input.blindSurveyArtifact.sections.map(
        (section) => section.sectionId,
      );
      return {
        ...common("downstream_utility", workOrder.workOrderId),
        utility: {
          taskId: input.commonPublicTask.taskId,
          taskCompleted:
            sectionIds.includes("risk") && sectionIds.includes("next-step"),
          findings: sectionIds,
        },
        metacognitiveResponse: metacognitiveResponse(),
      };
    },
    "semantic-judge": async ({ workOrder }) => async ({ input }) => {
      await observe("semantic-judge", workOrder, input);
      const sectionIds = new Set(
        input.blindEvidenceBundle.artifact.sections.map(
          (section) => section.sectionId,
        ),
      );
      const conservative =
        input.reviewAssignment?.presentationRank === 1;
      const scores = Object.fromEntries(
        input.rubric.dimensions.map((dimension) => {
          const citableObligations = dimension.obligationIds.filter(
            (obligationId) => sectionIds.has(obligationId),
          );
          const observed =
            citableObligations.length === dimension.obligationIds.length;
          const deliberatelyConservative =
            conservative && observed;
          return [
            dimension.dimensionId,
            observed && !deliberatelyConservative ? 1 : 0,
          ];
        }),
      );
      const values = Object.values(scores);
      return {
        ...common("semantic_judge_ballot", workOrder.workOrderId),
        ballot: {
          ballotId: `${input.reviewRef}:ballot`,
          scores,
          overall:
            values.reduce((sum, value) => sum + value, 0) / values.length,
          rationale:
            conservative
              ? "Applied the registered key conservatively."
              : "Applied the registered key literally.",
        },
        metacognitiveResponse: metacognitiveResponse(),
      };
    },
    adjudicator: async ({ workOrder }) => async ({ input }) => {
      await observe("adjudicator", workOrder, input);
      const items = input.disagreementSet.map((disagreement) => {
        const sealedValues = input.sealedBallots.map(
          (ballot) => ballot.scores[disagreement.dimensionId],
        );
        return {
          dimensionId: disagreement.dimensionId,
          selectedScore: Math.max(...sealedValues),
          sealedValues,
          dissentPreserved: true,
        };
      });
      return {
        ...common("semantic_adjudication", workOrder.workOrderId),
        resolution: {
          resolutionId: `${input.adjudicationRef}:resolution`,
          items,
          disagreementCount: items.length,
        },
        metacognitiveResponse: metacognitiveResponse(),
      };
    },
  };
  Object.defineProperty(adapters, "executionProfiles", {
    value: createDeterministicFixtureExecutionProfiles(),
    enumerable: false,
    configurable: false,
    writable: false,
  });
  return adapters;
}
