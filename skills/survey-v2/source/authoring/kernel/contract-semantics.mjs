import { canonicalize } from "./canonical.mjs";
import {
  assignmentDigest,
  blankViewDigest,
  commitReceiptDigest,
  contextSelectorDigest,
  contextClosureDigest,
  formDefinitionDigest,
  journalRecordDigest,
  lifecycleRuleDigest,
  mutationDigest,
  normalizedSubmissionDigest,
  profileManifestDigest,
  projectionArtifactDigest,
  projectionOutputDigest,
  rawEvidenceDigest,
  requestCoreDigest,
  revisionPlanDigest,
  revisionUnitDigest,
  resourceIntegrityDigest,
  resourceSemanticDigest,
  sourceSnapshotDigest,
  workspaceIntegrityDigest,
  workspaceSemanticStateDigest
} from "./digests.mjs";

function issue(code, field, reason) {
  return Object.freeze({ code, field, reason });
}

function entries(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? Object.entries(value)
    : [];
}

const MAX_SEMANTIC_DEPTH = 128;
const MAX_SEMANTIC_NODES = 100000;

function traversalBoundIssues(value) {
  const pending = [{ depth: 0, value }];
  let nodes = 0;
  while (pending.length > 0) {
    const current = pending.pop();
    nodes += 1;
    if (
      nodes > MAX_SEMANTIC_NODES ||
      current.depth > MAX_SEMANTIC_DEPTH
    ) {
      return [issue(
        "SEMANTIC_TRAVERSAL_BOUND_EXCEEDED",
        "",
        "Contract exceeds the bounded semantic traversal budget."
      )];
    }
    if (Array.isArray(current.value)) {
      for (const item of current.value) {
        pending.push({ depth: current.depth + 1, value: item });
      }
    } else {
      for (const [, item] of entries(current.value)) {
        pending.push({ depth: current.depth + 1, value: item });
      }
    }
  }
  return [];
}

function walk(value, field, visit) {
  const pending = [{ field, value }];
  while (pending.length > 0) {
    const current = pending.pop();
    visit(current.value, current.field);
    if (Array.isArray(current.value)) {
      for (let index = current.value.length - 1; index >= 0; index -= 1) {
        pending.push({
          field: `${current.field}/${index}`,
          value: current.value[index]
        });
      }
    } else {
      const childEntries = entries(current.value);
      for (let index = childEntries.length - 1; index >= 0; index -= 1) {
        const [key, item] = childEntries[index];
        const escaped = key.replaceAll("~", "~0").replaceAll("/", "~1");
        pending.push({
          field: `${current.field}/${escaped}`,
          value: item
        });
      }
    }
  }
}

function decodedBytes(content) {
  return Buffer.from(content.data, "base64");
}

function exactByteIssues(value) {
  const issues = [];
  walk(value, "", (candidate, field) => {
    if (
      !candidate ||
      typeof candidate !== "object" ||
      Array.isArray(candidate) ||
      candidate.encoding !== "base64" ||
      !Object.hasOwn(candidate, "mediaType") ||
      !Object.hasOwn(candidate, "byteLength") ||
      !Object.hasOwn(candidate, "data")
    ) return;
    const bytes = decodedBytes(candidate);
    if (bytes.toString("base64") !== candidate.data) {
      issues.push(issue(
        "EXACT_BYTES_NON_CANONICAL_BASE64",
        `${field}/data`,
        "Data is not the canonical base64 representation of its decoded bytes."
      ));
    } else if (bytes.byteLength !== candidate.byteLength) {
      issues.push(issue(
        "EXACT_BYTES_LENGTH_MISMATCH",
        `${field}/byteLength`,
        "Decoded byte length does not equal byteLength."
      ));
    }
  });
  return issues;
}

function cardinalityIssues(value) {
  const issues = [];
  walk(value, "", (candidate, field) => {
    if (
      !candidate ||
      typeof candidate !== "object" ||
      Array.isArray(candidate) ||
      Object.keys(candidate).length !== 2 ||
      !Object.hasOwn(candidate, "min") ||
      !Object.hasOwn(candidate, "max")
    ) return;
    if (candidate.min > candidate.max) {
      issues.push(issue(
        "CARDINALITY_INVERTED",
        field,
        "Minimum cardinality exceeds maximum cardinality."
      ));
    }
  });
  return issues;
}

function lifecycleConfigurationIssues(selector, field, code) {
  if (
    selector?.lifecycleRule?.mode === "workspace-resource-version" &&
    selector.requiredLifecycleState !== "frozen"
  ) {
    return [issue(
      code,
      `${field}/requiredLifecycleState`,
      "A workspace resource version is intrinsically immutable and therefore proves only the frozen lifecycle state."
    )];
  }
  return [];
}

function duplicateIssues(items, field, identity, label) {
  const issues = [];
  const seen = new Set();
  items.forEach((item, index) => {
    const id = identity(item);
    if (seen.has(id)) {
      issues.push(issue(
        `${label}_DUPLICATE`,
        `${field}/${index}`,
        `Duplicate ${label.toLowerCase()} ${String(id)}.`
      ));
    }
    seen.add(id);
  });
  return issues;
}

function referenceIdentity(reference) {
  return [
    reference.apiVersion,
    reference.kind,
    reference.name,
    reference.semanticDigest
  ].join("\u0000");
}

function ordinalIssues(items, field, label) {
  const issues = [];
  items.forEach((item, index) => {
    if (item.ordinal !== index + 1) {
      issues.push(issue(
        `${label}_ORDER_INVALID`,
        `${field}/${index}/ordinal`,
        `${label} ordinals must be contiguous and match array order.`
      ));
    }
  });
  return issues;
}

function transitionSourceStates(transition) {
  return transition.source.mode === "single"
    ? [transition.source.stateId]
    : transition.source.stateIds;
}

function protocolIssues(value) {
  if (value.kind !== "AuthoringProtocol") return [];
  const issues = [];
  const { states, events, guards, transitions, initialState } = value.spec;
  issues.push(
    ...duplicateIssues(states, "/spec/states", (item) => item.id, "STATE_ID"),
    ...duplicateIssues(events, "/spec/events", (item) => item.id, "EVENT_ID"),
    ...duplicateIssues(guards, "/spec/guards", (item) => item.id, "GUARD_ID"),
    ...duplicateIssues(
      transitions,
      "/spec/transitions",
      (item) => item.id,
      "TRANSITION_ID"
    ),
    ...duplicateIssues(
      states.filter((item) => item.class === "task"),
      "/spec/states",
      (item) => item.taskId,
      "TASK_STATE_TASK_ID"
    )
  );
  const stateIds = new Set(states.map((item) => item.id));
  const eventIds = new Set(events.map((item) => item.id));
  const guardIds = new Set(guards.map((item) => item.id));
  if (!stateIds.has(initialState)) {
    issues.push(issue(
      "INITIAL_STATE_UNRESOLVED",
      "/spec/initialState",
      "Initial state does not resolve."
    ));
  }
  states.forEach((state, index) => {
    if (state.class === "task" && !Object.hasOwn(state, "taskId")) {
      issues.push(issue(
        "TASK_BINDING_REQUIRED",
        `/spec/states/${index}/taskId`,
        "A task state requires taskId."
      ));
    }
    if (state.class !== "task" && Object.hasOwn(state, "taskId")) {
      issues.push(issue(
        "TASK_BINDING_FORBIDDEN",
        `/spec/states/${index}/taskId`,
        "Only a task state may carry taskId."
      ));
    }
  });
  const outbound = new Map(states.map((state) => [state.id, []]));
  const concreteEdges = new Map();
  transitions.forEach((transition, index) => {
    const sourceStates = transitionSourceStates(transition);
    if (
      transition.source.mode === "set" &&
      !sameValue(sourceStates, [...sourceStates].sort())
    ) {
      issues.push(issue(
        "SOURCE_SET_ORDER_INVALID",
        `/spec/transitions/${index}/source/stateIds`,
        "Source-set state IDs must be in canonical lexical order."
      ));
    }
    sourceStates.forEach((sourceState, sourceIndex) => {
      const sourceField = transition.source.mode === "single"
        ? `/spec/transitions/${index}/source/stateId`
        : `/spec/transitions/${index}/source/stateIds/${sourceIndex}`;
      if (!stateIds.has(sourceState)) {
        issues.push(issue(
          "TRANSITION_SOURCE_UNRESOLVED",
          sourceField,
          "Transition source does not resolve."
        ));
      } else {
        outbound.get(sourceState).push(transition.toState);
      }
      const edgeKey = `${sourceState}\u0000${transition.eventId}`;
      if (concreteEdges.has(edgeKey)) {
        issues.push(issue(
          "PROTOCOL_EDGE_DUPLICATE",
          sourceField,
          "Two transition families claim the same source-state event edge."
        ));
      } else {
        concreteEdges.set(edgeKey, transition.id);
      }
    });
    if (!stateIds.has(transition.toState)) {
      issues.push(issue(
        "TRANSITION_TARGET_UNRESOLVED",
        `/spec/transitions/${index}/toState`,
        "Transition target does not resolve."
      ));
    }
    if (!eventIds.has(transition.eventId)) {
      issues.push(issue(
        "TRANSITION_EVENT_UNRESOLVED",
        `/spec/transitions/${index}/eventId`,
        "Transition event does not resolve."
      ));
    }
    transition.guardIds.forEach((guardId, guardIndex) => {
      if (!guardIds.has(guardId)) {
        issues.push(issue(
          "TRANSITION_GUARD_UNRESOLVED",
          `/spec/transitions/${index}/guardIds/${guardIndex}`,
          "Transition guard does not resolve."
        ));
      }
    });
  });
  states.forEach((state, index) => {
    const exits = outbound.get(state.id) ?? [];
    if (state.class !== "terminal" && exits.length === 0) {
      issues.push(issue(
        "NONTERMINAL_WITHOUT_EXIT",
        `/spec/states/${index}`,
        "Every nonterminal state requires an exit."
      ));
    }
    if (state.class === "terminal" && exits.length > 0) {
      issues.push(issue(
        "TERMINAL_HAS_EXIT",
        `/spec/states/${index}`,
        "A terminal state cannot have an exit."
      ));
    }
  });
  if (stateIds.has(initialState)) {
    const reached = new Set([initialState]);
    const pending = [initialState];
    while (pending.length > 0) {
      const stateId = pending.shift();
      for (const target of outbound.get(stateId) ?? []) {
        if (stateIds.has(target) && !reached.has(target)) {
          reached.add(target);
          pending.push(target);
        }
      }
    }
    states.forEach((state, index) => {
      if (!reached.has(state.id)) {
        issues.push(issue(
          "STATE_UNREACHABLE",
          `/spec/states/${index}`,
          "State is not reachable from initialState."
        ));
      }
    });
  }
  return issues;
}

