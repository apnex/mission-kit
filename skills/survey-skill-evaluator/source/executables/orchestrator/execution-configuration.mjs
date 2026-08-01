import {
  canonicalize,
  deepCloneCanonical,
  deepFreeze,
} from "../engine/canonical-json.mjs";
import {
  IntegrityError,
  ValidationError,
} from "../engine/errors.mjs";
import {
  HASH_PROFILE_ID,
  hashCanonical,
} from "../engine/hash.mjs";

const DIGEST = /^[a-f0-9]{64}$/u;
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$/u;
const PLACEHOLDER = /not[_-]?reported/iu;

export const SEALED_EXECUTION_ROLE_CLASSES = Object.freeze([
  "synthetic-director",
  "survey-executor",
  "downstream-consumer",
  "semantic-judge",
  "adjudicator",
]);

const ROLE_PLAN_INPUTS = Object.freeze({
  "synthetic-director": Object.freeze([
    "assignmentRef",
    "directorVisibleHistory",
    "privatePersonaBrief",
    "publicScenario",
    "respondentTools",
    "scopedPrincipal",
  ]),
  "survey-executor": Object.freeze([
    "assignmentRef",
    "candidateSession",
    "declaredTools",
    "postContentAwarenessRequest",
    "projectFixture",
    "publicScenario",
    "subjectExecution",
  ]),
  "downstream-consumer": Object.freeze([
    "assignmentRef",
    "blindSurveyArtifact",
    "commonPublicTask",
    "declaredTools",
    "outputContract",
    "postContentAwarenessRequest",
  ]),
  "semantic-judge": Object.freeze([
    "blindEvidenceBundle",
    "postContentAwarenessRequest",
    "reviewAssignment",
    "reviewRef",
    "rubric",
    "semanticKey",
  ]),
  adjudicator: Object.freeze([
    "adjudicationRef",
    "disagreementSet",
    "frozenBlindBundle",
    "postContentAwarenessRequest",
    "sealedBallots",
  ]),
});

const ROLE_PROMPT_TEXT = Object.freeze({
  "synthetic-director":
    "Elicit one disposable, scenario-bound survey session without comparative arm context.",
  "survey-executor":
    "Render the frozen Survey subject artifact through the least-context role boundary.",
  "downstream-consumer":
    "Attempt the registered downstream task using only the blinded Survey artifact.",
  "semantic-judge":
    "Apply the registered private semantic key and rubric independently to one blind artifact.",
  adjudicator:
    "Resolve only registered ballot disagreements while preserving every sealed value.",
});

const ROLE_PURPOSE = Object.freeze({
  "synthetic-director": "disposable_synthetic_director_session",
  "survey-executor": "blind_survey_artifact_projection",
  "downstream-consumer": "blind_downstream_utility_attempt",
  "semantic-judge": "independent_registered_semantic_judgment",
  adjudicator: "registered_disagreement_resolution",
});

const ROLE_OUTPUT_SCHEMA = Object.freeze(
  Object.fromEntries(
    SEALED_EXECUTION_ROLE_CLASSES.map((roleClass) => [
      roleClass,
      `role-output/${roleClass}/v1`,
    ]),
  ),
);

const ROLE_AWARENESS = Object.freeze({
  "synthetic-director": false,
  "survey-executor": true,
  "downstream-consumer": true,
  "semantic-judge": true,
  adjudicator: true,
});

function assertExactKeys(value, expected, label) {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new ValidationError(`${label} must be a plain object`);
  }
  const actual = Object.keys(value).sort();
  const required = [...expected].sort();
  if (canonicalize(actual) !== canonicalize(required)) {
    throw new ValidationError(`${label} has an unauthorized field set`, {
      expected: required,
      actual,
    });
  }
}

function assertDigest(value, label) {
  if (typeof value !== "string" || !DIGEST.test(value)) {
    throw new ValidationError(`${label} must be a SHA-256 digest`);
  }
}

function assertIdentifier(value, label) {
  if (typeof value !== "string" || !IDENTIFIER.test(value)) {
    throw new ValidationError(`${label} must be an identifier`);
  }
}

