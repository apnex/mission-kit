import { canonicalize, stableValue } from "./canonical.mjs";
import {
  profileManifestDigest,
  resourceReferenceFrom,
  resourceSemanticDigest,
  workspaceIntegrityDigest,
  workspaceSemanticStateDigest,
} from "./digests.mjs";
import { validateContractSemantics } from "./contract-semantics.mjs";
import { invokeGuard } from "./executable-registry.mjs";

export class AuthoringManifestSelectionError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "AuthoringManifestSelectionError";
    this.code = code;
    for (const [key, value] of Object.entries(details)) this[key] = value;
  }
}

function fail(code, message, details) {
  throw new AuthoringManifestSelectionError(code, message, details);
}

function frozen(value) {
  const result = stableValue(value);
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

function sourceStates(transition) {
  return transition.source.mode === "single"
    ? [transition.source.stateId]
    : transition.source.stateIds;
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
      "AUTHORITY_RESOURCE_INVALID",
      `${label} is not one ${kind} resource`,
    );
  }
}

function exactOne(matches, missingCode, ambiguousCode, label) {
  if (matches.length === 0) {
    fail(missingCode, `${label} does not resolve`);
  }
  if (matches.length !== 1) {
    fail(
      ambiguousCode,
      `${label} resolves more than once`,
      { matchCount: matches.length },
    );
  }
  return matches[0];
}

function authoritativeTransition(protocol, transition) {
  if (
    transition === null ||
    typeof transition !== "object" ||
    Array.isArray(transition) ||
    typeof transition.id !== "string"
  ) {
    fail(
      "AUTHORING_TRANSITION_INVALID",
      "guard evaluation requires one selected transition identity",
    );
  }
  const authoritative = exactOne(
    protocol.spec.transitions.filter(
      (entry) => entry.id === transition.id,
    ),
    "AUTHORING_TRANSITION_MISSING",
    "AUTHORING_TRANSITION_AMBIGUOUS",
    `protocol transition ${transition.id}`,
  );
  if (!same(authoritative, transition)) {
    fail(
      "AUTHORING_TRANSITION_AUTHORITY_MISMATCH",
      `transition ${transition.id} differs from protocol authority`,
    );
  }
  return authoritative;
}

function authoritativeRevisionPlan(profile, plan) {
  if (
    plan === null ||
    typeof plan !== "object" ||
    Array.isArray(plan) ||
    typeof plan.id !== "string" ||
    typeof plan.planDigest !== "string"
  ) {
    fail(
      "AUTHORING_REVISION_PLAN_INVALID",
      "revision guard evaluation requires one selected plan identity",
    );
  }
  const authoritative = exactOne(
    profile.spec.revisionUnits.flatMap(
      (unit) => unit.revisionPlans.filter(
        (entry) =>
          entry.id === plan.id &&
          entry.planDigest === plan.planDigest,
      ),
    ),
    "AUTHORING_REVISION_PLAN_MISSING",
    "AUTHORING_REVISION_PLAN_AMBIGUOUS",
    `revision plan ${plan.id}`,
  );
  if (!same(authoritative, plan)) {
    fail(
      "AUTHORING_REVISION_PLAN_AUTHORITY_MISMATCH",
      `revision plan ${plan.id} differs from profile authority`,
    );
  }
  return authoritative;
}

/**
 * Recheck the immutable profile/protocol/workspace authority before any guard
 * or handler can run. K13 repeats workspace freshness under its writer lock.
 */
export function assertAuthoringAuthority({ profile, protocol, workspace }) {
  assertResource(
    profile,
    "AuthoringProfileManifest",
    "authoring profile",
  );
  assertResource(protocol, "AuthoringProtocol", "authoring protocol");
  assertResource(workspace, "AuthoringWorkspace", "authoring workspace");
  for (const [label, resource] of [
    ["profile", profile],
    ["protocol", protocol],
    ["workspace", workspace],
  ]) {
    const issues = validateContractSemantics(resource);
    if (issues.length > 0) {
      fail(
        "AUTHORITY_SEMANTICS_INVALID",
        `${label} fails its closed semantic contract: ${issues[0].code}`,
        { issue: issues[0] },
      );
    }
  }
  const profileReference = resourceReferenceFrom(profile);
  const protocolReference = resourceReferenceFrom(protocol);
  if (
    profile.spec.profileDigest !== profileManifestDigest(profile) ||
    !same(profile.spec.protocol, protocolReference) ||
    !same(workspace.spec.profile.reference, profileReference) ||
    workspace.spec.profile.profileDigest !== profile.spec.profileDigest ||
    !same(workspace.spec.protocol.reference, protocolReference) ||
    workspace.spec.protocol.protocolDigest !==
      resourceSemanticDigest(protocol) ||
    workspace.spec.integrity.semanticStateDigest !==
      workspaceSemanticStateDigest(workspace) ||
    workspace.spec.integrity.workspaceIntegrityDigest !==
      workspaceIntegrityDigest(workspace)
  ) {
    fail(
      "AUTHORITY_IDENTITY_MISMATCH",
      "profile, protocol, or workspace identity differs from its exact authority",
    );
  }
  return true;
}

