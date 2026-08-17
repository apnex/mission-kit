import { mkdir } from "node:fs/promises";
import {
  assertNoSymlinkAncestors,
  readFileNoFollow,
  readJsonFile,
  resolveContained,
} from "../engine/atomic-fs.mjs";
import {
  canonicalBytes,
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
  rawSha256,
} from "../engine/hash.mjs";
import {
  verifySurveySubjectAdapterDescriptor,
} from "./subject-adapter-contract.mjs";

const REQUIRED_ADAPTER_METHODS = Object.freeze([
  "action",
  "coldResume",
  "describe",
  "initialize",
  "observe",
  "stage",
]);

function assertExactObject(value, keys, label) {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    ![Object.prototype, null].includes(Object.getPrototypeOf(value))
  ) {
    throw new ValidationError(`${label} must be a plain object`);
  }
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (canonicalBytes(actual).compare(canonicalBytes(expected)) !== 0) {
    throw new ValidationError(`${label} has an unauthorized field set`, {
      expected,
      actual,
    });
  }
}

function assertAdapter(adapter, expectedDescriptor) {
  if (!adapter || typeof adapter !== "object") {
    throw new ValidationError("Survey subject resolver returned no adapter");
  }
  for (const method of REQUIRED_ADAPTER_METHODS) {
    if (typeof adapter[method] !== "function") {
      throw new ValidationError(
        `Survey subject adapter is missing ${method}`,
      );
    }
  }
  const descriptor = verifySurveySubjectAdapterDescriptor(adapter.describe());
  if (
    canonicalBytes(descriptor).compare(
      canonicalBytes(expectedDescriptor),
    ) !== 0
  ) {
    throw new IntegrityError(
      "Resolved Survey subject adapter differs from the sealed candidate binding",
      {
        expectedAdapterId: expectedDescriptor.adapterId,
        actualAdapterId: descriptor.adapterId,
      },
    );
  }
  return descriptor;
}

function assertSameObservation(left, right, label) {
  if (canonicalBytes(left).compare(canonicalBytes(right)) !== 0) {
    throw new IntegrityError(
      `Survey subject ${label} did not return the exact authoritative observation`,
      {
        expectedStateRoot: left.subjectStateRoot,
        actualStateRoot: right.subjectStateRoot,
      },
    );
  }
}

function observationDigest(value) {
  return hashCanonical("survey-subject-observation/v1", value);
}

function executionEvidence(core) {
  return deepFreeze({
    ...core,
    subjectExecutionDigest: hashCanonical(
      "survey-subject-execution/v1",
      core,
    ),
  });
}

/**
 * Executes one captured Survey subject through the sovereign adapter surface.
 *
 * The adapter supplies host runtime semantics. This coordinator supplies only
 * sealed staging, action dispatch, exact observation/cold-resume checks, and
 * evidence capture; it never interprets Survey protocol state internally.
 */
