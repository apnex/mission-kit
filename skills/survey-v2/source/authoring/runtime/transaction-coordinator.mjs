import { types } from "node:util";
import {
  canonicalize,
  sha256Value,
  stableValue,
} from "../kernel/canonical.mjs";
import {
  assignmentDigest,
  normalizedSubmissionDigest,
  requestCoreDigest,
  resourceReferenceFrom,
} from "../kernel/digests.mjs";
import {
  compileExecutableRegistry,
} from "../kernel/executable-registry.mjs";
import {
  reduceAuthoring,
  normalizeAuthoringCommand,
  preflightProfileExecutables,
} from "../kernel/manifest-reducer.mjs";
import {
  assertAuthoringAuthority,
} from "../kernel/manifest-selection.mjs";
import {
  assembleJournalRecord,
  createAuthoringCommitReceipt,
  createEvidenceCommitPlan,
  createIdempotencyOutcomeEntry,
  deriveSupersededDescendants,
  deriveOperationIdentity,
  deriveTransitionMachineEdges,
  receiptOutcome,
} from "./commit-records.mjs";
import {
  isCompiledJournalIdentityPort,
  replayAuthoringJournal,
} from "./journal-replay.mjs";
import {
  assertAuthoringStorePostImage,
  assertAuthoringStoreSnapshot,
  snapshotExpectedToken,
} from "./store-port.mjs";
import {
  issueAssignmentFromTask,
  reproduceAssignmentBinding,
  reproduceOpenAssignment,
  resolveExactResource,
  submissionActor,
  transactionInventory,
  transitionHandoffSlots,
} from "./transaction-resources.mjs";
import {
  applyEvidenceWorkspace,
  applyTransitionWorkspace,
  deriveWorkspaceCommitBoundary,
  retainWorkspaceEvidence,
  storedResourceVersionFromResource,
  workspaceRevisionState,
} from "./workspace-application.mjs";
import {
  deriveCommitSidecars,
} from "./commit-sidecars.mjs";

const digestPattern = /^sha256:[0-9a-f]{64}$/u;
const semanticIdPattern =
  /^[a-z][a-z0-9]*(?:[._:/-][a-z0-9]+)*$/u;
const promiseThen = Promise.prototype.then;
const persistedRejectionBoundaries = new Set([
  "profile.guard",
  "profile.handler",
  "profile.resource",
]);

export class AuthoringTransactionCoordinatorError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "AuthoringTransactionCoordinatorError";
    this.code = code;
    for (const [key, value] of Object.entries(details)) this[key] = value;
  }
}

function fail(code, message, details) {
  throw new AuthoringTransactionCoordinatorError(
    code,
    message,
    details,
  );
}

function isRecord(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    !types.isProxy(value)
  );
}

function exactKeys(value, required, optional = []) {
  if (!isRecord(value)) return false;
  const admitted = new Set([...required, ...optional]);
  const keys = Reflect.ownKeys(value);
  return (
    required.every((key) => keys.includes(key)) &&
    keys.every(
      (key) => typeof key === "string" && admitted.has(key),
    ) &&
    keys.every((key) => {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      return (
        descriptor?.enumerable === true &&
        Object.prototype.hasOwnProperty.call(descriptor, "value")
      );
    })
  );
}

function detached(value, label) {
  try {
    return stableValue(value);
  } catch (error) {
    fail(
      "TRANSACTION_INPUT_NON_CANONICAL",
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
      if (child !== null && typeof child === "object") {
        pending.push(child);
      }
    }
    Object.freeze(current);
  }
  return value;
}

function frozen(value, label) {
  return deepFreeze(detached(value, label));
}

function same(left, right) {
  return canonicalize(left) === canonicalize(right);
}

function assertDigest(value, label) {
  if (typeof value !== "string" || !digestPattern.test(value)) {
    fail(
      "TRANSACTION_DIGEST_INVALID",
      `${label} must be one canonical sha256 digest`,
    );
  }
}

function assertSemanticId(value, label) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > 160 ||
    !semanticIdPattern.test(value)
  ) {
    fail(
      "TRANSACTION_ID_INVALID",
      `${label} must be one canonical semantic identifier`,
    );
  }
}

function captureStore(store) {
  if (!isRecord(store)) {
    fail(
      "TRANSACTION_STORE_INVALID",
      "coordinator store must be one non-proxy object",
    );
  }
  let read;
  let withWriter;
  try {
    read = store.read;
    withWriter = store.withWriter;
  } catch (error) {
    fail(
      "TRANSACTION_STORE_INVALID",
      `coordinator store operations cannot be captured: ${error.message}`,
    );
  }
  if (
    typeof read !== "function" ||
    typeof withWriter !== "function"
  ) {
    fail(
      "TRANSACTION_STORE_INVALID",
      "coordinator store must expose read and withWriter operations",
    );
  }
  return Object.freeze({
    read: read.bind(store),
    withWriter: withWriter.bind(store),
  });
}

function assertTrustedInputs(trustedInputs) {
  if (
    trustedInputs === null ||
    typeof trustedInputs !== "object" ||
    !Object.hasOwn(trustedInputs, "executables")
  ) {
    fail(
      "TRANSACTION_EXECUTABLE_REGISTRY_REQUIRED",
      "trusted inputs must carry one complete executable registry",
    );
  }
  if (
    !exactKeys(
      trustedInputs,
      ["validateContract", "kernel", "executables"],
      ["inventory"],
    ) ||
    typeof trustedInputs.validateContract !== "function" ||
    types.isAsyncFunction(trustedInputs.validateContract)
  ) {
    fail(
      "TRANSACTION_TRUSTED_INPUTS_INVALID",
      "trusted inputs must carry one synchronous contract validator and exact kernel binding",
    );
  }
  if (
    Object.hasOwn(trustedInputs, "inventory") &&
    !Array.isArray(trustedInputs.inventory)
  ) {
    fail(
      "TRANSACTION_TRUSTED_INPUTS_INVALID",
      "trusted inventory must be one canonical resource array",
    );
  }
}

