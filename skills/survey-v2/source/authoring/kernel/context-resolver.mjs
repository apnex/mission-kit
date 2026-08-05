import { canonicalize, stableValue } from "./canonical.mjs";
import {
  contextClosureDigest,
  contextSelectorDigest
} from "./digests.mjs";
import {
  AuthoringContextResolutionError,
  createStoredResourceVersionResolverFromSnapshot,
  evaluateLifecycleRule,
  projectSelectedValue,
  resolveJsonPointer,
  resolveStoredResourceVersion
} from "./resource-resolution.mjs";

export {
  AuthoringContextResolutionError,
  evaluateLifecycleRule,
  projectSelectedValue,
  resolveJsonPointer,
  resolveStoredResourceVersion
};

const ZERO_DIGEST = `sha256:${"0".repeat(64)}`;
const digestPattern = /^sha256:[0-9a-f]{64}$/u;
const apiVersionPattern =
  /^[a-z][a-z0-9.-]*\/v[0-9]+(?:alpha[0-9]+|beta[0-9]+)?$/u;
const kindPattern = /^[A-Z][A-Za-z0-9]*$/u;
const resourceNamePattern =
  /^[a-z0-9](?:[-a-z0-9]*[a-z0-9])?(?:\.[a-z0-9](?:[-a-z0-9]*[a-z0-9])?)*$/u;
const semanticIdPattern =
  /^[a-z][a-z0-9]*(?:[._:/-][a-z0-9]+)*$/u;
const roleIdPattern =
  /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/u;
const slotIdPattern =
  /^[a-z][a-z0-9]*(?:[._/-][a-z0-9]+)*$/u;
const fieldIdPattern =
  /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/u;
const lifecycleStatePattern = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/u;
const jsonPointerPattern = /^(?:\/(?:[^~/]|~0|~1)*)*$/u;

function fail(code, field, reason) {
  throw new AuthoringContextResolutionError(code, field, reason);
}

