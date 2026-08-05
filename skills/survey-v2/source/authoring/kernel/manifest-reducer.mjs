import { types } from "node:util";
import { canonicalize, stableValue } from "./canonical.mjs";
import {
  assignmentDigest,
  normalizedSubmissionDigest,
  projectResourceSemantics,
  projectWorkspaceSemanticStateCore,
  resourceReferenceFrom,
} from "./digests.mjs";
import { validateContractSemantics } from "./contract-semantics.mjs";
import { resolveContextClosure } from "./context-resolver.mjs";
import {
  compileExecutableRegistry,
  freezeExecutableInput,
  invokeHandler,
  invokeProjector,
  invokeValidator,
  resolveExecutable,
} from "./executable-registry.mjs";
import {
  assertAuthoringAuthority,
  evaluateRevisionSelectionGuard,
  evaluateTransitionGuards,
  selectEventAuthority,
  selectNextAuthority,
  selectRevisionAuthority,
} from "./manifest-selection.mjs";
import {
  planAuthoringMutation,
  preflightAuthoringProducts,
} from "./mutation-planner.mjs";
import {
  assertRawTaskRequestInputs,
  buildRevisionRequestDraft,
  buildTaskRequestDraft,
} from "./request-planner.mjs";
import {
  verifyTextAssignmentDag,
} from "./assignment-dag.mjs";
import {
  textContentBytes,
  validateAuthoringFieldValues,
} from "./text-forms.mjs";
import {
  createValidationIssue,
  mutationResult,
  rejectedResult,
  taskResult,
  terminalResult,
  validationIssuesFromDomain,
  waitResult,
} from "./reducer-results.mjs";

const digestPattern = /^sha256:[0-9a-f]{64}$/u;
const eventIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$/u;
const fieldPathPattern = /^(?:\/(?:[^~/]|~0|~1)*)*$/u;
const semanticIdPattern =
  /^[a-z][a-z0-9]*(?:[._:/-][a-z0-9]+)*$/u;
const promiseThen = Promise.prototype.then;

const phasePolicies = Object.freeze({
  input: Object.freeze({
    boundary: "kernel.input",
    nextAction: "edit-and-resubmit",
    correction: "Supply one closed canonical reducer invocation.",
  }),
  identity: Object.freeze({
    boundary: "kernel.identity",
    nextAction: "restore-compatible-build",
    correction:
      "Restore the exact pinned profile, protocol, workspace, and host executable identities.",
  }),
  freshness: Object.freeze({
    boundary: "kernel.freshness",
    nextAction: "reissue-assignment",
    correction:
      "Reissue the request and assignment from the current immutable workspace snapshot.",
  }),
  authority: Object.freeze({
    boundary: "kernel.authority",
    nextAction: "reissue-assignment",
    correction:
      "Select an operation admitted by the current manifest-owned state.",
  }),
  context: Object.freeze({
    boundary: "kernel.context",
    nextAction: "reissue-assignment",
    correction:
      "Resolve only the exact typed context declared by the selected manifest authority.",
  }),
  guard: Object.freeze({
    boundary: "profile.guard",
    nextAction: "edit-and-resubmit",
    correction: "Correct the values rejected by the declared guard.",
  }),
  handler: Object.freeze({
    boundary: "profile.handler",
    nextAction: "edit-and-resubmit",
    correction: "Correct the values rejected by the declared handler.",
  }),
  resource: Object.freeze({
    boundary: "profile.resource",
    nextAction: "edit-and-resubmit",
    correction:
      "Return only resources admitted by the declared schema and semantic validator set.",
  }),
  mutation: Object.freeze({
    boundary: "kernel.mutation",
    nextAction: "no-safe-remediation",
    correction:
      "Restore a handler result confined to the exact manifest mutation footprint.",
  }),
  contract: Object.freeze({
    boundary: "kernel.contract",
    nextAction: "restore-compatible-build",
    correction:
      "Restore a structurally and semantically compatible closed authoring contract.",
  }),
});

export class AuthoringReducerError extends Error {
  constructor(code, field, reason) {
    super(reason);
    this.name = "AuthoringReducerError";
    this.code = code;
    this.field = field;
    this.reason = reason;
  }
}

function fail(code, field, reason) {
  throw new AuthoringReducerError(code, field, reason);
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
  return (
    required.every((key) => Object.hasOwn(value, key)) &&
    Object.keys(value).every((key) => admitted.has(key))
  );
}

