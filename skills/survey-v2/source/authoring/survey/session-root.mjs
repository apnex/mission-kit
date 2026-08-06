import candidateProjectionLock from "../../../generated/projection-lock.json"
  with { type: "json" };
import candidateSurveyProtocol from "../../protocol/survey-v2.protocol.json"
  with { type: "json" };
import axiomDependency from "../../dependencies/references/mission-kit-axioms.reference.json"
  with { type: "json" };
import {
  sha256Value,
  stableValue,
} from "../kernel/canonical.mjs";
import {
  resourceReferenceFrom,
} from "../kernel/digests.mjs";
import {
  resealWorkspace,
  storedResourceVersionFromResource,
} from "../runtime/workspace-application.mjs";

export const SURVEY_V2_SESSION_SCHEMA =
  "urn:mission-kit:survey-v2:schema:session-state:v2";
export const SURVEY_V2_PACKAGE_ID =
  "urn:mission-kit:survey-v2:package:survey-v2";
export const SURVEY_V2_PROTOCOL_ID =
  "urn:mission-kit:survey-v2:protocol:survey";
export const SURVEY_V2_DEPENDENCY_ID = axiomDependency.id;

const zeroDigest = `sha256:${"0".repeat(64)}`;
const slugPattern = /^[a-z0-9][a-z0-9-]{0,79}$/u;
const sessionIdPattern = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/u;

function fail(message) {
  throw new TypeError(message);
}

function assertIdentity(value, pattern, label) {
  if (typeof value !== "string" || !pattern.test(value)) {
    fail(`${label} is not a safe bounded identity`);
  }
  return value;
}

function assertAuthority(value) {
  const stable = stableValue(value);
  if (
    Object.keys(stable).sort().join("\u0000") !==
      ["bindingEvidence", "directorRef", "proposerRef"]
        .sort()
        .join("\u0000") ||
    Object.values(stable).some(
      (entry) =>
        typeof entry !== "string" ||
        entry.length < 1 ||
        entry.length > 512 ||
        !entry.isWellFormed(),
    )
  ) {
    fail(
      "authority must contain exactly three bounded nonempty string bindings",
    );
  }
  return stable;
}

export function surveyPolicyInput(profileAuthority) {
  const profile = profileAuthority?.profile;
  if (!profile?.spec) {
    fail("the exact Survey profile authority is required");
  }
  const schemaBindings = profile.spec.schemaBindings.map(
    (binding) => ({
      id: binding.id,
      digest: binding.schema.digest,
    }),
  );
  const validatorBindings = profile.spec.validatorSets.flatMap(
    (validatorSet) =>
      validatorSet.members.map((member) => ({
        id: member.id,
        digest: member.digest,
      })),
  );
  const initialization = profile.spec.transitionBindings.find(
    (binding) => binding.transitionId === "AT01",
  );
  const surveyFrame = profile.spec.tasks.find(
    (task) => task.id === "author-survey-frame",
  );
  if (!initialization || !surveyFrame) {
    fail("the Survey profile lacks its initialization closure");
  }
  const selectorBindings = [
    ...initialization.inputSelectors,
    ...surveyFrame.contextSelectors,
  ].map((selector) => ({
    id: selector.id,
    digest: selector.selectorDigest,
  }));
  return stableValue({
    profile,
    schemaBindings,
    validatorBindings,
    selectorBindings,
  });
}

export function createSurveyGenesisWorkspace({
  slug,
  profileAuthority,
  sourceSnapshot,
  policySnapshot,
}) {
  assertIdentity(slug, slugPattern, "slug");
  const profile = profileAuthority?.profile;
  const protocol = profileAuthority?.protocol;
  if (!profile || !protocol) {
    fail("profileAuthority must contain profile and protocol");
  }
  const workspace = {
    apiVersion: "authoring.mission-kit/v1alpha1",
    kind: "AuthoringWorkspace",
    metadata: { name: `${slug}-authoring` },
    spec: {
      profile: {
        reference: resourceReferenceFrom(profile),
        profileDigest: profile.spec.profileDigest,
      },
      protocol: {
        reference: resourceReferenceFrom(protocol),
        protocolDigest: resourceReferenceFrom(protocol)
          .semanticDigest,
      },
      authoringState: "new",
      semanticRevision: 0,
      evidenceRevision: 0,
      resourceVersions: [
        storedResourceVersionFromResource(sourceSnapshot),
        storedResourceVersionFromResource(policySnapshot),
        storedResourceVersionFromResource(profile),
        ...profileAuthority.resources.map(
          storedResourceVersionFromResource,
        ),
      ],
      activeHeads: [
        {
          slot: "intake",
          reference: resourceReferenceFrom(sourceSnapshot),
        },
        {
          slot: "policy",
          reference: resourceReferenceFrom(policySnapshot),
        },
      ],
      dependencyEdges: [],
      handoffProducts: [],
      history: [],
      openAssignment: null,
      integrity: {
        semanticStateDigest: zeroDigest,
        workspaceIntegrityDigest: zeroDigest,
      },
    },
  };
  return resealWorkspace(workspace);
}

