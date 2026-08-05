import assert from "node:assert/strict";
import {
  contextSelectorDigest,
  resourceIntegrityDigest,
  resourceReferenceFrom
} from "../../../source/authoring/kernel/digests.mjs";
import {
  AuthoringContextResolutionError
} from "../../../source/authoring/kernel/context-resolver.mjs";

export const opaqueDigest = `sha256:${"e".repeat(64)}`;

export function clone(value) {
  return structuredClone(value);
}

export function stored(resource) {
  return {
    reference: resourceReferenceFrom(resource),
    integrityDigest: resourceIntegrityDigest(resource),
    resource: clone(resource)
  };
}

export function sourceResource({
  name = "brief-source",
  phase = "ready",
  title = "Exact brief"
} = {}) {
  return {
    apiVersion: "brief.example/v1alpha1",
    kind: "Brief",
    metadata: { name },
    spec: {
      details: {
        audience: "operators",
        title
      },
      title
    },
    status: { phase }
  };
}

export function workspaceWith({
  records,
  heads = []
}) {
  return {
    apiVersion: "authoring.mission-kit/v1alpha1",
    kind: "AuthoringWorkspace",
    metadata: { name: "context-workspace" },
    spec: {
      profile: {},
      protocol: {},
      authoringState: "draft_task",
      semanticRevision: 0,
      evidenceRevision: 0,
      resourceVersions: clone(records),
      activeHeads: clone(heads),
      dependencyEdges: [],
      handoffProducts: [],
      history: [],
      openAssignment: null,
      integrity: {}
    }
  };
}

export function selector({
  id = "brief-context",
  ordinal = 1,
  role = "brief",
  resourceType = {
    apiVersion: "brief.example/v1alpha1",
    kind: "Brief"
  },
  cardinality = { min: 1, max: 1 },
  requiredLifecycleState = "frozen",
  lifecycleRule = { mode: "workspace-resource-version" },
  selection = { mode: "active-head", slot: "brief" },
  fields = ["/spec/title", "/status/phase"]
} = {}) {
  const value = {
    id,
    selectorDigest: `sha256:${"0".repeat(64)}`,
    ordinal,
    role,
    resourceType: clone(resourceType),
    cardinality: clone(cardinality),
    requiredLifecycleState,
    lifecycleRule: clone(lifecycleRule),
    selection: clone(selection),
    projection: {
      id: `${id}-projection`,
      digest: opaqueDigest,
      fields: clone(fields)
    }
  };
  value.selectorDigest = contextSelectorDigest(value);
  return value;
}

export function refreshSelector(value) {
  value.selectorDigest = contextSelectorDigest(value);
  return value;
}

export function scenario({
  selection = "active-head",
  phase = "ready",
  fields,
  lifecycleRule,
  requiredLifecycleState
} = {}) {
  const resource = sourceResource({ phase });
  const record = stored(resource);
  const selectedSelector = selector({
    fields,
    lifecycleRule,
    requiredLifecycleState,
    selection: selection === "request-reference"
      ? { mode: "request-reference", inputKey: "brief" }
      : { mode: "active-head", slot: "brief" }
  });
  const workspace = workspaceWith({
    records: [record],
    heads: selection === "active-head"
      ? [{ slot: "brief", reference: record.reference }]
      : []
  });
  const requestInputs = selection === "request-reference"
    ? { brief: clone(record.reference) }
    : {};
  return {
    record,
    requestInputs,
    resource,
    selector: selectedSelector,
    workspace
  };
}

export function assertContextError(action, code, field) {
  assert.throws(action, (error) => {
    assert.ok(error instanceof AuthoringContextResolutionError);
    assert.equal(error.name, "AuthoringContextResolutionError");
    assert.equal(error.code, code);
    if (field !== undefined) assert.equal(error.field, field);
    assert.equal(typeof error.reason, "string");
    assert.ok(error.reason.length > 0);
    return true;
  });
}

export function assertDeepFrozen(value) {
  if (value === null || typeof value !== "object") return;
  assert.ok(Object.isFrozen(value));
  for (const child of Object.values(value)) assertDeepFrozen(child);
}
