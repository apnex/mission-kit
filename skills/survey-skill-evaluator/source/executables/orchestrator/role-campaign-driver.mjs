import { mkdir, readdir } from "node:fs/promises";
import { dirname } from "node:path";
import {
  assertNoSymlinkAncestors,
  atomicCreateOnce,
  exists,
  readFileNoFollow,
  readJsonFile,
  resolveContained,
} from "../engine/atomic-fs.mjs";
import {
  canonicalBytes,
  canonicalize,
  deepCloneCanonical,
} from "../engine/canonical-json.mjs";
import {
  ConflictError,
  IntegrityError,
  ValidationError,
} from "../engine/errors.mjs";
import {
  HASH_PROFILE_ID,
  hashCanonical,
} from "../engine/hash.mjs";
import { LifecycleEngine } from "../engine/lifecycle-engine.mjs";
import {
  AuthorityReceiptVerifier,
  requestExternalAuthorityReceipts,
} from "../engine/authority-receipts.mjs";
import {
  IsolatedRoleRunner,
  buildRoleCapsule,
} from "../isolation/index.mjs";
import {
  sealAnalysisResult,
  sealControlDeltaAudit,
  sealRecommendation,
} from "../statistics/facades.mjs";
import {
  auditControlDelta,
} from "../statistics/controls.mjs";
import {
  createDeterministicRng,
  deterministicShuffle,
} from "../statistics/random.mjs";
import {
  attentionDecisionSurface,
  captureObservableEvidence,
  projectAttentionLedger,
  scoreDownstreamUtility,
  scoreNonInvention,
  scoreObligationRegistry,
} from "../evidence/index.mjs";
import { AwarenessLedger } from "./awareness.mjs";
import {
  analyzeCampaignAssignments,
} from "./campaign-analysis.mjs";
import {
  executeSurveySubjectAttempt,
} from "./subject-execution.mjs";
import {
  ScenarioMaterialAuthorityClient,
  scenarioMaterialPersonaBriefDigest,
  scenarioMaterialReviewDigest,
  scenarioMaterialRubricDigest,
  scenarioMaterialScenarioDigest,
  scenarioMaterialSemanticKeyDigest,
} from "./scenario-material-authority.mjs";
import {
  ReviewerAllocationAuthority,
} from "./reviewer-allocation-authority.mjs";
import {
  evaluateMechanicalConformance,
} from "./mechanical-conformance.mjs";
import {
  buildCampaignFailureEnvelope,
} from "./campaign-failure-envelope.mjs";
import {
  assertStoppingExecutionPlan,
  createStoppingExecutionPlan,
} from "./stopping-execution.mjs";
import {
  assertRoleInputMatchesExecutionPlan,
  buildExecutionConfiguration,
  executionConfigurationPlanRoot,
  verifyExecutionConfiguration,
} from "./execution-configuration.mjs";

export const SEALED_ROLE_CAMPAIGN_TRANSITIONS = Object.freeze([
  "EC01",
  "EC03a",
  "EC04",
  "EC05",
  "EC08",
  "EC09",
  "EC10",
  "EC12",
  "EC13",
  "EC32",
  "EC14",
  "EC15",
  "EC16",
  "EC17",
  "EC19",
  "EC35",
  "EC33",
  "EC20",
  "EC21",
  "EC22",
  "EC38",
  "EC23",
]);

const SEALED_ROLE_CAMPAIGN_TRANSITION_UNIVERSE = Object.freeze([
  ...SEALED_ROLE_CAMPAIGN_TRANSITIONS,
  "EC18",
]);

const ROLE_OUTPUT_KEYS = Object.freeze({
  "synthetic-director": ["sessionPlan"],
  "survey-executor": ["artifact", "metacognitiveResponse"],
  "downstream-consumer": ["utility", "metacognitiveResponse"],
  "semantic-judge": ["ballot", "metacognitiveResponse"],
  adjudicator: ["resolution", "metacognitiveResponse"],
});

const AWARENESS_ROLES = new Set([
  "survey-executor",
  "downstream-consumer",
  "semantic-judge",
  "adjudicator",
]);

const SEMANTIC_OBLIGATION_KIND = new Map([
  ["SEMANTIC_INTENT_ATOMS", "intent_atom"],
  ["SEMANTIC_CONSTRAINTS", "constraint"],
  ["SEMANTIC_PRIORITIES", "priority"],
  ["SEMANTIC_TENSIONS", "tension"],
  ["SEMANTIC_CORRECTION", "correction"],
  ["SEMANTIC_UNCERTAINTY", "uncertainty"],
  ["SEMANTIC_TRACEABILITY", "traceability"],
]);

const SEMANTIC_NATIVE_STATUS = Object.freeze({
  intent_atom: { 0: "absent", 0.5: "partial", 1: "preserved" },
  constraint: { 0: "fail", 0.5: "partial", 1: "pass" },
  priority: { 0: "inverted", 0.5: "unresolved", 1: "preserved" },
  tension: { 0: "collapsed", 0.5: "partial", 1: "retained" },
  correction: { 0: "ignored", 0.5: "ambiguous", 1: "superseded" },
  uncertainty: {
    0: "falsely_collapsed",
    0.5: "legitimately_resolved",
    1: "retained",
  },
  traceability: { 0: "unlinked", 0.5: "partial", 1: "linked" },
});

function stateName(record) {
  const semanticState = record.authoritativeStateCore.semanticState;
  return semanticState.state ?? semanticState.semantic?.state;
}

function compareUtf8(left, right) {
  return Buffer.from(left, "utf8").compare(Buffer.from(right, "utf8"));
}

function finiteMean(values) {
  const finite = values.filter(Number.isFinite);
  return finite.length === 0
    ? null
    : finite.reduce((sum, value) => sum + value, 0) /
        finite.length;
}

function selfSealed(tag, digestField, core) {
  return {
    ...core,
    [digestField]: hashCanonical(tag, core),
  };
}

function verifySelfSealed(tag, digestField, value, label) {
  const core = { ...value };
  const digest = core[digestField];
  delete core[digestField];
  if (
    typeof digest !== "string" ||
    hashCanonical(tag, core) !== digest
  ) {
    throw new IntegrityError(`${label} is not self-verifying`);
  }
  return value;
}

async function publishJson(root, relativePath, value, { mode = 0o640 } = {}) {
  const path = resolveContained(root, relativePath);
  await mkdir(dirname(path), { recursive: true, mode: 0o750 });
  await assertNoSymlinkAncestors(root, path);
  const outcome = await atomicCreateOnce(path, canonicalBytes(value), { mode });
  return { path, replayed: !outcome.created, value };
}

function assertObject(value, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new ValidationError(`${label} must be an object`);
  }
}

function assertExactKeys(value, expected, label) {
  assertObject(value, label);
  const actual = Object.keys(value).sort();
  const required = [...expected].sort();
  if (canonicalize(actual) !== canonicalize(required)) {
    throw new ValidationError(`${label} has an unauthorized field set`, {
      expected: required,
      actual,
    });
  }
}

function assertString(value, label) {
  if (typeof value !== "string" || value.length === 0) {
    throw new ValidationError(`${label} must be a non-empty string`);
  }
}

function validateMetacognitiveResponse(value) {
  assertExactKeys(
    value,
    ["perceivedCondition", "confidence", "rationale"],
    "metacognitive response",
  );
  assertString(value.perceivedCondition, "perceived condition");
  assertString(value.confidence, "awareness confidence");
  assertString(value.rationale, "awareness rationale");
}

function validateArtifact(artifact) {
  assertExactKeys(
    artifact,
    ["artifactId", "title", "sections"],
    "survey artifact",
  );
  assertString(artifact.artifactId, "artifact ID");
  assertString(artifact.title, "artifact title");
  if (!Array.isArray(artifact.sections)) {
    throw new ValidationError("Survey artifact sections must be an array");
  }
  const seen = new Set();
  for (const section of artifact.sections) {
    assertExactKeys(section, ["sectionId", "text"], "survey artifact section");
    assertString(section.sectionId, "section ID");
    assertString(section.text, "section text");
    if (seen.has(section.sectionId)) {
      throw new ValidationError("Survey artifact repeats a section ID");
    }
    seen.add(section.sectionId);
  }
}

function validateRoleContent(roleClass, content, workOrder, context) {
  const roleKeys = ROLE_OUTPUT_KEYS[roleClass];
  if (!roleKeys) {
    throw new ValidationError("No exact output contract exists for role", {
      roleClass,
    });
  }
  assertExactKeys(
    content,
    [
      "schemaVersion",
      "hashProfileId",
      "roleOutputClass",
      "workOrderId",
      "status",
      ...roleKeys,
    ],
    `${roleClass} output`,
  );
  if (
    content.schemaVersion !== "1.0.0" ||
    content.hashProfileId !== HASH_PROFILE_ID ||
    content.workOrderId !== workOrder.workOrderId ||
    content.status !== "completed"
  ) {
    throw new IntegrityError("Role output identity does not match its work order", {
      roleClass,
      workOrderId: workOrder.workOrderId,
    });
  }
  if (roleClass === "synthetic-director") {
    if (content.roleOutputClass !== "synthetic_director_session") {
      throw new ValidationError("Synthetic Director output class is invalid");
    }
    assertExactKeys(
      content.sessionPlan,
      ["prompt", "artifactContract"],
      "synthetic Director session plan",
    );
    assertString(content.sessionPlan.prompt, "Director prompt");
    if (
      !Array.isArray(content.sessionPlan.artifactContract) ||
      content.sessionPlan.artifactContract.some(
        (entry) => typeof entry !== "string" || entry.length === 0,
      )
    ) {
      throw new ValidationError("Director artifact contract is invalid");
    }
    return;
  }
  validateMetacognitiveResponse(content.metacognitiveResponse);
  if (roleClass === "survey-executor") {
    if (content.roleOutputClass !== "survey_execution") {
      throw new ValidationError("Survey executor output class is invalid");
    }
    validateArtifact(content.artifact);
    return;
  }
  if (roleClass === "downstream-consumer") {
    if (content.roleOutputClass !== "downstream_utility") {
      throw new ValidationError("Downstream output class is invalid");
    }
    assertExactKeys(
      content.utility,
      ["taskId", "taskCompleted", "findings"],
      "downstream utility",
    );
    assertString(content.utility.taskId, "downstream task ID");
    if (
      typeof content.utility.taskCompleted !== "boolean" ||
      !Array.isArray(content.utility.findings) ||
      content.utility.findings.some((entry) => typeof entry !== "string")
    ) {
      throw new ValidationError("Downstream utility result is invalid");
    }
    return;
  }
  if (roleClass === "semantic-judge") {
    if (content.roleOutputClass !== "semantic_judge_ballot") {
      throw new ValidationError("Judge output class is invalid");
    }
    assertExactKeys(
      content.ballot,
      ["ballotId", "scores", "overall", "rationale"],
      "semantic judge ballot",
    );
    assertString(content.ballot.ballotId, "ballot ID");
    assertString(content.ballot.rationale, "ballot rationale");
    const dimensionIds = context.rubric.dimensions
      .map((dimension) => dimension.dimensionId)
      .sort();
    assertExactKeys(content.ballot.scores, dimensionIds, "ballot scores");
    for (const score of Object.values(content.ballot.scores)) {
      if (score !== 0 && score !== 1) {
        throw new ValidationError(
          "Fixture semantic scores must be registered binary values",
        );
      }
    }
    const values = Object.values(content.ballot.scores);
    const expectedOverall =
      values.reduce((sum, value) => sum + value, 0) / values.length;
    if (content.ballot.overall !== expectedOverall) {
      throw new IntegrityError("Ballot overall does not derive from its scores");
    }
    return;
  }
  if (roleClass === "adjudicator") {
    if (content.roleOutputClass !== "semantic_adjudication") {
      throw new ValidationError("Adjudicator output class is invalid");
    }
    assertExactKeys(
      content.resolution,
      ["resolutionId", "items", "disagreementCount"],
      "semantic adjudication resolution",
    );
    assertString(content.resolution.resolutionId, "resolution ID");
    if (
      !Array.isArray(content.resolution.items) ||
      content.resolution.disagreementCount !== content.resolution.items.length
    ) {
      throw new ValidationError("Adjudication disagreement count is invalid");
    }
    const expectedDimensions = new Set(
      context.disagreementSet.map((entry) => entry.dimensionId),
    );
    for (const item of content.resolution.items) {
      assertExactKeys(
        item,
        [
          "dimensionId",
          "selectedScore",
          "sealedValues",
          "dissentPreserved",
        ],
        "adjudication item",
      );
      if (
        !expectedDimensions.delete(item.dimensionId) ||
        item.dissentPreserved !== true ||
        !Array.isArray(item.sealedValues) ||
        !item.sealedValues.includes(item.selectedScore) ||
        new Set(item.sealedValues).size < 2
      ) {
        throw new IntegrityError(
          "Adjudication must select only a sealed value and preserve dissent",
        );
      }
    }
    if (expectedDimensions.size > 0) {
      throw new IntegrityError("Adjudication omitted a registered disagreement");
    }
  }
}

async function controlAuditView(workspaceRoot, arm, binding) {
  const snapshotPath = resolveContained(workspaceRoot, arm.snapshotRef);
  const snapshot = await readJsonFile(snapshotPath);
  const payloadRoot = resolveContained(
    dirname(snapshotPath),
    snapshot.snapshotLayout.payloadDirectory,
  );
  const payloadEntries = [];
  for (const entry of snapshot.entries) {
    const bytes = await readFileNoFollow(
      resolveContained(payloadRoot, ...entry.path.split("/")),
    );
    payloadEntries.push({
      path: entry.path,
      mode: entry.mode,
      rawFileSha256: entry.rawFileSha256,
      utf8Text: bytes.toString("utf8"),
    });
  }
  return {
    armId: arm.armId,
    conditionClass: arm.conditionClass,
    environmentDigest: arm.environmentDigest,
    candidateSnapshotId: binding.candidateSnapshotId,
    candidateSnapshotDigest: binding.candidateSnapshotDigest,
    candidatePackageRoot: binding.candidatePackageRoot,
    adapterId: binding.adapterId,
    adapterInterfaceVersion: binding.adapterInterfaceVersion,
    subjectProtocolVersion: binding.subjectProtocolVersion,
    compiledProjectionRoots: binding.compiledProjectionRoots,
    payloadEntries,
  };
}

async function buildControlAudit({
  campaignId,
  workspaceRoot,
  input,
  seal,
}) {
  const policy = seal.controlAuditPolicy;
  const inputArms = new Map(input.arms.map((arm) => [arm.armId, arm]));
  const sealedArms = new Map(
    seal.candidateArms.map((arm) => [arm.armId, arm]),
  );
  const treatmentArm = inputArms.get(policy.treatmentArmId);
  const controlArm = inputArms.get(policy.controlArmId);
  const treatmentBinding = sealedArms.get(policy.treatmentArmId);
  const controlBinding = sealedArms.get(policy.controlArmId);
  if (
    !treatmentArm ||
    !controlArm ||
    !treatmentBinding ||
    !controlBinding
  ) {
    throw new IntegrityError(
      "Sealed control-audit policy references an unavailable arm",
    );
  }
  const treatment = await controlAuditView(
    workspaceRoot,
    treatmentArm,
    treatmentBinding,
  );
  const control = await controlAuditView(
    workspaceRoot,
    controlArm,
    controlBinding,
  );
  const result = auditControlDelta({
    treatment,
    control,
    allowedDifferencePaths: policy.allowedDifferencePaths,
    forbiddenDoctrineTerms: policy.forbiddenDoctrineTerms,
    manipulationChecks: [
      {
        checkId: "candidate-package-root-differs",
        evaluate(left, right) {
          return left.candidatePackageRoot !== right.candidatePackageRoot;
        },
      },
    ],
  });
  const explicitForbidden = result.differencePaths.filter((path) =>
    policy.forbiddenDifferencePaths.some(
      (forbidden) =>
        path === forbidden ||
        path.startsWith(`${forbidden}.`) ||
        path.startsWith(`${forbidden}[`),
    )
  );
  const forbiddenDifferencePaths = [
    ...new Set([...result.forbiddenDifferences, ...explicitForbidden]),
  ].sort(compareUtf8);
  return sealControlDeltaAudit({
    schemaVersion: "1.0.0",
    hashProfileId: HASH_PROFILE_ID,
    controlDeltaAuditId: `${campaignId}:pre-execution-control-audit`,
    treatmentSnapshotDigest: treatmentBinding.candidateSnapshotDigest,
    controlSnapshotDigest: controlBinding.candidateSnapshotDigest,
    manipulatedMechanismId: policy.manipulatedMechanismId,
    allowedDifferencePaths: [...policy.allowedDifferencePaths],
    observedDifferencePaths: [...result.differencePaths].sort(compareUtf8),
    forbiddenDifferencePaths,
    forbiddenDoctrineTerms: [...policy.forbiddenDoctrineTerms],
    doctrineLeakTerms: [...result.doctrineLeaks],
    commonContractDigest: hashCanonical(
      "campaign-control-common-contract/v1",
      {
        environmentDigests: [
          treatment.environmentDigest,
          control.environmentDigest,
        ],
        adapterIds: [treatment.adapterId, control.adapterId],
        adapterInterfaceVersions: [
          treatment.adapterInterfaceVersion,
          control.adapterInterfaceVersion,
        ],
        subjectProtocolVersions: [
          treatment.subjectProtocolVersion,
          control.subjectProtocolVersion,
        ],
      },
    ),
    manipulationChecks: result.manipulationResults.map((check) => ({
      checkId: check.checkId,
      passed: check.passed,
      evidenceRefs: [
        treatmentBinding.candidateSnapshotDigest,
        controlBinding.candidateSnapshotDigest,
      ],
    })),
    expectedDirectionVisibleToAuditor: false,
    passed:
      forbiddenDifferencePaths.length === 0 &&
      result.doctrineLeaks.length === 0 &&
      result.manipulationResults.every((check) => check.passed),
  });
}