function rejectPlaceholders(value, path = "$") {
  if (typeof value === "string" && PLACEHOLDER.test(value)) {
    throw new ValidationError(
      "Pre-execution configuration cannot contain not-reported placeholders",
      { path },
    );
  }
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((entry, index) =>
      rejectPlaceholders(entry, `${path}[${index}]`),
    );
    return;
  }
  for (const [key, entry] of Object.entries(value)) {
    rejectPlaceholders(entry, `${path}.${key}`);
  }
}

function sealedExecutionProfile(core) {
  return deepFreeze({
    ...deepCloneCanonical(core),
    executionProfileDigest: hashCanonical(
      "role-execution-profile/v1",
      core,
    ),
  });
}

export function createDeterministicFixtureExecutionProfiles({
  executionBoundary = "test_only_in_process",
  providerVersion = "1.0.0",
} = {}) {
  return deepFreeze(
    SEALED_EXECUTION_ROLE_CLASSES.map((roleClass) =>
      sealedExecutionProfile({
        roleClass,
        executionBoundary,
        provider: {
          providerId: "mission-kit-fixture-provider",
          providerVersion,
        },
        model: {
          modelId: "deterministic-fixture-role",
          modelVersion: "1.0.0",
        },
        sampling: {
          strategyId: "deterministic-single-path",
          deterministic: true,
          seed: "survey-evaluator-fixture-seed-v1",
          temperature: 0,
          topP: 1,
          maxOutputTokens: 4096,
        },
        toolCatalog: {
          toolCatalogId: "sealed-role-empty-tool-catalog",
          toolCatalogVersion: "1.0.0",
          toolIds: [],
          toolCatalogDigest: hashCanonical(
            "role-tool-catalog/v1",
            {
              toolCatalogId: "sealed-role-empty-tool-catalog",
              toolCatalogVersion: "1.0.0",
              toolIds: [],
            },
          ),
        },
        runtime: {
          runtimeId: "node",
          runtimeVersion: process.versions.node,
          adapterId: `fixture-${roleClass}`,
          adapterVersion: "1.0.0",
        },
      }),
    ),
  );
}

