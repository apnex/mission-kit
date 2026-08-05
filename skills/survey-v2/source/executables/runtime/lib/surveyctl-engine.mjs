import { randomUUID } from "node:crypto";
import path from "node:path";
import axiomDependency from "../../../dependencies/references/mission-kit-axioms.reference.json"
  with { type: "json" };
import {
  sha256Bytes,
  sha256Value,
  stableValue,
} from "../../../authoring/kernel/canonical.mjs";
import {
  textContentBytes,
} from "../../../authoring/kernel/text-forms.mjs";
import {
  compileJournalIdentityPort,
} from "../../../authoring/runtime/journal-replay.mjs";
import {
  createSurveyAuthoringRuntime,
  createSurveyTextSubmission,
  nextSurveyAuthoringTask,
  readSurveyAuthoringState,
  submitSurveyAuthoringTask,
} from "../../../authoring/survey/authoring-runtime.mjs";
import {
  surveyStatusView,
  surveyTreeView,
  showSurveyTarget,
  surveyValidationView,
  canonicalInspectionJson,
} from "../../../authoring/survey/inspection.mjs";
import {
  createSurveySessionJournalIdentityConfiguration,
  reconstructSurveySessionJournalIdentity,
} from "../../../authoring/survey/session-journal-identity.mjs";
import {
  attachCandidateAuthoringPersistence,
  createCandidateSessionSkeleton,
  createSurveyGenesisWorkspace,
  surveyPolicyInput,
} from "../../../authoring/survey/session-root.mjs";
import {
  CANDIDATE_V2_SELECTOR,
} from "../../../authoring/survey/session-semantics.mjs";
import {
  createSurveySessionStore,
  readCandidateSessionPublicRoot,
  readVerifiedCandidateSession,
  validateSurveySessionStoreRoot,
} from "../../../authoring/survey/session-store-adapter.mjs";
import {
  buildSurveySourceSnapshot,
} from "../../../authoring/survey/source-snapshot.mjs";
import {
  loadSurveyProfileAuthority,
} from "../../../authoring/survey/profile-authority.mjs";
import {
  buildSurveyPolicySnapshot,
} from "../../../authoring/survey/survey-policy-snapshot.mjs";
import {
  atomicWriteJson,
} from "./storage.mjs";
import {
  captureReferenceSnapshot,
} from "./dependency-snapshot.mjs";
import {
  captureSourceFiles,
  readStrictInput,
  resolveJournalIdentity,
} from "./surveyctl-io.mjs";

export const SURVEYCTL_CANDIDATE_SELECTOR =
  CANDIDATE_V2_SELECTOR;

const sessionFileName = "session.json";
const semanticIdSuffix = /[^a-z0-9]+/gu;

export class SurveyctlEngineError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "SurveyctlEngineError";
    this.code = code;
    for (const [key, value] of Object.entries(details)) {
      this[key] = value;
    }
  }
}

function fail(code, message, details) {
  throw new SurveyctlEngineError(code, message, details);
}

function identityOptions(options, createIdentityConfiguration) {
  return {
    ...(options.keyRoot === undefined
      ? {}
      : { keyRoot: options.keyRoot }),
    ...(options.keyFile === undefined
      ? {}
      : { keyFile: options.keyFile }),
    createIdentityConfiguration,
  };
}

function resolverAttempt(sessionId, missionKitRoot) {
  return stableValue({
    attemptId: `${sessionId}:binding:1`,
    kind: "host-registry",
    bindingKey: axiomDependency.resolution.bindingKey,
    repository: axiomDependency.source.repository,
    registryId: "surveyctl-host-registry",
    locatorEvidenceDigest: sha256Value({
      kind: "host-path-observation",
      root: missionKitRoot,
    }),
    actorToolEvidence: "deterministic-runtime",
  });
}