function isRecord(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function deepFreeze(value) {
  if (value === null || typeof value !== "object") return value;
  const pending = [value];
  while (pending.length > 0) {
    const current = pending.pop();
    if (Object.isFrozen(current)) continue;
    for (const key of Object.keys(current)) {
      const child = current[key];
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

function canonicalSnapshot(value, field, label) {
  try {
    return deepFreeze(stableValue(value));
  } catch (error) {
    fail(
      "CONTEXT_INPUT_NON_CANONICAL",
      field,
      `${label} must be one canonical JSON value: ${error.message}`
    );
  }
}

function escapePointerToken(value) {
  return value.replaceAll("~", "~0").replaceAll("/", "~1");
}

function compareUtf8(left, right) {
  return Buffer.compare(
    Buffer.from(left, "utf8"),
    Buffer.from(right, "utf8")
  );
}

function assertExactKeys(
  value,
  required,
  optional,
  field,
  code,
  label
) {
  if (!isRecord(value)) {
    fail(code, field, `${label} must be a closed object.`);
  }
  const allowed = new Set([...required, ...optional]);
  const missing = required.filter((key) => !Object.hasOwn(value, key));
  if (missing.length > 0) {
    fail(
      code,
      `${field}/${missing[0]}`,
      `${label} is missing required field ${missing[0]}.`
    );
  }
  const ambient = Object.keys(value)
    .filter((key) => !allowed.has(key))
    .sort(compareUtf8);
  if (ambient.length > 0) {
    fail(
      code,
      `${field}/${escapePointerToken(ambient[0])}`,
      `${label} contains ambient field ${ambient[0]}.`
    );
  }
}

function assertBoundedPattern(
  value,
  {
    code,
    field,
    label,
    maximum,
    minimum = 1,
    pattern
  }
) {
  if (
    typeof value !== "string" ||
    value.length < minimum ||
    value.length > maximum ||
    !pattern.test(value)
  ) {
    fail(code, field, `${label} is invalid.`);
  }
}

function assertDigest(value, field, code, label) {
  if (typeof value !== "string" || !digestPattern.test(value)) {
    fail(code, field, `${label} must be one canonical sha256 digest.`);
  }
}

function assertReference(reference, field) {
  assertExactKeys(
    reference,
    ["apiVersion", "kind", "name", "semanticDigest"],
    [],
    field,
    "RESOURCE_REFERENCE_INVALID",
    "Resource reference"
  );
  assertBoundedPattern(reference.apiVersion, {
    code: "RESOURCE_REFERENCE_INVALID",
    field: `${field}/apiVersion`,
    label: "Resource reference apiVersion",
    maximum: 128,
    minimum: 3,
    pattern: apiVersionPattern
  });
  assertBoundedPattern(reference.kind, {
    code: "RESOURCE_REFERENCE_INVALID",
    field: `${field}/kind`,
    label: "Resource reference kind",
    maximum: 80,
    pattern: kindPattern
  });
  assertBoundedPattern(reference.name, {
    code: "RESOURCE_REFERENCE_INVALID",
    field: `${field}/name`,
    label: "Resource reference name",
    maximum: 253,
    pattern: resourceNamePattern
  });
  assertDigest(
    reference.semanticDigest,
    `${field}/semanticDigest`,
    "RESOURCE_REFERENCE_INVALID",
    "Resource reference semanticDigest"
  );
}

function assertMetadata(metadata, field) {
  assertExactKeys(
    metadata,
    ["name"],
    ["annotations", "labels"],
    field,
    "AUTHORING_WORKSPACE_INVALID",
    "AuthoringWorkspace metadata"
  );
  assertBoundedPattern(metadata.name, {
    code: "AUTHORING_WORKSPACE_INVALID",
    field: `${field}/name`,
    label: "AuthoringWorkspace metadata.name",
    maximum: 253,
    pattern: resourceNamePattern
  });
}

function assertWorkspace(workspace) {
  assertExactKeys(
    workspace,
    ["apiVersion", "kind", "metadata", "spec"],
    [],
    "/workspace",
    "AUTHORING_WORKSPACE_INVALID",
    "AuthoringWorkspace"
  );
  if (
    workspace.apiVersion !== "authoring.mission-kit/v1alpha1" ||
    workspace.kind !== "AuthoringWorkspace"
  ) {
    fail(
      "AUTHORING_WORKSPACE_INVALID",
      "/workspace",
      "Context resolution requires one authoring.mission-kit/v1alpha1 AuthoringWorkspace."
    );
  }
  assertMetadata(workspace.metadata, "/workspace/metadata");
  assertExactKeys(
    workspace.spec,
    [
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
      "integrity"
    ],
    [],
    "/workspace/spec",
    "AUTHORING_WORKSPACE_INVALID",
    "AuthoringWorkspace spec"
  );
  if (
    !Array.isArray(workspace.spec.resourceVersions) ||
    workspace.spec.resourceVersions.length > 16384
  ) {
    fail(
      "AUTHORING_WORKSPACE_INVALID",
      "/workspace/spec/resourceVersions",
      "AuthoringWorkspace resourceVersions must be one bounded array."
    );
  }
  if (
    !Array.isArray(workspace.spec.activeHeads) ||
    workspace.spec.activeHeads.length > 4096
  ) {
    fail(
      "AUTHORING_WORKSPACE_INVALID",
      "/workspace/spec/activeHeads",
      "AuthoringWorkspace activeHeads must be one bounded array."
    );
  }

  const slots = new Set();
  workspace.spec.activeHeads.forEach((head, index) => {
    const field = `/workspace/spec/activeHeads/${index}`;
    assertExactKeys(
      head,
      ["slot", "reference"],
      [],
      field,
      "ACTIVE_HEAD_INVALID",
      "Active-head record"
    );
    assertBoundedPattern(head.slot, {
      code: "ACTIVE_HEAD_INVALID",
      field: `${field}/slot`,
      label: "Active-head slot",
      maximum: 120,
      pattern: slotIdPattern
    });
    assertReference(head.reference, `${field}/reference`);
    if (slots.has(head.slot)) {
      fail(
        "ACTIVE_HEAD_SLOT_DUPLICATE",
        field,
        `Active-head slot ${head.slot} is duplicated.`
      );
    }
    slots.add(head.slot);
  });
}

function assertRequestInputs(requestInputs) {
  if (!isRecord(requestInputs)) {
    fail(
      "REQUEST_INPUTS_INVALID",
      "/requestInputs",
      "Request inputs must be one closed reference map."
    );
  }
  const inputKeys = Object.keys(requestInputs).sort(compareUtf8);
  if (inputKeys.length > 64) {
    fail(
      "REQUEST_INPUTS_INVALID",
      "/requestInputs",
      "Request inputs exceed their closed bound."
    );
  }
  for (const inputKey of inputKeys) {
    assertBoundedPattern(inputKey, {
      code: "REQUEST_INPUTS_INVALID",
      field: `/requestInputs/${escapePointerToken(inputKey)}`,
      label: "Request input key",
      maximum: 80,
      pattern: fieldIdPattern
    });
    assertReference(
      requestInputs[inputKey],
      `/requestInputs/${escapePointerToken(inputKey)}`
    );
  }
}

function assertResourceType(resourceType, field) {
  assertExactKeys(
    resourceType,
    ["apiVersion", "kind"],
    [],
    field,
    "CONTEXT_SELECTOR_INVALID",
    "Context selector resourceType"
  );
  assertBoundedPattern(resourceType.apiVersion, {
    code: "CONTEXT_SELECTOR_INVALID",
    field: `${field}/apiVersion`,
    label: "Context selector resourceType apiVersion",
    maximum: 128,
    minimum: 3,
    pattern: apiVersionPattern
  });
  assertBoundedPattern(resourceType.kind, {
    code: "CONTEXT_SELECTOR_INVALID",
    field: `${field}/kind`,
    label: "Context selector resourceType kind",
    maximum: 80,
    pattern: kindPattern
  });
}

function assertCardinality(cardinality, field) {
  assertExactKeys(
    cardinality,
    ["min", "max"],
    [],
    field,
    "CONTEXT_SELECTOR_CARDINALITY_INVALID",
    "Context selector cardinality"
  );
  if (
    !Number.isInteger(cardinality.min) ||
    !Number.isInteger(cardinality.max) ||
    cardinality.min < 0 ||
    cardinality.max > 1 ||
    cardinality.min > cardinality.max
  ) {
    fail(
      "CONTEXT_SELECTOR_CARDINALITY_INVALID",
      field,
      "Context selector cardinality must be a non-inverted interval within zero through one."
    );
  }
}

function assertLifecycle(selector, field) {
  assertBoundedPattern(selector.requiredLifecycleState, {
    code: "CONTEXT_LIFECYCLE_RULE_INVALID",
    field: `${field}/requiredLifecycleState`,
    label: "Context selector requiredLifecycleState",
    maximum: 80,
    pattern: lifecycleStatePattern
  });
  const ruleField = `${field}/lifecycleRule`;
  if (!isRecord(selector.lifecycleRule)) {
    fail(
      "CONTEXT_LIFECYCLE_RULE_INVALID",
      ruleField,
      "Context selector lifecycleRule must be one closed object."
    );
  }
  if (selector.lifecycleRule.mode === "workspace-resource-version") {
    assertExactKeys(
      selector.lifecycleRule,
      ["mode"],
      [],
      ruleField,
      "CONTEXT_LIFECYCLE_RULE_INVALID",
      "Workspace-resource-version lifecycle rule"
    );
    if (selector.requiredLifecycleState !== "frozen") {
      fail(
        "CONTEXT_LIFECYCLE_RULE_INVALID",
        `${field}/requiredLifecycleState`,
        "Workspace resource versions prove only the frozen lifecycle state."
      );
    }
    return;
  }
  if (selector.lifecycleRule.mode === "json-pointer-state") {
    assertExactKeys(
      selector.lifecycleRule,
      ["mode", "path"],
      [],
      ruleField,
      "CONTEXT_LIFECYCLE_RULE_INVALID",
      "JSON-pointer lifecycle rule"
    );
    if (
      typeof selector.lifecycleRule.path !== "string" ||
      selector.lifecycleRule.path.length < 1 ||
      selector.lifecycleRule.path.length > 1024 ||
      !jsonPointerPattern.test(selector.lifecycleRule.path)
    ) {
      fail(
        "CONTEXT_LIFECYCLE_RULE_INVALID",
        `${ruleField}/path`,
        "Lifecycle path must be one non-empty strict RFC 6901 pointer."
      );
    }
    return;
  }
  fail(
    "CONTEXT_LIFECYCLE_RULE_INVALID",
    `${ruleField}/mode`,
    "Context selector lifecycleRule mode is unsupported."
  );
}

function assertSelection(selection, field) {
  if (!isRecord(selection)) {
    fail(
      "CONTEXT_SELECTOR_SELECTION_INVALID",
      field,
      "Context selector selection must be one closed object."
    );
  }
  if (selection.mode === "active-head") {
    assertExactKeys(
      selection,
      ["mode", "slot"],
      [],
      field,
      "CONTEXT_SELECTOR_SELECTION_INVALID",
      "Active-head selection"
    );
    assertBoundedPattern(selection.slot, {
      code: "CONTEXT_SELECTOR_SELECTION_INVALID",
      field: `${field}/slot`,
      label: "Active-head selection slot",
      maximum: 120,
      pattern: slotIdPattern
    });
    return;
  }
  if (
    selection.mode === "request-reference" ||
    selection.mode === "event-input"
  ) {
    const label = selection.mode === "event-input"
      ? "Event-input selection"
      : "Request-reference selection";
    assertExactKeys(
      selection,
      ["mode", "inputKey"],
      [],
      field,
      "CONTEXT_SELECTOR_SELECTION_INVALID",
      label,
    );
    assertBoundedPattern(selection.inputKey, {
      code: "CONTEXT_SELECTOR_SELECTION_INVALID",
      field: `${field}/inputKey`,
      label: `${label} inputKey`,
      maximum: 80,
      pattern: fieldIdPattern
    });
    return;
  }
  fail(
    "CONTEXT_SELECTOR_SELECTION_INVALID",
    `${field}/mode`,
    "Context selector selection mode is unsupported."
  );
}

function assertProjection(projection, field) {
  assertExactKeys(
    projection,
    ["id", "digest", "fields"],
    [],
    field,
    "CONTEXT_PROJECTION_INVALID",
    "Context projection"
  );
  assertBoundedPattern(projection.id, {
    code: "CONTEXT_PROJECTION_INVALID",
    field: `${field}/id`,
    label: "Context projection id",
    maximum: 160,
    pattern: semanticIdPattern
  });
  assertDigest(
    projection.digest,
    `${field}/digest`,
    "CONTEXT_PROJECTION_INVALID",
    "Context projection digest"
  );
  if (
    !Array.isArray(projection.fields) ||
    projection.fields.length < 1 ||
    projection.fields.length > 256
  ) {
    fail(
      "CONTEXT_PROJECTION_INVALID",
      `${field}/fields`,
      "Context projection fields must be one non-empty bounded array."
    );
  }
  const paths = new Set();
  projection.fields.forEach((path, index) => {
    const pathField = `${field}/fields/${index}`;
    if (
      typeof path !== "string" ||
      path.length > 1024 ||
      !jsonPointerPattern.test(path)
    ) {
      fail(
        "CONTEXT_PROJECTION_INVALID",
        pathField,
        "Context projection field must be one strict RFC 6901 pointer."
      );
    }
    if (paths.has(path)) {
      fail(
        "CONTEXT_PROJECTION_FIELD_DUPLICATE",
        pathField,
        `Context projection field ${path} is duplicated.`
      );
    }
    paths.add(path);
  });
}

function assertSelector(selector, index) {
  const field = `/selectors/${index}`;
  assertExactKeys(
    selector,
    [
      "id",
      "selectorDigest",
      "ordinal",
      "role",
      "resourceType",
      "cardinality",
      "requiredLifecycleState",
      "lifecycleRule",
      "selection",
      "projection"
    ],
    [],
    field,
    "CONTEXT_SELECTOR_INVALID",
    "Context selector"
  );
  assertBoundedPattern(selector.id, {
    code: "CONTEXT_SELECTOR_INVALID",
    field: `${field}/id`,
    label: "Context selector id",
    maximum: 160,
    pattern: semanticIdPattern
  });
  assertDigest(
    selector.selectorDigest,
    `${field}/selectorDigest`,
    "CONTEXT_SELECTOR_DIGEST_INVALID",
    "Context selector digest"
  );
  if (
    !Number.isInteger(selector.ordinal) ||
    selector.ordinal < 1 ||
    selector.ordinal > 256
  ) {
    fail(
      "CONTEXT_SELECTOR_ORDER_INVALID",
      `${field}/ordinal`,
      "Context selector ordinal is invalid."
    );
  }
  if (selector.ordinal !== index + 1) {
    fail(
      "CONTEXT_SELECTOR_ORDER_INVALID",
      `${field}/ordinal`,
      "Context selector ordinals must be contiguous and match declared array order."
    );
  }
  assertBoundedPattern(selector.role, {
    code: "CONTEXT_SELECTOR_INVALID",
    field: `${field}/role`,
    label: "Context selector role",
    maximum: 80,
    pattern: roleIdPattern
  });
  assertResourceType(selector.resourceType, `${field}/resourceType`);
  assertCardinality(selector.cardinality, `${field}/cardinality`);
  assertLifecycle(selector, field);
  assertSelection(selector.selection, `${field}/selection`);
  assertProjection(selector.projection, `${field}/projection`);

  let derivedDigest;
  try {
    derivedDigest = contextSelectorDigest(selector);
  } catch (error) {
    fail(
      "CONTEXT_SELECTOR_INVALID",
      field,
      `Context selector digest cannot be derived: ${error.message}`
    );
  }
  if (selector.selectorDigest !== derivedDigest) {
    fail(
      "CONTEXT_SELECTOR_DIGEST_MISMATCH",
      `${field}/selectorDigest`,
      "Context selector digest differs from its complete declared authority."
    );
  }
}

function assertSelectors(selectors) {
  if (!Array.isArray(selectors) || selectors.length > 32) {
    fail(
      "CONTEXT_SELECTORS_INVALID",
      "/selectors",
      "Context selectors must be one bounded array."
    );
  }
  const ids = new Set();
  selectors.forEach((selector, index) => {
    assertSelector(selector, index);
    if (ids.has(selector.id)) {
      fail(
        "CONTEXT_SELECTOR_ID_DUPLICATE",
        `/selectors/${index}/id`,
        `Context selector id ${selector.id} is duplicated.`
      );
    }
    ids.add(selector.id);
  });
}

function selectedReference(selector, workspace, requestInputs, index) {
  if (selector.selection.mode === "active-head") {
    const head = workspace.spec.activeHeads.find(
      (candidate) => candidate.slot === selector.selection.slot
    );
    return head?.reference ?? null;
  }
  const { inputKey } = selector.selection;
  return Object.hasOwn(requestInputs, inputKey)
    ? requestInputs[inputKey]
    : null;
}

function assertAdmittedType(reference, selector, index) {
  if (
    reference.apiVersion !== selector.resourceType.apiVersion ||
    reference.kind !== selector.resourceType.kind
  ) {
    fail(
      "CONTEXT_SELECTOR_RESOURCE_TYPE_MISMATCH",
      `/selectors/${index}/resourceType`,
      "Selected reference apiVersion/kind differs from the selector's admitted resource type."
    );
  }
}

function rethrowSelectorError(error, index) {
  if (!(error instanceof AuthoringContextResolutionError)) throw error;
  let { field } = error;
  if (field === "/selector" || field.startsWith("/selector/")) {
    field = `/selectors/${index}${field.slice("/selector".length)}`;
  } else if (field === "/fields" || field.startsWith("/fields/")) {
    field =
      `/selectors/${index}/projection/fields${field.slice("/fields".length)}`;
  } else if (field === "/reference" || field.startsWith("/reference/")) {
    field =
      `/selectors/${index}/selection${field.slice("/reference".length)}`;
  } else if (
    field === "/storedResourceVersion" ||
    field.startsWith("/storedResourceVersion/")
  ) {
    field =
      `/selectors/${index}/selection${field.slice("/storedResourceVersion".length)}`;
  }
  throw new AuthoringContextResolutionError(error.code, field, error.reason);
}

/**
 * Resolve the manifest-declared context selectors against one immutable
 * AuthoringWorkspace snapshot. No caller can supply a layer, snapshot, digest,
 * ordinal, or ContextClosure name.
 */
export function resolveContextClosure(options) {
  const invocation = canonicalSnapshot(
    options,
    "/",
    "context resolution invocation"
  );
  assertExactKeys(
    invocation,
    ["workspace", "selectors"],
    ["requestInputs"],
    "",
    "CONTEXT_RESOLUTION_INVOCATION_INVALID",
    "Context resolution invocation"
  );
  const workspace = invocation.workspace;
  const selectors = invocation.selectors;
  const requestInputs = Object.hasOwn(invocation, "requestInputs")
    ? invocation.requestInputs
    : deepFreeze({});

  assertWorkspace(workspace);
  assertRequestInputs(requestInputs);
  assertSelectors(selectors);
  const resourceResolver =
    createStoredResourceVersionResolverFromSnapshot(workspace);

  const layers = [];
  const layerSources = new Set();
  selectors.forEach((selector, index) => {
    const reference = selectedReference(
      selector,
      workspace,
      requestInputs,
      index
    );
    const matchCount = reference === null ? 0 : 1;
    if (reference !== null) {
      assertReference(reference, `/selectors/${index}/selection/reference`);
      assertAdmittedType(reference, selector, index);
    }
    if (
      matchCount < selector.cardinality.min ||
      matchCount > selector.cardinality.max
    ) {
      fail(
        "CONTEXT_SELECTOR_CARDINALITY_MISMATCH",
        `/selectors/${index}/cardinality`,
        `Context selector ${selector.id} resolved ${matchCount} resources outside its declared cardinality.`
      );
    }
    if (reference === null) return;

    let stored;
    let lifecycleProof;
    let selectedValue;
    try {
      stored = resourceResolver.resolveStoredResourceVersion(reference);
      lifecycleProof =
        resourceResolver.evaluateLifecycleRule(selector, stored);
      selectedValue = projectSelectedValue(
        stored.resource,
        selector.projection.fields
      );
    } catch (error) {
      rethrowSelectorError(error, index);
    }

    const sourceIdentity =
      `${selector.role}\u0000${canonicalize(stored.reference)}`;
    if (layerSources.has(sourceIdentity)) {
      fail(
        "CONTEXT_LAYER_SOURCE_DUPLICATE",
        `/selectors/${index}`,
        "Two emitted selectors would create the same role/reference context layer."
      );
    }
    layerSources.add(sourceIdentity);
    layers.push({
      ordinal: layers.length + 1,
      role: selector.role,
      selectorId: selector.id,
      selectorDigest: selector.selectorDigest,
      requiredLifecycleState: selector.requiredLifecycleState,
      lifecycleProof,
      sourceReference: stored.reference,
      sourceIntegrityDigest: stored.integrityDigest,
      sourceSnapshot: stored.resource,
      selectedValue,
      projectionDefinitionDigest: selector.projection.digest
    });
  });

  const contextClosure = {
    apiVersion: "authoring.mission-kit/v1alpha1",
    kind: "ContextClosure",
    metadata: {
      name: "context-pending"
    },
    spec: {
      closureDigest: ZERO_DIGEST,
      layers
    }
  };
  try {
    contextClosure.spec.closureDigest = contextClosureDigest(contextClosure);
  } catch (error) {
    fail(
      "CONTEXT_CLOSURE_CONSTRUCTION_FAILED",
      "/spec/closureDigest",
      `ContextClosure digest cannot be derived: ${error.message}`
    );
  }
  contextClosure.metadata.name =
    `context-${contextClosure.spec.closureDigest.slice("sha256:".length)}`;

  const result = canonicalSnapshot(
    contextClosure,
    "/contextClosure",
    "constructed ContextClosure"
  );
  if (contextClosureDigest(result) !== result.spec.closureDigest) {
    fail(
      "CONTEXT_CLOSURE_CONSTRUCTION_FAILED",
      "/spec/closureDigest",
      "Constructed ContextClosure did not retain its deterministic digest."
    );
  }
  return result;
}