function captureExecutableRegistry(executables) {
  // Validate the hostile caller-owned surface before retaining any capability.
  // The reducer accepts the raw registry shape, so retain a new closed registry
  // whose function values are the exact references validated here.
  compileExecutableRegistry(executables);
  const captured = {};
  const kinds = [
    "guards",
    "handlers",
    "validators",
    ...["projectors", "sidecars"].filter(
      (kind) => Object.hasOwn(executables, kind),
    ),
  ];
  for (const kind of kinds) {
    captured[kind] = Object.freeze(
      executables[kind].map((entry) =>
        Object.freeze({
          id: entry.id,
          digest: entry.digest,
          invoke: entry.invoke,
        })),
    );
  }
  return Object.freeze(captured);
}

function captureTrustedInputs(trustedInputs) {
  assertTrustedInputs(trustedInputs);
  const captured = {
    validateContract: trustedInputs.validateContract,
    kernel: frozen(
      trustedInputs.kernel,
      "trusted kernel binding",
    ),
    inventory: frozen(
      trustedInputs.inventory ?? [],
      "trusted static inventory",
    ),
    executables: captureExecutableRegistry(
      trustedInputs.executables,
    ),
  };
  return Object.freeze(captured);
}

function captureEventCommandAdmission(
  profile,
  input,
) {
  const expected = profile?.spec?.eventCommandAdmission;
  if (expected === undefined) {
    if (input !== undefined) {
      fail(
        "TRANSACTION_EVENT_ADMISSION_AMBIENT",
        "coordinator received event command admission outside profile authority",
      );
    }
    return null;
  }
  if (!isRecord(input)) {
    fail(
      "TRANSACTION_EVENT_ADMISSION_REQUIRED",
      "profile requires one event command admission verifier",
    );
  }
  const bindingDescriptor =
    Object.getOwnPropertyDescriptor(input, "binding");
  const consumeDescriptor =
    Object.getOwnPropertyDescriptor(input, "consume");
  if (
    Reflect.ownKeys(input).length !== 2 ||
    bindingDescriptor?.enumerable !== true ||
    !Object.prototype.hasOwnProperty.call(
      bindingDescriptor,
      "value",
    ) ||
    consumeDescriptor?.enumerable !== true ||
    !Object.prototype.hasOwnProperty.call(
      consumeDescriptor,
      "value",
    ) ||
    typeof consumeDescriptor.value !== "function" ||
    types.isAsyncFunction(consumeDescriptor.value)
  ) {
    fail(
      "TRANSACTION_EVENT_ADMISSION_INVALID",
      "event command admission verifier must be exactly {binding,consume}",
    );
  }
  const binding = frozen(
    bindingDescriptor.value,
    "event command admission binding",
  );
  if (!same(binding, expected)) {
    fail(
      "TRANSACTION_EVENT_ADMISSION_MISMATCH",
      "event command admission verifier differs from profile authority",
    );
  }
  return Object.freeze({
    binding,
    consume: consumeDescriptor.value.bind(input),
  });
}

function assertActor(actor, label) {
  if (
    !exactKeys(actor, ["class", "id"])
  ) {
    fail(
      "TRANSACTION_ACTOR_INVALID",
      `${label} must be exactly {class,id}`,
    );
  }
  assertSemanticId(actor.class, `${label}.class`);
  assertSemanticId(actor.id, `${label}.id`);
}

function assertAuthority(authority, label) {
  if (
    !exactKeys(authority, ["class", "id", "policy"]) ||
    !exactKeys(authority.policy, ["id", "digest"])
  ) {
    fail(
      "TRANSACTION_AUTHORITY_INVALID",
      `${label} must be exactly {class,id,policy:{id,digest}}`,
    );
  }
  assertSemanticId(authority.class, `${label}.class`);
  assertSemanticId(authority.id, `${label}.id`);
  assertSemanticId(authority.policy.id, `${label}.policy.id`);
  assertDigest(authority.policy.digest, `${label}.policy.digest`);
}

function lockedTrustedInputs(config, workspace) {
  return Object.freeze({
    validateContract: config.capabilities.validateContract,
    kernel: config.capabilities.kernel,
    inventory: transactionInventory({
      workspace,
      staticInventory: config.staticInventory,
    }),
    executables: config.capabilities.executables,
  });
}

function assertIdentityMatches(snapshot, identity) {
  if (
    !same(snapshot.identityBinding, identity.binding) ||
    !same(snapshot.identityScope, identity.identityScope)
  ) {
    fail(
      "TRANSACTION_IDENTITY_MISMATCH",
      "stored identity binding or scope differs from the configured identity authority",
    );
  }
}

function contractResultIsAsync(result, label) {
  if (
    result === null ||
    (
      typeof result !== "object" &&
      typeof result !== "function"
    )
  ) {
    return false;
  }
  if (types.isPromise(result)) {
    Reflect.apply(promiseThen, result, [undefined, () => {}]);
    return true;
  }
  let then;
  try {
    then = Reflect.get(result, "then");
  } catch {
    fail(
      "TRANSACTION_CONTRACT_RESULT_INVALID",
      `${label} returned a result with an unreadable then property`,
    );
  }
  if (typeof then !== "function") return false;
  // Assimilate once into a native Promise with an attached rejection handler,
  // so a hostile or rejecting thenable cannot escape as an unhandled result.
  Promise.resolve(result).catch(() => {});
  return true;
}

function validateContractSynchronously(
  capabilities,
  resource,
  label,
  invalidCode,
) {
  let valid;
  try {
    valid = capabilities.validateContract(
      frozen(resource, `${label} validation input`),
    );
  } catch (error) {
    fail(
      invalidCode,
      `${label} failed its complete contract: ${error.message}`,
    );
  }
  if (contractResultIsAsync(valid, label)) {
    fail(
      "TRANSACTION_CONTRACT_VALIDATOR_ASYNC_FORBIDDEN",
      `${label} received an asynchronous contract result`,
    );
  }
  if (valid !== true) {
    fail(
      invalidCode,
      `${label} did not receive one positive complete contract result`,
    );
  }
}

