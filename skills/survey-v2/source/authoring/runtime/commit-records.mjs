import { canonicalize, stableValue } from "../kernel/canonical.mjs";
import {
  authoringDigest,
  commitReceiptDigest,
  journalRecordDigest,
  mutationDigest as deriveMutationDigest,
  projectJournalRecordAuthenticationCore,
  resourceIntegrityDigest,
  resourceReferenceFrom,
} from "../kernel/digests.mjs";
import {
  COMMIT_SIDECAR_RESOURCE_LIMIT,
} from "../kernel/limits.mjs";
import { workspaceRevisionState } from "./workspace-application.mjs";

const digestPattern = /^sha256:[0-9a-f]{64}$/u;
const semanticIdPattern =
  /^[a-z][a-z0-9]*(?:[._:/-][a-z0-9]+)*$/u;
const stateIdPattern = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/u;
const eventIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$/u;
const transitionIdPattern = /^[A-Z][A-Z0-9]*$/u;
const idempotencyKeyPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/u;

export class AuthoringCommitRecordError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "AuthoringCommitRecordError";
    this.code = code;
    for (const [key, value] of Object.entries(details)) this[key] = value;
  }
}

function fail(code, message, details) {
  throw new AuthoringCommitRecordError(code, message, details);
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function exactKeys(value, required, optional = []) {
  if (!isRecord(value)) return false;
  const allowed = new Set([...required, ...optional]);
  return (
    required.every((key) => Object.hasOwn(value, key)) &&
    Object.keys(value).every((key) => allowed.has(key))
  );
}

function detached(value, label) {
  try {
    return stableValue(value);
  } catch (error) {
    fail(
      "COMMIT_INPUT_NON_CANONICAL",
      `${label} must be one canonical JSON value: ${error.message}`,
    );
  }
}

function deepFreeze(value) {
  if (value === null || typeof value !== "object") return value;
  const pending = [value];
  while (pending.length > 0) {
    const current = pending.pop();
    if (Object.isFrozen(current)) continue;
    for (const child of Object.values(current)) {
      if (
        child !== null &&
        typeof child === "object" &&
        !Object.isFrozen(child)
      ) {
        pending.push(child);
      }
    }
    Object.freeze(current);
  }
  return value;
}

function frozen(value, label = "commit result") {
  return deepFreeze(detached(value, label));
}

function same(left, right) {
  return canonicalize(left) === canonicalize(right);
}

function compareUtf8(left, right) {
  return Buffer.compare(
    Buffer.from(left, "utf8"),
    Buffer.from(right, "utf8"),
  );
}

function assertDigest(value, label) {
  if (typeof value !== "string" || !digestPattern.test(value)) {
    fail("COMMIT_DIGEST_INVALID", `${label} must be one sha256 digest`);
  }
}

function digestHex(value, label) {
  assertDigest(value, label);
  return value.slice("sha256:".length);
}

function assertSemanticId(value, label) {
  if (
    typeof value !== "string" ||
    value.length > 160 ||
    !semanticIdPattern.test(value)
  ) {
    fail("COMMIT_ID_INVALID", `${label} must be one semantic identifier`);
  }
}

function assertStateId(value, label) {
  if (
    typeof value !== "string" ||
    value.length > 80 ||
    !stateIdPattern.test(value)
  ) {
    fail("MACHINE_EDGE_INVALID", `${label} must be one state identifier`);
  }
}

function assertReference(reference, label, kind) {
  if (
    !exactKeys(
      reference,
      ["apiVersion", "kind", "name", "semanticDigest"],
    ) ||
    typeof reference.apiVersion !== "string" ||
    typeof reference.kind !== "string" ||
    typeof reference.name !== "string" ||
    (kind !== undefined && reference.kind !== kind)
  ) {
    fail(
      "COMMIT_REFERENCE_INVALID",
      `${label} must be one closed${kind ? ` ${kind}` : ""} ResourceReference`,
    );
  }
  assertDigest(reference.semanticDigest, `${label}.semanticDigest`);
}

function assertDigestBinding(binding, label) {
  if (
    !exactKeys(binding, ["id", "digest"]) ||
    typeof binding.id !== "string"
  ) {
    fail(
      "COMMIT_BINDING_INVALID",
      `${label} must be one closed digest binding`,
    );
  }
  assertDigest(binding.digest, `${label}.digest`);
}

function assertAssignmentBinding(binding, label) {
  if (!exactKeys(binding, ["reference", "assignmentDigest"])) {
    fail(
      "COMMIT_OUTCOME_INVALID",
      `${label} must be one closed Assignment binding`,
    );
  }
  assertReference(binding.reference, `${label}.reference`, "AuthoringAssignment");
  assertDigest(binding.assignmentDigest, `${label}.assignmentDigest`);
}

function assertSubmissionBinding(binding, label) {
  if (!exactKeys(binding, ["reference", "normalizedSubmissionDigest"])) {
    fail(
      "COMMIT_OUTCOME_INVALID",
      `${label} must be one closed Submission binding`,
    );
  }
  assertReference(binding.reference, `${label}.reference`, "AuthoringSubmission");
  assertDigest(
    binding.normalizedSubmissionDigest,
    `${label}.normalizedSubmissionDigest`,
  );
}

function assertReceiptBinding(binding, label) {
  if (!exactKeys(binding, ["reference", "receiptDigest"])) {
    fail(
      "COMMIT_OUTCOME_INVALID",
      `${label} must be one closed Receipt binding`,
    );
  }
  assertReference(
    binding.reference,
    `${label}.reference`,
    "AuthoringCommitReceipt",
  );
  assertDigest(binding.receiptDigest, `${label}.receiptDigest`);
}

function assertIssueReferences(issues, label) {
  if (!Array.isArray(issues) || issues.length === 0) {
    fail(
      "COMMIT_OUTCOME_INVALID",
      `${label} must be a non-empty ordered ValidationIssue reference array`,
    );
  }
  issues.forEach((reference, index) => {
    assertReference(
      reference,
      `${label}[${index}]`,
      "ValidationIssue",
    );
  });
}

function assertSidecarReferences(sidecars, label) {
  if (
    !Array.isArray(sidecars) ||
    sidecars.length === 0 ||
    sidecars.length > COMMIT_SIDECAR_RESOURCE_LIMIT
  ) {
    fail(
      "COMMIT_OUTCOME_INVALID",
      `${label} must be a non-empty bounded ResourceReference array`,
    );
  }
  const seen = new Set();
  sidecars.forEach((reference, index) => {
    assertReference(reference, `${label}[${index}]`);
    const key = canonicalize(reference);
    if (seen.has(key)) {
      fail(
        "COMMIT_OUTCOME_INVALID",
        `${label}[${index}] duplicates an earlier sidecar reference`,
      );
    }
    seen.add(key);
  });
}

function rejectLaterDigestKeys(value, label) {
  const pending = [{ value, path: label }];
  while (pending.length > 0) {
    const current = pending.pop();
    if (current.value === null || typeof current.value !== "object") continue;
    for (const [key, child] of Object.entries(current.value)) {
      if (
        key === "recordDigest" ||
        key === "rootSealDigest" ||
        key === "resultingRootSealDigest"
      ) {
        fail(
          "EVIDENCE_MUTATION_DIGEST_CYCLE",
          `${current.path}.${key} is later identity and cannot enter EvidenceCommitPlan`,
        );
      }
      pending.push({ value: child, path: `${current.path}.${key}` });
    }
  }
}

export function assertCommitOutcome(outcome, { commitKind } = {}) {
  const stable = detached(outcome, "commit outcome");
  if (!isRecord(stable) || typeof stable.class !== "string") {
    fail(
      "COMMIT_OUTCOME_INVALID",
      "commit outcome must be one closed discriminated object",
    );
  }
  switch (stable.class) {
    case "assignment-issued":
      if (!exactKeys(stable, ["class", "assignment"])) {
        fail(
          "COMMIT_OUTCOME_INVALID",
          "assignment-issued outcome has ambient or missing fields",
        );
      }
      assertAssignmentBinding(stable.assignment, "outcome.assignment");
      break;
    case "submission-rejected":
      if (
        !exactKeys(
          stable,
          ["class", "assignment", "submission", "issues"],
        )
      ) {
        fail(
          "COMMIT_OUTCOME_INVALID",
          "submission-rejected outcome has ambient or missing fields",
        );
      }
      assertAssignmentBinding(stable.assignment, "outcome.assignment");
      assertSubmissionBinding(stable.submission, "outcome.submission");
      assertIssueReferences(stable.issues, "outcome.issues");
      break;
    case "event-rejected":
      if (!exactKeys(stable, ["class", "eventId", "issues"])) {
        fail(
          "COMMIT_OUTCOME_INVALID",
          "event-rejected outcome has ambient or missing fields",
        );
      }
      if (
        typeof stable.eventId !== "string" ||
        !eventIdPattern.test(stable.eventId)
      ) {
        fail(
          "COMMIT_OUTCOME_INVALID",
          "event-rejected eventId is invalid",
        );
      }
      assertIssueReferences(stable.issues, "outcome.issues");
      break;
    case "assignment-cancelled":
      if (!exactKeys(stable, ["class", "assignment"])) {
        fail(
          "COMMIT_OUTCOME_INVALID",
          "assignment-cancelled outcome has ambient or missing fields",
        );
      }
      assertAssignmentBinding(stable.assignment, "outcome.assignment");
      break;
    case "transition-committed":
      if (
        !exactKeys(stable, ["class", "receipt"]) &&
        !exactKeys(stable, ["class", "receipt", "sidecars"])
      ) {
        fail(
          "COMMIT_OUTCOME_INVALID",
          "transition-committed outcome has ambient or missing fields",
        );
      }
      assertReceiptBinding(stable.receipt, "outcome.receipt");
      if (Object.hasOwn(stable, "sidecars")) {
        assertSidecarReferences(stable.sidecars, "outcome.sidecars");
        if (
          stable.sidecars.some(
            (reference) =>
              canonicalize(reference) ===
                canonicalize(stable.receipt.reference),
          )
        ) {
          fail(
            "COMMIT_OUTCOME_INVALID",
            "transition sidecars cannot alias the commit Receipt",
          );
        }
      }
      break;
    default:
      fail(
        "COMMIT_OUTCOME_INVALID",
        `unsupported commit outcome class ${stable.class}`,
      );
  }
  if (
    commitKind === "evidence" &&
    stable.class === "transition-committed"
  ) {
    fail(
      "COMMIT_OUTCOME_KIND_MISMATCH",
      "evidence records cannot carry a transition-committed outcome",
    );
  }
  if (
    commitKind === "transition" &&
    stable.class !== "transition-committed"
  ) {
    fail(
      "COMMIT_OUTCOME_KIND_MISMATCH",
      "transition records require a transition-committed outcome",
    );
  }
  return frozen(stable, "commit outcome");
}

function assertRevisionState(value, label) {
  if (
    !exactKeys(
      value,
      ["semanticRevision", "evidenceRevision", "semanticStateDigest"],
    ) ||
    !Number.isInteger(value.semanticRevision) ||
    value.semanticRevision < 0 ||
    !Number.isInteger(value.evidenceRevision) ||
    value.evidenceRevision < 0
  ) {
    fail(
      "COMMIT_REVISION_STATE_INVALID",
      `${label} must be one closed non-negative revision state`,
    );
  }
  assertDigest(value.semanticStateDigest, `${label}.semanticStateDigest`);
}

function assertRevisionTransition(before, after, commitKind) {
  assertRevisionState(before, "before");
  assertRevisionState(after, "after");
  if (after.evidenceRevision !== before.evidenceRevision + 1) {
    fail(
      "COMMIT_EVIDENCE_REVISION_DISCONTINUITY",
      "every persisted write increments evidenceRevision exactly once",
    );
  }
  if (commitKind === "evidence") {
    if (
      after.semanticRevision !== before.semanticRevision ||
      after.semanticStateDigest !== before.semanticStateDigest
    ) {
      fail(
        "EVIDENCE_COMMIT_SEMANTIC_CHANGE",
        "evidence commit changed semantic revision or digest",
      );
    }
  } else if (
    after.semanticRevision !== before.semanticRevision + 1 ||
    after.semanticStateDigest === before.semanticStateDigest
  ) {
    fail(
      "TRANSITION_COMMIT_SEMANTIC_DISCONTINUITY",
      "transition commit must increment and reseal semantic state exactly once",
    );
  }
}

function normalizeRetainedResource(record, label) {
  if (
    !exactKeys(record, ["reference", "integrityDigest", "resource"]) ||
    !isRecord(record.resource)
  ) {
    fail(
      "EVIDENCE_RETAINED_RESOURCE_INVALID",
      `${label} must be one closed StoredResourceVersion`,
    );
  }
  assertReference(record.reference, `${label}.reference`);
  assertDigest(record.integrityDigest, `${label}.integrityDigest`);
  if (!same(record.reference, resourceReferenceFrom(record.resource))) {
    fail(
      "EVIDENCE_RETAINED_RESOURCE_INVALID",
      `${label}.reference differs from the retained resource`,
    );
  }
  if (record.integrityDigest !== resourceIntegrityDigest(record.resource)) {
    fail(
      "EVIDENCE_RETAINED_RESOURCE_INVALID",
      `${label}.integrityDigest differs from the retained resource bytes`,
    );
  }
  return {
    reference: record.reference,
    integrityDigest: record.integrityDigest,
  };
}

function assertOpenAssignmentPair(value) {
  if (!exactKeys(value, ["before", "after"])) {
    fail(
      "EVIDENCE_OPEN_ASSIGNMENT_INVALID",
      "openAssignment must be exactly {before,after}",
    );
  }
  for (const field of ["before", "after"]) {
    if (value[field] !== null) {
      assertAssignmentBinding(value[field], `openAssignment.${field}`);
    }
  }
}

function assertSlotReference(value, label) {
  if (
    !exactKeys(value, ["slot", "reference"]) ||
    typeof value.slot !== "string" ||
    value.slot.length === 0
  ) {
    fail(
      "COMMIT_WORKSPACE_EFFECT_INVALID",
      `${label} must be one closed SlotReference`,
    );
  }
  assertReference(value.reference, `${label}.reference`);
}

function assertDependencyEdge(value, label) {
  if (
    !exactKeys(value, ["from", "to", "relation"]) ||
    typeof value.relation !== "string" ||
    value.relation.length === 0
  ) {
    fail(
      "COMMIT_WORKSPACE_EFFECT_INVALID",
      `${label} must be one closed DependencyEdge`,
    );
  }
  assertReference(value.from, `${label}.from`);
  assertReference(value.to, `${label}.to`);
  assertSemanticId(value.relation, `${label}.relation`);
}

function assertExactArrayBoundary(value, label, assertItem) {
  if (
    !exactKeys(value, ["before", "after"]) ||
    !Array.isArray(value.before) ||
    !Array.isArray(value.after)
  ) {
    fail(
      "COMMIT_WORKSPACE_EFFECT_INVALID",
      `${label} must be exactly {before,after} arrays`,
    );
  }
  for (const side of ["before", "after"]) {
    const seen = new Set();
    value[side].forEach((item, index) => {
      assertItem(item, `${label}.${side}[${index}]`);
      const key = canonicalize(item);
      if (seen.has(key)) {
        fail(
          "COMMIT_WORKSPACE_EFFECT_DUPLICATE",
          `${label}.${side} repeats one exact value`,
        );
      }
      seen.add(key);
    });
  }
}

export function assertWorkspaceEffect(value) {
  const stable = detached(value, "WorkspaceEffect");
  if (
    !exactKeys(stable, [
      "retainedResources",
      "historyReferences",
      "openAssignment",
      "activeHeads",
      "dependencyEdges",
      "handoffProducts",
      "handoffSlots",
    ]) ||
    !Array.isArray(stable.retainedResources) ||
    !Array.isArray(stable.historyReferences) ||
    !Array.isArray(stable.handoffSlots)
  ) {
    fail(
      "COMMIT_WORKSPACE_EFFECT_INVALID",
      "WorkspaceEffect must close retainedResources, historyReferences, openAssignment, activeHeads, dependencyEdges, and handoffProducts",
    );
  }
  const retainedKeys = new Set();
  stable.retainedResources.forEach((binding, index) => {
    if (!exactKeys(binding, ["reference", "integrityDigest"])) {
      fail(
        "COMMIT_WORKSPACE_EFFECT_INVALID",
        `WorkspaceEffect retainedResources[${index}] is not one closed integrity binding`,
      );
    }
    assertReference(
      binding.reference,
      `WorkspaceEffect retainedResources[${index}].reference`,
    );
    assertDigest(
      binding.integrityDigest,
      `WorkspaceEffect retainedResources[${index}].integrityDigest`,
    );
    const key = canonicalize(binding.reference);
    if (retainedKeys.has(key)) {
      fail(
        "COMMIT_WORKSPACE_EFFECT_DUPLICATE",
        "WorkspaceEffect repeats one retained resource reference",
      );
    }
    retainedKeys.add(key);
  });
  const historyKeys = new Set();
  stable.historyReferences.forEach((reference, index) => {
    assertReference(
      reference,
      `WorkspaceEffect historyReferences[${index}]`,
    );
    const key = canonicalize(reference);
    if (historyKeys.has(key)) {
      fail(
        "COMMIT_WORKSPACE_EFFECT_DUPLICATE",
        "WorkspaceEffect repeats one history reference",
      );
    }
    historyKeys.add(key);
  });
  assertOpenAssignmentPair(stable.openAssignment);
  assertExactArrayBoundary(
    stable.activeHeads,
    "WorkspaceEffect activeHeads",
    assertSlotReference,
  );
  assertExactArrayBoundary(
    stable.dependencyEdges,
    "WorkspaceEffect dependencyEdges",
    assertDependencyEdge,
  );
  assertExactArrayBoundary(
    stable.handoffProducts,
    "WorkspaceEffect handoffProducts",
    assertSlotReference,
  );
  const handoffSlots = new Set();
  stable.handoffSlots.forEach((slot, index) => {
    assertSemanticId(
      slot,
      `WorkspaceEffect handoffSlots[${index}]`,
    );
    if (handoffSlots.has(slot)) {
      fail(
        "COMMIT_WORKSPACE_EFFECT_DUPLICATE",
        "WorkspaceEffect repeats one handoff slot",
      );
    }
    handoffSlots.add(slot);
  });
  return frozen(stable, "WorkspaceEffect");
}

export function deriveOperationIdentity(options) {
  const stable = detached(options, "operation identity");
  const common = [
    "operationClass",
    "machineId",
    "operationDigest",
  ];
  if (!isRecord(stable) || !common.every((key) => Object.hasOwn(stable, key))) {
    fail(
      "OPERATION_IDENTITY_INVALID",
      "operation identity requires operationClass and machineId",
    );
  }
  assertSemanticId(stable.machineId, "machineId");
  assertDigest(stable.operationDigest, "operationDigest");
  let key;
  let commandDigest;
  let payloadDigest;
  switch (stable.operationClass) {
    case "assignment-issuance":
      if (
        !exactKeys(stable, [
          ...common,
          "requestDigest",
          "assignmentDigest",
          "priorEvidenceRevision",
        ]) ||
        !Number.isInteger(stable.priorEvidenceRevision) ||
        stable.priorEvidenceRevision < 0
      ) {
        fail(
          "OPERATION_IDENTITY_INVALID",
          "assignment issuance identity is incomplete",
        );
      }
      commandDigest = stable.requestDigest;
      payloadDigest = stable.assignmentDigest;
      key = `issue:${digestHex(stable.assignmentDigest, "assignmentDigest")}:${stable.priorEvidenceRevision}`;
      break;
    case "submission-attempt":
      if (
        !exactKeys(stable, [
          ...common,
          "assignmentDigest",
          "normalizedSubmissionDigest",
        ])
      ) {
        fail(
          "OPERATION_IDENTITY_INVALID",
          "submission attempt identity is incomplete",
        );
      }
      commandDigest = stable.assignmentDigest;
      payloadDigest = stable.normalizedSubmissionDigest;
      key = `submit:${digestHex(stable.assignmentDigest, "assignmentDigest")}:${digestHex(stable.normalizedSubmissionDigest, "normalizedSubmissionDigest")}`;
      break;
    case "cancellation":
      if (
        !exactKeys(stable, [
          ...common,
          "assignmentDigest",
          "cancellationEvidenceDigest",
          "issuanceRecordDigest",
        ])
      ) {
        fail(
          "OPERATION_IDENTITY_INVALID",
          "cancellation identity is incomplete",
        );
      }
      commandDigest = stable.assignmentDigest;
      payloadDigest = stable.cancellationEvidenceDigest;
      assertDigest(
        stable.issuanceRecordDigest,
        "issuanceRecordDigest",
      );
      key =
        `cancel:${digestHex(stable.assignmentDigest, "assignmentDigest")}` +
        `:${digestHex(stable.issuanceRecordDigest, "issuanceRecordDigest")}`;
      break;
    case "event":
      if (
        !exactKeys(stable, [
          ...common,
          "commandDigest",
          "payloadDigest",
        ])
      ) {
        fail(
          "OPERATION_IDENTITY_INVALID",
          "event identity is incomplete",
        );
      }
      commandDigest = stable.commandDigest;
      payloadDigest = stable.payloadDigest;
      key = `event:${digestHex(stable.commandDigest, "commandDigest")}`;
      break;
    default:
      fail(
        "OPERATION_IDENTITY_INVALID",
        `unsupported operation class ${String(stable.operationClass)}`,
      );
  }
  assertDigest(commandDigest, "commandDigest");
  assertDigest(payloadDigest, "payloadDigest");
  if (
    key.length < 8 ||
    key.length > 160 ||
    !idempotencyKeyPattern.test(key)
  ) {
    fail(
      "OPERATION_IDENTITY_INVALID",
      "derived idempotency key is outside the closed contract",
    );
  }
  return frozen({
    idempotency: {
      machineId: stable.machineId,
      key,
    },
    operationDigest: stable.operationDigest,
    commandDigest,
    payloadDigest,
  }, "operation identity");
}

function evidenceMutationCore(plan) {
  const required = [
    "priorJournalHeadDigest",
    "idempotency",
    "operationDigest",
    "commandDigest",
    "payloadDigest",
    "before",
    "after",
    "retainedResources",
    "openAssignment",
    "outcome",
  ];
  if (
    !exactKeys(plan, [...required, "mutationDigest"]) &&
    !exactKeys(plan, required)
  ) {
    fail(
      "EVIDENCE_COMMIT_PLAN_INVALID",
      "EvidenceCommitPlan has ambient or missing fields",
    );
  }
  const core = {};
  for (const field of required) core[field] = plan[field];
  return core;
}

export function evidenceMutationDigest(plan) {
  const stable = detached(plan, "EvidenceCommitPlan");
  const core = evidenceMutationCore(stable);
  rejectLaterDigestKeys(core.outcome, "outcome");
  return authoringDigest("evidence-mutation", core);
}

export function createEvidenceCommitPlan(options) {
  const stable = detached(options, "createEvidenceCommitPlan options");
  if (
    !exactKeys(stable, [
      "priorJournalHeadDigest",
      "idempotency",
      "operationDigest",
      "commandDigest",
      "payloadDigest",
      "before",
      "after",
      "retainedResourceVersions",
      "openAssignment",
      "outcome",
    ])
  ) {
    fail(
      "EVIDENCE_COMMIT_PLAN_INVALID",
      "EvidenceCommitPlan input has ambient or missing fields",
    );
  }
  assertDigest(stable.priorJournalHeadDigest, "priorJournalHeadDigest");
  assertIdempotency(stable.idempotency);
  assertDigest(stable.operationDigest, "operationDigest");
  assertDigest(stable.commandDigest, "commandDigest");
  assertDigest(stable.payloadDigest, "payloadDigest");
  assertRevisionTransition(stable.before, stable.after, "evidence");
  if (!Array.isArray(stable.retainedResourceVersions)) {
    fail(
      "EVIDENCE_RETAINED_RESOURCE_INVALID",
      "retainedResourceVersions must be an ordered array",
    );
  }
  const retainedResources = stable.retainedResourceVersions.map(
    (record, index) => normalizeRetainedResource(
      record,
      `retainedResourceVersions[${index}]`,
    ),
  );
  const retainedKeys = new Set();
  for (const retained of retainedResources) {
    const key = canonicalize(retained.reference);
    if (retainedKeys.has(key)) {
      fail(
        "EVIDENCE_RETAINED_RESOURCE_DUPLICATE",
        "EvidenceCommitPlan repeats one retained resource reference",
      );
    }
    retainedKeys.add(key);
  }
  assertOpenAssignmentPair(stable.openAssignment);
  const outcome = assertCommitOutcome(stable.outcome, {
    commitKind: "evidence",
  });
  rejectLaterDigestKeys(outcome, "outcome");
  const plan = {
    priorJournalHeadDigest: stable.priorJournalHeadDigest,
    idempotency: stable.idempotency,
    operationDigest: stable.operationDigest,
    commandDigest: stable.commandDigest,
    payloadDigest: stable.payloadDigest,
    before: stable.before,
    after: stable.after,
    retainedResources,
    openAssignment: stable.openAssignment,
    outcome,
    mutationDigest: `sha256:${"0".repeat(64)}`,
  };
  plan.mutationDigest = evidenceMutationDigest(plan);
  return frozen(plan, "EvidenceCommitPlan");
}

export function assertEvidenceCommitPlan(plan) {
  const stable = detached(plan, "EvidenceCommitPlan");
  if (
    !exactKeys(stable, [
      "priorJournalHeadDigest",
      "idempotency",
      "operationDigest",
      "commandDigest",
      "payloadDigest",
      "before",
      "after",
      "retainedResources",
      "openAssignment",
      "outcome",
      "mutationDigest",
    ])
  ) {
    fail(
      "EVIDENCE_COMMIT_PLAN_INVALID",
      "EvidenceCommitPlan has ambient or missing fields",
    );
  }
  assertDigest(stable.priorJournalHeadDigest, "priorJournalHeadDigest");
  assertIdempotency(stable.idempotency);
  assertDigest(stable.operationDigest, "operationDigest");
  assertDigest(stable.commandDigest, "commandDigest");
  assertDigest(stable.payloadDigest, "payloadDigest");
  assertRevisionTransition(stable.before, stable.after, "evidence");
  if (!Array.isArray(stable.retainedResources)) {
    fail(
      "EVIDENCE_RETAINED_RESOURCE_INVALID",
      "retainedResources must be an ordered array",
    );
  }
  const retainedKeys = new Set();
  stable.retainedResources.forEach((record, index) => {
    if (!exactKeys(record, ["reference", "integrityDigest"])) {
      fail(
        "EVIDENCE_RETAINED_RESOURCE_INVALID",
        `retainedResources[${index}] is not one closed evidence binding`,
      );
    }
    assertReference(
      record.reference,
      `retainedResources[${index}].reference`,
    );
    assertDigest(
      record.integrityDigest,
      `retainedResources[${index}].integrityDigest`,
    );
    const key = canonicalize(record.reference);
    if (retainedKeys.has(key)) {
      fail(
        "EVIDENCE_RETAINED_RESOURCE_DUPLICATE",
        "EvidenceCommitPlan repeats one retained resource reference",
      );
    }
    retainedKeys.add(key);
  });
  assertOpenAssignmentPair(stable.openAssignment);
  assertCommitOutcome(stable.outcome, { commitKind: "evidence" });
  rejectLaterDigestKeys(stable.outcome, "outcome");
  if (stable.mutationDigest !== evidenceMutationDigest(stable)) {
    fail(
      "EVIDENCE_COMMIT_PLAN_DIGEST_MISMATCH",
      "EvidenceCommitPlan mutationDigest differs from its complete ancestry",
    );
  }
  return frozen(stable, "EvidenceCommitPlan");
}

function assertEvidencePlanRecordAncestry(
  evidencePlan,
  record,
  priorJournalHeadDigest,
) {
  const plan = assertEvidenceCommitPlan(evidencePlan);
  if (
    plan.priorJournalHeadDigest !== priorJournalHeadDigest ||
    !same(plan.idempotency, record.idempotency) ||
    plan.operationDigest !== record.operationDigest ||
    plan.commandDigest !== record.commandDigest ||
    plan.payloadDigest !== record.payloadDigest ||
    !same(plan.before, record.before) ||
    !same(plan.after, record.after) ||
    plan.mutationDigest !== record.mutationDigest
  ) {
    fail(
      "EVIDENCE_COMMIT_PLAN_RECORD_MISMATCH",
      "evidence JournalRecord differs from its complete EvidenceCommitPlan ancestry",
    );
  }
  return plan;
}

function assertMutation(mutation) {
  if (
    !isRecord(mutation) ||
    mutation.apiVersion !== "authoring.mission-kit/v1alpha1" ||
    mutation.kind !== "AuthoringMutation" ||
    !isRecord(mutation.spec)
  ) {
    fail(
      "COMMIT_MUTATION_INVALID",
      "receipt mutation must be one AuthoringMutation",
    );
  }
  if (mutation.spec.mutationDigest !== deriveMutationDigest(mutation)) {
    fail(
      "COMMIT_MUTATION_DIGEST_MISMATCH",
      "AuthoringMutation digest differs from its exact body",
    );
  }
}

export function deriveSupersededDescendants(mutation) {
  const stable = detached(mutation, "supersession Mutation");
  assertMutation(stable);
  if (
    !Array.isArray(stable.spec.supersededResources) ||
    !Array.isArray(stable.spec.activeHeadChanges)
  ) {
    fail(
      "COMMIT_SUPERSESSION_INVALID",
      "supersession requires ordered resources and active-head changes",
    );
  }
  stable.spec.supersededResources.forEach((reference, index) =>
    assertReference(reference, `supersededResources[${index}]`));
  stable.spec.activeHeadChanges.forEach((change, index) => {
    if (
      !exactKeys(change, ["slot", "before", "after"]) ||
      typeof change.slot !== "string" ||
      (
        change.before !== null &&
        !isRecord(change.before)
      ) ||
      (
        change.after !== null &&
        !isRecord(change.after)
      )
    ) {
      fail(
        "COMMIT_SUPERSESSION_INVALID",
        `activeHeadChanges[${index}] is not one closed change`,
      );
    }
    if (change.before !== null) {
      assertReference(change.before, `activeHeadChanges[${index}].before`);
    }
    if (change.after !== null) {
      assertReference(change.after, `activeHeadChanges[${index}].after`);
    }
  });
  const descendants = stable.spec.supersededResources.map((reference) => {
    const matches = stable.spec.activeHeadChanges.filter(
      (change) =>
        change.before !== null &&
        same(change.before, reference),
    );
    if (matches.length > 1) {
      fail(
        "COMMIT_SUPERSESSION_INVALID",
        "one superseded resource cannot be replaced by multiple active-head changes",
      );
    }
    const replacement = matches[0]?.after;
    if (replacement !== null && replacement !== undefined) {
      return {
        reference,
        disposition: "superseded",
        supersededBy: replacement,
      };
    }
    return {
      reference,
      disposition: "invalidated",
    };
  });
  return frozen(descendants, "superseded descendants");
}

function assertSupersededDescendants(descendants, mutation) {
  if (!Array.isArray(descendants)) {
    fail(
      "COMMIT_SUPERSESSION_INVALID",
      "supersededDescendants must be an ordered array",
    );
  }
  descendants.forEach((descendant, index) => {
    if (
      !exactKeys(
        descendant,
        ["reference", "disposition"],
        ["supersededBy"],
      ) ||
      !["superseded", "invalidated"].includes(descendant.disposition)
    ) {
      fail(
        "COMMIT_SUPERSESSION_INVALID",
        `supersededDescendants[${index}] is invalid`,
      );
    }
    assertReference(
      descendant.reference,
      `supersededDescendants[${index}].reference`,
    );
    if (Object.hasOwn(descendant, "supersededBy")) {
      assertReference(
        descendant.supersededBy,
        `supersededDescendants[${index}].supersededBy`,
      );
    }
  });
  if (!same(descendants, deriveSupersededDescendants(mutation))) {
    fail(
      "COMMIT_SUPERSESSION_MISMATCH",
      "receipt supersession dispositions differ from the exact Mutation ancestry",
    );
  }
}

export function createAuthoringCommitReceipt(options) {
  const stable = detached(options, "createAuthoringCommitReceipt options");
  if (
    !exactKeys(
      stable,
      [
        "mutation",
        "beforeWorkspace",
        "afterWorkspace",
        "idempotencyKey",
        "supersededDescendants",
      ],
      ["name"],
    )
  ) {
    fail(
      "COMMIT_RECEIPT_INVALID",
      "receipt construction input has ambient or missing fields",
    );
  }
  assertMutation(stable.mutation);
  const before = workspaceRevisionState(stable.beforeWorkspace);
  const after = workspaceRevisionState(stable.afterWorkspace);
  assertRevisionTransition(before, after, "transition");
  if (
    !same(before, {
      semanticRevision: stable.mutation.spec.expected.semanticRevision,
      evidenceRevision: before.evidenceRevision,
      semanticStateDigest: stable.mutation.spec.expected.semanticStateDigest,
    }) ||
    stable.beforeWorkspace.spec.authoringState !==
      stable.mutation.spec.expected.authoringState ||
    stable.afterWorkspace.spec.authoringState !==
      stable.mutation.spec.nextAuthoringState
  ) {
    fail(
      "COMMIT_RECEIPT_STATE_MISMATCH",
      "receipt workspace states differ from the exact Mutation boundary",
    );
  }
  if (
    typeof stable.idempotencyKey !== "string" ||
    stable.idempotencyKey.length < 8 ||
    stable.idempotencyKey.length > 160 ||
    !idempotencyKeyPattern.test(stable.idempotencyKey)
  ) {
    fail(
      "COMMIT_RECEIPT_INVALID",
      "receipt idempotencyKey is outside the closed contract",
    );
  }
  assertSupersededDescendants(
    stable.supersededDescendants,
    stable.mutation,
  );
  const receipt = {
    apiVersion: "authoring.mission-kit/v1alpha1",
    kind: "AuthoringCommitReceipt",
    metadata: {
      name: stable.name ?? "pending",
    },
    spec: {
      receiptDigest: `sha256:${"0".repeat(64)}`,
      idempotencyKey: stable.idempotencyKey,
      cause: stable.mutation.spec.cause,
      mutation: {
        reference: resourceReferenceFrom(stable.mutation),
        mutationDigest: stable.mutation.spec.mutationDigest,
      },
      before,
      after,
      createdResources: stable.mutation.spec.createdResources.map(
        (record) => record.reference,
      ),
      supersededDescendants: stable.supersededDescendants,
      handoffProducts: stable.mutation.spec.handoffProducts,
      externalCouplings: stable.mutation.spec.externalCouplings,
    },
  };
  receipt.spec.receiptDigest = commitReceiptDigest(receipt);
  if (!Object.hasOwn(stable, "name")) {
    receipt.metadata.name =
      `receipt-${receipt.spec.receiptDigest.slice("sha256:".length)}`;
  }
  if (commitReceiptDigest(receipt) !== receipt.spec.receiptDigest) {
    fail(
      "COMMIT_RECEIPT_DIGEST_UNSTABLE",
      "receipt identity changed after deterministic naming",
    );
  }
  return frozen(receipt, "AuthoringCommitReceipt");
}

function assertMachineHead(head, label) {
  if (
    !exactKeys(head, ["machineId", "state", "stateDigest"]) ||
    typeof head.machineId !== "string"
  ) {
    fail(
      "MACHINE_HEAD_INVALID",
      `${label} must be exactly {machineId,state,stateDigest}`,
    );
  }
  assertSemanticId(head.machineId, `${label}.machineId`);
  assertStateId(head.state, `${label}.state`);
  assertDigest(head.stateDigest, `${label}.stateDigest`);
}

function assertMachineEdge(edge, label) {
  if (
    !exactKeys(edge, [
      "machineId",
      "transitionId",
      "fromState",
      "eventId",
      "toState",
      "beforeStateDigest",
      "afterStateDigest",
    ])
  ) {
    fail(
      "MACHINE_EDGE_INVALID",
      `${label} must be one closed machine edge`,
    );
  }
  assertSemanticId(edge.machineId, `${label}.machineId`);
  if (
    typeof edge.transitionId !== "string" ||
    edge.transitionId.length < 2 ||
    edge.transitionId.length > 32 ||
    !transitionIdPattern.test(edge.transitionId)
  ) {
    fail(
      "MACHINE_EDGE_INVALID",
      `${label}.transitionId must be one transition identifier`,
    );
  }
  assertStateId(edge.fromState, `${label}.fromState`);
  if (
    typeof edge.eventId !== "string" ||
    edge.eventId.length > 80 ||
    !eventIdPattern.test(edge.eventId)
  ) {
    fail(
      "MACHINE_EDGE_INVALID",
      `${label}.eventId must be one event identifier`,
    );
  }
  assertStateId(edge.toState, `${label}.toState`);
  assertDigest(edge.beforeStateDigest, `${label}.beforeStateDigest`);
  assertDigest(edge.afterStateDigest, `${label}.afterStateDigest`);
}

function assertMachineHeadOrder(heads) {
  let prior;
  const seen = new Set();
  heads.forEach((head, index) => {
    assertMachineHead(head, `machineHeads[${index}]`);
    if (
      prior !== undefined &&
      compareUtf8(prior, head.machineId) >= 0
    ) {
      fail(
        "MACHINE_HEAD_ORDER_INVALID",
        "machineHeads must be unique and UTF-8 machine-id ordered",
      );
    }
    if (seen.has(head.machineId)) {
      fail("MACHINE_HEAD_DUPLICATE", "machineHeads repeats one machine");
    }
    seen.add(head.machineId);
    prior = head.machineId;
  });
}

function machineDigest(identity, occurrence) {
  if (
    !isRecord(identity) ||
    typeof identity.machineStateDigest !== "function"
  ) {
    fail(
      "JOURNAL_IDENTITY_PORT_INVALID",
      "transition edge derivation requires a compiled JournalIdentityPort",
    );
  }
  let digest;
  try {
    digest = identity.machineStateDigest(occurrence);
  } catch (error) {
    fail(
      "JOURNAL_IDENTITY_EXECUTION_FAILED",
      `machine-state identity failed: ${error.message}`,
    );
  }
  assertDigest(digest, "machineStateDigest result");
  return digest;
}

export function deriveTransitionMachineEdges(options) {
  const stableOptions = { ...options };
  if (
    !exactKeys(
      stableOptions,
      [
        "mutation",
        "machineHeads",
        "authoringMachineId",
        "journalOrdinal",
        "identity",
      ],
    )
  ) {
    fail(
      "MACHINE_EDGE_OPTIONS_INVALID",
      "edge derivation input has ambient or missing fields",
    );
  }
  const mutation = detached(stableOptions.mutation, "mutation");
  const machineHeads = detached(stableOptions.machineHeads, "machineHeads");
  assertMutation(mutation);
  assertMachineHeadOrder(machineHeads);
  assertSemanticId(
    stableOptions.authoringMachineId,
    "authoringMachineId",
  );
  if (
    !Number.isInteger(stableOptions.journalOrdinal) ||
    stableOptions.journalOrdinal < 1
  ) {
    fail(
      "MACHINE_EDGE_ORDINAL_INVALID",
      "journalOrdinal must be a positive global ordinal",
    );
  }
  const heads = new Map(
    machineHeads.map((head) => [head.machineId, { ...head }]),
  );
  const cause = mutation.spec.cause?.edge;
  if (!isRecord(cause)) {
    fail(
      "MACHINE_EDGE_CAUSE_INVALID",
      "AuthoringMutation cause has no manifest-derived edge",
    );
  }
  const authoringHead = heads.get(stableOptions.authoringMachineId);
  if (!authoringHead || authoringHead.state !== cause.fromState) {
    fail(
      "MACHINE_EDGE_AUTHORING_HEAD_MISMATCH",
      "authoring cause does not begin at the locked authoring machine head",
    );
  }
  const authoringAfterDigest = machineDigest(stableOptions.identity, {
    machineId: stableOptions.authoringMachineId,
    state: cause.toState,
    journalOrdinal: stableOptions.journalOrdinal,
  });
  const edges = [{
    machineId: stableOptions.authoringMachineId,
    transitionId: cause.transitionId,
    fromState: cause.fromState,
    eventId: cause.eventId,
    toState: cause.toState,
    beforeStateDigest: authoringHead.stateDigest,
    afterStateDigest: authoringAfterDigest,
  }, ...mutation.spec.externalCouplings];
  if (edges.length < 1 || edges.length > 3) {
    fail(
      "MACHINE_EDGE_CARDINALITY_INVALID",
      "transition must contain the authoring edge and at most two couplings",
    );
  }
  const closedMachines = new Set();
  let priorMachine;
  edges.forEach((edge, index) => {
    assertMachineEdge(edge, `machineEdges[${index}]`);
    if (
      priorMachine !== undefined &&
      edge.machineId !== priorMachine
    ) {
      closedMachines.add(priorMachine);
    }
    if (closedMachines.has(edge.machineId)) {
      fail(
        "MACHINE_EDGE_SEQUENCE_NONCONTIGUOUS",
        "repeated machine edges must be contiguous",
      );
    }
    priorMachine = edge.machineId;
    const head = heads.get(edge.machineId);
    if (
      !head ||
      head.state !== edge.fromState ||
      head.stateDigest !== edge.beforeStateDigest
    ) {
      fail(
        "MACHINE_EDGE_BEFORE_MISMATCH",
        `machine edge ${index} does not begin at its current filtered head`,
      );
    }
    const expectedAfter = machineDigest(stableOptions.identity, {
      machineId: edge.machineId,
      state: edge.toState,
      journalOrdinal: stableOptions.journalOrdinal,
    });
    if (edge.afterStateDigest !== expectedAfter) {
      fail(
        "MACHINE_EDGE_AFTER_DIGEST_MISMATCH",
        `machine edge ${index} afterStateDigest is not identity-bound`,
      );
    }
    heads.set(edge.machineId, {
      machineId: edge.machineId,
      state: edge.toState,
      stateDigest: edge.afterStateDigest,
    });
  });
  return frozen({
    machineEdges: edges,
    machineHeads: machineHeads.map((head) => heads.get(head.machineId)),
  }, "transition machine edge bundle");
}

function assertActor(value) {
  if (!exactKeys(value, ["class", "id"])) {
    fail("COMMIT_ACTOR_INVALID", "actor must be exactly {class,id}");
  }
  assertSemanticId(value.class, "actor.class");
  assertSemanticId(value.id, "actor.id");
}

function assertAuthority(value) {
  if (!exactKeys(value, ["class", "id", "policy"])) {
    fail(
      "COMMIT_AUTHORITY_INVALID",
      "authority must be exactly {class,id,policy}",
    );
  }
  assertSemanticId(value.class, "authority.class");
  assertSemanticId(value.id, "authority.id");
  assertDigestBinding(value.policy, "authority.policy");
}

function assertIdempotency(value) {
  if (
    !exactKeys(value, ["machineId", "key"]) ||
    typeof value.key !== "string" ||
    value.key.length < 8 ||
    value.key.length > 160 ||
    !idempotencyKeyPattern.test(value.key)
  ) {
    fail(
      "COMMIT_IDEMPOTENCY_INVALID",
      "idempotency must be one closed machine-qualified key",
    );
  }
  assertSemanticId(value.machineId, "idempotency.machineId");
}

function assertJournalRecordShape(record, label) {
  if (
    !exactKeys(record, [
      "recordDigest",
      "authenticationDigest",
      "commitId",
      "ordinal",
      "commitKind",
      "actor",
      "authority",
      "idempotency",
      "operationDigest",
      "commandDigest",
      "payloadDigest",
      "previousSealDigest",
      "before",
      "after",
      "beforeWorkspaceIntegrityDigest",
      "afterWorkspaceIntegrityDigest",
      "workspaceEffect",
      "mutationDigest",
      "machineEdges",
    ])
  ) {
    fail(
      "JOURNAL_RECORD_INVALID",
      `${label} has ambient or missing fields`,
    );
  }
  assertDigest(record.recordDigest, `${label}.recordDigest`);
  assertDigest(
    record.authenticationDigest,
    `${label}.authenticationDigest`,
  );
  assertSemanticId(record.commitId, `${label}.commitId`);
  if (!Number.isInteger(record.ordinal) || record.ordinal < 1) {
    fail(
      "JOURNAL_RECORD_INVALID",
      `${label}.ordinal must be positive`,
    );
  }
  if (!["evidence", "transition"].includes(record.commitKind)) {
    fail(
      "JOURNAL_RECORD_INVALID",
      `${label}.commitKind is invalid`,
    );
  }
  assertActor(record.actor);
  assertAuthority(record.authority);
  assertIdempotency(record.idempotency);
  for (const field of [
    "operationDigest",
    "commandDigest",
    "payloadDigest",
    "previousSealDigest",
    "beforeWorkspaceIntegrityDigest",
    "afterWorkspaceIntegrityDigest",
    "mutationDigest",
  ]) {
    assertDigest(record[field], `${label}.${field}`);
  }
  assertWorkspaceEffect(record.workspaceEffect);
  assertRevisionState(record.before, `${label}.before`);
  assertRevisionState(record.after, `${label}.after`);
  if (!Array.isArray(record.machineEdges)) {
    fail(
      "JOURNAL_RECORD_INVALID",
      `${label}.machineEdges must be an array`,
    );
  }
  record.machineEdges.forEach((edge, index) =>
    assertMachineEdge(edge, `${label}.machineEdges[${index}]`));
  if (
    (record.commitKind === "evidence" && record.machineEdges.length !== 0) ||
    (
      record.commitKind === "transition" &&
      (record.machineEdges.length < 1 || record.machineEdges.length > 3)
    )
  ) {
    fail(
      "JOURNAL_RECORD_EDGE_CARDINALITY_INVALID",
      `${label} edge cardinality differs from commitKind`,
    );
  }
  assertRevisionTransition(record.before, record.after, record.commitKind);
  if (journalRecordDigest(record) !== record.recordDigest) {
    fail(
      "JOURNAL_RECORD_DIGEST_MISMATCH",
      `${label}.recordDigest differs from its exact body`,
    );
  }
}

export function assertJournalRecord(record) {
  const stable = detached(record, "JournalRecord");
  assertJournalRecordShape(stable, "JournalRecord");
  return frozen(stable, "JournalRecord");
}

function validateJournalPrefix(
  journal,
  genesisChainDigest,
  genesisRevisionState,
  genesisWorkspaceIntegrityDigest,
  identity,
) {
  assertDigest(genesisChainDigest, "genesisChainDigest");
  assertRevisionState(genesisRevisionState, "genesisRevisionState");
  assertDigest(
    genesisWorkspaceIntegrityDigest,
    "genesisWorkspaceIntegrityDigest",
  );
  if (!Array.isArray(journal)) {
    fail("JOURNAL_INVALID", "journal must be an ordered array");
  }
  assertRecordAuthenticationCapability(identity);
  const commitIds = new Set();
  const idempotencyKeys = new Set();
  let previousDigest = genesisChainDigest;
  let previousAfter = genesisRevisionState;
  let previousWorkspaceIntegrityDigest =
    genesisWorkspaceIntegrityDigest;
  journal.forEach((record, index) => {
    assertJournalRecordShape(record, `journal[${index}]`);
    assertRecordAuthentication(
      record,
      identity,
      `journal[${index}]`,
    );
    if (record.ordinal !== index + 1) {
      fail(
        "JOURNAL_ORDINAL_DISCONTINUITY",
        `journal[${index}] has a skipped or reordered ordinal`,
      );
    }
    if (record.previousSealDigest !== previousDigest) {
      fail(
        "JOURNAL_CHAIN_DISCONTINUITY",
        `journal[${index}] does not bind the prior chain head`,
      );
    }
    if (!same(record.before, previousAfter)) {
      fail(
        "JOURNAL_REVISION_DISCONTINUITY",
        `journal[${index}] before-state differs from the prior after-state`,
      );
    }
    if (
      record.beforeWorkspaceIntegrityDigest !==
        previousWorkspaceIntegrityDigest
    ) {
      fail(
        "JOURNAL_WORKSPACE_INTEGRITY_DISCONTINUITY",
        `journal[${index}] does not begin at the prior Workspace integrity boundary`,
      );
    }
    if (commitIds.has(record.commitId)) {
      fail(
        "JOURNAL_COMMIT_ID_DUPLICATE",
        `journal repeats commitId ${record.commitId}`,
      );
    }
    commitIds.add(record.commitId);
    const key =
      `${record.idempotency.machineId}\u0000${record.idempotency.key}`;
    if (idempotencyKeys.has(key)) {
      fail(
        "JOURNAL_IDEMPOTENCY_DUPLICATE",
        "journal repeats a machine-qualified idempotency key",
      );
    }
    idempotencyKeys.add(key);
    previousDigest = record.recordDigest;
    previousAfter = record.after;
    previousWorkspaceIntegrityDigest =
      record.afterWorkspaceIntegrityDigest;
  });
  return {
    commitIds,
    idempotencyKeys,
    previousDigest,
    previousAfter,
    previousWorkspaceIntegrityDigest,
  };
}

function assertRecordAuthenticationCapability(identity) {
  const descriptor =
    identity !== null &&
    typeof identity === "object"
      ? Object.getOwnPropertyDescriptor(
        identity,
        "recordAuthenticationDigest",
      )
      : undefined;
  if (
    descriptor?.enumerable !== true ||
    !Object.hasOwn(descriptor, "value") ||
    typeof descriptor.value !== "function"
  ) {
    fail(
      "JOURNAL_AUTHENTICATION_CAPABILITY_INVALID",
      "JournalRecord assembly requires one pinned recordAuthenticationDigest capability",
    );
  }
  return descriptor.value;
}

function assertRecordAuthentication(record, identity, label) {
  const operation = assertRecordAuthenticationCapability(identity);
  let expected;
  try {
    expected = Reflect.apply(
      operation,
      identity,
      [projectJournalRecordAuthenticationCore(record)],
    );
  } catch (error) {
    fail(
      "JOURNAL_AUTHENTICATION_EXECUTION_FAILED",
      `${label} authentication failed: ${error.message}`,
    );
  }
  assertDigest(expected, `${label} expected authenticationDigest`);
  if (record.authenticationDigest !== expected) {
    fail(
      "JOURNAL_AUTHENTICATION_MISMATCH",
      `${label}.authenticationDigest differs from the configured authority`,
    );
  }
}

export function assembleJournalRecord(options, identity) {
  const stable = detached(options, "assembleJournalRecord options");
  if (
    !exactKeys(
      stable,
      [
        "journal",
        "genesisChainDigest",
        "genesisRevisionState",
        "genesisWorkspaceIntegrityDigest",
        "commitId",
        "commitKind",
        "actor",
        "authority",
        "idempotency",
        "operationDigest",
        "commandDigest",
        "payloadDigest",
        "before",
        "after",
        "beforeWorkspaceIntegrityDigest",
        "afterWorkspaceIntegrityDigest",
        "workspaceEffect",
        "mutationDigest",
        "machineEdges",
      ],
      ["evidencePlan"],
    )
  ) {
    fail(
      "JOURNAL_RECORD_OPTIONS_INVALID",
      "journal record input has ambient or missing fields",
    );
  }
  const prefix = validateJournalPrefix(
    stable.journal,
    stable.genesisChainDigest,
    stable.genesisRevisionState,
    stable.genesisWorkspaceIntegrityDigest,
    identity,
  );
  assertSemanticId(stable.commitId, "commitId");
  if (prefix.commitIds.has(stable.commitId)) {
    fail(
      "JOURNAL_COMMIT_ID_DUPLICATE",
      `commitId ${stable.commitId} already exists`,
    );
  }
  assertIdempotency(stable.idempotency);
  const idempotencyKey =
    `${stable.idempotency.machineId}\u0000${stable.idempotency.key}`;
  if (prefix.idempotencyKeys.has(idempotencyKey)) {
    fail(
      "JOURNAL_IDEMPOTENCY_DUPLICATE",
      "machine-qualified idempotency key already exists",
    );
  }
  if (!same(stable.before, prefix.previousAfter)) {
    fail(
      "JOURNAL_REVISION_DISCONTINUITY",
      "new record before-state differs from the locked journal head",
    );
  }
  if (
    stable.beforeWorkspaceIntegrityDigest !==
      prefix.previousWorkspaceIntegrityDigest
  ) {
    fail(
      "JOURNAL_WORKSPACE_INTEGRITY_DISCONTINUITY",
      "new record beforeWorkspaceIntegrityDigest differs from the locked journal head",
    );
  }
  assertDigest(
    stable.afterWorkspaceIntegrityDigest,
    "afterWorkspaceIntegrityDigest",
  );
  const workspaceEffect = assertWorkspaceEffect(
    stable.workspaceEffect,
  );
  if (stable.commitKind === "evidence") {
    if (!Object.hasOwn(stable, "evidencePlan")) {
      fail(
        "EVIDENCE_COMMIT_PLAN_REQUIRED",
        "evidence JournalRecord assembly requires its complete EvidenceCommitPlan",
      );
    }
    assertEvidencePlanRecordAncestry(
      stable.evidencePlan,
      stable,
      prefix.previousDigest,
    );
    const evidencePlan = assertEvidenceCommitPlan(
      stable.evidencePlan,
    );
    if (
      !same(
        evidencePlan.retainedResources,
        workspaceEffect.retainedResources,
      ) ||
      !same(
        evidencePlan.openAssignment,
        workspaceEffect.openAssignment,
      )
    ) {
      fail(
        "EVIDENCE_COMMIT_PLAN_WORKSPACE_EFFECT_MISMATCH",
        "EvidenceCommitPlan differs from the exact JournalRecord WorkspaceEffect",
      );
    }
  } else if (Object.hasOwn(stable, "evidencePlan")) {
    fail(
      "EVIDENCE_COMMIT_PLAN_FORBIDDEN",
      "transition JournalRecord assembly cannot accept an EvidenceCommitPlan",
    );
  }
  const record = {
    recordDigest: `sha256:${"0".repeat(64)}`,
    authenticationDigest: `sha256:${"0".repeat(64)}`,
    commitId: stable.commitId,
    ordinal: stable.journal.length + 1,
    commitKind: stable.commitKind,
    actor: stable.actor,
    authority: stable.authority,
    idempotency: stable.idempotency,
    operationDigest: stable.operationDigest,
    commandDigest: stable.commandDigest,
    payloadDigest: stable.payloadDigest,
    previousSealDigest: prefix.previousDigest,
    before: stable.before,
    after: stable.after,
    beforeWorkspaceIntegrityDigest:
      stable.beforeWorkspaceIntegrityDigest,
    afterWorkspaceIntegrityDigest:
      stable.afterWorkspaceIntegrityDigest,
    workspaceEffect,
    mutationDigest: stable.mutationDigest,
    machineEdges: stable.machineEdges,
  };
  for (const field of [
    "operationDigest",
    "commandDigest",
    "payloadDigest",
    "mutationDigest",
  ]) {
    assertDigest(record[field], field);
  }
  const authenticate = assertRecordAuthenticationCapability(identity);
  try {
    record.authenticationDigest = Reflect.apply(
      authenticate,
      identity,
      [projectJournalRecordAuthenticationCore(record)],
    );
  } catch (error) {
    fail(
      "JOURNAL_AUTHENTICATION_EXECUTION_FAILED",
      `JournalRecord authentication failed: ${error.message}`,
    );
  }
  assertDigest(
    record.authenticationDigest,
    "authenticationDigest",
  );
  record.recordDigest = journalRecordDigest(record);
  assertJournalRecordShape(record, "journal record");
  return frozen(record, "JournalRecord");
}

export function createIdempotencyOutcomeEntry(options) {
  const stable = detached(options, "idempotency outcome options");
  if (
    !exactKeys(
      stable,
      ["record", "outcome"],
      ["evidencePlan"],
    )
  ) {
    fail(
      "COMMIT_OUTCOME_ENTRY_OPTIONS_INVALID",
      "outcome entry input has ambient or missing fields",
    );
  }
  const stableRecord = detached(stable.record, "journal record");
  assertJournalRecordShape(stableRecord, "journal record");
  const stableOutcome = assertCommitOutcome(stable.outcome, {
    commitKind: stableRecord.commitKind,
  });
  if (stableRecord.commitKind === "evidence") {
    if (!Object.hasOwn(stable, "evidencePlan")) {
      fail(
        "EVIDENCE_COMMIT_PLAN_REQUIRED",
        "evidence outcome construction requires its complete EvidenceCommitPlan",
      );
    }
    const plan = assertEvidencePlanRecordAncestry(
      stable.evidencePlan,
      stableRecord,
      stableRecord.previousSealDigest,
    );
    if (!same(plan.outcome, stableOutcome)) {
      fail(
        "EVIDENCE_COMMIT_PLAN_OUTCOME_MISMATCH",
        "idempotency outcome differs from its EvidenceCommitPlan ancestry",
      );
    }
  } else if (Object.hasOwn(stable, "evidencePlan")) {
    fail(
      "EVIDENCE_COMMIT_PLAN_FORBIDDEN",
      "transition outcome construction cannot accept an EvidenceCommitPlan",
    );
  }
  return frozen({
    machineId: stableRecord.idempotency.machineId,
    key: stableRecord.idempotency.key,
    recordDigest: stableRecord.recordDigest,
    operationDigest: stableRecord.operationDigest,
    commandDigest: stableRecord.commandDigest,
    payloadDigest: stableRecord.payloadDigest,
    outcome: stableOutcome,
  }, "idempotency outcome entry");
}

export function receiptOutcome(receipt, sidecars = []) {
  const stable = detached(receipt, "AuthoringCommitReceipt");
  if (
    stable?.kind !== "AuthoringCommitReceipt" ||
    stable?.spec?.receiptDigest !== commitReceiptDigest(stable)
  ) {
    fail(
      "COMMIT_RECEIPT_INVALID",
      "transition outcome requires one sealed AuthoringCommitReceipt",
    );
  }
  if (!Array.isArray(sidecars)) {
    fail(
      "COMMIT_OUTCOME_INVALID",
      "transition sidecars must be one ordered array",
    );
  }
  return assertCommitOutcome({
    class: "transition-committed",
    receipt: {
      reference: resourceReferenceFrom(stable),
      receiptDigest: stable.spec.receiptDigest,
    },
    ...(sidecars.length === 0
      ? {}
      : {
        sidecars: sidecars.map((resource) =>
          resourceReferenceFrom(detached(resource, "commit sidecar"))
        ),
      }),
  }, { commitKind: "transition" });
}
