import { types } from "node:util";
import { canonicalize, stableValue } from "./canonical.mjs";
import {
  mutationDigest,
  resourceIntegrityDigest,
  resourceReferenceFrom,
  resourceSemanticDigest,
} from "./digests.mjs";
import {
  validateContractSemantics,
  validateTransactionClosureSemantics,
} from "./contract-semantics.mjs";
import { assertAuthoringAuthority } from "./manifest-selection.mjs";

const digestPattern = /^sha256:[0-9a-f]{64}$/u;
const dependencySelectorModes = new Set([
  "context-layer",
  "request-input",
  "active-head",
  "created-slot",
]);
const promiseThen = Promise.prototype.then;

export class AuthoringMutationPlannerError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "AuthoringMutationPlannerError";
    this.code = code;
    for (const [key, value] of Object.entries(details)) this[key] = value;
  }
}

function fail(code, message, details) {
  throw new AuthoringMutationPlannerError(code, message, details);
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function exactKeys(value, keys) {
  return (
    isRecord(value) &&
    Object.keys(value).sort().join("\u0000") ===
      [...keys].sort().join("\u0000")
  );
}

function detached(value, label) {
  try {
    return stableValue(value);
  } catch (error) {
    fail(
      "MUTATION_INPUT_NON_CANONICAL",
      `${label} is not one canonical JSON value: ${error.message}`,
    );
  }
}

function frozen(value) {
  const result = detached(value, "planner result");
  const pending = [result];
  while (pending.length > 0) {
    const current = pending.pop();
    if (current === null || typeof current !== "object") continue;
    for (const child of Object.values(current)) {
      if (child !== null && typeof child === "object") pending.push(child);
    }
    Object.freeze(current);
  }
  return result;
}

function same(left, right) {
  return canonicalize(left) === canonicalize(right);
}

function compareCanonical(left, right) {
  return Buffer.compare(
    Buffer.from(canonicalize(left), "utf8"),
    Buffer.from(canonicalize(right), "utf8"),
  );
}

function assertDigest(value, label) {
  if (typeof value !== "string" || !digestPattern.test(value)) {
    fail(
      "MUTATION_ANCESTRY_INVALID",
      `${label} must be one sha256 digest`,
    );
  }
}

function assertResource(value, kind, label) {
  if (
    !isRecord(value) ||
    value.apiVersion !== "authoring.mission-kit/v1alpha1" ||
    value.kind !== kind ||
    !isRecord(value.metadata) ||
    typeof value.metadata.name !== "string" ||
    value.metadata.name.length === 0 ||
    !isRecord(value.spec)
  ) {
    fail(
      "MUTATION_RESOURCE_INVALID",
      `${label} is not one ${kind} resource`,
    );
  }
}

function assertProductResource(value, label) {
  const allowed = new Set([
    "apiVersion",
    "kind",
    "metadata",
    "spec",
    "status",
    "evidence",
  ]);
  if (
    !isRecord(value) ||
    Object.keys(value).some((key) => !allowed.has(key)) ||
    typeof value.apiVersion !== "string" ||
    value.apiVersion.length === 0 ||
    typeof value.kind !== "string" ||
    value.kind.length === 0 ||
    !isRecord(value.metadata) ||
    typeof value.metadata.name !== "string" ||
    value.metadata.name.length === 0 ||
    !isRecord(value.spec) ||
    (Object.hasOwn(value, "status") && !isRecord(value.status)) ||
    (Object.hasOwn(value, "evidence") && !isRecord(value.evidence))
  ) {
    fail(
      "PRODUCT_RESOURCE_INVALID",
      `${label} is not one closed resource document`,
    );
  }
}

function assertSemanticContract(value, label) {
  let issues;
  try {
    issues = validateContractSemantics(value);
  } catch (error) {
    fail(
      "MUTATION_INPUT_CONTRACT_INVALID",
      `${label} could not be checked against K10 semantics: ${error.message}`,
    );
  }
  if (issues.length > 0) {
    fail(
      "MUTATION_INPUT_CONTRACT_INVALID",
      `${label} fails K10 semantics: ${issues[0].code}`,
      { issue: issues[0] },
    );
  }
}

function exactOne(items, predicate, code, label) {
  const matches = items.filter(predicate);
  if (matches.length !== 1) {
    fail(
      code,
      `${label} must resolve exactly once`,
      { matchCount: matches.length },
    );
  }
  return matches[0];
}

function sourceStates(transition) {
  return transition.source.mode === "single"
    ? [transition.source.stateId]
    : transition.source.stateIds;
}

function referenceKey(reference) {
  return canonicalize(reference);
}

function edgeKey(edge) {
  return canonicalize([edge.from, edge.to, edge.relation]);
}

function resourceIdentityKey(resource) {
  return referenceKey(resourceReferenceFrom(resource));
}

function handlerFor(profile, bindingId) {
  return exactOne(
    profile.spec.handlerBindings,
    (entry) => entry.id === bindingId,
    "MUTATION_HANDLER_AMBIGUOUS",
    `handler binding ${bindingId}`,
  ).handler;
}

function assertSelectedMember(actual, collection, predicate, label) {
  const selected = exactOne(
    collection,
    predicate,
    "MUTATION_AUTHORITY_AMBIGUOUS",
    label,
  );
  if (!same(actual, selected)) {
    fail(
      "MUTATION_AUTHORITY_MISMATCH",
      `${label} differs from manifest or protocol authority`,
    );
  }
  return selected;
}

function normalizeAuthority(profile, protocol, workspace, authority) {
  if (!isRecord(authority) || typeof authority.kind !== "string") {
    fail(
      "MUTATION_AUTHORITY_INVALID",
      "selected authority must be one task, event, or revision selection",
    );
  }
  if (authority.kind === "task") {
    if (
      !exactKeys(
        authority,
        ["kind", "state", "task", "transition", "binding"],
      )
    ) {
      fail(
        "MUTATION_AUTHORITY_INVALID",
        "task authority has fields outside its closed selection",
      );
    }
    const state = assertSelectedMember(
      authority.state,
      protocol.spec.states,
      (entry) => entry.id === workspace.spec.authoringState,
      "task state",
    );
    const task = assertSelectedMember(
      authority.task,
      profile.spec.tasks,
      (entry) =>
        entry.id === state.taskId &&
        entry.stateId === state.id,
      "task",
    );
    const transition = assertSelectedMember(
      authority.transition,
      protocol.spec.transitions,
      (entry) =>
        entry.id === authority.transition?.id &&
        sourceStates(entry).includes(state.id),
      "task transition",
    );
    const binding = assertSelectedMember(
      authority.binding,
      profile.spec.transitionBindings,
      (entry) => entry.transitionId === transition.id,
      "task transition binding",
    );
    if (
      state.class !== "task" ||
      transition.eventId !== authority.transition.eventId ||
      binding.triggerClass !== "task-submission" ||
      binding.taskId !== task.id ||
      binding.handlerBindingId !== task.handlerBindingId ||
      binding.mutationFootprint.nextState !== transition.toState
    ) {
      fail(
        "MUTATION_AUTHORITY_MISMATCH",
        "task selection does not close one manifest-owned transition",
      );
    }
    return {
      kind: "task",
      state,
      task,
      transition,
      binding,
      targets: binding.mutationFootprint.created,
      footprint: binding.mutationFootprint,
      expectedCouplings:
        binding.mutationFootprint.externalCouplings ?? [],
      handler: handlerFor(profile, binding.handlerBindingId),
      edge: {
        transitionId: transition.id,
        fromState: state.id,
        eventId: transition.eventId,
        toState: transition.toState,
      },
      causeAuthority: binding.authority,
    };
  }
  if (authority.kind === "event") {
    if (
      !exactKeys(
        authority,
        ["kind", "state", "transition", "binding"],
      )
    ) {
      fail(
        "MUTATION_AUTHORITY_INVALID",
        "event authority has fields outside its closed selection",
      );
    }
    const state = assertSelectedMember(
      authority.state,
      protocol.spec.states,
      (entry) => entry.id === workspace.spec.authoringState,
      "event state",
    );
    const transition = assertSelectedMember(
      authority.transition,
      protocol.spec.transitions,
      (entry) =>
        entry.id === authority.transition?.id &&
        sourceStates(entry).includes(state.id),
      "event transition",
    );
    const binding = assertSelectedMember(
      authority.binding,
      profile.spec.transitionBindings,
      (entry) => entry.transitionId === transition.id,
      "event transition binding",
    );
    if (
      binding.triggerClass !== "event" ||
      binding.mutationFootprint.nextState !== transition.toState
    ) {
      fail(
        "MUTATION_AUTHORITY_MISMATCH",
        "event selection does not close one manifest-owned transition",
      );
    }
    return {
      kind: "event",
      state,
      transition,
      binding,
      targets: binding.mutationFootprint.created,
      footprint: binding.mutationFootprint,
      expectedCouplings:
        binding.mutationFootprint.externalCouplings ?? [],
      handler: handlerFor(profile, binding.handlerBindingId),
      edge: {
        transitionId: transition.id,
        fromState: state.id,
        eventId: transition.eventId,
        toState: transition.toState,
      },
      causeAuthority: binding.authority,
    };
  }
  if (authority.kind === "revision") {
    if (
      !exactKeys(
        authority,
        [
          "kind",
          "unit",
          "plan",
          "normalBinding",
          "normalTask",
          "expectedHeads",
        ],
      ) ||
      !Array.isArray(authority.expectedHeads)
    ) {
      fail(
        "MUTATION_AUTHORITY_INVALID",
        "revision authority has fields outside its closed selection",
      );
    }
    const unit = assertSelectedMember(
      authority.unit,
      profile.spec.revisionUnits,
      (entry) => entry.id === authority.unit?.id,
      "revision unit",
    );
    const plan = assertSelectedMember(
      authority.plan,
      unit.revisionPlans,
      (entry) => entry.id === authority.plan?.id,
      "revision plan",
    );
    const normalBinding = assertSelectedMember(
      authority.normalBinding,
      profile.spec.transitionBindings,
      (entry) => entry.transitionId === unit.normalTransitionId,
      "revision normal binding",
    );
    const normalTask = assertSelectedMember(
      authority.normalTask,
      profile.spec.tasks,
      (entry) => entry.id === normalBinding.taskId,
      "revision normal task",
    );
    const normalTransition = exactOne(
      protocol.spec.transitions,
      (entry) => entry.id === unit.normalTransitionId,
      "MUTATION_AUTHORITY_AMBIGUOUS",
      "revision normal transition",
    );
    if (
      !plan.fromStates.includes(workspace.spec.authoringState) ||
      normalBinding.triggerClass !== "task-submission" ||
      normalBinding.handlerBindingId !==
        unit.assignmentContract.handlerBindingId ||
      normalBinding.mutationFootprint.nextState !== unit.normalPostcondition ||
      normalTransition.toState !== unit.normalPostcondition ||
      !same(
        normalBinding.mutationFootprint.created,
        unit.replacementTargets,
      )
    ) {
      fail(
        "MUTATION_AUTHORITY_MISMATCH",
        "revision selection conflicts with its normal transition authority",
      );
    }
    const expectedHeads = unit.replacementTargets.map((target) => {
      const current = exactOne(
        workspace.spec.activeHeads,
        (entry) => entry.slot === target.slot,
        "REVISION_HEAD_AMBIGUOUS",
        `revision head ${target.slot}`,
      );
      return current;
    });
    if (!same(authority.expectedHeads, expectedHeads)) {
      fail(
        "REVISION_HEAD_STALE",
        "selected revision heads differ from the current ordered heads",
      );
    }
    return {
      kind: "revision",
      unit,
      plan,
      normalBinding,
      normalTask,
      expectedHeads,
      targets: unit.replacementTargets,
      footprint: normalBinding.mutationFootprint,
      expectedCouplings: plan.externalCouplings,
      handler: handlerFor(
        profile,
        unit.assignmentContract.handlerBindingId,
      ),
      edge: {
        transitionId: plan.transitionId,
        fromState: workspace.spec.authoringState,
        eventId: plan.eventId,
        toState: unit.normalPostcondition,
      },
      causeAuthority: plan.authority,
    };
  }
  fail(
    "MUTATION_AUTHORITY_INVALID",
    `unsupported selected authority kind ${authority.kind}`,
  );
}

function executionFor(profile, protocol, selected) {
  return {
    profile: {
      id: profile.metadata.name,
      digest: profile.spec.profileDigest,
    },
    protocol: {
      id: protocol.metadata.name,
      digest: resourceSemanticDigest(protocol),
    },
    handler: selected.handler,
  };
}

function assertTaskOrRevisionAncestry(
  ancestry,
  selected,
  profile,
  protocol,
  workspace,
) {
  if (
    !exactKeys(ancestry, ["request", "assignment", "submission"])
  ) {
    fail(
      "MUTATION_ANCESTRY_INVALID",
      "task or revision ancestry must contain exactly request, assignment, and submission",
    );
  }
  const { request, assignment, submission } = ancestry;
  assertResource(request, "AuthoringRequest", "request ancestry");
  assertResource(
    assignment,
    "AuthoringAssignment",
    "assignment ancestry",
  );
  assertResource(
    submission,
    "AuthoringSubmission",
    "submission ancestry",
  );
  assertSemanticContract(request, "request ancestry");
  assertSemanticContract(assignment, "assignment ancestry");
  assertSemanticContract(submission, "submission ancestry");
  const expectedBase = {
    authoringState: workspace.spec.authoringState,
    semanticRevision: workspace.spec.semanticRevision,
    semanticStateDigest: workspace.spec.integrity.semanticStateDigest,
  };
  if (!same(request.spec.base, expectedBase)) {
    fail(
      "MUTATION_WORKSPACE_STALE",
      "request base differs from the supplied workspace snapshot",
    );
  }
  if (selected.kind === "task") {
    const operation = request.spec.operation;
    if (
      operation?.class !== "task-submission" ||
      operation.task?.id !== selected.task.id ||
      operation.task?.stateId !== selected.state.id ||
      operation.task?.transitionId !== selected.transition.id ||
      operation.task?.eventId !== selected.transition.eventId ||
      !same(operation.target, selected.task.target)
    ) {
      fail(
        "MUTATION_ANCESTRY_MISMATCH",
        "request task operation differs from selected task authority",
      );
    }
  } else {
    const operation = request.spec.operation;
    const expectedHeads = selected.expectedHeads;
    if (
      operation?.class !== "revision" ||
      operation.normalTaskId !== selected.normalTask.id ||
      operation.unit?.id !== selected.unit.id ||
      operation.unit?.digest !== selected.unit.unitDigest ||
      operation.plan?.id !== selected.plan.id ||
      operation.plan?.digest !== selected.plan.planDigest
    ) {
      fail(
        "MUTATION_ANCESTRY_MISMATCH",
        "request revision operation differs from selected revision authority",
      );
    }
    if (!same(operation.expectedHeads, expectedHeads)) {
      fail(
        "REVISION_HEAD_STALE",
        "request revision heads differ from the supplied workspace snapshot",
      );
    }
  }
  const requestReference = resourceReferenceFrom(request);
  const assignmentReference = resourceReferenceFrom(assignment);
  if (
    !same(assignment.spec.request.reference, requestReference) ||
    assignment.spec.request.requestDigest !== request.spec.requestDigest ||
    assignment.spec.baseSemanticRevision !== workspace.spec.semanticRevision ||
    assignment.spec.baseSemanticStateDigest !==
      workspace.spec.integrity.semanticStateDigest ||
    !same(submission.spec.assignment.reference, assignmentReference) ||
    submission.spec.assignment.assignmentDigest !==
      assignment.spec.assignmentDigest
  ) {
    fail(
      "MUTATION_ANCESTRY_MISMATCH",
      "assignment or submission ancestry differs from its exact predecessor",
    );
  }
  if (
    !same(request.spec.bindings.handler, selected.handler) ||
    request.spec.bindings.profile.id !== profile.metadata.name ||
    request.spec.bindings.profile.digest !== profile.spec.profileDigest ||
    request.spec.bindings.protocol.id !== protocol.metadata.name ||
    request.spec.bindings.protocol.digest !== resourceSemanticDigest(protocol)
  ) {
    fail(
      "MUTATION_ANCESTRY_MISMATCH",
      "request execution pins differ from selected authority",
    );
  }
  return {
    class: "task-submission",
    edge: selected.edge,
    authority: selected.causeAuthority,
    execution: executionFor(profile, protocol, selected),
    assignment: {
      reference: assignmentReference,
      assignmentDigest: assignment.spec.assignmentDigest,
    },
    submission: {
      reference: resourceReferenceFrom(submission),
      normalizedSubmissionDigest:
        submission.spec.normalizedSubmissionDigest,
    },
  };
}

function assertEventAncestry(
  ancestry,
  selected,
  profile,
  protocol,
) {
  if (
    !exactKeys(
      ancestry,
      [
        "commandDigest",
        "payloadDigest",
        "evidenceDigest",
        "inputs",
      ],
    ) ||
    !Array.isArray(ancestry.inputs) ||
    ancestry.inputs.length > 32
  ) {
    fail(
      "MUTATION_ANCESTRY_INVALID",
      "event ancestry must contain exact evidence digests and ordered inputs",
    );
  }
  for (const field of [
    "commandDigest",
    "payloadDigest",
    "evidenceDigest",
  ]) {
    assertDigest(ancestry[field], `event ancestry ${field}`);
  }
  const selectors = selected.binding.inputSelectors;
  if (ancestry.inputs.length !== selectors.length) {
    fail(
      "EVENT_INPUT_AUTHORITY_MISMATCH",
      "event ancestry input count differs from manifest selectors",
    );
  }
  ancestry.inputs.forEach((input, index) => {
    const selector = selectors[index];
    if (
      !exactKeys(
        input,
        ["ordinal", "role", "reference", "integrityDigest"],
      ) ||
      input.ordinal !== selector.ordinal ||
      input.role !== selector.role ||
      !isRecord(input.reference) ||
      input.reference.apiVersion !== selector.resourceType.apiVersion ||
      input.reference.kind !== selector.resourceType.kind
    ) {
      fail(
        "EVENT_INPUT_AUTHORITY_MISMATCH",
        `event input ${index} differs from its ordered selector`,
      );
    }
    assertDigest(input.integrityDigest, `event input ${index} integrity`);
  });
  return {
    class: "event",
    edge: selected.edge,
    authority: selected.causeAuthority,
    execution: executionFor(profile, protocol, selected),
    commandDigest: ancestry.commandDigest,
    payloadDigest: ancestry.payloadDigest,
    evidenceDigest: ancestry.evidenceDigest,
    inputs: ancestry.inputs,
  };
}

function inventoryResources({
  inventory,
  profile,
  protocol,
  workspace,
  ancestry,
}) {
  if (!Array.isArray(inventory) || inventory.length > 32768) {
    fail(
      "MUTATION_INVENTORY_INVALID",
      "transaction inventory must be a bounded resource array",
    );
  }
  const values = [
    ...inventory,
    profile,
    protocol,
    workspace,
    ...(
      Object.hasOwn(ancestry, "request")
        ? [ancestry.request, ancestry.assignment, ancestry.submission]
        : []
    ),
  ];
  const unique = new Map();
  values.forEach((resource, index) => {
    if (
      !isRecord(resource) ||
      typeof resource.apiVersion !== "string" ||
      typeof resource.kind !== "string" ||
      !isRecord(resource.metadata) ||
      typeof resource.metadata.name !== "string" ||
      !isRecord(resource.spec)
    ) {
      fail(
        "MUTATION_INVENTORY_INVALID",
        `inventory member ${index} is not one resource document`,
      );
    }
    const stable = detached(resource, `inventory member ${index}`);
    unique.set(canonicalize(stable), stable);
  });
  return [...unique.values()];
}

function createInventoryIndex(resources, workspace) {
  const index = new Map();
  const add = (resource, label) => {
    assertProductResource(resource, label);
    const key = resourceIdentityKey(resource);
    const bodies = index.get(key) ?? new Map();
    bodies.set(canonicalize(resource), resource);
    index.set(key, bodies);
  };
  resources.forEach((resource, indexValue) =>
    add(resource, `inventory resource ${indexValue}`));
  workspace.spec.resourceVersions.forEach((record, indexValue) =>
    add(
      record.resource,
      `workspace resource version ${indexValue}`,
    ));
  for (const resource of resources) {
    if (resource.kind === "ContextClosure") {
      resource.spec.layers.forEach((layer, indexValue) =>
        add(
          layer.sourceSnapshot,
          `context source snapshot ${indexValue}`,
        ));
    }
  }
  return {
    add,
    resolve(reference, label) {
      const bodies = index.get(referenceKey(reference));
      if (!bodies || bodies.size === 0) {
        fail(
          "DEPENDENCY_SELECTOR_UNRESOLVED",
          `${label} does not resolve in the exact inventory`,
        );
      }
      if (bodies.size !== 1) {
        fail(
          "DEPENDENCY_SELECTOR_AMBIGUOUS",
          `${label} resolves to conflicting immutable bodies`,
          { bodyCount: bodies.size },
        );
      }
      return [...bodies.values()][0];
    },
  };
}

function contextClosureFor(request, resources) {
  const matches = resources.filter((resource) => (
    resource.kind === "ContextClosure" &&
    same(resourceReferenceFrom(resource), request.spec.contextClosure.reference)
  ));
  if (matches.length !== 1) {
    fail(
      "DEPENDENCY_SELECTOR_UNRESOLVED",
      "request context closure does not resolve exactly once in inventory",
      { matchCount: matches.length },
    );
  }
  if (
    matches[0].spec.closureDigest !==
      request.spec.contextClosure.closureDigest
  ) {
    fail(
      "DEPENDENCY_SELECTOR_UNRESOLVED",
      "request context closure digest differs from its selected resource",
    );
  }
  assertSemanticContract(matches[0], "request context closure");
  return matches[0];
}

function assertCandidateOrder(candidates, targets) {
  const targetOrder = new Map(
    targets.map((target, index) => [target.slot, index]),
  );
  let priorTarget = -1;
  let priorReference;
  let priorSlot;
  for (const candidate of candidates) {
    const targetIndex = targetOrder.get(candidate.slot);
    if (targetIndex < priorTarget) {
      fail(
        "PRODUCT_ORDER_INVALID",
        "product candidates do not follow manifest target order",
      );
    }
    if (
      candidate.slot === priorSlot &&
      compareCanonical(candidate.reference, priorReference) <= 0
    ) {
      fail(
        "PRODUCT_ORDER_INVALID",
        "product candidates within one slot are not in strict canonical reference order",
      );
    }
    priorTarget = targetIndex;
    priorReference = candidate.reference;
    priorSlot = candidate.slot;
  }
}

function normalizeCandidates(products, selected) {
  if (!Array.isArray(products) || products.length > 256) {
    fail(
      "PRODUCT_CANDIDATE_INVALID",
      "handler products must be a bounded ordered array",
    );
  }
  const targets = selected.targets;
  const targetBySlot = new Map(
    targets.map((target) => [target.slot, target]),
  );
  const candidates = products.map((product, index) => {
    if (
      !exactKeys(product, ["slot", "resource", "dependencies"]) ||
      typeof product.slot !== "string" ||
      !Array.isArray(product.dependencies) ||
      product.dependencies.length > 4096
    ) {
      fail(
        "PRODUCT_CANDIDATE_INVALID",
        `product candidate ${index} must contain exactly slot, resource, and dependencies`,
      );
    }
    assertProductResource(product.resource, `product ${index} resource`);
    const target = targetBySlot.get(product.slot);
    if (!target) {
      fail(
        selected.kind === "revision"
          ? "REVISION_GROUP_MISMATCH"
          : "PRODUCT_SLOT_UNDECLARED",
        `product candidate ${index} uses undeclared slot ${product.slot}`,
      );
    }
    if (
      product.resource.apiVersion !== target.resourceType.apiVersion ||
      product.resource.kind !== target.resourceType.kind
    ) {
      fail(
        "PRODUCT_TYPE_MISMATCH",
        `product candidate ${index} differs from target resource type`,
      );
    }
    return {
      slot: product.slot,
      resource: product.resource,
      dependencies: product.dependencies,
      reference: resourceReferenceFrom(product.resource),
      integrityDigest: resourceIntegrityDigest(product.resource),
    };
  });
  const references = new Set();
  candidates.forEach((candidate) => {
    const key = referenceKey(candidate.reference);
    if (references.has(key)) {
      fail(
        "PRODUCT_DUPLICATE",
        "handler products contain a duplicate created-resource identity",
      );
    }
    references.add(key);
  });
  if (selected.kind === "revision") {
    const slots = candidates.map((candidate) => candidate.slot);
    const expected = targets.map((target) => target.slot);
    if (!same(slots, expected)) {
      fail(
        "REVISION_GROUP_MISMATCH",
        "revision products must exactly cover the ordered replacement group",
      );
    }
  }
  for (const target of targets) {
    const count = candidates.filter(
      (candidate) => candidate.slot === target.slot,
    ).length;
    if (count < target.cardinality.min || count > target.cardinality.max) {
      fail(
        "PRODUCT_CARDINALITY_MISMATCH",
        `product slot ${target.slot} contains ${count} candidates outside ${target.cardinality.min}..${target.cardinality.max}`,
        { slot: target.slot, count },
      );
    }
  }
  assertCandidateOrder(candidates, targets);
  return candidates;
}

function assertReferenceShape(reference, label) {
  if (
    !exactKeys(
      reference,
      ["apiVersion", "kind", "name", "semanticDigest"],
    ) ||
    typeof reference.apiVersion !== "string" ||
    typeof reference.kind !== "string" ||
    typeof reference.name !== "string" ||
    !digestPattern.test(reference.semanticDigest ?? "")
  ) {
    fail(
      "DEPENDENCY_SELECTOR_UNRESOLVED",
      `${label} is not one exact resource reference`,
    );
  }
}

function assertDependencySelectorSyntax(selector) {
  if (!isRecord(selector) || !dependencySelectorModes.has(selector.mode)) {
    fail(
      "DEPENDENCY_SELECTOR_INVALID",
      "dependency selector mode is not closed",
    );
  }
  if (
    selector.mode === "context-layer" &&
    (
      !exactKeys(selector, ["mode", "ordinal"]) ||
      !Number.isInteger(selector.ordinal) ||
      selector.ordinal < 1
    )
  ) {
    fail(
      "DEPENDENCY_SELECTOR_INVALID",
      "context-layer selector must name one positive layer ordinal",
    );
  }
  if (
    selector.mode === "request-input" &&
    (
      !exactKeys(selector, ["mode", "inputKey"]) ||
      typeof selector.inputKey !== "string"
    )
  ) {
    fail(
      "DEPENDENCY_SELECTOR_INVALID",
      "request-input selector must name exactly one input key",
    );
  }
  if (
    ["active-head", "created-slot"].includes(selector.mode) &&
    (
      !exactKeys(selector, ["mode", "slot"]) ||
      typeof selector.slot !== "string"
    )
  ) {
    fail(
      "DEPENDENCY_SELECTOR_INVALID",
      `${selector.mode} selector must name exactly one slot`,
    );
  }
}

function assertProductDependencySyntax(candidates, selected) {
  const relations = new Set(selected.footprint.dependencyRelations);
  candidates.forEach((candidate, candidateIndex) => {
    candidate.dependencies.forEach((dependency, dependencyIndex) => {
      if (!exactKeys(dependency, ["relation", "selector"])) {
        fail(
          "DEPENDENCY_INVALID",
          `dependency ${candidateIndex}/${dependencyIndex} must contain exactly relation and selector`,
        );
      }
      if (!relations.has(dependency.relation)) {
        fail(
          "DEPENDENCY_RELATION_UNDECLARED",
          `dependency relation ${String(dependency.relation)} is outside the mutation footprint`,
        );
      }
      assertDependencySelectorSyntax(dependency.selector);
    });
  });
}

function resolveDependencySelector({
  selector,
  request,
  contextClosure,
  workspace,
  candidates,
  inventoryIndex,
}) {
  assertDependencySelectorSyntax(selector);
  let reference;
  let label;
  if (selector.mode === "context-layer") {
    if (
      !exactKeys(selector, ["mode", "ordinal"]) ||
      !Number.isInteger(selector.ordinal) ||
      selector.ordinal < 1 ||
      !contextClosure
    ) {
      fail(
        "DEPENDENCY_SELECTOR_INVALID",
        "context-layer selector must name one positive layer ordinal",
      );
    }
    const layers = contextClosure.spec.layers.filter(
      (layer) => layer.ordinal === selector.ordinal,
    );
    if (layers.length !== 1) {
      fail(
        "DEPENDENCY_SELECTOR_UNRESOLVED",
        `context layer ${selector.ordinal} does not resolve exactly once`,
      );
    }
    reference = layers[0].sourceReference;
    label = `context layer ${selector.ordinal}`;
  } else if (selector.mode === "request-input") {
    if (
      !exactKeys(selector, ["mode", "inputKey"]) ||
      typeof selector.inputKey !== "string" ||
      !request ||
      !Object.hasOwn(request.spec.operation.inputs, selector.inputKey)
    ) {
      fail(
        "DEPENDENCY_SELECTOR_UNRESOLVED",
        "request-input selector does not resolve one declared input",
      );
    }
    reference = request.spec.operation.inputs[selector.inputKey];
    label = `request input ${selector.inputKey}`;
  } else if (selector.mode === "active-head") {
    if (
      !exactKeys(selector, ["mode", "slot"]) ||
      typeof selector.slot !== "string"
    ) {
      fail(
        "DEPENDENCY_SELECTOR_INVALID",
        "active-head selector must name exactly one slot",
      );
    }
    const heads = workspace.spec.activeHeads.filter(
      (head) => head.slot === selector.slot,
    );
    if (heads.length !== 1) {
      fail(
        "DEPENDENCY_SELECTOR_UNRESOLVED",
        `active head ${selector.slot} does not resolve exactly once`,
        { matchCount: heads.length },
      );
    }
    reference = heads[0].reference;
    label = `active head ${selector.slot}`;
  } else {
    if (
      !exactKeys(selector, ["mode", "slot"]) ||
      typeof selector.slot !== "string"
    ) {
      fail(
        "DEPENDENCY_SELECTOR_INVALID",
        "created-slot selector must name exactly one slot",
      );
    }
    const created = candidates.filter(
      (candidate) => candidate.slot === selector.slot,
    );
    if (created.length !== 1) {
      fail(
        created.length === 0
          ? "DEPENDENCY_SELECTOR_UNRESOLVED"
          : "DEPENDENCY_SELECTOR_AMBIGUOUS",
        `created slot ${selector.slot} does not resolve exactly one candidate`,
        { matchCount: created.length },
      );
    }
    reference = created[0].reference;
    label = `created slot ${selector.slot}`;
  }
  assertReferenceShape(reference, label);
  inventoryIndex.resolve(reference, label);
  return reference;
}

function buildCreatedDependencyEdges({
  candidates,
  selected,
  request,
  contextClosure,
  workspace,
  inventoryIndex,
}) {
  assertProductDependencySyntax(candidates, selected);
  const relationOrder = new Map(
    selected.footprint.dependencyRelations.map(
      (relation, index) => [relation, index],
    ),
  );
  const edges = [];
  const allEdgeKeys = new Set();
  candidates.forEach((candidate, candidateIndex) => {
    let prior;
    for (
      const [dependencyIndex, dependency] of
      candidate.dependencies.entries()
    ) {
      if (!exactKeys(dependency, ["relation", "selector"])) {
        fail(
          "DEPENDENCY_INVALID",
          `dependency ${candidateIndex}/${dependencyIndex} must contain exactly relation and selector`,
        );
      }
      const relationIndex = relationOrder.get(dependency.relation);
      if (relationIndex === undefined) {
        fail(
          "DEPENDENCY_RELATION_UNDECLARED",
          `dependency relation ${String(dependency.relation)} is outside the mutation footprint`,
        );
      }
      const destination = resolveDependencySelector({
        selector: dependency.selector,
        request,
        contextClosure,
        workspace,
        candidates,
        inventoryIndex,
      });
      const orderKey = { relationIndex, destination };
      if (
        prior &&
        (
          relationIndex < prior.relationIndex ||
          (
            relationIndex === prior.relationIndex &&
            compareCanonical(destination, prior.destination) <= 0
          )
        )
      ) {
        fail(
          "DEPENDENCY_ORDER_INVALID",
          "candidate dependencies do not follow manifest relation then canonical reference order",
        );
      }
      prior = orderKey;
      const edge = {
        from: candidate.reference,
        to: destination,
        relation: dependency.relation,
      };
      const key = edgeKey(edge);
      if (allEdgeKeys.has(key)) {
        fail(
          "DEPENDENCY_DUPLICATE",
          "handler products declare a duplicate dependency edge",
        );
      }
      allEdgeKeys.add(key);
      edges.push(edge);
    }
  });
  return edges;
}

/**
 * Validate the complete handler product group against its selected manifest
 * authority without invoking a host contract or profile executable.
 */
export function preflightAuthoringProducts({
  profile: profileInput,
  protocol: protocolInput,
  workspace: workspaceInput,
  authority: authorityInput,
  products: productsInput,
} = {}) {
  const profile = detached(profileInput, "authoring profile");
  const protocol = detached(protocolInput, "authoring protocol");
  const workspace = detached(workspaceInput, "authoring workspace");
  const authority = detached(authorityInput, "selected authority");
  const products = detached(productsInput, "handler products");
  assertResource(
    profile,
    "AuthoringProfileManifest",
    "authoring profile",
  );
  assertResource(protocol, "AuthoringProtocol", "authoring protocol");
  assertResource(workspace, "AuthoringWorkspace", "authoring workspace");
  try {
    assertAuthoringAuthority({ profile, protocol, workspace });
  } catch (error) {
    fail(
      "MUTATION_AUTHORITY_INVALID",
      `profile, protocol, or workspace authority is invalid: ${error.message}`,
      { causeCode: error.code },
    );
  }
  const selected = normalizeAuthority(
    profile,
    protocol,
    workspace,
    authority,
  );
  const candidates = normalizeCandidates(products, selected);
  assertProductDependencySyntax(candidates, selected);
  return frozen(candidates);
}

function headFor(workspace, slot, { required = false } = {}) {
  const heads = workspace.spec.activeHeads.filter(
    (head) => head.slot === slot,
  );
  if (heads.length > 1 || (required && heads.length !== 1)) {
    fail(
      "ACTIVE_HEAD_AMBIGUOUS",
      `active head ${slot} does not resolve exactly once`,
      { matchCount: heads.length },
    );
  }
  return heads[0];
}

function buildActiveHeadChanges(selected, candidates, workspace) {
  const changes = [];
  for (const slot of selected.footprint.activeHeadSlots) {
    const created = candidates.filter(
      (candidate) => candidate.slot === slot,
    );
    if (created.length > 1) {
      fail(
        "ACTIVE_HEAD_AMBIGUOUS",
        `created slot ${slot} cannot select one active head`,
        { matchCount: created.length },
      );
    }
    if (created.length === 0) continue;
    const before = headFor(workspace, slot)?.reference ?? null;
    const after = created[0].reference;
    if (same(before, after)) {
      fail(
        "ACTIVE_HEAD_UNCHANGED",
        `active head ${slot} would not change`,
      );
    }
    changes.push({ slot, before, after });
  }
  return changes;
}

function appendSuperseded(records, seen, slot, reference) {
  if (!reference) return;
  const key = referenceKey(reference);
  if (!seen.has(key)) {
    records.push({ slot, reference });
    seen.add(key);
  }
}

function buildSupersession(selected, workspace) {
  const records = [];
  const seen = new Set();
  const revisionRoots = new Set();
  if (selected.kind === "revision") {
    selected.expectedHeads.forEach((head) => {
      appendSuperseded(records, seen, head.slot, head.reference);
      revisionRoots.add(referenceKey(head.reference));
    });
  }
  for (const slot of selected.footprint.supersededSlots) {
    const head = headFor(workspace, slot);
    appendSuperseded(records, seen, slot, head?.reference);
  }
  if (selected.kind === "revision") {
    const relations = new Set(
      selected.unit.descendantClosure.dependencyRelations,
    );
    const candidates = selected.unit.descendantClosure.invalidatedSlots
      .map((slot) => headFor(workspace, slot))
      .filter(Boolean);
    const reachable = new Set(revisionRoots);
    let changed = true;
    while (changed) {
      changed = false;
      for (const edge of workspace.spec.dependencyEdges) {
        const fromKey = referenceKey(edge.from);
        if (
          relations.has(edge.relation) &&
          reachable.has(referenceKey(edge.to)) &&
          !reachable.has(fromKey)
        ) {
          reachable.add(fromKey);
          changed = true;
        }
      }
    }
    for (const descendant of candidates) {
      if (reachable.has(referenceKey(descendant.reference))) {
        appendSuperseded(
          records,
          seen,
          descendant.slot,
          descendant.reference,
        );
      }
    }
  }
  const supersessionRelations = selected.kind === "revision"
    ? [
      ...selected.unit.descendantClosure.dependencyRelations,
      ...selected.footprint.dependencyRelations.filter(
        (relation) =>
          !selected.unit.descendantClosure.dependencyRelations.includes(
            relation,
          ),
      ),
    ]
    : selected.footprint.dependencyRelations;
  const allowedRelations = new Map(
    supersessionRelations.map(
      (relation, index) => [relation, index],
    ),
  );
  const supersededEdges = workspace.spec.dependencyEdges.filter(
    (edge) => seen.has(referenceKey(edge.from)),
  );
  for (const edge of supersededEdges) {
    if (!allowedRelations.has(edge.relation)) {
      fail(
        "SUPERSESSION_RELATION_UNDECLARED",
        `superseded dependency relation ${edge.relation} is outside the mutation footprint`,
      );
    }
  }
  supersededEdges.sort((left, right) => {
    const relationDifference =
      allowedRelations.get(left.relation) -
      allowedRelations.get(right.relation);
    return relationDifference ||
      compareCanonical([left.from, left.to], [right.from, right.to]);
  });
  const edgeKeys = new Set();
  for (const edge of supersededEdges) {
    const key = edgeKey(edge);
    if (edgeKeys.has(key)) {
      fail(
        "SUPERSESSION_EDGE_DUPLICATE",
        "workspace contains a duplicate superseded dependency edge",
      );
    }
    edgeKeys.add(key);
  }
  return {
    resources: records.map((record) => record.reference),
    edges: supersededEdges,
  };
}

function buildHandoffs(selected, changes, workspace) {
  return selected.footprint.handoffSlots.flatMap((slot) => {
    const changed = changes.find((change) => change.slot === slot);
    const reference =
      changed?.after ?? headFor(workspace, slot)?.reference;
    return reference ? [{ slot, reference }] : [];
  });
}

function resolveExternalProtocol(
  profile,
  machineId,
  resources,
) {
  const machine = exactOne(
    profile.spec.machineBindings,
    (binding) => binding.machineId === machineId,
    "EXTERNAL_MACHINE_AMBIGUOUS",
    `external machine ${machineId}`,
  );
  const protocols = resources.filter((resource) => (
    resource.kind === "AuthoringProtocol" &&
    resource.metadata.name === machine.protocol.id &&
    resourceSemanticDigest(resource) === machine.protocol.digest
  ));
  if (protocols.length !== 1) {
    fail(
      "EXTERNAL_PROTOCOL_UNRESOLVED",
      `external machine ${machineId} does not resolve one pinned protocol`,
      { matchCount: protocols.length },
    );
  }
  assertSemanticContract(
    protocols[0],
    `external protocol ${machine.protocol.id}`,
  );
  return protocols[0];
}

function buildExternalCouplings(
  selected,
  supplied,
  profile,
  resources,
) {
  if (!Array.isArray(supplied) || supplied.length > 2) {
    fail(
      "EXTERNAL_COUPLING_INVALID",
      "trusted external couplings must be a bounded ordered array",
    );
  }
  if (supplied.length !== selected.expectedCouplings.length) {
    fail(
      "EXTERNAL_COUPLING_MISMATCH",
      "trusted coupling count differs from manifest authority",
    );
  }
  return supplied.map((coupling, index) => {
    if (
      !exactKeys(
        coupling,
        [
          "machineId",
          "transitionId",
          "fromState",
          "eventId",
          "toState",
          "beforeStateDigest",
          "afterStateDigest",
        ],
      )
    ) {
      fail(
        "EXTERNAL_COUPLING_INVALID",
        `external coupling ${index} has fields outside its closed detail`,
      );
    }
    const expected = selected.expectedCouplings[index];
    if (
      coupling.machineId !== expected.machineId ||
      coupling.transitionId !== expected.transitionId
    ) {
      fail(
        "EXTERNAL_COUPLING_MISMATCH",
        `external coupling ${index} widens, drops, or reorders manifest authority`,
      );
    }
    assertDigest(
      coupling.beforeStateDigest,
      `external coupling ${index} before state`,
    );
    assertDigest(
      coupling.afterStateDigest,
      `external coupling ${index} after state`,
    );
    const machineProtocol = resolveExternalProtocol(
      profile,
      coupling.machineId,
      resources,
    );
    const transition = exactOne(
      machineProtocol.spec.transitions,
      (entry) => entry.id === coupling.transitionId,
      "EXTERNAL_EDGE_AMBIGUOUS",
      `external edge ${coupling.machineId}/${coupling.transitionId}`,
    );
    if (
      !sourceStates(transition).includes(coupling.fromState) ||
      coupling.eventId !== transition.eventId ||
      coupling.toState !== transition.toState
    ) {
      fail(
        "EXTERNAL_EDGE_MISMATCH",
        `external coupling ${index} differs from its pinned protocol edge`,
      );
    }
    return coupling;
  });
}

function validateEventInputs(selected, cause, workspace, inventoryIndex) {
  if (selected.kind !== "event") return;
  selected.binding.inputSelectors.forEach((selector, index) => {
    const input = cause.inputs[index];
    if (selector.selection.mode === "active-head") {
      const head = headFor(workspace, selector.selection.slot, {
        required: true,
      });
      if (!same(input.reference, head.reference)) {
        fail(
          "EVENT_INPUT_AUTHORITY_MISMATCH",
          `event input ${index} differs from selected active head`,
        );
      }
    }
    const resource = inventoryIndex.resolve(
      input.reference,
      `event input ${index}`,
    );
    if (resourceIntegrityDigest(resource) !== input.integrityDigest) {
      fail(
        "EVENT_INPUT_INTEGRITY_MISMATCH",
        `event input ${index} integrity differs from inventory`,
      );
    }
  });
}

function validateConstructedMutation(
  mutation,
  validateMutationContract,
  transactionInventory,
  workspace,
  selectedKind,
) {
  if (typeof validateMutationContract !== "function") {
    fail(
      "MUTATION_CONTRACT_VALIDATOR_REQUIRED",
      "mutation planning requires one synchronous closed-contract validator",
    );
  }
  if (types.isAsyncFunction(validateMutationContract)) {
    fail(
      "MUTATION_CONTRACT_INVALID",
      "mutation contract validation cannot use a native AsyncFunction",
    );
  }
  let valid;
  try {
    valid = validateMutationContract(frozen(mutation));
  } catch {
    fail(
      "MUTATION_CONTRACT_INVALID",
      "constructed mutation failed its host-trusted closed contract",
    );
  }
  if (valid !== null && types.isPromise(valid)) {
    Reflect.apply(promiseThen, valid, [undefined, () => {}]);
    fail(
      "MUTATION_CONTRACT_INVALID",
      "constructed mutation received an asynchronous contract result",
    );
  }
  if (valid !== true) {
    fail(
      "MUTATION_CONTRACT_INVALID",
      "constructed mutation did not receive one synchronous positive contract result",
    );
  }
  const semanticIssues = validateContractSemantics(mutation);
  if (semanticIssues.length > 0) {
    fail(
      "MUTATION_SEMANTICS_INVALID",
      `constructed mutation fails K10 semantics: ${semanticIssues[0].code}`,
      { issue: semanticIssues[0] },
    );
  }
  let closureIssues = validateTransactionClosureSemantics(
    [...transactionInventory, mutation],
    { roots: [mutation, workspace] },
  );
  /*
   * K10's generic footprint checks know only normal-transition
   * `supersededSlots` and dependency relations. A revision has an additional,
   * independently sealed authority source: replacementTargets plus the
   * ordered slots and relations in descendantClosure. The planner derives and
   * confines that exact set above, so those two normal-only diagnostics are
   * inapplicable to a revision while every other K10 closure diagnostic
   * remains binding.
   */
  if (selectedKind === "revision") {
    closureIssues = closureIssues.filter(
      (candidate) =>
        ![
          "MUTATION_SUPERSESSION_FOOTPRINT_MISMATCH",
          "MUTATION_DEPENDENCY_FOOTPRINT_MISMATCH",
        ].includes(candidate.code),
    );
  }
  if (closureIssues.length > 0) {
    fail(
      "MUTATION_TRANSACTION_CLOSURE_INVALID",
      `constructed mutation fails K10 transaction closure: ${closureIssues[0].code}`,
      { issue: closureIssues[0] },
    );
  }
}

/**
 * Construct one complete AuthoringMutation from weak handler products.
 *
 * `authority` is exactly a task, event, or revision value returned by
 * manifest-selection.mjs. Task and revision ancestry is exactly
 * `{request, assignment, submission}`; event ancestry is exactly
 * `{commandDigest, payloadDigest, evidenceDigest, inputs}`.
 *
 * A ProductCandidate is exactly `{slot, resource, dependencies}`. Each
 * dependency is `{relation, selector}` and its selector is exactly one of:
 * `{mode:"context-layer", ordinal}`, `{mode:"request-input", inputKey}`,
 * `{mode:"active-head", slot}`, or `{mode:"created-slot", slot}`.
 *
 * The function is synchronous, performs no persistence, and returns a deeply
 * frozen detached mutation. The injected validator must synchronously return
 * the literal boolean `true` for the completed AuthoringMutation.
 */
export function planAuthoringMutation({
  profile: profileInput,
  protocol: protocolInput,
  workspace: workspaceInput,
  authority: authorityInput,
  ancestry: ancestryInput,
  products: productsInput,
  externalCouplings: couplingInput = [],
  inventory: inventoryInput = [],
  validateMutationContract,
} = {}) {
  const profile = detached(profileInput, "authoring profile");
  const protocol = detached(protocolInput, "authoring protocol");
  const workspace = detached(workspaceInput, "authoring workspace");
  const authority = detached(authorityInput, "selected authority");
  const ancestry = detached(ancestryInput, "mutation ancestry");
  const products = detached(productsInput, "handler products");
  const externalCouplings = detached(
    couplingInput,
    "trusted external couplings",
  );
  const inventory = detached(inventoryInput, "transaction inventory");
  assertResource(
    profile,
    "AuthoringProfileManifest",
    "authoring profile",
  );
  assertResource(protocol, "AuthoringProtocol", "authoring protocol");
  assertResource(workspace, "AuthoringWorkspace", "authoring workspace");
  try {
    assertAuthoringAuthority({ profile, protocol, workspace });
  } catch (error) {
    fail(
      "MUTATION_AUTHORITY_INVALID",
      `profile, protocol, or workspace authority is invalid: ${error.message}`,
      { causeCode: error.code },
    );
  }
  const selected = normalizeAuthority(
    profile,
    protocol,
    workspace,
    authority,
  );
  const cause = selected.kind === "event"
    ? assertEventAncestry(
      ancestry,
      selected,
      profile,
      protocol,
    )
    : assertTaskOrRevisionAncestry(
      ancestry,
      selected,
      profile,
      protocol,
      workspace,
    );
  const transactionInventory = inventoryResources({
    inventory,
    profile,
    protocol,
    workspace,
    ancestry,
  });
  const inventoryIndex = createInventoryIndex(
    transactionInventory,
    workspace,
  );
  validateEventInputs(selected, cause, workspace, inventoryIndex);
  const candidates = normalizeCandidates(products, selected);
  candidates.forEach((candidate, index) =>
    inventoryIndex.add(candidate.resource, `created product ${index}`));
  const request = Object.hasOwn(ancestry, "request")
    ? ancestry.request
    : undefined;
  const contextClosure = request
    ? contextClosureFor(request, transactionInventory)
    : undefined;
  const createdDependencyEdges = buildCreatedDependencyEdges({
    candidates,
    selected,
    request,
    contextClosure,
    workspace,
    inventoryIndex,
  });
  const activeHeadChanges = buildActiveHeadChanges(
    selected,
    candidates,
    workspace,
  );
  const supersession = buildSupersession(selected, workspace);
  const handoffProducts = buildHandoffs(
    selected,
    activeHeadChanges,
    workspace,
  );
  const trustedCouplings = buildExternalCouplings(
    selected,
    externalCouplings,
    profile,
    transactionInventory,
  );
  const mutation = {
    apiVersion: "authoring.mission-kit/v1alpha1",
    kind: "AuthoringMutation",
    metadata: { name: "pending" },
    spec: {
      mutationDigest: `sha256:${"0".repeat(64)}`,
      expected: {
        authoringState: workspace.spec.authoringState,
        semanticRevision: workspace.spec.semanticRevision,
        semanticStateDigest:
          workspace.spec.integrity.semanticStateDigest,
      },
      cause,
      createdResources: candidates.map((candidate) => ({
        slot: candidate.slot,
        reference: candidate.reference,
        integrityDigest: candidate.integrityDigest,
        resource: candidate.resource,
      })),
      activeHeadChanges,
      supersededResources: supersession.resources,
      dependencyEdges: {
        created: createdDependencyEdges,
        superseded: supersession.edges,
      },
      handoffProducts,
      nextAuthoringState: selected.edge.toState,
      externalCouplings: trustedCouplings,
    },
  };
  mutation.spec.mutationDigest = mutationDigest(mutation);
  mutation.metadata.name =
    `mutation-${mutation.spec.mutationDigest.slice("sha256:".length)}`;
  if (
    mutationDigest(mutation) !== mutation.spec.mutationDigest ||
    mutation.metadata.name !==
      `mutation-${mutation.spec.mutationDigest.slice("sha256:".length)}`
  ) {
    fail(
      "MUTATION_DIGEST_UNSTABLE",
      "mutation identity changed after deterministic naming",
    );
  }
  validateConstructedMutation(
    mutation,
    validateMutationContract,
    transactionInventory,
    workspace,
    selected.kind,
  );
  return frozen(mutation);
}