function profileIssues(value) {
  if (value.kind !== "AuthoringProfileManifest") return [];
  const issues = [];
  const collections = [
    ["schemaBindings", value.spec.schemaBindings],
    ["formBindings", value.spec.formBindings],
    ["handlerBindings", value.spec.handlerBindings],
    ["projectionBindings", value.spec.projectionBindings],
    ["validatorSets", value.spec.validatorSets],
    ["tasks", value.spec.tasks]
  ];
  for (const [field, items] of collections) {
    issues.push(...duplicateIssues(
      items,
      `/spec/${field}`,
      (item) => item.id,
      `${field.toUpperCase()}_ID`
    ));
  }
  issues.push(...duplicateIssues(
    value.spec.transitionBindings,
    "/spec/transitionBindings",
    (item) => item.transitionId,
    "TRANSITION_BINDING_ID"
  ));
  issues.push(...duplicateIssues(
    value.spec.tasks,
    "/spec/tasks",
    (item) => item.stateId,
    "TASK_STATE_ID"
  ));
  issues.push(
    ...duplicateIssues(
      value.spec.guardBindings,
      "/spec/guardBindings",
      (item) => item.guardId,
      "GUARD_BINDING_ID"
    ),
    ...duplicateIssues(
      value.spec.revisionUnits,
      "/spec/revisionUnits",
      (item) => item.id,
      "REVISION_UNIT_ID"
    ),
    ...duplicateIssues(
      value.spec.revisionUnits,
      "/spec/revisionUnits",
      (item) => item.normalTransitionId,
      "REVISION_NORMAL_TRANSITION"
    ),
    ...duplicateIssues(
      value.spec.revisionUnits.flatMap((unit) => (
        unit.replacementTargets.map((target) => ({
          unitId: unit.id,
          slot: target.slot
        }))
      )),
      "/spec/revisionUnits",
      (item) => item.slot,
      "REVISION_TARGET_OWNER"
    ),
    ...duplicateIssues(
      value.spec.machineBindings,
      "/spec/machineBindings",
      (item) => item.machineId,
      "MACHINE_BINDING_ID"
    ),
    ...duplicateIssues(
      value.spec.tasks.flatMap((task) => task.contextSelectors),
      "/spec/tasks",
      (item) => item.id,
      "CONTEXT_SELECTOR_ID"
    )
  );
  const ids = Object.fromEntries(
    collections.map(([field, items]) => [
      field,
      new Set(items.map((item) => item.id))
    ])
  );
  value.spec.tasks.forEach((task, index) => {
    const bindings = [
      ["submissionSchemaBindingId", "schemaBindings"],
      ["formBindingId", "formBindings"],
      ["handlerBindingId", "handlerBindings"],
      ["projectionBindingId", "projectionBindings"],
      ["validatorSetId", "validatorSets"]
    ];
    for (const [field, collection] of bindings) {
      if (!ids[collection].has(task[field])) {
        issues.push(issue(
          "TASK_BINDING_UNRESOLVED",
          `/spec/tasks/${index}/${field}`,
          "Task binding does not resolve within the manifest."
        ));
      }
    }
    issues.push(...ordinalIssues(
      task.contextSelectors,
      `/spec/tasks/${index}/contextSelectors`,
      "CONTEXT_SELECTOR"
    ));
    task.contextSelectors.forEach((selector, selectorIndex) => {
      issues.push(...lifecycleConfigurationIssues(
        selector,
        `/spec/tasks/${index}/contextSelectors/${selectorIndex}`,
        "CONTEXT_LIFECYCLE_RULE_INVALID"
      ));
    });
  });
  value.spec.transitionBindings.forEach((binding, index) => {
    if (!ids.handlerBindings.has(binding.handlerBindingId)) {
      issues.push(issue(
        "TRANSITION_HANDLER_UNRESOLVED",
        `/spec/transitionBindings/${index}/handlerBindingId`,
        "Transition handler does not resolve."
      ));
    }
    if (binding.triggerClass === "task-submission") {
      if (!ids.tasks.has(binding.taskId)) {
        issues.push(issue(
          "TRANSITION_TASK_UNRESOLVED",
          `/spec/transitionBindings/${index}/taskId`,
          "Transition task does not resolve."
        ));
      }
      const task = value.spec.tasks.find((item) => item.id === binding.taskId);
      if (task && task.handlerBindingId !== binding.handlerBindingId) {
        issues.push(issue(
          "TRANSITION_HANDLER_TASK_MISMATCH",
          `/spec/transitionBindings/${index}/handlerBindingId`,
          "Transition handler differs from the handler pinned by its task."
        ));
      }
    } else {
      issues.push(
        ...ordinalIssues(
          binding.inputSelectors,
          `/spec/transitionBindings/${index}/inputSelectors`,
          "EVENT_INPUT_SELECTOR"
        ),
        ...duplicateIssues(
          binding.inputSelectors,
          `/spec/transitionBindings/${index}/inputSelectors`,
          (item) => item.role,
          "EVENT_INPUT_ROLE"
        )
      );
      binding.inputSelectors.forEach((selector, selectorIndex) => {
        if (
          selector.cardinality.min !== 1 ||
          selector.cardinality.max !== 1
        ) {
          issues.push(issue(
            "EVENT_INPUT_CARDINALITY_INVALID",
            `/spec/transitionBindings/${index}/inputSelectors/${selectorIndex}/cardinality`,
            "Each event input selector must resolve exactly one resource."
          ));
        }
        issues.push(...lifecycleConfigurationIssues(
          selector,
          `/spec/transitionBindings/${index}/inputSelectors/${selectorIndex}`,
          "EVENT_INPUT_LIFECYCLE_RULE_INVALID"
        ));
      });
    }
  });
  const guardBindingIds = new Set(
    value.spec.guardBindings.map((item) => item.guardId)
  );
  const transitionBindingIds = new Set(
    value.spec.transitionBindings.map((item) => item.transitionId)
  );
  const machineBindingIds = new Set(
    value.spec.machineBindings.map((item) => item.machineId)
  );
  const revisionTransitionIds = new Set(transitionBindingIds);
  value.spec.transitionBindings.forEach((binding, index) => {
    issues.push(
      ...duplicateIssues(
        binding.mutationFootprint.created,
        `/spec/transitionBindings/${index}/mutationFootprint/created`,
        (item) => item.slot,
        "MUTATION_CREATED_SLOT"
      ),
      ...duplicateIssues(
        binding.mutationFootprint.externalCouplings ?? [],
        `/spec/transitionBindings/${index}/mutationFootprint/externalCouplings`,
        (item) => `${item.machineId}\u0000${item.transitionId}`,
        "EXTERNAL_COUPLING"
      )
    );
    for (
      const [couplingIndex, coupling] of
      (binding.mutationFootprint.externalCouplings ?? []).entries()
    ) {
      if (!machineBindingIds.has(coupling.machineId)) {
        issues.push(issue(
          "EXTERNAL_MACHINE_UNRESOLVED",
          `/spec/transitionBindings/${index}/mutationFootprint/externalCouplings/${couplingIndex}/machineId`,
          "External coupling machine does not resolve to one manifest pin."
        ));
      }
    }
    const createdBySlot = new Map(
      binding.mutationFootprint.created.map((item) => [item.slot, item])
    );
    const singletonSlots = new Set([
      ...binding.mutationFootprint.activeHeadSlots,
      ...binding.mutationFootprint.handoffSlots
    ]);
    for (const slot of singletonSlots) {
      const target = createdBySlot.get(slot);
      if (
        target &&
        (target.cardinality.min !== 1 || target.cardinality.max !== 1)
      ) {
        issues.push(issue(
          "SINGLETON_SLOT_CARDINALITY_INVALID",
          `/spec/transitionBindings/${index}/mutationFootprint/created`,
          "An active-head or handoff target must have cardinality exactly one."
        ));
      }
    }
  });
  value.spec.revisionUnits.forEach((unit, index) => {
    issues.push(...duplicateIssues(
      unit.revisionPlans,
      `/spec/revisionUnits/${index}/revisionPlans`,
      (item) => item.id,
      "REVISION_PLAN_ID"
    ));
    issues.push(...duplicateIssues(
      unit.replacementTargets,
      `/spec/revisionUnits/${index}/replacementTargets`,
      (item) => item.slot,
      "REVISION_TARGET_SLOT"
    ));
    unit.replacementTargets.forEach((target, targetIndex) => {
      if (
        target.cardinality.min !== 1 ||
        target.cardinality.max !== 1
      ) {
        issues.push(issue(
          "REVISION_TARGET_CARDINALITY_INVALID",
          `/spec/revisionUnits/${index}/replacementTargets/${targetIndex}/cardinality`,
          "Every revision target must have cardinality exactly one."
        ));
      }
    });
    if (!transitionBindingIds.has(unit.normalTransitionId)) {
      issues.push(issue(
        "REVISION_TRANSITION_UNRESOLVED",
        `/spec/revisionUnits/${index}/normalTransitionId`,
        "Revision unit normal transition does not resolve."
      ));
    }
    const assignmentBindings = [
      ["submissionSchemaBindingId", "schemaBindings"],
      ["formBindingId", "formBindings"],
      ["handlerBindingId", "handlerBindings"],
      ["projectionBindingId", "projectionBindings"],
      ["validatorSetId", "validatorSets"]
    ];
    for (const [field, collection] of assignmentBindings) {
      if (!ids[collection].has(unit.assignmentContract[field])) {
        issues.push(issue(
          "REVISION_ASSIGNMENT_BINDING_UNRESOLVED",
          `/spec/revisionUnits/${index}/assignmentContract/${field}`,
          "Revision assignment binding does not resolve within the manifest."
        ));
      }
    }
    if (!guardBindingIds.has(unit.disclosureControl.guardId)) {
      issues.push(issue(
        "REVISION_DISCLOSURE_GUARD_UNRESOLVED",
        `/spec/revisionUnits/${index}/disclosureControl/guardId`,
        "Revision disclosure guard does not resolve."
      ));
    }
    unit.revisionPlans.forEach((plan, planIndex) => {
      if (revisionTransitionIds.has(plan.transitionId)) {
        issues.push(issue(
          "REVISION_TRANSITION_ID_COLLISION",
          `/spec/revisionUnits/${index}/revisionPlans/${planIndex}/transitionId`,
          "Revision transition ID collides with another declared transition."
        ));
      }
      revisionTransitionIds.add(plan.transitionId);
      if (!sameValue(plan.fromStates, [...plan.fromStates].sort())) {
        issues.push(issue(
          "REVISION_SOURCE_SET_ORDER_INVALID",
          `/spec/revisionUnits/${index}/revisionPlans/${planIndex}/fromStates`,
          "Revision source states must be in canonical lexical order."
        ));
      }
      if (!guardBindingIds.has(plan.selectionGuardId)) {
        issues.push(issue(
          "REVISION_PLAN_GUARD_UNRESOLVED",
          `/spec/revisionUnits/${index}/revisionPlans/${planIndex}/selectionGuardId`,
          "Revision-plan selection guard does not resolve."
        ));
      }
      plan.externalCouplings.forEach((coupling, couplingIndex) => {
        if (!machineBindingIds.has(coupling.machineId)) {
          issues.push(issue(
            "EXTERNAL_MACHINE_UNRESOLVED",
            `/spec/revisionUnits/${index}/revisionPlans/${planIndex}/externalCouplings/${couplingIndex}/machineId`,
            "External coupling machine does not resolve to one manifest pin."
          ));
        }
      });
    });
    const normalBinding = value.spec.transitionBindings.find(
      (item) => item.transitionId === unit.normalTransitionId
    );
    if (
      normalBinding &&
      (
        !sameValue(
          unit.replacementTargets,
          normalBinding.mutationFootprint.created
        ) ||
        unit.normalPostcondition !== normalBinding.mutationFootprint.nextState
      )
    ) {
      issues.push(issue(
        "REVISION_NORMAL_FOOTPRINT_MISMATCH",
        `/spec/revisionUnits/${index}`,
        "Revision replacement group or postcondition differs from its normal transition."
      ));
    }
  });
  return issues;
}