function protectedAssignments(
  campaignId,
  input,
  sealDigest,
  candidateArms,
  stoppingExecutionPlan,
  dependencePlan,
) {
  const byArmId = new Map(candidateArms.map((entry) => [entry.armId, entry]));
  const strata =
    input.population.strata.length === 0
      ? [{ stratumId: "all", weight: 1 }]
      : [...input.population.strata].sort((left, right) =>
          compareUtf8(left.stratumId, right.stratumId)
        );
  const arms = [...input.arms].sort((left, right) =>
    compareUtf8(left.armId, right.armId)
  );
  const scenarioRefs = [...input.scenarioRefs].sort(compareUtf8);
  const assignments = [];
  const assignmentFactor = dependencePlan.factors.find(
    (factor) =>
      factor.assignmentMechanism ===
      "within_block_permutation",
  );
  if (
    dependencePlan.assignmentBased !== true ||
    dependencePlan.resamplingMethod !==
      "assignment_randomization" ||
    dependencePlan.resamplerId !==
      "sealed_assignment_randomization_v1" ||
    !assignmentFactor
  ) {
    throw new ValidationError(
      "Protected assignment construction has no implemented randomization mechanism",
      {
        assignmentBased: dependencePlan.assignmentBased,
        resamplingMethod: dependencePlan.resamplingMethod,
        resamplerId: dependencePlan.resamplerId,
        assignmentMechanisms: dependencePlan.factors.map(
          (factor) => factor.assignmentMechanism,
        ),
      },
    );
  }
  const randomizedBlocks = [];
  for (const scenarioRef of scenarioRefs) {
    for (const stratum of strata) {
      for (
        let sampleOrdinal = 1;
        sampleOrdinal <=
          stoppingExecutionPlan.maximumAssignmentsPerCell;
        sampleOrdinal += 1
      ) {
        const blockId = `block-${hashCanonical("assignment-block/v1", {
          campaignId,
          scenarioRef,
          stratumId: stratum.stratumId,
          sampleOrdinal,
          sealDigest,
        }).slice(0, 20)}`;
        const randomizedArms = deterministicShuffle(
          arms,
          createDeterministicRng({
            algorithm: "splitmix64-fisher-yates-v1",
            campaignId,
            sealDigest,
            seedCommitmentDigest:
              dependencePlan.seedCommitmentDigest,
            blockId,
          }),
        );
        randomizedBlocks.push({
          blockId,
          armOrder: randomizedArms.map((arm) => arm.armId),
        });
        for (
          let slotOrdinal = 1;
          slotOrdinal <= randomizedArms.length;
          slotOrdinal += 1
        ) {
          const arm = randomizedArms[slotOrdinal - 1];
          const candidate = byArmId.get(arm.armId);
          if (!candidate) {
            throw new IntegrityError(
              "Protected assignment has no sealed candidate snapshot",
              { armId: arm.armId },
            );
          }
          const ordinal = assignments.length + 1;
          assignments.push({
            assignmentId:
              `assignment-${String(ordinal).padStart(6, "0")}`,
            opaqueSubjectId: `subject-${hashCanonical("opaque-subject/v1", {
              campaignId,
              scenarioRef,
              stratumId: stratum.stratumId,
              sampleOrdinal,
              slotOrdinal,
              sealDigest,
            }).slice(0, 20)}`,
            armId: arm.armId,
            scenarioRef,
            stratumId: stratum.stratumId,
            sampleOrdinal,
            blockId,
            cellId:
              `${scenarioRef}:${stratum.stratumId}:${arm.armId}`,
            packageRef: candidate.candidateSnapshotDigest,
            snapshotRef: candidate.snapshotRef,
          });
        }
      }
    }
  }
  const core = {
    schemaVersion: "1.0.0",
    hashProfileId: HASH_PROFILE_ID,
    campaignId,
    sealDigest,
    stoppingRuleSemanticDigest:
      stoppingExecutionPlan.stoppingRuleSemanticDigest,
    randomization: {
      assignmentMechanism: "within_block_permutation",
      algorithm: "splitmix64-fisher-yates-v1",
      resamplerId: dependencePlan.resamplerId,
      seedCommitmentDigest:
        dependencePlan.seedCommitmentDigest,
      blockPermutationDigest: hashCanonical(
        "protected-assignment-block-permutations/v1",
        randomizedBlocks,
      ),
      outcomeVisibleAtAssignment: false,
    },
    assignments,
    immutable: true,
  };
  return selfSealed(
    "protected-assignment-map/v1",
    "assignmentMapDigest",
    core,
  );
}

function roleWorkOrder({
  campaignId,
  sealDigest,
  executionConfigurationDigest,
  assignmentRef,
  roleClass,
  workOrderId,
  inputProjection,
  awarenessRequired,
  allowedTools,
  networkPolicy,
}) {
  const core = {
    schemaVersion: "1.0.0",
    hashProfileId: HASH_PROFILE_ID,
    workOrderId,
    campaignId,
    assignmentRef,
    roleClass,
    parentSealDigest: sealDigest,
    executionConfigurationDigest,
    inputProjectionDigest: hashCanonical(
      "role-input-projection/v1",
      inputProjection,
    ),
    allowedTools: [...allowedTools],
    networkPolicy,
    awarenessRequired,
    status: "sealed",
    immutable: true,
  };
  return selfSealed("sealed-role-work-order/v1", "workOrderDigest", core);
}

function verifyRoleEvidence(record, workOrder, capsule) {
  verifySelfSealed(
    "sealed-role-evidence/v1",
    "roleEvidenceDigest",
    record,
    "Role evidence",
  );
  if (
    record.workOrderDigest !== workOrder.workOrderDigest ||
    record.capsuleDigest !== capsule.capsuleDigest ||
    record.contentDigest !==
      hashCanonical("role-result-content/v1", record.content) ||
    canonicalBytes(record.content).compare(
      canonicalBytes(record.roleResult?.content),
    ) !== 0
  ) {
    throw new IntegrityError("Role evidence is not bound to its sealed inputs");
  }
  const roleResultCore = { ...record.roleResult };
  const roleResultDigest = roleResultCore.resultDigest;
  delete roleResultCore.resultDigest;
  if (
    typeof roleResultDigest !== "string" ||
    roleResultDigest !== record.roleResultDigest ||
    hashCanonical("role-result/v1", roleResultCore) !== roleResultDigest
  ) {
    throw new IntegrityError(
      "Role evidence does not retain the exact isolated role result",
    );
  }
  const expectedObservableCapture = roleObservableCapture({
    workOrder,
    capsule,
    result: record.roleResult,
  });
  if (
    canonicalBytes(record.observableCapture).compare(
      canonicalBytes(expectedObservableCapture),
    ) !== 0 ||
    record.observableCaptureDigest !==
      expectedObservableCapture.captureDigest
  ) {
    throw new IntegrityError(
      "Role evidence does not retain its complete observable capture",
    );
  }
  return record;
}

async function admitPersistedRoleExecutionCut({
  workspaceRoot,
  campaignId,
  sealDigest,
  executionConfigurationDigest,
  assignmentIds,
}) {
  const assignmentUniverse = new Set(assignmentIds);
  const workOrdersDirectory = resolveContained(
    workspaceRoot,
    "evidence",
    "work-orders",
  );
  const workOrders = new Map();
  if (await exists(workOrdersDirectory, { authorityRoot: workspaceRoot })) {
    await assertNoSymlinkAncestors(
      workspaceRoot,
      workOrdersDirectory,
    );
    const entries = await readdir(workOrdersDirectory, {
      withFileTypes: true,
    });
    entries.sort((left, right) =>
      compareUtf8(left.name, right.name)
    );
    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      if (!entry.isFile() || !entry.name.endsWith(".json")) {
        throw new IntegrityError(
          "Persisted role work-order cut contains a non-evidence entry",
          { entry: entry.name },
        );
      }
      const workOrderId = entry.name.slice(0, -".json".length);
      const workOrder = verifySelfSealed(
        "sealed-role-work-order/v1",
        "workOrderDigest",
        await readJsonFile(
          resolveContained(
            workspaceRoot,
            "evidence",
            "work-orders",
            entry.name,
          ),
          { authorityRoot: workspaceRoot },
        ),
        "Failure closer persisted role work order",
      );
      assertExactKeys(
        workOrder,
        [
          "schemaVersion",
          "hashProfileId",
          "workOrderId",
          "campaignId",
          "assignmentRef",
          "roleClass",
          "parentSealDigest",
          "executionConfigurationDigest",
          "inputProjectionDigest",
          "allowedTools",
          "networkPolicy",
          "awarenessRequired",
          "status",
          "immutable",
          "workOrderDigest",
        ],
        "persisted role work order",
      );
      if (
        workOrder.workOrderId !== workOrderId ||
        workOrder.campaignId !== campaignId ||
        workOrder.parentSealDigest !== sealDigest ||
        workOrder.executionConfigurationDigest !==
          executionConfigurationDigest ||
        !assignmentUniverse.has(workOrder.assignmentRef) ||
        workOrder.hashProfileId !== HASH_PROFILE_ID ||
        workOrder.status !== "sealed" ||
        workOrder.immutable !== true
      ) {
        throw new IntegrityError(
          "Persisted role work order is outside the sealed campaign cut",
          { workOrderId },
        );
      }
      if (workOrders.has(workOrderId)) {
        throw new IntegrityError(
          "Persisted role work-order cut contains a duplicate identity",
          { workOrderId },
        );
      }
      const capsulePath = resolveContained(
        workspaceRoot,
        "evidence",
        "capsules",
        `${workOrderId}.json`,
      );
      if (!(await exists(capsulePath, { authorityRoot: workspaceRoot }))) {
        throw new IntegrityError(
          "Persisted role work order has no matching capsule",
          { workOrderId },
        );
      }
      const capsule = verifySelfSealed(
        "role-capsule/v1",
        "capsuleDigest",
        await readJsonFile(capsulePath, {
          authorityRoot: workspaceRoot,
        }),
        "Failure closer persisted role capsule",
      );
      if (
        capsule.workOrderId !== workOrderId ||
        capsule.roleClass !== workOrder.roleClass ||
        capsule.inputProjectionDigest !==
          workOrder.inputProjectionDigest ||
        capsule.executionConfigurationDigest !==
          executionConfigurationDigest ||
        capsule.parentGrant?.workOrderDigest !==
          workOrder.workOrderDigest ||
        capsule.parentGrant?.parentSealDigest !== sealDigest ||
        capsule.parentGrant?.executionConfigurationDigest !==
          executionConfigurationDigest
      ) {
        throw new IntegrityError(
          "Persisted role capsule changed its sealed work-order binding",
          { workOrderId },
        );
      }
      workOrders.set(workOrderId, { workOrder, capsule });
    }
  }

  const rolesDirectory = resolveContained(
    workspaceRoot,
    "evidence",
    "roles",
  );
  const roleEvidence = [];
  if (await exists(rolesDirectory, { authorityRoot: workspaceRoot })) {
    await assertNoSymlinkAncestors(workspaceRoot, rolesDirectory);
    const entries = await readdir(rolesDirectory, {
      withFileTypes: true,
    });
    entries.sort((left, right) =>
      compareUtf8(left.name, right.name)
    );
    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      if (!entry.isFile() || !entry.name.endsWith(".json")) {
        throw new IntegrityError(
          "Persisted role-evidence cut contains a non-evidence entry",
          { entry: entry.name },
        );
      }
      const workOrderId = entry.name.slice(0, -".json".length);
      const sealedInputs = workOrders.get(workOrderId);
      if (!sealedInputs) {
        throw new IntegrityError(
          "Persisted role evidence has no admitted work-order and capsule pair",
          { workOrderId },
        );
      }
      const record = await readJsonFile(
        resolveContained(
          workspaceRoot,
          "evidence",
          "roles",
          entry.name,
        ),
        { authorityRoot: workspaceRoot },
      );
      assertExactKeys(
        record,
        [
          "schemaVersion",
          "hashProfileId",
          "roleEvidenceId",
          "campaignId",
          "assignmentRef",
          "roleClass",
          "workOrderId",
          "workOrderDigest",
          "capsuleDigest",
          "inputProjectionDigest",
          "content",
          "contentDigest",
          "roleResult",
          "roleResultDigest",
          "observableCapture",
          "observableCaptureDigest",
          "executionBoundary",
          "productionEligible",
          "hostIsolationAttestationDigest",
          "fixtureOnly",
          "immutable",
          "roleEvidenceDigest",
        ],
        "persisted role evidence",
      );
      verifyRoleEvidence(
        record,
        sealedInputs.workOrder,
        sealedInputs.capsule,
      );
      if (
        record.roleEvidenceId !== `${workOrderId}:evidence` ||
        record.workOrderId !== workOrderId ||
        record.campaignId !== campaignId ||
        record.assignmentRef !==
          sealedInputs.workOrder.assignmentRef ||
        record.roleClass !== sealedInputs.workOrder.roleClass ||
        record.hashProfileId !== HASH_PROFILE_ID ||
        record.immutable !== true ||
        record.content?.status !== "completed" ||
        record.executionBoundary !==
          record.roleResult.executionBoundary ||
        record.productionEligible !==
          record.roleResult.visibility?.productionEligible ||
        record.hostIsolationAttestationDigest !==
          hashCanonical(
            "host-isolation-attestation/v1",
            record.roleResult.hostIsolationAttestation,
          ) ||
        record.roleResult.hostIsolationAttestation
          ?.executionConfigurationDigest !==
          executionConfigurationDigest ||
        canonicalize(
          record.observableCapture.sections?.inputs?.value
            ?.workOrder,
        ) !==
          canonicalize(sealedInputs.workOrder) ||
        canonicalize(
          record.observableCapture.sections?.inputs?.value
            ?.capsule,
        ) !==
          canonicalize(sealedInputs.capsule)
      ) {
        throw new IntegrityError(
          "Persisted role evidence changed its sealed execution identity",
          { workOrderId },
        );
      }
      roleEvidence.push(record);
    }
  }
  const evidenceIds = new Set(
    roleEvidence.map((record) => record.workOrderId),
  );
  if (evidenceIds.size !== roleEvidence.length) {
    throw new IntegrityError(
      "Persisted role-evidence cut contains duplicate work-order identities",
    );
  }
  return {
    workOrders: [...workOrders.values()].map(
      ({ workOrder }) => workOrder,
    ),
    roleEvidence,
  };
}

function buildFailureStagePopulationViews({
  campaignId,
  assignmentIds,
  subjectEvidenceByAssignment,
  persistedRoleCut,
}) {
  const assignmentUniverse = new Set(assignmentIds);
  const assignmentsForRole = (records, roleClass) =>
    new Set(
      records
        .filter(
          (record) =>
            record.roleClass === roleClass &&
            assignmentUniverse.has(record.assignmentRef),
        )
        .map((record) => record.assignmentRef),
    );
  const evidenceForRole = (roleClass) =>
    assignmentsForRole(
      persistedRoleCut.roleEvidence,
      roleClass,
    );
  const attemptsForRole = (roleClass) =>
    assignmentsForRole(
      persistedRoleCut.workOrders,
      roleClass,
    );
  const completedSubjects = new Set(
    [...subjectEvidenceByAssignment.entries()]
      .filter(([, subject]) => subject.outcomeClass === "completed")
      .map(([assignmentId]) => assignmentId),
  );
  const surveyExecutions = evidenceForRole("survey-executor");
  const surveyAllAssignedObserved = new Set(
    subjectEvidenceByAssignment.keys(),
  );
  const surveyInstrumentObserved = new Set(
    [...completedSubjects].filter((assignmentId) =>
      surveyExecutions.has(assignmentId)
    ),
  );
  const surveyFailures = new Set(
    [...subjectEvidenceByAssignment.entries()]
      .filter(([, subject]) => subject.outcomeClass !== "completed")
      .map(([assignmentId]) => assignmentId),
  );
  for (const roleClass of [
    "synthetic-director",
    "survey-executor",
  ]) {
    const observed = evidenceForRole(roleClass);
    for (const assignmentId of attemptsForRole(roleClass)) {
      if (!observed.has(assignmentId)) {
        surveyFailures.add(assignmentId);
      }
    }
  }

  const downstreamObserved = evidenceForRole(
    "downstream-consumer",
  );
  const downstreamFailures = new Set();
  for (const assignmentId of attemptsForRole(
    "downstream-consumer",
  )) {
    if (!downstreamObserved.has(assignmentId)) {
      downstreamFailures.add(assignmentId);
    }
  }

  const stageFacts = new Map([
    [
      "survey",
      {
        allAssignedObserved: surveyAllAssignedObserved,
        instrumentValidObserved: surveyInstrumentObserved,
        failures: surveyFailures,
      },
    ],
    [
      "downstream",
      {
        allAssignedObserved: downstreamObserved,
        instrumentValidObserved: downstreamObserved,
        failures: downstreamFailures,
      },
    ],
  ]);
  return ["survey", "downstream"].flatMap((stage) => {
    const facts = stageFacts.get(stage);
    return [
      ["all_assigned", facts.allAssignedObserved],
      ["instrument_valid", facts.instrumentValidObserved],
      ["release_eligible", new Set()],
    ].map(([populationClass, observed]) => {
      const observedIds = [...observed].sort(compareUtf8);
      const failureIds = [...facts.failures].sort(compareUtf8);
      return {
        stage,
        populationClass,
        assignmentCount: assignmentIds.length,
        observedCount: observedIds.length,
        missingCount: assignmentIds.length - observedIds.length,
        failureCount: failureIds.length,
        contaminationCount: 0,
        denominatorDigest: hashCanonical(
          "campaign-failure-stage-population/v1",
          {
            campaignId,
            stage,
            populationClass,
            assignmentIds,
            observedIds,
            failureIds,
            releaseStatus:
              populationClass === "release_eligible"
                ? "inadmissible_failed_campaign"
                : "not_applicable",
          },
        ),
      };
    });
  });
}

