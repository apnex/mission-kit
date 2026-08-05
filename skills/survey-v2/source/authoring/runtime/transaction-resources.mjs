import { canonicalize, stableValue } from "../kernel/canonical.mjs";
import {
  issueTextAssignment,
  reproduceAssignmentView,
  sealAuthoringRequest,
} from "../kernel/assignment-dag.mjs";
import {
  resourceIntegrityDigest,
  resourceReferenceFrom,
} from "../kernel/digests.mjs";
import {
  storedResourceVersionFromResource,
} from "./workspace-application.mjs";

const digestPattern = /^sha256:[0-9a-f]{64}$/u;
const semanticIdPattern =
  /^[a-z][a-z0-9]*(?:[._:/-][a-z0-9]+)*$/u;
const transitionIdPattern = /^[A-Z][A-Z0-9]*$/u;

export class AuthoringTransactionResourceError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "AuthoringTransactionResourceError";
    this.code = code;
  }
}

function fail(code, message) {
  throw new AuthoringTransactionResourceError(code, message);
}

function same(left, right) {
  return canonicalize(left) === canonicalize(right);
}

function detached(value, label) {
  try {
    return stableValue(value);
  } catch (error) {
    fail(
      "TRANSACTION_RESOURCE_NON_CANONICAL",
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
      if (child !== null && typeof child === "object") pending.push(child);
    }
    Object.freeze(current);
  }
  return value;
}

function frozen(value, label) {
  return deepFreeze(detached(value, label));
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function exactReference(value) {
  return (
    isRecord(value) &&
    Object.keys(value).sort().join("\0") ===
      ["apiVersion", "kind", "name", "semanticDigest"].sort().join("\0") &&
    ["apiVersion", "kind", "name"].every(
      (field) => typeof value[field] === "string" && value[field].length > 0,
    ) &&
    digestPattern.test(value.semanticDigest ?? "")
  );
}

function referenceKey(reference) {
  if (!exactReference(reference)) {
    fail(
      "TRANSACTION_RESOURCE_REFERENCE_INVALID",
      "resource reference is not one exact closed ResourceReference",
    );
  }
  return canonicalize(reference);
}

function compareUtf8(left, right) {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));
}

function inventoryEntry(resource) {
  const stable = detached(resource, "inventory resource");
  let reference;
  let integrityDigest;
  try {
    reference = resourceReferenceFrom(stable);
    integrityDigest = resourceIntegrityDigest(stable);
  } catch (error) {
    fail(
      "TRANSACTION_INVENTORY_RESOURCE_INVALID",
      `inventory resource cannot be identified: ${error.message}`,
    );
  }
  return { reference, integrityDigest, resource: stable };
}

/**
 * Build one detached canonical inventory from static profile resources and the
 * immutable versions retained by the locked Workspace. Identical duplicates
 * collapse; an exact reference with different bytes is corruption.
 */
export function transactionInventory({
  workspace,
  staticInventory = [],
}) {
  const workspaceValue = detached(workspace, "workspace");
  const staticValues = detached(staticInventory, "static inventory");
  if (
    !isRecord(workspaceValue?.spec) ||
    !Array.isArray(workspaceValue.spec.resourceVersions) ||
    !Array.isArray(staticValues)
  ) {
    fail(
      "TRANSACTION_INVENTORY_INVALID",
      "transaction inventory requires a Workspace and one static resource array",
    );
  }
  const entries = [
    ...staticValues.map(inventoryEntry),
    ...workspaceValue.spec.resourceVersions.map((stored, index) => {
      if (
        !isRecord(stored) ||
        !exactReference(stored.reference) ||
        !digestPattern.test(stored.integrityDigest ?? "") ||
        !isRecord(stored.resource)
      ) {
        fail(
          "TRANSACTION_STORED_RESOURCE_INVALID",
          `workspace resourceVersions[${index}] is invalid`,
        );
      }
      const computed = inventoryEntry(stored.resource);
      if (
        !same(computed.reference, stored.reference) ||
        computed.integrityDigest !== stored.integrityDigest
      ) {
        fail(
          "TRANSACTION_STORED_RESOURCE_MISMATCH",
          `workspace resourceVersions[${index}] differs from its exact bytes`,
        );
      }
      return computed;
    }),
  ];
  const byReference = new Map();
  for (const entry of entries) {
    const key = referenceKey(entry.reference);
    const existing = byReference.get(key);
    if (existing && !same(existing, entry)) {
      fail(
        "TRANSACTION_INVENTORY_REFERENCE_CONFLICT",
        `exact reference ${entry.reference.name} resolves to different bytes`,
      );
    }
    byReference.set(key, entry);
  }
  const ordered = [...byReference.values()].sort((left, right) =>
    compareUtf8(referenceKey(left.reference), referenceKey(right.reference)));
  return frozen(
    ordered.map((entry) => entry.resource),
    "transaction inventory",
  );
}