function stateAuthority({ profile, protocol, workspace }) {
  assertAuthoringAuthority({ profile, protocol, workspace });
  return exactOne(
    protocol.spec.states.filter(
      (entry) => entry.id === workspace.spec.authoringState,
    ),
    "AUTHORING_STATE_MISSING",
    "AUTHORING_STATE_AMBIGUOUS",
    "workspace authoring state",
  );
}

function assertTransitionExecutionAvailable(profile, transitionId) {
  const closure = profile.spec.executionClosure;
  if (
    closure !== undefined &&
    !closure.transitionIds.includes(transitionId)
  ) {
    fail(
      "PROFILE_EXECUTION_TRANSITION_UNAVAILABLE",
      `transition ${transitionId} is outside execution closure ${closure.id}`,
      {
        executionClosureId: closure.id,
        transitionId,
      },
    );
  }
}

function assertRevisionExecutionAvailable(profile, revisionPlanId) {
  const closure = profile.spec.executionClosure;
  if (
    closure !== undefined &&
    !closure.revisionPlanIds.includes(revisionPlanId)
  ) {
    fail(
      "PROFILE_EXECUTION_REVISION_UNAVAILABLE",
      `revision plan ${revisionPlanId} is outside execution closure ${closure.id}`,
      {
        executionClosureId: closure.id,
        revisionPlanId,
      },
    );
  }
}

export function selectNextAuthority({ profile, protocol, workspace }) {
  const state = stateAuthority({ profile, protocol, workspace });
  if (state.class === "wait") {
    return frozen({ kind: "wait", state });
  }
  if (state.class === "terminal") {
    return frozen({ kind: "terminal", state });
  }
  if (state.class !== "task" || typeof state.taskId !== "string") {
    fail(
      "AUTHORING_STATE_CLASS_INVALID",
      "authoring state does not have a closed task, wait, or terminal class",
    );
  }
  const task = exactOne(
    profile.spec.tasks.filter(
      (entry) =>
        entry.id === state.taskId &&
        entry.stateId === state.id,
    ),
    "AUTHORING_TASK_MISSING",
    "AUTHORING_TASK_AMBIGUOUS",
    "profile task for current state",
  );
  const candidates = protocol.spec.transitions.flatMap((transition) => {
    if (!sourceStates(transition).includes(state.id)) return [];
    const bindings = profile.spec.transitionBindings.filter(
      (binding) =>
        binding.transitionId === transition.id &&
        binding.triggerClass === "task-submission" &&
        binding.taskId === task.id,
    );
    return bindings.map((binding) => ({ binding, transition }));
  });
  const selected = exactOne(
    candidates,
    "AUTHORING_TASK_TRANSITION_MISSING",
    "AUTHORING_TASK_TRANSITION_AMBIGUOUS",
    "task-submission transition for current state",
  );
  if (
    selected.binding.handlerBindingId !== task.handlerBindingId ||
    selected.binding.mutationFootprint.nextState !==
      selected.transition.toState
  ) {
    fail(
      "AUTHORING_TASK_TRANSITION_MISMATCH",
      "selected task edge conflicts with task or mutation authority",
    );
  }
  assertTransitionExecutionAvailable(
    profile,
    selected.transition.id,
  );
  return frozen({
    kind: "task",
    state,
    task,
    transition: selected.transition,
    binding: selected.binding,
  });
}