function orderingIssues(value) {
  switch (value.kind) {
    case "AuthoringWorkspace":
      return [
        ...duplicateIssues(
          value.spec.activeHeads,
          "/spec/activeHeads",
          (item) => item.slot,
          "ACTIVE_HEAD_SLOT"
        ),
        ...duplicateIssues(
          value.spec.handoffProducts,
          "/spec/handoffProducts",
          (item) => item.slot,
          "HANDOFF_SLOT"
        )
      ];
    case "ContextClosure":
      return [
        ...ordinalIssues(value.spec.layers, "/spec/layers", "CONTEXT_LAYER"),
        ...duplicateIssues(
          value.spec.layers,
          "/spec/layers",
          (item) => `${item.role}\u0000${referenceIdentity(item.sourceReference)}`,
          "CONTEXT_LAYER_SOURCE"
        )
      ];
    case "SourceSnapshot":
      return [
        ...ordinalIssues(
          value.spec.inventory,
          "/spec/inventory",
          "INVENTORY_ITEM"
        ),
        ...duplicateIssues(
          value.spec.inventory,
          "/spec/inventory",
          (item) => item.logicalName,
          "INVENTORY_LOGICAL_NAME"
        )
      ];
    case "AuthoringFormDefinition":
      return [
        ...ordinalIssues(value.spec.fields, "/spec/fields", "FORM_FIELD"),
        ...duplicateIssues(
          value.spec.fields,
          "/spec/fields",
          (item) => item.id,
          "FORM_FIELD_ID"
        )
      ];
    case "ProjectionArtifact":
      return duplicateIssues(
        value.spec.sources,
        "/spec/sources",
        (item) => `${item.role}\u0000${referenceIdentity(item.reference)}`,
        "PROJECTION_SOURCE"
      );
    case "AuthoringRequest":
      return value.spec.operation.class === "revision"
        ? duplicateIssues(
          value.spec.operation.expectedHeads,
          "/spec/operation/expectedHeads",
          (item) => item.slot,
          "EXPECTED_HEAD_SLOT"
        )
        : [];
    case "AuthoringMutation":
      return [
        ...duplicateIssues(
          value.spec.createdResources,
          "/spec/createdResources",
          (item) => `${item.slot}\u0000${referenceIdentity(item.reference)}`,
          "CREATED_RESOURCE"
        ),
        ...duplicateIssues(
          value.spec.activeHeadChanges,
          "/spec/activeHeadChanges",
          (item) => item.slot,
          "ACTIVE_HEAD_CHANGE_SLOT"
        ),
        ...duplicateIssues(
          value.spec.handoffProducts,
          "/spec/handoffProducts",
          (item) => item.slot,
          "MUTATION_HANDOFF_SLOT"
        ),
        ...duplicateIssues(
          value.spec.supersededResources,
          "/spec/supersededResources",
          referenceIdentity,
          "SUPERSEDED_RESOURCE"
        ),
        ...duplicateIssues(
          value.spec.dependencyEdges.created,
          "/spec/dependencyEdges/created",
          (item) => [
            referenceIdentity(item.from),
            referenceIdentity(item.to),
            item.relation
          ].join("\u0000"),
          "CREATED_DEPENDENCY_EDGE"
        ),
        ...duplicateIssues(
          value.spec.dependencyEdges.superseded,
          "/spec/dependencyEdges/superseded",
          (item) => [
            referenceIdentity(item.from),
            referenceIdentity(item.to),
            item.relation
          ].join("\u0000"),
          "SUPERSEDED_DEPENDENCY_EDGE"
        ),
        ...ordinalIssues(
          value.spec.cause.class === "event"
            ? value.spec.cause.inputs
            : [],
          "/spec/cause/inputs",
          "EVENT_INPUT"
        )
      ];
    case "AuthoringCommitReceipt":
      return [
        ...duplicateIssues(
          value.spec.handoffProducts,
          "/spec/handoffProducts",
          (item) => item.slot,
          "RECEIPT_HANDOFF_SLOT"
        ),
        ...ordinalIssues(
          value.spec.cause.class === "event"
            ? value.spec.cause.inputs
            : [],
          "/spec/cause/inputs",
          "EVENT_INPUT"
        )
      ];
    default:
      return [];
  }
}

function boundedContentIssues(value) {
  const issues = [];
  if (value.kind === "SourceSnapshot") {
    const total = value.spec.inventory.reduce(
      (sum, item) => sum + item.content.byteLength,
      0
    );
    if (total > 16777216) {
      issues.push(issue(
        "INVENTORY_BYTE_BOUND_EXCEEDED",
        "/spec/inventory",
        "Aggregate intake exceeds the 16 MiB semantic bound."
      ));
    }
  }
  if (value.kind === "AuthoringFormDefinition") {
    value.spec.fields.forEach((field, index) => {
      const pairs = [
        ["minLength", "maxLength"],
        ["minItems", "maxItems"],
        ["itemMinLength", "itemMaxLength"]
      ];
      for (const [minimum, maximum] of pairs) {
        if (
          Object.hasOwn(field.constraints, minimum) &&
          Object.hasOwn(field.constraints, maximum) &&
          field.constraints[minimum] > field.constraints[maximum]
        ) {
          issues.push(issue(
            "FORM_CONSTRAINT_INVERTED",
            `/spec/fields/${index}/constraints`,
            `${minimum} exceeds ${maximum}.`
          ));
        }
      }
    });
  }
  return issues;
}

function transitionIssues(value) {
  if (isJournalRecord(value)) {
    const issues = [];
    if (
      value.after.semanticRevision < value.before.semanticRevision ||
      value.after.evidenceRevision < value.before.evidenceRevision
    ) {
      issues.push(issue(
        "JOURNAL_REVISION_REGRESSION",
        "/after",
        "Journal revisions cannot regress."
      ));
    }
    if (
      value.commitKind === "evidence" &&
      (
        value.after.semanticRevision !== value.before.semanticRevision ||
        value.after.semanticStateDigest !== value.before.semanticStateDigest
      )
    ) {
      issues.push(issue(
        "EVIDENCE_COMMIT_SEMANTIC_CHANGE",
        "/after",
        "An evidence commit cannot change semantic revision or state identity."
      ));
    }
    issues.push(...couplingContinuityIssues(
      value.machineEdges,
      "/machineEdges"
    ));
    return issues;
  }
  if (
    value.kind === "AuthoringRequest" &&
    value.spec.operation.class === "task-submission" &&
    value.spec.base.authoringState !== value.spec.operation.task.stateId
  ) {
    return [issue(
      "REQUEST_BASE_STATE_MISMATCH",
      "/spec/base/authoringState",
      "Request base state differs from its task state."
    )];
  }
  if (value.kind === "AuthoringCommitReceipt") {
    const { before, after } = value.spec;
    const issues = [];
    if (
      after.semanticRevision < before.semanticRevision ||
      after.evidenceRevision < before.evidenceRevision
    ) {
      issues.push(issue(
        "REVISION_REGRESSION",
        "/spec/after",
        "Commit revisions cannot regress."
      ));
    }
    issues.push(...couplingContinuityIssues(
      value.spec.externalCouplings,
      "/spec/externalCouplings"
    ));
    return issues;
  }
  if (value.kind === "AuthoringMutation") {
    const issues = [];
    if (
      value.spec.expected.authoringState !== value.spec.cause.edge.fromState ||
      value.spec.nextAuthoringState !== value.spec.cause.edge.toState
    ) {
      issues.push(issue(
        "MUTATION_EDGE_STATE_MISMATCH",
        "/spec/cause/edge",
        "Mutation expected or next state differs from its declared edge."
      ));
    }
    value.spec.activeHeadChanges.forEach((change, index) => {
      if (canonicalize(change.before) === canonicalize(change.after)) {
        issues.push(issue(
          "EMPTY_ACTIVE_HEAD_CHANGE",
          `/spec/activeHeadChanges/${index}`,
          "An active-head change must change at least one bound reference."
        ));
      }
    });
    issues.push(...couplingContinuityIssues(
      value.spec.externalCouplings,
      "/spec/externalCouplings"
    ));
    return issues;
  }
  return [];
}

function isJournalRecord(value) {
  return (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.hasOwn(value, "recordDigest") &&
    Object.hasOwn(value, "commitId") &&
    Object.hasOwn(value, "commitKind") &&
    Object.hasOwn(value, "machineEdges")
  );
}

function couplingContinuityIssues(couplings, field) {
  const issues = [];
  for (let index = 1; index < couplings.length; index += 1) {
    const before = couplings[index - 1];
    const after = couplings[index];
    if (
      before.machineId === after.machineId &&
      (
        before.toState !== after.fromState ||
        before.afterStateDigest !== after.beforeStateDigest
      )
    ) {
      issues.push(issue(
        "EXTERNAL_COUPLING_CONTINUITY_MISMATCH",
        `${field}/${index}`,
        "Adjacent coupled edges on one machine do not share an exact boundary state."
      ));
    }
  }
  return issues;
}

function typedReferenceIssue(reference, kind, field) {
  return (
    reference.apiVersion === "authoring.mission-kit/v1alpha1" &&
    reference.kind === kind
  ) ? [] : [issue(
    "RESOURCE_REFERENCE_TYPE_MISMATCH",
    field,
    `Reference must target authoring.mission-kit/v1alpha1 ${kind}.`
  )];
}

function typedReferenceIssues(value) {
  const issues = [];
  switch (value.kind) {
    case "AuthoringProfileManifest":
      issues.push(...typedReferenceIssue(
        value.spec.protocol,
        "AuthoringProtocol",
        "/spec/protocol"
      ));
      value.spec.formBindings.forEach((binding, index) => {
        issues.push(...typedReferenceIssue(
          binding.definition,
          "AuthoringFormDefinition",
          `/spec/formBindings/${index}/definition`
        ));
      });
      break;
    case "AuthoringWorkspace":
      issues.push(
        ...typedReferenceIssue(
          value.spec.profile.reference,
          "AuthoringProfileManifest",
          "/spec/profile/reference"
        ),
        ...typedReferenceIssue(
          value.spec.protocol.reference,
          "AuthoringProtocol",
          "/spec/protocol/reference"
        )
      );
      if (value.spec.openAssignment !== null) {
        issues.push(...typedReferenceIssue(
          value.spec.openAssignment.reference,
          "AuthoringAssignment",
          "/spec/openAssignment/reference"
        ));
      }
      break;
    case "AuthoringRequest":
      issues.push(...typedReferenceIssue(
        value.spec.contextClosure.reference,
        "ContextClosure",
        "/spec/contextClosure/reference"
      ));
      break;
    case "AuthoringAssignment":
      issues.push(
        ...typedReferenceIssue(
          value.spec.request.reference,
          "AuthoringRequest",
          "/spec/request/reference"
        ),
        ...typedReferenceIssue(
          value.spec.projectionArtifact.reference,
          "ProjectionArtifact",
          "/spec/projectionArtifact/reference"
        )
      );
      break;
    case "AuthoringSubmission":
      issues.push(...typedReferenceIssue(
        value.spec.assignment.reference,
        "AuthoringAssignment",
        "/spec/assignment/reference"
      ));
      break;
    case "AuthoringCommitReceipt":
      if (value.spec.cause.class === "task-submission") {
        issues.push(
          ...typedReferenceIssue(
            value.spec.cause.assignment.reference,
            "AuthoringAssignment",
            "/spec/cause/assignment/reference"
          ),
          ...typedReferenceIssue(
            value.spec.cause.submission.reference,
            "AuthoringSubmission",
            "/spec/cause/submission/reference"
          )
        );
      }
      issues.push(
        ...typedReferenceIssue(
          value.spec.mutation.reference,
          "AuthoringMutation",
          "/spec/mutation/reference"
        )
      );
      break;
    case "ProjectionArtifact":
      issues.push(...typedReferenceIssue(
        value.spec.form.reference,
        "AuthoringFormDefinition",
        "/spec/form/reference"
      ));
      break;
    case "AuthoringMutation":
      if (value.spec.cause.class === "task-submission") {
        issues.push(
          ...typedReferenceIssue(
            value.spec.cause.assignment.reference,
            "AuthoringAssignment",
            "/spec/cause/assignment/reference"
          ),
          ...typedReferenceIssue(
            value.spec.cause.submission.reference,
            "AuthoringSubmission",
            "/spec/cause/submission/reference"
          )
        );
      }
      break;
    default:
      break;
  }
  return issues;
}

