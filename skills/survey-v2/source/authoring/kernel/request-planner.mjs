import { canonicalize, stableValue } from "./canonical.mjs";
import {
  contextClosureDigest,
  requestCoreDigest,
  resourceReferenceFrom,
  resourceSemanticDigest,
} from "./digests.mjs";
import { resolveContextClosure } from "./context-resolver.mjs";
import { assertAuthoringAuthority } from "./manifest-selection.mjs";

export class AuthoringRequestPlannerError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "AuthoringRequestPlannerError";
    this.code = code;
    for (const [key, value] of Object.entries(details)) this[key] = value;
  }
}

function fail(code, message, details) {
  throw new AuthoringRequestPlannerError(code, message, details);
}

function exactValue(left, right) {
  return canonicalize(left) === canonicalize(right);
}

function assertResource(value, kind, label) {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    value.apiVersion !== "authoring.mission-kit/v1alpha1" ||
    value.kind !== kind ||
    typeof value.metadata?.name !== "string" ||
    value.metadata.name.length === 0 ||
    value.spec === null ||
    typeof value.spec !== "object" ||
    Array.isArray(value.spec)
  ) {
    fail(
      "REQUEST_PLANNER_RESOURCE_INVALID",
      `${label} is not one ${kind} resource`,
    );
  }
}

function one(items, predicate, code, label) {
  const matches = items.filter(predicate);
  if (matches.length !== 1) {
    fail(code, `${label} must resolve exactly once`, {
      matchCount: matches.length,
    });
  }
  return matches[0];
}

function sourceStates(transition) {
  return transition.source.mode === "single"
    ? [transition.source.stateId]
    : transition.source.stateIds;
}

function contractBindings(profile, protocol, contract) {
  const schemaBinding = one(
    profile.spec.schemaBindings,
    (entry) => entry.id === contract.submissionSchemaBindingId,
    "REQUEST_SCHEMA_BINDING_AMBIGUOUS",
    "submission schema binding",
  );
  const formBinding = one(
    profile.spec.formBindings,
    (entry) => entry.id === contract.formBindingId,
    "REQUEST_FORM_BINDING_AMBIGUOUS",
    "form binding",
  );
  const handlerBinding = one(
    profile.spec.handlerBindings,
    (entry) => entry.id === contract.handlerBindingId,
    "REQUEST_HANDLER_BINDING_AMBIGUOUS",
    "handler binding",
  );
  const projectionBinding = one(
    profile.spec.projectionBindings,
    (entry) => entry.id === contract.projectionBindingId,
    "REQUEST_PROJECTION_BINDING_AMBIGUOUS",
    "projection binding",
  );
  const validatorSet = one(
    profile.spec.validatorSets,
    (entry) => entry.id === contract.validatorSetId,
    "REQUEST_VALIDATOR_SET_AMBIGUOUS",
    "validator set",
  );
  return {
    submissionContract: {
      schema: stableValue(schemaBinding.schema),
      validatorSet: {
        id: validatorSet.id,
        digest: validatorSet.digest,
      },
      form: {
        id: formBinding.id,
        digest: formBinding.formDigest,
      },
    },
    bindings: {
      kernel: stableValue(profile.spec.kernel),
      profile: {
        id: profile.metadata.name,
        digest: profile.spec.profileDigest,
      },
      protocol: {
        id: protocol.metadata.name,
        digest: resourceSemanticDigest(protocol),
      },
      handler: stableValue(handlerBinding.handler),
      parser: stableValue(formBinding.parser),
      form: {
        id: formBinding.id,
        digest: formBinding.formDigest,
      },
      schema: stableValue(schemaBinding.schema),
      validatorSet: {
        id: validatorSet.id,
        digest: validatorSet.digest,
      },
      projection: {
        id: projectionBinding.id,
        digest: projectionBinding.definitionDigest,
      },
    },
  };
}

function requestBase(workspace) {
  return {
    authoringState: workspace.spec.authoringState,
    semanticRevision: workspace.spec.semanticRevision,
    semanticStateDigest: workspace.spec.integrity.semanticStateDigest,
  };
}