export async function executeSurveySubjectAttempt({
  authorityRoot,
  attemptRelativePath,
  assignmentRef,
  candidateSnapshot,
  candidatePayloadRoot,
  schemaValidator,
  adapter,
  publicScenario,
  directorSessionPlan,
  directorActionProvider,
  maximumActions = 64,
}) {
  if (
    typeof assignmentRef !== "string" ||
    assignmentRef.length === 0 ||
    typeof attemptRelativePath !== "string" ||
    attemptRelativePath.length === 0
  ) {
    throw new ValidationError(
      "Survey subject attempt requires stable assignment and path identities",
    );
  }
  if (
    !Number.isSafeInteger(maximumActions) ||
    maximumActions < 1 ||
    maximumActions > 10_000
  ) {
    throw new ValidationError(
      "Survey subject action budget must be an integer in [1, 10000]",
    );
  }
  if (typeof directorActionProvider !== "function") {
    throw new ValidationError(
      "Survey subject execution requires a Director action provider",
    );
  }

  const descriptor = assertAdapter(
    adapter,
    verifySurveySubjectAdapterDescriptor(candidateSnapshot.adapter),
  );
  const attemptRoot = resolveContained(
    authorityRoot,
    ...attemptRelativePath.split("/"),
  );
  await assertNoSymlinkAncestors(authorityRoot, attemptRoot);
  await mkdir(attemptRoot, { recursive: true, mode: 0o700 });
  const artifactRoot = resolveContained(attemptRoot, "artifacts");
  await mkdir(artifactRoot, { recursive: true, mode: 0o700 });
  const artifactDestination = resolveContained(
    artifactRoot,
    "survey-artifact.json",
  );

  const stageReceipt = await adapter.stage({
    candidateBundle: {
      snapshot: deepCloneCanonical(candidateSnapshot),
      payloadRoot: candidatePayloadRoot,
      schemaValidator,
    },
    attemptRoot,
  });
  if (
    stageReceipt.candidateSnapshotId !==
      candidateSnapshot.candidateSnapshotId ||
    stageReceipt.candidatePackageRoot !==
      candidateSnapshot.candidatePackageRoot ||
    stageReceipt.adapterDescriptorDigest !==
      descriptor.adapterDescriptorDigest
  ) {
    throw new IntegrityError(
      "Survey subject stage receipt changed its sealed candidate identity",
    );
  }

  const attemptId = `${assignmentRef}:survey-subject`;
  let observation = await adapter.initialize({
    attemptId,
    stagedSkillRoot: stageReceipt.stagedSkillRoot,
    publicScenario: deepCloneCanonical(publicScenario),
    artifactDestination,
  });
  const initialObservation = deepCloneCanonical(observation);
  const observed = await adapter.observe({
    sessionRef: observation.sessionRef,
  });
  assertSameObservation(observation, observed, "observe");
  const resumed = await adapter.coldResume({
    sessionRef: observation.sessionRef,
    expectedStateRoot: observation.subjectStateRoot,
  });
  assertSameObservation(observation, resumed, "cold resume");

  const receipts = [];
  const directorHistory = [];
  while (observation.terminalClass === "nonterminal") {
    if (receipts.length >= maximumActions) {
      throw new IntegrityError(
        "Survey subject exceeded its sealed Director action budget",
        {
          assignmentRef,
          maximumActions,
          subjectStateRoot: observation.subjectStateRoot,
        },
      );
    }
    const proposed = deepCloneCanonical(
      await directorActionProvider({
        assignmentRef,
        actionOrdinal: receipts.length + 1,
        observation: deepCloneCanonical(observation),
        directorSessionPlan: deepCloneCanonical(directorSessionPlan),
        directorHistory: deepCloneCanonical(directorHistory),
        publicActionClasses: [...descriptor.publicActionClasses],
      }),
    );
    assertExactObject(
      proposed,
      ["actionClass", "payload"],
      "Synthetic Director action",
    );
    if (
      typeof proposed.actionClass !== "string" ||
      !descriptor.publicActionClasses.includes(proposed.actionClass)
    ) {
      throw new ValidationError(
        "Synthetic Director proposed an action outside the Survey adapter contract",
        { actionClass: proposed.actionClass, adapterId: descriptor.adapterId },
      );
    }
    if (
      proposed.payload === null ||
      typeof proposed.payload !== "object" ||
      Array.isArray(proposed.payload)
    ) {
      throw new ValidationError(
        "Synthetic Director action payload must be a plain JSON object",
      );
    }
    const request = {
      sessionRef: observation.sessionRef,
      actionId: `${assignmentRef}:subject-action:${receipts.length + 1}`,
      expectedStateRoot: observation.subjectStateRoot,
      directorAction: proposed,
    };
    const receipt = await adapter.action(request);
    const afterAction = await adapter.observe({
      sessionRef: observation.sessionRef,
    });
    assertSameObservation(receipt.observation, afterAction, "post-action observe");
    directorHistory.push({
      observationDigest: observationDigest(observation),
      actionId: receipt.actionId,
      actionClass: proposed.actionClass,
      actionAccepted: receipt.accepted,
      eventRoot: receipt.eventRoot,
    });
    receipts.push(deepCloneCanonical(receipt));
    observation = afterAction;
  }

  const commonCore = {
    schemaVersion: "1.0.0",
    hashProfileId: HASH_PROFILE_ID,
    subjectExecutionId: `${assignmentRef}:subject-execution`,
    assignmentRef,
    adapterId: descriptor.adapterId,
    adapterDescriptorDigest: descriptor.adapterDescriptorDigest,
    runtimeSemanticsAuthority: descriptor.runtimeSemanticsAuthority,
    nativeRuntimeSemanticsClaimed: false,
    candidateSnapshotId: candidateSnapshot.candidateSnapshotId,
    candidatePackageRoot: candidateSnapshot.candidatePackageRoot,
    stageReceipt: deepCloneCanonical(stageReceipt),
    initialObservationDigest: observationDigest(initialObservation),
    coldResumeVerifiedStateRoot: resumed.subjectStateRoot,
    actionReceiptDigests: receipts.map((receipt) =>
      hashCanonical("survey-subject-action-receipt/v1", receipt)
    ),
    directorHistory,
    terminalObservation: deepCloneCanonical(observation),
    terminalObservationDigest: observationDigest(observation),
  };
  if (
    observation.terminalClass !== "completed" ||
    observation.envelopeRef === null
  ) {
    const evidence = executionEvidence({
      ...commonCore,
      outcomeClass: observation.terminalClass,
      outcomeAttribution: "unresolved",
      artifact: null,
      artifactRawSha256: null,
      artifactSemanticDigest: null,
      immutable: true,
    });
    schemaValidator.assert(
      "survey-subject-execution",
      evidence,
    );
    return evidence;
  }

  await assertNoSymlinkAncestors(attemptRoot, artifactDestination);
  const artifactBytes = await readFileNoFollow(artifactDestination);
  const artifact = await readJsonFile(artifactDestination);
  const evidence = executionEvidence({
    ...commonCore,
    outcomeClass: "completed",
    outcomeAttribution: "observed_success",
    artifact: deepCloneCanonical(artifact),
    artifactRawSha256: rawSha256(artifactBytes),
    artifactSemanticDigest: hashCanonical(
      "survey-subject-artifact/v1",
      artifact,
    ),
    immutable: true,
  });
  schemaValidator.assert("survey-subject-execution", evidence);
  return evidence;
}
