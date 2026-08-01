import { readJsonFile } from "./atomic-fs.mjs";
import {
  canonicalBytes,
  deepCloneCanonical,
  deepFreeze,
} from "./canonical-json.mjs";
import { HASH_PROFILE_ID, hashCanonical } from "./hash.mjs";
import { IntegrityError, ValidationError } from "./errors.mjs";

const REQUIRED_TRANSITION_FIELDS = [
  "transitionId",
  "machineId",
  "eventType",
  "fromState",
  "toState",
  "creationClass",
  "guardId",
  "actionPipelineId",
  "mutationId",
  "participantPolicyId",
  "idempotencyClass",
  "failureRoute",
  "learningTriggerPolicyId",
];

function values(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") {
    return Object.entries(value).map(([key, item]) => ({
      ...(item && typeof item === "object" ? item : {}),
      __key: key,
    }));
  }
  return [];
}

function parseCompactTransition(machineId, encoded, manifest) {
  const tuple = typeof encoded === "string" ? encoded.split("|") : encoded;
  const columns = manifest.tupleColumns ?? [
    "transitionId",
    "eventType",
    "fromState",
    "toState",
  ];
  if (
    !Array.isArray(tuple) ||
    tuple.length !== columns.length ||
    columns.length !== 4 ||
    columns.some((column) => typeof column !== "string") ||
    tuple.some((item) => typeof item !== "string" || item.length === 0)
  ) {
    throw new ValidationError("Lifecycle transition tuple is invalid", {
      machineId,
      encoded,
    });
  }
  const compact = Object.fromEntries(
    columns.map((column, index) => [column, tuple[index]]),
  );
  for (const required of [
    "transitionId",
    "eventType",
    "fromState",
    "toState",
  ]) {
    if (!Object.hasOwn(compact, required)) {
      throw new ValidationError("Lifecycle tuple columns are unsupported", {
        missingColumn: required,
      });
    }
  }
  const absentCreation = compact.fromState === "[*]";
  const transitionId = compact.transitionId;
  return {
    transitionId,
    machineId,
    eventType: compact.eventType,
    fromState: absentCreation ? "absent" : compact.fromState,
    toState: compact.toState,
    creationClass: absentCreation ? "absent" : "existing",
    guardId: `guard.${transitionId}`,
    actionPipelineId: `action.${transitionId}`,
    mutationId: `mutation.${transitionId}`,
    participantPolicyId: `participants.${transitionId}`,
    idempotencyClass: absentCreation ? "create_once" : "exact_replay",
    failureRoute: `quarantine.${machineId}`,
    learningTriggerPolicyId:
      manifest.learningTriggerPolicyOverrides?.[transitionId] ?? "none",
  };
}

function normalizeMachines(machineSource, manifest) {
  if (
    machineSource &&
    !Array.isArray(machineSource) &&
    typeof machineSource === "object"
  ) {
    return Object.entries(machineSource).map(([machineId, raw]) => {
      if (
        Array.isArray(raw) &&
        raw.every((entry) => typeof entry === "string" || Array.isArray(entry))
      ) {
        return {
          machineId,
          transitions: raw.map((entry) =>
            parseCompactTransition(machineId, entry, manifest),
          ),
        };
      }
      return normalizeMachine({
        ...(raw && typeof raw === "object" ? raw : {}),
        __key: machineId,
      });
    });
  }
  return values(machineSource).map(normalizeMachine);
}

function normalizeMachine(raw) {
  const machineId = raw.machineId ?? raw.id ?? raw.__key;
  if (!machineId) throw new ValidationError("Lifecycle machine is missing machineId");
  return {
    ...raw,
    machineId,
    transitions: values(raw.transitions).map((transition) => ({
      ...transition,
      transitionId: transition.transitionId ?? transition.id ?? transition.__key,
      machineId: transition.machineId ?? machineId,
    })),
  };
}