function initializationReceipt({
  sessionId,
  pendingInputDigest,
  axiomCorpus,
  dependencySnapshot,
  resolverAttempt,
}) {
  const applicable = axiomCorpus === true;
  if (
    applicable !== (dependencySnapshot !== undefined) ||
    applicable !== (resolverAttempt !== undefined)
  ) {
    fail(
      "axiomCorpus, dependencySnapshot, and resolverAttempt must describe the same applicability",
    );
  }
  const body = {
    receiptId: `${sessionId}:init-resolve:1`,
    dependencyId: axiomDependency.id,
    hook: "init-resolve",
    applicability: applicable
      ? "applicable"
      : "not-applicable",
    evaluatedFactsDigest: sha256Value({ axiomCorpus }),
    pendingInputDigest,
    resolverAttemptId: applicable
      ? resolverAttempt.attemptId
      : null,
    remainingStages: applicable
      ? ["commit-r1", "commit-r2", "pre-candidate", "rehydrate"]
      : [],
    producedBy: "deterministic-runtime",
    ...(applicable
      ? { snapshot: stableValue(dependencySnapshot) }
      : {}),
  };
  return {
    ...body,
    resultDigest: sha256Value(body),
  };
}

function rehydrationProof({
  pendingInputDigest,
  receipt,
  dependencySnapshot,
}) {
  const body = {
    hook: "rehydrate",
    phase: "initialized",
    pendingInputDigest,
    initializationResultDigest: receipt.resultDigest,
    frozenSnapshotDigest:
      dependencySnapshot?.aggregateDigest ?? null,
    previousEventDigest: null,
    complete: true,
    producedBy: "deterministic-runtime",
  };
  return {
    ...body,
    resultDigest: sha256Value(body),
  };
}

export function createCandidateSessionSkeleton({
  slug,
  sessionId,
  profileAuthority,
  sourceSnapshot,
  policySnapshot,
  workspace,
  authority,
  axiomCorpus = false,
  dependencySnapshot,
  resolverAttempt,
  requestedArtifactPath = `${slug}-survey.md`,
  lineage = {
    parentSessionId: null,
    restartReason: null,
    parentEvidence: [],
  },
}) {
  assertIdentity(slug, slugPattern, "slug");
  assertIdentity(sessionId, sessionIdPattern, "sessionId");
  if (typeof axiomCorpus !== "boolean") {
    fail("axiomCorpus must be Boolean");
  }
  const stableAuthority = assertAuthority(authority);
  const sourceSnapshotRef = resourceReferenceFrom(sourceSnapshot);
  const policySnapshotRef = resourceReferenceFrom(policySnapshot);
  const stableLineage = stableValue(lineage);
  const pendingInputCore = {
    domain: "mission-kit:survey-v2:candidate-input/v1",
    slug,
    lineage: stableLineage,
    authority: stableAuthority,
    sourceSnapshotRef,
    policySnapshotRef,
    requestedArtifactPath,
    axiomCorpus,
    dependencies: [{
      id: axiomDependency.id,
      descriptorDigest: sha256Value(axiomDependency),
    }],
  };
  const pendingInputDigest = sha256Value(pendingInputCore);
  const receipt = initializationReceipt({
    sessionId,
    pendingInputDigest,
    axiomCorpus,
    dependencySnapshot,
    resolverAttempt,
  });
  const proof = rehydrationProof({
    pendingInputDigest,
    receipt,
    dependencySnapshot,
  });
  return stableValue({
    $schema: SURVEY_V2_SESSION_SCHEMA,
    schemaVersion: "2.0.0",
    sessionId,
    slug,
    package: {
      id: SURVEY_V2_PACKAGE_ID,
      version: "2.0.0",
      projectionDigest:
        candidateProjectionLock.aggregateDigest,
    },
    protocol: {
      id: SURVEY_V2_PROTOCOL_ID,
      version: "2.0.0",
      digest: sha256Value(candidateSurveyProtocol),
      snapshot: candidateSurveyProtocol,
    },
    revision: 0,
    commitRevision: 0,
    phase: "initialized",
    runtimeStatus: "active",
    blockReason: null,
    lineage: stableLineage,
    inputs: {
      sourceSnapshotRef,
      policySnapshotRef,
      requestedArtifactPath,
      axiomCorpus,
      pendingInputDigest,
    },
    authority: stableAuthority,
    events: [],
    rejections: [],
    idempotency: {},
    outbox: null,
    pendingProjection: null,
    attempts: [],
    responses: {},
    drafts: {
      round1Instruments: [],
      round1Interpretations: [],
      round2Instruments: [],
      round2Interpretations: [],
      composites: [],
      current: {},
    },
    interpretations: {},
    dependencies: {
      plan: [axiomDependency.id],
      resolverAttempts: resolverAttempt === undefined
        ? []
        : [stableValue(resolverAttempt)],
      resolverReceipts: [receipt],
      rehydrationOutputs: [proof],
      outputs: {
        initResolve: receipt,
      },
    },
    candidates: [],
    feedback: [],
    ratification: null,
    finalization: null,
    authoring: {
      workspace: stableValue(workspace),
      runtimeArtifactReferences: [],
      persistence: null,
    },
    journal: [],
    snapshotDigest: zeroDigest,
  });
}

export function attachCandidateAuthoringPersistence(
  sessionValue,
  {
    identityBinding,
    identityScope,
  },
) {
  const session = stableValue(sessionValue);
  if (
    session.authoring.persistence !== null ||
    session.commitRevision !== 0 ||
    session.journal.length !== 0
  ) {
    fail("persistence can be attached only to a zero-journal skeleton");
  }
  session.authoring.persistence = {
    machineHeads: stableValue(identityScope.genesisMachineHeads),
    idempotencyOutcomeView: [],
    identityBinding: stableValue(identityBinding),
    identityScope: stableValue(identityScope),
  };
  session.snapshotDigest = sha256Value(
    Object.fromEntries(
      Object.entries(session).filter(
        ([key]) => key !== "snapshotDigest",
      ),
    ),
  );
  return stableValue(session);
}