function replaySnapshot(snapshotValue, {
  authoringMachineId,
  identity,
  capabilities,
  profile,
  protocol,
  staticInventory,
}) {
  const snapshot = assertAuthoringStoreSnapshot(
    snapshotValue,
    { authoringMachineId },
  );
  assertIdentityMatches(snapshot, identity);
  assertAuthoringAuthority({
    profile,
    protocol,
    workspace: snapshot.workspace,
  });
  validateContractSynchronously(
    capabilities,
    snapshot.workspace,
    "locked Workspace",
    "TRANSACTION_WORKSPACE_CONTRACT_INVALID",
  );
  assertPersistedHandoffScopes(snapshot, {
    profile,
    staticInventory,
  });
  const replay = replayAuthoringJournal({
    commitRevision: snapshot.commitRevision,
    workspace: snapshot.workspace,
    journal: snapshot.journal,
    machineHeads: snapshot.machineHeads,
    idempotencyOutcomeView: snapshot.idempotencyOutcomeView,
    authoringMachineId,
    identity,
  });
  return { snapshot, replay };
}

function validateCommandResourceContract(config, resource, label) {
  validateContractSynchronously(
    config.capabilities,
    resource,
    label,
    "TRANSACTION_COMMAND_CONTRACT_INVALID",
  );
}

function assignmentBinding(assignment) {
  const stable = detached(assignment, "Assignment");
  if (
    stable?.kind !== "AuthoringAssignment" ||
    stable?.spec?.assignmentDigest !== assignmentDigest(stable)
  ) {
    fail(
      "TRANSACTION_ASSIGNMENT_INVALID",
      "command Assignment differs from its exact digest",
    );
  }
  return frozen({
    reference: resourceReferenceFrom(stable),
    assignmentDigest: stable.spec.assignmentDigest,
  }, "Assignment binding");
}

function submissionBinding(submission) {
  const stable = detached(submission, "Submission");
  if (
    stable?.kind !== "AuthoringSubmission" ||
    stable?.spec?.normalizedSubmissionDigest !==
      normalizedSubmissionDigest(stable)
  ) {
    fail(
      "TRANSACTION_SUBMISSION_INVALID",
      "command Submission differs from its exact normalized digest",
    );
  }
  return frozen({
    reference: resourceReferenceFrom(stable),
    normalizedSubmissionDigest:
      stable.spec.normalizedSubmissionDigest,
  }, "Submission binding");
}

function assertSubmissionCommandAncestry(command, assignment, submission) {
  const request = detached(command.request, "Request");
  if (
    request?.kind !== "AuthoringRequest" ||
    request?.spec?.requestDigest !== requestCoreDigest(request)
  ) {
    fail(
      "TRANSACTION_REQUEST_INVALID",
      "command Request differs from its exact digest",
    );
  }
  if (
    !same(
      command.assignment.spec.request,
      {
        reference: resourceReferenceFrom(request),
        requestDigest: request.spec.requestDigest,
      },
    ) ||
    !same(command.submission.spec.assignment, assignment) ||
    submission.normalizedSubmissionDigest !==
      command.submission.spec.normalizedSubmissionDigest
  ) {
    fail(
      "TRANSACTION_SUBMISSION_ANCESTRY_INVALID",
      "Request, Assignment, and Submission do not form one exact command ancestry",
    );
  }
}

function issueReferences(issues) {
  return frozen(
    issues.map(resourceReferenceFrom),
    "ValidationIssue references",
  );
}

function idempotencyLookup(snapshot, operationIdentity) {
  const matches = snapshot.idempotencyOutcomeView.filter(
    (entry) =>
      entry.machineId ===
        operationIdentity.idempotency.machineId &&
      entry.key === operationIdentity.idempotency.key,
  );
  if (matches.length > 1) {
    fail(
      "TRANSACTION_IDEMPOTENCY_DUPLICATE",
      "stored outcome view repeats one machine-qualified key",
    );
  }
  if (matches.length === 0) return null;
  const entry = matches[0];
  if (
    entry.operationDigest !== operationIdentity.operationDigest ||
    entry.commandDigest !== operationIdentity.commandDigest ||
    entry.payloadDigest !== operationIdentity.payloadDigest
  ) {
    fail(
      "IDEMPOTENCY_KEY_REUSED",
      "an existing idempotency key carries a different normalized operation envelope",
    );
  }
  return entry;
}

function operationDigest(command) {
  return sha256Value({
    domain:
      "mission-kit:authoring:normalized-operation-envelope/v1",
    command,
  });
}

function inventoryFor(config, workspace) {
  return transactionInventory({
    workspace,
    staticInventory: config.staticInventory,
  });
}

function assertPersistedHandoffScopes(snapshot, {
  profile,
  staticInventory,
}) {
  const inventory = transactionInventory({
    workspace: snapshot.workspace,
    staticInventory,
  });
  snapshot.journal.forEach((record, index) => {
    if (record.commitKind === "evidence") {
      if (record.workspaceEffect.handoffSlots.length !== 0) {
        fail(
          "TRANSACTION_JOURNAL_HANDOFF_SCOPE_INVALID",
          `journal[${index}] evidence commit carries a handoff scope`,
        );
      }
      return;
    }
    const mutations = inventory.filter(
      (resource) =>
        resource.kind === "AuthoringMutation" &&
        resource.spec?.mutationDigest === record.mutationDigest,
    );
    if (mutations.length !== 1) {
      fail(
        "TRANSACTION_JOURNAL_HANDOFF_SCOPE_INVALID",
        `journal[${index}] cannot resolve one exact retained Mutation`,
      );
    }
    const expected = transitionHandoffSlots(
      profile,
      mutations[0],
    );
    if (!same(record.workspaceEffect.handoffSlots, expected)) {
      fail(
        "TRANSACTION_JOURNAL_HANDOFF_SCOPE_INVALID",
        `journal[${index}] handoff scope differs from its manifest-selected transition footprint`,
      );
    }
  });
}