function normalizePolicy(raw) {
  const participantPolicyId =
    raw.participantPolicyId ?? raw.policyId ?? raw.id ?? raw.__key;
  if (!participantPolicyId) {
    throw new ValidationError("Participant policy is missing its ID");
  }
  return { ...raw, participantPolicyId };
}

function normalizePipeline(raw) {
  const actionPipelineId =
    raw.actionPipelineId ?? raw.pipelineId ?? raw.id ?? raw.__key;
  if (!actionPipelineId) throw new ValidationError("Action pipeline is missing its ID");
  const actions =
    raw.actions ??
    raw.pipeline ??
    raw.actionIds ??
    (raw.actionId ? [{ actionId: raw.actionId, executorAuthorityId: raw.executorAuthorityId }] : []);
  return { ...raw, actionPipelineId, actions };
}

function sameDefinition(left, right) {
  return canonicalBytes(left).equals(canonicalBytes(right));
}

function insertDefinition(map, definition, idField, label) {
  const id = definition[idField];
  const current = map.get(id);
  if (current) {
    if (sameDefinition(current, definition)) return;
    throw new IntegrityError(`Injected ${label} changes canonical lifecycle semantics`, {
      [idField]: id,
    });
  }
  map.set(id, deepFreeze(definition));
}

function canonicalResolutions(manifest, transitions) {
  const policyResolution = manifest.participantPolicyResolution;
  const guardResolution = manifest.guardResolution;
  const pipelineResolution = manifest.actionPipelineResolution;
  const mutationResolution = manifest.mutationResolution;
  if (
    !policyResolution &&
    !guardResolution &&
    !pipelineResolution &&
    !mutationResolution
  ) {
    return {
      participantPolicies: [],
      actionPipelines: [],
      guards: [],
      mutations: [],
    };
  }
  if (manifest.hashProfileId !== HASH_PROFILE_ID) {
    throw new ValidationError("Canonical lifecycle resolution uses an unknown hash profile", {
      actual: manifest.hashProfileId,
      expected: HASH_PROFILE_ID,
    });
  }
  if (
    !policyResolution?.selectors ||
    !policyResolution?.templates ||
    !guardResolution?.requiredInputs ||
    !guardResolution?.evaluationOrder ||
    !pipelineResolution?.requiredOrderedStages ||
    !mutationResolution?.atomicOutputs
  ) {
    throw new ValidationError("Canonical lifecycle resolution blocks are incomplete");
  }

  const participantPolicies = [];
  const actionPipelines = [];
  const guards = [];
  const mutations = [];
  for (const transition of transitions) {
    const templateId =
      policyResolution.transitionOverrides?.[transition.transitionId] ??
      policyResolution.selectors[transition.machineId];
    const template = policyResolution.templates[templateId];
    if (!template) {
      throw new ValidationError("Transition has no canonical participant template", {
        transitionId: transition.transitionId,
        machineId: transition.machineId,
        templateId,
      });
    }
    participantPolicies.push({
      schemaVersion: manifest.schemaVersion,
      hashProfileId: manifest.hashProfileId,
      participantPolicyId: transition.participantPolicyId,
      commandAuthority: deepCloneCanonical(template.commandAuthority),
      guardOwnerId: template.guardOwnerId,
      orderedActionExecutors: deepCloneCanonical(
        template.orderedActionExecutors,
      ),
      requiredAttestationAuthorityIds: [
        ...template.requiredAttestationAuthorityIds,
      ],
    });
    actionPipelines.push({
      actionPipelineId: transition.actionPipelineId,
      pipelineClass: templateId,
      actions: deepCloneCanonical(template.orderedActionExecutors),
      requiredOrderedStages: deepCloneCanonical(
        pipelineResolution.requiredOrderedStages,
      ),
      failureSemantics: pipelineResolution.failureSemantics,
    });
    guards.push({
      guardId: transition.guardId,
      ownerAuthorityId: template.guardOwnerId,
      requiredInputs: [...guardResolution.requiredInputs],
      evaluationOrder: [...guardResolution.evaluationOrder],
    });
    mutations.push({
      mutationId: transition.mutationId,
      atomicOutputs: [...mutationResolution.atomicOutputs],
      replayPolicy: mutationResolution.replayPolicy,
    });
  }
  return { participantPolicies, actionPipelines, guards, mutations };
}