function assertExactContextClosure({
  workspace,
  selectors,
  requestInputs,
  contextClosure,
}) {
  assertResource(contextClosure, "ContextClosure", "context closure");
  if (
    contextClosure.spec.closureDigest !==
      contextClosureDigest(contextClosure)
  ) {
    fail(
      "REQUEST_CONTEXT_CLOSURE_DIGEST_MISMATCH",
      "context closure differs from its canonical closure digest",
    );
  }
  const resolved = resolveContextClosure({
    workspace,
    selectors,
    requestInputs,
  });
  if (!exactValue(resolved, contextClosure)) {
    fail(
      "REQUEST_CONTEXT_CLOSURE_AUTHORITY_MISMATCH",
      "context closure differs from manifest-selected workspace authority",
    );
  }
  return resolved;
}

function closeRequest({
  operation,
  profile,
  protocol,
  workspace,
  contextClosure,
  contract,
}) {
  assertResource(contextClosure, "ContextClosure", "context closure");
  const selected = contractBindings(profile, protocol, contract);
  const request = {
    apiVersion: "authoring.mission-kit/v1alpha1",
    kind: "AuthoringRequest",
    metadata: { name: "pending" },
    spec: {
      requestDigest: `sha256:${"0".repeat(64)}`,
      operation: stableValue(operation),
      base: requestBase(workspace),
      contextClosure: {
        reference: resourceReferenceFrom(contextClosure),
        closureDigest: contextClosure.spec.closureDigest,
      },
      submissionContract: selected.submissionContract,
      bindings: selected.bindings,
    },
  };
  request.spec.requestDigest = requestCoreDigest(request);
  request.metadata.name =
    `request-${request.spec.requestDigest.slice("sha256:".length)}`;
  // Metadata is non-semantic; make the fixed point explicit.
  if (requestCoreDigest(request) !== request.spec.requestDigest) {
    fail(
      "REQUEST_DIGEST_UNSTABLE",
      "request identity changed after deterministic naming",
    );
  }
  return stableValue(request);
}

export function buildTaskRequestDraft({
  profile,
  protocol,
  workspace,
  task,
  transition,
  contextClosure,
  requestInputs = {},
}) {
  assertResource(
    profile,
    "AuthoringProfileManifest",
    "authoring profile",
  );
  assertResource(protocol, "AuthoringProtocol", "authoring protocol");
  assertResource(workspace, "AuthoringWorkspace", "authoring workspace");
  assertAuthoringAuthority({ profile, protocol, workspace });
  const selectedTask = one(
    profile.spec.tasks,
    (entry) =>
      entry.id === task?.id &&
      entry.stateId === workspace.spec.authoringState,
    "REQUEST_TASK_AMBIGUOUS",
    "profile task",
  );
  if (!exactValue(selectedTask, task)) {
    fail(
      "REQUEST_TASK_AUTHORITY_MISMATCH",
      "task body differs from the exact profile task authority",
    );
  }
  const selectedTransition = one(
    protocol.spec.transitions,
    (entry) => entry.id === transition?.id,
    "REQUEST_TRANSITION_AMBIGUOUS",
    "protocol transition",
  );
  if (!exactValue(selectedTransition, transition)) {
    fail(
      "REQUEST_TRANSITION_AUTHORITY_MISMATCH",
      "transition body differs from exact protocol authority",
    );
  }
  if (
    selectedTask.stateId !== workspace.spec.authoringState ||
    !sourceStates(selectedTransition).includes(workspace.spec.authoringState)
  ) {
    fail(
      "REQUEST_TASK_STATE_MISMATCH",
      "task and transition do not originate at the workspace state",
    );
  }
  const state = one(
    protocol.spec.states,
    (entry) => entry.id === workspace.spec.authoringState,
    "REQUEST_STATE_AMBIGUOUS",
    "workspace protocol state",
  );
  if (
    state.class !== "task" ||
    state.taskId !== selectedTask.id
  ) {
    fail(
      "REQUEST_TASK_AUTHORITY_MISMATCH",
      "task differs from the protocol task-state authority",
    );
  }
  const binding = one(
    profile.spec.transitionBindings,
    (entry) => entry.transitionId === selectedTransition.id,
    "REQUEST_TRANSITION_BINDING_AMBIGUOUS",
    "task transition binding",
  );
  if (
    binding.triggerClass !== "task-submission" ||
    binding.taskId !== selectedTask.id ||
    binding.handlerBindingId !== selectedTask.handlerBindingId ||
    binding.mutationFootprint.nextState !== selectedTransition.toState
  ) {
    fail(
      "REQUEST_TRANSITION_AUTHORITY_MISMATCH",
      "task transition differs from manifest authority",
    );
  }
  const selectedClosure = assertExactContextClosure({
    workspace,
    selectors: selectedTask.contextSelectors,
    requestInputs,
    contextClosure,
  });
  return closeRequest({
    operation: {
      class: "task-submission",
      task: {
        id: selectedTask.id,
        stateId: selectedTask.stateId,
        transitionId: selectedTransition.id,
        eventId: selectedTransition.eventId,
      },
      target: stableValue(selectedTask.target),
      inputs: stableValue(requestInputs),
    },
    profile,
    protocol,
    workspace,
    contextClosure: selectedClosure,
    contract: selectedTask,
  });
}