export function selectEventAuthority({
  profile,
  protocol,
  workspace,
  eventId,
}) {
  const state = stateAuthority({ profile, protocol, workspace });
  const candidates = protocol.spec.transitions.flatMap((transition) => {
    if (
      transition.eventId !== eventId ||
      !sourceStates(transition).includes(state.id)
    ) {
      return [];
    }
    const bindings = profile.spec.transitionBindings.filter(
      (binding) =>
        binding.transitionId === transition.id &&
        binding.triggerClass === "event",
    );
    return bindings.map((binding) => ({ binding, transition }));
  });
  const selected = exactOne(
    candidates,
    "AUTHORING_EVENT_TRANSITION_MISSING",
    "AUTHORING_EVENT_TRANSITION_AMBIGUOUS",
    "event transition for current state",
  );
  if (
    selected.binding.mutationFootprint.nextState !==
      selected.transition.toState
  ) {
    fail(
      "AUTHORING_EVENT_TRANSITION_MISMATCH",
      "selected event edge conflicts with mutation authority",
    );
  }
  assertTransitionExecutionAvailable(
    profile,
    selected.transition.id,
  );
  return frozen({
    kind: "event",
    state,
    transition: selected.transition,
    binding: selected.binding,
  });
}

export function selectRevisionAuthority({
  profile,
  protocol,
  workspace,
  unitId,
  eventId,
}) {
  stateAuthority({ profile, protocol, workspace });
  const unit = exactOne(
    profile.spec.revisionUnits.filter((entry) => entry.id === unitId),
    "AUTHORING_REVISION_UNIT_MISSING",
    "AUTHORING_REVISION_UNIT_AMBIGUOUS",
    "revision unit",
  );
  const plans = unit.revisionPlans.filter(
    (entry) =>
      entry.eventId === eventId &&
      entry.fromStates.includes(workspace.spec.authoringState),
  );
  const plan = exactOne(
    plans,
    "AUTHORING_REVISION_PLAN_MISSING",
    "AUTHORING_REVISION_PLAN_AMBIGUOUS",
    "revision plan for current state and event",
  );
  assertRevisionExecutionAvailable(profile, plan.id);
  const normalBinding = exactOne(
    profile.spec.transitionBindings.filter(
      (entry) => entry.transitionId === unit.normalTransitionId,
    ),
    "AUTHORING_REVISION_NORMAL_BINDING_MISSING",
    "AUTHORING_REVISION_NORMAL_BINDING_AMBIGUOUS",
    "revision normal transition binding",
  );
  const normalTask = exactOne(
    profile.spec.tasks.filter(
      (entry) => entry.id === normalBinding.taskId,
    ),
    "AUTHORING_REVISION_NORMAL_TASK_MISSING",
    "AUTHORING_REVISION_NORMAL_TASK_AMBIGUOUS",
    "revision normal task",
  );
  const expectedHeads = unit.replacementTargets.map((target) => {
    const head = exactOne(
      workspace.spec.activeHeads.filter(
        (entry) => entry.slot === target.slot,
      ),
      "AUTHORING_REVISION_HEAD_MISSING",
      "AUTHORING_REVISION_HEAD_AMBIGUOUS",
      `revision active head ${target.slot}`,
    );
    return head;
  });
  return frozen({
    kind: "revision",
    unit,
    plan,
    normalBinding,
    normalTask,
    expectedHeads,
  });
}

export function evaluateTransitionGuards({
  profile,
  protocol,
  transition,
  compiledExecutables,
  input,
}) {
  const selectedTransition = authoritativeTransition(protocol, transition);
  return evaluateGuardIds({
    profile,
    protocol,
    guardIds: selectedTransition.guardIds,
    compiledExecutables,
    input,
  });
}

function evaluateGuardIds({
  profile,
  protocol,
  guardIds,
  compiledExecutables,
  input,
}) {
  const results = [];
  for (const guardId of guardIds) {
    const guard = exactOne(
      profile.spec.guardBindings.filter(
        (entry) => entry.guardId === guardId,
      ),
      "AUTHORING_GUARD_BINDING_MISSING",
      "AUTHORING_GUARD_BINDING_AMBIGUOUS",
      `guard binding ${guardId}`,
    );
    if (!protocol.spec.guards.some((entry) => entry.id === guardId)) {
      fail(
        "AUTHORING_GUARD_AUTHORITY_MISMATCH",
        `guard ${guardId} is absent from protocol authority`,
      );
    }
    const result = invokeGuard(
      compiledExecutables,
      guard.handler,
      {
        ...stableValue(input),
        guardId,
      },
    );
    results.push({ guardId, result });
    if (result.status === "reject") break;
  }
  return frozen(results);
}

export function evaluateRevisionSelectionGuard({
  profile,
  protocol,
  plan,
  compiledExecutables,
  input,
}) {
  const selectedPlan = authoritativeRevisionPlan(profile, plan);
  return evaluateGuardIds({
    profile,
    protocol,
    guardIds: [selectedPlan.selectionGuardId],
    compiledExecutables,
    input,
  });
}