async function dependencyInputs(options, sessionId) {
  if (!options.axiomCorpus) {
    return {
      dependencySnapshot: undefined,
      resolverAttempt: undefined,
    };
  }
  const attempt = resolverAttempt(
    sessionId,
    options.missionKitRoot,
  );
  const dependencySnapshot = await captureReferenceSnapshot(
    axiomDependency,
    {
      registryId: attempt.registryId,
      bindings: {
        [axiomDependency.resolution.bindingKey]: {
          kind: "host-registry",
          repository: axiomDependency.source.repository,
          root: options.missionKitRoot,
        },
      },
    },
  );
  return { dependencySnapshot, resolverAttempt: attempt };
}

function assertInitializedState(session, state) {
  if (
    session.runtimeStatus !== "active" ||
    session.phase !== "round_1_drafting" ||
    state.snapshot.workspace.spec.authoringState !==
      "survey_frame_required" ||
    state.pending !== null
  ) {
    fail(
      "SURVEYCTL_INITIALIZATION_POSTCONDITION_INVALID",
      "initialization did not reach the exact active SurveyFrame-required boundary",
    );
  }
}

function readyDependencyResult(session) {
  const resultDigest =
    session.dependencies.outputs.initResolve?.resultDigest;
  if (
    typeof resultDigest !== "string" ||
    !/^sha256:[0-9a-f]{64}$/u.test(resultDigest)
  ) {
    fail(
      "SURVEYCTL_INITIALIZATION_RECEIPT_INVALID",
      "candidate session has no exact initialization result digest",
    );
  }
  return { status: "ready", resultDigest };
}

async function runtimeFrom({
  runDirectory,
  session,
  identity,
  systemActorId,
}) {
  const store = createSurveySessionStore({
    runDirectory,
    selector: CANDIDATE_V2_SELECTOR,
    identity,
  });
  const runtime = await createSurveyAuthoringRuntime({
    store,
    identity,
    systemActorId,
  });
  return { store, runtime, storeId: session.sessionId };
}

async function readConsistentRuntimeRoot({
  runtime,
  storeId,
  runDirectory,
  identity,
}) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const state = await readSurveyAuthoringState(
      runtime,
      storeId,
    );
    const session = await readVerifiedCandidateSession({
      runDirectory,
      selector: CANDIDATE_V2_SELECTOR,
      identity,
    });
    if (
      state.snapshot.rootSealDigest ===
        session.snapshotDigest
    ) {
      return { state, session };
    }
  }
  fail(
    "SURVEYCTL_CONCURRENT_READ_CONFLICT",
    "could not obtain one consistent authenticated session and authoring snapshot",
  );
}

/**
 * Create, authenticate, publish, and initialize one production candidate
 * SurveyRun. No legacy-v1 runtime operation participates in this path.
 */
export async function initializeSurveyctlRun(options) {
  const [
    profileAuthority,
    sourceEntries,
  ] = await Promise.all([
    loadSurveyProfileAuthority(),
    captureSourceFiles({
      sourceRoot: options.sourceRoot,
      sources: options.sources,
    }),
  ]);
  const sessionId = randomUUID();
  const sourceSnapshot =
    buildSurveySourceSnapshot(sourceEntries);
  const policySnapshot = buildSurveyPolicySnapshot(
    surveyPolicyInput(profileAuthority),
  );
  const workspace = createSurveyGenesisWorkspace({
    slug: options.slug,
    profileAuthority,
    sourceSnapshot,
    policySnapshot,
  });
  const dependency = await dependencyInputs(
    options,
    sessionId,
  );
  const skeleton = createCandidateSessionSkeleton({
    slug: options.slug,
    sessionId,
    profileAuthority,
    sourceSnapshot,
    policySnapshot,
    workspace,
    authority: options.authority,
    axiomCorpus: options.axiomCorpus,
    dependencySnapshot: dependency.dependencySnapshot,
    resolverAttempt: dependency.resolverAttempt,
  });
  const resolvedIdentity = await resolveJournalIdentity({
    ...identityOptions(
      options,
      (authenticationKey) =>
        createSurveySessionJournalIdentityConfiguration(
          skeleton,
          authenticationKey,
          { genesisBoundary: "post-bootstrap" },
        ),
    ),
  });
  const session = attachCandidateAuthoringPersistence(
    skeleton,
    resolvedIdentity.identityConfiguration,
  );
  const identity = compileJournalIdentityPort(
    resolvedIdentity.identityConfiguration,
  );
  validateSurveySessionStoreRoot(session, {
    selector: CANDIDATE_V2_SELECTOR,
    identity,
  });
  const runDirectory = path.join(
    options.sessionsRoot,
    options.slug,
    sessionId,
  );
  await atomicWriteJson(
    path.join(runDirectory, sessionFileName),
    session,
    { noReplace: true },
  );
  const opened = await runtimeFrom({
    runDirectory,
    session,
    identity,
    systemActorId: "surveyctl.init",
  });
  await opened.runtime.initialize(
    sessionId,
    session.authority,
    readyDependencyResult(session),
  );
  const consistent = await readConsistentRuntimeRoot({
    runtime: opened.runtime,
    storeId: sessionId,
    runDirectory,
    identity,
  });
  assertInitializedState(
    consistent.session,
    consistent.state,
  );
  return Object.freeze({
    runDirectory,
    session: consistent.session,
    state: consistent.state,
    identityRegistry: resolvedIdentity.registry,
  });
}

