import {
  HASH_PROFILE_ID,
  hashCanonical,
} from "../../source/executables/engine/index.mjs";
import {
  scenarioMaterialPersonaBriefDigest,
  scenarioMaterialRubricDigest,
  scenarioMaterialSemanticKeyDigest,
  sealScenarioMaterialAuthorityResponse,
} from "../../source/executables/orchestrator/index.mjs";

function materialBundle(binding, claimRequiresDownstream) {
  const scenario = binding.scenario;
  const latentIntentDigest = hashCanonical(
    "scenario-material-fixture-latent-intent/v1",
    {
      scenarioId: scenario.scenarioId,
      scenarioDigest: binding.scenarioDigest,
    },
  );
  const personaBrief = {
    schemaVersion: "1.0.0",
    hashProfileId: HASH_PROFILE_ID,
    personaBriefId: `${scenario.scenarioId}:persona`,
    scenarioId: scenario.scenarioId,
    latentIntentDigest,
    enactedBehaviorClass:
      scenario.scenarioClass === "contradictory"
        ? "contradictory"
        : "correction_prone",
    permissibleKnowledge: [scenario.workItem],
    prohibitedDisclosure: [
      "Evaluator-only semantic keys and arm identities.",
    ],
    interactionBehaviors: ["withhold_then_correct"],
    principalRef: `${scenario.scenarioId}:synthetic-director`,
    bearerCapabilityIncluded: false,
  };
  const semanticKey = {
    schemaVersion: "1.0.0",
    hashProfileId: HASH_PROFILE_ID,
    semanticKeyId: `${scenario.scenarioId}:survey-key`,
    scenarioId: scenario.scenarioId,
    latentIntentDigest,
    key: {
      purpose: "survey",
      requiredMeaning: [
        `Preserve the declared work-item intent for ${scenario.scenarioId}.`,
      ],
      optionalMeaning: ["Prefer concise, evidence-citable output."],
      prohibitedMeaning: ["Do not invent unprovided authority or intent."],
      rubricDigest: "0".repeat(64),
    },
    equivalenceClassesRoot: hashCanonical(
      "scenario-material-fixture-equivalence/v1",
      { scenarioId: scenario.scenarioId },
    ),
    priorityRelationsRoot: hashCanonical(
      "scenario-material-fixture-priority/v1",
      { scenarioId: scenario.scenarioId },
    ),
    tensions: [],
    uncertainties: [],
    exactAnswerScript: false,
  };
  const semanticKeyDigest =
    scenarioMaterialSemanticKeyDigest(semanticKey);
  const dimensions = scenario.outcomeAxes.map((axis) => ({
    dimensionId:
      axis.axisId === "protocol_integrity"
        ? "SEMANTIC_INTENT_ATOMS"
        : "SEMANTIC_TRACEABILITY",
    obligationIds:
      axis.axisId === "protocol_integrity"
        ? ["summary", "risk"]
        : [`${axis.axisId}:intent`],
    nativeScale: "ordinal",
    anchors: [
      { value: 0, meaning: `${axis.publicLabel} is not evidenced.` },
      { value: 1, meaning: `${axis.publicLabel} is evidenced.` },
    ],
    weight: 1,
    citationRequired: true,
    missingRule: "not_judgeable",
  }));
  const rubric = {
    schemaVersion: "1.0.0",
    hashProfileId: HASH_PROFILE_ID,
    rubricId: `${scenario.scenarioId}:survey-rubric`,
    purpose: "survey_semantic",
    semanticKeyDigest,
    dimensions,
    fixedExposureDenominators: dimensions.map((dimension) => ({
      dimensionId: dimension.dimensionId,
      denominator: 1,
    })),
    evidenceRefs: [binding.scenarioDigest],
  };
  semanticKey.key.rubricDigest = scenarioMaterialRubricDigest(rubric);
  const personaBriefDigest =
    scenarioMaterialPersonaBriefDigest(personaBrief);
  const downstreamParity = claimRequiresDownstream
    ? {
        applicability: "required",
        claimRequiresDownstream: true,
        downstreamTaskDigest: hashCanonical(
          "scenario-material-fixture-downstream-task/v1",
          { scenarioId: scenario.scenarioId },
        ),
        downstreamSemanticKeyDigest: hashCanonical(
          "scenario-material-fixture-downstream-key/v1",
          { scenarioId: scenario.scenarioId },
        ),
      }
    : {
        applicability: "not_required",
        claimRequiresDownstream: false,
      };
  const scenarioReview = {
    schemaVersion: "1.0.0",
    hashProfileId: HASH_PROFILE_ID,
    scenarioReviewId: `${scenario.scenarioId}:parity-review`,
    scenarioDigest: binding.scenarioDigest,
    personaBriefDigest,
    surveySemanticKeyDigest: semanticKeyDigest,
    downstreamParity,
    noScriptPassed: true,
    feasibilityPassed: true,
    privacyPassed: true,
    conflictPassed: true,
    calibrationFindingRefs: [...scenario.calibrationRefs],
    verdict: "pass",
  };
  return {
    scenarioRef: binding.scenarioRef,
    scenarioId: scenario.scenarioId,
    scenarioDigest: binding.scenarioDigest,
    semanticKey,
    personaBrief,
    rubric,
    scenarioReview,
  };
}

export function createScenarioMaterialAuthorityFixture({
  authorityId = "external-scenario-authority",
  mutateResponseCore = null,
} = {}) {
  const invocations = [];
  const provider = async (request) => {
    invocations.push(structuredClone(request));
    const core = {
      schemaVersion: "1.0.0",
      hashProfileId: HASH_PROFILE_ID,
      authorityId,
      requestId: request.requestId,
      requestDigest: request.requestDigest,
      campaignId: request.campaignId,
      campaignSealDigest: request.campaignSealDigest,
      constructionLifecycleState: request.lifecycleState,
      constructionLifecycleRevision: request.lifecycleRevision,
      constructionStateRoot: request.authoritativeStateRoot,
      constructedBeforeExecution: true,
      materials: request.scenarioBindings.map((binding) =>
        materialBundle(binding, request.claimRequiresDownstream),
      ),
    };
    await mutateResponseCore?.(core, request);
    return sealScenarioMaterialAuthorityResponse(core);
  };
  return { provider, invocations };
}
