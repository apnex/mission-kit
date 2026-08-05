import {
  canonicalize,
  stableValue,
} from "../kernel/canonical.mjs";
import {
  CANDIDATE_V2_SELECTOR,
} from "./session-semantics.mjs";

function compareUtf8(left, right) {
  return Buffer.from(left, "utf8").compare(
    Buffer.from(right, "utf8"),
  );
}

function referenceKey(reference) {
  return [
    reference.apiVersion,
    reference.kind,
    reference.name,
    reference.semanticDigest,
  ].join("\u0000");
}

function pendingSummary(pending) {
  if (pending === null) return null;
  return {
    taskId: pending.request.spec.operation.task.id,
    handle: pending.assignment.spec.handle,
    requestDigest: pending.request.spec.requestDigest,
    assignmentDigest:
      pending.assignment.spec.assignmentDigest,
    projectionArtifactDigest:
      pending.projectionArtifact.spec
        .projectionArtifactDigest,
    blankViewDigest:
      pending.assignment.spec.uneditedSkeleton
        .blankViewDigest,
  };
}

export function surveyStatusView({
  session,
  snapshot,
  pending,
}) {
  return stableValue({
    kind: "SurveyctlStatus",
    selection: CANDIDATE_V2_SELECTOR,
    sessionId: session.sessionId,
    slug: session.slug,
    runtimeStatus: session.runtimeStatus,
    phase: session.phase,
    authoringState:
      snapshot.workspace.spec.authoringState,
    commitRevision: snapshot.commitRevision,
    semanticRevision:
      snapshot.workspace.spec.semanticRevision,
    evidenceRevision:
      snapshot.workspace.spec.evidenceRevision,
    pending: pendingSummary(pending),
    nextDisposition:
      pending === null ? "issue-or-wait" : "resume-pending",
  });
}

export function surveyTreeView({ snapshot }) {
  const workspace = snapshot.workspace.spec;
  return stableValue({
    kind: "SurveyctlAuthoringTree",
    storeId: snapshot.storeId,
    activeHeads: [...workspace.activeHeads]
      .sort((left, right) =>
        compareUtf8(left.slot, right.slot)),
    resourceVersions: workspace.resourceVersions.map(
      (stored) => ({
        reference: stored.reference,
        integrityDigest: stored.integrityDigest,
      }),
    ),
    dependencyEdges: [...workspace.dependencyEdges],
    history: [...workspace.history],
    handoffProducts: [...workspace.handoffProducts],
    openAssignment: workspace.openAssignment,
  });
}

function exactStoredResource(snapshot, reference) {
  const key = referenceKey(reference);
  const matches =
    snapshot.workspace.spec.resourceVersions.filter(
      (stored) => referenceKey(stored.reference) === key,
    );
  if (matches.length !== 1) {
    const error = new Error(
      `resource reference resolves ${matches.length} times`,
    );
    error.code = "SURVEYCTL_RESOURCE_RESOLUTION_INVALID";
    throw error;
  }
  return matches[0].resource;
}

function pendingTarget(pending, target) {
  if (pending === null) {
    const error = new Error(
      "the session has no pending Assignment",
    );
    error.code = "SURVEYCTL_PENDING_ABSENT";
    throw error;
  }
  const values = {
    "pending:request": pending.request,
    "pending:context": pending.contextClosure,
    "pending:projection": pending.projectionArtifact,
    "pending:assignment": pending.assignment,
  };
  return values[target];
}

export function showSurveyTarget({
  snapshot,
  pending,
  target,
}) {
  if (typeof target !== "string") {
    throw new TypeError("show target must be a string");
  }
  if (target.startsWith("pending:")) {
    const value = pendingTarget(pending, target);
    if (value === undefined) {
      const error = new Error(
        `unknown exact pending selector ${target}`,
      );
      error.code = "SURVEYCTL_SHOW_SELECTOR_INVALID";
      throw error;
    }
    return stableValue(value);
  }
  if (target.startsWith("head:")) {
    const slot = target.slice("head:".length);
    const heads = snapshot.workspace.spec.activeHeads.filter(
      (head) => head.slot === slot,
    );
    if (heads.length !== 1) {
      const error = new Error(
        `active-head slot ${slot} resolves ${heads.length} times`,
      );
      error.code = "SURVEYCTL_SHOW_NOT_FOUND";
      throw error;
    }
    return stableValue(
      exactStoredResource(snapshot, heads[0].reference),
    );
  }
  if (target.startsWith("digest:")) {
    const digest = target.slice("digest:".length);
    if (!/^sha256:[0-9a-f]{64}$/u.test(digest)) {
      const error = new Error(
        "digest selector requires one full sha256 digest",
      );
      error.code = "SURVEYCTL_SHOW_SELECTOR_INVALID";
      throw error;
    }
    const matches =
      snapshot.workspace.spec.resourceVersions.filter(
        (stored) =>
          stored.reference.semanticDigest === digest,
      );
    if (matches.length !== 1) {
      const error = new Error(
        `semantic digest resolves ${matches.length} times`,
      );
      error.code = "SURVEYCTL_SHOW_NOT_FOUND";
      throw error;
    }
    return stableValue(matches[0].resource);
  }
  const error = new Error(
    `unknown exact show selector ${target}`,
  );
  error.code = "SURVEYCTL_SHOW_SELECTOR_INVALID";
  throw error;
}

export function surveyValidationView({
  session,
  snapshot,
  pending,
  replay,
}) {
  if (
    typeof replay?.journalHeadDigest !== "string"
  ) {
    const error = new Error(
      "validation requires the authenticated journal replay result",
    );
    error.code = "SURVEYCTL_REPLAY_REQUIRED";
    throw error;
  }
  const terminalRevision = {
    semanticRevision:
      snapshot.workspace.spec.semanticRevision,
    evidenceRevision:
      snapshot.workspace.spec.evidenceRevision,
    semanticStateDigest:
      snapshot.workspace.spec.integrity
        .semanticStateDigest,
  };
  if (
    session.snapshotDigest !== snapshot.rootSealDigest ||
    session.commitRevision !== snapshot.commitRevision ||
    canonicalize(session.authoring.workspace) !==
      canonicalize(snapshot.workspace) ||
    canonicalize(replay.revisionState) !==
      canonicalize(terminalRevision) ||
    canonicalize(replay.machineHeads) !==
      canonicalize(snapshot.machineHeads)
  ) {
    const error = new Error(
      "validation inputs do not describe one exact authenticated terminal root",
    );
    error.code = "SURVEYCTL_VALIDATION_ROOT_MISMATCH";
    throw error;
  }
  return stableValue({
    kind: "SurveyctlValidation",
    status: "valid",
    selection: CANDIDATE_V2_SELECTOR,
    sessionId: session.sessionId,
    snapshotDigest: session.snapshotDigest,
    workspaceIntegrityDigest:
      snapshot.workspace.spec.integrity
        .workspaceIntegrityDigest,
    journalHeadDigest: replay.journalHeadDigest,
    commitRevision: snapshot.commitRevision,
    pendingViewDigest:
      pending?.assignment?.spec?.uneditedSkeleton
        ?.blankViewDigest ??
      null,
  });
}

export function canonicalInspectionJson(value) {
  return `${canonicalize(value)}\n`;
}