export function resolveExactResource(
  inventory,
  reference,
  {
    kind,
    label = "resource",
  } = {},
) {
  const values = detached(inventory, "inventory");
  const selectedReference = detached(reference, `${label} reference`);
  if (!Array.isArray(values)) {
    fail(
      "TRANSACTION_INVENTORY_INVALID",
      "resource resolution requires one inventory array",
    );
  }
  const matches = values.filter((resource) => {
    try {
      return same(resourceReferenceFrom(resource), selectedReference);
    } catch {
      return false;
    }
  });
  if (matches.length !== 1) {
    fail(
      "TRANSACTION_RESOURCE_RESOLUTION_FAILED",
      `${label} must resolve exactly once; resolved ${matches.length}`,
    );
  }
  if (kind !== undefined && matches[0].kind !== kind) {
    fail(
      "TRANSACTION_RESOURCE_KIND_MISMATCH",
      `${label} resolved ${matches[0].kind}, expected ${kind}`,
    );
  }
  return frozen(matches[0], label);
}

function one(values, predicate, code, label) {
  const matches = values.filter(predicate);
  if (matches.length !== 1) {
    fail(code, `${label} must resolve exactly once; resolved ${matches.length}`);
  }
  return matches[0];
}

function formAndProjection({
  request,
  profile,
  inventory,
}) {
  const formBinding = one(
    profile.spec.formBindings,
    (binding) =>
      binding.id === request.spec.bindings.form.id &&
      binding.formDigest === request.spec.bindings.form.digest,
    "TRANSACTION_FORM_BINDING_UNRESOLVED",
    "request form binding",
  );
  const formDefinition = resolveExactResource(
    inventory,
    formBinding.definition,
    {
      kind: "AuthoringFormDefinition",
      label: "form definition",
    },
  );
  if (formDefinition.spec?.formDigest !== formBinding.formDigest) {
    fail(
      "TRANSACTION_FORM_DIGEST_MISMATCH",
      "resolved form definition differs from its profile binding",
    );
  }
  const projectionBinding = one(
    profile.spec.projectionBindings,
    (binding) =>
      binding.id === request.spec.bindings.projection.id &&
      binding.definitionDigest === request.spec.bindings.projection.digest,
    "TRANSACTION_PROJECTION_BINDING_UNRESOLVED",
    "request projection binding",
  );
  return {
    formBinding,
    formDefinition,
    projectionBinding,
  };
}

function assignmentBinding(assignment) {
  return {
    reference: resourceReferenceFrom(assignment),
    assignmentDigest: assignment.spec.assignmentDigest,
  };
}

function occupiedHandles(inventory) {
  return inventory
    .filter((resource) => resource.kind === "AuthoringAssignment")
    .map((assignment) => ({
      handle: assignment.spec.handle,
      requestDigest: assignment.spec.request.requestDigest,
    }));
}

function requestHex(request) {
  const digest = request?.spec?.requestDigest;
  if (!digestPattern.test(digest ?? "")) {
    fail(
      "TRANSACTION_REQUEST_DIGEST_INVALID",
      "request lacks one canonical request digest",
    );
  }
  return digest.slice("sha256:".length);
}

/**
 * Convert a pure K12 task result into the complete deterministic K11 text
 * Assignment DAG. No persistence or journal authority is exercised here.
 */
export function issueAssignmentFromTask({
  taskResult,
  profile,
  workspace,
  staticInventory = [],
  validateRequestContract,
}) {
  const task = detached(taskResult, "task result");
  const profileValue = detached(profile, "profile");
  if (
    task?.kind !== "task" ||
    !isRecord(task.request) ||
    !isRecord(task.contextClosure) ||
    typeof validateRequestContract !== "function"
  ) {
    fail(
      "TRANSACTION_TASK_RESULT_INVALID",
      "assignment issuance requires one K12 task and Request validator",
    );
  }
  const inventory = transactionInventory({
    workspace,
    staticInventory,
  });
  const request = sealAuthoringRequest(task.request, {
    validateRequestContract,
  });
  const {
    formDefinition,
    projectionBinding,
  } = formAndProjection({
    request,
    profile: profileValue,
    inventory,
  });
  const suffix = requestHex(request);
  const issued = issueTextAssignment({
    request,
    contextClosure: task.contextClosure,
    formDefinition,
    projectionBinding,
    projectionName: `projection-${suffix}`,
    assignmentName: `assignment-${suffix}`,
    occupiedHandles: occupiedHandles(inventory),
  });
  const resources = [
    task.contextClosure,
    request,
    issued.projectionArtifact,
    issued.assignment,
  ];
  return Object.freeze({
    kind: "assignment",
    request: frozen(request, "issued request"),
    contextClosure: frozen(task.contextClosure, "issued context closure"),
    projectionArtifact: frozen(
      issued.projectionArtifact,
      "issued projection artifact",
    ),
    assignment: frozen(issued.assignment, "issued assignment"),
    viewBytes: Buffer.from(issued.blankViewBytes),
    openAssignment: frozen(
      assignmentBinding(issued.assignment),
      "open Assignment binding",
    ),
    retainedResourceVersions: frozen(
      resources.map(storedResourceVersionFromResource),
      "issued resource versions",
    ),
    historyReferences: frozen(
      resources.map(resourceReferenceFrom),
      "issued history references",
    ),
  });
}