function resolveOutcome(config, snapshot, outcome) {
  const inventory = inventoryFor(config, snapshot.workspace);
  switch (outcome.class) {
    case "assignment-issued":
      return reproduceAssignmentBinding({
        profile: config.profile,
        workspace: snapshot.workspace,
        assignmentBinding: outcome.assignment,
        staticInventory: config.staticInventory,
        executables: config.capabilities.executables,
      });
    case "submission-rejected": {
      const assignment = resolveExactResource(
        inventory,
        outcome.assignment.reference,
        {
          kind: "AuthoringAssignment",
          label: "rejected Assignment",
        },
      );
      const submission = resolveExactResource(
        inventory,
        outcome.submission.reference,
        {
          kind: "AuthoringSubmission",
          label: "rejected Submission",
        },
      );
      const issues = outcome.issues.map((reference, index) =>
        resolveExactResource(inventory, reference, {
          kind: "ValidationIssue",
          label: `rejected Submission issue ${index}`,
        }));
      return Object.freeze({
        kind: "rejected",
        operation: "submission",
        assignment,
        submission,
        issues: Object.freeze(issues),
      });
    }
    case "event-rejected": {
      const issues = outcome.issues.map((reference, index) =>
        resolveExactResource(inventory, reference, {
          kind: "ValidationIssue",
          label: `rejected event issue ${index}`,
        }));
      return Object.freeze({
        kind: "rejected",
        operation: "event",
        eventId: outcome.eventId,
        issues: Object.freeze(issues),
      });
    }
    case "assignment-cancelled": {
      const assignment = resolveExactResource(
        inventory,
        outcome.assignment.reference,
        {
          kind: "AuthoringAssignment",
          label: "cancelled Assignment",
        },
      );
      return Object.freeze({
        kind: "cancelled",
        assignment,
      });
    }
    case "transition-committed": {
      const receipt = resolveExactResource(
        inventory,
        outcome.receipt.reference,
        {
          kind: "AuthoringCommitReceipt",
          label: "commit Receipt",
        },
      );
      const sidecars = (outcome.sidecars ?? []).map(
        (reference, index) =>
          resolveExactResource(inventory, reference, {
            label: `commit sidecar ${index}`,
          }),
      );
      return Object.freeze({
        kind: "committed",
        receipt,
        ...(sidecars.length === 0
          ? {}
          : { sidecars: Object.freeze(sidecars) }),
      });
    }
    default:
      fail(
        "TRANSACTION_OUTCOME_INVALID",
        `unsupported retained outcome ${String(outcome.class)}`,
      );
  }
}

function retainedResourceDelta(workspace, resources) {
  const existing = new Map(
    workspace.spec.resourceVersions.map(
      (stored) => [canonicalize(stored.reference), stored],
    ),
  );
  const added = [];
  for (const resource of resources) {
    const stored = storedResourceVersionFromResource(resource);
    const key = canonicalize(stored.reference);
    const prior = existing.get(key);
    if (prior !== undefined && !same(prior, stored)) {
      fail(
        "TRANSACTION_RESOURCE_REFERENCE_CONFLICT",
        `retained resource ${stored.reference.name} conflicts with immutable Workspace bytes`,
      );
    }
    if (prior === undefined) {
      existing.set(key, stored);
      added.push(stored);
    }
  }
  return frozen(added, "new retained resource versions");
}

function historyDelta(workspace, references) {
  const existing = new Set(
    workspace.spec.history.map(canonicalize),
  );
  const added = [];
  for (const reference of references) {
    const stable = detached(reference, "history reference");
    const key = canonicalize(stable);
    if (!existing.has(key)) {
      existing.add(key);
      added.push(stable);
    }
  }
  return frozen(added, "new history references");
}

function persistedRejection(result) {
  return (
    result.kind === "rejected" &&
    result.issues.length > 0 &&
    result.issues.every(
      (issue) =>
        persistedRejectionBoundaries.has(issue.spec.boundary) &&
        issue.spec.nextAction === "edit-and-resubmit",
    )
  );
}

function commitIdFor(snapshot, operationIdentity, identity) {
  const priorJournalHeadDigest = snapshot.journal.length === 0
    ? identity.genesisChainDigest()
    : snapshot.journal[snapshot.journal.length - 1].recordDigest;
  const digest = sha256Value({
    domain: "mission-kit:authoring:commit-id/v1",
    ordinal: snapshot.commitRevision + 1,
    priorJournalHeadDigest,
    idempotency: operationIdentity.idempotency,
    operationDigest: operationIdentity.operationDigest,
    commandDigest: operationIdentity.commandDigest,
    payloadDigest: operationIdentity.payloadDigest,
  });
  return `commit-${digest.slice("sha256:".length)}`;
}

function transitionAuthority(mutation) {
  const authority = detached(
    mutation?.spec?.cause?.authority,
    "Mutation authority",
  );
  assertAuthority(authority, "Mutation authority");
  return authority;
}

function consumedAssignment(inventory, binding) {
  return inventory.some(
    (resource) =>
      resource.kind === "AuthoringCommitReceipt" &&
      resource.spec?.cause?.assignment?.assignmentDigest ===
        binding.assignmentDigest &&
      same(
        resource.spec.cause.assignment.reference,
        binding.reference,
      ),
  );
}

function assertOpenAssignment(config, snapshot, binding) {
  const open = snapshot.workspace.spec.openAssignment;
  if (open !== null && same(open, binding)) return;
  const inventory = inventoryFor(config, snapshot.workspace);
  if (consumedAssignment(inventory, binding)) {
    fail(
      "REQUEST_ALREADY_CONSUMED",
      "Assignment was already consumed by a committed transition",
    );
  }
  fail(
    "ASSIGNMENT_NOT_OPEN",
    "Assignment is not the exact currently authorized open Assignment",
  );
}

function matchingRevisionAssignment(
  config,
  snapshot,
  command,
) {
  const open = snapshot.workspace.spec.openAssignment;
  if (open === null) return null;
  const current = reproduceOpenAssignment({
    profile: config.profile,
    workspace: snapshot.workspace,
    staticInventory: config.staticInventory,
    executables: config.capabilities.executables,
  });
  const operation = current.request.spec.operation;
  const expectedBase = {
    authoringState:
      snapshot.workspace.spec.authoringState,
    semanticRevision:
      snapshot.workspace.spec.semanticRevision,
    semanticStateDigest:
      snapshot.workspace.spec.integrity.semanticStateDigest,
    activeHeads:
      snapshot.workspace.spec.activeHeads,
  };
  if (
    operation.class !== "revision" ||
    operation.unit.id !== command.unitId ||
    !same(command.base, expectedBase) ||
    !same(operation.inputs, command.inputs)
  ) {
    return null;
  }
  const unit = config.profile.spec.revisionUnits.find(
    (candidate) => candidate.id === command.unitId,
  );
  const plan = unit?.revisionPlans.find(
    (candidate) => candidate.eventId === command.eventId,
  );
  return plan?.id === operation.plan.id ? current : null;
}

