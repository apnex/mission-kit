import {
  validateContractSemantics
} from "../kernel/contract-semantics.mjs";
import canonicalPairedStateMatrix from "../../protocol/paired-state-matrix.v2.json"
  with { type: "json" };

export const SESSION_SCHEMA_V1 =
  "urn:mission-kit:survey-v2:schema:session-state:v1";
export const SESSION_SCHEMA_V2 =
  "urn:mission-kit:survey-v2:schema:session-state:v2";
export const FROZEN_V1_SELECTOR = "frozen-v1";
export const CANDIDATE_V2_SELECTOR = "v2-authoring-candidate";

const SURVEY_PACKAGE_ID = "urn:mission-kit:survey-v2:package:survey-v2";
const SURVEY_PROTOCOL_ID = "urn:mission-kit:survey-v2:protocol:survey";
const FROZEN_V1_PROJECTION_DIGEST =
  "sha256:6603b777b82783176fca6129bfecde7a6e253f5be86f9becf94703d818b9757c";
const FROZEN_V1_PROTOCOL_DIGEST =
  "sha256:d99054ceba9e72ad3787ef038b41184b70968e6e4e444b67178b7328542d515a";
const SURVEY_API_VERSION = "survey.mission-kit/v1alpha1";
const RUNTIME_ARTIFACT_KIND = "SurveyRuntimeArtifact";
const RUNTIME_VARIANT_KINDS = new Set([
  "RoundResponseSet",
  "RevisionDirective",
  "CandidateValidationEvidence",
  "FinalizationDiagnostic",
  "CompositeRuntimeEvidence"
]);
const MACHINE_IDS = new Set(["authoring", "phase", "runtime"]);
const MACHINE_ORDER = new Map([
  ["authoring", 0],
  ["phase", 1],
  ["runtime", 2]
]);
let canonicalPairIndex;

function issue(code, field, reason) {
  return Object.freeze({ code, field, reason });
}