/**
 * Reconstruct one candidate runtime from only its absolute run path and
 * external key registry. The public root is fully schema/semantic checked
 * before key lookup; authenticated replay happens before a command is issued.
 */
export async function openSurveyctlRun(options) {
  const publicSession = await readCandidateSessionPublicRoot({
    runDirectory: options.runDirectory,
    selector: CANDIDATE_V2_SELECTOR,
  });
  const expectedIdentityBindingDigest =
    publicSession.authoring.persistence.identityBinding.digest;
  const resolvedIdentity = await resolveJournalIdentity({
    ...identityOptions(
      options,
      (authenticationKey) =>
        reconstructSurveySessionJournalIdentity(
          publicSession,
          authenticationKey,
        ),
    ),
    expectedIdentityBindingDigest,
  });
  const identity = compileJournalIdentityPort(
    resolvedIdentity.identityConfiguration,
  );
  validateSurveySessionStoreRoot(publicSession, {
    selector: CANDIDATE_V2_SELECTOR,
    identity,
  });
  const opened = await runtimeFrom({
    runDirectory: options.runDirectory,
    session: publicSession,
    identity,
    systemActorId: `surveyctl.${options.command}`,
  });
  if (
    publicSession.commitRevision === 0 &&
    publicSession.journal.length === 0 &&
    publicSession.phase === "initialized" &&
    publicSession.runtimeStatus === "active" &&
    publicSession.authoring.workspace.spec.authoringState ===
      "new"
  ) {
    await opened.runtime.initialize(
      publicSession.sessionId,
      publicSession.authority,
      readyDependencyResult(publicSession),
    );
  }
  const consistent = await readConsistentRuntimeRoot({
    runtime: opened.runtime,
    storeId: publicSession.sessionId,
    runDirectory: options.runDirectory,
    identity,
  });
  return Object.freeze({
    ...opened,
    identity,
    identityRegistry: resolvedIdentity.registry,
    session: consistent.session,
    state: consistent.state,
    runDirectory: options.runDirectory,
  });
}

function pendingView(pending) {
  if (pending?.kind !== "assignment") {
    const firstIssue = pending?.kind === "rejected" &&
        Array.isArray(pending.issues)
      ? pending.issues[0]
      : undefined;
    if (
      typeof firstIssue?.spec?.code === "string" &&
      firstIssue.spec.code.length > 0 &&
      typeof firstIssue?.spec?.reason === "string" &&
      firstIssue.spec.reason.length > 0
    ) {
      fail(firstIssue.spec.code, firstIssue.spec.reason);
    }
    fail(
      "SURVEYCTL_ASSIGNMENT_REQUIRED",
      "the authoring runtime did not issue one Assignment",
    );
  }
  const viewBytes = Buffer.from(pending.viewBytes);
  const expected = textContentBytes(
    pending.assignment.spec.uneditedSkeleton.content,
  );
  if (!viewBytes.equals(expected)) {
    fail(
      "SURVEYCTL_PENDING_VIEW_MISMATCH",
      "issued view bytes differ from the persisted Assignment skeleton",
    );
  }
  return viewBytes;
}