async function publish(config, writer, snapshot, {
  workspace,
  machineHeads,
  commitKind,
  operationIdentity,
  actor,
  authority,
  mutationDigest,
  machineEdges,
  outcome,
  evidencePlan,
  handoffSlots = [],
}) {
  const before = workspaceRevisionState(snapshot.workspace);
  const after = workspaceRevisionState(workspace);
  const workspaceBoundary = deriveWorkspaceCommitBoundary({
    beforeWorkspace: snapshot.workspace,
    afterWorkspace: workspace,
    handoffSlots,
  });
  const record = assembleJournalRecord({
    journal: snapshot.journal,
    genesisChainDigest: config.identity.genesisChainDigest(),
    genesisRevisionState: config.identity.genesisRevisionState,
    genesisWorkspaceIntegrityDigest:
      config.identity.genesisWorkspaceIntegrityDigest,
    commitId: commitIdFor(
      snapshot,
      operationIdentity,
      config.identity,
    ),
    commitKind,
    actor,
    authority,
    idempotency: operationIdentity.idempotency,
    operationDigest: operationIdentity.operationDigest,
    commandDigest: operationIdentity.commandDigest,
    payloadDigest: operationIdentity.payloadDigest,
    before,
    after,
    ...workspaceBoundary,
    mutationDigest,
    machineEdges,
    ...(evidencePlan === undefined ? {} : { evidencePlan }),
  }, config.identity);
  const outcomeEntry = createIdempotencyOutcomeEntry({
    record,
    outcome,
    ...(evidencePlan === undefined ? {} : { evidencePlan }),
  });
  const next = {
    storeId: snapshot.storeId,
    commitRevision: snapshot.commitRevision + 1,
    workspace,
    journal: [...snapshot.journal, record],
    machineHeads,
    idempotencyOutcomeView: [
      ...snapshot.idempotencyOutcomeView,
      outcomeEntry,
    ],
    identityBinding: snapshot.identityBinding,
    identityScope: snapshot.identityScope,
  };
  const validatedNext = assertAuthoringStorePostImage(
    snapshot,
    next,
    { authoringMachineId: config.authoringMachineId },
  );
  replayAuthoringJournal({
    commitRevision: validatedNext.commitRevision,
    workspace: validatedNext.workspace,
    journal: validatedNext.journal,
    machineHeads: validatedNext.machineHeads,
    idempotencyOutcomeView:
      validatedNext.idempotencyOutcomeView,
    authoringMachineId: config.authoringMachineId,
    identity: config.identity,
  });
  const result = await writer.compareAndCommit({
    expected: snapshotExpectedToken(
      snapshot,
      config.identity,
    ),
    next: validatedNext,
  });
  if (result?.status === "conflict") {
    return Object.freeze({ kind: "conflict" });
  }
  if (
    result?.status !== "committed" ||
    !Object.hasOwn(result, "snapshot")
  ) {
    fail(
      "TRANSACTION_STORE_RESULT_INVALID",
      "store compareAndCommit returned an invalid result",
    );
  }
  const committed = replaySnapshot(result.snapshot, config).snapshot;
  return resolveOutcome(config, committed, outcome);
}

async function commitEvidence(config, writer, snapshot, {
  operationIdentity,
  actor,
  retainedResources,
  historyReferences,
  openAssignmentAfter,
  outcome,
}) {
  const retainedResourceVersions = retainedResourceDelta(
    snapshot.workspace,
    retainedResources,
  );
  const retainedHistory = historyDelta(
    snapshot.workspace,
    historyReferences,
  );
  const workspace = applyEvidenceWorkspace({
    workspace: snapshot.workspace,
    retainedResourceVersions,
    historyReferences: retainedHistory,
    openAssignmentAfter,
  });
  const plan = createEvidenceCommitPlan({
    priorJournalHeadDigest: snapshot.journal.length === 0
      ? config.identity.genesisChainDigest()
      : snapshot.journal[snapshot.journal.length - 1].recordDigest,
    idempotency: operationIdentity.idempotency,
    operationDigest: operationIdentity.operationDigest,
    commandDigest: operationIdentity.commandDigest,
    payloadDigest: operationIdentity.payloadDigest,
    before: workspaceRevisionState(snapshot.workspace),
    after: workspaceRevisionState(workspace),
    retainedResourceVersions,
    openAssignment: {
      before: snapshot.workspace.spec.openAssignment,
      after: openAssignmentAfter,
    },
    outcome,
  });
  return publish(config, writer, snapshot, {
    workspace,
    machineHeads: snapshot.machineHeads,
    commitKind: "evidence",
    operationIdentity,
    actor,
    authority: config.evidenceAuthority,
    mutationDigest: plan.mutationDigest,
    machineEdges: [],
    outcome,
    evidencePlan: plan,
  });
}