export class LifecycleRegistry {
  static async fromFile(path, options = {}) {
    return new LifecycleRegistry(await readJsonFile(path), {
      ...options,
      sourcePath: path,
    });
  }

  constructor(
    manifest,
    {
      sourcePath = null,
      participantPolicies = [],
      actionPipelines = [],
      guardDefinitions = [],
      mutationDefinitions = [],
    } = {},
  ) {
    this.sourcePath = sourcePath;
    this.manifest = deepCloneCanonical(manifest);
    this.manifestDigest = hashCanonical("lifecycle-manifest/v1", this.manifest);
    const machineSource =
      this.manifest.machines ??
      this.manifest.lifecycles ??
      this.manifest.stateMachines ??
      [];
    const machines = normalizeMachines(machineSource, this.manifest);
    const globalTransitions = values(this.manifest.transitions);
    for (const transition of globalTransitions) {
      const machineId = transition.machineId;
      const machine = machines.find((candidate) => candidate.machineId === machineId);
      if (!machine) {
        throw new ValidationError("Global transition references an unknown machine", {
          transitionId: transition.transitionId ?? transition.id ?? transition.__key,
          machineId,
        });
      }
      machine.transitions.push({
        ...transition,
        transitionId: transition.transitionId ?? transition.id ?? transition.__key,
      });
    }
    this.machines = new Map();
    this.transitions = new Map();
    for (const machine of machines) {
      if (this.machines.has(machine.machineId)) {
        throw new ValidationError("Duplicate lifecycle machine ID", {
          machineId: machine.machineId,
        });
      }
      this.machines.set(machine.machineId, deepFreeze(machine));
      for (const transition of machine.transitions) {
        for (const field of REQUIRED_TRANSITION_FIELDS) {
          if (transition[field] === undefined || transition[field] === null) {
            throw new ValidationError("Transition is missing a required field", {
              transitionId: transition.transitionId,
              field,
            });
          }
        }
        if (transition.machineId !== machine.machineId) {
          throw new ValidationError("Transition machine ID does not match its owner", {
            transitionId: transition.transitionId,
            transitionMachineId: transition.machineId,
            machineId: machine.machineId,
          });
        }
        if (this.transitions.has(transition.transitionId)) {
          throw new ValidationError("Duplicate transition ID", {
            transitionId: transition.transitionId,
          });
        }
        this.transitions.set(transition.transitionId, deepFreeze(transition));
      }
    }
    const resolved = canonicalResolutions(
      this.manifest,
      [...this.transitions.values()],
    );
    this.participantPolicies = new Map();
    for (const policy of resolved.participantPolicies) {
      insertDefinition(
        this.participantPolicies,
        policy,
        "participantPolicyId",
        "participant policy",
      );
    }
    for (const policy of [
      ...values(this.manifest.participantPolicies),
      ...values(participantPolicies),
    ].map(normalizePolicy)) {
      insertDefinition(
        this.participantPolicies,
        policy,
        "participantPolicyId",
        "participant policy",
      );
    }
    this.actionPipelines = new Map();
    for (const pipeline of resolved.actionPipelines) {
      insertDefinition(
        this.actionPipelines,
        pipeline,
        "actionPipelineId",
        "action pipeline",
      );
    }
    for (const pipeline of [
      ...values(this.manifest.actionPipelines),
      ...values(actionPipelines),
    ].map(normalizePipeline)) {
      insertDefinition(
        this.actionPipelines,
        pipeline,
        "actionPipelineId",
        "action pipeline",
      );
    }
    this.guards = new Map();
    for (const guard of resolved.guards) {
      insertDefinition(this.guards, guard, "guardId", "guard");
    }
    for (const guard of values(guardDefinitions)) {
      const guardId = guard.guardId ?? guard.id ?? guard.__key;
      if (!guardId) throw new ValidationError("Guard definition is missing its ID");
      insertDefinition(this.guards, { ...guard, guardId }, "guardId", "guard");
    }
    this.mutations = new Map();
    for (const mutation of resolved.mutations) {
      insertDefinition(this.mutations, mutation, "mutationId", "mutation");
    }
    for (const mutation of values(mutationDefinitions)) {
      const mutationId = mutation.mutationId ?? mutation.id ?? mutation.__key;
      if (!mutationId) {
        throw new ValidationError("Mutation definition is missing its ID");
      }
      insertDefinition(
        this.mutations,
        { ...mutation, mutationId },
        "mutationId",
        "mutation",
      );
    }
    deepFreeze(this.manifest);
  }