function record(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function referenceKey(reference) {
  return [
    reference?.apiVersion,
    reference?.kind,
    reference?.name,
    reference?.semanticDigest
  ].join("\u0000");
}

function logicalReferenceKey(reference) {
  return [
    reference?.apiVersion,
    reference?.kind,
    reference?.name
  ].join("\u0000");
}

function sameRevisionState(left, right) {
  return (
    left?.semanticRevision === right?.semanticRevision &&
    left?.evidenceRevision === right?.evidenceRevision &&
    left?.semanticStateDigest === right?.semanticStateDigest
  );
}

function isRuntimeArtifactReference(reference) {
  return (
    record(reference) &&
    reference.apiVersion === SURVEY_API_VERSION &&
    reference.kind === RUNTIME_ARTIFACT_KIND &&
    typeof reference.name === "string" &&
    typeof reference.semanticDigest === "string"
  );
}

function matrixPairKey(authoringState, phaseState) {
  return `${authoringState}\u0000${phaseState}`;
}

function pairedStateIndex(matrix) {
  if (
    !record(matrix) ||
    matrix.$schema !==
      "urn:mission-kit:survey-v2:schema:paired-state-matrix:v2" ||
    matrix.schemaVersion !== "2.0.0" ||
    matrix.id !== "urn:mission-kit:survey-v2:paired-state-matrix:survey-v2" ||
    !Array.isArray(matrix.pairs)
  ) {
    throw new TypeError("paired-state matrix must be the canonical v2 matrix");
  }
  const pairs = new Map();
  matrix.pairs.forEach((pair, index) => {
    if (
      !record(pair) ||
      typeof pair.authoringState !== "string" ||
      typeof pair.phaseState !== "string" ||
      !Array.isArray(pair.pathClasses)
    ) {
      throw new TypeError(`paired-state matrix pair ${index} is malformed`);
    }
    const key = matrixPairKey(pair.authoringState, pair.phaseState);
    if (pairs.has(key)) {
      throw new TypeError(`paired-state matrix repeats pair ${key}`);
    }
    pairs.set(key, pair);
  });
  return pairs;
}

function canonicalPairedStateIndex() {
  canonicalPairIndex ??= pairedStateIndex(canonicalPairedStateMatrix);
  return canonicalPairIndex;
}

function prefixIssues(issues, path) {
  return issues.map((item) => issue(
    item.code,
    `${path}${item.field ?? ""}`,
    item.reason
  ));
}

function workspaceContractIssues(workspace) {
  if (!record(workspace) || workspace.kind !== "AuthoringWorkspace") {
    return [issue(
      "SESSION_WORKSPACE_INVALID",
      "/authoring/workspace",
      "The authoring branch must contain one AuthoringWorkspace."
    )];
  }
  try {
    return prefixIssues(
      validateContractSemantics(workspace),
      "/authoring/workspace"
    );
  } catch {
    return [issue(
      "SESSION_WORKSPACE_INVALID",
      "/authoring/workspace",
      "The authoring workspace is not structurally safe for semantic validation."
    )];
  }
}

function workspaceReferenceIssues(session) {
  const workspace = session.authoring.workspace;
  const spec = workspace.spec;
  const versions = spec.resourceVersions;
  const byReference = new Map();
  const byLogicalReference = new Map();
  const issues = [];

  versions.forEach((stored, index) => {
    const key = referenceKey(stored.reference);
    const logicalKey = logicalReferenceKey(stored.reference);
    if (byReference.has(key)) {
      issues.push(issue(
        "SESSION_RESOURCE_VERSION_DUPLICATE",
        `/authoring/workspace/spec/resourceVersions/${index}/reference`,
        "An exact immutable resource version appears more than once."
      ));
    } else {
      byReference.set(key, stored);
    }
    const logicalVersions = byLogicalReference.get(logicalKey) ?? [];
    logicalVersions.push(stored);
    byLogicalReference.set(logicalKey, logicalVersions);
  });

  const resolve = (reference, path, code = "SESSION_REFERENCE_UNRESOLVED") => {
    if (byReference.has(referenceKey(reference))) return true;
    const digestMismatch = byLogicalReference.has(logicalReferenceKey(reference));
    issues.push(issue(
      digestMismatch ? "SESSION_REFERENCE_DIGEST_MISMATCH" : code,
      path,
      digestMismatch
        ? "The reference does not select the exact stored immutable version."
        : "The reference does not resolve to a stored immutable resource version."
    ));
    return false;
  };

  spec.activeHeads.forEach((head, index) => {
    resolve(
      head.reference,
      `/authoring/workspace/spec/activeHeads/${index}/reference`
    );
  });
  spec.history.forEach((reference, index) => {
    resolve(
      reference,
      `/authoring/workspace/spec/history/${index}`
    );
  });
  spec.handoffProducts.forEach((handoff, index) => {
    resolve(
      handoff.reference,
      `/authoring/workspace/spec/handoffProducts/${index}/reference`
    );
  });
  spec.dependencyEdges.forEach((edge, index) => {
    resolve(
      edge.from,
      `/authoring/workspace/spec/dependencyEdges/${index}/from`
    );
    resolve(
      edge.to,
      `/authoring/workspace/spec/dependencyEdges/${index}/to`
    );
  });
  if (spec.openAssignment !== null) {
    resolve(
      spec.openAssignment.reference,
      "/authoring/workspace/spec/openAssignment/reference"
    );
  }

  const active = new Set(
    spec.activeHeads.map((head) => referenceKey(head.reference))
  );
  spec.history.forEach((reference, index) => {
    if (active.has(referenceKey(reference))) {
      issues.push(issue(
        "SESSION_HISTORY_ACTIVE_HEAD_OVERLAP",
        `/authoring/workspace/spec/history/${index}`,
        "Immutable history cannot also be selected as a current active head."
      ));
    }
  });

  const declaredRuntimeReferences = new Set();
  session.authoring.runtimeArtifactReferences.forEach((reference, index) => {
    const path = `/authoring/runtimeArtifactReferences/${index}`;
    if (!isRuntimeArtifactReference(reference)) {
      issues.push(issue(
        "SESSION_RUNTIME_ARTIFACT_REFERENCE_TYPE_MISMATCH",
        path,
        "Runtime ingress must be a typed SurveyRuntimeArtifact reference."
      ));
      return;
    }
    const key = referenceKey(reference);
    declaredRuntimeReferences.add(key);
    if (!resolve(reference, path, "SESSION_RUNTIME_ARTIFACT_UNRESOLVED")) return;
    const stored = byReference.get(key);
    if (
      stored.resource.apiVersion !== SURVEY_API_VERSION ||
      stored.resource.kind !== RUNTIME_ARTIFACT_KIND ||
      stored.resource.metadata?.name !== reference.name
    ) {
      issues.push(issue(
        "SESSION_RUNTIME_ARTIFACT_RESOURCE_TYPE_MISMATCH",
        path,
        "The reference must resolve to one stored SurveyRuntimeArtifact resource."
      ));
    }
  });

  versions.forEach((stored, index) => {
    if (
      stored.resource.apiVersion === SURVEY_API_VERSION &&
      RUNTIME_VARIANT_KINDS.has(stored.resource.kind)
    ) {
      issues.push(issue(
        "SESSION_INLINE_RUNTIME_VARIANT_FORBIDDEN",
        `/authoring/workspace/spec/resourceVersions/${index}/resource/kind`,
        "Runtime variants must be wrapped by the closed SurveyRuntimeArtifact resource."
      ));
    }
    if (
      stored.resource.apiVersion === SURVEY_API_VERSION &&
      stored.resource.kind === RUNTIME_ARTIFACT_KIND &&
      !declaredRuntimeReferences.has(referenceKey(stored.reference))
    ) {
      issues.push(issue(
        "SESSION_RUNTIME_ARTIFACT_REFERENCE_REQUIRED",
        `/authoring/workspace/spec/resourceVersions/${index}/reference`,
        "Every stored SurveyRuntimeArtifact admitted to authoring must have one typed ingress reference."
      ));
    }
  });

  return issues;
}

function journalIssues(session, matrixPairs) {
  const { journal } = session;
  const workspace = session.authoring.workspace;
  const issues = [];
  if (session.commitRevision !== journal.length) {
    issues.push(issue(
      "SESSION_COMMIT_REVISION_MISMATCH",
      "/commitRevision",
      "commitRevision must equal the global journal length."
    ));
  }

  const commitIds = new Set();
  const idempotencyKeys = new Set();
  let previousAfter = null;
  const lastEdgeByMachine = new Map();

  journal.forEach((entry, index) => {
    const entryPath = `/journal/${index}`;
    if (entry.ordinal !== index + 1) {
      issues.push(issue(
        "SESSION_JOURNAL_ORDINAL_MISMATCH",
        `${entryPath}/ordinal`,
        "Journal ordinals must be the contiguous one-based commit sequence."
      ));
    }
    if (commitIds.has(entry.commitId)) {
      issues.push(issue(
        "SESSION_JOURNAL_COMMIT_ID_DUPLICATE",
        `${entryPath}/commitId`,
        "Commit IDs are globally unique within one session journal."
      ));
    }
    commitIds.add(entry.commitId);
    const idempotencyKey =
      `${entry.idempotency.machineId}\u0000${entry.idempotency.key}`;
    if (idempotencyKeys.has(idempotencyKey)) {
      issues.push(issue(
        "SESSION_JOURNAL_IDEMPOTENCY_DUPLICATE",
        `${entryPath}/idempotency`,
        "A machine-qualified idempotency key can identify only one commit."
      ));
    }
    idempotencyKeys.add(idempotencyKey);

    if (previousAfter !== null && !sameRevisionState(entry.before, previousAfter)) {
      issues.push(issue(
        "SESSION_JOURNAL_REVISION_DISCONTINUITY",
        `${entryPath}/before`,
        "Each journal before-state must equal the previous commit after-state."
      ));
    }
    previousAfter = entry.after;

    try {
      issues.push(...prefixIssues(
        validateContractSemantics(entry),
        entryPath
      ));
    } catch {
      issues.push(issue(
        "SESSION_JOURNAL_RECORD_INVALID",
        entryPath,
        "The journal record is not structurally safe for semantic validation."
      ));
    }

    const counts = new Map();
    entry.machineEdges.forEach((edge, edgeIndex) => {
      const edgePath = `${entryPath}/machineEdges/${edgeIndex}`;
      if (!MACHINE_IDS.has(edge.machineId)) {
        issues.push(issue(
          "SESSION_MACHINE_EDGE_UNKNOWN",
          `${edgePath}/machineId`,
          "Session journal edges may target only authoring, phase, or runtime."
        ));
      }
      counts.set(edge.machineId, (counts.get(edge.machineId) ?? 0) + 1);
      const prior = lastEdgeByMachine.get(edge.machineId);
      if (
        prior &&
        (
          prior.toState !== edge.fromState ||
          prior.afterStateDigest !== edge.beforeStateDigest
        )
      ) {
        issues.push(issue(
          "SESSION_MACHINE_EDGE_DISCONTINUITY",
          edgePath,
          "Filtered machine edges must share an exact ordered boundary state."
        ));
      }
      lastEdgeByMachine.set(edge.machineId, edge);
    });
    for (let edgeIndex = 1; edgeIndex < entry.machineEdges.length; edgeIndex += 1) {
      const before = entry.machineEdges[edgeIndex - 1];
      const after = entry.machineEdges[edgeIndex];
      if (
        MACHINE_ORDER.has(before.machineId) &&
        MACHINE_ORDER.has(after.machineId) &&
        MACHINE_ORDER.get(after.machineId) < MACHINE_ORDER.get(before.machineId)
      ) {
        issues.push(issue(
          "SESSION_MACHINE_EDGE_ORDER_INVALID",
          `${entryPath}/machineEdges/${edgeIndex}`,
          "Coupled machine edges must preserve authoring, phase, then runtime order."
        ));
      }
    }

    for (const [machineId, count] of counts) {
      if (
        (machineId !== "phase" && count > 1) ||
        (machineId === "phase" && count > 2)
      ) {
        issues.push(issue(
          "SESSION_MACHINE_EDGE_CARDINALITY_INVALID",
          `${entryPath}/machineEdges`,
          "A coupled commit has at most one edge per machine except two ordered phase refreeze edges."
        ));
      }
    }

    const phaseIndexes = entry.machineEdges
      .map((edge, edgeIndex) => edge.machineId === "phase" ? edgeIndex : -1)
      .filter((edgeIndex) => edgeIndex !== -1);
    if (
      phaseIndexes.length === 2 &&
      phaseIndexes[1] !== phaseIndexes[0] + 1
    ) {
      issues.push(issue(
        "SESSION_MACHINE_EDGE_ORDER_INVALID",
        `${entryPath}/machineEdges/${phaseIndexes[1]}`,
        "Atomic phase refreeze edges must be adjacent and ordered."
      ));
    }

    const authoringEdges = entry.machineEdges.filter(
      (edge) => edge.machineId === "authoring"
    );
    const phaseEdges = entry.machineEdges.filter(
      (edge) => edge.machineId === "phase"
    );
    if (authoringEdges.length === 1 && phaseEdges.length > 0) {
      const beforeKey = matrixPairKey(
        authoringEdges[0].fromState,
        phaseEdges[0].fromState
      );
      const afterKey = matrixPairKey(
        authoringEdges[0].toState,
        phaseEdges.at(-1).toState
      );
      if (!matrixPairs.has(beforeKey) || !matrixPairs.has(afterKey)) {
        issues.push(issue(
          "SESSION_COUPLED_EDGE_PAIR_ILLEGAL",
          `${entryPath}/machineEdges`,
          "A coupled authoring/phase edge sequence must begin and end on declared legal matrix pairs."
        ));
      }
    }
  });

  if (journal.length === 0) {
    if (
      workspace.spec.semanticRevision !== 0 ||
      workspace.spec.evidenceRevision !== 0
    ) {
      issues.push(issue(
        "SESSION_EMPTY_JOURNAL_REVISION_MISMATCH",
        "/authoring/workspace/spec",
        "An empty global journal can represent only zero workspace revisions."
      ));
    }
  } else if (
    previousAfter.semanticRevision !== workspace.spec.semanticRevision ||
    previousAfter.evidenceRevision !== workspace.spec.evidenceRevision ||
    previousAfter.semanticStateDigest !==
      workspace.spec.integrity.semanticStateDigest
  ) {
    issues.push(issue(
      "SESSION_JOURNAL_WORKSPACE_MISMATCH",
      "/journal",
      "The final journal after-state must equal the persisted workspace state."
    ));
  }

  const terminalFields = [
    ["authoring", workspace.spec.authoringState],
    ["phase", session.phase],
    ["runtime", session.runtimeStatus]
  ];
  terminalFields.forEach(([machineId, expectedState]) => {
    const edge = lastEdgeByMachine.get(machineId);
    if (edge && edge.toState !== expectedState) {
      issues.push(issue(
        "SESSION_MACHINE_EDGE_FINAL_STATE_MISMATCH",
        "/journal",
        `The final ${machineId} edge does not reach the persisted session state.`
      ));
    }
  });

  return issues;
}

/**
 * Validate v2 cross-document session semantics after structural schema
 * validation. The paired-state authority is imported from the canonical
 * package-owned matrix and cannot be supplied by session or caller data.
 */
export function validateSessionSemantics(session) {
  if (
    !record(session) ||
    session.$schema !== SESSION_SCHEMA_V2 ||
    session.schemaVersion !== "2.0.0" ||
    !record(session.authoring) ||
    !Array.isArray(session.authoring.runtimeArtifactReferences) ||
    !Array.isArray(session.journal)
  ) {
    return Object.freeze([issue(
      "SESSION_V2_SHAPE_REQUIRED",
      "/",
      "Session semantics require a structurally validated session-state:v2 value."
    )]);
  }
  const matrixPairs = canonicalPairedStateIndex();
  const workspaceIssues = workspaceContractIssues(session.authoring.workspace);
  if (workspaceIssues.length > 0) return Object.freeze(workspaceIssues);

  const authoringState = session.authoring.workspace.spec.authoringState;
  const pair = matrixPairs.get(matrixPairKey(authoringState, session.phase));
  const issues = [];
  if (!pair) {
    issues.push(issue(
      "SESSION_PAIRED_STATE_ILLEGAL",
      "/authoring/workspace/spec/authoringState",
      "The persisted authoring and phase states are not a declared legal matrix pair."
    ));
  }
  issues.push(
    ...workspaceReferenceIssues(session),
    ...journalIssues(session, matrixPairs)
  );
  return Object.freeze(issues);
}

export function assertSessionSemantics(session) {
  const issues = validateSessionSemantics(session);
  if (issues.length > 0) {
    const error = new Error(
      issues.map((item) => `${item.code} ${item.field}: ${item.reason}`).join("; ")
    );
    error.name = "SessionSemanticValidationError";
    error.code = issues[0].code;
    error.issues = issues;
    throw error;
  }
  return session;
}

export class SessionContractSelectionError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "SessionContractSelectionError";
    this.code = code;
  }
}