async function commitTransition(config, writer, snapshot, {
  operationIdentity,
  actor,
  mutation,
  submission,
}) {
  const initialResources = submission === undefined
    ? [mutation]
    : [submission, mutation];
  const initialReferences = initialResources.map(resourceReferenceFrom);
  const retainedResourceVersions = retainedResourceDelta(
    snapshot.workspace,
    initialResources,
  );
  const retainedHistory = historyDelta(
    snapshot.workspace,
    initialReferences,
  );
  const handoffSlots = transitionHandoffSlots(
    config.profile,
    mutation,
  );
  const semanticWorkspace = applyTransitionWorkspace({
    workspace: snapshot.workspace,
    mutation,
    handoffSlots,
    retainedResourceVersions,
    historyReferences: retainedHistory,
  });
  const receipt = createAuthoringCommitReceipt({
    mutation,
    beforeWorkspace: snapshot.workspace,
    afterWorkspace: semanticWorkspace,
    idempotencyKey: operationIdentity.idempotency.key,
    supersededDescendants:
      deriveSupersededDescendants(mutation),
  });
  const transitionId = mutation.spec.cause.edge.transitionId;
  const transitionBinding = config.profile.spec.transitionBindings.find(
    (binding) => binding.transitionId === transitionId,
  );
  const sidecarIds =
    transitionBinding?.commitSidecarBindingIds ?? [];
  let sidecars = [];
  if (sidecarIds.length > 0) {
    if (submission === undefined) {
      fail(
        "TRANSACTION_SIDECAR_SUBMISSION_REQUIRED",
        "a sidecar-bearing transition requires task-submission ancestry",
      );
    }
    const inventory = transactionInventory({
      workspace: semanticWorkspace,
      staticInventory: config.staticInventory,
    });
    const retainedAssignment = resolveExactResource(
      inventory,
      mutation.spec.cause.assignment.reference,
      {
        kind: "AuthoringAssignment",
        label: "sidecar Assignment",
      },
    );
    const request = resolveExactResource(
      inventory,
      retainedAssignment.spec.request.reference,
      {
        kind: "AuthoringRequest",
        label: "sidecar Request",
      },
    );
    const contextClosure = resolveExactResource(
      inventory,
      request.spec.contextClosure.reference,
      {
        kind: "ContextClosure",
        label: "sidecar ContextClosure",
      },
    );
    sidecars = deriveCommitSidecars({
      profile: config.profile,
      transitionId,
      executables: config.capabilities.executables,
      request,
      assignment: retainedAssignment,
      submission,
      contextClosure,
      mutation,
      receipt,
      resources: [...inventory, receipt],
      validateContract: config.capabilities.validateContract,
    });
  }
  const receiptVersions = retainedResourceDelta(
    semanticWorkspace,
    [receipt, ...sidecars],
  );
  const receiptHistory = historyDelta(
    semanticWorkspace,
    [receipt, ...sidecars].map(resourceReferenceFrom),
  );
  const workspace = retainWorkspaceEvidence({
    workspace: semanticWorkspace,
    retainedResourceVersions: receiptVersions,
    historyReferences: receiptHistory,
  });
  const edgeBundle = deriveTransitionMachineEdges({
    mutation,
    machineHeads: snapshot.machineHeads,
    authoringMachineId: config.authoringMachineId,
    journalOrdinal: snapshot.journal.length + 1,
    identity: config.identity,
  });
  const outcome = receiptOutcome(receipt, sidecars);
  return publish(config, writer, snapshot, {
    workspace,
    machineHeads: edgeBundle.machineHeads,
    commitKind: "transition",
    operationIdentity,
    actor,
    authority: transitionAuthority(mutation),
    mutationDigest: mutation.spec.mutationDigest,
    machineEdges: edgeBundle.machineEdges,
    outcome,
    handoffSlots,
  });
}

function issuanceOutcome(issued) {
  return frozen({
    class: "assignment-issued",
    assignment: issued.openAssignment,
  }, "assignment-issued outcome");
}

async function executeNext(config, writer, snapshot, command) {
  if (snapshot.workspace.spec.openAssignment !== null) {
    return reproduceOpenAssignment({
      profile: config.profile,
      workspace: snapshot.workspace,
      staticInventory: config.staticInventory,
      executables: config.capabilities.executables,
    });
  }
  const result = reduceAuthoring(
    config.profile,
    config.protocol,
    snapshot.workspace,
    command,
    lockedTrustedInputs(config, snapshot.workspace),
  );
  if (result.kind !== "task") return result;
  const issued = issueAssignmentFromTask({
    taskResult: result,
    profile: config.profile,
    workspace: snapshot.workspace,
    staticInventory: config.staticInventory,
    validateRequestContract:
      config.capabilities.validateContract,
    executables: config.capabilities.executables,
  });
  const operationIdentity = deriveOperationIdentity({
    operationClass: "assignment-issuance",
    machineId: config.authoringMachineId,
    operationDigest: operationDigest(command),
    requestDigest: issued.request.spec.requestDigest,
    assignmentDigest:
      issued.assignment.spec.assignmentDigest,
    priorEvidenceRevision:
      snapshot.workspace.spec.evidenceRevision,
  });
  const existing = idempotencyLookup(
    snapshot,
    operationIdentity,
  );
  if (existing) {
    return resolveOutcome(config, snapshot, existing.outcome);
  }
  return commitEvidence(config, writer, snapshot, {
    operationIdentity,
    actor: config.systemActor,
    retainedResources:
      issued.retainedResourceVersions.map((stored) => stored.resource),
    historyReferences: issued.historyReferences,
    openAssignmentAfter: issued.openAssignment,
    outcome: issuanceOutcome(issued),
  });
}

async function executeRevise(config, writer, snapshot, command) {
  const pending = matchingRevisionAssignment(
    config,
    snapshot,
    command,
  );
  if (pending) return pending;
  const result = reduceAuthoring(
    config.profile,
    config.protocol,
    snapshot.workspace,
    command,
    lockedTrustedInputs(config, snapshot.workspace),
  );
  if (result.kind !== "task") return result;
  const issued = issueAssignmentFromTask({
    taskResult: result,
    profile: config.profile,
    workspace: snapshot.workspace,
    staticInventory: config.staticInventory,
    validateRequestContract:
      config.capabilities.validateContract,
    executables: config.capabilities.executables,
  });
  const operationIdentity = deriveOperationIdentity({
    operationClass: "assignment-issuance",
    machineId: config.authoringMachineId,
    operationDigest: operationDigest(command),
    requestDigest: issued.request.spec.requestDigest,
    assignmentDigest:
      issued.assignment.spec.assignmentDigest,
    priorEvidenceRevision:
      snapshot.workspace.spec.evidenceRevision,
  });
  const existing = idempotencyLookup(
    snapshot,
    operationIdentity,
  );
  if (existing) {
    return resolveOutcome(config, snapshot, existing.outcome);
  }
  return commitEvidence(config, writer, snapshot, {
    operationIdentity,
    actor: config.systemActor,
    retainedResources:
      issued.retainedResourceVersions.map((stored) => stored.resource),
    historyReferences: issued.historyReferences,
    openAssignmentAfter: issued.openAssignment,
    outcome: issuanceOutcome(issued),
  });
}

