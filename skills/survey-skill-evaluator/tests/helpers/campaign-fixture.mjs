import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  HASH_PROFILE_ID,
  LifecycleRegistry,
  SchemaValidator,
  hashCanonical,
  requiredCommandAuthorityIds,
} from "../../source/executables/engine/index.mjs";
import {
  CampaignOrchestrator,
  surveySubjectAdapterDescriptor,
} from "../../source/executables/orchestrator/index.mjs";
import { sealAnalysisPlan } from "../../source/executables/statistics/index.mjs";
import { forceRemoveFixtureTree } from "./candidate-capture-fixture.mjs";
import { createExternalAuthorityFixture } from "./external-authority-fixture.mjs";

export const packageRoot = join(
  dirname(fileURLToPath(import.meta.url)),
  "../..",
);

async function writeJson(path, value) {
  await writeFile(path, `${JSON.stringify(value)}\n`, "utf8");
}

export function fixtureSubjectAdapter(profileId = "survey-v1") {
  const descriptor = surveySubjectAdapterDescriptor(profileId);
  return Object.freeze({ describe: () => descriptor });
}

export async function writeSurveyCandidateSource(
  root,
  body = "Fixture Survey subject.",
  capabilities = null,
) {
  await mkdir(root, { recursive: true, mode: 0o750 });
  await writeFile(
    join(root, "SKILL.md"),
    `---\nname: survey\ndescription: Fixture Survey subject.\n---\n\n# Survey\n\n${body}\n`,
    "utf8",
  );
  if (capabilities !== null) {
    await writeJson(join(root, "fixture-capabilities.json"), {
      capabilities,
      packageId: "fixture-subject",
      sealed: true,
    });
  }
}

export function campaignDependencePlanFixture() {
  return {
    schemaVersion: "1.0.0",
    hashProfileId: HASH_PROFILE_ID,
    dependencePlanId: "campaign-fixture-dependence",
    factors: [
      {
        factorId: "assignment",
        field: "assignmentId",
        sampling: "fixed",
        relation: "root",
        parentFactorId: null,
        generalizationPopulation: null,
        assignmentMechanism: "within_block_permutation",
        clusterCountFloor: 0,
      },
    ],
    stratumFields: ["stratumId"],
    blockFields: ["scenarioId"],
    assignmentBased: true,
    resamplingMethod: "assignment_randomization",
    targetPopulation: "known_answer_fixture",
    effectiveIndependentClusterCounts: [],
    estimatorId: "blocked_contrast_v1",
    resamplerId: "sealed_assignment_randomization_v1",
    seedCommitmentDigest: hashCanonical(
      "campaign-dependence-plan-seed/v1",
      { fixture: "campaign" },
    ),
  };
}

export function campaignAnalysisPlanFixture() {
  const digest = (label) =>
    hashCanonical("campaign-analysis-plan-fixture/v1", { label });
  const dependencePlan = campaignDependencePlanFixture();
  return sealAnalysisPlan({
    schemaVersion: "1.0.0",
    hashProfileId: HASH_PROFILE_ID,
    analysisPlanId: "analysis-fixture",
    preregistrationDigest: digest("preregistration"),
    claimIds: ["claim-1"],
    primaryMetricIds: ["SEMANTIC_INTENT_ATOMS"],
    secondaryMetricIds: ["DOWNSTREAM_UTILITY"],
    diagnosticMetricIds: [],
    targetPopulation: "known_answer_fixture",
    stratumWeights: [{ stratumId: "all", weight: 1 }],
    dependencePlanDigest: hashCanonical(
      "campaign-dependence-plan/v1",
      dependencePlan,
    ),
    estimand: {
      estimandId: "known_answer_contrast",
      treatmentArmId: "candidate",
      controlArmId: "control",
      analysisUnit: "assignment",
      contrastFunction: "difference_in_means",
      supportedConclusion: "Known-answer protocol plumbing only.",
    },
    missingness: {
      lowerBound: 0,
      upperBound: 1,
      candidateFailureMapping: "registered_adverse",
      exogenousMissingRule: "typed_missing",
      sensitivityRecipeIds: [],
      completeCasePrimaryForbidden: true,
    },
    inference: {
      method: "assignment_randomization",
      confidence: 0.95,
      resampleCount: 100,
      convergenceTolerance: 0.05,
      seedCommitmentDigest: digest("seed"),
    },
    multiplicity: {
      familyId: "known_answer_family",
      purpose: "exploratory_diagnostic",
      procedure: "holm",
      alpha: 0.05,
    },
    agreement: {
      minimumValidBallots: 2,
      scaleMethod: "krippendorff_alpha",
      adjudicationPolicyDigest: digest("adjudication-policy"),
    },
    ranking: {
      guardrailIds: ["no_live_efficacy_claim"],
      usePareto: true,
      rankIntervalConfidence: 0.95,
      tieRecipeId: "non_dominating_front",
      weightedPolicyId: null,
    },
    attentionProtection: {
      minimizeOnlyToil: true,
      learningInvestmentAdverse: false,
      directorStrategicJudgmentAdverse: false,
      unresolvedExcluded: true,
    },
    recommendationPolicyDigest: digest("recommendation-policy"),
  });
}

export function campaignScenarioFixture({
  scenarioId = "scenario-1",
  workItem = "Exercise the sealed known-answer campaign protocol.",
} = {}) {
  return {
    schemaVersion: "1.0.0",
    hashProfileId: HASH_PROFILE_ID,
    scenarioId,
    workItem,
    provenanceRoot: hashCanonical("campaign-scenario-fixture/v1", {
      scenarioId,
      workItem,
    }),
    outcomeAxes: [
      {
        axisId: "protocol_integrity",
        publicLabel: "Protocol integrity",
      },
    ],
    scenarioClass: "canonical",
    requiredCapabilities: [],
    calibrationRefs: [],
    protectedMaterialIncluded: false,
  };
}