function validateExecutionProfiles(profiles) {
  if (!Array.isArray(profiles)) {
    throw new ValidationError(
      "Every sealed role requires an explicit execution profile",
    );
  }
  const byRole = new Map();
  for (const profile of profiles) {
    assertExactKeys(
      profile,
      [
        "roleClass",
        "executionBoundary",
        "provider",
        "model",
        "sampling",
        "toolCatalog",
        "runtime",
        "executionProfileDigest",
      ],
      "role execution profile",
    );
    assertIdentifier(profile.roleClass, "execution profile role class");
    if (!SEALED_EXECUTION_ROLE_CLASSES.includes(profile.roleClass)) {
      throw new ValidationError(
        "Execution profile names a role outside the sealed campaign plan",
        { roleClass: profile.roleClass },
      );
    }
    if (byRole.has(profile.roleClass)) {
      throw new ValidationError("Execution profile role is duplicated", {
        roleClass: profile.roleClass,
      });
    }
    assertExactKeys(
      profile.provider,
      ["providerId", "providerVersion"],
      "execution profile provider",
    );
    assertExactKeys(
      profile.model,
      ["modelId", "modelVersion"],
      "execution profile model",
    );
    assertExactKeys(
      profile.sampling,
      [
        "strategyId",
        "deterministic",
        "seed",
        "temperature",
        "topP",
        "maxOutputTokens",
      ],
      "execution profile sampling configuration",
    );
    assertExactKeys(
      profile.toolCatalog,
      [
        "toolCatalogId",
        "toolCatalogVersion",
        "toolIds",
        "toolCatalogDigest",
      ],
      "execution profile tool catalog",
    );
    assertExactKeys(
      profile.runtime,
      [
        "runtimeId",
        "runtimeVersion",
        "adapterId",
        "adapterVersion",
      ],
      "execution profile runtime",
    );
    for (const [label, value] of [
      ["provider ID", profile.provider.providerId],
      ["provider version", profile.provider.providerVersion],
      ["model ID", profile.model.modelId],
      ["model version", profile.model.modelVersion],
      ["sampling strategy ID", profile.sampling.strategyId],
      ["tool catalog ID", profile.toolCatalog.toolCatalogId],
      ["tool catalog version", profile.toolCatalog.toolCatalogVersion],
      ["runtime ID", profile.runtime.runtimeId],
      ["runtime version", profile.runtime.runtimeVersion],
      ["runtime adapter ID", profile.runtime.adapterId],
      ["runtime adapter version", profile.runtime.adapterVersion],
    ]) {
      assertIdentifier(value, label);
    }
    if (
      !["test_only_in_process", "attested_host_isolation"].includes(
        profile.executionBoundary,
      ) ||
      typeof profile.sampling.deterministic !== "boolean" ||
      typeof profile.sampling.seed !== "string" ||
      profile.sampling.seed.length === 0 ||
      !Number.isFinite(profile.sampling.temperature) ||
      profile.sampling.temperature < 0 ||
      profile.sampling.temperature > 2 ||
      !Number.isFinite(profile.sampling.topP) ||
      profile.sampling.topP <= 0 ||
      profile.sampling.topP > 1 ||
      !Number.isSafeInteger(profile.sampling.maxOutputTokens) ||
      profile.sampling.maxOutputTokens < 1 ||
      !Array.isArray(profile.toolCatalog.toolIds) ||
      new Set(profile.toolCatalog.toolIds).size !==
        profile.toolCatalog.toolIds.length
    ) {
      throw new ValidationError(
        "Execution profile has an invalid boundary, sampling, or tool configuration",
        { roleClass: profile.roleClass },
      );
    }
    profile.toolCatalog.toolIds.forEach((toolId) =>
      assertIdentifier(toolId, "tool ID"),
    );
    const expectedToolCatalogDigest = hashCanonical(
      "role-tool-catalog/v1",
      {
        toolCatalogId: profile.toolCatalog.toolCatalogId,
        toolCatalogVersion:
          profile.toolCatalog.toolCatalogVersion,
        toolIds: profile.toolCatalog.toolIds,
      },
    );
    const core = { ...deepCloneCanonical(profile) };
    delete core.executionProfileDigest;
    if (
      profile.toolCatalog.toolCatalogDigest !==
        expectedToolCatalogDigest ||
      profile.executionProfileDigest !==
        hashCanonical("role-execution-profile/v1", core)
    ) {
      throw new IntegrityError(
        "Execution profile is not self-verifying",
        { roleClass: profile.roleClass },
      );
    }
    rejectPlaceholders(profile);
    byRole.set(profile.roleClass, deepCloneCanonical(profile));
  }
  const actualRoles = [...byRole.keys()].sort();
  const expectedRoles = [...SEALED_EXECUTION_ROLE_CLASSES].sort();
  if (canonicalize(actualRoles) !== canonicalize(expectedRoles)) {
    throw new ValidationError(
      "Execution profiles do not cover the exact sealed role universe",
      { expectedRoles, actualRoles },
    );
  }
  return byRole;
}