function roleObservableCapture({ workOrder, capsule, result }) {
  const host = deepCloneCanonical(
    result.hostIsolationAttestation,
  );
  const reported = (field) =>
    Object.hasOwn(host, field)
      ? {
          availability: "reported_by_host",
          value: deepCloneCanonical(host[field]),
        }
      : {
          availability: "not_reported_by_host",
          value: null,
        };
  return captureObservableEvidence({
    captureId: `${workOrder.workOrderId}:observable-capture`,
    inputs: {
      workOrder: deepCloneCanonical(workOrder),
      capsule: deepCloneCanonical(capsule),
    },
    outputs: {
      content: deepCloneCanonical(result.content),
      contentDigest: result.contentDigest,
      roleResultDigest: result.resultDigest,
    },
    sessionState: {
      invocationId: result.invocationId,
      startedAtMs: result.startedAtMs,
      finishedAtMs: result.finishedAtMs,
      workspace: result.workspace,
      executionBoundary: result.executionBoundary,
      visibility: deepCloneCanonical(result.visibility),
    },
    toolActions: deepCloneCanonical(result.toolEvidence),
    telemetry: {
      modelConfiguration: reported("modelConfiguration"),
      samplingConfiguration: reported(
        "samplingConfiguration",
      ),
      resourceUsage: reported("resourceUsage"),
      providerTelemetry: reported("telemetry"),
      timing: {
        startedAtMs: result.startedAtMs,
        finishedAtMs: result.finishedAtMs,
        elapsedMs: result.finishedAtMs - result.startedAtMs,
      },
    },
    failures: {
      observedFailure: false,
      records: [],
    },
    provenance: {
      workOrderDigest: workOrder.workOrderDigest,
      capsuleDigest: capsule.capsuleDigest,
      roleResultDigest: result.resultDigest,
      hostIsolationAttestation: host,
      hostIsolationAttestationDigest: hashCanonical(
        "host-isolation-attestation/v1",
        host,
      ),
    },
  });
}

function roleEvidenceRecord({
  campaignId,
  assignmentRef,
  workOrder,
  capsule,
  result,
  fixtureOnly,
}) {
  const observableCapture = roleObservableCapture({
    workOrder,
    capsule,
    result,
  });
  const core = {
    schemaVersion: "1.0.0",
    hashProfileId: HASH_PROFILE_ID,
    roleEvidenceId: `${workOrder.workOrderId}:evidence`,
    campaignId,
    assignmentRef,
    roleClass: workOrder.roleClass,
    workOrderId: workOrder.workOrderId,
    workOrderDigest: workOrder.workOrderDigest,
    capsuleDigest: capsule.capsuleDigest,
    inputProjectionDigest: capsule.inputProjectionDigest,
    content: result.content,
    contentDigest: result.contentDigest,
    roleResult: deepCloneCanonical(result),
    roleResultDigest: result.resultDigest,
    observableCapture,
    observableCaptureDigest: observableCapture.captureDigest,
    executionBoundary: result.executionBoundary,
    productionEligible: result.visibility.productionEligible,
    hostIsolationAttestationDigest: hashCanonical(
      "host-isolation-attestation/v1",
      result.hostIsolationAttestation,
    ),
    fixtureOnly,
    immutable: true,
  };
  return selfSealed(
    "sealed-role-evidence/v1",
    "roleEvidenceDigest",
    core,
  );
}

function makeEnvelope({
  campaignId,
  sealDigest,
  revision,
  assignments,
  roleEvidence,
  subjectEvidence,
  awarenessRows,
  assignmentMapDigest,
  governanceEvidenceRoots,
  fixtureOnly,
}) {
  const root = (tag, value) =>
    hashCanonical(tag, {
      campaignId,
      sealDigest,
      ...value,
    });
  const roleRoots = roleEvidence
    .map((record) => record.roleEvidenceDigest)
    .sort();
  const subjectRoots = subjectEvidence
    .map((record) => record.subjectExecutionDigest)
    .sort();
  const obligations = awarenessRows
    .map((row) => ({
      obligationId: row.obligationId,
      awarenessStateRoot: row.awarenessStateRoot,
      disposition: row.disposition.kind,
    }))
    .sort((left, right) =>
      compareUtf8(left.obligationId, right.obligationId),
    );
  return {
    schemaVersion: "1.0.0",
    hashProfileId: HASH_PROFILE_ID,
    campaignEvidenceEnvelopeId: `${campaignId}:role-envelope`,
    campaignId,
    frozenAtCampaignRevision: revision,
    frozenBeforeTransition: "EC20",
    allAssignedPopulationRoot: root("all-assigned-population/v1", {
      assignmentRefs: assignments.map((entry) => entry.assignmentId),
    }),
    instrumentValidPopulationRoot: root("instrument-valid-population/v1", {
      assignmentRefs: assignments.map((entry) => entry.assignmentId),
    }),
    releaseQualifiedPopulationRoot: root(
      "release-qualified-population/v1",
      { assignmentRefs: [] },
    ),
    roleContentEvidenceRoot: root("role-content-evidence/v1", {
      roleRoots,
      subjectRoots,
    }),
    evidenceRefs: [
      ...new Set([
        ...roleRoots,
        ...subjectRoots,
        ...governanceEvidenceRoots,
      ]),
    ].sort(compareUtf8),
    awarenessUniverseRoot: hashCanonical("awareness-universe/v1", obligations),
    closedAwarenessLedgerRoot: hashCanonical(
      "closed-awareness-ledger/v1",
      obligations,
    ),
    awarenessDispositionCounts: {
      reported: obligations.length,
      missingAfterContent: 0,
      missingNoContent: 0,
      notApplicable: 0,
    },
    qualificationViewRoots: [
      root("qualification-view/v1", { view: "all_assigned" }),
      root("qualification-view/v1", { view: "instrument_valid" }),
      root("qualification-view/v1", { view: "release_qualified" }),
    ],
    protectedSourceIndexRoot: root("protected-source-index/v1", {
      assignmentMapDigest,
      governanceEvidenceRoots:
        [...governanceEvidenceRoots].sort(compareUtf8),
    }),
    derivationRoots:
      [...governanceEvidenceRoots].sort(compareUtf8),
    disclosurePolicyDigest: root("disclosure-policy/v1", {
      fixtureOnly,
      promotionBoundary: "external_only",
    }),
    disclosureRecipeDigest: root("disclosure-recipe/v1", {
      source: "sealed_role_evidence",
    }),
    disclosureSourceFieldMapDigest: root("disclosure-field-map/v1", {
      protectedFields: ["armId", "packageRef", "snapshotRef"],
    }),
    immutable: true,
    containsProtectedUnmaskGrant: false,
    containsDisclosureOutputDigest: false,
    containsFutureTransitionReference: false,
  };
}

function scoreSemanticDimension({
  assignmentId,
  dimension,
  resolvedValue,
  evidenceCitations,
}) {
  if (dimension.dimensionId === "SEMANTIC_NON_INVENTION") {
    const denominator =
      Math.max(1, dimension.obligationIds.length);
    const result = scoreNonInvention({
      unsupportedMaterialClaims: resolvedValue,
      fixedExposureDenominator: denominator,
      evidenceCitations,
    });
    return {
      metricOutcome: {
        status: "observed",
        value: result.unsupportedClaimRate,
      },
      scoringResult: {
        metricId: dimension.dimensionId,
        scoringClass: "fixed_exposure_non_invention",
        result,
        scoringResultDigest: hashCanonical(
          "non-invention-scoring-result/v1",
          result,
        ),
      },
    };
  }
  const kind = SEMANTIC_OBLIGATION_KIND.get(
    dimension.dimensionId,
  );
  const status = SEMANTIC_NATIVE_STATUS[kind]?.[
    String(resolvedValue)
  ];
  if (!kind || !status) {
    throw new ValidationError(
      "Scenario rubric dimension has no registered native semantic scoring recipe",
      {
        assignmentId,
        dimensionId: dimension.dimensionId,
        resolvedValue,
      },
    );
  }
  const obligations = dimension.obligationIds.map(
    (obligationId) => ({
      obligationId,
      kind,
      required: true,
      weight: dimension.weight,
    }),
  );
  const findings = obligations.map((obligation) => ({
    obligationId: obligation.obligationId,
    status,
    evidenceCitations,
  }));
  const result = scoreObligationRegistry({
    registryId:
      `${assignmentId}:${dimension.dimensionId}`,
    obligations,
    findings,
    missingRule: dimension.missingRule,
  });
  return {
    metricOutcome: {
      status:
        result.normalizedSummary === null
          ? "not_judgeable"
          : "observed",
      value: result.normalizedSummary,
    },
    scoringResult: {
      metricId: dimension.dimensionId,
      scoringClass: "fixed_obligation_registry",
      result,
      scoringResultDigest: result.scoringResultDigest,
    },
  };
}

function conformanceMetricOutcomes({
  assignmentId,
  mechanicalConformance,
}) {
  const checksByMetric = new Map([
    ["CONFORMANCE_PROTOCOL", ["subject_terminal_protocol"]],
    [
      "CONFORMANCE_ARTIFACT",
      ["observable_capture_complete"],
    ],
    ["CONFORMANCE_ISOLATION", ["role_isolation_attested"]],
    [
      "CONFORMANCE_EXECUTION",
      [
        "subject_terminal_protocol",
        "observable_capture_complete",
        "role_isolation_attested",
      ],
    ],
  ]);
  const outcomes = {};
  for (const [
    metricId,
    checkIds,
  ] of checksByMetric) {
    const observations =
      mechanicalConformance.observations.filter(
        (observation) =>
          observation.sourceObjectId === assignmentId &&
          checkIds.includes(observation.checkId),
      );
    if (
      observations.length !== checkIds.length ||
      observations.some(
        (observation) =>
          observation.result === "not_observable",
      )
    ) {
      outcomes[metricId] = {
        status: "not_observed",
        value: null,
      };
      continue;
    }
    const failureRate =
      observations.filter(
        (observation) => observation.result === "fail",
      ).length / observations.length;
    outcomes[metricId] = {
      status: "observed",
      value:
        metricId === "CONFORMANCE_EXECUTION"
          ? failureRate
          : 1 - failureRate,
    };
  }
  for (const metricId of [
    "CONFORMANCE_DISCLOSURE",
    "CONFORMANCE_AUTHORITY",
    "CONFORMANCE_STATE_RESUME",
  ]) {
    outcomes[metricId] = {
      status: "not_observed",
      value: null,
    };
  }
  return outcomes;
}

function buildAttentionEvidence({
  campaignId,
  roleEvidence,
}) {
  const observations = roleEvidence.map((record) => {
    const elapsedMs =
      record.observableCapture.sections.telemetry.value
        .timing.elapsedMs;
    const base = {
      sourceEventDigest: record.observableCaptureDigest,
      nativeMeasure: elapsedMs,
      nativeUnit: "milliseconds",
      evidenceRefs: [record.roleEvidenceDigest],
    };
    if (record.roleClass === "synthetic-director") {
      return {
        ...base,
        classificationStatus: "classified",
        components: [
          {
            class: "learning_investment",
            subtype: "director_strategic_judgment",
            nativeMeasure: elapsedMs,
            nativeUnit: "milliseconds",
          },
        ],
      };
    }
    return {
      ...base,
      classificationStatus: "unresolved",
    };
  });
  const sourceCutRoot = hashCanonical(
    "attention-source-cut/v1",
    roleEvidence
      .map((record) => record.roleEvidenceDigest)
      .sort(compareUtf8),
  );
  const ledger = projectAttentionLedger({
    attentionLedgerId: `${campaignId}:attention-ledger`,
    sourceCutRoot,
    observations,
    paybackObservationRefs: [],
  });
  const surface = attentionDecisionSurface(ledger);
  return {
    ledger,
    ledgerDigest: hashCanonical(
      "attention-ledger/v1",
      ledger,
    ),
    surface,
    surfaceDigest: hashCanonical(
      "attention-decision-surface/v1",
      surface,
    ),
  };
}

function buildAnalysisDetails({
  campaignId,
  assignmentMap,
  directorEvidence,
  surveyEvidence,
  downstreamEvidence,
  judgeEvidence,
  adjudicationEvidence,
  grant,
  scenariosByRef,
  materialsByRef,
  mechanicalConformance,
}) {
  const adjudications = new Map(
    adjudicationEvidence.map((record) => [
      record.assignmentRef,
      record,
    ]),
  );
  const ballotsByAssignment = new Map();
  for (const record of judgeEvidence) {
    const records = ballotsByAssignment.get(record.assignmentRef) ?? [];
    records.push(record);
    ballotsByAssignment.set(record.assignmentRef, records);
  }
  const downstreamByAssignment = new Map(
    downstreamEvidence.map((record) => [
      record.assignmentRef,
      record,
    ]),
  );
  const allRoleEvidence = [
    ...directorEvidence,
    ...surveyEvidence,
    ...downstreamEvidence,
    ...judgeEvidence,
    ...adjudicationEvidence,
  ];
  const attention = buildAttentionEvidence({
    campaignId,
    roleEvidence: allRoleEvidence,
  });
  const assignmentResults = assignmentMap.assignments.map((assignment) => {
    const ballotRecords =
      ballotsByAssignment.get(assignment.assignmentId);
    const ballots = ballotRecords.map(
      (record) => record.content.ballot,
    );
    const adjudicationRecord =
      adjudications.get(assignment.assignmentId) ?? null;
    const resolution =
      adjudicationRecord?.content.resolution ?? null;
    const resolved = Object.fromEntries(
      Object.keys(ballots[0].scores).map((dimensionId) => {
        const item = resolution?.items.find(
          (candidate) => candidate.dimensionId === dimensionId,
        );
        return [
          dimensionId,
          item?.selectedScore ?? ballots[0].scores[dimensionId],
        ];
      }),
    );
    const downstreamRecord =
      downstreamByAssignment.get(assignment.assignmentId);
    const downstream = downstreamRecord?.content.utility;
    const scenario = scenariosByRef.get(assignment.scenarioRef);
    const material = materialsByRef.get(
      assignment.scenarioRef,
    );
    if (!downstream || !scenario || !material) {
      throw new IntegrityError(
        "Protected analysis is missing a sealed assignment dependency",
        { assignmentId: assignment.assignmentId },
      );
    }
    const semanticEvidenceCitations = [
      ...ballotRecords.map(
        (record) => record.roleEvidenceDigest,
      ),
      ...(adjudicationRecord
        ? [adjudicationRecord.roleEvidenceDigest]
        : []),
    ].sort(compareUtf8);
    const semanticScoring = material.rubric.dimensions.map(
      (dimension) =>
        scoreSemanticDimension({
          assignmentId: assignment.assignmentId,
          dimension,
          resolvedValue: resolved[dimension.dimensionId],
          evidenceCitations:
            semanticEvidenceCitations,
        }),
    );
    const downstreamScoring = scoreDownstreamUtility({
      utilityKeyId:
        `${assignment.assignmentId}:downstream-utility`,
      obligations: [
        {
          obligationId: "task-completion",
          required: true,
          weight: 1,
        },
      ],
      findings: [
        {
          obligationId: "task-completion",
          status: downstream.taskCompleted
            ? "preserved"
            : "absent",
          evidenceCitations: [
            downstreamRecord.roleEvidenceDigest,
          ],
        },
      ],
    });
    const assignmentRoleEvidence = allRoleEvidence.filter(
      (record) =>
        record.assignmentRef === assignment.assignmentId,
    );
    const assignmentSourceRoots = new Set(
      assignmentRoleEvidence.map(
        (record) => record.observableCaptureDigest,
      ),
    );
    const assignmentAttentionComponents =
      attention.ledger.components.filter((component) =>
        assignmentSourceRoots.has(component.sourceEventDigest),
      );
    const toilValue = assignmentAttentionComponents
      .filter((component) => component.class === "toil")
      .reduce(
        (sum, component) =>
          sum + component.nativeMeasure,
        0,
      );
    const learningValue = assignmentAttentionComponents
      .filter(
        (component) =>
          component.class === "learning_investment",
      )
      .reduce(
        (sum, component) =>
          sum + component.nativeMeasure,
        0,
      );
    const unresolvedAttention =
      attention.ledger.unresolvedObservationRefs.some(
        (sourceRef) => assignmentSourceRoots.has(sourceRef),
      );
    const telemetryFields = assignmentRoleEvidence.flatMap(
      (record) => {
        const telemetry =
          record.observableCapture.sections.telemetry.value;
        return [
          telemetry.modelConfiguration,
          telemetry.samplingConfiguration,
          telemetry.resourceUsage,
          telemetry.providerTelemetry,
        ];
      },
    );
    const telemetryAvailability =
      telemetryFields.length === 0
        ? null
        : telemetryFields.filter(
            (field) =>
              field.availability === "reported_by_host",
          ).length / telemetryFields.length;
    const metricOutcomes = {
      ...Object.fromEntries(
        semanticScoring.map((entry) => [
          entry.scoringResult.metricId,
          entry.metricOutcome,
        ]),
      ),
      DOWNSTREAM_UTILITY: {
        status:
          downstreamScoring.normalizedSummary === null
            ? "not_judgeable"
            : "observed",
        value: downstreamScoring.normalizedSummary,
      },
      ...conformanceMetricOutcomes({
        assignmentId: assignment.assignmentId,
        mechanicalConformance,
      }),
      ATTENTION_TOIL:
        toilValue === 0 && unresolvedAttention
          ? { status: "typed_unavailable", value: null }
          : { status: "observed", value: toilValue },
      ATTENTION_LEARNING: {
        status: "observed",
        value: learningValue,
      },
      TELEMETRY_AVAILABILITY:
        telemetryAvailability === null
          ? { status: "typed_unavailable", value: null }
          : {
              status: "observed",
              value: telemetryAvailability,
            },
      RANK_UNCERTAINTY: {
        status: "not_rankable",
        value: null,
      },
    };
    return {
      assignmentId: assignment.assignmentId,
      armId: assignment.armId,
      scenarioId: scenario.scenarioId,
      stratumId: assignment.stratumId,
      blockId: assignment.blockId,
      sampleOrdinal: assignment.sampleOrdinal,
      resolvedScores: resolved,
      downstreamTaskCompleted: downstream.taskCompleted,
      metricOutcomes,
      scoringResults: [
        ...semanticScoring.map(
          (entry) => entry.scoringResult,
        ),
        {
          metricId: "DOWNSTREAM_UTILITY",
          scoringClass: "blind_downstream_itt",
          result: downstreamScoring,
          scoringResultDigest:
            downstreamScoring.scoringResultDigest,
        },
      ],
    };
  });
  const armSummaries = [...new Set(
    assignmentMap.assignments.map((assignment) => assignment.armId),
  )]
    .sort(compareUtf8)
    .map((armId) => {
      const results = assignmentResults.filter(
        (candidate) => candidate.armId === armId,
      );
      return {
      armId,
      assignmentCount: results.length,
      metricMeans: Object.fromEntries(
        [
          ...new Set(
            results.flatMap((result) =>
              Object.keys(result.metricOutcomes),
            ),
          ),
        ]
          .sort(compareUtf8)
          .map((metricId) => [
            metricId,
            finiteMean(
              results.map(
                (result) =>
                  result.metricOutcomes[metricId]?.value,
              ),
            ),
          ]),
      ),
    };
  });
  const core = {
    schemaVersion: "1.0.0",
    hashProfileId: HASH_PROFILE_ID,
    analysisDetailsId: `${campaignId}:protected-role-analysis`,
    protectedUnmaskGrantDigest: grant.grantCoreDigest,
    assignmentResults,
    armSummaries,
    attention,
    sourceRoleEvidenceDigests: [
      ...surveyEvidence,
      ...downstreamEvidence,
      ...judgeEvidence,
      ...adjudicationEvidence,
    ]
      .map((record) => record.roleEvidenceDigest)
      .sort(),
    provisionalOnly: true,
    promotionAuthorized: false,
  };
  return selfSealed(
    "protected-role-analysis/v1",
    "analysisDetailsDigest",
    core,
  );
}