function resourceShapeValid(resource) {
  return (
    resource &&
    typeof resource === "object" &&
    !Array.isArray(resource) &&
    typeof resource.apiVersion === "string" &&
    typeof resource.kind === "string" &&
    resource.metadata &&
    typeof resource.metadata === "object" &&
    !Array.isArray(resource.metadata) &&
    typeof resource.metadata.name === "string" &&
    resource.spec &&
    typeof resource.spec === "object" &&
    !Array.isArray(resource.spec)
  );
}

function storedVersionIssues(value) {
  const records = value.kind === "AuthoringWorkspace"
    ? value.spec.resourceVersions
    : value.kind === "AuthoringMutation"
      ? value.spec.createdResources
      : [];
  const field = value.kind === "AuthoringWorkspace"
    ? "/spec/resourceVersions"
    : "/spec/createdResources";
  const issues = value.kind === "AuthoringWorkspace"
    ? duplicateIssues(
      records,
      field,
      (record) => canonicalize(record),
      "STORED_RESOURCE_VERSION"
    )
    : [];
  records.forEach((record, index) => {
    if (!resourceShapeValid(record.resource)) {
      issues.push(issue(
        "STORED_RESOURCE_SHAPE_INVALID",
        `${field}/${index}/resource`,
        "Stored resource must carry apiVersion, kind, metadata.name, and spec."
      ));
      return;
    }
    issues.push(
      ...referenceIssues(
        record.reference,
        record.resource,
        `${field}/${index}/reference`
      ),
      ...checkDigest(
        record.integrityDigest,
        resourceIntegrityDigest(record.resource),
        "STORED_RESOURCE_INTEGRITY_MISMATCH",
        `${field}/${index}/integrityDigest`,
        "Stored-resource integrity digest"
      )
    );
  });
  return issues;
}

function requestPinIssues(value) {
  if (value.kind !== "AuthoringRequest") return [];
  const pairs = [
    ["schema", "schema"],
    ["validatorSet", "validatorSet"],
    ["form", "form"]
  ];
  const issues = [];
  for (const [contractField, bindingField] of pairs) {
    if (
      canonicalize(value.spec.submissionContract[contractField]) !==
      canonicalize(value.spec.bindings[bindingField])
    ) {
      issues.push(issue(
        "REQUEST_PIN_MISMATCH",
        `/spec/bindings/${bindingField}`,
        `Executable ${bindingField} differs from its submission contract pin.`
      ));
    }
  }
  return issues;
}

function mismatch(code, field, label) {
  return issue(code, field, `${label} does not match its canonical projection.`);
}

function checkDigest(actual, expected, code, field, label) {
  return actual === expected ? [] : [mismatch(code, field, label)];
}

function referenceIssues(reference, resource, field) {
  const expected = {
    apiVersion: resource.apiVersion,
    kind: resource.kind,
    name: resource.metadata.name,
    semanticDigest: resourceSemanticDigest(resource)
  };
  return (
    reference.apiVersion === expected.apiVersion &&
    reference.kind === expected.kind &&
    reference.name === expected.name &&
    reference.semanticDigest === expected.semanticDigest
  ) ? [] : [mismatch(
    "RESOURCE_REFERENCE_MISMATCH",
    field,
    "Resource reference"
  )];
}

function digestIssues(value) {
  if (isJournalRecord(value)) {
    return checkDigest(
      value.recordDigest,
      journalRecordDigest(value),
      "JOURNAL_RECORD_DIGEST_MISMATCH",
      "/recordDigest",
      "Journal-record digest"
    );
  }
  switch (value.kind) {
    case "AuthoringProfileManifest":
      {
        const planIssues = [];
        value.spec.revisionUnits.forEach((unit, unitIndex) => {
          unit.revisionPlans.forEach((plan, planIndex) => {
            planIssues.push(...checkDigest(
              plan.planDigest,
              revisionPlanDigest(plan),
              "REVISION_PLAN_DIGEST_MISMATCH",
              `/spec/revisionUnits/${unitIndex}/revisionPlans/${planIndex}/planDigest`,
              "Revision-plan digest"
            ));
          });
        });
        if (planIssues.length > 0) return planIssues;
        const selectorIssues = [];
        value.spec.tasks.forEach((task, taskIndex) => {
          task.contextSelectors.forEach((selector, selectorIndex) => {
            selectorIssues.push(...checkDigest(
              selector.selectorDigest,
              contextSelectorDigest(selector),
              "CONTEXT_SELECTOR_DIGEST_MISMATCH",
              `/spec/tasks/${taskIndex}/contextSelectors/${selectorIndex}/selectorDigest`,
              "Context-selector digest"
            ));
          });
        });
        if (selectorIssues.length > 0) return selectorIssues;
        const unitIssues = [];
        value.spec.revisionUnits.forEach((unit, index) => {
          unitIssues.push(...checkDigest(
            unit.unitDigest,
            revisionUnitDigest(unit),
            "REVISION_UNIT_DIGEST_MISMATCH",
            `/spec/revisionUnits/${index}/unitDigest`,
            "Revision-unit digest"
          ));
        });
        return unitIssues.length > 0
          ? unitIssues
          : checkDigest(
            value.spec.profileDigest,
            profileManifestDigest(value),
            "PROFILE_DIGEST_MISMATCH",
            "/spec/profileDigest",
            "Profile digest"
          );
      }
    case "AuthoringWorkspace":
      return [
        ...checkDigest(
          value.spec.integrity.semanticStateDigest,
          workspaceSemanticStateDigest(value),
          "WORKSPACE_SEMANTIC_DIGEST_MISMATCH",
          "/spec/integrity/semanticStateDigest",
          "Workspace semantic-state digest"
        ),
        ...checkDigest(
          value.spec.integrity.workspaceIntegrityDigest,
          workspaceIntegrityDigest(value),
          "WORKSPACE_INTEGRITY_DIGEST_MISMATCH",
          "/spec/integrity/workspaceIntegrityDigest",
          "Workspace integrity digest"
        )
      ];
    case "AuthoringRequest":
      return checkDigest(
        value.spec.requestDigest,
        requestCoreDigest(value),
        "REQUEST_DIGEST_MISMATCH",
        "/spec/requestDigest",
        "Request digest"
      );
    case "AuthoringAssignment":
      return [
        ...checkDigest(
          value.spec.uneditedSkeleton.blankViewDigest,
          blankViewDigest(decodedBytes(value.spec.uneditedSkeleton.content)),
          "BLANK_VIEW_DIGEST_MISMATCH",
          "/spec/uneditedSkeleton/blankViewDigest",
          "Blank-view digest"
        ),
        ...checkDigest(
          value.spec.assignmentDigest,
          assignmentDigest(value),
          "ASSIGNMENT_DIGEST_MISMATCH",
          "/spec/assignmentDigest",
          "Assignment digest"
        )
      ];
    case "ContextClosure": {
      const issues = checkDigest(
        value.spec.closureDigest,
        contextClosureDigest(value),
        "CONTEXT_CLOSURE_DIGEST_MISMATCH",
        "/spec/closureDigest",
        "Context-closure digest"
      );
      value.spec.layers.forEach((layer, index) => {
        if (
          layer.sourceSnapshot &&
          typeof layer.sourceSnapshot === "object" &&
          !Array.isArray(layer.sourceSnapshot) &&
          Object.hasOwn(layer.sourceSnapshot, "metadata")
        ) {
          issues.push(
            ...referenceIssues(
              layer.sourceReference,
              layer.sourceSnapshot,
              `/spec/layers/${index}/sourceReference`
            ),
            ...checkDigest(
              layer.sourceIntegrityDigest,
              resourceIntegrityDigest(layer.sourceSnapshot),
              "SOURCE_INTEGRITY_DIGEST_MISMATCH",
              `/spec/layers/${index}/sourceIntegrityDigest`,
              "Source integrity digest"
            )
          );
        }
      });
      return issues;
    }
    case "SourceSnapshot": {
      const issues = checkDigest(
        value.spec.sourceDigest,
        sourceSnapshotDigest(value),
        "SOURCE_DIGEST_MISMATCH",
        "/spec/sourceDigest",
        "Source digest"
      );
      value.spec.inventory.forEach((item, index) => {
        issues.push(...checkDigest(
          item.rawEvidenceDigest,
          rawEvidenceDigest(decodedBytes(item.content)),
          "RAW_EVIDENCE_DIGEST_MISMATCH",
          `/spec/inventory/${index}/rawEvidenceDigest`,
          "Raw-evidence digest"
        ));
      });
      return issues;
    }
    case "AuthoringFormDefinition":
      return checkDigest(
        value.spec.formDigest,
        formDefinitionDigest(value),
        "FORM_DIGEST_MISMATCH",
        "/spec/formDigest",
        "Form digest"
      );
    case "AuthoringSubmission":
      return [
        ...checkDigest(
          value.evidence.rawEvidence.rawEvidenceDigest,
          rawEvidenceDigest(decodedBytes(value.evidence.rawEvidence.content)),
          "RAW_EVIDENCE_DIGEST_MISMATCH",
          "/evidence/rawEvidence/rawEvidenceDigest",
          "Raw-evidence digest"
        ),
        ...checkDigest(
          value.spec.normalizedSubmissionDigest,
          normalizedSubmissionDigest(value),
          "NORMALIZED_SUBMISSION_DIGEST_MISMATCH",
          "/spec/normalizedSubmissionDigest",
          "Normalized-submission digest"
        )
      ];
    case "AuthoringCommitReceipt":
      return checkDigest(
        value.spec.receiptDigest,
        commitReceiptDigest(value),
        "COMMIT_RECEIPT_DIGEST_MISMATCH",
        "/spec/receiptDigest",
        "Commit-receipt digest"
      );
    case "ProjectionArtifact":
      return [
        ...checkDigest(
          value.spec.output.outputDigest,
          projectionOutputDigest(decodedBytes(value.spec.output.content)),
          "PROJECTION_OUTPUT_DIGEST_MISMATCH",
          "/spec/output/outputDigest",
          "Projection output digest"
        ),
        ...checkDigest(
          value.spec.projectionArtifactDigest,
          projectionArtifactDigest(value),
          "PROJECTION_ARTIFACT_DIGEST_MISMATCH",
          "/spec/projectionArtifactDigest",
          "Projection-artifact digest"
        )
      ];
    case "AuthoringMutation": {
      const issues = [];
      value.spec.createdResources.forEach((created, index) => {
        issues.push(
          ...referenceIssues(
            created.reference,
            created.resource,
            `/spec/createdResources/${index}/reference`
          ),
          ...checkDigest(
            created.integrityDigest,
            resourceIntegrityDigest(created.resource),
            "CREATED_RESOURCE_INTEGRITY_MISMATCH",
            `/spec/createdResources/${index}/integrityDigest`,
            "Created-resource integrity digest"
          )
        );
      });
      issues.push(...checkDigest(
        value.spec.mutationDigest,
        mutationDigest(value),
        "MUTATION_DIGEST_MISMATCH",
        "/spec/mutationDigest",
        "Mutation digest"
      ));
      return issues;
    }
    default:
      return [];
  }
}