  transition(transitionId) {
    const transition = this.transitions.get(transitionId);
    if (!transition) {
      throw new ValidationError("Unknown lifecycle transition", { transitionId });
    }
    return transition;
  }

  machine(machineId) {
    const machine = this.machines.get(machineId);
    if (!machine) throw new ValidationError("Unknown lifecycle machine", { machineId });
    return machine;
  }

  participantPolicy(participantPolicyId) {
    const policy = this.participantPolicies.get(participantPolicyId);
    if (!policy) {
      throw new ValidationError("Unknown participant policy", {
        participantPolicyId,
      });
    }
    return policy;
  }

  participantPolicyDigest(participantPolicyId) {
    return hashCanonical(
      "participant-policy/v1",
      this.participantPolicy(participantPolicyId),
    );
  }

  actionPipeline(actionPipelineId) {
    return (
      this.actionPipelines.get(actionPipelineId) ?? {
        actionPipelineId,
        actions:
          actionPipelineId === "none"
            ? []
            : [{ actionId: actionPipelineId, executorAuthorityId: null }],
      }
    );
  }

  guard(guardId) {
    const guard = this.guards.get(guardId);
    if (!guard) throw new ValidationError("Unknown lifecycle guard", { guardId });
    return guard;
  }

  mutation(mutationId) {
    const mutation = this.mutations.get(mutationId);
    if (!mutation) {
      throw new ValidationError("Unknown lifecycle mutation", { mutationId });
    }
    return mutation;
  }

  validateGraph() {
    const problems = [];
    for (const machine of this.machines.values()) {
      const states = new Set();
      const starts = new Set();
      const exits = new Set();
      for (const transition of machine.transitions) {
        if (transition.fromState === "absent") starts.add(transition.toState);
        else states.add(transition.fromState);
        states.add(transition.toState);
        exits.add(transition.fromState);
      }
      const terminalStates = new Set(machine.terminalStates ?? []);
      for (const state of states) {
        if (!exits.has(state) && !terminalStates.has(state)) {
          problems.push({ machineId: machine.machineId, state, problem: "no_exit" });
        }
      }
      if (starts.size === 0 && machine.initialState) starts.add(machine.initialState);
      const reachable = new Set(starts);
      let changed = true;
      while (changed) {
        changed = false;
        for (const transition of machine.transitions) {
          if (
            (transition.fromState === "absent" || reachable.has(transition.fromState)) &&
            !reachable.has(transition.toState)
          ) {
            reachable.add(transition.toState);
            changed = true;
          }
        }
      }
      for (const state of states) {
        if (!reachable.has(state)) {
          problems.push({ machineId: machine.machineId, state, problem: "unreachable" });
        }
      }
    }
    return problems;
  }

  toJSON() {
    return deepCloneCanonical(this.manifest);
  }
}

export { REQUIRED_TRANSITION_FIELDS };