export async function makeCampaignFixture({
  executionDriver = null,
  seal = true,
  assignmentsPerCell = 0,
  scenarioFixtures = null,
  analysisPlanFixture = null,
  stoppingRuleFixture = null,
} = {}) {
  const workspaceRoot = await mkdtemp(join(tmpdir(), "survey-campaign-"));
  const subjectRoot = await mkdtemp(join(tmpdir(), "survey-subjects-"));
  const schemaValidator = await SchemaValidator.fromPackageRoot(packageRoot);
  const registry = await LifecycleRegistry.fromFile(
    join(packageRoot, "source/manifests/lifecycles.json"),
  );
  const authority = createExternalAuthorityFixture({
    authorityIds: [
      ...new Set(
        [...registry.participantPolicies.values()].flatMap((policy) =>
          requiredCommandAuthorityIds(policy),
        ),
      ),
    ],
    schemaValidator,
  });
  if (executionDriver) {
    executionDriver.authorityTrustRoot ??= authority.trustRoot;
    executionDriver.authorityReceiptProvider ??= authority.provider;
  }
  const orchestrator = await CampaignOrchestrator.open({
    packageRoot,
    workspaceRoot,
    executionDriver,
    authorityTrustRoot: authority.trustRoot,
    authorityReceiptProvider: authority.provider,
  });
  await orchestrator.init({ campaignId: "campaign-fixture" });
  const candidateSource = join(subjectRoot, "candidate");
  const controlSource = join(subjectRoot, "control");
  await writeSurveyCandidateSource(
    candidateSource,
    "Candidate known-answer protocol fixture.",
    {
      summary: "The campaign can be executed under a sealed role protocol.",
      risk:
        "Comparative context can leak unless every role projection is closed.",
      nextStep: "Close the awareness universe before issuing one analyst grant.",
    },
  );
  await writeSurveyCandidateSource(
    controlSource,
    "Control known-answer protocol fixture.",
    {
      summary: "The campaign can be executed.",
    },
  );
  const adapter = fixtureSubjectAdapter();
  const candidateArm = await orchestrator.captureCandidate({
    armId: "candidate",
    sourceRoot: candidateSource,
    adapter,
  });
  const controlArm = await orchestrator.captureCandidate({
    armId: "control",
    sourceRoot: controlSource,
    adapter,
  });
  await writeJson(
    join(workspaceRoot, "analysis-plan.json"),
    analysisPlanFixture ?? campaignAnalysisPlanFixture(),
  );
  await writeJson(
    join(workspaceRoot, "dependence-plan.json"),
    campaignDependencePlanFixture(),
  );
  await writeJson(
    join(workspaceRoot, "stopping-rule.json"),
    stoppingRuleFixture ?? {
      schemaVersion: "1.0.0",
      hashProfileId: HASH_PROFILE_ID,
      ruleId: "fixed-no-provider",
      ruleClass: "fixed_sample",
      sampleUnit: "scenario_stratum_arm_cell",
      minimumAssignmentsPerCell: assignmentsPerCell,
      maximumAssignmentsPerCell: assignmentsPerCell,
      completionRule: "all_assigned_terminal",
      outcomeResponsiveStoppingPermitted: false,
    },
  );
  const scenarios =
    scenarioFixtures ?? [campaignScenarioFixture()];
  const scenarioRefs = [];
  for (const [index, scenario] of scenarios.entries()) {
    const scenarioRef = `scenario-${index + 1}.json`;
    await writeJson(join(workspaceRoot, scenarioRef), scenario);
    scenarioRefs.push(scenarioRef);
  }
  const input = {
    schemaVersion: "1.0.0",
    hashProfileId: HASH_PROFILE_ID,
    campaignId: "campaign-fixture",
    useClass: "diagnostic",
    promotionAuthorized: false,
    arms: [
      {
        armId: "candidate",
        conditionClass: "candidate",
        environmentDigest: hashCanonical(
          "campaign-environment-fixture/v1",
          { environment: "shared" },
        ),
        snapshotRef: candidateArm.snapshotRef,
      },
      {
        armId: "control",
        conditionClass: "frozen-prior",
        environmentDigest: hashCanonical(
          "campaign-environment-fixture/v1",
          { environment: "shared" },
        ),
        snapshotRef: controlArm.snapshotRef,
      },
    ],
    claims: [
      {
        claimId: "claim-1",
        text: "Synthetic protocol integrity",
        claimClass: "upgrade-effect",
        treatmentArmId: "candidate",
        controlArmId: "control",
      },
    ],
    population: { target: "known_answer_fixture", strata: [] },
    controlAuditPolicy: {
      treatmentArmId: "candidate",
      controlArmId: "control",
      manipulatedMechanismId: "survey-methodology",
      allowedDifferencePaths: ["$"],
      forbiddenDifferencePaths: [],
      forbiddenDoctrineTerms: [],
      expectedDirectionVisibleToAuditor: false,
    },
    scenarioRefs,
    analysisPlanRef: "analysis-plan.json",
    dependencePlanRef: "dependence-plan.json",
    stoppingRuleRef: "stopping-rule.json",
  };
  await writeJson(join(workspaceRoot, "campaign-input.json"), input);
  if (seal) await orchestrator.seal();
  return {
    workspaceRoot,
    orchestrator,
    schemaValidator,
    authority,
    input,
    cleanup: async () => {
      await forceRemoveFixtureTree(workspaceRoot);
      await forceRemoveFixtureTree(subjectRoot);
    },
  };
}