function assertFrozenV1Identity(session) {
  if (
    session.schemaVersion !== "1.0.0" ||
    session.package?.id !== SURVEY_PACKAGE_ID ||
    session.package?.version !== "1.0.0" ||
    session.package?.projectionDigest !== FROZEN_V1_PROJECTION_DIGEST ||
    session.protocol?.id !== SURVEY_PROTOCOL_ID ||
    session.protocol?.version !== "1.0.0" ||
    session.protocol?.digest !== FROZEN_V1_PROTOCOL_DIGEST
  ) {
    throw new SessionContractSelectionError(
      "FROZEN_V1_IDENTITY_REQUIRED",
      "Historical v1 sessions must retain their exact frozen package and protocol identity."
    );
  }
}

function assertCandidateV2Identity(session) {
  if (
    session.schemaVersion !== "2.0.0" ||
    session.package?.id !== SURVEY_PACKAGE_ID ||
    session.package?.version !== "1.0.0" ||
    session.protocol?.id !== SURVEY_PROTOCOL_ID ||
    session.protocol?.version !== "2.0.0"
  ) {
    throw new SessionContractSelectionError(
      "CANDIDATE_V2_IDENTITY_REQUIRED",
      "Candidate sessions must retain their exact v2 package and protocol identity."
    );
  }
}