/**
 * Validate cross-field semantics after structural validation. Primary
 * semantic defects are returned before derived digest mismatches so one
 * correction boundary does not create a cascade of redundant diagnostics.
 */
export function validateContractSemantics(value) {
  const traversalIssues = traversalBoundIssues(value);
  if (traversalIssues.length > 0) return Object.freeze(traversalIssues);
  const primary = [
    ...exactByteIssues(value),
    ...cardinalityIssues(value),
    ...protocolIssues(value),
    ...profileIssues(value),
    ...orderingIssues(value),
    ...boundedContentIssues(value),
    ...transitionIssues(value),
    ...typedReferenceIssues(value),
    ...storedVersionIssues(value),
    ...requestPinIssues(value)
  ];
  return Object.freeze(primary.length > 0 ? primary : digestIssues(value));
}

function resourceKey(value) {
  const reference = Object.hasOwn(value, "semanticDigest")
    ? value
    : {
      apiVersion: value.apiVersion,
      kind: value.kind,
      name: value.metadata?.name,
      semanticDigest: resourceSemanticDigest(value)
    };
  return referenceIdentity(reference);
}

function resourceLogicalKey(value) {
  const name = value.name ?? value.metadata?.name;
  return `${value.apiVersion}\u0000${value.kind}\u0000${name}`;
}

function collectReferences(
  value,
  field,
  found,
  { omitWorkspaceArchives = false } = {}
) {
  const pending = [{ field, value }];
  while (pending.length > 0) {
    const current = pending.pop();
    if (Array.isArray(current.value)) {
      for (let index = current.value.length - 1; index >= 0; index -= 1) {
        pending.push({
          field: `${current.field}/${index}`,
          value: current.value[index]
        });
      }
      continue;
    }
    if (!current.value || typeof current.value !== "object") continue;
    const keys = Object.keys(current.value);
    if (
      keys.length === 4 &&
      ["apiVersion", "kind", "name", "semanticDigest"].every(
        (key) => Object.hasOwn(current.value, key)
      )
    ) {
      found.push({ field: current.field, reference: current.value });
      continue;
    }
    const childEntries = Object.entries(current.value);
    for (let index = childEntries.length - 1; index >= 0; index -= 1) {
      const [key, item] = childEntries[index];
      if (
        omitWorkspaceArchives &&
        value.kind === "AuthoringWorkspace" &&
        current.value === value.spec &&
        ["history", "resourceVersions"].includes(key)
      ) {
        continue;
      }
      pending.push({
        field: `${current.field}/${key}`,
        value: item
      });
    }
  }
}

function graphMismatch(code, field, reason) {
  return issue(code, field, reason);
}

function sameValue(left, right) {
  return canonicalize(left) === canonicalize(right);
}

const lifecycleStatePattern = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/u;

function resolveJsonPointer(document, pointer) {
  if (
    typeof pointer !== "string" ||
    pointer.length === 0 ||
    !/^(?:\/(?:[^~/]|~0|~1)*)*$/u.test(pointer)
  ) {
    return Object.freeze({ found: false });
  }
  const tokens = pointer.slice(1).split("/").map((token) => (
    token.replaceAll("~1", "/").replaceAll("~0", "~")
  ));
  let current = document;
  for (const token of tokens) {
    if (Array.isArray(current)) {
      if (!/^(?:0|[1-9][0-9]*)$/u.test(token)) {
        return Object.freeze({ found: false });
      }
      const index = Number(token);
      if (!Number.isSafeInteger(index) || index >= current.length) {
        return Object.freeze({ found: false });
      }
      current = current[index];
      continue;
    }
    if (
      !current ||
      typeof current !== "object" ||
      !Object.hasOwn(current, token)
    ) {
      return Object.freeze({ found: false });
    }
    current = current[token];
  }
  return Object.freeze({ found: true, value: current });
}

function evaluateLifecycleRule(selector, source, sourceReference, workspace) {
  const rule = selector?.lifecycleRule;
  if (rule?.mode === "workspace-resource-version") {
    if (selector.requiredLifecycleState !== "frozen" || !source) {
      return Object.freeze({ ok: false });
    }
    const integrityDigest = resourceIntegrityDigest(source);
    const matches = (workspace?.spec?.resourceVersions ?? []).filter(
      (record) => (
        sameValue(record.reference, sourceReference) &&
        record.integrityDigest === integrityDigest &&
        sameValue(record.resource, source)
      )
    );
    return matches.length === 1
      ? Object.freeze({ ok: true, observedState: "frozen" })
      : Object.freeze({ ok: false });
  }
  if (rule?.mode === "json-pointer-state") {
    const resolved = resolveJsonPointer(source, rule.path);
    if (
      !resolved.found ||
      typeof resolved.value !== "string" ||
      resolved.value.length > 80 ||
      !lifecycleStatePattern.test(resolved.value)
    ) {
      return Object.freeze({ ok: false });
    }
    return Object.freeze({
      ok: resolved.value === selector.requiredLifecycleState,
      observedState: resolved.value
    });
  }
  return Object.freeze({ ok: false });
}

/**
 * Validate one caller-selected transaction closure. Inventory members outside
 * the roots' exact reference closure are deliberately ignored, so immutable
 * versions with the same logical name can coexist without ambient selection.
 */
