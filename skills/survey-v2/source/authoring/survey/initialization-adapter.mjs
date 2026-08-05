import { types } from "node:util";
import {
  canonicalize,
  sha256Value,
  stableValue,
} from "../kernel/canonical.mjs";
import {
  waitResult as kernelWaitResult,
} from "../kernel/reducer-results.mjs";
import {
  assertSurveyFrameProjectionAdmission,
} from "./survey-frame-projection-admission.mjs";

const adapterVersion =
  "mission-kit:survey-v2:survey-initialization-adapter/v1";
const authoringMachineId = "authoring-kernel";
const phaseMachineId = "phase";
const digestPattern = /^sha256:[0-9a-f]{64}$/u;
const issueCodePattern = /^[A-Z][A-Z0-9_]{0,79}$/u;
const runtimeStatuses = new Set([
  "rehydrating",
  "blocked_recoverable",
  "blocked_terminal",
  "active",
]);
const maximumEvidenceEntries = 64;

const expectedMachineEdges = Object.freeze([
  Object.freeze({
    machineId: authoringMachineId,
    transitionId: "AT01",
    fromState: "new",
    eventId: "BEGIN_AUTHORING",
    toState: "survey_frame_required",
  }),
  Object.freeze({
    machineId: phaseMachineId,
    transitionId: "T02",
    fromState: "initialized",
    eventId: "BEGIN_R1_DESIGN",
    toState: "round_1_drafting",
  }),
]);

export class SurveyInitializationAdapterError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "SurveyInitializationAdapterError";
    this.code = code;
  }
}

function fail(code, message) {
  throw new SurveyInitializationAdapterError(code, message);
}

function isRecord(value) {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    types.isProxy(value)
  ) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function exactKeys(value, keys) {
  if (!isRecord(value)) return false;
  const expected = new Set(keys);
  const ownKeys = Reflect.ownKeys(value);
  if (
    ownKeys.length !== keys.length ||
    ownKeys.some(
      (key) =>
        typeof key !== "string" || !expected.has(key),
    )
  ) {
    return false;
  }
  return ownKeys.every((key) => {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    return (
      descriptor?.enumerable === true &&
      Object.prototype.hasOwnProperty.call(descriptor, "value")
    );
  });
}