function buildRoleAnalysis({
  campaignId,
  analysisPlan,
  envelope,
  grant,
  analysisDetails,
  softwareDigest,
  assignmentCount,
  registeredAnalysis,
}) {
  return sealAnalysisResult({
    schemaVersion: "1.0.0",
    hashProfileId: HASH_PROFILE_ID,
    analysisResultId: `${campaignId}:sealed-role-analysis`,
    analysisPlanDigest: hashCanonical("analysis-plan/v1", analysisPlan),
    campaignEvidenceEnvelopeDigest: hashCanonical(
      "campaign-evidence-envelope/v1",
      envelope,
    ),
    protectedUnmaskGrantDigest: grant.grantCoreDigest,
    dependencePlanDigest: analysisPlan.dependencePlanDigest,
    softwareDigest,
    populationViews: [
      {
        populationClass: "all_assigned",
        assignmentCount,
        observedCount: assignmentCount,
        missingCount: 0,
        failureCount:
          registeredAnalysis.populationSummary.failureCount,
        contaminationCount:
          registeredAnalysis.populationSummary
            .contaminationCount,
        denominatorDigest: envelope.allAssignedPopulationRoot,
      },
      {
        populationClass: "instrument_valid",
        assignmentCount,
        observedCount:
          registeredAnalysis.populationSummary
            .instrumentValidObservedCount,
        missingCount:
          registeredAnalysis.populationSummary
            .instrumentValidMissingCount,
        failureCount:
          registeredAnalysis.populationSummary.failureCount,
        contaminationCount:
          registeredAnalysis.populationSummary
            .contaminationCount,
        denominatorDigest: envelope.instrumentValidPopulationRoot,
      },
      {
        populationClass: "release_eligible",
        assignmentCount,
        observedCount: 0,
        missingCount: assignmentCount,
        failureCount:
          registeredAnalysis.populationSummary.failureCount,
        contaminationCount:
          registeredAnalysis.populationSummary
            .contaminationCount,
        denominatorDigest: envelope.releaseQualifiedPopulationRoot,
      },
    ],
    metricResults: registeredAnalysis.metricResults,
    effects: registeredAnalysis.effects,
    multiplicityResult: registeredAnalysis.multiplicityResult,
    missingnessResults: registeredAnalysis.missingnessResults,
    ranking: registeredAnalysis.ranking,
    attention: {
      toilResultIds: Object.keys(
        analysisDetails.attention.surface
          .adverseObjectives.toilByUnit,
      )
        .sort(compareUtf8)
        .map(
          (unit) =>
            `${analysisDetails.attention.ledger.attentionLedgerId}:toil:${unit}`,
        ),
      protectedLearningResultIds: Object.keys(
        analysisDetails.attention.surface
          .protectedLearningInvestment.learningByUnit,
      )
        .sort(compareUtf8)
        .map(
          (unit) =>
            `${analysisDetails.attention.ledger.attentionLedgerId}:learning:${unit}`,
        ),
      directorJudgmentResultIds: Object.keys(
        analysisDetails.attention.surface
          .protectedLearningInvestment
          .directorStrategicJudgmentByUnit,
      )
        .sort(compareUtf8)
        .map(
          (unit) =>
            `${analysisDetails.attention.ledger.attentionLedgerId}:director:${unit}`,
        ),
      unresolvedObservationIds: [
        ...analysisDetails.attention.ledger
          .unresolvedObservationRefs,
      ].sort(compareUtf8),
      protectedLearningCanWorsenSelection: false,
    },
    sensitivityResultIds: registeredAnalysis.sensitivityResultIds,
    derivationRecordDigests: [
      analysisDetails.analysisDetailsDigest,
      registeredAnalysis.derivation.derivationDigest,
      analysisDetails.attention.ledgerDigest,
      analysisDetails.attention.surfaceDigest,
    ],
    campaignLineageDisclosureDigest: null,
  });
}

function buildRoleRecommendation({
  campaignId,
  analysisPlan,
  analysis,
  fixtureOnly,
}) {
  const analysisResultDigest = hashCanonical("analysis-result/v1", analysis);
  return sealRecommendation({
    schemaVersion: "1.0.0",
    hashProfileId: HASH_PROFILE_ID,
    recommendationId: `${campaignId}:sealed-role-recommendation`,
    analysisResultDigest,
    recommendationPolicyDigest: analysisPlan.recommendationPolicyDigest,
    class: "insufficient_or_invalid_evidence",
    supportedClaimIds: [],
    dimensionalResultIds: [],
    guardrailIds: analysisPlan.ranking.guardrailIds,
    limitationIds: [
      fixtureOnly
        ? "synthetic_fixture_not_live_efficacy_evidence"
        : "evaluation_evidence_has_no_release_authority",
    ],
    sensitivityResultIds: [],
    attentionProof: {
      toilOnlyAdverse: true,
      learningInvestmentAdverse: false,
      directorJudgmentAdverse: false,
      unresolvedAttentionExcluded: true,
    },
    policyClauses: [
      {
        clauseId: "confirmatory_evidence_required",
        passed: false,
        evidenceRefs: [analysisResultDigest],
      },
    ],
    promotionAuthorized: false,
  });
}

function buildRoleLineage({
  campaignId,
  analysisPlan,
  envelope,
  grant,
  analysis,
  recommendation,
  familyAllocationOrdinal,
  fixtureOnly,
}) {
  const analysisResultDigest = hashCanonical("analysis-result/v1", analysis);
  const recommendationDigest = hashCanonical(
    "campaign-recommendation/v1",
    recommendation,
  );
  return {
    schemaVersion: "1.0.0",
    hashProfileId: HASH_PROFILE_ID,
    campaignLineageDisclosureId: `${campaignId}:sealed-role-lineage`,
    campaignId,
    confirmatoryFamilyId: analysisPlan.multiplicity.familyId,
    familyOrdinal: familyAllocationOrdinal,
    analysisResultDigest,
    campaignEvidenceEnvelopeDigest: hashCanonical(
      "campaign-evidence-envelope/v1",
      envelope,
    ),
    protectedUnmaskGrantDigest: grant.grantCoreDigest,
    disclosurePolicyDigest: envelope.disclosurePolicyDigest,
    disclosureRecipeDigest: envelope.disclosureRecipeDigest,
    allowedFieldRoot: hashCanonical(
      "campaign-lineage-allowed-fields/v1",
      {
        fields: [
          "analysisResultDigest",
          "campaignEvidenceEnvelopeDigest",
          "recommendationClass",
          "promotionAuthorized",
        ],
      },
    ),
    boundedAggregatesRoot: hashCanonical(
      "campaign-lineage-bounded-aggregates/v1",
      { analysisResultDigest, recommendationDigest },
    ),
    limitsRoot: hashCanonical("campaign-lineage-limits/v1", {
      evidenceClass: fixtureOnly
        ? "known_answer_protocol_integration"
        : "attested_provider_evaluation",
      promotionAuthorized: false,
      releaseAuthority: false,
    }),
    envelopeBoundOneWay: true,
    participantArmMapIncluded: false,
    rawRoleContentIncluded: false,
    releaseAuthority: false,
  };
}

export class FullSealedRoleCampaignDriver {
  constructor({
    roleRunner = null,
    isolationProvider = null,
    fixtureAdapterFactories = null,
    subjectAdapterResolver = null,
    directorActionProvider = null,
    scenarioMaterialProvider = null,
    reviewerAllocationProvider = null,
    reviewerAllocationTrustRoot = null,
    roleExecutionProfiles = null,
    crashAfterTransitionId = null,
    clock = () => Date.now(),
    authorityTrustRoot = null,
    authorityReceiptProvider = null,
  } = {}) {
    this.roleRunner = roleRunner;
    this.isolationProvider = isolationProvider;
    this.fixtureAdapterFactories = fixtureAdapterFactories;
    this.subjectAdapterResolver = subjectAdapterResolver;
    this.directorActionProvider = directorActionProvider;
    this.scenarioMaterialProvider = scenarioMaterialProvider;
    this.reviewerAllocationProvider = reviewerAllocationProvider;
    this.reviewerAllocationTrustRoot =
      reviewerAllocationTrustRoot;
    this.roleExecutionProfiles =
      roleExecutionProfiles ??
      fixtureAdapterFactories?.executionProfiles ??
      isolationProvider?.executionProfiles ??
      null;
    this.crashAfterTransitionId = crashAfterTransitionId;
    this.crashInjected = false;
    this.clock = clock;
    this.authorityTrustRoot = authorityTrustRoot;
    this.authorityReceiptProvider = authorityReceiptProvider;
  }

  async ensureRole({
    roleRunner,
    awarenessLedger,
    workspaceRoot,
    pathPrefix,
    campaignId,
    sealDigest,
    executionConfiguration,
    assignmentRef,
    roleClass,
    workOrderId,
    inputProjection,
    validationContext,
  }) {
    const rolePlan = assertRoleInputMatchesExecutionPlan({
      executionConfiguration,
      roleClass,
      inputProjection,
    });
    const awarenessRequired = AWARENESS_ROLES.has(roleClass);
    const executionProfile =
      executionConfiguration.roleExecutionProfiles.find(
        (profile) => profile.roleClass === roleClass,
      );
    if (
      !executionProfile ||
      rolePlan.workOrderPlan.awarenessRequired !==
        awarenessRequired ||
      canonicalize(rolePlan.workOrderPlan.allowedTools) !==
        canonicalize(executionProfile.toolCatalog.toolIds) ||
      rolePlan.workOrderPlan.networkPolicy !== "disabled"
    ) {
      throw new IntegrityError(
        "Role dispatch policy differs from its preregistered work-order plan",
        { roleClass },
      );
    }
    const workOrder = roleWorkOrder({
      campaignId,
      sealDigest,
      executionConfigurationDigest:
        executionConfiguration.executionConfigurationDigest,
      assignmentRef,
      roleClass,
      workOrderId,
      inputProjection,
      awarenessRequired,
      allowedTools: rolePlan.workOrderPlan.allowedTools,
      networkPolicy: rolePlan.workOrderPlan.networkPolicy,
    });
    await publishJson(
      workspaceRoot,
      `evidence/work-orders/${workOrderId}.json`,
      workOrder,
    );
    const capsule = buildRoleCapsule({
      roleClass,
      workOrderId,
      inputProjection,
      allowedTools: rolePlan.workOrderPlan.allowedTools,
      writableWorkspaceId: `${pathPrefix}-${hashCanonical(
        "role-workspace/v1",
        { workOrderId },
      ).slice(0, 20)}`,
      network: "disabled",
      outputSchemaId: `role-output/${roleClass}/v1`,
      executionConfigurationDigest:
        executionConfiguration.executionConfigurationDigest,
      maskPolicyDigest: hashCanonical("role-mask-policy/v1", {
        roleClass,
        forbiddenComparativeContext: true,
      }),
      parentGrant: {
        workOrderDigest: workOrder.workOrderDigest,
        parentSealDigest: sealDigest,
        executionConfigurationDigest:
          executionConfiguration.executionConfigurationDigest,
      },
    });
    await publishJson(
      workspaceRoot,
      `evidence/capsules/${workOrderId}.json`,
      capsule,
    );
    const obligationId = `${pathPrefix}-${hashCanonical(
      "awareness-obligation-id/v1",
      { workOrderId },
    ).slice(0, 24)}`;
    const binding = {
      workOrderId,
      workOrderDigest: workOrder.workOrderDigest,
      capsuleDigest: capsule.capsuleDigest,
      inputProjectionDigest: capsule.inputProjectionDigest,
    };
    if (awarenessRequired) {
      await awarenessLedger.register({
        obligationId,
        roleClass,
        purpose: "post-content neutral metacognitive report",
        parentBinding: {
          campaignId,
          parentSealDigest: sealDigest,
          workOrderDigest: workOrder.workOrderDigest,
        },
        expectedInvocation: true,
        maskPolicyDigest: capsule.maskPolicyDigest,
      });
      let awareness = await awarenessLedger.load(obligationId, {
        required: true,
      });
      if (awareness.state === "AW0_REGISTERED") {
        if (awareness.invocationBinding === null) {
          await awarenessLedger.bindInvocation(obligationId, binding);
        } else if (
          hashCanonical(
            "awareness-invocation-binding/v1",
            awareness.invocationBinding,
          ) !== hashCanonical("awareness-invocation-binding/v1", binding)
        ) {
          throw new IntegrityError(
            "Awareness invocation binding conflicts with its role work order",
          );
        }
      }
    }

    const evidencePath = resolveContained(
      workspaceRoot,
      "evidence",
      "roles",
      `${workOrderId}.json`,
    );
    let evidence;
    if (await exists(evidencePath)) {
      evidence = verifyRoleEvidence(
        await readJsonFile(evidencePath),
        workOrder,
        capsule,
      );
      if (
        evidence.executionBoundary !==
          executionProfile.executionBoundary ||
        evidence.roleResult.hostIsolationAttestation
          ?.executionConfigurationDigest !==
          executionConfiguration.executionConfigurationDigest
      ) {
        throw new IntegrityError(
          "Persisted role host attestation changed its execution-configuration binding",
          { workOrderId },
        );
      }
      validateRoleContent(
        roleClass,
        evidence.content,
        workOrder,
        validationContext,
      );
    } else {
      if (awarenessRequired) {
        await awarenessLedger.assertDispatchable(
          obligationId,
          hashCanonical("awareness-invocation-binding/v1", binding),
        );
      }
      const adapterFactory = this.fixtureAdapterFactories?.[roleClass];
      if (this.fixtureAdapterFactories && typeof adapterFactory !== "function") {
        throw new ValidationError("Fixture has no adapter for a required role", {
          roleClass,
        });
      }
      const testAdapterFactory = adapterFactory
        ? (context) =>
            adapterFactory({
              ...context,
              workOrder: deepCloneCanonical(workOrder),
            })
        : null;
      const result = await roleRunner.run(capsule, testAdapterFactory);
      if (
        result.executionBoundary !==
        executionProfile.executionBoundary
      ) {
        throw new IntegrityError(
          "Role execution boundary differs from its preregistered execution profile",
          {
            workOrderId,
            expectedExecutionBoundary:
              executionProfile.executionBoundary,
            actualExecutionBoundary: result.executionBoundary,
          },
        );
      }
      validateRoleContent(
        roleClass,
        result.content,
        workOrder,
        validationContext,
      );
      evidence = roleEvidenceRecord({
        campaignId,
        assignmentRef,
        workOrder,
        capsule,
        result,
        fixtureOnly: this.fixtureAdapterFactories !== null,
      });
      await publishJson(
        workspaceRoot,
        `evidence/roles/${workOrderId}.json`,
        evidence,
      );
    }

    if (awarenessRequired) {
      let awareness = await awarenessLedger.load(obligationId, {
        required: true,
      });
      if (awareness.state === "AW0_REGISTERED") {
        if (!awareness.invocationBinding) {
          throw new IntegrityError(
            "Durable role evidence lacks its pre-dispatch awareness binding",
          );
        }
        await awarenessLedger.commitContent(obligationId, {
          workOrderDigest: workOrder.workOrderDigest,
          roleEvidenceDigest: evidence.roleEvidenceDigest,
          contentDigest: evidence.contentDigest,
        });
        awareness = await awarenessLedger.load(obligationId, {
          required: true,
        });
      }
      if (awareness.state === "AW1_CONTENT_COMMITTED") {
        await awarenessLedger.issueNeutralRequest(obligationId, {
          requestId: `${obligationId}:neutral-request`,
          prompt:
            "Report the condition you believed you saw, without comparative context.",
          issuedAfterContentDigest: evidence.contentDigest,
        });
        awareness = await awarenessLedger.load(obligationId, {
          required: true,
        });
      }
      if (awareness.state === "AW2_REQUESTED") {
        await awarenessLedger.sealResponse(
          obligationId,
          evidence.content.metacognitiveResponse,
        );
        awareness = await awarenessLedger.load(obligationId, {
          required: true,
        });
      }
      if (awareness.state === "AW3_DISPOSITION_SEALED") {
        await awarenessLedger.acknowledgeParent(obligationId, {
          parentOrderId: `${campaignId}:sealed-role-plan`,
          acceptedRoleEvidenceDigest: evidence.roleEvidenceDigest,
        });
        awareness = await awarenessLedger.load(obligationId, {
          required: true,
        });
      }
      if (awareness.state !== "AW4_CLOSED") {
        throw new IntegrityError("Awareness obligation did not close", {
          obligationId,
          state: awareness.state,
        });
      }
    }
    return { workOrder, capsule, evidence, obligationId };
  }