/**
 * Reproduce a pending Assignment entirely from retained immutable resources.
 * This is the adapter-neutral cold-resume view.
 */
export function reproduceAssignmentBinding({
  profile,
  workspace,
  assignmentBinding,
  staticInventory = [],
}) {
  const workspaceValue = detached(workspace, "workspace");
  const profileValue = detached(profile, "profile");
  const selectedBinding = detached(
    assignmentBinding,
    "Assignment binding",
  );
  if (
    !isRecord(selectedBinding) ||
    !exactReference(selectedBinding.reference) ||
    !digestPattern.test(selectedBinding.assignmentDigest ?? "")
  ) {
    fail(
      "TRANSACTION_ASSIGNMENT_BINDING_INVALID",
      "Assignment reproduction requires one exact Assignment binding",
    );
  }
  const inventory = transactionInventory({
    workspace: workspaceValue,
    staticInventory,
  });
  const assignment = resolveExactResource(
    inventory,
    selectedBinding.reference,
    { kind: "AuthoringAssignment", label: "retained Assignment" },
  );
  if (
    assignment.spec.assignmentDigest !==
      selectedBinding.assignmentDigest
  ) {
    fail(
      "TRANSACTION_ASSIGNMENT_BINDING_MISMATCH",
      "Assignment binding digest differs from retained bytes",
    );
  }
  const request = resolveExactResource(
    inventory,
    assignment.spec.request.reference,
    { kind: "AuthoringRequest", label: "Assignment request" },
  );
  const contextClosure = resolveExactResource(
    inventory,
    request.spec.contextClosure.reference,
    { kind: "ContextClosure", label: "request ContextClosure" },
  );
  const projectionArtifact = resolveExactResource(
    inventory,
    assignment.spec.projectionArtifact.reference,
    { kind: "ProjectionArtifact", label: "Assignment projection" },
  );
  const {
    formDefinition,
    projectionBinding,
  } = formAndProjection({
    request,
    profile: profileValue,
    inventory,
  });
  const viewBytes = reproduceAssignmentView({
    request,
    contextClosure,
    formDefinition,
    projectionBinding,
    projectionArtifact,
    assignment,
  });
  return Object.freeze({
    kind: "assignment",
    request,
    contextClosure,
    projectionArtifact,
    assignment,
    viewBytes: Buffer.from(viewBytes),
  });
}

export function reproduceOpenAssignment({
  profile,
  workspace,
  staticInventory = [],
}) {
  const workspaceValue = detached(workspace, "workspace");
  const open = workspaceValue?.spec?.openAssignment;
  if (!isRecord(open)) {
    fail(
      "TRANSACTION_OPEN_ASSIGNMENT_MISSING",
      "Workspace has no open Assignment to reproduce",
    );
  }
  return reproduceAssignmentBinding({
    profile,
    workspace: workspaceValue,
    assignmentBinding: open,
    staticInventory,
  });
}

export function transitionHandoffSlots(profile, mutation) {
  const profileValue = detached(profile, "profile");
  const mutationValue = detached(mutation, "mutation");
  const transitionId = mutationValue?.spec?.cause?.edge?.transitionId;
  if (
    typeof transitionId !== "string" ||
    !transitionIdPattern.test(transitionId)
  ) {
    fail(
      "TRANSACTION_TRANSITION_ID_INVALID",
      "Mutation lacks one canonical transition identity",
    );
  }
  const binding = one(
    profileValue.spec.transitionBindings,
    (candidate) => candidate.transitionId === transitionId,
    "TRANSACTION_TRANSITION_BINDING_UNRESOLVED",
    "Mutation transition binding",
  );
  return frozen(
    binding.mutationFootprint.handoffSlots ?? [],
    "transition handoff slots",
  );
}

export function submissionActor(submission) {
  const value = detached(submission, "submission");
  const provenance = value?.evidence?.producerProvenance;
  if (
    !isRecord(provenance) ||
    typeof provenance.producerId !== "string" ||
    typeof provenance.producerClass !== "string" ||
    !semanticIdPattern.test(provenance.producerId) ||
    !semanticIdPattern.test(provenance.producerClass)
  ) {
    fail(
      "TRANSACTION_SUBMISSION_ACTOR_INVALID",
      "Submission lacks one exact producer actor",
    );
  }
  return frozen({
    class: provenance.producerClass,
    id: provenance.producerId,
  }, "submission actor");
}