export function validateTransactionClosureSemantics(
  inventory,
  { roots } = {}
) {
  if (!Array.isArray(inventory)) {
    throw new TypeError("transaction inventory must be an array");
  }
  if (!Array.isArray(roots) || roots.length === 0) {
    throw new TypeError("transaction roots must be a non-empty array");
  }
  const issues = [];
  for (const [index, value] of [...inventory, ...roots].entries()) {
    const bound = traversalBoundIssues(value);
    if (bound.length > 0) {
      return Object.freeze([
        graphMismatch(
          bound[0].code,
          `/transaction/${index}`,
          bound[0].reason
        )
      ]);
    }
  }
  const resources = new Map();
  const logicalResources = new Map();
  const register = (resource, field) => {
    if (!resourceShapeValid(resource)) {
      issues.push(graphMismatch(
        "TRANSACTION_RESOURCE_SHAPE_INVALID",
        field,
        "Transaction member is not a complete resource document."
      ));
      return;
    }
    const key = resourceKey(resource);
    const existing = resources.get(key);
    if (existing && !sameValue(existing, resource)) {
      issues.push(graphMismatch(
        "TRANSACTION_RESOURCE_BODY_CONFLICT",
        field,
        "One exact four-field identity resolves to conflicting resource bodies."
      ));
      return;
    }
    if (!existing) {
      resources.set(key, resource);
      const logicalKey = resourceLogicalKey(resource);
      const versions = logicalResources.get(logicalKey) ?? new Set();
      versions.add(key);
      logicalResources.set(logicalKey, versions);
    }
  };
  inventory.forEach((resource, index) => register(resource, `/inventory/${index}`));
  for (const resource of inventory) {
    if (resource?.kind === "AuthoringMutation") {
      resource.spec.createdResources.forEach((record, index) => {
        register(
          record.resource,
          `/AuthoringMutation/spec/createdResources/${index}/resource`
        );
      });
    }
    if (resource?.kind === "AuthoringWorkspace") {
      resource.spec.resourceVersions.forEach((record, index) => {
        register(
          record.resource,
          `/AuthoringWorkspace/spec/resourceVersions/${index}/resource`
        );
      });
    }
    if (resource?.kind === "ContextClosure") {
      resource.spec.layers.forEach((layer, index) => {
        register(
          layer.sourceSnapshot,
          `/ContextClosure/spec/layers/${index}/sourceSnapshot`
        );
      });
    }
  }
  const resolve = (reference, field, report = true) => {
    const target = resources.get(resourceKey(reference));
    if (target) return target;
    if (report) {
      const code = logicalResources.has(resourceLogicalKey(reference))
        ? "TRANSACTION_REFERENCE_DIGEST_MISMATCH"
        : "TRANSACTION_REFERENCE_UNRESOLVED";
      issues.push(graphMismatch(
        code,
        field,
        code.endsWith("DIGEST_MISMATCH")
          ? "Reference digest does not select an available immutable version."
          : "Reference does not resolve inside the transaction inventory."
      ));
    }
    return undefined;
  };
  const selected = new Map();
  const rootTargets = [];
  const pending = [];
  roots.forEach((root, index) => {
    const reference = resourceShapeValid(root)
      ? {
        apiVersion: root.apiVersion,
        kind: root.kind,
        name: root.metadata.name,
        semanticDigest: resourceSemanticDigest(root)
      }
      : root;
    if (
      !reference ||
      typeof reference !== "object" ||
      !["apiVersion", "kind", "name", "semanticDigest"].every(
        (key) => Object.hasOwn(reference, key)
      )
    ) {
      issues.push(graphMismatch(
        "TRANSACTION_ROOT_INVALID",
        `/roots/${index}`,
        "Transaction root must be a resource document or exact reference."
      ));
      return;
    }
    const target = resolve(reference, `/roots/${index}`);
    if (target) {
      rootTargets.push(target);
      pending.push(target);
    }
  });
  while (pending.length > 0) {
    const resource = pending.pop();
    const key = resourceKey(resource);
    if (selected.has(key)) continue;
    selected.set(key, resource);
    const references = [];
    collectReferences(
      resource,
      `/${resource.kind}/${resource.metadata.name}`,
      references
    );
    for (const { field, reference } of references) {
      const target = resolve(reference, field);
      if (target && !selected.has(resourceKey(target))) pending.push(target);
    }
  }
  /*
   * Full selection above validates every retained version and exact
   * reference, including historical chains. Operational selection below
   * deliberately omits Workspace.history and Workspace.resourceVersions:
   * immutable archives remain resolvable evidence, while active heads,
   * handoffs, dependencies, the open Assignment, and the explicit transaction
   * roots select the current operational closure. Otherwise a second valid
   * transaction would make every historical Submission, Mutation, or Receipt
   * compete by kind with the new transaction.
   */
  const operational = new Map();
  const operationalPending = [...rootTargets];
  while (operationalPending.length > 0) {
    const resource = operationalPending.pop();
    const key = resourceKey(resource);
    if (operational.has(key)) continue;
    operational.set(key, resource);
    const references = [];
    collectReferences(
      resource,
      `/${resource.kind}/${resource.metadata.name}`,
      references,
      { omitWorkspaceArchives: true }
    );
    for (const { reference } of references) {
      const target = resolve(reference, "", false);
      if (target && !operational.has(resourceKey(target))) {
        operationalPending.push(target);
      }
    }
  }
  const values = [...operational.values()];
  const one = (kind) => values.filter((value) => value?.kind === kind);
  const selectOne = (kind) => {
    const matches = one(kind);
    if (matches.length > 1) {
      issues.push(graphMismatch(
        "TRANSACTION_KIND_AMBIGUOUS",
        "/",
        `Selected transaction reaches more than one ${kind}.`
      ));
      return undefined;
    }
    return matches[0];
  };
  const protocol = selectOne("AuthoringProtocol");
  const profile = selectOne("AuthoringProfileManifest");
  const request = selectOne("AuthoringRequest");
  const assignment = selectOne("AuthoringAssignment");
  const submission = selectOne("AuthoringSubmission");
  const projection = selectOne("ProjectionArtifact");
  const mutation = selectOne("AuthoringMutation");
  const receipt = selectOne("AuthoringCommitReceipt");
  const workspace = selectOne("AuthoringWorkspace");
  if (profile && protocol) {
    if (
      resourceKey(profile.spec.protocol) !== resourceKey(protocol) ||
      profile.spec.protocol.semanticDigest !== resourceSemanticDigest(protocol)
    ) {
      issues.push(graphMismatch(
        "PROFILE_PROTOCOL_MISMATCH",
        "/AuthoringProfileManifest/spec/protocol",
        "Profile protocol pin does not resolve to the graph protocol."
      ));
    }
    const protocolGuardIds = protocol.spec.guards.map((item) => item.id).sort();
    const profileGuardIds = profile.spec.guardBindings
      .map((item) => item.guardId)
      .sort();
    if (!sameValue(protocolGuardIds, profileGuardIds)) {
      issues.push(graphMismatch(
        "GUARD_BINDING_CLOSURE_MISMATCH",
        "/AuthoringProfileManifest/spec/guardBindings",
        "Guard bindings must be unique and total over protocol guards."
      ));
    }
    const bindingsByTransition = new Map(
      profile.spec.transitionBindings.map((item) => [item.transitionId, item])
    );
    if (
      bindingsByTransition.size !== protocol.spec.transitions.length ||
      protocol.spec.transitions.some(
        (transition) => !bindingsByTransition.has(transition.id)
      )
    ) {
      issues.push(graphMismatch(
        "TRANSITION_BINDING_CLOSURE_MISMATCH",
        "/AuthoringProfileManifest/spec/transitionBindings",
        "Every protocol transition requires exactly one manifest binding."
      ));
    }
    for (const transition of protocol.spec.transitions) {
      const binding = bindingsByTransition.get(transition.id);
      if (!binding) continue;
      const sourceStates = transitionSourceStates(transition).map(
        (stateId) => protocol.spec.states.find((state) => state.id === stateId)
      );
      const task = profile.spec.tasks.find(
        (item) => item.id === binding.taskId
      );
      if (
        binding.mutationFootprint.nextState !== transition.toState ||
        (
          binding.triggerClass === "task-submission" &&
          (
            sourceStates.length !== 1 ||
            sourceStates[0]?.class !== "task" ||
            sourceStates[0].taskId !== binding.taskId ||
            !task ||
            task.stateId !== sourceStates[0]?.id ||
            task.handlerBindingId !== binding.handlerBindingId
          )
        ) ||
        (
          binding.triggerClass === "event" &&
          Object.hasOwn(binding, "taskId")
        )
      ) {
        issues.push(graphMismatch(
          "TRANSITION_BINDING_AUTHORITY_MISMATCH",
          `/AuthoringProfileManifest/spec/transitionBindings/${transition.id}`,
          "Transition binding trigger, task, handler, or next state conflicts with protocol authority."
        ));
      }
    }
    const taskStates = protocol.spec.states.filter(
      (state) => state.class === "task"
    );
    for (const state of taskStates) {
      const matches = profile.spec.tasks.filter(
        (task) => task.id === state.taskId && task.stateId === state.id
      );
      if (matches.length !== 1) {
        issues.push(graphMismatch(
          "TASK_STATE_BIJECTION_MISMATCH",
          `/AuthoringProtocol/spec/states/${state.id}`,
          "Task state does not resolve exactly one matching profile task."
        ));
      }
    }
    for (const task of profile.spec.tasks) {
      const matches = taskStates.filter(
        (state) => state.taskId === task.id && state.id === task.stateId
      );
      if (matches.length !== 1) {
        issues.push(graphMismatch(
          "PROFILE_TASK_ORPHANED",
          `/AuthoringProfileManifest/spec/tasks/${task.id}`,
          "Profile task does not resolve exactly one protocol task state."
        ));
      }
    }
    profile.spec.formBindings.forEach((binding, index) => {
      const form = resolve(
        binding.definition,
        `/AuthoringProfileManifest/spec/formBindings/${index}/definition`,
        false
      );
      if (
        form &&
        (
          form.kind !== "AuthoringFormDefinition" ||
          binding.formDigest !== form.spec.formDigest
        )
      ) {
        issues.push(graphMismatch(
          "PROFILE_FORM_BINDING_MISMATCH",
          `/AuthoringProfileManifest/spec/formBindings/${index}`,
          "Manifest form digest differs from its exact form definition."
        ));
      }
    });
    const concreteEdges = new Set(
      protocol.spec.transitions.flatMap((transition) => (
        transitionSourceStates(transition).map(
          (stateId) => `${stateId}\u0000${transition.eventId}`
        )
      ))
    );
    const protocolStateIds = new Set(
      protocol.spec.states.map((state) => state.id)
    );
    const protocolEventIds = new Set(
      protocol.spec.events.map((event) => event.id)
    );
    const protocolTransitionIds = new Set(
      protocol.spec.transitions.map((transition) => transition.id)
    );
    profile.spec.revisionUnits.forEach((unit, unitIndex) => {
      const formBinding = profile.spec.formBindings.find(
        (item) => item.id === unit.assignmentContract.formBindingId
      );
      const form = formBinding
        ? resolve(formBinding.definition, "", false)
        : undefined;
      const reasonField = form?.spec.fields.find(
        (field) => field.id === unit.assignmentContract.reasonFieldId
      );
      if (!reasonField || reasonField.required !== true) {
        issues.push(graphMismatch(
          "REVISION_REASON_FIELD_INVALID",
          `/AuthoringProfileManifest/spec/revisionUnits/${unitIndex}/assignmentContract/reasonFieldId`,
          "Revision reason field must resolve to one required form field."
        ));
      }
      unit.revisionPlans.forEach((plan, planIndex) => {
        if (protocolTransitionIds.has(plan.transitionId)) {
          issues.push(graphMismatch(
            "REVISION_TRANSITION_ID_COLLISION",
            `/AuthoringProfileManifest/spec/revisionUnits/${unitIndex}/revisionPlans/${planIndex}/transitionId`,
            "Revision transition ID collides with protocol authority."
          ));
        }
        if (
          !protocolEventIds.has(plan.eventId) ||
          plan.fromStates.some((stateId) => !protocolStateIds.has(stateId))
        ) {
          issues.push(graphMismatch(
            "REVISION_EDGE_UNRESOLVED",
            `/AuthoringProfileManifest/spec/revisionUnits/${unitIndex}/revisionPlans/${planIndex}`,
            "Revision source state or event does not resolve in the protocol."
          ));
        }
        for (const stateId of plan.fromStates) {
          const edgeKey = `${stateId}\u0000${plan.eventId}`;
          if (concreteEdges.has(edgeKey)) {
            issues.push(graphMismatch(
              "REVISION_EDGE_COLLISION",
              `/AuthoringProfileManifest/spec/revisionUnits/${unitIndex}/revisionPlans/${planIndex}`,
              "Revision edge overlaps another concrete executable edge."
            ));
          }
          concreteEdges.add(edgeKey);
        }
      });
    });
  }
  let requestAuthority;
  let requestFootprint;
  let requestPlan;
  let requestTask;
  let selectedProjectionBinding;
  if (
    request &&
    (
      !workspace ||
      workspace.spec.authoringState !== request.spec.base.authoringState ||
      workspace.spec.semanticRevision !== request.spec.base.semanticRevision ||
      workspace.spec.integrity.semanticStateDigest !==
        request.spec.base.semanticStateDigest
    )
  ) {
    issues.push(graphMismatch(
      "REQUEST_WORKSPACE_BASE_MISMATCH",
      "/AuthoringRequest/spec/base",
      "Request base does not exactly equal the selected workspace semantic state."
    ));
  }
  if (request && profile && protocol) {
    const closure = resolve(request.spec.contextClosure.reference, "", false);
    if (
      closure &&
      request.spec.contextClosure.closureDigest !== closure.spec.closureDigest
    ) {
      issues.push(graphMismatch(
        "REQUEST_CONTEXT_CLOSURE_MISMATCH",
        "/AuthoringRequest/spec/contextClosure",
        "Request closure digest differs from its exact closure resource."
      ));
    }
    let contract;
    if (request.spec.operation.class === "task-submission") {
      const operation = request.spec.operation;
      const task = profile.spec.tasks.find(
        (item) => item.id === operation.task.id
      );
      const transition = protocol.spec.transitions.find(
        (item) => item.id === operation.task.transitionId
      );
      const state = protocol.spec.states.find(
        (item) => item.id === operation.task.stateId
      );
      const transitionBinding = profile.spec.transitionBindings.find(
        (item) => item.transitionId === operation.task.transitionId
      );
      if (
        !task ||
        task.stateId !== operation.task.stateId ||
        !sameValue(task.target, operation.target)
      ) {
        issues.push(graphMismatch(
          "REQUEST_TASK_MISMATCH",
          "/AuthoringRequest/spec/operation/task",
          "Request task or target differs from the profile task."
        ));
      }
      if (
        !transition ||
        !transitionSourceStates(transition).includes(operation.task.stateId) ||
        transition.eventId !== operation.task.eventId ||
        !state ||
        state.taskId !== operation.task.id
      ) {
        issues.push(graphMismatch(
          "REQUEST_TRANSITION_MISMATCH",
          "/AuthoringRequest/spec/operation/task/transitionId",
          "Request transition does not match its protocol task edge."
        ));
      }
      if (
        !transitionBinding ||
        transitionBinding.taskId !== operation.task.id ||
        transitionBinding.mutationFootprint.nextState !== transition?.toState
      ) {
        issues.push(graphMismatch(
          "PROFILE_TRANSITION_BINDING_MISMATCH",
          "/AuthoringProfileManifest/spec/transitionBindings",
          "Profile transition binding differs from request and protocol authority."
        ));
      }
      contract = task;
      requestTask = task;
      requestAuthority = transitionBinding;
      requestFootprint = transitionBinding?.mutationFootprint;
    } else {
      const operation = request.spec.operation;
      const unit = profile.spec.revisionUnits.find(
        (item) => item.id === operation.unit.id
      );
      const plan = unit?.revisionPlans.find(
        (item) => item.id === operation.plan.id
      );
      const normalBinding = profile.spec.transitionBindings.find(
        (item) => item.transitionId === unit?.normalTransitionId
      );
      if (
        !unit ||
        operation.unit.digest !== unit.unitDigest ||
        !plan ||
        operation.plan.digest !== plan.planDigest
      ) {
        issues.push(graphMismatch(
          "REVISION_AUTHORITY_PIN_MISMATCH",
          "/AuthoringRequest/spec/operation",
          "Revision unit or plan pin differs from the profile authority."
        ));
      }
      if (
        !normalBinding ||
        normalBinding.taskId !== operation.normalTaskId ||
        !plan?.fromStates.includes(request.spec.base.authoringState)
      ) {
        issues.push(graphMismatch(
          "REVISION_BASE_AUTHORITY_MISMATCH",
          "/AuthoringRequest/spec/base",
          "Revision base state or normal task differs from its selected plan."
        ));
      }
      const expectedSlots = unit?.replacementTargets.map(
        (target) => target.slot
      ) ?? [];
      if (
        !sameValue(
          operation.expectedHeads.map((head) => head.slot),
          expectedSlots
        )
      ) {
        issues.push(graphMismatch(
          "REVISION_EXPECTED_HEAD_ORDER_MISMATCH",
          "/AuthoringRequest/spec/operation/expectedHeads",
          "Revision expected heads must exactly follow replacement-target order."
        ));
      }
      if (workspace) {
        const currentHeads = expectedSlots.map((slot) => (
          workspace.spec.activeHeads.find((head) => head.slot === slot)
        ));
        if (
          currentHeads.some((head) => !head) ||
          !sameValue(operation.expectedHeads, currentHeads)
        ) {
          issues.push(graphMismatch(
            "REVISION_EXPECTED_HEAD_MISMATCH",
            "/AuthoringRequest/spec/operation/expectedHeads",
            "Revision expected heads differ from current workspace heads."
          ));
        }
      }
      contract = unit?.assignmentContract;
      requestTask = profile.spec.tasks.find(
        (item) => item.id === operation.normalTaskId
      );
      requestAuthority = plan;
      requestPlan = plan;
      requestFootprint = normalBinding?.mutationFootprint;
    }
    const schemaBinding = profile.spec.schemaBindings.find(
      (item) => item.id === contract?.submissionSchemaBindingId
    );
    const formBinding = profile.spec.formBindings.find(
      (item) => item.id === contract?.formBindingId
    );
    const handlerBinding = profile.spec.handlerBindings.find(
      (item) => item.id === contract?.handlerBindingId
    );
    const projectionBinding = profile.spec.projectionBindings.find(
      (item) => item.id === contract?.projectionBindingId
    );
    selectedProjectionBinding = projectionBinding;
    const validatorSet = profile.spec.validatorSets.find(
      (item) => item.id === contract?.validatorSetId
    );
    const expectedPins = {
      kernel: profile.spec.kernel,
      profile: {
        id: profile.metadata.name,
        digest: profile.spec.profileDigest
      },
      protocol: {
        id: protocol.metadata.name,
        digest: resourceSemanticDigest(protocol)
      },
      handler: handlerBinding?.handler,
      parser: formBinding?.parser,
      form: formBinding && {
        id: formBinding.id,
        digest: formBinding.formDigest
      },
      schema: schemaBinding?.schema,
      validatorSet: validatorSet && {
        id: validatorSet.id,
        digest: validatorSet.digest
      },
      projection: projectionBinding && {
        id: projectionBinding.id,
        digest: projectionBinding.definitionDigest
      }
    };
    for (const [label, expected] of Object.entries(expectedPins)) {
      if (!expected || !sameValue(request.spec.bindings[label], expected)) {
        issues.push(graphMismatch(
          "REQUEST_EXECUTABLE_PIN_MISMATCH",
          `/AuthoringRequest/spec/bindings/${label}`,
          `Request ${label} pin differs from selected profile authority.`
        ));
      }
    }
    if (closure && requestTask) {
      const layers = closure.spec.layers;
      let layerIndex = 0;
      for (const selector of requestTask.contextSelectors) {
        const selectorLayers = [];
        while (
          layerIndex < layers.length &&
          layers[layerIndex].selectorId === selector.id
        ) {
          selectorLayers.push(layers[layerIndex]);
          layerIndex += 1;
        }
        if (
          selectorLayers.length < selector.cardinality.min ||
          selectorLayers.length > selector.cardinality.max
        ) {
          issues.push(graphMismatch(
            "CONTEXT_SELECTOR_CARDINALITY_MISMATCH",
            "/ContextClosure/spec/layers",
            `Selector ${selector.id} resolved outside its declared cardinality.`
          ));
        }
        selectorLayers.forEach((layer) => {
          const source = resolve(layer.sourceReference, "", false);
          const expectedReference = selector.selection.mode === "active-head"
            ? workspace?.spec.activeHeads.find(
              (head) => head.slot === selector.selection.slot
            )?.reference
            : request.spec.operation.inputs?.[selector.selection.inputKey];
          if (
            layer.selectorDigest !== selector.selectorDigest ||
            layer.selectorDigest !== contextSelectorDigest(selector) ||
            layer.role !== selector.role ||
            layer.requiredLifecycleState !== selector.requiredLifecycleState ||
            layer.projectionDefinitionDigest !== selector.projection.digest
          ) {
            issues.push(graphMismatch(
              "CONTEXT_LAYER_SELECTOR_MISMATCH",
              `/ContextClosure/spec/layers/${layer.ordinal - 1}`,
              "Context layer differs from its manifest-owned selector authority."
            ));
          }
          const sourceMatches = Boolean(
            source &&
            layer.sourceReference.apiVersion ===
              selector.resourceType.apiVersion &&
            layer.sourceReference.kind === selector.resourceType.kind &&
            expectedReference &&
            sameValue(layer.sourceReference, expectedReference) &&
            sameValue(layer.sourceSnapshot, source) &&
            layer.sourceIntegrityDigest === resourceIntegrityDigest(source)
          );
          if (!sourceMatches) {
            issues.push(graphMismatch(
              "CONTEXT_LAYER_SOURCE_MISMATCH",
              `/ContextClosure/spec/layers/${layer.ordinal - 1}`,
              "Context layer source differs from its exact selector result."
            ));
          } else {
            const lifecycle = evaluateLifecycleRule(
              selector,
              source,
              layer.sourceReference,
              workspace
            );
            if (
              !lifecycle.ok ||
              layer.lifecycleProof.ruleDigest !==
                lifecycleRuleDigest(selector) ||
              layer.lifecycleProof.observedState !==
                lifecycle.observedState
            ) {
              issues.push(graphMismatch(
                "CONTEXT_LAYER_LIFECYCLE_MISMATCH",
                `/ContextClosure/spec/layers/${layer.ordinal - 1}/lifecycleProof`,
                "Context layer does not prove the selector lifecycle rule against its exact integrity-bound source."
              ));
            }
          }
        });
      }
      if (layerIndex !== layers.length) {
        issues.push(graphMismatch(
          "CONTEXT_LAYER_AMBIENT_MISMATCH",
          `/ContextClosure/spec/layers/${layerIndex}`,
          "Context closure contains a reordered, duplicated, or ambient layer."
        ));
      }
    }
  }
  if (assignment && request) {
    if (
      assignment.spec.request.requestDigest !== request.spec.requestDigest ||
      assignment.spec.baseSemanticRevision !== request.spec.base.semanticRevision ||
      assignment.spec.baseSemanticStateDigest !==
        request.spec.base.semanticStateDigest
    ) {
      issues.push(graphMismatch(
        "ASSIGNMENT_REQUEST_BASE_MISMATCH",
        "/AuthoringAssignment/spec",
        "Assignment request ancestry or base semantic state differs from its request."
      ));
    }
    if (
      !projection ||
      assignment.spec.projectionArtifact.projectionArtifactDigest !==
        projection.spec.projectionArtifactDigest
    ) {
      issues.push(graphMismatch(
        "ASSIGNMENT_PROJECTION_MISMATCH",
        "/AuthoringAssignment/spec/projectionArtifact",
        "Assignment projection digest differs from its exact artifact."
      ));
    } else if (
      !sameValue(
        assignment.spec.uneditedSkeleton.content,
        projection.spec.output.content
      ) ||
      assignment.spec.uneditedSkeleton.blankViewDigest !== blankViewDigest(
        decodedBytes(projection.spec.output.content)
      )
    ) {
      issues.push(graphMismatch(
        "ASSIGNMENT_SKELETON_MISMATCH",
        "/AuthoringAssignment/spec/uneditedSkeleton",
        "Assignment skeleton bytes differ from the selected projection output."
      ));
    }
  }
  if (projection) {
    if (
      request &&
      (
        !selectedProjectionBinding ||
        projection.spec.projectionDefinitionDigest !==
          request.spec.bindings.projection.digest ||
        projection.spec.projectionDefinitionDigest !==
          selectedProjectionBinding.definitionDigest ||
        !sameValue(projection.spec.engine, selectedProjectionBinding.engine)
      )
    ) {
      issues.push(graphMismatch(
        "PROJECTION_AUTHORITY_MISMATCH",
        "/ProjectionArtifact/spec",
        "Projection definition or engine differs from Request and Profile authority."
      ));
    }
    const form = resolve(projection.spec.form.reference, "", false);
    if (
      !form ||
      projection.spec.form.formDigest !== form.spec.formDigest
    ) {
      issues.push(graphMismatch(
        "PROJECTION_FORM_MISMATCH",
        "/ProjectionArtifact/spec/form",
        "Projection form digest differs from its exact form definition."
      ));
    }
    projection.spec.sources.forEach((source, index) => {
      const target = resolve(source.reference, "", false);
      if (
        target &&
        source.integrityDigest !== resourceIntegrityDigest(target)
      ) {
        issues.push(graphMismatch(
          "PROJECTION_SOURCE_INTEGRITY_MISMATCH",
          `/ProjectionArtifact/spec/sources/${index}/integrityDigest`,
          "Projection source integrity digest differs from its exact source."
        ));
      }
    });
  }
  if (submission && assignment) {
    if (
      submission.spec.assignment.assignmentDigest !==
      assignment.spec.assignmentDigest
    ) {
      issues.push(graphMismatch(
        "SUBMISSION_ASSIGNMENT_MISMATCH",
        "/AuthoringSubmission/spec/assignment",
        "Submission assignment digest differs from its assignment."
      ));
    }
  }
  if (mutation && profile && protocol) {
    let authority;
    let footprint;
    let handler;
    let expectedEdge;
    let expectedCouplings = [];
    if (mutation.spec.cause.class === "task-submission") {
      if (!assignment || !submission || !request) {
        issues.push(graphMismatch(
          "TASK_CAUSE_ANCESTRY_UNRESOLVED",
          "/AuthoringMutation/spec/cause",
          "Task-submission cause does not close assignment ancestry."
        ));
      } else {
        if (
          mutation.spec.cause.assignment.assignmentDigest !==
            assignment.spec.assignmentDigest ||
          mutation.spec.cause.submission.normalizedSubmissionDigest !==
            submission.spec.normalizedSubmissionDigest ||
          mutation.spec.expected.authoringState !==
            request.spec.base.authoringState ||
          mutation.spec.expected.semanticRevision !==
            request.spec.base.semanticRevision ||
          mutation.spec.expected.semanticStateDigest !==
            request.spec.base.semanticStateDigest
        ) {
          issues.push(graphMismatch(
            "MUTATION_TASK_ANCESTRY_MISMATCH",
            "/AuthoringMutation/spec/cause",
            "Mutation task ancestry or expected base differs from its request."
          ));
        }
        if (request.spec.operation.class === "task-submission") {
          const operation = request.spec.operation;
          const transition = protocol.spec.transitions.find(
            (item) => item.id === operation.task.transitionId
          );
          expectedEdge = transition && {
            transitionId: transition.id,
            fromState: operation.task.stateId,
            eventId: transition.eventId,
            toState: transition.toState
          };
          authority = requestAuthority?.authority;
          footprint = requestFootprint;
          expectedCouplings = footprint?.externalCouplings ?? [];
          const handlerBinding = profile.spec.handlerBindings.find(
            (item) => item.id === requestAuthority?.handlerBindingId
          );
          handler = handlerBinding?.handler;
        } else {
          const operation = request.spec.operation;
          const unit = profile.spec.revisionUnits.find(
            (item) => item.id === operation.unit.id
          );
          expectedEdge = requestPlan && unit && {
            transitionId: requestPlan.transitionId,
            fromState: request.spec.base.authoringState,
            eventId: requestPlan.eventId,
            toState: unit.normalPostcondition
          };
          authority = requestPlan?.authority;
          expectedCouplings = requestPlan?.externalCouplings ?? [];
          footprint = requestFootprint;
          const handlerBinding = profile.spec.handlerBindings.find(
            (item) => (
              item.id === unit?.assignmentContract.handlerBindingId
            )
          );
          handler = handlerBinding?.handler;
        }
      }
    } else {
      const edge = mutation.spec.cause.edge;
      const transition = protocol.spec.transitions.find(
        (item) => item.id === edge.transitionId
      );
      const binding = profile.spec.transitionBindings.find(
        (item) => item.transitionId === edge.transitionId
      );
      if (
        !transition ||
        !binding ||
        binding.triggerClass !== "event" ||
        !transitionSourceStates(transition).includes(edge.fromState)
      ) {
        issues.push(graphMismatch(
          "EVENT_CAUSE_EDGE_MISMATCH",
          "/AuthoringMutation/spec/cause/edge",
          "Event cause edge does not resolve to declared event authority."
        ));
      }
      expectedEdge = transition && {
        transitionId: transition.id,
        fromState: edge.fromState,
        eventId: transition.eventId,
        toState: transition.toState
      };
      authority = binding?.authority;
      footprint = binding?.mutationFootprint;
      expectedCouplings = footprint?.externalCouplings ?? [];
      const handlerBinding = profile.spec.handlerBindings.find(
        (item) => item.id === binding?.handlerBindingId
      );
      handler = handlerBinding?.handler;
      const selectors = binding?.inputSelectors ?? [];
      const inputs = mutation.spec.cause.inputs;
      let eventInputAuthorityMismatch = selectors.length !== inputs.length;
      let eventInputLifecycleMismatch = false;
      selectors.forEach((selector, index) => {
        const input = inputs[index];
        const target = resolve(input?.reference ?? {}, "", false);
        const expectedHead = selector.selection.mode === "active-head"
          ? workspace?.spec.activeHeads.find(
            (head) => head.slot === selector.selection.slot
          )
          : undefined;
        const inputMatches = Boolean(
          input &&
          input.ordinal === selector.ordinal &&
          input.role === selector.role &&
          input.reference.apiVersion === selector.resourceType.apiVersion &&
          input.reference.kind === selector.resourceType.kind &&
          target &&
          input.integrityDigest === resourceIntegrityDigest(target) &&
          (
            selector.selection.mode !== "active-head" ||
            sameValue(input.reference, expectedHead?.reference)
          )
        );
        if (!inputMatches) {
          eventInputAuthorityMismatch = true;
          return;
        }
        if (
          !evaluateLifecycleRule(
            selector,
            target,
            input.reference,
            workspace
          ).ok
        ) {
          eventInputLifecycleMismatch = true;
        }
      });
      if (eventInputAuthorityMismatch) {
        issues.push(graphMismatch(
          "EVENT_INPUT_AUTHORITY_MISMATCH",
          "/AuthoringMutation/spec/cause/inputs",
          "Event inputs differ from ordered selector authority."
        ));
      }
      if (eventInputLifecycleMismatch) {
        issues.push(graphMismatch(
          "EVENT_INPUT_LIFECYCLE_MISMATCH",
          "/AuthoringMutation/spec/cause/inputs",
          "Event input does not satisfy its selector lifecycle rule against the exact integrity-bound resource."
        ));
      }
    }
    const expectedExecution = {
      profile: {
        id: profile.metadata.name,
        digest: profile.spec.profileDigest
      },
      protocol: {
        id: protocol.metadata.name,
        digest: resourceSemanticDigest(protocol)
      },
      handler
    };
    const actualCouplings = mutation.spec.externalCouplings.map(
      ({ machineId, transitionId }) => ({ machineId, transitionId })
    );
    if (
      !expectedEdge ||
      !sameValue(mutation.spec.cause.edge, expectedEdge) ||
      !sameValue(mutation.spec.cause.authority, authority) ||
      !sameValue(mutation.spec.cause.execution, expectedExecution) ||
      !sameValue(actualCouplings, expectedCouplings) ||
      mutation.spec.nextAuthoringState !== expectedEdge?.toState
    ) {
      issues.push(graphMismatch(
        "MUTATION_AUTHORITY_MISMATCH",
        "/AuthoringMutation/spec",
        "Mutation edge, authority, execution, or coupling plan differs from profile authority."
      ));
    }
    if (footprint) {
      const targetBySlot = new Map(
        footprint.created.map((target) => [target.slot, target])
      );
      const createdBySlot = new Map();
      let createdMismatch = false;
      for (const created of mutation.spec.createdResources) {
        const target = targetBySlot.get(created.slot);
        const members = createdBySlot.get(created.slot) ?? [];
        members.push(created);
        createdBySlot.set(created.slot, members);
        if (
          !target ||
          created.reference.apiVersion !== target.resourceType.apiVersion ||
          created.reference.kind !== target.resourceType.kind ||
          created.resource.apiVersion !== target.resourceType.apiVersion ||
          created.resource.kind !== target.resourceType.kind
        ) {
          createdMismatch = true;
        }
      }
      for (const target of footprint.created) {
        const count = (createdBySlot.get(target.slot) ?? []).length;
        if (
          count < target.cardinality.min ||
          count > target.cardinality.max
        ) {
          createdMismatch = true;
        }
      }
      if (createdMismatch) {
        issues.push(graphMismatch(
          "MUTATION_CREATED_FOOTPRINT_MISMATCH",
          "/AuthoringMutation/spec/createdResources",
          "Created resource slot, type, or cardinality differs from the manifest footprint."
        ));
      }

      const allowedHeadSlots = new Set(footprint.activeHeadSlots);
      const actualHeadSlots = new Set(
        mutation.spec.activeHeadChanges.map((change) => change.slot)
      );
      const requiredHeadSlots = footprint.created
        .filter((target) => (
          target.cardinality.min > 0 &&
          allowedHeadSlots.has(target.slot)
        ))
        .map((target) => target.slot);
      let headMismatch = (
        mutation.spec.activeHeadChanges.some(
          (change) => !allowedHeadSlots.has(change.slot)
        ) ||
        requiredHeadSlots.some((slot) => !actualHeadSlots.has(slot))
      );
      for (const change of mutation.spec.activeHeadChanges) {
        const current = workspace?.spec.activeHeads.find(
          (head) => head.slot === change.slot
        )?.reference ?? null;
        const createdReferences = (createdBySlot.get(change.slot) ?? [])
          .map((item) => item.reference);
        if (
          !sameValue(change.before, current) ||
          (
            createdReferences.length > 0 &&
            (
              change.after === null ||
              !createdReferences.some(
                (reference) => sameValue(reference, change.after)
              )
            )
          )
        ) {
          headMismatch = true;
        }
      }
      if (headMismatch) {
        issues.push(graphMismatch(
          "MUTATION_ACTIVE_HEAD_FOOTPRINT_MISMATCH",
          "/AuthoringMutation/spec/activeHeadChanges",
          "Active-head slots or before/after images differ from the manifest footprint and workspace."
        ));
      }

      const allowedSuperseded = footprint.supersededSlots.map(
        (slot) => workspace?.spec.activeHeads.find(
          (head) => head.slot === slot
        )?.reference
      ).filter(Boolean);
      if (mutation.spec.supersededResources.some(
        (reference) => !allowedSuperseded.some(
          (candidate) => sameValue(candidate, reference)
        )
      )) {
        issues.push(graphMismatch(
          "MUTATION_SUPERSESSION_FOOTPRINT_MISMATCH",
          "/AuthoringMutation/spec/supersededResources",
          "Superseded resources differ from the declared workspace slots."
        ));
      }

      const allowedRelations = new Set(footprint.dependencyRelations);
      if (
        [
          ...mutation.spec.dependencyEdges.created,
          ...mutation.spec.dependencyEdges.superseded
        ].some((edge) => !allowedRelations.has(edge.relation))
      ) {
        issues.push(graphMismatch(
          "MUTATION_DEPENDENCY_FOOTPRINT_MISMATCH",
          "/AuthoringMutation/spec/dependencyEdges",
          "Dependency mutation uses a relation outside the manifest footprint."
        ));
      }

      const handoffSlots = new Set(footprint.handoffSlots);
      if (
        mutation.spec.handoffProducts.some((item) => {
          if (!handoffSlots.has(item.slot)) return true;
          const changedHead = mutation.spec.activeHeadChanges.find(
            (candidate) => candidate.slot === item.slot
          )?.after;
          const currentHead = workspace?.spec.activeHeads.find(
            (candidate) => candidate.slot === item.slot
          )?.reference;
          const createdReferences = (createdBySlot.get(item.slot) ?? [])
            .map((created) => created.reference);
          return !(
            (changedHead && sameValue(changedHead, item.reference)) ||
            (currentHead && sameValue(currentHead, item.reference)) ||
            createdReferences.some(
              (reference) => sameValue(reference, item.reference)
            )
          );
        })
      ) {
        issues.push(graphMismatch(
          "MUTATION_HANDOFF_FOOTPRINT_MISMATCH",
          "/AuthoringMutation/spec/handoffProducts",
          "Handoff patch escapes declared slots or references no authorized slot result."
        ));
      }
    }
    mutation.spec.externalCouplings.forEach((coupling, index) => {
      const machine = profile.spec.machineBindings.find(
        (item) => item.machineId === coupling.machineId
      );
      const machineProtocols = [...resources.values()].filter(
        (item) => (
          item.kind === "AuthoringProtocol" &&
          machine &&
          item.metadata.name === machine.protocol.id &&
          resourceSemanticDigest(item) === machine.protocol.digest
        )
      );
      const machineProtocol = machineProtocols.length === 1
        ? machineProtocols[0]
        : undefined;
      if (!machineProtocol) {
        issues.push(graphMismatch(
          "EXTERNAL_MACHINE_PROTOCOL_UNRESOLVED",
          `/AuthoringMutation/spec/externalCouplings/${index}/machineId`,
          "External machine does not resolve exactly one inventory protocol at its profile pin."
        ));
        return;
      }
      const edge = machineProtocol?.spec.transitions.find(
        (item) => item.id === coupling.transitionId
      );
      if (
        !edge ||
        !transitionSourceStates(edge).includes(coupling.fromState) ||
        edge.eventId !== coupling.eventId ||
        edge.toState !== coupling.toState
      ) {
        issues.push(graphMismatch(
          "EXTERNAL_COUPLING_EDGE_MISMATCH",
          `/AuthoringMutation/spec/externalCouplings/${index}`,
          "Coupled edge differs from the pinned external protocol."
        ));
      }
    });
  }
  if (receipt && mutation) {
    const created = mutation.spec.createdResources.map(
      (item) => item.reference
    );
    if (
      !sameValue(receipt.spec.cause, mutation.spec.cause) ||
      !sameValue(receipt.spec.externalCouplings, mutation.spec.externalCouplings) ||
      receipt.spec.mutation.mutationDigest !== mutation.spec.mutationDigest ||
      receipt.spec.before.semanticRevision !==
        mutation.spec.expected.semanticRevision ||
      receipt.spec.before.semanticStateDigest !==
        mutation.spec.expected.semanticStateDigest ||
      !sameValue(receipt.spec.createdResources, created) ||
      !sameValue(receipt.spec.handoffProducts, mutation.spec.handoffProducts)
    ) {
      issues.push(graphMismatch(
        "RECEIPT_MUTATION_ANCESTRY_MISMATCH",
        "/AuthoringCommitReceipt/spec",
        "Receipt cause, result, or before-state differs from its mutation."
      ));
    }
  }
  if (workspace && profile && protocol) {
    if (
      workspace.spec.profile.profileDigest !== profile.spec.profileDigest ||
      workspace.spec.protocol.protocolDigest !== resourceSemanticDigest(protocol)
    ) {
      issues.push(graphMismatch(
        "WORKSPACE_PROFILE_PROTOCOL_MISMATCH",
        "/AuthoringWorkspace/spec",
        "Workspace pins differ from the closed profile or protocol."
      ));
    }
    if (
      workspace.spec.openAssignment !== null &&
      (
        !assignment ||
        workspace.spec.openAssignment.assignmentDigest !==
          assignment.spec.assignmentDigest
      )
    ) {
      issues.push(graphMismatch(
        "WORKSPACE_OPEN_ASSIGNMENT_MISMATCH",
        "/AuthoringWorkspace/spec/openAssignment",
        "Workspace open assignment digest differs from its exact assignment."
      ));
    }
  }
  return Object.freeze(issues);
}