function exactDataRecord(value, required, optional = []) {
  if (!isRecord(value)) return false;
  const admitted = new Set([...required, ...optional]);
  const ownKeys = Reflect.ownKeys(value);
  if (
    ownKeys.length < required.length ||
    ownKeys.some(
      (key) => typeof key !== "string" || !admitted.has(key),
    ) ||
    required.some((key) => !ownKeys.includes(key))
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

function isDigestBinding(value) {
  return (
    exactKeys(value, ["id", "digest"]) &&
    typeof value.id === "string" &&
    value.id.length <= 160 &&
    semanticIdPattern.test(value.id) &&
    digestPattern.test(value.digest ?? "")
  );
}

function isResourceReference(value) {
  return (
    exactKeys(
      value,
      ["apiVersion", "kind", "name", "semanticDigest"],
    ) &&
    ["apiVersion", "kind", "name"].every(
      (key) => typeof value[key] === "string" && value[key].length > 0,
    ) &&
    digestPattern.test(value.semanticDigest ?? "")
  );
}

function same(left, right) {
  return canonicalize(left) === canonicalize(right);
}

function one(values, predicate, code, label) {
  const matches = values.filter(predicate);
  if (matches.length !== 1) {
    fail(
      code,
      "",
      `${label} must resolve exactly once; resolved ${matches.length}.`,
    );
  }
  return matches[0];
}

function isCommandBase(value) {
  return (
    exactKeys(
      value,
      [
        "authoringState",
        "semanticRevision",
        "semanticStateDigest",
        "activeHeads",
      ],
    ) &&
    typeof value.authoringState === "string" &&
    semanticIdPattern.test(value.authoringState) &&
    Number.isInteger(value.semanticRevision) &&
    value.semanticRevision >= 0 &&
    digestPattern.test(value.semanticStateDigest ?? "") &&
    Array.isArray(value.activeHeads) &&
    value.activeHeads.every(
      (head) =>
        exactKeys(head, ["slot", "reference"]) &&
        typeof head.slot === "string" &&
        semanticIdPattern.test(head.slot) &&
        isResourceReference(head.reference),
    )
  );
}

function closedCommand(command) {
  let value;
  try {
    value = stableValue(command);
  } catch {
    fail(
      "REDUCER_COMMAND_NON_CANONICAL",
      "/command",
      "Reducer command must be one canonical JSON value.",
    );
  }
  if (!isRecord(value) || typeof value.class !== "string") {
    fail(
      "REDUCER_COMMAND_INVALID",
      "/command",
      "Reducer command must be one closed command object.",
    );
  }
  const keys = {
    next: ["class", "inputs"],
    revise: ["class", "unitId", "eventId", "base", "inputs"],
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
  };
  if (!Object.hasOwn(keys, value.class) || !exactKeys(value, keys[value.class])) {
    fail(
      "REDUCER_COMMAND_INVALID",
      "/command",
      `Reducer command ${value.class} does not have its exact closed fields.`,
    );
  }
  if (
    ["next", "revise", "event"].includes(value.class) &&
    !isRecord(value.inputs)
  ) {
    fail(
      "REDUCER_COMMAND_INPUTS_INVALID",
      "/command/inputs",
      "Reducer command inputs must be one closed reference map.",
    );
  }
  if (
    ["revise", "event"].includes(value.class) &&
    (
      typeof value.eventId !== "string" ||
      !eventIdPattern.test(value.eventId)
    )
  ) {
    fail(
      "REDUCER_COMMAND_EVENT_INVALID",
      "/command/eventId",
      "Reducer command eventId is invalid.",
    );
  }
  if (
    ["revise", "event"].includes(value.class) &&
    !isCommandBase(value.base)
  ) {
    fail(
      "REDUCER_COMMAND_BASE_INVALID",
      "/command/base",
      "Revise and event commands require one exact semantic base including ordered active heads.",
    );
  }
  if (
    ["submit", "event"].includes(value.class) &&
    !Array.isArray(value.externalCouplings)
  ) {
    fail(
      "REDUCER_COMMAND_COUPLINGS_INVALID",
      "/command/externalCouplings",
      "Reducer command externalCouplings must be one ordered array.",
    );
  }
  if (
    value.class === "event" &&
    ["commandDigest", "payloadDigest", "evidenceDigest"].some(
      (field) => !digestPattern.test(value[field] ?? ""),
    )
  ) {
    fail(
      "REDUCER_COMMAND_DIGEST_INVALID",
      "/command",
      "Event command digests must be canonical sha256 values.",
    );
  }
  return value;
}

/**
 * Admit one complete domain-neutral reducer command before any coordinator
 * replay or pending-work shortcut can observe it.
 */
export function normalizeAuthoringCommand(command) {
  return closedCommand(command);
}

function trustedSurface(trustedInputs) {
  const required = ["validateContract", "kernel"];
  const optional = ["executables", "inventory"];
  if (!exactDataRecord(trustedInputs, required, optional)) {
    fail(
      "REDUCER_TRUSTED_INPUTS_INVALID",
      "/trustedInputs",
      "Trusted inputs must contain one synchronous contract validator, one exact host kernel binding, and only the closed optional executable and inventory authorities.",
    );
  }
  const valueFor = (key) =>
    Object.getOwnPropertyDescriptor(trustedInputs, key)?.value;
  const validateContract = valueFor("validateContract");
  if (typeof validateContract !== "function") {
    fail(
      "REDUCER_TRUSTED_INPUTS_INVALID",
      "/trustedInputs",
      "The host contract validator must be one callable data property.",
    );
  }
  if (types.isAsyncFunction(validateContract)) {
    fail(
      "CONTRACT_VALIDATOR_ASYNC_FORBIDDEN",
      "/trustedInputs/validateContract",
      "The host contract validator must be synchronous.",
    );
  }
  let kernel;
  let inventory;
  try {
    kernel = stableValue(valueFor("kernel"));
    inventory = stableValue(valueFor("inventory") ?? []);
  } catch {
    fail(
      "REDUCER_TRUSTED_INPUTS_INVALID",
      "/trustedInputs",
      "The host kernel and inventory must be closed canonical snapshots.",
    );
  }
  if (
    !isDigestBinding(kernel) ||
    !Array.isArray(inventory) ||
    inventory.length > 32768
  ) {
    fail(
      "REDUCER_TRUSTED_INPUTS_INVALID",
      "/trustedInputs",
      "The host kernel and inventory must be exact bounded authorities.",
    );
  }
  const executables = Object.hasOwn(trustedInputs, "executables")
    ? compileExecutableRegistry(valueFor("executables"))
    : undefined;
  return Object.freeze({
    validateContract,
    kernel: freezeExecutableInput(kernel),
    inventory: freezeExecutableInput(inventory),
    executables,
  });
}

function assertClosedContract(validateContract, resource) {
  if (types.isAsyncFunction(validateContract)) {
    fail(
      "CONTRACT_VALIDATOR_ASYNC_FORBIDDEN",
      "",
      "The host contract validator must be synchronous.",
    );
  }
  let positive;
  try {
    positive = validateContract(freezeExecutableInput(resource));
  } catch {
    fail(
      "CLOSED_CONTRACT_REJECTED",
      "",
      `${resource?.kind ?? "resource"} failed its host-trusted closed contract.`,
    );
  }
  if (positive !== null && types.isPromise(positive)) {
    Reflect.apply(promiseThen, positive, [undefined, () => {}]);
    fail(
      "CONTRACT_VALIDATOR_ASYNC_FORBIDDEN",
      "",
      `${resource?.kind ?? "resource"} received an asynchronous host contract result.`,
    );
  }
  if (positive !== true) {
    fail(
      "CLOSED_CONTRACT_REJECTED",
      "",
      `${resource?.kind ?? "resource"} did not receive one synchronous positive closed-contract result.`,
    );
  }
  const issues = validateContractSemantics(resource);
  if (issues.length > 0) {
    fail(
      issues[0].code,
      issues[0].field,
      issues[0].reason,
    );
  }
}

function assertHostKernel(profile, hostKernel) {
  if (!same(hostKernel, profile.spec.kernel)) {
    fail(
      "HOST_KERNEL_IDENTITY_MISMATCH",
      "/trustedInputs/kernel",
      "The host-trusted kernel identity differs from the profile kernel binding.",
    );
  }
}

export function preflightProfileExecutables(profile, compiled) {
  for (const binding of profile.spec.guardBindings) {
    resolveExecutable(compiled, "guards", binding.handler);
  }
  for (const binding of profile.spec.handlerBindings) {
    resolveExecutable(compiled, "handlers", binding.handler);
  }
  for (const binding of profile.spec.schemaBindings) {
    resolveExecutable(compiled, "validators", binding.schema);
    resolveExecutable(
      compiled,
      "validators",
      binding.semanticValidator,
    );
  }
  for (const validatorSet of profile.spec.validatorSets) {
    for (const member of validatorSet.members) {
      resolveExecutable(compiled, "validators", member);
    }
  }
  for (const binding of profile.spec.projectionBindings) {
    resolveExecutable(compiled, "projectors", binding.engine);
  }
  for (const binding of profile.spec.commitSidecarBindings ?? []) {
    resolveExecutable(compiled, "sidecars", binding.executable);
  }
}

function compiledExecutables(trustedInputs, profile) {
  if (trustedInputs.executables === undefined) {
    fail(
      "EXECUTABLE_REGISTRY_REQUIRED",
      "/trustedInputs/executables",
      "This reducer command requires one host-trusted executable registry.",
    );
  }
  preflightProfileExecutables(profile, trustedInputs.executables);
  return trustedInputs.executables;
}

function handlerBinding(profile, bindingId) {
  return one(
    profile.spec.handlerBindings,
    (entry) => entry.id === bindingId,
    "HANDLER_BINDING_UNRESOLVED",
    `handler binding ${bindingId}`,
  );
}

function guardRejection(results) {
  return results.find((entry) => entry.result.status === "reject");
}

function rejectedDomain(domainIssues, phase) {
  const policy = phasePolicies[phase];
  return rejectedResult(validationIssuesFromDomain(domainIssues, {
    boundary: policy.boundary,
    nextAction: policy.nextAction,
  }));
}

function eventInputsFromClosure(contextClosure) {
  return contextClosure.spec.layers.map((layer) => ({
    ordinal: layer.ordinal,
    role: layer.role,
    reference: layer.sourceReference,
    integrityDigest: layer.sourceIntegrityDigest,
  }));
}

function assertRawEventInputs(selectors, requestInputs) {
  const allowedKeys = new Set(
    selectors.flatMap((selector) =>
      selector.selection.mode === "event-input"
        ? [selector.selection.inputKey]
        : []
    ),
  );
  const ambientKeys = Object.keys(requestInputs)
    .filter((inputKey) => !allowedKeys.has(inputKey))
    .sort((left, right) =>
      Buffer.compare(Buffer.from(left), Buffer.from(right)));
  if (ambientKeys.length > 0) {
    fail(
      "EVENT_INPUT_UNDECLARED",
      `/command/inputs/${ambientKeys[0]}`,
      `Event input ${ambientKeys[0]} is not declared by an event-input selector.`,
    );
  }
  const firstKeyByReference = new Map();
  const inputKeys = Object.keys(requestInputs)
    .filter((inputKey) => allowedKeys.has(inputKey))
    .sort((left, right) =>
      Buffer.compare(Buffer.from(left), Buffer.from(right)));
  for (const inputKey of inputKeys) {
    const referenceIdentity = canonicalize(
      requestInputs[inputKey],
    );
    const firstKey = firstKeyByReference.get(referenceIdentity);
    if (firstKey !== undefined) {
      fail(
        "EVENT_INPUT_REFERENCE_ALIAS",
        `/command/inputs/${inputKey}`,
        `Event inputs ${firstKey} and ${inputKey} alias one resource reference.`,
      );
    }
    firstKeyByReference.set(referenceIdentity, inputKey);
  }
}

function commandBaseFrom(workspace) {
  return {
    authoringState: workspace.spec.authoringState,
    semanticRevision: workspace.spec.semanticRevision,
    semanticStateDigest:
      workspace.spec.integrity.semanticStateDigest,
    activeHeads: stableValue(workspace.spec.activeHeads),
  };
}

function assertCommandBaseFresh(workspace, base, code) {
  if (!same(base, commandBaseFrom(workspace))) {
    fail(
      code,
      "/command/base",
      "Command base differs from the supplied workspace semantic snapshot.",
    );
  }
}

function semanticOperation(operation) {
  if (operation.class === "event") {
    return stableValue({
      class: operation.class,
      eventId: operation.eventId,
      base: operation.base,
      inputs: operation.inputs,
    });
  }
  return stableValue(operation);
}

function semanticCallbackInput({
  phase,
  profile,
  protocol,
  workspace,
  operation,
  contextClosure,
  configuration,
  submission,
  normalizedValues,
}) {
  const input = {
    phase,
    profile: projectResourceSemantics(profile),
    protocol: projectResourceSemantics(protocol),
    workspace: projectWorkspaceSemanticStateCore(workspace),
    operation: semanticOperation(operation),
    contextClosure: projectResourceSemantics(contextClosure),
    configuration: stableValue(configuration),
  };
  if (submission !== undefined) {
    input.submission = projectResourceSemantics(submission);
  }
  if (normalizedValues !== undefined) {
    input.normalizedValues = stableValue(normalizedValues);
  }
  return input;
}

function prepareProductValidations({
  profile,
  products,
  compiled,
}) {
  const validations = products.map((product, index) => {
    const schemaBinding = one(
      profile.spec.schemaBindings,
      (entry) =>
        entry.resourceType.apiVersion === product.resource.apiVersion &&
        entry.resourceType.kind === product.resource.kind,
      "PRODUCT_SCHEMA_BINDING_UNRESOLVED",
      `product ${index} schema binding`,
    );
    const validatorSet = one(
      profile.spec.validatorSets,
      (entry) =>
        entry.members.some(
          (member) =>
            member.id === schemaBinding.semanticValidator.id &&
            member.digest === schemaBinding.semanticValidator.digest,
        ),
      "PRODUCT_VALIDATOR_SET_UNRESOLVED",
      `product ${index} semantic validator set`,
    );
    return { index, product, schemaBinding, validatorSet };
  });
  for (const validation of validations) {
    resolveExecutable(
      compiled,
      "validators",
      validation.schemaBinding.schema,
    );
    for (const member of validation.validatorSet.members) {
      resolveExecutable(compiled, "validators", member);
    }
  }
  return validations;
}

function validateProducts({ profile, products, compiled }) {
  const validations = prepareProductValidations({
    profile,
    products,
    compiled,
  });
  for (const {
    product,
    schemaBinding,
    validatorSet,
  } of validations) {
    const structural = invokeValidator(
      compiled,
      schemaBinding.schema,
      {
        phase: "created-resource-structure",
        resource: product.resource,
      },
    );
    if (structural.status === "reject") return structural.issues;
    for (const member of validatorSet.members) {
      const semantic = invokeValidator(
        compiled,
        member,
        {
          phase: "created-resource-semantics",
          resource: product.resource,
        },
      );
      if (semantic.status === "reject") return semantic.issues;
    }
  }
  return null;
}

function assertSubmissionAncestry({
  workspace,
  request,
  assignment,
  submission,
}) {
  if (
    assignment.spec.assignmentDigest !== assignmentDigest(assignment) ||
    submission.spec.normalizedSubmissionDigest !==
      normalizedSubmissionDigest(submission) ||
    !same(assignment.spec.request.reference, resourceReferenceFrom(request)) ||
    assignment.spec.request.requestDigest !== request.spec.requestDigest ||
    assignment.spec.baseSemanticRevision !== request.spec.base.semanticRevision ||
    assignment.spec.baseSemanticStateDigest !==
      request.spec.base.semanticStateDigest ||
    !same(submission.spec.assignment.reference, resourceReferenceFrom(assignment)) ||
    submission.spec.assignment.assignmentDigest !==
      assignment.spec.assignmentDigest
  ) {
    fail(
      "SUBMISSION_ANCESTRY_MISMATCH",
      "/command/submission",
      "Request, assignment, or submission immutable ancestry differs.",
    );
  }
  if (
    request.spec.base.authoringState !== workspace.spec.authoringState ||
    request.spec.base.semanticRevision !== workspace.spec.semanticRevision ||
    request.spec.base.semanticStateDigest !==
      workspace.spec.integrity.semanticStateDigest
  ) {
    fail(
      "SUBMISSION_BASE_STALE",
      "/command/request/spec/base",
      "Request base differs from the supplied workspace semantic snapshot.",
    );
  }
  if (
    workspace.spec.openAssignment !== null &&
    (
      !same(
        workspace.spec.openAssignment.reference,
        resourceReferenceFrom(assignment),
      ) ||
      workspace.spec.openAssignment.assignmentDigest !==
        assignment.spec.assignmentDigest
    )
  ) {
    fail(
      "SUBMISSION_ASSIGNMENT_STALE",
      "/workspace/spec/openAssignment",
      "Workspace open assignment differs from the submitted assignment.",
    );
  }
}

function resolveInventoryResource(inventory, reference, kind, label) {
  const matches = inventory.filter((resource) => {
    if (
      !isRecord(resource) ||
      resource.kind !== kind
    ) {
      return false;
    }
    try {
      return same(resourceReferenceFrom(resource), reference);
    } catch {
      return false;
    }
  });
  return one(
    matches,
    () => true,
    "SUBMISSION_INVENTORY_AUTHORITY_UNRESOLVED",
    label,
  );
}

function assertSubmissionDag({
  profile,
  request,
  assignment,
  submission,
  contextClosure,
  inventory,
  validateContract,
  compiled,
}) {
  const formBinding = one(
    profile.spec.formBindings,
    (entry) =>
      entry.id === request.spec.bindings.form.id &&
      entry.formDigest === request.spec.bindings.form.digest,
    "SUBMISSION_FORM_BINDING_UNRESOLVED",
    "submission form binding",
  );
  const projectionBinding = one(
    profile.spec.projectionBindings,
    (entry) =>
      entry.id === request.spec.bindings.projection.id &&
      entry.definitionDigest === request.spec.bindings.projection.digest,
    "SUBMISSION_PROJECTION_BINDING_UNRESOLVED",
    "submission projection binding",
  );
  const formDefinition = resolveInventoryResource(
    inventory,
    formBinding.definition,
    "AuthoringFormDefinition",
    "submission form definition",
  );
  const projectionArtifact = resolveInventoryResource(
    inventory,
    assignment.spec.projectionArtifact.reference,
    "ProjectionArtifact",
    "submission projection artifact",
  );
  assertClosedContract(validateContract, formDefinition);
  assertClosedContract(validateContract, projectionArtifact);
  verifyTextAssignmentDag({
    request,
    contextClosure,
    formDefinition,
    projectionBinding,
    projectionArtifact,
    assignment,
    renderProjection(input) {
      const projected = invokeProjector(
        compiled,
        projectionBinding.engine,
        input,
      );
      if (projected.status === "reject") {
        fail(
          "SUBMISSION_PROJECTION_REJECTED",
          "/profile/spec/projectionBindings",
          `Projector ${projectionBinding.engine.id} rejected deterministic Assignment reproduction.`,
        );
      }
      return textContentBytes(projected.content);
    },
  });
  const normalizedValues = validateAuthoringFieldValues({
    formDefinition,
    normalizedValues: submission.spec.normalizedValues,
  });
  if (!same(normalizedValues, submission.spec.normalizedValues)) {
    fail(
      "SUBMISSION_NORMALIZED_VALUES_MISMATCH",
      "/command/submission/spec/normalizedValues",
      "Submission normalized values differ from the exact form authority.",
    );
  }
}

function exactRequestAuthority({
  profile,
  protocol,
  workspace,
  request,
}) {
  const operation = request.spec.operation;
  if (operation.class === "task-submission") {
    const selected = selectNextAuthority({ profile, protocol, workspace });
    if (selected.kind !== "task") {
      fail(
        "SUBMISSION_TASK_NOT_ADMITTED",
        "/command/request/spec/operation",
        "Workspace no longer admits the submitted task.",
      );
    }
    const contextClosure = resolveContextClosure({
      workspace,
      selectors: selected.task.contextSelectors,
      requestInputs: operation.inputs,
    });
    const expected = buildTaskRequestDraft({
      profile,
      protocol,
      workspace,
      task: selected.task,
      transition: selected.transition,
      contextClosure,
      requestInputs: operation.inputs,
    });
    if (!same(expected, request)) {
      fail(
        "SUBMISSION_REQUEST_AUTHORITY_MISMATCH",
        "/command/request",
        "Submitted request differs from the exact current task authority.",
      );
    }
    return {
      authority: selected,
      contextClosure,
      contract: selected.task,
      guards: selected.transition,
      handlerBindingId: selected.binding.handlerBindingId,
    };
  }
  if (operation.class === "revision") {
    const selected = selectRevisionAuthority({
      profile,
      protocol,
      workspace,
      unitId: operation.unit.id,
      eventId: one(
        profile.spec.revisionUnits,
        (unit) => unit.id === operation.unit.id,
        "REVISION_UNIT_UNRESOLVED",
        "request revision unit",
      ).revisionPlans.find(
        (plan) => plan.id === operation.plan.id,
      )?.eventId,
    });
    const contextClosure = resolveContextClosure({
      workspace,
      selectors: selected.normalTask.contextSelectors,
      requestInputs: operation.inputs,
    });
    const expected = buildRevisionRequestDraft({
      profile,
      protocol,
      workspace,
      unit: selected.unit,
      plan: selected.plan,
      normalTask: selected.normalTask,
      contextClosure,
      requestInputs: operation.inputs,
    });
    if (!same(expected, request)) {
      fail(
        "SUBMISSION_REQUEST_AUTHORITY_MISMATCH",
        "/command/request",
        "Submitted request differs from the exact current revision authority.",
      );
    }
    return {
      authority: selected,
      contextClosure,
      contract: selected.unit.assignmentContract,
      revisionPlan: selected.plan,
      handlerBindingId: selected.unit.assignmentContract.handlerBindingId,
    };
  }
  fail(
    "SUBMISSION_REQUEST_CLASS_INVALID",
    "/command/request/spec/operation/class",
    "Submitted request operation class is unsupported.",
  );
}

function nextOperation({
  profile,
  protocol,
  workspace,
  command,
  validateContract,
  setPhase,
}) {
  setPhase("authority");
  const selected = selectNextAuthority({ profile, protocol, workspace });
  if (selected.kind === "wait") return waitResult(selected.state);
  if (selected.kind === "terminal") return terminalResult(selected.state);
  assertRawTaskRequestInputs({
    task: selected.task,
    requestInputs: command.inputs,
  });
  setPhase("context");
  const contextClosure = resolveContextClosure({
    workspace,
    selectors: selected.task.contextSelectors,
    requestInputs: command.inputs,
  });
  setPhase("contract");
  assertClosedContract(validateContract, contextClosure);
  const request = buildTaskRequestDraft({
    profile,
    protocol,
    workspace,
    task: selected.task,
    transition: selected.transition,
    contextClosure,
    requestInputs: command.inputs,
  });
  assertClosedContract(validateContract, request);
  return taskResult({ contextClosure, request });
}

function reviseOperation({
  profile,
  protocol,
  workspace,
  command,
  compiled,
  validateContract,
  setPhase,
}) {
  setPhase("freshness");
  assertCommandBaseFresh(workspace, command.base, "REVISION_BASE_STALE");
  setPhase("authority");
  const selected = selectRevisionAuthority({
    profile,
    protocol,
    workspace,
    unitId: command.unitId,
    eventId: command.eventId,
  });
  assertRawTaskRequestInputs({
    task: selected.normalTask,
    requestInputs: command.inputs,
  });
  setPhase("context");
  const contextClosure = resolveContextClosure({
    workspace,
    selectors: selected.normalTask.contextSelectors,
    requestInputs: command.inputs,
  });
  setPhase("contract");
  assertClosedContract(validateContract, contextClosure);
  setPhase("guard");
  const guardResults = evaluateRevisionSelectionGuard({
    profile,
    protocol,
    plan: selected.plan,
    compiledExecutables: compiled,
    input: semanticCallbackInput({
      phase: "revision-selection",
      profile,
      protocol,
      workspace,
      operation: command,
      contextClosure,
      configuration: selected.plan.authority,
    }),
  });
  const rejection = guardRejection(guardResults);
  if (rejection) return rejectedDomain(rejection.result.issues, "guard");
  setPhase("contract");
  const request = buildRevisionRequestDraft({
    profile,
    protocol,
    workspace,
    unit: selected.unit,
    plan: selected.plan,
    normalTask: selected.normalTask,
    contextClosure,
    requestInputs: command.inputs,
  });
  assertClosedContract(validateContract, request);
  return taskResult({ contextClosure, request });
}

function submitOperation({
  profile,
  protocol,
  workspace,
  command,
  trustedInputs,
  compiled,
  validateContract,
  setPhase,
}) {
  const { request, assignment, submission } = command;
  setPhase("input");
  for (const resource of [request, assignment, submission]) {
    assertClosedContract(validateContract, resource);
  }
  setPhase("freshness");
  assertSubmissionAncestry({ workspace, request, assignment, submission });
  setPhase("authority");
  const selected = exactRequestAuthority({
    profile,
    protocol,
    workspace,
    request,
  });
  if (
    !same(
      request.spec.contextClosure.reference,
      resourceReferenceFrom(selected.contextClosure),
    ) ||
    request.spec.contextClosure.closureDigest !==
      selected.contextClosure.spec.closureDigest
  ) {
    fail(
      "SUBMISSION_CONTEXT_STALE",
      "/command/request/spec/contextClosure",
      "Request context differs from the current manifest-resolved closure.",
    );
  }
  setPhase("identity");
  assertSubmissionDag({
    profile,
    request,
    assignment,
    submission,
    contextClosure: selected.contextClosure,
    inventory: trustedInputs.inventory,
    validateContract,
    compiled,
  });
  const configuration = selected.authority.binding?.authority ??
    selected.authority.plan?.authority;
  setPhase("guard");
  const guardResults = selected.revisionPlan
    ? evaluateRevisionSelectionGuard({
      profile,
      protocol,
      plan: selected.revisionPlan,
      compiledExecutables: compiled,
      input: semanticCallbackInput({
        phase: "submission",
        profile,
        protocol,
        workspace,
        operation: request.spec.operation,
        contextClosure: selected.contextClosure,
        submission,
        normalizedValues: submission.spec.normalizedValues,
        configuration,
      }),
    })
    : evaluateTransitionGuards({
      profile,
      protocol,
      transition: selected.guards,
      compiledExecutables: compiled,
      input: semanticCallbackInput({
        phase: "submission",
        profile,
        protocol,
        workspace,
        operation: request.spec.operation,
        contextClosure: selected.contextClosure,
        submission,
        normalizedValues: submission.spec.normalizedValues,
        configuration,
      }),
    });
  const guardFailure = guardRejection(guardResults);
  if (guardFailure) {
    return rejectedDomain(guardFailure.result.issues, "guard");
  }
  setPhase("handler");
  const binding = handlerBinding(profile, selected.handlerBindingId);
  const handled = invokeHandler(
    compiled,
    binding.handler,
    semanticCallbackInput({
      phase: "submission",
      profile,
      protocol,
      workspace,
      operation: request.spec.operation,
      contextClosure: selected.contextClosure,
      normalizedValues: submission.spec.normalizedValues,
      submission,
      configuration,
    }),
  );
  if (handled.status === "reject") {
    return rejectedDomain(handled.issues, "handler");
  }
  setPhase("mutation");
  preflightAuthoringProducts({
    profile,
    protocol,
    workspace,
    authority: selected.authority,
    products: handled.products,
  });
  setPhase("resource");
  const resourceIssues = validateProducts({
    profile,
    products: handled.products,
    compiled,
  });
  if (resourceIssues) return rejectedDomain(resourceIssues, "resource");
  setPhase("mutation");
  const mutation = planAuthoringMutation({
    profile,
    protocol,
    workspace,
    authority: selected.authority,
    ancestry: { request, assignment, submission },
    products: handled.products,
    externalCouplings: command.externalCouplings,
    inventory: trustedInputs.inventory ?? [],
    validateMutationContract: validateContract,
  });
  setPhase("contract");
  assertClosedContract(validateContract, mutation);
  return mutationResult(mutation);
}

function eventOperation({
  profile,
  protocol,
  workspace,
  command,
  trustedInputs,
  compiled,
  validateContract,
  setPhase,
}) {
  setPhase("freshness");
  assertCommandBaseFresh(workspace, command.base, "EVENT_BASE_STALE");
  setPhase("authority");
  const selected = selectEventAuthority({
    profile,
    protocol,
    workspace,
    eventId: command.eventId,
  });
  const selectors = selected.binding.inputSelectors ?? [];
  assertRawEventInputs(selectors, command.inputs);
  setPhase("context");
  const contextClosure = resolveContextClosure({
    workspace,
    selectors,
    requestInputs: command.inputs,
  });
  setPhase("contract");
  assertClosedContract(validateContract, contextClosure);
  setPhase("guard");
  const guardResults = evaluateTransitionGuards({
    profile,
    protocol,
    transition: selected.transition,
    compiledExecutables: compiled,
    input: semanticCallbackInput({
      phase: "event",
      profile,
      protocol,
      workspace,
      operation: command,
      contextClosure,
      configuration: selected.binding.authority,
    }),
  });
  const guardFailure = guardRejection(guardResults);
  if (guardFailure) {
    return rejectedDomain(guardFailure.result.issues, "guard");
  }
  setPhase("handler");
  const binding = handlerBinding(
    profile,
    selected.binding.handlerBindingId,
  );
  const handled = invokeHandler(
    compiled,
    binding.handler,
    semanticCallbackInput({
      phase: "event",
      profile,
      protocol,
      workspace,
      operation: command,
      contextClosure,
      configuration: selected.binding.authority,
    }),
  );
  if (handled.status === "reject") {
    return rejectedDomain(handled.issues, "handler");
  }

  setPhase("mutation");
  preflightAuthoringProducts({
    profile,
    protocol,
    workspace,
    authority: selected,
    products: handled.products,
  });
  setPhase("resource");
  const resourceIssues = validateProducts({
    profile,
    products: handled.products,
    compiled,
  });
  if (resourceIssues) return rejectedDomain(resourceIssues, "resource");
  setPhase("mutation");
  const mutation = planAuthoringMutation({
    profile,
    protocol,
    workspace,
    authority: selected,
    ancestry: {
      commandDigest: command.commandDigest,
      payloadDigest: command.payloadDigest,
      evidenceDigest: command.evidenceDigest,
      inputs: eventInputsFromClosure(contextClosure),
    },
    products: handled.products,
    externalCouplings: command.externalCouplings,
    inventory: trustedInputs.inventory ?? [],
    validateMutationContract: validateContract,
  });
  setPhase("contract");
  assertClosedContract(validateContract, mutation);
  return mutationResult(mutation);
}

function issueFromError(error, phase) {
  const policy = phasePolicies[phase] ?? phasePolicies.contract;
  const code = (
    typeof error?.code === "string" &&
    eventIdPattern.test(error.code)
  )
    ? error.code
    : "AUTHORING_REDUCER_REJECTED";
  const field = (
    typeof (error?.field ?? error?.issue?.field) === "string" &&
    fieldPathPattern.test(error.field ?? error.issue.field)
  )
    ? (error.field ?? error.issue.field)
    : "";
  const candidateReason = typeof error?.reason === "string"
    ? error.reason
    : (
      typeof error?.code === "string" &&
      typeof error?.message === "string"
        ? error.message
        : "The authoring reducer rejected this operation."
    );
  const reason = (
    candidateReason.isWellFormed() &&
    [...candidateReason].length > 0 &&
    [...candidateReason].length <= 4096
  )
    ? candidateReason
    : "The authoring reducer rejected this operation.";
  return createValidationIssue({
    code,
    field,
    reason,
    boundary: policy.boundary,
    nextAction: policy.nextAction,
    correction: policy.correction,
  });
}

/**
 * Reduce one immutable manifest-driven authoring snapshot without storage,
 * locks, journals, sessions, transport, or commit authority.
 */
export function reduceAuthoring(
  profile,
  protocol,
  workspaceSnapshot,
  commandInput,
  trustedInputSurface,
) {
  let phase = "input";
  try {
    const command = closedCommand(commandInput);
    const trustedInputs = trustedSurface(trustedInputSurface);
    const profileSnapshot = stableValue(profile);
    const protocolSnapshot = stableValue(protocol);
    const workspace = stableValue(workspaceSnapshot);
    const validateContract = trustedInputs.validateContract;
    const setPhase = (nextPhase) => {
      phase = nextPhase;
    };

    for (const resource of [
      profileSnapshot,
      protocolSnapshot,
      workspace,
    ]) {
      assertClosedContract(validateContract, resource);
    }

    phase = "identity";
    assertAuthoringAuthority({
      profile: profileSnapshot,
      protocol: protocolSnapshot,
      workspace,
    });
    assertHostKernel(profileSnapshot, trustedInputs.kernel);
    const compiled = command.class === "next"
      ? undefined
      : compiledExecutables(trustedInputs, profileSnapshot);

    if (command.class === "next") {
      return nextOperation({
        profile: profileSnapshot,
        protocol: protocolSnapshot,
        workspace,
        command,
        validateContract,
        setPhase,
      });
    }
    if (command.class === "revise") {
      return reviseOperation({
        profile: profileSnapshot,
        protocol: protocolSnapshot,
        workspace,
        command,
        compiled,
        validateContract,
        setPhase,
      });
    }
    if (command.class === "submit") {
      return submitOperation({
        profile: profileSnapshot,
        protocol: protocolSnapshot,
        workspace,
        command,
        trustedInputs,
        compiled,
        validateContract,
        setPhase,
      });
    }
    return eventOperation({
      profile: profileSnapshot,
      protocol: protocolSnapshot,
      workspace,
      command,
      trustedInputs,
      compiled,
      validateContract,
      setPhase,
    });
  } catch (error) {
    return rejectedResult([issueFromError(error, phase)]);
  }
}

export const reduce = reduceAuthoring;