async function executeSubmit(config, writer, snapshot, command) {
  validateCommandResourceContract(
    config,
    command.request,
    "command AuthoringRequest",
  );
  validateCommandResourceContract(
    config,
    command.assignment,
    "command AuthoringAssignment",
  );
  validateCommandResourceContract(
    config,
    command.submission,
    "command AuthoringSubmission",
  );
  const assignment = assignmentBinding(command.assignment);
  const submission = submissionBinding(command.submission);
  assertSubmissionCommandAncestry(
    command,
    assignment,
    submission,
  );
  const operationIdentity = deriveOperationIdentity({
    operationClass: "submission-attempt",
    machineId: config.authoringMachineId,
    operationDigest: operationDigest(command),
    assignmentDigest: assignment.assignmentDigest,
    normalizedSubmissionDigest:
      submission.normalizedSubmissionDigest,
  });
  const existing = idempotencyLookup(
    snapshot,
    operationIdentity,
  );
  if (existing) {
    return resolveOutcome(config, snapshot, existing.outcome);
  }
  assertOpenAssignment(config, snapshot, assignment);
  const result = reduceAuthoring(
    config.profile,
    config.protocol,
    snapshot.workspace,
    command,
    lockedTrustedInputs(config, snapshot.workspace),
  );
  if (result.kind === "mutation") {
    return commitTransition(config, writer, snapshot, {
      operationIdentity,
      actor: submissionActor(command.submission),
      mutation: result.mutation,
      submission: command.submission,
    });
  }
  if (!persistedRejection(result)) return result;
  const outcome = frozen({
    class: "submission-rejected",
    assignment,
    submission,
    issues: issueReferences(result.issues),
  }, "submission-rejected outcome");
  return commitEvidence(config, writer, snapshot, {
    operationIdentity,
    actor: submissionActor(command.submission),
    retainedResources: [
      command.submission,
      ...result.issues,
    ],
    historyReferences: [
      resourceReferenceFrom(command.submission),
      ...outcome.issues,
    ],
    openAssignmentAfter:
      snapshot.workspace.spec.openAssignment,
    outcome,
  });
}

async function executeEvent(config, writer, snapshot, command) {
  const operationIdentity = deriveOperationIdentity({
    operationClass: "event",
    machineId: config.authoringMachineId,
    operationDigest: operationDigest(command),
    commandDigest: command.commandDigest,
    payloadDigest: command.payloadDigest,
  });
  const existing = idempotencyLookup(
    snapshot,
    operationIdentity,
  );
  if (existing) {
    return resolveOutcome(config, snapshot, existing.outcome);
  }
  const result = reduceAuthoring(
    config.profile,
    config.protocol,
    snapshot.workspace,
    command,
    lockedTrustedInputs(config, snapshot.workspace),
  );
  if (result.kind === "mutation") {
    return commitTransition(config, writer, snapshot, {
      operationIdentity,
      actor: config.systemActor,
      mutation: result.mutation,
    });
  }
  if (!persistedRejection(result)) return result;
  const outcome = frozen({
    class: "event-rejected",
    eventId: command.eventId,
    issues: issueReferences(result.issues),
  }, "event-rejected outcome");
  return commitEvidence(config, writer, snapshot, {
    operationIdentity,
    actor: config.systemActor,
    retainedResources: result.issues,
    historyReferences: outcome.issues,
    openAssignmentAfter:
      snapshot.workspace.spec.openAssignment,
    outcome,
  });
}

async function executeCancel(config, writer, snapshot, command) {
  const binding = detached(
    command.assignment,
    "cancel Assignment binding",
  );
  if (
    !exactKeys(binding, ["reference", "assignmentDigest"])
  ) {
    fail(
      "TRANSACTION_CANCEL_ASSIGNMENT_INVALID",
      "cancel requires one exact Assignment binding",
    );
  }
  assertDigest(
    binding.assignmentDigest,
    "cancel assignmentDigest",
  );
  assertDigest(
    command.cancellationEvidenceDigest,
    "cancellationEvidenceDigest",
  );
  const inventory = inventoryFor(config, snapshot.workspace);
  const retainedAssignment = resolveExactResource(
    inventory,
    binding.reference,
    {
      kind: "AuthoringAssignment",
      label: "cancel Assignment",
    },
  );
  if (
    retainedAssignment.spec.assignmentDigest !==
      binding.assignmentDigest
  ) {
    fail(
      "TRANSACTION_CANCEL_ASSIGNMENT_INVALID",
      "cancel Assignment binding differs from retained bytes",
    );
  }
  const envelopeDigest = operationDigest(command);
  if (
    !same(
      snapshot.workspace.spec.openAssignment,
      binding,
    )
  ) {
    const exactReplays =
      snapshot.idempotencyOutcomeView.filter(
        (entry) =>
          entry.operationDigest === envelopeDigest &&
          entry.outcome?.class ===
            "assignment-cancelled" &&
          same(entry.outcome.assignment, binding),
      );
    if (exactReplays.length > 0) {
      return resolveOutcome(
        config,
        snapshot,
        exactReplays.at(-1).outcome,
      );
    }
    assertOpenAssignment(config, snapshot, binding);
  }
  const issuanceCandidates =
    snapshot.journal.filter(
      (record, index) =>
        record.commitKind === "evidence" &&
        same(
          record.workspaceEffect?.openAssignment?.after,
          binding,
        ) &&
        snapshot.idempotencyOutcomeView[index]
          ?.outcome?.class === "assignment-issued" &&
        same(
          snapshot.idempotencyOutcomeView[index]
            .outcome.assignment,
          binding,
        ),
    );
  if (issuanceCandidates.length === 0) {
    fail(
      "TRANSACTION_CANCEL_ISSUANCE_INVALID",
      "cancel cannot resolve the exact current Assignment issuance epoch",
    );
  }
  const issuanceRecord = issuanceCandidates.at(-1);
  const operationIdentity = deriveOperationIdentity({
    operationClass: "cancellation",
    machineId: config.authoringMachineId,
    operationDigest: envelopeDigest,
    assignmentDigest: binding.assignmentDigest,
    cancellationEvidenceDigest:
      command.cancellationEvidenceDigest,
    issuanceRecordDigest: issuanceRecord.recordDigest,
  });
  const existing = idempotencyLookup(
    snapshot,
    operationIdentity,
  );
  if (existing) {
    return resolveOutcome(config, snapshot, existing.outcome);
  }
  assertOpenAssignment(config, snapshot, binding);
  const outcome = frozen({
    class: "assignment-cancelled",
    assignment: binding,
  }, "assignment-cancelled outcome");
  return commitEvidence(config, writer, snapshot, {
    operationIdentity,
    actor: config.systemActor,
    retainedResources: [],
    historyReferences: [],
    openAssignmentAfter: null,
    outcome,
  });
}