function producerProvenance(session, pending, submittedBytes) {
  const authorityDigest = sha256Value(session.authority);
  const submittedBytesDigest = sha256Bytes(submittedBytes);
  const suffix = authorityDigest
    .slice("sha256:".length, "sha256:".length + 16)
    .replace(semanticIdSuffix, "");
  const adapter = {
    id: "surveyctl.text-input",
    digest: sha256Value({
      domain: "mission-kit:survey-v2:surveyctl-text-input/v1",
      grammar: "mission-kit-authoring-text/v1",
    }),
  };
  return stableValue({
    producerId: `surveyctl.proposer.${suffix}`,
    producerClass: "external",
    evidenceDigest: sha256Value({
      domain: "mission-kit:survey-v2:external-submission-evidence/v1",
      authorityDigest,
      requestDigest: pending.request.spec.requestDigest,
      submittedBytesDigest,
    }),
    adapter,
    generation: {
      attemptId:
        `submission.${pending.assignment.spec.handle}.${
          submittedBytesDigest.slice("sha256:".length, "sha256:".length + 16)
        }`,
      provider: "unattested-external-input",
      model: "unreported",
      adapter,
      configurationDigest: sha256Value({
        domain:
          "mission-kit:survey-v2:external-generation-configuration/v1",
        disclosure: "not-reported",
      }),
    },
  });
}

function initView(result) {
  return stableValue({
    kind: "SurveyctlInitialization",
    selection: CANDIDATE_V2_SELECTOR,
    runDirectory: result.runDirectory,
    sessionId: result.session.sessionId,
    slug: result.session.slug,
    phase: result.session.phase,
    runtimeStatus: result.session.runtimeStatus,
    authoringState:
      result.state.snapshot.workspace.spec.authoringState,
    commitRevision: result.state.snapshot.commitRevision,
    identityBindingDigest:
      result.session.authoring.persistence.identityBinding.digest,
  });
}

function nextJson(pending, viewBytes) {
  return stableValue({
    kind: "SurveyctlAssignmentView",
    taskId: pending.request.spec.operation.task.id,
    handle: pending.assignment.spec.handle,
    requestDigest: pending.request.spec.requestDigest,
    assignmentDigest:
      pending.assignment.spec.assignmentDigest,
    blankViewDigest:
      pending.assignment.spec.uneditedSkeleton.blankViewDigest,
    content: {
      mediaType: "text/plain;charset=utf-8",
      encoding: "base64",
      byteLength: viewBytes.byteLength,
      data: viewBytes.toString("base64"),
    },
  });
}

function submissionView(result, state) {
  if (
    result?.kind !== "committed" &&
    result?.kind !== "rejected"
  ) {
    fail(
      "SURVEYCTL_SUBMISSION_RESULT_INVALID",
      "submission did not produce an exact committed or rejected outcome",
    );
  }
  return stableValue({
    kind: "SurveyctlSubmissionResult",
    disposition: result.kind,
    authoringState:
      state.snapshot.workspace.spec.authoringState,
    commitRevision: state.snapshot.commitRevision,
    semanticRevision:
      state.snapshot.workspace.spec.semanticRevision,
    evidenceRevision:
      state.snapshot.workspace.spec.evidenceRevision,
  });
}