/**
 * Select a versioned session contract without migration or reinterpretation.
 * Frozen v1 remains the implicit historical path; v2 always needs the explicit
 * candidate selector.
 */
export function selectSessionContract(session, selector = undefined) {
  if (!record(session)) {
    throw new TypeError("session must be an object");
  }
  if (session.$schema === SESSION_SCHEMA_V1) {
    if (selector !== undefined && selector !== FROZEN_V1_SELECTOR) {
      throw new SessionContractSelectionError(
        "CANDIDATE_SELECTOR_REFUSES_V1",
        "The candidate selector cannot reinterpret a frozen v1 session."
      );
    }
    assertFrozenV1Identity(session);
    return Object.freeze({
      selector: FROZEN_V1_SELECTOR,
      schemaId: SESSION_SCHEMA_V1,
      package: Object.freeze(structuredClone(session.package)),
      protocol: Object.freeze(structuredClone(session.protocol))
    });
  }
  if (session.$schema === SESSION_SCHEMA_V2) {
    if (selector !== CANDIDATE_V2_SELECTOR) {
      throw new SessionContractSelectionError(
        "EXPLICIT_CANDIDATE_SELECTOR_REQUIRED",
        "A v2 session is accessible only through explicit candidate selection."
      );
    }
    assertCandidateV2Identity(session);
    return Object.freeze({
      selector: CANDIDATE_V2_SELECTOR,
      schemaId: SESSION_SCHEMA_V2,
      package: Object.freeze(structuredClone(session.package)),
      protocol: Object.freeze(structuredClone(session.protocol))
    });
  }
  throw new SessionContractSelectionError(
    "SESSION_SCHEMA_UNSUPPORTED",
    "The session does not identify a supported versioned contract."
  );
}

export function pairedStatePathClasses(session) {
  const pairs = canonicalPairedStateIndex();
  const pair = pairs.get(matrixPairKey(
    session?.authoring?.workspace?.spec?.authoringState,
    session?.phase
  ));
  return pair ? Object.freeze([...pair.pathClasses]) : Object.freeze([]);
}