  async closeFailure({
    failure,
    registry,
    schemaValidator,
    stateStore,
    workspaceRoot,
  }) {
    const assignmentMapPath = resolveContained(
      workspaceRoot,
      ".evaluator",
      "protected",
      "assignment-map.json",
    );
    const unmaskAuthorityPath = resolveContained(
      workspaceRoot,
      ".evaluator",
      "role-protocol",
      "awareness",
      "protected-unmask-authority.json",
    );
    if (!(await exists(assignmentMapPath))) {
      return null;
    }
    const seal = await readJsonFile(
      resolveContained(
        workspaceRoot,
        ".evaluator",
        "campaign-seal.json",
      ),
    );
    const input = await readJsonFile(
      resolveContained(workspaceRoot, "campaign-input.json"),
    );
    const analysisPlan = await readJsonFile(
      resolveContained(workspaceRoot, input.analysisPlanRef),
    );
    const assignmentMap = await readJsonFile(assignmentMapPath);
    const executionConfigurationPath = resolveContained(
      workspaceRoot,
      ".evaluator",
      "protected",
      "execution-configuration.json",
    );
    let executionConfigurationDigest = null;
    if (await exists(executionConfigurationPath)) {
      const executionConfiguration = verifyExecutionConfiguration({
        value: await readJsonFile(executionConfigurationPath),
        schemaValidator,
      });
      if (
        executionConfiguration.campaignId !== input.campaignId ||
        executionConfiguration.campaignSealDigest !==
          seal.sealDigest ||
        executionConfiguration.assignmentMapDigest !==
          assignmentMap.assignmentMapDigest
      ) {
        throw new IntegrityError(
          "Failure closer execution configuration is outside the sealed campaign cut",
        );
      }
      executionConfigurationDigest =
        executionConfiguration.executionConfigurationDigest;
    }
    const state = await stateStore.load("campaign", input.campaignId, {
      required: true,
    });
    if (executionConfigurationDigest !== null) {
      const preExecutionRoot = executionConfigurationPlanRoot(
        executionConfigurationDigest,
      );
      for (const transitionId of [
        "EC01",
        "EC03a",
        "EC04",
        "EC05",
      ]) {
        const durableEvent =
          state.authoritativeStateCore.eventLedger.find(
            (event) => event.core.transitionId === transitionId,
          );
        if (!durableEvent) continue;
        const expectedInputDigest = hashCanonical(
          "campaign-transition-input/v1",
          {
            executionClass: "sealed_role_campaign",
            sealDigest: seal.sealDigest,
            transitionId,
            evidenceRoot: preExecutionRoot,
            provisionalOnly: true,
            promotionAuthorized: false,
          },
        );
        if (durableEvent.core.inputDigest !== expectedInputDigest) {
          throw new IntegrityError(
            "Persisted execution configuration conflicts with the durable pre-execution command",
            {
              transitionId,
              executionConfigurationDigest,
            },
          );
        }
      }
    }
    const assignmentIds = assignmentMap.assignments
      .map((assignment) => assignment.assignmentId)
      .sort(compareUtf8);
    const persistedRoleCut =
      await admitPersistedRoleExecutionCut({
        workspaceRoot,
        campaignId: input.campaignId,
        sealDigest: seal.sealDigest,
        executionConfigurationDigest,
        assignmentIds,
      });
    const sourcePhase = stateName(state);
    const failureTransition = [...registry.transitions.values()].find(
      (transition) =>
        transition.machineId === "campaign" &&
        transition.fromState === sourcePhase &&
        transition.toState === "EC_FAILED_CLOSED" &&
        transition.transitionId.startsWith("ECF04"),
    );
    if (!failureTransition) return null;

    let unmaskGrant = null;
    if (await exists(unmaskAuthorityPath)) {
      unmaskGrant = verifySelfSealed(
        "protected-unmask-grant/v1",
        "grantCoreDigest",
        await readJsonFile(unmaskAuthorityPath),
        "Failure closer protected unmask grant",
      );
      schemaValidator.assert(
        "protected-unmask-grant",
        unmaskGrant,
      );
    }
    const reviewerRecordPath = resolveContained(
      workspaceRoot,
      ".evaluator",
      "protected",
      "reviewer-allocation-authority.json",
    );
    let reviewerRecord = null;
    if (await exists(reviewerRecordPath)) {
      reviewerRecord = verifySelfSealed(
        "admitted-reviewer-allocation-record/v1",
        "reviewerAllocationRecordDigest",
        await readJsonFile(reviewerRecordPath),
        "Failure closer reviewer allocation record",
      );
    }
    const scenarioRecordPath = resolveContained(
      workspaceRoot,
      ".evaluator",
      "protected",
      "scenario-material-authority.json",
    );
    let scenarioRecord = null;
    if (await exists(scenarioRecordPath)) {
      scenarioRecord = verifySelfSealed(
        "admitted-scenario-material-record/v1",
        "scenarioMaterialRecordDigest",
        await readJsonFile(scenarioRecordPath),
        "Failure closer scenario material record",
      );
    }
    const expectedPositions = [];
    const subjectEvidenceByAssignment = new Map();
    for (const assignment of assignmentMap.assignments) {
      expectedPositions.push(
        {
          positionId: assignment.assignmentId,
          positionClass: "assignment",
        },
        {
          positionId: `${assignment.assignmentId}:survey-subject`,
          positionClass: "attempt",
        },
      );
      const subjectEvidencePath = resolveContained(
        workspaceRoot,
        "evidence",
        "subjects",
        `${assignment.assignmentId}.json`,
      );
      if (await exists(subjectEvidencePath)) {
        const subject = verifySelfSealed(
          "survey-subject-execution/v1",
          "subjectExecutionDigest",
          await readJsonFile(subjectEvidencePath),
          "Failure closer Survey subject execution evidence",
        );
        schemaValidator.assert(
          "survey-subject-execution",
          subject,
        );
        if (subject.assignmentRef !== assignment.assignmentId) {
          throw new IntegrityError(
            "Failure closer Survey subject evidence changed its assignment",
            {
              expectedAssignmentId: assignment.assignmentId,
              actualAssignmentId: subject.assignmentRef,
            },
          );
        }
        subjectEvidenceByAssignment.set(
          assignment.assignmentId,
          subject,
        );
      }
    }
    if (reviewerRecord) {
      for (const judgeAssignment of
        reviewerRecord.allocation.judgeAssignments) {
        expectedPositions.push({
          positionId: judgeAssignment.judgeAssignmentId,
          positionClass: "review",
        });
      }
      for (const reviewer of
        reviewerRecord.allocation.evidence.registrySnapshot
          .eligibleReviewers) {
        expectedPositions.push({
          positionId: `capacity:${reviewer.opaqueReviewerId}`,
          positionClass: "capacity",
        });
      }
    }
    const failureEvidence = {
      schemaVersion: "1.0.0",
      hashProfileId: HASH_PROFILE_ID,
      errorName:
        typeof failure?.name === "string"
          ? failure.name
          : "ExecutionError",
      errorCode:
        typeof failure?.code === "string"
          ? failure.code
          : "execution_failure",
      errorMessageDigest: hashCanonical(
        "campaign-failure-message/v1",
        {
          message:
            typeof failure?.message === "string"
              ? failure.message
              : "unspecified execution failure",
        },
      ),
      sourceStateRoot: state.authoritativeStateRoot,
    };
    const failureCause = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$/u.test(
      failureEvidence.errorCode,
    )
      ? failureEvidence.errorCode
      : "execution_failure";
    const failurePreparationRoot = hashCanonical(
      "campaign-failure-preparation/v1",
      {
        campaignId: input.campaignId,
        sourcePhase,
        sourceStateRoot: state.authoritativeStateRoot,
        failureCause,
        expectedPositions,
      },
    );
    const positionDispositions = [];
    for (const position of expectedPositions) {
      let disposition;
      if (position.positionClass === "capacity") {
        disposition = "retired";
      } else if (position.positionClass === "attempt") {
        const assignmentId = position.positionId.slice(
          0,
          -":survey-subject".length,
        );
        disposition =
          subjectEvidenceByAssignment.has(assignmentId)
          ? "terminal"
          : "terminalized_unconsumed";
      } else {
        disposition = "quarantined";
      }
      positionDispositions.push({
        ...position,
        disposition,
        receiptRoot: hashCanonical(
          "campaign-failure-position-receipt/v1",
          {
            campaignId: input.campaignId,
            failurePreparationRoot,
            position,
            disposition,
          },
        ),
      });
    }

    const awarenessLedger = new AwarenessLedger({
      rootPath: resolveContained(
        workspaceRoot,
        ".evaluator",
        "role-protocol",
      ),
      clock: this.clock,
      schemaValidator,
    });
    const awarenessClosures = [];
    for (const obligationId of
      await awarenessLedger.registeredObligationIds()) {
      let record = await awarenessLedger.load(obligationId, {
        required: true,
      });
      if (record.state === "AW0_REGISTERED") {
        await awarenessLedger.sealMissingNoContent(obligationId, {
          failurePreparationRoot,
          noContentEvidenceRoot: hashCanonical(
            "campaign-failure-no-content/v1",
            { obligationId, failurePreparationRoot },
          ),
        });
        record = await awarenessLedger.load(obligationId, {
          required: true,
        });
      }
      if (
        record.state === "AW1_CONTENT_COMMITTED" ||
        record.state === "AW2_REQUESTED"
      ) {
        await awarenessLedger.sealMissingAfterContent(obligationId, {
          failurePreparationRoot,
          timeoutEvidenceRoot: hashCanonical(
            "campaign-failure-awareness-timeout/v1",
            { obligationId, failurePreparationRoot },
          ),
        });
        record = await awarenessLedger.load(obligationId, {
          required: true,
        });
      }
      if (record.state === "AW3_DISPOSITION_SEALED") {
        await awarenessLedger.acknowledgeParent(obligationId, {
          parentOrderId: `${input.campaignId}:failure-closure`,
          failurePreparationRoot,
          disposition: record.disposition.kind,
        });
        record = await awarenessLedger.load(obligationId, {
          required: true,
        });
      }
      if (record.state !== "AW4_CLOSED") {
        throw new IntegrityError(
          "Failure closer could not reconcile an awareness obligation",
          { obligationId, state: record.state },
        );
      }
      awarenessClosures.push({
        obligationId,
        state: record.state,
        awarenessStateRoot: record.awarenessStateRoot,
        parentReceiptRoot: hashCanonical(
          "awareness-failure-parent-receipt/v1",
          record.parentReceipt,
        ),
      });
    }
    const unmaskEvent =
      state.authoritativeStateCore.eventLedger.find(
        (event) => event.core.transitionId === "EC20",
      ) ?? null;
    let unmaskGrantDisposition = null;
    if (unmaskGrant) {
      if (unmaskEvent) {
        const grantActionReceipt =
          unmaskEvent.core.actionReceipts.find(
            (receipt) =>
              receipt.actionId ===
              "commit-one-analyst-grant",
          );
        if (
          !grantActionReceipt ||
          grantActionReceipt.outputCore
            ?.protectedUnmaskGrantDigest !==
            unmaskGrant.grantCoreDigest
        ) {
          throw new IntegrityError(
            "Durable EC20 event does not bind the issued protected unmask grant",
            {
              protectedUnmaskGrantId:
                unmaskGrant.protectedUnmaskGrantId,
              eventRoot: unmaskEvent.eventRoot,
            },
          );
        }
        unmaskGrantDisposition = (
          await awarenessLedger.disposeUnmaskGrant({
            grant: unmaskGrant,
            disposition: "consumed",
            dispositionCauseRoot: unmaskEvent.eventRoot,
            campaignEventRoot: unmaskEvent.eventRoot,
            sourcePhase: registry.transition("EC20").toState,
          })
        ).disposition;
      } else {
        unmaskGrantDisposition = (
          await awarenessLedger.disposeUnmaskGrant({
            grant: unmaskGrant,
            disposition: "terminalized_unconsumed",
            dispositionCauseRoot: failurePreparationRoot,
            failurePreparationRoot,
            sourcePhase,
          })
        ).disposition;
      }
    }
    const readableSourceRoots = [
      state.authoritativeStateRoot,
      seal.sealDigest,
      assignmentMap.assignmentMapDigest,
      ...(executionConfigurationDigest === null
        ? []
        : [executionConfigurationDigest]),
      ...[...subjectEvidenceByAssignment.values()].map(
        (subject) => subject.subjectExecutionDigest,
      ),
      ...persistedRoleCut.roleEvidence.flatMap((record) => [
        record.roleEvidenceDigest,
        record.observableCaptureDigest,
      ]),
    ];
    if (reviewerRecord) {
      readableSourceRoots.push(
        reviewerRecord.allocation.familyAllocationRecordDigest,
      );
    }
    if (scenarioRecord) {
      readableSourceRoots.push(
        scenarioRecord.authorityEnvelope.authorityEnvelopeDigest,
      );
    }
    if (unmaskGrant) {
      readableSourceRoots.push(unmaskGrant.grantCoreDigest);
    }
    if (unmaskGrantDisposition) {
      readableSourceRoots.push(
        unmaskGrantDisposition.dispositionReceiptRoot,
      );
    }
    const stoppingExecutionPath = resolveContained(
      workspaceRoot,
      ".evaluator",
      "protected",
      "stopping-execution-plan.json",
    );
    if (await exists(stoppingExecutionPath)) {
      const stoppingExecutionPlan = assertStoppingExecutionPlan({
        stoppingRule: seal.stoppingRule,
        stoppingExecutionPlan:
          await readJsonFile(stoppingExecutionPath),
        schemaValidator,
      });
      readableSourceRoots.push(
        stoppingExecutionPlan.stoppingExecutionPlanDigest,
      );
    }
    const successEnvelopePath = resolveContained(
      workspaceRoot,
      "results",
      "campaign-evidence-envelope.json",
    );
    if (await exists(successEnvelopePath)) {
      const successEnvelope = await readJsonFile(successEnvelopePath);
      schemaValidator.assert(
        "campaign-evidence-envelope",
        successEnvelope,
      );
      readableSourceRoots.push(
        hashCanonical(
          "campaign-evidence-envelope/v1",
          successEnvelope,
        ),
      );
    }
    const grantDispositions = unmaskGrantDisposition
      ? [
          {
            grantId:
              unmaskGrantDisposition.protectedUnmaskGrantId,
            disposition: unmaskGrantDisposition.disposition,
            receiptRoot:
              unmaskGrantDisposition.dispositionReceiptRoot,
          },
        ]
      : [];
    const observedSubjectCount =
      subjectEvidenceByAssignment.size;
    const failedSubjectCount = [
      ...subjectEvidenceByAssignment.values(),
    ].filter(
      (subject) => subject.outcomeClass !== "completed",
    ).length;
    const populationViews = [
      {
        populationClass: "all_assigned",
        assignmentCount: assignmentIds.length,
        observedCount: observedSubjectCount,
        missingCount:
          assignmentIds.length - observedSubjectCount,
        failureCount: failedSubjectCount,
        contaminationCount: 0,
        denominatorDigest: hashCanonical(
          "campaign-failure-all-assigned-population/v1",
          { campaignId: input.campaignId, assignmentIds },
        ),
      },
      {
        populationClass: "instrument_valid",
        assignmentCount: assignmentIds.length,
        observedCount: 0,
        missingCount: assignmentIds.length,
        failureCount: failedSubjectCount,
        contaminationCount: 0,
        denominatorDigest: hashCanonical(
          "campaign-failure-instrument-valid-population/v1",
          {
            campaignId: input.campaignId,
            assignmentIds,
            qualificationStatus:
              "unavailable_failed_campaign",
          },
        ),
      },
      {
        populationClass: "release_eligible",
        assignmentCount: assignmentIds.length,
        observedCount: 0,
        missingCount: assignmentIds.length,
        failureCount: failedSubjectCount,
        contaminationCount: 0,
        denominatorDigest: hashCanonical(
          "campaign-failure-release-eligible-population/v1",
          {
            campaignId: input.campaignId,
            assignmentIds,
            releaseStatus: "inadmissible",
          },
        ),
      },
    ];
    const stagePopulationViews =
      buildFailureStagePopulationViews({
        campaignId: input.campaignId,
        assignmentIds,
        subjectEvidenceByAssignment,
        persistedRoleCut,
      });
    const unavailableSourceClasses = [
      "failed_execution_output",
      ...(reviewerRecord ? [] : ["reviewer_allocation_not_realized"]),
      ...(scenarioRecord ? [] : ["scenario_material_not_realized"]),
    ];
    const { envelope, envelopeDigest } =
      buildCampaignFailureEnvelope({
        campaignId: input.campaignId,
        sourcePhase,
        failureCause,
        failureEvidence,
        readableSourceRoots: [
          ...new Set(readableSourceRoots),
        ],
        unavailableSourceClasses,
        failurePreparationRoot,
        expectedPositions,
        positionDispositions,
        populationViews,
        stagePopulationViews,
        awarenessClosures,
        grantDispositions,
        missingnessPolicyRoot: hashCanonical(
          "campaign-failure-missingness-policy/v1",
          analysisPlan.missingness,
        ),
        unsupportedClaimIds: [
          ...new Set([
            ...input.claims.map((claim) => claim.claimId),
            "E6",
            "E7",
            "promotion",
          ]),
        ],
        schemaValidator,
      });
    await publishJson(
      workspaceRoot,
      "results/campaign-failure-envelope.json",
      envelope,
    );

    const policy = registry.participantPolicy(
      failureTransition.participantPolicyId,
    );
    const commandInput = {
      executionClass: "sealed_role_campaign_failure",
      sealDigest: seal.sealDigest,
      failureEnvelopeDigest: envelopeDigest,
      failurePreparationRoot,
      realizedChildCutRoot: envelope.realizedChildCutRoot,
      receiptLedgerRoot: envelope.receiptLedgerRoot,
      promotionAuthorized: false,
    };
    const command = {
      machineId: "campaign",
      objectId: input.campaignId,
      transitionId: failureTransition.transitionId,
      expectedRevision:
        state.authoritativeStateCore.semanticState.revision,
      participantPolicyId:
        failureTransition.participantPolicyId,
      participantPolicyDigest: registry.participantPolicyDigest(
        failureTransition.participantPolicyId,
      ),
      idempotencyKey:
        `${input.campaignId}/${failureTransition.transitionId}/failure-closure-v1`,
      input: commandInput,
      inputDigest: hashCanonical(
        "campaign-failure-transition-input/v1",
        commandInput,
      ),
      parentOrderId: `${input.campaignId}:failure-closure`,
      parentFence: 0,
    };
    command.authorizationReceipts =
      await requestExternalAuthorityReceipts({
        provider: this.authorityReceiptProvider,
        policy,
        command,
        machineId: "campaign",
        participantPolicyDigest: command.participantPolicyDigest,
      });
    const actions = {
      "apply-sealed-campaign-policy": async () => ({
        core: {
          action: "apply-sealed-campaign-policy",
          failureEnvelopeDigest: envelopeDigest,
          promotionAuthorized: false,
        },
      }),
      "commit-state-outbox": async () => ({
        core: {
          action: "commit-state-outbox",
          failureEnvelopeDigest: envelopeDigest,
        },
      }),
    };
    const engine = new LifecycleEngine({
      registry,
      stateStore,
      authorityReceiptVerifier: new AuthorityReceiptVerifier({
        trustRoot: this.authorityTrustRoot,
        schemaValidator,
      }),
      guards: {
        [failureTransition.guardId]: () => ({
          pass:
            envelope.admissible === false &&
            envelope.issuedOrRetirementPendingGrantsRemaining === false &&
            envelope.positionDispositions.length ===
              expectedPositions.length,
          failureEnvelopeDigest: envelopeDigest,
        }),
      },
      actions,
      mutations: {
        [failureTransition.mutationId]: ({ currentData }) => ({
          ...currentData,
          failurePreparation: {
            cause: failureCause,
            sourcePhase,
            sourceRoot: state.authoritativeStateRoot,
            fence:
              state.authoritativeStateCore.semanticState.revision + 1,
            realizedChildCutRoot: envelope.realizedChildCutRoot,
            issuanceWindowsClosed: true,
            activationWindowsClosed: true,
            totalDrainRoot: envelope.receiptLedgerRoot,
          },
          awarenessUniverseRoot: envelope.awarenessClosureRoot,
          awarenessReceiptLedgerRoot: envelope.receiptLedgerRoot,
          receiptLedgerRoot: envelope.receiptLedgerRoot,
        }),
      },
    });
    const transitionResult = await engine.execute(command);
    return {
      executionClass: "sealed_role_campaign_failure",
      evidenceClass: "inclusive_failure_evidence",
      assuranceLevel: "e0_e5_failure_protocol_only",
      gateClaimCeiling: "E5",
      excludedGateClaims: ["E6", "E7"],
      campaignId: input.campaignId,
      state: transitionResult.state,
      revision: transitionResult.revision,
      authoritativeStateRoot:
        transitionResult.authoritativeStateRoot,
      committedTransitions: [failureTransition.transitionId],
      campaignFailureEnvelopeDigest: envelopeDigest,
      failureCause,
      grantDispositionCount: grantDispositions.length,
      protectedUnmaskGrantDisposition:
        grantDispositions[0]?.disposition ?? null,
      promotionAuthorized: false,
      surveyEfficacyClaimed: false,
      liveAuthorityClaimed: false,
    };
  }