function buildRolePlans(profileByRole) {
  return SEALED_EXECUTION_ROLE_CLASSES.map((roleClass) => {
    const promptPlan = {
      promptTemplateId: `${roleClass}:prompt-template-v1`,
      promptTemplateDigest: hashCanonical(
        "role-prompt-template/v1",
        {
          roleClass,
          prompt: ROLE_PROMPT_TEXT[roleClass],
        },
      ),
    };
    const projectionPlan = {
      projectionPolicyId: `${roleClass}:least-context-v1`,
      inputFieldNames: [...ROLE_PLAN_INPUTS[roleClass]],
      projectionPolicyDigest: hashCanonical(
        "role-projection-policy/v1",
        {
          roleClass,
          inputFieldNames: ROLE_PLAN_INPUTS[roleClass],
          comparativeArmContextIncluded: false,
        },
      ),
    };
    const workOrderPlan = {
      workOrderPolicyId: `${roleClass}:sealed-work-order-v1`,
      purpose: ROLE_PURPOSE[roleClass],
      contentOutputSchemaId: ROLE_OUTPUT_SCHEMA[roleClass],
      allowedTools: [
        ...profileByRole.get(roleClass).toolCatalog.toolIds,
      ],
      networkPolicy: "disabled",
      awarenessRequired: ROLE_AWARENESS[roleClass],
      budget: {
        maxInputBytes: 1_000_000,
        maxOutputBytes: 1_000_000,
        timeoutMs: 120_000,
      },
    };
    workOrderPlan.workOrderPolicyDigest = hashCanonical(
      "role-work-order-policy/v1",
      {
        roleClass,
        ...workOrderPlan,
      },
    );
    const core = {
      roleClass,
      promptPlan,
      projectionPlan,
      workOrderPlan,
      executionProfileDigest:
        profileByRole.get(roleClass).executionProfileDigest,
    };
    return {
      ...core,
      rolePlanDigest: hashCanonical(
        "sealed-role-execution-plan/v1",
        core,
      ),
    };
  });
}

export function executionConfigurationPlanRoot(
  executionConfigurationDigest,
) {
  assertDigest(
    executionConfigurationDigest,
    "execution configuration digest",
  );
  return hashCanonical("pre-execution-role-plan/v2", {
    executionConfigurationDigest,
  });
}

export function assertRoleInputMatchesExecutionPlan({
  executionConfiguration,
  roleClass,
  inputProjection,
}) {
  const rolePlan = executionConfiguration.rolePlans.find(
    (plan) => plan.roleClass === roleClass,
  );
  if (!rolePlan) {
    throw new IntegrityError(
      "Role dispatch has no preregistered execution plan",
      { roleClass },
    );
  }
  const actualFields = Object.keys(inputProjection).sort();
  const plannedFields = [
    ...rolePlan.projectionPlan.inputFieldNames,
  ].sort();
  if (canonicalize(actualFields) !== canonicalize(plannedFields)) {
    throw new IntegrityError(
      "Role input projection differs from its preregistered field plan",
      { roleClass, plannedFields, actualFields },
    );
  }
  return deepCloneCanonical(rolePlan);
}