function deepFreeze(value) {
  if (
    value !== null &&
    typeof value === "object" &&
    !Object.isFrozen(value)
  ) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function canonicalValue(value, label, code) {
  try {
    return stableValue(value);
  } catch (error) {
    fail(
      code,
      `${label} must be canonical plain JSON: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

function assertDigest(value, label) {
  if (typeof value !== "string" || !digestPattern.test(value)) {
    fail(
      "SURVEY_INITIALIZATION_DIGEST_INVALID",
      `${label} must be one canonical sha256 digest`,
    );
  }
}

function same(left, right) {
  return canonicalize(left) === canonicalize(right);
}

function normalizeAuthority(input) {
  const authority = canonicalValue(
    input,
    "Survey initialization authority",
    "SURVEY_INITIALIZATION_AUTHORITY_INVALID",
  );
  if (
    !exactKeys(authority, [
      "directorRef",
      "proposerRef",
      "bindingEvidence",
    ]) ||
    typeof authority.directorRef !== "string" ||
    authority.directorRef.length === 0 ||
    typeof authority.proposerRef !== "string" ||
    authority.proposerRef.length === 0 ||
    typeof authority.bindingEvidence !== "string" ||
    authority.bindingEvidence.length === 0
  ) {
    fail(
      "SURVEY_INITIALIZATION_AUTHORITY_INVALID",
      "Survey initialization authority requires exactly three opaque nonempty string bindings",
    );
  }
  return deepFreeze(authority);
}

function dataProperty(object, key, label) {
  if (
    object === null ||
    typeof object !== "object" ||
    types.isProxy(object)
  ) {
    fail(
      "SURVEY_INITIALIZATION_PORT_INVALID",
      `${label} must be one non-proxy object`,
    );
  }
  const descriptor = Object.getOwnPropertyDescriptor(object, key);
  if (
    descriptor?.enumerable !== true ||
    !Object.prototype.hasOwnProperty.call(descriptor, "value")
  ) {
    fail(
      "SURVEY_INITIALIZATION_PORT_INVALID",
      `${label}.${key} must be one enumerable data property`,
    );
  }
  return descriptor.value;
}

function capturePorts(input) {
  if (
    !exactKeys(input, ["coordinator", "identity", "storeId"])
  ) {
    fail(
      "SURVEY_INITIALIZATION_PORT_INVALID",
      "Survey initialization ports require exactly coordinator, identity, and storeId",
    );
  }
  const coordinator = dataProperty(
    input,
    "coordinator",
    "Survey initialization ports",
  );
  const identity = dataProperty(
    input,
    "identity",
    "Survey initialization ports",
  );
  const storeId = dataProperty(
    input,
    "storeId",
    "Survey initialization ports",
  );
  const read = dataProperty(
    coordinator,
    "read",
    "Survey initialization coordinator",
  );
  const execute = dataProperty(
    coordinator,
    "execute",
    "Survey initialization coordinator",
  );
  const machineStateDigest = dataProperty(
    identity,
    "machineStateDigest",
    "Survey initialization identity",
  );
  if (
    typeof storeId !== "string" ||
    storeId.length === 0 ||
    typeof read !== "function" ||
    typeof execute !== "function" ||
    typeof machineStateDigest !== "function"
  ) {
    fail(
      "SURVEY_INITIALIZATION_PORT_INVALID",
      "Survey initialization ports contain an invalid store or operation",
    );
  }
  return Object.freeze({
    storeId,
    read: (...args) => Reflect.apply(read, coordinator, args),
    execute: (...args) =>
      Reflect.apply(execute, coordinator, args),
    machineStateDigest: (...args) =>
      Reflect.apply(machineStateDigest, identity, args),
  });
}

function normalizeDependencyResult(input) {
  const result = canonicalValue(
    input,
    "Survey initialization dependency result",
    "SURVEY_INITIALIZATION_DEPENDENCY_RESULT_INVALID",
  );
  if (result.status === "ready") {
    if (!exactKeys(result, ["status", "resultDigest"])) {
      fail(
        "SURVEY_INITIALIZATION_DEPENDENCY_RESULT_INVALID",
        "ready dependency result must be exactly {status,resultDigest}",
      );
    }
  } else if (
    result.status === "blocked_recoverable" ||
    result.status === "blocked_terminal"
  ) {
    if (
      !exactKeys(
        result,
        ["status", "resultDigest", "reason"],
      ) ||
      !exactKeys(result.reason, ["code", "message"]) ||
      typeof result.reason.code !== "string" ||
      !issueCodePattern.test(result.reason.code) ||
      typeof result.reason.message !== "string" ||
      result.reason.message.length === 0 ||
      result.reason.message.length > 4096 ||
      !/\S/u.test(result.reason.message)
    ) {
      fail(
        "SURVEY_INITIALIZATION_DEPENDENCY_RESULT_INVALID",
        "blocked dependency result requires one exact typed reason",
      );
    }
  } else {
    fail(
      "SURVEY_INITIALIZATION_DEPENDENCY_RESULT_INVALID",
      "dependency status must be ready, blocked_recoverable, or blocked_terminal",
    );
  }
  assertDigest(
    result.resultDigest,
    "dependency resultDigest",
  );
  return deepFreeze(result);
}

function stateFrom({
  authority,
  runtimeStatus,
  evidence,
  accepted,
}) {
  const body = canonicalValue(
    {
      version: adapterVersion,
      authority,
      authorityDigest: sha256Value(authority),
      runtimeStatus,
      evidence,
      accepted,
    },
    "Survey initialization adapter state",
    "SURVEY_INITIALIZATION_STATE_INVALID",
  );
  return deepFreeze({
    ...body,
    stateDigest: sha256Value(body),
  });
}

function assertEvidence(
  evidence,
  authority,
  expectedOrdinal,
) {
  if (
    evidence.disposition === "wait" &&
    !exactKeys(evidence, [
      "ordinal",
      "authority",
      "dependencyResult",
      "disposition",
      "runtimeStatus",
      "retryAllowed",
    ])
  ) {
    fail(
      "SURVEY_INITIALIZATION_STATE_INVALID",
      "wait evidence contains missing or ambient fields",
    );
  }
  if (
    evidence.disposition === "activated" &&
    !exactKeys(evidence, [
      "ordinal",
      "authority",
      "dependencyResult",
      "disposition",
      "runtimeStatus",
      "commandDigest",
      "receiptDigest",
      "commitRevision",
      "recordDigest",
      "postimageDigest",
    ])
  ) {
    fail(
      "SURVEY_INITIALIZATION_STATE_INVALID",
      "activation evidence contains missing or ambient fields",
    );
  }
  if (
    !["wait", "activated"].includes(evidence.disposition) ||
    evidence.ordinal !== expectedOrdinal ||
    !same(evidence.authority, authority)
  ) {
    fail(
      "SURVEY_INITIALIZATION_STATE_INVALID",
      "adapter evidence has invalid identity, order, or disposition",
    );
  }
  const dependencyResult = normalizeDependencyResult(
    evidence.dependencyResult,
  );
  if (evidence.disposition === "wait") {
    if (
      dependencyResult.status === "ready" ||
      evidence.runtimeStatus !== dependencyResult.status ||
      typeof evidence.retryAllowed !== "boolean" ||
      evidence.retryAllowed !==
        (dependencyResult.status === "blocked_recoverable")
    ) {
      fail(
        "SURVEY_INITIALIZATION_STATE_INVALID",
        "wait evidence differs from its typed dependency result",
      );
    }
  } else {
    if (
      dependencyResult.status !== "ready" ||
      evidence.runtimeStatus !== "active" ||
      !Number.isInteger(evidence.commitRevision) ||
      evidence.commitRevision < 1
    ) {
      fail(
        "SURVEY_INITIALIZATION_STATE_INVALID",
        "activation evidence has an invalid ready postcondition",
      );
    }
    assertDigest(evidence.commandDigest, "evidence commandDigest");
    assertDigest(evidence.receiptDigest, "evidence receiptDigest");
    assertDigest(evidence.recordDigest, "evidence recordDigest");
    assertDigest(evidence.postimageDigest, "evidence postimageDigest");
  }
}

function normalizeState(input, authority) {
  const state = canonicalValue(
    input,
    "Survey initialization adapter state",
    "SURVEY_INITIALIZATION_STATE_INVALID",
  );
  if (
    !exactKeys(state, [
      "version",
      "authority",
      "authorityDigest",
      "runtimeStatus",
      "evidence",
      "accepted",
      "stateDigest",
    ]) ||
    state.version !== adapterVersion ||
    !runtimeStatuses.has(state.runtimeStatus) ||
    !same(state.authority, authority) ||
    state.authorityDigest !== sha256Value(authority) ||
    !Array.isArray(state.evidence) ||
    state.evidence.length > maximumEvidenceEntries
  ) {
    fail(
      "SURVEY_INITIALIZATION_STATE_INVALID",
      "adapter state differs from its closed authority",
    );
  }
  const body = { ...state };
  delete body.stateDigest;
  if (state.stateDigest !== sha256Value(body)) {
    fail(
      "SURVEY_INITIALIZATION_STATE_INVALID",
      "adapter state digest does not seal the exact state",
    );
  }
  state.evidence.forEach((entry, index) =>
    assertEvidence(entry, authority, index + 1));

  if (state.runtimeStatus === "rehydrating") {
    if (state.evidence.length !== 0 || state.accepted !== null) {
      fail(
        "SURVEY_INITIALIZATION_STATE_INVALID",
        "rehydrating state cannot contain dependency or commit evidence",
      );
    }
  } else if (
    state.runtimeStatus === "blocked_recoverable" ||
    state.runtimeStatus === "blocked_terminal"
  ) {
    const last = state.evidence.at(-1);
    if (
      state.accepted !== null ||
      last?.disposition !== "wait" ||
      last.runtimeStatus !== state.runtimeStatus
    ) {
      fail(
        "SURVEY_INITIALIZATION_STATE_INVALID",
        "blocked state lacks its exact wait evidence",
      );
    }
  } else {
    if (
      !exactKeys(state.accepted, [
        "dependencyResult",
        "command",
        "receiptDigest",
        "commitRevision",
        "recordDigest",
        "postimageDigest",
      ]) ||
      state.evidence.at(-1)?.disposition !== "activated" ||
      !same(
        state.accepted.dependencyResult,
        state.evidence.at(-1).dependencyResult,
      ) ||
      state.accepted.command?.commandDigest !==
        state.evidence.at(-1).commandDigest ||
      state.accepted.receiptDigest !==
        state.evidence.at(-1).receiptDigest ||
      state.accepted.commitRevision !==
        state.evidence.at(-1).commitRevision ||
      state.accepted.recordDigest !==
        state.evidence.at(-1).recordDigest ||
      state.accepted.postimageDigest !==
        state.evidence.at(-1).postimageDigest
    ) {
      fail(
        "SURVEY_INITIALIZATION_STATE_INVALID",
        "active state lacks one exact accepted AT01 plus T02 observation",
      );
    }
  }
  return deepFreeze(state);
}

function machineHead(snapshot, machineId, state) {
  const heads = snapshot.machineHeads.filter(
    (head) => head?.machineId === machineId,
  );
  if (
    heads.length !== 1 ||
    heads[0].state !== state ||
    typeof heads[0].stateDigest !== "string" ||
    !digestPattern.test(heads[0].stateDigest)
  ) {
    fail(
      "SURVEY_INITIALIZATION_PRECONDITION_INVALID",
      `${machineId} must have the exact ${state} machine head`,
    );
  }
  return heads[0];
}

function snapshotFromRead(result) {
  if (!isRecord(result)) {
    fail(
      "SURVEY_INITIALIZATION_READ_INVALID",
      "coordinator read returned no closed result object",
    );
  }
  const descriptor = Object.getOwnPropertyDescriptor(
    result,
    "snapshot",
  );
  if (
    descriptor?.enumerable !== true ||
    !Object.prototype.hasOwnProperty.call(descriptor, "value")
  ) {
    fail(
      "SURVEY_INITIALIZATION_READ_INVALID",
      "coordinator read returned no snapshot data property",
    );
  }
  return canonicalValue(
    descriptor.value,
    "coordinator snapshot",
    "SURVEY_INITIALIZATION_READ_INVALID",
  );
}

function assertPreimage(snapshot) {
  if (
    !Number.isInteger(snapshot.commitRevision) ||
    snapshot.commitRevision < 0 ||
    !Array.isArray(snapshot.journal) ||
    snapshot.journal.length !== snapshot.commitRevision ||
    !Array.isArray(snapshot.machineHeads) ||
    !isRecord(snapshot.workspace) ||
    !isRecord(snapshot.workspace.spec) ||
    snapshot.workspace.spec.authoringState !== "new" ||
    snapshot.workspace.spec.openAssignment !== null ||
    !Array.isArray(snapshot.workspace.spec.activeHeads) ||
    !Array.isArray(snapshot.workspace.spec.resourceVersions)
  ) {
    fail(
      "SURVEY_INITIALIZATION_PRECONDITION_INVALID",
      "Survey initialization requires one unassigned new authoring preimage",
    );
  }
  for (const record of snapshot.journal) {
    if (
      Array.isArray(record?.machineEdges) &&
      record.machineEdges.some(
        (edge) =>
          edge?.transitionId === "AT01" ||
          edge?.transitionId === "T02",
      )
    ) {
      fail(
        "SURVEY_INITIALIZATION_PRECONDITION_INVALID",
        "Survey initialization preimage already contains AT01 or T02",
      );
    }
  }
  if (
    snapshot.workspace.spec.resourceVersions.some(
      (stored) =>
        stored?.reference?.kind === "AuthoringAssignment",
    )
  ) {
    fail(
      "SURVEY_INITIALIZATION_PRECONDITION_INVALID",
      "Survey initialization preimage already retains an Assignment",
    );
  }
  const authoringHead = machineHead(
    snapshot,
    authoringMachineId,
    "new",
  );
  const phaseHead = machineHead(
    snapshot,
    phaseMachineId,
    "initialized",
  );
  return { authoringHead, phaseHead };
}

function commandBase(workspace) {
  return {
    authoringState: workspace.spec.authoringState,
    semanticRevision: workspace.spec.semanticRevision,
    semanticStateDigest:
      workspace.spec.integrity.semanticStateDigest,
    activeHeads: stableValue(workspace.spec.activeHeads),
  };
}

function initializationCommandFrom({
  authority,
  dependencyResult,
  base,
  externalCoupling,
}) {
  const payloadDigest = sha256Value({
    domain:
      "mission-kit:survey-v2:initialization-dependency-result/v1",
    dependencyResult,
  });
  const evidenceDigest = sha256Value({
    domain:
      "mission-kit:survey-v2:initialization-authority-evidence/v1",
    authority,
    dependencyResult,
  });
  const commandCore = {
    class: "event",
    eventId: "BEGIN_AUTHORING",
    base,
    payloadDigest,
    evidenceDigest,
    inputs: {},
    externalCouplings: [externalCoupling],
  };
  return deepFreeze(stableValue({
    ...commandCore,
    commandDigest: sha256Value({
      domain:
        "mission-kit:survey-v2:initialization-command/v1",
      command: commandCore,
    }),
  }));
}

function initializationCommand({
  authority,
  dependencyResult,
  snapshot,
  phaseHead,
  machineStateDigest,
}) {
  const journalOrdinal = snapshot.journal.length + 1;
  const afterStateDigest = machineStateDigest({
    machineId: phaseMachineId,
    state: "round_1_drafting",
    journalOrdinal,
  });
  assertDigest(
    afterStateDigest,
    "phase T02 afterStateDigest",
  );
  return initializationCommandFrom({
    authority,
    dependencyResult,
    base: commandBase(snapshot.workspace),
    externalCoupling: {
      machineId: phaseMachineId,
      transitionId: "T02",
      fromState: "initialized",
      eventId: "BEGIN_R1_DESIGN",
      toState: "round_1_drafting",
      beforeStateDigest: phaseHead.stateDigest,
      afterStateDigest,
    },
  });
}

function recoverPublishedInitialization({
  snapshot,
  authority,
  dependencyResult,
  machineStateDigest,
}) {
  if (
    !Number.isInteger(snapshot.commitRevision) ||
    snapshot.commitRevision < 1 ||
    !Array.isArray(snapshot.journal) ||
    snapshot.journal.length !== snapshot.commitRevision ||
    !isRecord(snapshot.workspace) ||
    !isRecord(snapshot.workspace.spec) ||
    snapshot.workspace.spec.authoringState !==
      "survey_frame_required"
  ) {
    fail(
      "SURVEY_INITIALIZATION_RECOVERY_INVALID",
      "initialization recovery requires one exact published AT01 plus T02 postimage",
    );
  }
  const record = snapshot.journal.at(-1);
  const activeHeadsBefore =
    record?.workspaceEffect?.activeHeads?.before;
  const activeHeadsAfter =
    record?.workspaceEffect?.activeHeads?.after;
  if (
    record?.ordinal !== snapshot.journal.length ||
    !isRecord(record.before) ||
    !Number.isInteger(record.before.semanticRevision) ||
    record.before.semanticRevision < 0 ||
    typeof record.before.semanticStateDigest !== "string" ||
    !digestPattern.test(record.before.semanticStateDigest) ||
    !Array.isArray(record.machineEdges) ||
    record.machineEdges.length !== 2 ||
    !same(
      record.machineEdges.map(edgeView),
      expectedMachineEdges,
    ) ||
    !Array.isArray(activeHeadsBefore) ||
    !Array.isArray(activeHeadsAfter) ||
    !same(activeHeadsBefore, activeHeadsAfter) ||
    !same(
      activeHeadsAfter,
      snapshot.workspace.spec.activeHeads,
    )
  ) {
    fail(
      "SURVEY_INITIALIZATION_RECOVERY_INVALID",
      "published initialization ancestry is not the exact AT01 plus T02 boundary",
    );
  }
  const phaseEdge = record.machineEdges[1];
  const expectedPhaseDigest = machineStateDigest({
    machineId: phaseMachineId,
    state: "round_1_drafting",
    journalOrdinal: record.ordinal,
  });
  assertDigest(
    expectedPhaseDigest,
    "recovered phase T02 afterStateDigest",
  );
  if (phaseEdge.afterStateDigest !== expectedPhaseDigest) {
    fail(
      "SURVEY_INITIALIZATION_RECOVERY_INVALID",
      "published phase T02 digest differs from canonical identity authority",
    );
  }
  const command = initializationCommandFrom({
    authority,
    dependencyResult,
    base: {
      authoringState: "new",
      semanticRevision: record.before.semanticRevision,
      semanticStateDigest:
        record.before.semanticStateDigest,
      activeHeads: stableValue(activeHeadsBefore),
    },
    externalCoupling: stableValue(phaseEdge),
  });
  if (
    command.commandDigest !== record.commandDigest ||
    command.payloadDigest !== record.payloadDigest
  ) {
    fail(
      "SURVEY_INITIALIZATION_RECOVERY_MISMATCH",
      "published initialization does not belong to this exact authority and dependency result",
    );
  }
  assertSurveyFrameProjectionAdmission(snapshot.workspace);
  return deepFreeze({
    command,
    before: {
      commitRevision: snapshot.commitRevision - 1,
      journal: snapshot.journal.slice(0, -1),
    },
    published: snapshot,
  });
}

function committedReceipt(result) {
  const stable = canonicalValue(
    result,
    "Survey initialization commit result",
    "SURVEY_INITIALIZATION_COMMIT_INVALID",
  );
  if (
    !exactKeys(stable, ["kind", "receipt"]) ||
    stable.kind !== "committed" ||
    stable.receipt?.kind !== "AuthoringCommitReceipt" ||
    !isRecord(stable.receipt.spec)
  ) {
    fail(
      "SURVEY_INITIALIZATION_COMMIT_INVALID",
      "AT01 must commit one receipt and no sidecar",
    );
  }
  assertDigest(
    stable.receipt.spec.receiptDigest,
    "AT01 receiptDigest",
  );
  const cause = stable.receipt.spec.cause;
  const coupling = stable.receipt.spec.externalCouplings;
  if (
    cause?.class !== "event" ||
    !same(cause.edge, {
      transitionId: "AT01",
      fromState: "new",
      eventId: "BEGIN_AUTHORING",
      toState: "survey_frame_required",
    }) ||
    !Array.isArray(coupling) ||
    coupling.length !== 1 ||
    !same(
      {
        machineId: coupling[0].machineId,
        transitionId: coupling[0].transitionId,
        fromState: coupling[0].fromState,
        eventId: coupling[0].eventId,
        toState: coupling[0].toState,
      },
      expectedMachineEdges[1],
    )
  ) {
    fail(
      "SURVEY_INITIALIZATION_COMMIT_INVALID",
      "receipt does not prove the exact AT01 plus T02 authority",
    );
  }
  return deepFreeze(stable.receipt);
}

function edgeView(edge) {
  return {
    machineId: edge?.machineId,
    transitionId: edge?.transitionId,
    fromState: edge?.fromState,
    eventId: edge?.eventId,
    toState: edge?.toState,
  };
}

function assertPostimage({
  before,
  after,
  command,
  receipt,
}) {
  if (
    after.commitRevision !== before.commitRevision + 1 ||
    !Array.isArray(after.journal) ||
    after.journal.length !== before.journal.length + 1 ||
    !same(
      after.journal.slice(0, -1),
      before.journal,
    ) ||
    after.workspace?.spec?.authoringState !==
      "survey_frame_required" ||
    after.workspace.spec.openAssignment !== null ||
    after.workspace.spec.resourceVersions.some(
      (stored) =>
        stored?.reference?.kind === "AuthoringAssignment",
    )
  ) {
    fail(
      "SURVEY_INITIALIZATION_POSTCONDITION_INVALID",
      "AT01 commit did not produce the exact unassigned authoring postimage",
    );
  }
  machineHead(
    after,
    authoringMachineId,
    "survey_frame_required",
  );
  machineHead(after, phaseMachineId, "round_1_drafting");
  const record = after.journal.at(-1);
  if (
    record?.ordinal !== before.journal.length + 1 ||
    !Array.isArray(record.machineEdges) ||
    record.machineEdges.length !== 2 ||
    !same(
      record.machineEdges.map(edgeView),
      expectedMachineEdges,
    ) ||
    !same(
      {
        machineId: record.machineEdges[1].machineId,
        transitionId: record.machineEdges[1].transitionId,
        fromState: record.machineEdges[1].fromState,
        eventId: record.machineEdges[1].eventId,
        toState: record.machineEdges[1].toState,
        beforeStateDigest:
          record.machineEdges[1].beforeStateDigest,
        afterStateDigest:
          record.machineEdges[1].afterStateDigest,
      },
      command.externalCouplings[0],
    ) ||
    receipt.spec.cause.commandDigest !==
      command.commandDigest ||
    receipt.spec.cause.payloadDigest !==
      command.payloadDigest ||
    receipt.spec.cause.evidenceDigest !==
      command.evidenceDigest
  ) {
    fail(
      "SURVEY_INITIALIZATION_POSTCONDITION_INVALID",
      "committed journal is not exactly authoring AT01 plus phase T02",
    );
  }
  return deepFreeze({
    commitRevision: after.commitRevision,
    receiptDigest: receipt.spec.receiptDigest,
    recordDigest: record.recordDigest,
    postimageDigest: sha256Value(after),
  });
}

function blockedAdapterResult(state) {
  const evidence = state.evidence.at(-1);
  return deepFreeze(stableValue({
    kind: "wait",
    authoringResult: kernelWaitResult({
      id: "new",
      label: "New",
      class: "wait",
    }),
    runtimeStatus: state.runtimeStatus,
    retry: {
      allowed: evidence.retryAllowed,
    },
    authority: state.authority,
    evidence,
    state,
  }));
}

function activeResult(state) {
  const evidence = state.evidence.at(-1);
  return deepFreeze(stableValue({
    kind: "initialized",
    runtimeStatus: "active",
    authority: state.authority,
    evidence,
    commit: {
      receiptDigest: state.accepted.receiptDigest,
      commitRevision: state.accepted.commitRevision,
      machineEdges: expectedMachineEdges,
    },
    state,
  }));
}

/**
 * Survey-owned in-memory initialization boundary.
 *
 * runtimeStatus is a deterministic view. This adapter emits no runtime-machine
 * transition: blocked views come from the typed dependency result, and active
 * is exposed only after the exact authoring/AT01 + phase/T02 postimage exists.
 * Filesystem/session persistence remains outside this module.
 */
export function createSurveyInitializationAdapter(
  authorityInput,
  portInput,
) {
  // Authority is deliberately validated before any capability is inspected.
  const authority = normalizeAuthority(authorityInput);
  const ports = capturePorts(portInput);
  const initialState = stateFrom({
    authority,
    runtimeStatus: "rehydrating",
    evidence: [],
    accepted: null,
  });

  async function block(state, dependencyResult) {
    if (state.runtimeStatus === "active") {
      fail(
        "SURVEY_INITIALIZATION_ALREADY_ACTIVE",
        "an active adapter cannot accept a blocked dependency result",
      );
    }
    const previous = state.evidence.at(-1);
    if (state.runtimeStatus === "blocked_terminal") {
      if (
        previous?.disposition === "wait" &&
        same(previous.dependencyResult, dependencyResult)
      ) {
        return blockedAdapterResult(state);
      }
      fail(
        "SURVEY_INITIALIZATION_TERMINAL",
        "terminal dependency state is irreversible and admits only exact replay",
      );
    }
    if (
      previous?.disposition === "wait" &&
      same(previous.dependencyResult, dependencyResult)
    ) {
      return blockedAdapterResult(state);
    }
    if (state.evidence.length >= maximumEvidenceEntries) {
      fail(
        "SURVEY_INITIALIZATION_EVIDENCE_LIMIT",
        `initialization evidence cannot exceed ${maximumEvidenceEntries} immutable entries`,
      );
    }
    const evidence = {
      ordinal: state.evidence.length + 1,
      authority,
      dependencyResult,
      disposition: "wait",
      runtimeStatus: dependencyResult.status,
      retryAllowed:
        dependencyResult.status === "blocked_recoverable",
    };
    const next = stateFrom({
      authority,
      runtimeStatus: dependencyResult.status,
      evidence: [...state.evidence, evidence],
      accepted: null,
    });
    return blockedAdapterResult(next);
  }

  async function activate(state, dependencyResult) {
    if (state.runtimeStatus === "blocked_terminal") {
      fail(
        "SURVEY_INITIALIZATION_TERMINAL",
        "terminal dependency state cannot be retried",
      );
    }
    if (state.runtimeStatus === "active") {
      if (
        !same(
          state.accepted.dependencyResult,
          dependencyResult,
        )
      ) {
        fail(
          "SURVEY_INITIALIZATION_REPLAY_MISMATCH",
          "active replay must use the accepted ready dependency result",
        );
      }
      const before = snapshotFromRead(
        await ports.read(ports.storeId),
      );
      const replay = await ports.execute(
        ports.storeId,
        state.accepted.command,
      );
      const receipt = committedReceipt(replay);
      if (
        receipt.spec.receiptDigest !==
          state.accepted.receiptDigest
      ) {
        fail(
          "SURVEY_INITIALIZATION_REPLAY_MISMATCH",
          "idempotent AT01 replay returned a different receipt",
        );
      }
      const after = snapshotFromRead(
        await ports.read(ports.storeId),
      );
      const acceptedIndex =
        state.accepted.commitRevision - 1;
      const acceptedRecord =
        after.journal?.[acceptedIndex];
      const acceptedOutcome =
        after.idempotencyOutcomeView?.[acceptedIndex];
      if (
        !same(before, after) ||
        after.commitRevision <
          state.accepted.commitRevision ||
        acceptedRecord?.ordinal !==
          state.accepted.commitRevision ||
        acceptedRecord?.recordDigest !==
          state.accepted.recordDigest ||
        acceptedRecord?.commandDigest !==
          state.accepted.command.commandDigest ||
        acceptedRecord?.payloadDigest !==
          state.accepted.command.payloadDigest ||
        !same(
          acceptedRecord?.machineEdges?.map(edgeView),
          expectedMachineEdges,
        ) ||
        acceptedOutcome?.recordDigest !==
          state.accepted.recordDigest ||
        acceptedOutcome?.outcome?.receipt?.receiptDigest !==
          state.accepted.receiptDigest
      ) {
        fail(
          "SURVEY_INITIALIZATION_REPLAY_MISMATCH",
          "idempotent AT01 replay changed the current store or lost its authenticated initialization ancestor",
        );
      }
      return activeResult(state);
    }
    if (state.evidence.length >= maximumEvidenceEntries) {
      fail(
        "SURVEY_INITIALIZATION_EVIDENCE_LIMIT",
        `initialization evidence cannot exceed ${maximumEvidenceEntries} immutable entries`,
      );
    }

    const observed = snapshotFromRead(
      await ports.read(ports.storeId),
    );
    let before;
    let command;
    let published = null;
    if (
      observed.workspace?.spec?.authoringState === "new"
    ) {
      const { phaseHead } = assertPreimage(observed);
      assertSurveyFrameProjectionAdmission(
        observed.workspace,
      );
      before = observed;
      command = initializationCommand({
        authority,
        dependencyResult,
        snapshot: observed,
        phaseHead,
        machineStateDigest: ports.machineStateDigest,
      });
    } else {
      const recovered = recoverPublishedInitialization({
        snapshot: observed,
        authority,
        dependencyResult,
        machineStateDigest: ports.machineStateDigest,
      });
      before = recovered.before;
      command = recovered.command;
      published = recovered.published;
    }
    const commitResult = await ports.execute(
      ports.storeId,
      command,
    );
    const receipt = committedReceipt(commitResult);
    const after = snapshotFromRead(
      await ports.read(ports.storeId),
    );
    if (
      published !== null &&
      !same(after, published)
    ) {
      fail(
        "SURVEY_INITIALIZATION_RECOVERY_MISMATCH",
        "idempotent initialization recovery changed the published postimage",
      );
    }
    const observation = assertPostimage({
      before,
      after,
      command,
      receipt,
    });
    const evidence = {
      ordinal: state.evidence.length + 1,
      authority,
      dependencyResult,
      disposition: "activated",
      runtimeStatus: "active",
      commandDigest: command.commandDigest,
      receiptDigest: observation.receiptDigest,
      commitRevision: observation.commitRevision,
      recordDigest: observation.recordDigest,
      postimageDigest: observation.postimageDigest,
    };
    const next = stateFrom({
      authority,
      runtimeStatus: "active",
      evidence: [...state.evidence, evidence],
      accepted: {
        dependencyResult,
        command,
        receiptDigest: observation.receiptDigest,
        commitRevision: observation.commitRevision,
        recordDigest: observation.recordDigest,
        postimageDigest: observation.postimageDigest,
      },
    });
    return activeResult(next);
  }

  return Object.freeze({
    initialState,
    async advance(stateInput, dependencyResultInput) {
      const state = normalizeState(stateInput, authority);
      const dependencyResult = normalizeDependencyResult(
        dependencyResultInput,
      );
      return dependencyResult.status === "ready"
        ? activate(state, dependencyResult)
        : block(state, dependencyResult);
    },
  });
}