export function buildRevisionRequestDraft({
  profile,
  protocol,
  workspace,
  unit,
  plan,
  normalTask,
  contextClosure,
  requestInputs = {},
}) {
  assertResource(
    profile,
    "AuthoringProfileManifest",
    "authoring profile",
  );
  assertResource(protocol, "AuthoringProtocol", "authoring protocol");
  assertResource(workspace, "AuthoringWorkspace", "authoring workspace");
  assertAuthoringAuthority({ profile, protocol, workspace });
  const selectedUnit = one(
    profile.spec.revisionUnits,
    (entry) => entry.id === unit?.id,
    "REQUEST_REVISION_UNIT_AMBIGUOUS",
    "revision unit",
  );
  if (!exactValue(selectedUnit, unit)) {
    fail(
      "REQUEST_REVISION_AUTHORITY_MISMATCH",
      "revision unit body differs from exact profile authority",
    );
  }
  const selectedPlan = one(
    selectedUnit.revisionPlans,
    (entry) =>
      entry.id === plan?.id &&
      entry.planDigest === plan?.planDigest,
    "REQUEST_REVISION_PLAN_AMBIGUOUS",
    "revision plan",
  );
  if (!exactValue(selectedPlan, plan)) {
    fail(
      "REQUEST_REVISION_AUTHORITY_MISMATCH",
      "revision plan body differs from exact profile authority",
    );
  }
  const selectedNormalTask = one(
    profile.spec.tasks,
    (entry) => entry.id === normalTask?.id,
    "REQUEST_REVISION_NORMAL_TASK_AMBIGUOUS",
    "revision normal task",
  );
  if (
    !exactValue(selectedNormalTask, normalTask) ||
    !selectedPlan.fromStates.includes(workspace.spec.authoringState)
  ) {
    fail(
      "REQUEST_REVISION_AUTHORITY_MISMATCH",
      "revision unit, plan, or normal task differs from profile authority",
    );
  }
  const expectedHeads = selectedUnit.replacementTargets.map((target) => {
    const matches = workspace.spec.activeHeads.filter(
      (entry) => entry.slot === target.slot,
    );
    if (matches.length !== 1) {
      fail(
        "REQUEST_REVISION_HEAD_MISSING",
        `revision target ${target.slot} does not have exactly one active head`,
        { slot: target.slot },
      );
    }
    return stableValue(matches[0]);
  });
  const selectedClosure = assertExactContextClosure({
    workspace,
    selectors: selectedNormalTask.contextSelectors,
    requestInputs,
    contextClosure,
  });
  return closeRequest({
    operation: {
      class: "revision",
      normalTaskId: selectedNormalTask.id,
      unit: {
        id: selectedUnit.id,
        digest: selectedUnit.unitDigest,
      },
      plan: {
        id: selectedPlan.id,
        digest: selectedPlan.planDigest,
      },
      expectedHeads,
      inputs: stableValue(requestInputs),
    },
    profile,
    protocol,
    workspace,
    contextClosure: selectedClosure,
    contract: selectedUnit.assignmentContract,
  });
}