export function buildExecutionConfiguration({
  campaignId,
  campaignSealDigest,
  assignmentMapDigest,
  stoppingExecutionPlanDigest,
  scenarioMaterialAuthorityEnvelopeDigest,
  scenarioMaterialBundleDigests,
  reviewerAllocationPlanDigest,
  familyAllocationRecordDigest,
  reviewerRegistrySnapshotDigest,
  reviewerFamilyBindingRoot,
  controlDeltaAuditDigest,
  controlAuditPolicyDigest,
  executionProfiles,
  packageManifest,
  generatedLock,
  candidateArms,
  schemaValidator,
}) {
  const profileByRole = validateExecutionProfiles(executionProfiles);
  const rolePlans = buildRolePlans(profileByRole);
  const orderedProfiles = SEALED_EXECUTION_ROLE_CLASSES.map(
    (roleClass) => profileByRole.get(roleClass),
  );
  const candidateAdapterBindings = candidateArms
    .map((arm) => ({
      armId: arm.armId,
      candidatePackageRoot: arm.candidatePackageRoot,
      candidateSnapshotDigest: arm.candidateSnapshotDigest,
      adapterDescriptorDigest: arm.adapterDescriptorDigest,
    }))
    .sort((left, right) =>
      Buffer.from(left.armId, "utf8").compare(
        Buffer.from(right.armId, "utf8"),
      ),
    );
  const core = {
    schemaVersion: "1.0.0",
    hashProfileId: HASH_PROFILE_ID,
    executionConfigurationId: `${campaignId}:execution-configuration`,
    campaignId,
    campaignSealDigest,
    assignmentMapDigest,
    stoppingExecutionPlanDigest,
    scenarioRoots: {
      authorityEnvelopeDigest:
        scenarioMaterialAuthorityEnvelopeDigest,
      materialBundleDigests: [
        ...scenarioMaterialBundleDigests,
      ].sort(),
    },
    reviewerRoots: {
      reviewerAllocationPlanDigest,
      familyAllocationRecordDigest,
      reviewerRegistrySnapshotDigest,
      reviewerFamilyBindingRoot,
    },
    controlRoots: {
      controlDeltaAuditDigest,
      controlAuditPolicyDigest,
    },
    promptPlanRoot: hashCanonical(
      "sealed-role-prompt-plan/v1",
      rolePlans.map(({ roleClass, promptPlan }) => ({
        roleClass,
        promptPlan,
      })),
    ),
    projectionPlanRoot: hashCanonical(
      "sealed-role-projection-plan/v1",
      rolePlans.map(({ roleClass, projectionPlan }) => ({
        roleClass,
        projectionPlan,
      })),
    ),
    workOrderPlanRoot: hashCanonical(
      "sealed-role-work-order-plan/v1",
      rolePlans.map(({ roleClass, workOrderPlan }) => ({
        roleClass,
        workOrderPlan,
      })),
    ),
    rolePlans,
    roleExecutionProfiles: orderedProfiles,
    roleExecutionProfileRoot: hashCanonical(
      "sealed-role-execution-profiles/v1",
      orderedProfiles,
    ),
    softwareRoots: {
      packageManifestRoot: hashCanonical(
        "package-manifest/v1",
        packageManifest,
      ),
      evaluatorPackagePayloadRoot: packageManifest.payloadRoot,
      compilerSourceRoot: generatedLock.sourceRoot,
      compilerImplementationRoot: generatedLock.compilerRoot,
      generatedProjectionRoot: generatedLock.generatedTargetRoot,
      subjectAdapterBindingRoot: hashCanonical(
        "subject-adapter-campaign-bindings/v1",
        candidateAdapterBindings,
      ),
    },
    immutable: true,
  };
  rejectPlaceholders(core);
  for (const [label, value] of [
    ["campaign seal digest", campaignSealDigest],
    ["assignment map digest", assignmentMapDigest],
    ["stopping execution plan digest", stoppingExecutionPlanDigest],
    [
      "scenario authority envelope digest",
      scenarioMaterialAuthorityEnvelopeDigest,
    ],
    ["reviewer allocation plan digest", reviewerAllocationPlanDigest],
    ["family allocation record digest", familyAllocationRecordDigest],
    ["reviewer registry snapshot digest", reviewerRegistrySnapshotDigest],
    ["reviewer family binding root", reviewerFamilyBindingRoot],
    ["control delta audit digest", controlDeltaAuditDigest],
    ["control audit policy digest", controlAuditPolicyDigest],
    ["package payload root", packageManifest.payloadRoot],
    ["compiler source root", generatedLock.sourceRoot],
    ["compiler implementation root", generatedLock.compilerRoot],
    ["generated projection root", generatedLock.generatedTargetRoot],
  ]) {
    assertDigest(value, label);
  }
  const executionConfiguration = {
    ...core,
    executionConfigurationDigest: hashCanonical(
      "sealed-execution-configuration/v1",
      core,
    ),
  };
  schemaValidator.assert(
    "execution-configuration",
    executionConfiguration,
  );
  return deepFreeze(executionConfiguration);
}

export function verifyExecutionConfiguration({
  value,
  schemaValidator,
}) {
  schemaValidator.assert("execution-configuration", value);
  const core = { ...deepCloneCanonical(value) };
  const observedDigest = core.executionConfigurationDigest;
  delete core.executionConfigurationDigest;
  if (
    observedDigest !==
    hashCanonical("sealed-execution-configuration/v1", core)
  ) {
    throw new IntegrityError(
      "Persisted execution configuration is not self-verifying",
    );
  }
  rejectPlaceholders(value);
  validateExecutionProfiles(value.roleExecutionProfiles);
  return deepFreeze(deepCloneCanonical(value));
}