function scalarText(value) {
  if (value === null) return "null";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function readableObject(value, depth = 0) {
  if (
    value === null ||
    typeof value !== "object"
  ) {
    return [scalarText(value)];
  }
  const indent = "  ".repeat(depth);
  const childIndent = "  ".repeat(depth + 1);
  if (Array.isArray(value)) {
    if (value.length === 0) return ["[]"];
    return value.flatMap((item) => {
      const lines = readableObject(item, depth + 1);
      return [
        `${indent}- ${lines[0]}`,
        ...lines.slice(1).map((line) => `${childIndent}${line}`),
      ];
    });
  }
  const entries = Object.entries(value);
  if (entries.length === 0) return ["{}"];
  return entries.flatMap(([key, item]) => {
    if (
      item === null ||
      typeof item !== "object"
    ) {
      return [`${indent}${key}: ${scalarText(item)}`];
    }
    const lines = readableObject(item, depth + 1);
    return [
      `${indent}${key}:`,
      ...lines.map((line) =>
        line.startsWith(childIndent)
          ? line
          : `${childIndent}${line}`),
    ];
  });
}

export function renderSurveyctlText(value) {
  return Buffer.from(`${readableObject(value).join("\n")}\n`, "utf8");
}

function rendered(format, value) {
  return format === "json"
    ? Buffer.from(canonicalInspectionJson(value), "utf8")
    : renderSurveyctlText(value);
}

/**
 * Execute one already-parsed V10 surveyctl command and return exact stdout
 * bytes. The caller owns process I/O and error presentation.
 */
export async function executeSurveyctlCommand(
  options,
  { stdin = process.stdin } = {},
) {
  if (options.command === "init") {
    const result = await initializeSurveyctlRun(options);
    return Object.freeze({
      output: rendered(options.format, initView(result)),
      result,
    });
  }

  const opened = await openSurveyctlRun(options);
  const { runtime, storeId } = opened;
  if (options.command === "next") {
    const pending = await nextSurveyAuthoringTask(
      runtime,
      storeId,
    );
    const viewBytes = pendingView(pending);
    return Object.freeze({
      output: options.format === "json"
        ? rendered("json", nextJson(pending, viewBytes))
        : viewBytes,
      result: pending,
    });
  }
  if (options.command === "submit") {
    const submittedBytes = await readStrictInput({
      input: options.input,
      stdin,
    });
    const pending = opened.state.pending;
    const createdSubmission = createSurveyTextSubmission({
      runtime,
      pending,
      submittedBytes,
      producerProvenance: producerProvenance(
        opened.session,
        pending,
        submittedBytes,
      ),
    });
    const result = await submitSurveyAuthoringTask({
      runtime,
      storeId,
      pending,
      submission: createdSubmission.submission,
    });
    if (result?.kind === "conflict") {
      fail(
        "SURVEYCTL_CONCURRENT_WRITE_CONFLICT",
        "submission lost a compare-and-commit race; reopen the session and retry from the current Assignment",
      );
    }
    const state = await readSurveyAuthoringState(
      runtime,
      storeId,
    );
    return Object.freeze({
      output: rendered(
        options.format,
        submissionView(result, state),
      ),
      result,
    });
  }
  if (options.command === "status") {
    return Object.freeze({
      output: rendered(
        options.format,
        surveyStatusView({
          session: opened.session,
          snapshot: opened.state.snapshot,
          pending: opened.state.pending,
        }),
      ),
    });
  }
  if (options.command === "tree") {
    return Object.freeze({
      output: rendered(
        options.format,
        surveyTreeView({
          snapshot: opened.state.snapshot,
        }),
      ),
    });
  }
  if (options.command === "show") {
    return Object.freeze({
      output: rendered(
        options.format,
        showSurveyTarget({
          snapshot: opened.state.snapshot,
          pending: opened.state.pending,
          target: options.target,
        }),
      ),
    });
  }
  if (options.command === "validate") {
    return Object.freeze({
      output: rendered(
        options.format,
        surveyValidationView({
          session: opened.session,
          snapshot: opened.state.snapshot,
          pending: opened.state.pending,
          replay: opened.state.replay,
        }),
      ),
    });
  }
  fail(
    "SURVEYCTL_COMMAND_UNREACHABLE",
    `unsupported parsed command ${options.command}`,
  );
}
