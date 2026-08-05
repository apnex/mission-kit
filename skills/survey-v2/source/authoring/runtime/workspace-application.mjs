import { canonicalize, stableValue } from "../kernel/canonical.mjs";
import {
  mutationDigest,
  resourceIntegrityDigest,
  resourceReferenceFrom,
  workspaceIntegrityDigest,
  workspaceSemanticStateDigest,
} from "../kernel/digests.mjs";

const digestPattern = /^sha256:[0-9a-f]{64}$/u;

export class AuthoringWorkspaceApplicationError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "AuthoringWorkspaceApplicationError";
    this.code = code;
    for (const [key, value] of Object.entries(details)) this[key] = value;
  }
}

function fail(code, message, details) {
  throw new AuthoringWorkspaceApplicationError(code, message, details);
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function exactKeys(value, required, optional = []) {
  if (!isRecord(value)) return false;
  const actual = Object.keys(value).sort();
  const allowed = [...required, ...optional].sort();
  if (actual.some((key) => !allowed.includes(key))) return false;
  return required.every((key) => Object.hasOwn(value, key));
}

function detached(value, label) {
  try {
    return stableValue(value);
  } catch (error) {
    fail(
      "WORKSPACE_INPUT_NON_CANONICAL",
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

function frozen(value, label = "workspace result") {
  return deepFreeze(detached(value, label));
}

function same(left, right) {
  return canonicalize(left) === canonicalize(right);
}

function assertDigest(value, label) {
  if (typeof value !== "string" || !digestPattern.test(value)) {
    fail("WORKSPACE_DIGEST_INVALID", `${label} must be one sha256 digest`);
  }
}

function referenceKey(reference) {
  return canonicalize(reference);
}

function edgeKey(edge) {
  return canonicalize(edge);
}

function assertReference(reference, label) {
  if (
    !exactKeys(
      reference,
      ["apiVersion", "kind", "name", "semanticDigest"],
    ) ||
    typeof reference.apiVersion !== "string" ||
    typeof reference.kind !== "string" ||
    typeof reference.name !== "string"
  ) {
    fail(
      "WORKSPACE_REFERENCE_INVALID",
      `${label} must be one closed ResourceReference`,
    );
  }
  assertDigest(reference.semanticDigest, `${label}.semanticDigest`);
}

function assertStoredResourceVersion(record, label) {
  if (
    !exactKeys(record, ["reference", "integrityDigest", "resource"]) ||
    !isRecord(record.resource)
  ) {
    fail(
      "WORKSPACE_RESOURCE_VERSION_INVALID",
      `${label} must be one closed StoredResourceVersion`,
    );
  }
  assertReference(record.reference, `${label}.reference`);
  assertDigest(record.integrityDigest, `${label}.integrityDigest`);
  let expectedReference;
  let expectedIntegrity;
  try {
    expectedReference = resourceReferenceFrom(record.resource);
    expectedIntegrity = resourceIntegrityDigest(record.resource);
  } catch (error) {
    fail(
      "WORKSPACE_RESOURCE_VERSION_INVALID",
      `${label} contains an invalid resource: ${error.message}`,
    );
  }
  if (!same(record.reference, expectedReference)) {
    fail(
      "WORKSPACE_RESOURCE_REFERENCE_MISMATCH",
      `${label}.reference differs from the immutable resource identity`,
    );
  }
  if (record.integrityDigest !== expectedIntegrity) {
    fail(
      "WORKSPACE_RESOURCE_INTEGRITY_MISMATCH",
      `${label}.integrityDigest differs from the complete resource bytes`,
    );
  }
}

function normalizeStoredResourceVersion(record, label) {
  const stable = detached(record, label);
  if (
    exactKeys(
      stable,
      ["slot", "reference", "integrityDigest", "resource"],
    )
  ) {
    delete stable.slot;
  }
  assertStoredResourceVersion(stable, label);
  return stable;
}

export function storedResourceVersionFromResource(resource) {
  const stable = detached(resource, "resource");
  const result = {
    reference: resourceReferenceFrom(stable),
    integrityDigest: resourceIntegrityDigest(stable),
    resource: stable,
  };
  assertStoredResourceVersion(result, "stored resource version");
  return frozen(result, "stored resource version");
}

function assertWorkspace(workspace) {
  const specFields = [
    "profile",
    "protocol",
    "authoringState",
    "semanticRevision",
    "evidenceRevision",
    "resourceVersions",
    "activeHeads",
    "dependencyEdges",
    "handoffProducts",
    "history",
    "openAssignment",
    "integrity",
  ];
  if (
    !isRecord(workspace) ||
    !exactKeys(
      workspace,
      ["apiVersion", "kind", "metadata", "spec"],
    ) ||
    workspace.apiVersion !== "authoring.mission-kit/v1alpha1" ||
    workspace.kind !== "AuthoringWorkspace" ||
    !isRecord(workspace.metadata) ||
    !isRecord(workspace.spec) ||
    !exactKeys(workspace.spec, specFields)
  ) {
    fail(
      "WORKSPACE_INVALID",
      "workspace must be one AuthoringWorkspace resource",
    );
  }
  if (
    !Number.isInteger(workspace.spec.semanticRevision) ||
    workspace.spec.semanticRevision < 0 ||
    !Number.isInteger(workspace.spec.evidenceRevision) ||
    workspace.spec.evidenceRevision < 0 ||
    !Array.isArray(workspace.spec.resourceVersions) ||
    !Array.isArray(workspace.spec.activeHeads) ||
    !Array.isArray(workspace.spec.dependencyEdges) ||
    !Array.isArray(workspace.spec.handoffProducts) ||
    !Array.isArray(workspace.spec.history) ||
    !isRecord(workspace.spec.integrity) ||
    !exactKeys(
      workspace.spec.integrity,
      ["semanticStateDigest", "workspaceIntegrityDigest"],
    )
  ) {
    fail("WORKSPACE_INVALID", "workspace has an invalid closed state shape");
  }
  const expectedSemantic = workspaceSemanticStateDigest(workspace);
  if (workspace.spec.integrity.semanticStateDigest !== expectedSemantic) {
    fail(
      "WORKSPACE_SEMANTIC_INTEGRITY_MISMATCH",
      "workspace semanticStateDigest does not seal its complete semantic state",
    );
  }
  const expectedIntegrity = workspaceIntegrityDigest(workspace);
  if (workspace.spec.integrity.workspaceIntegrityDigest !== expectedIntegrity) {
    fail(
      "WORKSPACE_INTEGRITY_MISMATCH",
      "workspaceIntegrityDigest does not seal the complete workspace",
    );
  }
  buildInventoryIndex(workspace.spec.resourceVersions);
  assertUniqueSlots(workspace.spec.activeHeads, "activeHeads");
  assertUniqueSlots(workspace.spec.handoffProducts, "handoffProducts");
  assertUniqueEdges(workspace.spec.dependencyEdges, "dependencyEdges");
  assertUniqueReferences(workspace.spec.history, "history");
}

function buildInventoryIndex(resourceVersions) {
  const index = new Map();
  resourceVersions.forEach((record, ordinal) => {
    assertStoredResourceVersion(
      record,
      `workspace resourceVersions[${ordinal}]`,
    );
    const key = referenceKey(record.reference);
    if (index.has(key)) {
      fail(
        "WORKSPACE_RESOURCE_VERSION_DUPLICATE",
        `resourceVersions contains duplicate exact reference ${record.reference.name}`,
      );
    }
    index.set(key, record);
  });
  return index;
}

function assertUniqueSlots(records, label) {
  const seen = new Set();
  records.forEach((record, index) => {
    if (
      !exactKeys(record, ["slot", "reference"]) ||
      typeof record.slot !== "string" ||
      record.slot.length === 0
    ) {
      fail(
        "WORKSPACE_SLOT_REFERENCE_INVALID",
        `${label}[${index}] must be one closed SlotReference`,
      );
    }
    assertReference(record.reference, `${label}[${index}].reference`);
    if (seen.has(record.slot)) {
      fail(
        "WORKSPACE_SLOT_DUPLICATE",
        `${label} contains duplicate slot ${record.slot}`,
      );
    }
    seen.add(record.slot);
  });
}

function assertUniqueEdges(edges, label) {
  const seen = new Set();
  edges.forEach((edge, index) => {
    if (
      !exactKeys(edge, ["from", "to", "relation"]) ||
      typeof edge.relation !== "string" ||
      edge.relation.length === 0
    ) {
      fail(
        "WORKSPACE_DEPENDENCY_EDGE_INVALID",
        `${label}[${index}] must be one closed DependencyEdge`,
      );
    }
    assertReference(edge.from, `${label}[${index}].from`);
    assertReference(edge.to, `${label}[${index}].to`);
    const key = edgeKey(edge);
    if (seen.has(key)) {
      fail(
        "WORKSPACE_DEPENDENCY_EDGE_DUPLICATE",
        `${label} contains a duplicate dependency edge`,
      );
    }
    seen.add(key);
  });
}

function assertUniqueReferences(references, label) {
  const seen = new Set();
  references.forEach((reference, index) => {
    assertReference(reference, `${label}[${index}]`);
    const key = referenceKey(reference);
    if (seen.has(key)) {
      fail(
        "WORKSPACE_HISTORY_DUPLICATE",
        `${label} contains a duplicate exact reference`,
      );
    }
    seen.add(key);
  });
}

function appendResourceVersions(workspace, records) {
  const index = buildInventoryIndex(workspace.spec.resourceVersions);
  records.forEach((candidate, ordinal) => {
    const record = normalizeStoredResourceVersion(
      candidate,
      `retainedResourceVersions[${ordinal}]`,
    );
    const key = referenceKey(record.reference);
    const existing = index.get(key);
    if (existing) {
      if (!same(existing, record)) {
        fail(
          "RESOURCE_VERSION_IMMUTABILITY_VIOLATION",
          `exact resource reference ${record.reference.name} already has different integrity or bytes`,
        );
      }
      return;
    }
    workspace.spec.resourceVersions.push(record);
    index.set(key, record);
  });
  return index;
}

function appendHistory(workspace, references, inventory) {
  assertUniqueReferences(workspace.spec.history, "workspace history");
  const existing = new Set(workspace.spec.history.map(referenceKey));
  const pending = new Set();
  references.forEach((reference, index) => {
    assertReference(reference, `historyReferences[${index}]`);
    const key = referenceKey(reference);
    if (pending.has(key)) {
      fail(
        "WORKSPACE_HISTORY_APPEND_DUPLICATE",
        "one transaction cannot append the same history reference twice",
      );
    }
    pending.add(key);
    if (!inventory.has(key)) {
      fail(
        "WORKSPACE_HISTORY_REFERENCE_UNRESOLVED",
        `history reference ${reference.name} has no retained immutable version`,
      );
    }
    if (!existing.has(key)) {
      workspace.spec.history.push(reference);
      existing.add(key);
    }
  });
}

function assertOpenAssignment(binding, inventory, label) {
  if (binding === null) return;
  if (
    !exactKeys(binding, ["reference", "assignmentDigest"]) ||
    binding.reference.kind !== "AuthoringAssignment"
  ) {
    fail(
      "WORKSPACE_OPEN_ASSIGNMENT_INVALID",
      `${label} must be null or one closed AuthoringAssignment binding`,
    );
  }
  assertReference(binding.reference, `${label}.reference`);
  assertDigest(binding.assignmentDigest, `${label}.assignmentDigest`);
  const stored = inventory.get(referenceKey(binding.reference));
  if (!stored) {
    fail(
      "WORKSPACE_OPEN_ASSIGNMENT_UNRESOLVED",
      `${label} does not resolve to a retained Assignment`,
    );
  }
  if (
    stored.resource.kind !== "AuthoringAssignment" ||
    stored.resource.spec?.assignmentDigest !== binding.assignmentDigest
  ) {
    fail(
      "WORKSPACE_OPEN_ASSIGNMENT_MISMATCH",
      `${label} differs from its retained Assignment identity`,
    );
  }
}

function assertReferenceClosure(workspace, inventory) {
  const references = [];
  workspace.spec.activeHeads.forEach((head) => references.push(head.reference));
  workspace.spec.handoffProducts.forEach((item) => references.push(item.reference));
  workspace.spec.dependencyEdges.forEach((edge) => {
    references.push(edge.from, edge.to);
  });
  workspace.spec.history.forEach((reference) => references.push(reference));
  if (workspace.spec.openAssignment !== null) {
    references.push(workspace.spec.openAssignment.reference);
  }
  for (const reference of references) {
    if (!inventory.has(referenceKey(reference))) {
      fail(
        "WORKSPACE_REFERENCE_UNRESOLVED",
        `workspace reference ${reference.name} has no retained immutable version`,
      );
    }
  }
  assertOpenAssignment(
    workspace.spec.openAssignment,
    inventory,
    "workspace openAssignment",
  );
}

export function validateAuthoringWorkspace(workspace) {
  const stable = detached(workspace, "workspace");
  assertWorkspace(stable);
  assertReferenceClosure(
    stable,
    buildInventoryIndex(stable.spec.resourceVersions),
  );
  return frozen(stable, "validated Workspace");
}

function assertMutation(mutation, workspace) {
  if (
    !isRecord(mutation) ||
    mutation.apiVersion !== "authoring.mission-kit/v1alpha1" ||
    mutation.kind !== "AuthoringMutation" ||
    !isRecord(mutation.spec)
  ) {
    fail(
      "WORKSPACE_MUTATION_INVALID",
      "mutation must be one AuthoringMutation resource",
    );
  }
  let expectedDigest;
  try {
    expectedDigest = mutationDigest(mutation);
  } catch (error) {
    fail(
      "WORKSPACE_MUTATION_INVALID",
      `mutation identity cannot be derived: ${error.message}`,
    );
  }
  if (mutation.spec.mutationDigest !== expectedDigest) {
    fail(
      "WORKSPACE_MUTATION_DIGEST_MISMATCH",
      "mutationDigest differs from the exact AuthoringMutation",
    );
  }
  if (
    !same(mutation.spec.expected, {
      authoringState: workspace.spec.authoringState,
      semanticRevision: workspace.spec.semanticRevision,
      semanticStateDigest: workspace.spec.integrity.semanticStateDigest,
    })
  ) {
    fail(
      "WORKSPACE_MUTATION_STALE",
      "mutation expected state differs from the locked Workspace",
    );
  }
  if (
    !Array.isArray(mutation.spec.createdResources) ||
    !Array.isArray(mutation.spec.activeHeadChanges) ||
    !Array.isArray(mutation.spec.supersededResources) ||
    !isRecord(mutation.spec.dependencyEdges) ||
    !Array.isArray(mutation.spec.dependencyEdges.created) ||
    !Array.isArray(mutation.spec.dependencyEdges.superseded) ||
    !Array.isArray(mutation.spec.handoffProducts) ||
    !Array.isArray(mutation.spec.externalCouplings) ||
    typeof mutation.spec.nextAuthoringState !== "string"
  ) {
    fail(
      "WORKSPACE_MUTATION_INVALID",
      "mutation does not contain the closed K12 post-image plan",
    );
  }
  if (mutation.spec.cause?.class === "task-submission") {
    if (
      workspace.spec.openAssignment === null ||
      !same(
        workspace.spec.openAssignment,
        mutation.spec.cause.assignment,
      )
    ) {
      fail(
        "WORKSPACE_ASSIGNMENT_STALE",
        "task mutation does not consume the exact locked open Assignment",
      );
    }
  }
}

function applyActiveHeadChanges(workspace, changes) {
  assertUniqueSlots(workspace.spec.activeHeads, "workspace activeHeads");
  const seen = new Set();
  changes.forEach((change, ordinal) => {
    if (
      !exactKeys(change, ["slot", "before", "after"]) ||
      typeof change.slot !== "string" ||
      change.slot.length === 0 ||
      !(
        change.before === null ||
        isRecord(change.before)
      ) ||
      !(
        change.after === null ||
        isRecord(change.after)
      )
    ) {
      fail(
        "ACTIVE_HEAD_CHANGE_INVALID",
        `activeHeadChanges[${ordinal}] is not one closed change`,
      );
    }
    if (seen.has(change.slot)) {
      fail(
        "ACTIVE_HEAD_CHANGE_DUPLICATE",
        `activeHeadChanges repeats slot ${change.slot}`,
      );
    }
    seen.add(change.slot);
    if (change.before !== null) {
      assertReference(
        change.before,
        `activeHeadChanges[${ordinal}].before`,
      );
    }
    if (change.after !== null) {
      assertReference(
        change.after,
        `activeHeadChanges[${ordinal}].after`,
      );
    }
    const index = workspace.spec.activeHeads.findIndex(
      (head) => head.slot === change.slot,
    );
    const current = index < 0
      ? null
      : workspace.spec.activeHeads[index].reference;
    if (!same(current, change.before)) {
      fail(
        "ACTIVE_HEAD_BEFORE_MISMATCH",
        `active head ${change.slot} differs from its declared before-reference`,
      );
    }
    if (change.after === null) {
      if (index >= 0) workspace.spec.activeHeads.splice(index, 1);
    } else if (index >= 0) {
      workspace.spec.activeHeads[index] = {
        slot: change.slot,
        reference: change.after,
      };
    } else {
      workspace.spec.activeHeads.push({
        slot: change.slot,
        reference: change.after,
      });
    }
  });
}

function applyDependencyEdges(workspace, changes) {
  assertUniqueEdges(workspace.spec.dependencyEdges, "workspace dependencyEdges");
  assertUniqueEdges(changes.created, "created dependencyEdges");
  assertUniqueEdges(changes.superseded, "superseded dependencyEdges");
  const createdKeys = new Set(changes.created.map(edgeKey));
  for (const edge of changes.superseded) {
    if (createdKeys.has(edgeKey(edge))) {
      fail(
        "DEPENDENCY_EDGE_CHANGE_OVERLAP",
        "one dependency edge cannot be both created and superseded",
      );
    }
  }
  for (const edge of changes.superseded) {
    const key = edgeKey(edge);
    const matches = workspace.spec.dependencyEdges
      .map((candidate, index) => ({ candidate, index }))
      .filter(({ candidate }) => edgeKey(candidate) === key);
    if (matches.length !== 1) {
      fail(
        "DEPENDENCY_EDGE_SUPERSEDED_MISMATCH",
        "each superseded dependency edge must select exactly one locked edge",
      );
    }
    workspace.spec.dependencyEdges.splice(matches[0].index, 1);
  }
  const remaining = new Set(workspace.spec.dependencyEdges.map(edgeKey));
  for (const edge of changes.created) {
    const key = edgeKey(edge);
    if (remaining.has(key)) {
      fail(
        "DEPENDENCY_EDGE_CREATED_DUPLICATE",
        "a created dependency edge already exists in the post-image",
      );
    }
    workspace.spec.dependencyEdges.push(edge);
    remaining.add(key);
  }
}

function applyHandoffProducts(workspace, handoffSlots, products) {
  if (!Array.isArray(handoffSlots)) {
    fail(
      "HANDOFF_SELECTION_INVALID",
      "handoffSlots must be the manifest-selected ordered slot list",
    );
  }
  const selected = new Set();
  handoffSlots.forEach((slot, index) => {
    if (typeof slot !== "string" || slot.length === 0) {
      fail(
        "HANDOFF_SELECTION_INVALID",
        `handoffSlots[${index}] must be a non-empty slot`,
      );
    }
    if (selected.has(slot)) {
      fail(
        "HANDOFF_SELECTION_DUPLICATE",
        `handoffSlots repeats selected slot ${slot}`,
      );
    }
    selected.add(slot);
  });
  assertUniqueSlots(workspace.spec.handoffProducts, "workspace handoffProducts");
  assertUniqueSlots(products, "mutation handoffProducts");
  for (const product of products) {
    if (!selected.has(product.slot)) {
      fail(
        "HANDOFF_PRODUCT_UNSELECTED",
        `mutation handoff slot ${product.slot} is outside manifest authority`,
      );
    }
  }
  workspace.spec.handoffProducts = [
    ...workspace.spec.handoffProducts.filter(
      (product) => !selected.has(product.slot),
    ),
    ...products,
  ];
}

function assertMutationPostImage(workspace, mutation, inventory) {
  assertReferenceClosure(workspace, inventory);
  for (const superseded of mutation.spec.supersededResources) {
    assertReference(superseded, "mutation supersededResources reference");
    if (!inventory.has(referenceKey(superseded))) {
      fail(
        "SUPERSEDED_RESOURCE_UNRESOLVED",
        `superseded resource ${superseded.name} is not retained`,
      );
    }
    if (
      workspace.spec.activeHeads.some(
        (head) => same(head.reference, superseded),
      )
    ) {
      fail(
        "SUPERSEDED_RESOURCE_ACTIVE",
        `superseded resource ${superseded.name} remains an active head`,
      );
    }
  }
  for (const handoff of mutation.spec.handoffProducts) {
    const active = workspace.spec.activeHeads.find(
      (head) => head.slot === handoff.slot,
    );
    if (!active || !same(active.reference, handoff.reference)) {
      fail(
        "HANDOFF_ACTIVE_HEAD_MISMATCH",
        `handoff ${handoff.slot} does not equal its semantic active head`,
      );
    }
  }
}

export function workspaceRevisionState(workspace) {
  const stable = detached(workspace, "workspace");
  assertWorkspace(stable);
  return frozen({
    semanticRevision: stable.spec.semanticRevision,
    evidenceRevision: stable.spec.evidenceRevision,
    semanticStateDigest: stable.spec.integrity.semanticStateDigest,
  }, "workspace revision state");
}

export function resealWorkspace(workspace) {
  const next = detached(workspace, "workspace to reseal");
  if (
    !isRecord(next?.spec) ||
    !isRecord(next.spec.integrity)
  ) {
    fail(
      "WORKSPACE_INVALID",
      "workspace to reseal has no integrity record",
    );
  }
  next.spec.integrity.semanticStateDigest =
    workspaceSemanticStateDigest(next);
  next.spec.integrity.workspaceIntegrityDigest =
    workspaceIntegrityDigest(next);
  return frozen(next);
}

function appendedSuffix(before, after, label) {
  if (!Array.isArray(before) || !Array.isArray(after)) {
    fail(
      "WORKSPACE_EFFECT_INVALID",
      `${label} must be represented by ordered arrays`,
    );
  }
  if (
    after.length < before.length ||
    before.some((value, index) => !same(value, after[index]))
  ) {
    fail(
      "WORKSPACE_EFFECT_NOT_APPEND_ONLY",
      `${label} changed or removed a retained prefix`,
    );
  }
  return after.slice(before.length);
}

/**
 * Derive the only persistence boundary admitted to one JournalRecord.
 *
 * The result intentionally carries immutable resource identities/integrities
 * rather than resource bytes. The JournalRecord digest binds this effect,
 * while replay resolves every binding against the terminal Workspace. History
 * and resourceVersions are append-only; openAssignment is an exact boundary.
 */
export function deriveWorkspaceCommitBoundary({
  beforeWorkspace,
  afterWorkspace,
  handoffSlots = [],
}) {
  const before = detached(beforeWorkspace, "before Workspace");
  const after = detached(afterWorkspace, "after Workspace");
  const stableHandoffSlots = detached(
    handoffSlots,
    "Workspace handoff scope",
  );
  if (
    !Array.isArray(stableHandoffSlots) ||
    stableHandoffSlots.some(
      (slot) => typeof slot !== "string" || slot.length === 0,
    ) ||
    new Set(stableHandoffSlots).size !== stableHandoffSlots.length
  ) {
    fail(
      "WORKSPACE_EFFECT_INVALID",
      "Workspace handoff scope must be one ordered unique slot array",
    );
  }
  assertWorkspace(before);
  assertWorkspace(after);
  const retained = appendedSuffix(
    before.spec.resourceVersions,
    after.spec.resourceVersions,
    "Workspace resourceVersions",
  );
  const historyReferences = appendedSuffix(
    before.spec.history,
    after.spec.history,
    "Workspace history",
  );
  const workspaceEffect = {
    retainedResources: retained.map((stored) => ({
      reference: stored.reference,
      integrityDigest: stored.integrityDigest,
    })),
    historyReferences,
    openAssignment: {
      before: before.spec.openAssignment,
      after: after.spec.openAssignment,
    },
    activeHeads: {
      before: before.spec.activeHeads,
      after: after.spec.activeHeads,
    },
    dependencyEdges: {
      before: before.spec.dependencyEdges,
      after: after.spec.dependencyEdges,
    },
    handoffProducts: {
      before: before.spec.handoffProducts,
      after: after.spec.handoffProducts,
    },
    handoffSlots: stableHandoffSlots,
  };
  return frozen({
    beforeWorkspaceIntegrityDigest:
      before.spec.integrity.workspaceIntegrityDigest,
    afterWorkspaceIntegrityDigest:
      after.spec.integrity.workspaceIntegrityDigest,
    workspaceEffect,
  }, "Workspace commit boundary");
}

export function retainWorkspaceEvidence(options) {
  const stableOptions = detached(options, "retainWorkspaceEvidence options");
  if (
    !exactKeys(
      stableOptions,
      ["workspace"],
      ["retainedResourceVersions", "historyReferences"],
    )
  ) {
    fail(
      "WORKSPACE_APPLICATION_OPTIONS_INVALID",
      "retainWorkspaceEvidence accepts only workspace, retainedResourceVersions, and historyReferences",
    );
  }
  const workspace = stableOptions.workspace;
  const retainedResourceVersions =
    stableOptions.retainedResourceVersions ?? [];
  const historyReferences = stableOptions.historyReferences ?? [];
  if (
    !Array.isArray(retainedResourceVersions) ||
    !Array.isArray(historyReferences)
  ) {
    fail(
      "WORKSPACE_APPLICATION_OPTIONS_INVALID",
      "retainedResourceVersions and historyReferences must be arrays",
    );
  }
  assertWorkspace(workspace);
  const before = workspaceRevisionState(workspace);
  const next = detached(workspace, "workspace");
  const inventory = appendResourceVersions(next, retainedResourceVersions);
  appendHistory(next, historyReferences, inventory);
  assertReferenceClosure(next, inventory);
  const result = resealWorkspace(next);
  const after = workspaceRevisionState(result);
  if (!same(before, after)) {
    fail(
      "WORKSPACE_EVIDENCE_RETENTION_CHANGED_REVISION",
      "evidence retention during one transaction cannot increment revisions",
    );
  }
  return result;
}

export function applyEvidenceWorkspace(options) {
  const stableOptions = detached(options, "applyEvidenceWorkspace options");
  if (
    !exactKeys(
      stableOptions,
      ["workspace", "openAssignmentAfter"],
      ["retainedResourceVersions", "historyReferences"],
    )
  ) {
    fail(
      "WORKSPACE_APPLICATION_OPTIONS_INVALID",
      "applyEvidenceWorkspace requires workspace and openAssignmentAfter",
    );
  }
  const workspace = stableOptions.workspace;
  const retainedResourceVersions =
    stableOptions.retainedResourceVersions ?? [];
  const historyReferences = stableOptions.historyReferences ?? [];
  if (
    !Array.isArray(retainedResourceVersions) ||
    !Array.isArray(historyReferences)
  ) {
    fail(
      "WORKSPACE_APPLICATION_OPTIONS_INVALID",
      "retainedResourceVersions and historyReferences must be arrays",
    );
  }
  assertWorkspace(workspace);
  const beforeSemanticRevision = workspace.spec.semanticRevision;
  const beforeSemanticDigest =
    workspace.spec.integrity.semanticStateDigest;
  const next = detached(workspace, "workspace");
  const inventory = appendResourceVersions(next, retainedResourceVersions);
  appendHistory(next, historyReferences, inventory);
  next.spec.openAssignment = stableOptions.openAssignmentAfter;
  assertOpenAssignment(
    next.spec.openAssignment,
    inventory,
    "openAssignmentAfter",
  );
  next.spec.evidenceRevision += 1;
  const result = resealWorkspace(next);
  if (
    result.spec.semanticRevision !== beforeSemanticRevision ||
    result.spec.integrity.semanticStateDigest !== beforeSemanticDigest
  ) {
    fail(
      "EVIDENCE_COMMIT_SEMANTIC_CHANGE",
      "an evidence-only workspace post-image changed semantic state",
    );
  }
  assertReferenceClosure(result, buildInventoryIndex(result.spec.resourceVersions));
  return result;
}

export function applyTransitionWorkspace(options) {
  const stableOptions = detached(options, "applyTransitionWorkspace options");
  if (
    !exactKeys(
      stableOptions,
      ["workspace", "mutation", "handoffSlots"],
      ["retainedResourceVersions", "historyReferences"],
    )
  ) {
    fail(
      "WORKSPACE_APPLICATION_OPTIONS_INVALID",
      "applyTransitionWorkspace requires workspace, mutation, and handoffSlots",
    );
  }
  const workspace = stableOptions.workspace;
  const mutation = stableOptions.mutation;
  const retainedResourceVersions =
    stableOptions.retainedResourceVersions ?? [];
  const historyReferences = stableOptions.historyReferences ?? [];
  if (
    !Array.isArray(retainedResourceVersions) ||
    !Array.isArray(historyReferences)
  ) {
    fail(
      "WORKSPACE_APPLICATION_OPTIONS_INVALID",
      "retainedResourceVersions and historyReferences must be arrays",
    );
  }
  assertWorkspace(workspace);
  assertMutation(mutation, workspace);
  const next = detached(workspace, "workspace");
  const inventory = appendResourceVersions(next, [
    ...mutation.spec.createdResources,
    ...retainedResourceVersions,
  ]);
  applyActiveHeadChanges(next, mutation.spec.activeHeadChanges);
  applyDependencyEdges(next, mutation.spec.dependencyEdges);
  applyHandoffProducts(
    next,
    stableOptions.handoffSlots,
    mutation.spec.handoffProducts,
  );
  appendHistory(next, [
    ...mutation.spec.supersededResources,
    ...historyReferences,
  ], inventory);
  next.spec.authoringState = mutation.spec.nextAuthoringState;
  next.spec.semanticRevision += 1;
  next.spec.evidenceRevision += 1;
  next.spec.openAssignment = null;
  assertMutationPostImage(next, mutation, inventory);
  const result = resealWorkspace(next);
  if (
    result.spec.semanticRevision !== workspace.spec.semanticRevision + 1 ||
    result.spec.evidenceRevision !== workspace.spec.evidenceRevision + 1 ||
    result.spec.integrity.semanticStateDigest ===
      workspace.spec.integrity.semanticStateDigest
  ) {
    fail(
      "TRANSITION_REVISION_INVALID",
      "accepted transition must increment both revisions and reseal semantic state",
    );
  }
  return result;
}