  async advance(context) {
    try {
      return await this._advance(context);
    } catch (failure) {
      if (
        failure instanceof ConflictError &&
        failure.message.startsWith(
          "Injected crash after durable sealed role transition",
        )
      ) {
        throw failure;
      }
      const closed = await this.closeFailure({
        failure,
        registry: context.registry,
        schemaValidator: context.schemaValidator,
        stateStore: context.stateStore,
        workspaceRoot: context.workspaceRoot,
      });
      if (closed) return closed;
      throw failure;
    }
  }

  async _advance({
    mode,
    validation,
    registry,
    schemaValidator,
    stateStore,
    packageRoot,
    workspaceRoot,
  }) {
    const seal = await readJsonFile(
      resolveContained(workspaceRoot, ".evaluator", "campaign-seal.json"),
    );
    const input = await readJsonFile(
      resolveContained(workspaceRoot, "campaign-input.json"),
    );
    const analysisPlan = await readJsonFile(
      resolveContained(workspaceRoot, input.analysisPlanRef),
    );
    const metricRegistry = await readJsonFile(
      resolveContained(
        packageRoot,
        "source",
        "manifests",
        "metrics.json",
      ),
    );
    if (
      metricRegistry.schemaVersion !== "1.0.0" ||
      metricRegistry.hashProfileId !== HASH_PROFILE_ID ||
      !Array.isArray(metricRegistry.metrics)
    ) {
      throw new IntegrityError(
        "Canonical metric registry is malformed",
      );
    }
    for (const descriptor of metricRegistry.metrics) {
      schemaValidator.assert("metric-descriptor", {
        schemaVersion: metricRegistry.schemaVersion,
        hashProfileId: metricRegistry.hashProfileId,
        ...descriptor,
      });
    }
    const authorityRegistry = await readJsonFile(
      resolveContained(
        packageRoot,
        "source",
        "fragments",
        "authority",
        "authority-registry.json",
      ),
    );
    const packageManifest = await readJsonFile(
      resolveContained(packageRoot, "package.manifest.json"),
    );
    const generatedLock = await readJsonFile(
      resolveContained(packageRoot, "generated.lock.json"),
    );
    const campaignId = validation.campaignId;
    const pathPrefix = `role-${hashCanonical("campaign-path-prefix/v1", {
      campaignId,
    }).slice(0, 16)}`;
    const fixtureOnly = this.fixtureAdapterFactories !== null;
    if (
      this.roleRunner === null &&
      this.isolationProvider === null &&
      !fixtureOnly
    ) {
      throw new ValidationError(
        "Full role execution requires an attested isolation provider or explicit test-only adapters",
      );
    }
    if (
      typeof this.subjectAdapterResolver !== "function" ||
      typeof this.directorActionProvider !== "function" ||
      (typeof this.scenarioMaterialProvider !== "function" &&
        typeof this.scenarioMaterialProvider?.provideScenarioMaterials !==
          "function") ||
      typeof this.reviewerAllocationProvider !== "function" ||
      this.reviewerAllocationTrustRoot === null ||
      this.roleExecutionProfiles === null
    ) {
      throw new ValidationError(
        "Full role execution requires Survey, Director, scenario-material, reviewer-allocation, reviewer-allocation trust-root, and explicit role-execution configurations",
      );
    }
    const roleRunner =
      this.roleRunner ??
      new IsolatedRoleRunner({
        rootPath: resolveContained(
          workspaceRoot,
          ".evaluator",
          "role-runtime",
        ),
        isolationProvider: this.isolationProvider,
        allowTestInProcess: fixtureOnly,
        clock: this.clock,
      });
    const awarenessLedger = new AwarenessLedger({
      rootPath: resolveContained(
        workspaceRoot,
        ".evaluator",
        "role-protocol",
      ),
      clock: this.clock,
      schemaValidator,
    });
    const stoppingExecutionPath = resolveContained(
      workspaceRoot,
      ".evaluator",
      "protected",
      "stopping-execution-plan.json",
    );
    let stoppingExecutionPlan;
    if (await exists(stoppingExecutionPath)) {
      stoppingExecutionPlan = assertStoppingExecutionPlan({
        stoppingRule: seal.stoppingRule,
        stoppingExecutionPlan:
          await readJsonFile(stoppingExecutionPath),
        schemaValidator,
      });
    } else {
      stoppingExecutionPlan = createStoppingExecutionPlan({
        stoppingRule: seal.stoppingRule,
        schemaValidator,
      });
      await publishJson(
        workspaceRoot,
        ".evaluator/protected/stopping-execution-plan.json",
        stoppingExecutionPlan,
        { mode: 0o600 },
      );
    }
    const assignmentMap = protectedAssignments(
      campaignId,
      input,
      seal.sealDigest,
      seal.candidateArms,
      stoppingExecutionPlan,
      seal.dependencePlan,
    );
    if (assignmentMap.assignments.length === 0) {
      throw new ValidationError(
        "Full role execution requires at least one assignment per sealed cell",
      );
    }
    const scenariosByRef = new Map();
    const sealedScenarios = [];
    for (const scenarioRef of input.scenarioRefs) {
      const scenario = await readJsonFile(
        resolveContained(workspaceRoot, scenarioRef),
      );
      schemaValidator.assert("scenario", scenario);
      scenariosByRef.set(scenarioRef, scenario);
      sealedScenarios.push({
        scenarioRef,
        scenario,
        scenarioDigest: scenarioMaterialScenarioDigest(scenario),
      });
    }
    const scenarioMaterialPath = resolveContained(
      workspaceRoot,
      ".evaluator",
      "protected",
      "scenario-material-authority.json",
    );
    let scenarioMaterials;
    if (await exists(scenarioMaterialPath)) {
      const record = verifySelfSealed(
        "admitted-scenario-material-record/v1",
        "scenarioMaterialRecordDigest",
        await readJsonFile(scenarioMaterialPath),
        "Persisted scenario material authority record",
      );
      if (
        record.campaignId !== campaignId ||
        record.campaignSealDigest !== seal.sealDigest
      ) {
        throw new IntegrityError(
          "Persisted scenario material authority record changed campaign identity",
        );
      }
      scenarioMaterials = record.authorityEnvelope;
      const expectedReferences = [...input.scenarioRefs].sort(compareUtf8);
      const actualReferences = scenarioMaterials.materials
        .map((material) => material.scenarioRef)
        .sort(compareUtf8);
      if (
        scenarioMaterials.campaignId !== campaignId ||
        scenarioMaterials.campaignSealDigest !== seal.sealDigest ||
        canonicalize(expectedReferences) !==
          canonicalize(actualReferences)
      ) {
        throw new IntegrityError(
          "Persisted scenario authority envelope changed its sealed coverage",
        );
      }
      for (const material of scenarioMaterials.materials) {
        const scenario = scenariosByRef.get(material.scenarioRef);
        schemaValidator.assert("semantic-key", material.semanticKey);
        schemaValidator.assert("persona-brief", material.personaBrief);
        schemaValidator.assert("rubric", material.rubric);
        schemaValidator.assert("scenario-review", material.scenarioReview);
        const bundle = deepCloneCanonical(material);
        for (const field of [
          "semanticKeyDigest",
          "personaBriefDigest",
          "rubricDigest",
          "scenarioReviewDigest",
          "materialBundleDigest",
        ]) {
          delete bundle[field];
        }
        if (
          !scenario ||
          material.scenarioId !== scenario.scenarioId ||
          material.scenarioDigest !==
            scenarioMaterialScenarioDigest(scenario) ||
          material.semanticKeyDigest !==
            scenarioMaterialSemanticKeyDigest(material.semanticKey) ||
          material.personaBriefDigest !==
            scenarioMaterialPersonaBriefDigest(material.personaBrief) ||
          material.rubricDigest !==
            scenarioMaterialRubricDigest(material.rubric) ||
          material.scenarioReviewDigest !==
            scenarioMaterialReviewDigest(material.scenarioReview) ||
          material.materialBundleDigest !==
            hashCanonical("scenario-material-bundle/v1", bundle)
        ) {
          throw new IntegrityError(
            "Persisted scenario material bundle is unverifiable",
            { scenarioRef: material.scenarioRef },
          );
        }
      }
      const expectedEnvelopeDigest = hashCanonical(
        "admitted-scenario-material-authority-envelope/v1",
        {
          requestDigest: scenarioMaterials.requestDigest,
          responseDigest: scenarioMaterials.responseDigest,
          authorityId: scenarioMaterials.authorityId,
          materialBundleDigests: scenarioMaterials.materials.map(
            (material) => material.materialBundleDigest,
          ),
        },
      );
      if (
        scenarioMaterials.authorityEnvelopeDigest !==
        expectedEnvelopeDigest
      ) {
        throw new IntegrityError(
          "Persisted scenario material authority envelope is not self-verifying",
        );
      }
    } else {
      const preExecutionState = await stateStore.load(
        "campaign",
        campaignId,
        { required: true },
      );
      const preExecutionSemanticState =
        preExecutionState.authoritativeStateCore.semanticState;
      scenarioMaterials = await new ScenarioMaterialAuthorityClient({
        schemaValidator,
        provider: this.scenarioMaterialProvider,
      }).request({
        campaignId,
        campaignSealDigest: seal.sealDigest,
        lifecycleState: stateName(preExecutionState),
        lifecycleRevision: preExecutionSemanticState.revision,
        authoritativeStateRoot:
          preExecutionState.authoritativeStateRoot,
        executionStarted: false,
        claimRequiresDownstream:
          analysisPlan.primaryMetricIds.includes(
            "DOWNSTREAM_UTILITY",
          ) ||
          analysisPlan.secondaryMetricIds.includes(
            "DOWNSTREAM_UTILITY",
          ) ||
          input.claims.some(
            (claim) => claim.claimClass === "downstream-utility",
          ),
        sealedScenarios,
      });
      await publishJson(
        workspaceRoot,
        ".evaluator/protected/scenario-material-authority.json",
        selfSealed(
          "admitted-scenario-material-record/v1",
          "scenarioMaterialRecordDigest",
          {
            campaignId,
            campaignSealDigest: seal.sealDigest,
            authorityEnvelope: scenarioMaterials,
          },
        ),
        { mode: 0o600 },
      );
    }
    const materialsByRef = new Map(
      scenarioMaterials.materials.map((material) => [
        material.scenarioRef,
        material,
      ]),
    );
    const materialFor = (scenarioRef) => {
      const material = materialsByRef.get(scenarioRef);
      if (!material) {
        throw new IntegrityError(
          "Protected assignment has no externally admitted scenario material",
          { scenarioRef },
        );
      }
      return material;
    };
    const reviewerAssignmentFamily = assignmentMap.assignments.map(
      (assignment) => ({
        assignmentId: assignment.opaqueSubjectId,
        blindBundleId: assignment.opaqueSubjectId,
      }),
    );
    const reviewerAllocationPath = resolveContained(
      workspaceRoot,
      ".evaluator",
      "protected",
      "reviewer-allocation-authority.json",
    );
    const reviewerAllocationAuthority =
      new ReviewerAllocationAuthority({
        schemaValidator,
        evidenceProvider: this.reviewerAllocationProvider,
        trustRoot: this.reviewerAllocationTrustRoot,
        authorityRegistry,
      });
    let reviewerAllocation;
    if (await exists(reviewerAllocationPath)) {
      const record = verifySelfSealed(
        "admitted-reviewer-allocation-record/v1",
        "reviewerAllocationRecordDigest",
        await readJsonFile(reviewerAllocationPath),
        "Persisted reviewer allocation authority record",
      );
      reviewerAllocation = record.allocation;
      const readmittedAllocation =
        reviewerAllocationAuthority.admitEvidence({
          request: reviewerAllocation.request,
          evidence: reviewerAllocation.evidence,
        });
      if (
        canonicalize(readmittedAllocation) !==
        canonicalize(reviewerAllocation)
      ) {
        throw new IntegrityError(
          "Persisted reviewer allocation differs from exact re-admission",
        );
      }
      reviewerAllocation = readmittedAllocation;
      const expectedFamily = [...reviewerAssignmentFamily].sort(
        (left, right) =>
          compareUtf8(left.assignmentId, right.assignmentId),
      );
      if (
        record.campaignId !== campaignId ||
        record.campaignSealDigest !== seal.sealDigest ||
        reviewerAllocation.request.campaignId !== campaignId ||
        reviewerAllocation.request.campaignSealDigest !==
          seal.sealDigest ||
        reviewerAllocation.request.confirmatoryFamilyId !==
          analysisPlan.multiplicity.familyId ||
        reviewerAllocation.request.armMapDisclosed !== false ||
        reviewerAllocation.request.outcomeInputsAvailable !== false ||
        canonicalize(
          reviewerAllocation.request.assignmentFamily,
        ) !== canonicalize(expectedFamily) ||
        reviewerAllocation.assignmentFamilyDigest !==
          hashCanonical(
            "reviewer-allocation-assignment-family/v1",
            expectedFamily,
          )
      ) {
        throw new IntegrityError(
          "Persisted reviewer allocation changed its blind pre-outcome family",
        );
      }
      schemaValidator.assert(
        "reviewer-registry-snapshot",
        reviewerAllocation.evidence.registrySnapshot,
      );
      schemaValidator.assert(
        "allocation-beacon-evidence",
        reviewerAllocation.evidence.allocationBeaconEvidence,
      );
      schemaValidator.assert(
        "reviewer-allocation-plan",
        reviewerAllocation.evidence.reviewerAllocationPlan,
      );
      schemaValidator.assert(
        "family-allocation-record",
        reviewerAllocation.evidence.familyAllocationRecord,
      );
      schemaValidator.assert(
        "reviewer-capacity-request",
        reviewerAllocation.evidence.capacityRequest,
      );
      schemaValidator.assert(
        "reviewer-capacity-disposition",
        reviewerAllocation.evidence.capacityDisposition,
      );
      for (const judgeAssignment of reviewerAllocation.judgeAssignments) {
        schemaValidator.assert("judge-assignment", judgeAssignment);
      }
      if (
        reviewerAllocation.judgeAssignments.length !==
          expectedFamily.length * 2 ||
        reviewerAllocation.reviewerAllocationPlanDigest !==
          hashCanonical(
            "reviewer-allocation-plan/v1",
            reviewerAllocation.evidence.reviewerAllocationPlan,
          ) ||
        reviewerAllocation.familyAllocationRecordDigest !==
          hashCanonical(
            "family-allocation-record/v1",
            reviewerAllocation.evidence.familyAllocationRecord,
          ) ||
        reviewerAllocation.familyAllocationOrdinal !==
          reviewerAllocation.evidence.familyAllocationRecord
            .allocationOrdinal ||
        reviewerAllocation.registrySnapshotDigest !==
          hashCanonical(
            "reviewer-registry-snapshot/v1",
            reviewerAllocation.evidence.registrySnapshot,
          )
      ) {
        throw new IntegrityError(
          "Persisted reviewer allocation authority roots are unverifiable",
        );
      }
    } else {
      reviewerAllocation =
        await reviewerAllocationAuthority.acquire({
          campaignId,
          campaignSealDigest: seal.sealDigest,
          confirmatoryFamilyId: analysisPlan.multiplicity.familyId,
          assignmentFamily: reviewerAssignmentFamily,
        });
      await publishJson(
        workspaceRoot,
        ".evaluator/protected/reviewer-allocation-authority.json",
        selfSealed(
          "admitted-reviewer-allocation-record/v1",
          "reviewerAllocationRecordDigest",
          {
            campaignId,
            campaignSealDigest: seal.sealDigest,
            allocation: reviewerAllocation,
          },
        ),
        { mode: 0o600 },
      );
    }
    await publishJson(
      workspaceRoot,
      ".evaluator/protected/assignment-map.json",
      assignmentMap,
      { mode: 0o600 },
    );
    const reviewerAssignmentsBySubject = new Map();
    for (const judgeAssignment of reviewerAllocation.judgeAssignments) {
      const slots =
        reviewerAssignmentsBySubject.get(
          judgeAssignment.blindBundleId,
        ) ?? [];
      slots.push(judgeAssignment);
      reviewerAssignmentsBySubject.set(
        judgeAssignment.blindBundleId,
        slots,
      );
    }
    const publicScenarioFor = (scenarioRef) => {
      const scenario = scenariosByRef.get(scenarioRef);
      if (!scenario) {
        throw new IntegrityError(
          "Protected assignment references an unsealed scenario",
          { scenarioRef },
        );
      }
      return {
        scenarioId: scenario.scenarioId,
        workItem: scenario.workItem,
        outcomeAxes: deepCloneCanonical(scenario.outcomeAxes),
        scenarioClass: scenario.scenarioClass,
        requiredCapabilities: deepCloneCanonical(
          scenario.requiredCapabilities,
        ),
        protectedMaterialIncluded: false,
      };
    };

    let envelope = null;
    let grant = null;
    let analysisDetails = null;
    let registeredAnalysis = null;
    let analysis = null;
    let recommendation = null;
    let lineage = null;
    const actionHandlers = {
      "apply-sealed-campaign-policy": async ({ transition }) => ({
        core: {
          action: "apply-sealed-campaign-policy",
          transitionId: transition.transitionId,
          sealDigest: seal.sealDigest,
          executionClass: "sealed_role_campaign",
        },
      }),
      "commit-state-outbox": async ({ transition }) => ({
        core: {
          action: "commit-state-outbox",
          transitionId: transition.transitionId,
          executionClass: "sealed_role_campaign",
        },
      }),
      "reconcile-exact-awareness-universe": async () => {
        if (!envelope || !grant) {
          throw new IntegrityError(
            "Analysis cannot begin before envelope and unmask grant staging",
          );
        }
        return {
          core: {
            action: "reconcile-exact-awareness-universe",
            campaignEvidenceEnvelopeDigest: hashCanonical(
              "campaign-evidence-envelope/v1",
              envelope,
            ),
            awarenessUniverseRoot: envelope.awarenessUniverseRoot,
            allObligationsClosed: true,
          },
        };
      },
      "commit-one-analyst-grant": async () => ({
        core: {
          action: "commit-one-analyst-grant",
          protectedUnmaskGrantDigest: grant.grantCoreDigest,
          analystScope: "registered_fixture_analysis",
        },
      }),
      "execute-registered-analysis": async () => {
        if (!analysis || !analysisDetails || !registeredAnalysis) {
          throw new IntegrityError("Registered analysis has not been staged");
        }
        schemaValidator.assert("analysis-result", analysis);
        await publishJson(
          workspaceRoot,
          ".evaluator/protected/analysis-details.json",
          analysisDetails,
          { mode: 0o600 },
        );
        await publishJson(
          workspaceRoot,
          ".evaluator/protected/registered-analysis-derivation.json",
          registeredAnalysis.derivation,
          { mode: 0o600 },
        );
        await publishJson(
          workspaceRoot,
          "results/analysis-result.json",
          analysis,
        );
        return {
          core: {
            action: "execute-registered-analysis",
            analysisResultDigest: hashCanonical(
              "analysis-result/v1",
              analysis,
            ),
            analysisDetailsDigest: analysisDetails.analysisDetailsDigest,
          },
        };
      },
      "seal-output-first-derivations": async () => ({
        core: {
          action: "seal-output-first-derivations",
          derivationCount: 2,
          sourceDigests: [
            analysisDetails.analysisDetailsDigest,
            registeredAnalysis.derivation.derivationDigest,
          ],
        },
      }),
      "apply-governed-recommendation-policy": async () => ({
        core: {
          action: "apply-governed-recommendation-policy",
          class: recommendation.class,
          promotionAuthorized: false,
        },
      }),
      "render-no-promotion-recommendation": async () => {
        schemaValidator.assert("recommendation", recommendation);
        await publishJson(
          workspaceRoot,
          "results/recommendation.json",
          recommendation,
        );
        return {
          core: {
            action: "render-no-promotion-recommendation",
            recommendationDigest: hashCanonical(
              "campaign-recommendation/v1",
              recommendation,
            ),
            promotionAuthorized: false,
          },
        };
      },
      "verify-complete-pre-handoff-roots": async () => {
        if (!lineage) {
          throw new IntegrityError("Campaign lineage has not been staged");
        }
        schemaValidator.assert("campaign-lineage-disclosure", lineage);
        await publishJson(
          workspaceRoot,
          "results/campaign-lineage-disclosure.json",
          lineage,
        );
        return {
          core: {
            action: "verify-complete-pre-handoff-roots",
            lineageDigest: hashCanonical(
              "campaign-lineage-disclosure/v1",
              lineage,
            ),
            liveAuthorityClaimed: false,
          },
        };
      },
    };
    const guards = {};
    const actions = {};
    const mutations = {};
    for (
      const transitionId of
        SEALED_ROLE_CAMPAIGN_TRANSITION_UNIVERSE
    ) {
      const transition = registry.transition(transitionId);
      guards[transition.guardId] = ({ command }) => ({
        pass:
          command.input?.sealDigest === seal.sealDigest &&
          command.input?.executionClass === "sealed_role_campaign",
        checkedSealDigest: seal.sealDigest,
        executionClass: "sealed_role_campaign",
      });
      mutations[transition.mutationId] = ({
        currentData,
      }) => ({
        ...currentData,
        unmaskStatus:
          transitionId === "EC20"
            ? "unmasked_for_registered_analysis"
            : currentData.unmaskStatus,
      });
      const pipeline = registry.actionPipeline(transition.actionPipelineId);
      for (const descriptor of pipeline.actions) {
        const actionId =
          typeof descriptor === "string" ? descriptor : descriptor.actionId;
        const handler = actionHandlers[actionId];
        if (!handler) {
          throw new IntegrityError(
            "No sealed role implementation exists for canonical campaign action",
            { transitionId, actionId },
          );
        }
        actions[actionId] = handler;
      }
    }
    const lifecycleEngine = new LifecycleEngine({
      registry,
      stateStore,
      authorityReceiptVerifier: new AuthorityReceiptVerifier({
        trustRoot: this.authorityTrustRoot,
        schemaValidator,
      }),
      guards,
      actions,
      mutations,
    });
    const committedThisAdvance = [];
    const executeTransition = async (transitionId, evidenceRoot) => {
      let state = await stateStore.load("campaign", campaignId, {
        required: true,
      });
      const transition = registry.transition(transitionId);
      const commandInput = {
        executionClass: "sealed_role_campaign",
        sealDigest: seal.sealDigest,
        transitionId,
        evidenceRoot,
        provisionalOnly: true,
        promotionAuthorized: false,
      };
      const inputDigest = hashCanonical(
        "campaign-transition-input/v1",
        commandInput,
      );
      const idempotencyKey =
        `${campaignId}/${transitionId}/sealed-role-v1`;
      const existing = state.authoritativeStateCore.eventLedger.find(
        (event) => event.core.transitionId === transitionId,
      );
      if (existing) {
        const participantPolicyDigest =
          registry.participantPolicyDigest(
            transition.participantPolicyId,
          );
        if (
          existing.core.inputDigest !== inputDigest ||
          existing.core.idempotencyKey !== idempotencyKey ||
          existing.core.participantPolicyId !==
            transition.participantPolicyId ||
          existing.core.participantPolicyDigest !==
            participantPolicyDigest ||
          existing.core.parentOrderId !==
            `${campaignId}:sealed-role-plan` ||
          existing.core.parentFence !== 0
        ) {
          throw new IntegrityError(
            "Cold recovery transition replay conflicts with its durable command",
            {
              transitionId,
              durableInputDigest: existing.core.inputDigest,
              replayInputDigest: inputDigest,
            },
          );
        }
        return {
          replayed: true,
          transitionId,
          revision: existing.core.resultingRevision,
          state: transition.toState,
          eventRoot: existing.eventRoot,
          semanticCoreDigest:
            existing.resultingSemanticCoreDigest,
          authoritativeStateRoot: state.authoritativeStateRoot,
          outboxMessageDigests: [],
        };
      }
      if (stateName(state) !== transition.fromState) {
        throw new ConflictError(
          "Cold recovery found a state outside the sealed role campaign plan",
          {
            transitionId,
            expectedState: transition.fromState,
            actualState: stateName(state),
          },
        );
      }
      const policy = registry.participantPolicy(
        transition.participantPolicyId,
      );
      const command = {
        machineId: "campaign",
        objectId: campaignId,
        transitionId,
        expectedRevision:
          state.authoritativeStateCore.semanticState.revision,
        participantPolicyId: transition.participantPolicyId,
        participantPolicyDigest: registry.participantPolicyDigest(
          transition.participantPolicyId,
        ),
        idempotencyKey,
        input: commandInput,
        inputDigest,
        parentOrderId: `${campaignId}:sealed-role-plan`,
        parentFence: 0,
      };
      command.authorizationReceipts =
        await requestExternalAuthorityReceipts({
          provider: this.authorityReceiptProvider,
          policy,
          command,
          machineId: "campaign",
          participantPolicyDigest: command.participantPolicyDigest,
        });
      const result = await lifecycleEngine.execute(command);
      committedThisAdvance.push(result.transitionId);
      if (
        this.crashAfterTransitionId === transitionId &&
        !this.crashInjected
      ) {
        this.crashInjected = true;
        throw new ConflictError(
          "Injected crash after durable sealed role transition",
          { transitionId, revision: result.revision },
        );
      }
      return result;
    };

    const controlAudit = await buildControlAudit({
      campaignId,
      workspaceRoot,
      input,
      seal,
    });
    await publishJson(
      workspaceRoot,
      "results/control-delta-audit.json",
      controlAudit,
    );
    if (!controlAudit.passed) {
      throw new IntegrityError(
        "Pre-execution control audit rejected the registered causal contrast",
        {
          controlDeltaAuditId: controlAudit.controlDeltaAuditId,
          forbiddenDifferencePaths: controlAudit.forbiddenDifferencePaths,
          doctrineLeakTerms: controlAudit.doctrineLeakTerms,
        },
      );
    }
    const expectedExecutionConfiguration =
      buildExecutionConfiguration({
        campaignId,
        campaignSealDigest: seal.sealDigest,
        assignmentMapDigest: assignmentMap.assignmentMapDigest,
        stoppingExecutionPlanDigest:
          stoppingExecutionPlan.stoppingExecutionPlanDigest,
      scenarioMaterialAuthorityEnvelopeDigest:
        scenarioMaterials.authorityEnvelopeDigest,
      scenarioMaterialBundleDigests: scenarioMaterials.materials
          .map((material) => material.materialBundleDigest),
      reviewerAllocationPlanDigest:
        reviewerAllocation.reviewerAllocationPlanDigest,
      familyAllocationRecordDigest:
        reviewerAllocation.familyAllocationRecordDigest,
      reviewerRegistrySnapshotDigest:
        reviewerAllocation.registrySnapshotDigest,
      reviewerFamilyBindingRoot:
        reviewerAllocation.familyBindingRoot,
      controlDeltaAuditDigest: hashCanonical(
        "control-delta-audit/v1",
        controlAudit,
      ),
      controlAuditPolicyDigest: seal.controlAuditPolicyDigest,
        executionProfiles: this.roleExecutionProfiles,
        packageManifest,
        generatedLock,
        candidateArms: seal.candidateArms,
        schemaValidator,
      });
    const executionConfigurationPath = resolveContained(
      workspaceRoot,
      ".evaluator",
      "protected",
      "execution-configuration.json",
    );
    let executionConfiguration;
    if (await exists(executionConfigurationPath)) {
      executionConfiguration = verifyExecutionConfiguration({
        value: await readJsonFile(executionConfigurationPath),
        schemaValidator,
      });
      if (
        canonicalize(executionConfiguration) !==
        canonicalize(expectedExecutionConfiguration)
      ) {
        throw new IntegrityError(
          "Persisted execution configuration conflicts with exact pre-execution inputs",
          {
            expectedExecutionConfigurationDigest:
              expectedExecutionConfiguration
                .executionConfigurationDigest,
            actualExecutionConfigurationDigest:
              executionConfiguration.executionConfigurationDigest,
          },
        );
      }
    } else {
      executionConfiguration = expectedExecutionConfiguration;
      await publishJson(
        workspaceRoot,
        ".evaluator/protected/execution-configuration.json",
        executionConfiguration,
        { mode: 0o600 },
      );
    }
    const preExecutionRoot = executionConfigurationPlanRoot(
      executionConfiguration.executionConfigurationDigest,
    );
    for (const transitionId of ["EC01", "EC03a", "EC04", "EC05"]) {
      await executeTransition(transitionId, preExecutionRoot);
    }

    const directorEvidence = [];
    const surveyEvidence = [];
    const subjectEvidence = [];
    for (const assignment of assignmentMap.assignments) {
      const publicScenario = publicScenarioFor(assignment.scenarioRef);
      const scenarioMaterial = materialFor(assignment.scenarioRef);
      const snapshotPath = resolveContained(
        workspaceRoot,
        assignment.snapshotRef,
      );
      const candidateSnapshot = await readJsonFile(snapshotPath);
      const candidatePayloadRoot = resolveContained(
        dirname(snapshotPath),
        candidateSnapshot.snapshotLayout.payloadDirectory,
      );
      const director = await this.ensureRole({
        roleRunner,
        awarenessLedger,
        workspaceRoot,
        pathPrefix,
        campaignId,
        sealDigest: seal.sealDigest,
        executionConfiguration,
        assignmentRef: assignment.assignmentId,
        roleClass: "synthetic-director",
        workOrderId: `${pathPrefix}-${assignment.assignmentId}-director`,
        inputProjection: {
          assignmentRef: assignment.assignmentId,
          publicScenario,
          privatePersonaBrief:
            deepCloneCanonical(scenarioMaterial.personaBrief),
          scopedPrincipal: {
            principalId: assignment.opaqueSubjectId,
            scope: "disposable_synthetic_session",
          },
          directorVisibleHistory: [],
          respondentTools: [],
        },
        validationContext: {},
      });
      directorEvidence.push(director.evidence);
      const subjectEvidencePath = resolveContained(
        workspaceRoot,
        "evidence",
        "subjects",
        `${assignment.assignmentId}.json`,
      );
      let subject;
      if (await exists(subjectEvidencePath)) {
        subject = verifySelfSealed(
          "survey-subject-execution/v1",
          "subjectExecutionDigest",
          await readJsonFile(subjectEvidencePath),
          "Survey subject execution evidence",
        );
        schemaValidator.assert(
          "survey-subject-execution",
          subject,
        );
        if (
          subject.assignmentRef !== assignment.assignmentId ||
          subject.candidateSnapshotId !==
            candidateSnapshot.candidateSnapshotId ||
          subject.candidatePackageRoot !==
            candidateSnapshot.candidatePackageRoot
        ) {
          throw new IntegrityError(
            "Existing Survey subject evidence changed its sealed assignment binding",
          );
        }
      } else {
        const subjectAdapter = await this.subjectAdapterResolver({
          adapterDescriptor: deepCloneCanonical(candidateSnapshot.adapter),
          candidateSnapshotId: candidateSnapshot.candidateSnapshotId,
          candidatePackageRoot: candidateSnapshot.candidatePackageRoot,
        });
        subject = await executeSurveySubjectAttempt({
          authorityRoot: workspaceRoot,
          attemptRelativePath:
            `.evaluator/subject-attempts/${assignment.assignmentId}`,
          assignmentRef: assignment.assignmentId,
          candidateSnapshot,
          candidatePayloadRoot,
          schemaValidator,
          adapter: subjectAdapter,
          publicScenario,
          directorSessionPlan: director.evidence.content.sessionPlan,
          directorActionProvider: async (context) =>
            this.directorActionProvider({
              ...context,
              scenarioRef: assignment.scenarioRef,
              stratumId: assignment.stratumId,
              sampleOrdinal: assignment.sampleOrdinal,
              publicScenario: deepCloneCanonical(publicScenario),
            }),
        });
        await publishJson(
          workspaceRoot,
          `evidence/subjects/${assignment.assignmentId}.json`,
          subject,
        );
      }
      subjectEvidence.push(subject);
      if (subject.outcomeClass !== "completed") {
        throw new IntegrityError(
          "Survey subject reached a non-completed terminal outcome",
          {
            assignmentId: assignment.assignmentId,
            outcomeClass: subject.outcomeClass,
            outcomeAttribution: subject.outcomeAttribution,
            subjectExecutionDigest:
              subject.subjectExecutionDigest,
          },
        );
      }
      validateArtifact(subject.artifact);
      const executor = await this.ensureRole({
        roleRunner,
        awarenessLedger,
        workspaceRoot,
        pathPrefix,
        campaignId,
        sealDigest: seal.sealDigest,
        executionConfiguration,
        assignmentRef: assignment.assignmentId,
        roleClass: "survey-executor",
        workOrderId: `${pathPrefix}-${assignment.assignmentId}-executor`,
        inputProjection: {
          assignmentRef: assignment.assignmentId,
          subjectExecution: {
            subjectExecutionDigest: subject.subjectExecutionDigest,
            adapterId: subject.adapterId,
            candidateSnapshotId: subject.candidateSnapshotId,
            candidatePackageRoot: subject.candidatePackageRoot,
            terminalObservationDigest: subject.terminalObservationDigest,
            envelopeRef: subject.terminalObservation.envelopeRef,
            artifact: subject.artifact,
          },
          publicScenario,
          projectFixture: {
            fixtureId: `${campaignId}:project-fixture`,
            writable: false,
          },
          candidateSession: director.evidence.content.sessionPlan,
          declaredTools: [],
          postContentAwarenessRequest: "neutral_after_content",
        },
        validationContext: {},
      });
      surveyEvidence.push(executor.evidence);
    }
    const primaryEvidenceRoot = hashCanonical("primary-role-evidence/v1", {
      directorEvidence: directorEvidence
        .map((record) => record.roleEvidenceDigest)
        .sort(),
      surveyEvidence: surveyEvidence
        .map((record) => record.roleEvidenceDigest)
        .sort(),
      subjectEvidence: subjectEvidence
        .map((record) => record.subjectExecutionDigest)
        .sort(),
    });
    for (const transitionId of ["EC08", "EC09", "EC10"]) {
      await executeTransition(transitionId, primaryEvidenceRoot);
    }

    const downstreamEvidence = [];
    for (const survey of surveyEvidence) {
      const downstream = await this.ensureRole({
        roleRunner,
        awarenessLedger,
        workspaceRoot,
        pathPrefix,
        campaignId,
        sealDigest: seal.sealDigest,
        executionConfiguration,
        assignmentRef: survey.assignmentRef,
        roleClass: "downstream-consumer",
        workOrderId: `${pathPrefix}-${survey.assignmentRef}-downstream`,
        inputProjection: {
          assignmentRef: survey.assignmentRef,
          blindSurveyArtifact: survey.content.artifact,
          commonPublicTask: {
            taskId: `${campaignId}:utility-task`,
            objective: "Identify a material risk and an actionable next step.",
          },
          declaredTools: [],
          outputContract: {
            taskCompleted: "boolean",
            findings: "section identifiers only",
          },
          postContentAwarenessRequest: "neutral_after_content",
        },
        validationContext: {},
      });
      downstreamEvidence.push(downstream.evidence);
    }
    const downstreamEvidenceRoot = hashCanonical(
      "downstream-role-evidence/v1",
      downstreamEvidence
        .map((record) => record.roleEvidenceDigest)
        .sort(),
    );
    await executeTransition("EC12", downstreamEvidenceRoot);
    const mechanicalConformance = evaluateMechanicalConformance({
      campaignId,
      assignments: assignmentMap.assignments,
      subjectEvidence,
      surveyEvidence,
      downstreamEvidence,
      schemaValidator,
    });
    await publishJson(
      workspaceRoot,
      "results/mechanical-conformance.json",
      mechanicalConformance,
    );
    await executeTransition(
      "EC13",
      mechanicalConformance.mechanicalConformanceDigest,
    );
    if (!mechanicalConformance.passed) {
      throw new IntegrityError(
        "Objective mechanical incidents require a sealed incident-review allocation before judging can begin",
        {
          mechanicalConformanceDigest:
            mechanicalConformance.mechanicalConformanceDigest,
          incidentObservationCount:
            mechanicalConformance.incidentObservations.length,
        },
      );
    }
    const incidentSkipRoot = hashCanonical(
      "execution-incident-skip/v1",
      {
        mechanicalConformanceDigest:
          mechanicalConformance.mechanicalConformanceDigest,
        incidentObservationCount: 0,
        skipAuthority: "objective_mechanical_lens",
      },
    );
    await executeTransition("EC32", incidentSkipRoot);
    await executeTransition("EC14", incidentSkipRoot);
    await executeTransition(
      "EC15",
      hashCanonical("pre-judging-evidence-freeze/v1", {
        downstreamEvidenceRoot,
        mechanicalConformanceDigest:
          mechanicalConformance.mechanicalConformanceDigest,
        incidentSkipRoot,
        reviewerAllocationPlanDigest:
          reviewerAllocation.reviewerAllocationPlanDigest,
      }),
    );

    const judgeEvidence = [];
    const assignmentsById = new Map(
      assignmentMap.assignments.map((assignment) => [
        assignment.assignmentId,
        assignment,
      ]),
    );
    for (const survey of surveyEvidence) {
      const assignment = assignmentsById.get(survey.assignmentRef);
      if (!assignment) {
        throw new IntegrityError(
          "Blind survey evidence has no sealed assignment",
          { assignmentRef: survey.assignmentRef },
        );
      }
      const scenarioMaterial = materialFor(assignment.scenarioRef);
      const reviewerAssignments =
        reviewerAssignmentsBySubject.get(assignment.opaqueSubjectId) ?? [];
      if (reviewerAssignments.length !== 2) {
        throw new IntegrityError(
          "Sealed assignment does not have exactly two external reviewer slots",
          {
            assignmentRef: assignment.assignmentId,
            reviewerSlotCount: reviewerAssignments.length,
          },
        );
      }
      for (const reviewAssignment of reviewerAssignments) {
        const workOrderSuffix = hashCanonical(
          "semantic-review-work-order/v1",
          {
            stableSlotKey: reviewAssignment.stableSlotKey,
            opaqueReviewerId: reviewAssignment.opaqueReviewerId,
          },
        ).slice(0, 20);
        const judge = await this.ensureRole({
          roleRunner,
          awarenessLedger,
          workspaceRoot,
          pathPrefix,
          campaignId,
          sealDigest: seal.sealDigest,
          executionConfiguration,
          assignmentRef: survey.assignmentRef,
          roleClass: "semantic-judge",
          workOrderId:
            `${pathPrefix}-${survey.assignmentRef}-review-${workOrderSuffix}`,
          inputProjection: {
            reviewRef: reviewAssignment.judgeAssignmentId,
            reviewAssignment:
              deepCloneCanonical(reviewAssignment),
            blindEvidenceBundle: {
              artifact: survey.content.artifact,
              contentDigest: survey.contentDigest,
            },
            semanticKey:
              deepCloneCanonical(scenarioMaterial.semanticKey),
            rubric: deepCloneCanonical(scenarioMaterial.rubric),
            postContentAwarenessRequest: "neutral_after_content",
          },
          validationContext: { rubric: scenarioMaterial.rubric },
        });
        judgeEvidence.push(judge.evidence);
      }
    }
    const ballotRoot = hashCanonical(
      "sealed-independent-ballots/v1",
      judgeEvidence.map((record) => record.roleEvidenceDigest).sort(),
    );
    await executeTransition("EC16", ballotRoot);

    const disagreements = [];
    for (const survey of surveyEvidence) {
      const assignment = assignmentsById.get(survey.assignmentRef);
      const scenarioMaterial = materialFor(assignment.scenarioRef);
      const ballots = judgeEvidence
        .filter((record) => record.assignmentRef === survey.assignmentRef)
        .map((record) => record.content.ballot);
      const disagreementSet = scenarioMaterial.rubric.dimensions
        .filter(
          (dimension) =>
            new Set(
              ballots.map(
                (ballot) => ballot.scores[dimension.dimensionId],
              ),
            ).size > 1,
        )
        .map((dimension) => ({
          dimensionId: dimension.dimensionId,
          sealedBallotIds: ballots.map((ballot) => ballot.ballotId).sort(),
        }));
      if (disagreementSet.length > 0) {
        disagreements.push({
          assignmentRef: survey.assignmentRef,
          artifact: survey.content.artifact,
          contentDigest: survey.contentDigest,
          ballots,
          disagreementSet,
        });
      }
    }
    const adjudicationEvidence = [];
    let adjudicationRoot;
    if (disagreements.length > 0) {
      await executeTransition(
        "EC17",
        hashCanonical("registered-disagreement-set/v1", disagreements),
      );
      for (const disagreement of disagreements) {
        const adjudication = await this.ensureRole({
          roleRunner,
          awarenessLedger,
          workspaceRoot,
          pathPrefix,
          campaignId,
          sealDigest: seal.sealDigest,
          executionConfiguration,
          assignmentRef: disagreement.assignmentRef,
          roleClass: "adjudicator",
          workOrderId:
            `${pathPrefix}-${disagreement.assignmentRef}-adjudicator`,
          inputProjection: {
            adjudicationRef:
              `${disagreement.assignmentRef}:adjudication`,
            frozenBlindBundle: {
              artifact: disagreement.artifact,
              contentDigest: disagreement.contentDigest,
            },
            sealedBallots: disagreement.ballots,
            disagreementSet: disagreement.disagreementSet,
            postContentAwarenessRequest: "neutral_after_content",
          },
          validationContext: {
            disagreementSet: disagreement.disagreementSet,
          },
        });
        adjudicationEvidence.push(adjudication.evidence);
      }
      adjudicationRoot = hashCanonical(
        "sealed-adjudications/v1",
        adjudicationEvidence
          .map((record) => record.roleEvidenceDigest)
          .sort(),
      );
      await executeTransition("EC19", adjudicationRoot);
    } else {
      adjudicationRoot = hashCanonical(
        "sealed-adjudication-skip/v1",
        {
          campaignId,
          ballotRoot,
          registeredDisagreementCount: 0,
        },
      );
      await executeTransition("EC18", adjudicationRoot);
    }
    for (const transitionId of ["EC35", "EC33"]) {
      await executeTransition(transitionId, adjudicationRoot);
    }

    const expectedObligationIds = [];
    for (const record of [
      ...surveyEvidence,
      ...downstreamEvidence,
      ...judgeEvidence,
      ...adjudicationEvidence,
    ]) {
      expectedObligationIds.push(
        `${pathPrefix}-${hashCanonical("awareness-obligation-id/v1", {
          workOrderId: record.workOrderId,
        }).slice(0, 24)}`,
      );
    }
    expectedObligationIds.sort();
    const awarenessRows = [];
    for (const obligationId of expectedObligationIds) {
      const record = await awarenessLedger.load(obligationId, {
        required: true,
      });
      if (record.state !== "AW4_CLOSED") {
        throw new ConflictError(
          "Protected analysis is fenced until every awareness role closes",
          { obligationId, state: record.state },
        );
      }
      awarenessRows.push(record);
    }
    const allRoleEvidence = [
      ...directorEvidence,
      ...surveyEvidence,
      ...downstreamEvidence,
      ...judgeEvidence,
      ...adjudicationEvidence,
    ];
    const governanceEvidenceRoots = [
      stoppingExecutionPlan.stoppingExecutionPlanDigest,
      executionConfiguration.executionConfigurationDigest,
      scenarioMaterials.authorityEnvelopeDigest,
      reviewerAllocation.reviewerAllocationPlanDigest,
      reviewerAllocation.familyAllocationRecordDigest,
      reviewerAllocation.registrySnapshotDigest,
      mechanicalConformance.mechanicalConformanceDigest,
      hashCanonical("control-delta-audit/v1", controlAudit),
    ];
    const envelopeFreezeState = await stateStore.load(
      "campaign",
      campaignId,
      { required: true },
    );
    const unmaskEvent =
      envelopeFreezeState.authoritativeStateCore.eventLedger.find(
        (event) => event.core.transitionId === "EC20",
      );
    const unmaskFence =
      unmaskEvent?.core.resultingRevision ??
      envelopeFreezeState.authoritativeStateCore.semanticState.revision + 1;
    const expectedEnvelope = makeEnvelope({
      campaignId,
      sealDigest: seal.sealDigest,
      revision:
        unmaskEvent?.core.priorRevision ??
        envelopeFreezeState.authoritativeStateCore.semanticState.revision,
      assignments: assignmentMap.assignments,
      roleEvidence: allRoleEvidence,
      subjectEvidence,
      awarenessRows,
      assignmentMapDigest: assignmentMap.assignmentMapDigest,
      governanceEvidenceRoots,
      fixtureOnly,
    });
    schemaValidator.assert("campaign-evidence-envelope", expectedEnvelope);
    const envelopePath = resolveContained(
      workspaceRoot,
      "results",
      "campaign-evidence-envelope.json",
    );
    if (await exists(envelopePath)) {
      envelope = await readJsonFile(envelopePath);
      schemaValidator.assert("campaign-evidence-envelope", envelope);
      if (
        canonicalize(envelope) !== canonicalize(expectedEnvelope)
      ) {
        throw new IntegrityError(
          "Existing campaign envelope conflicts with exact frozen campaign evidence",
          {
            expectedEnvelopeDigest: hashCanonical(
              "campaign-evidence-envelope/v1",
              expectedEnvelope,
            ),
            actualEnvelopeDigest: hashCanonical(
              "campaign-evidence-envelope/v1",
              envelope,
            ),
          },
        );
      }
    } else {
      envelope = expectedEnvelope;
      await publishJson(
        workspaceRoot,
        "results/campaign-evidence-envelope.json",
        envelope,
      );
    }
    const envelopeDigest = hashCanonical(
      "campaign-evidence-envelope/v1",
      envelope,
    );
    const grantId = `${pathPrefix}-analyst-grant`;
    const grantPath = resolveContained(
      workspaceRoot,
      ".evaluator",
      "role-protocol",
      "awareness",
      "unmask-grants",
      `${grantId}.json`,
    );
    if (await exists(grantPath)) {
      grant = await readJsonFile(grantPath);
      verifySelfSealed(
        "protected-unmask-grant/v1",
        "grantCoreDigest",
        grant,
        "Protected unmask grant",
      );
      schemaValidator.assert("protected-unmask-grant", grant);
      if (
        canonicalize(grant.expectedObligationIds) !==
          canonicalize(expectedObligationIds) ||
        grant.protectedArmMapDigest !==
          assignmentMap.assignmentMapDigest ||
        grant.campaignEvidenceEnvelopeDigest !== envelopeDigest ||
        grant.campaignId !== campaignId ||
        grant.unmaskFence !== unmaskFence ||
        grant.transitionId !== "EC20"
      ) {
        throw new IntegrityError(
          "Existing protected unmask grant changed its closed universe",
        );
      }
    } else {
      grant = (
        await awarenessLedger.issueUnmaskGrant({
          grantId,
          campaignId,
          expectedObligationIds,
          armMapDigest: assignmentMap.assignmentMapDigest,
          analystScope: {
            analysisPlanRef: input.analysisPlanRef,
            registeredDimensions: [
              ...new Set(
                [
                  ...analysisPlan.primaryMetricIds,
                  ...analysisPlan.secondaryMetricIds,
                  ...analysisPlan.diagnosticMetricIds,
                ],
              ),
            ].sort(compareUtf8),
            fixtureOnly,
          },
          campaignEvidenceEnvelopeDigest: envelopeDigest,
          unmaskFence,
        })
      ).grant;
    }
    const unmaskTransitionResult =
      await executeTransition("EC20", grant.grantCoreDigest);
    await awarenessLedger.disposeUnmaskGrant({
      grant,
      disposition: "consumed",
      dispositionCauseRoot: unmaskTransitionResult.eventRoot,
      campaignEventRoot: unmaskTransitionResult.eventRoot,
      sourcePhase: registry.transition("EC20").toState,
    });

    analysisDetails = buildAnalysisDetails({
      campaignId,
      assignmentMap,
      directorEvidence,
      surveyEvidence,
      downstreamEvidence,
      judgeEvidence,
      adjudicationEvidence,
      grant,
      scenariosByRef,
      materialsByRef,
      mechanicalConformance,
    });
    registeredAnalysis = analyzeCampaignAssignments({
      campaignId,
      analysisPlan,
      metricRegistry,
      dependencePlan: seal.dependencePlan,
      assignmentResults: analysisDetails.assignmentResults,
      evidenceRefs: [
        ...analysisDetails.sourceRoleEvidenceDigests,
        ...subjectEvidence.map((record) => record.subjectExecutionDigest),
        stoppingExecutionPlan.stoppingExecutionPlanDigest,
        executionConfiguration.executionConfigurationDigest,
        scenarioMaterials.authorityEnvelopeDigest,
        reviewerAllocation.familyAllocationRecordDigest,
        mechanicalConformance.mechanicalConformanceDigest,
        hashCanonical("control-delta-audit/v1", controlAudit),
      ],
    });
    analysis = buildRoleAnalysis({
      campaignId,
      analysisPlan,
      envelope,
      grant,
      analysisDetails,
      softwareDigest: packageManifest.payloadRoot,
      assignmentCount: assignmentMap.assignments.length,
      registeredAnalysis,
    });
    recommendation = buildRoleRecommendation({
      campaignId,
      analysisPlan,
      analysis,
      fixtureOnly,
    });
    lineage = buildRoleLineage({
      campaignId,
      analysisPlan,
      envelope,
      grant,
      analysis,
      recommendation,
      familyAllocationOrdinal:
        reviewerAllocation.familyAllocationOrdinal,
      mechanicalConformanceDigest:
        mechanicalConformance.mechanicalConformanceDigest,
      fixtureOnly,
    });
    for (const transitionId of ["EC21", "EC22", "EC38", "EC23"]) {
      const root =
        transitionId === "EC21"
          ? analysisDetails.analysisDetailsDigest
          : transitionId === "EC22"
            ? hashCanonical("campaign-recommendation/v1", recommendation)
            : hashCanonical("campaign-lineage-disclosure/v1", lineage);
      await executeTransition(transitionId, root);
    }

    const finalState = await stateStore.load("campaign", campaignId, {
      required: true,
    });
    return {
      executionClass: "sealed_role_campaign",
      evidenceClass: fixtureOnly
        ? "known_answer_protocol_integration"
        : "attested_provider_evaluation",
      assuranceLevel: fixtureOnly
        ? "known_answer_e0_e5_protocol_plumbing_only"
        : "evaluation_evidence_only",
      gateClaimCeiling: fixtureOnly ? "E5" : null,
      excludedGateClaims: fixtureOnly ? ["E6", "E7"] : [],
      candidateExecutionBoundary: fixtureOnly
        ? "supplied_host_subject_adapter_fixture"
        : "supplied_host_subject_adapter",
      surveyEfficacyClaimed: false,
      blindPilotClaimed: false,
      liveAuthorityClaimed: false,
      mode,
      campaignId,
      state: stateName(finalState),
      revision:
        finalState.authoritativeStateCore.semanticState.revision,
      authoritativeStateRoot: finalState.authoritativeStateRoot,
      committedTransitions: committedThisAdvance,
      assignmentCount: assignmentMap.assignments.length,
      stoppingExecutionPlanDigest:
        stoppingExecutionPlan.stoppingExecutionPlanDigest,
      executionConfigurationDigest:
        executionConfiguration.executionConfigurationDigest,
      stoppingExecutionClass:
        stoppingExecutionPlan.executionClass,
      interimOutcomeLookCount:
        stoppingExecutionPlan.interimOutcomeLookCount,
      subjectExecutionCount: subjectEvidence.length,
      scenarioMaterialCount: scenarioMaterials.materials.length,
      scenarioMaterialAuthorityEnvelopeDigest:
        scenarioMaterials.authorityEnvelopeDigest,
      reviewerAllocationPlanDigest:
        reviewerAllocation.reviewerAllocationPlanDigest,
      familyAllocationRecordDigest:
        reviewerAllocation.familyAllocationRecordDigest,
      familyAllocationOrdinal:
        reviewerAllocation.familyAllocationOrdinal,
      surveyExecutionCount: surveyEvidence.length,
      downstreamExecutionCount: downstreamEvidence.length,
      independentBallotCount: judgeEvidence.length,
      adjudicationCount: adjudicationEvidence.length,
      awarenessObligationCount: expectedObligationIds.length,
      awarenessClosedBeforeUnmask: true,
      campaignEvidenceEnvelopeDigest: envelopeDigest,
      protectedUnmaskGrantDigest: grant.grantCoreDigest,
      analysisDetailsDigest: analysisDetails.analysisDetailsDigest,
      analysisDerivationDigest:
        registeredAnalysis.derivation.derivationDigest,
      controlDeltaAuditDigest: hashCanonical(
        "control-delta-audit/v1",
        controlAudit,
      ),
      promotionAuthorized: false,
    };
  }
}