function normalizeCommand(command) {
  const value = detached(command, "transaction command");
  if (!isRecord(value) || typeof value.class !== "string") {
    fail(
      "TRANSACTION_COMMAND_INVALID",
      "transaction command must be one closed command object",
    );
  }
  const fields = {
    next: ["class", "inputs"],
    revise: [
      "class",
      "unitId",
      "eventId",
      "base",
      "inputs",
    ],
    submit: [
      "class",
      "request",
      "assignment",
      "submission",
      "externalCouplings",
    ],
    event: [
      "class",
      "eventId",
      "base",
      "commandDigest",
      "payloadDigest",
      "evidenceDigest",
      "inputs",
      "externalCouplings",
    ],
    cancel: [
      "class",
      "assignment",
      "cancellationEvidenceDigest",
    ],
  };
  if (
    !Object.hasOwn(fields, value.class) ||
    !exactKeys(value, fields[value.class])
  ) {
    fail(
      "TRANSACTION_COMMAND_INVALID",
      "transaction command contains missing or ambient fields",
    );
  }
  if (
    !["next", "revise", "submit", "event", "cancel"].includes(
      value.class,
    )
  ) {
    fail(
      "TRANSACTION_COMMAND_UNSUPPORTED",
      `unsupported transaction command ${String(value.class)}`,
    );
  }
  return value.class === "cancel"
    ? value
    : normalizeAuthoringCommand(value);
}

/**
 * Private domain-neutral transaction coordinator. It owns no Survey
 * vocabulary, session shape, filesystem path, or transport behavior.
 */
export function createAuthoringTransactionCoordinator({
  store,
  profile,
  protocol,
  trustedInputs,
  identity,
  authoringMachineId,
  systemActor,
  evidenceAuthority,
  eventCommandAdmission,
}) {
  const capturedStore = captureStore(store);
  const capabilities = captureTrustedInputs(trustedInputs);
  const compiledExecutables = compileExecutableRegistry(
    capabilities.executables,
  );
  if (!isCompiledJournalIdentityPort(identity)) {
    fail(
      "TRANSACTION_IDENTITY_UNCOMPILED",
      "coordinator requires one compiled JournalIdentityPort",
    );
  }
  assertSemanticId(
    authoringMachineId,
    "authoringMachineId",
  );
  const actor = detached(systemActor, "systemActor");
  const authority = detached(
    evidenceAuthority,
    "evidenceAuthority",
  );
  assertActor(actor, "systemActor");
  assertAuthority(authority, "evidenceAuthority");
  const capturedEventCommandAdmission =
    captureEventCommandAdmission(
      profile,
      eventCommandAdmission,
    );
  const config = Object.freeze({
    store: capturedStore,
    profile: frozen(profile, "profile"),
    protocol: frozen(protocol, "protocol"),
    capabilities,
    compiledExecutables,
    staticInventory: capabilities.inventory,
    identity,
    authoringMachineId,
    systemActor: actor,
    evidenceAuthority: authority,
    eventCommandAdmission:
      capturedEventCommandAdmission,
  });
  const coordinator = Object.freeze({
    async read(storeId) {
      preflightProfileExecutables(
        config.profile,
        config.compiledExecutables,
      );
      const current = await config.store.read(storeId);
      const { snapshot, replay } = replaySnapshot(
        current,
        config,
      );
      const pending = snapshot.workspace.spec.openAssignment === null
        ? null
        : reproduceOpenAssignment({
          profile: config.profile,
          workspace: snapshot.workspace,
          staticInventory: config.staticInventory,
          executables: config.capabilities.executables,
        });
      return Object.freeze({ snapshot, replay, pending });
    },

    async execute(storeId, commandInput) {
      let eventAdmission = false;
      if (config.eventCommandAdmission !== null) {
        let consumed;
        try {
          consumed =
            config.eventCommandAdmission.consume(commandInput);
        } catch (error) {
          fail(
            "TRANSACTION_EVENT_ADMISSION_INVALID",
            `event command admission verifier failed: ${
              error instanceof Error
                ? error.message
                : String(error)
            }`,
          );
        }
        if (consumed !== true && consumed !== false) {
          fail(
            "TRANSACTION_EVENT_ADMISSION_INVALID",
            "event command admission verifier must return Boolean synchronously",
          );
        }
        eventAdmission = consumed;
      }
      preflightProfileExecutables(
        config.profile,
        config.compiledExecutables,
      );
      const command = normalizeCommand(commandInput);
      if (
        command.class === "event" &&
        config.eventCommandAdmission !== null &&
        !eventAdmission
      ) {
        fail(
          "TRANSACTION_EVENT_ADMISSION_REQUIRED",
          "event command requires the profile-bound adapter admission port",
        );
      }
      if (
        command.class !== "event" &&
        eventAdmission
      ) {
        fail(
          "TRANSACTION_EVENT_ADMISSION_INVALID",
          "event command admission cannot authorize a non-event command",
        );
      }
      return config.store.withWriter(
        storeId,
        async (writer) => {
          const current = await writer.read();
          const { snapshot } = replaySnapshot(current, config);
          switch (command.class) {
            case "next":
              return executeNext(config, writer, snapshot, command);
            case "revise":
              return executeRevise(
                config,
                writer,
                snapshot,
                command,
              );
            case "submit":
              return executeSubmit(
                config,
                writer,
                snapshot,
                command,
              );
            case "event":
              return executeEvent(
                config,
                writer,
                snapshot,
                command,
              );
            case "cancel":
              return executeCancel(
                config,
                writer,
                snapshot,
                command,
              );
            default:
              fail(
                "TRANSACTION_COMMAND_UNSUPPORTED",
                `unsupported transaction command ${command.class}`,
              );
          }
        },
      );
    },
  });
  return coordinator;
}
