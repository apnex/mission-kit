import { canonicalize, stableValue } from "./canonical.mjs";
import {
  lifecycleRuleDigest,
  resourceIntegrityDigest,
  resourceReferenceFrom
} from "./digests.mjs";

const digestPattern = /^sha256:[0-9a-f]{64}$/u;
const apiVersionPattern =
  /^[a-z][a-z0-9.-]*\/v[0-9]+(?:alpha[0-9]+|beta[0-9]+)?$/u;
const kindPattern = /^[A-Z][A-Za-z0-9]*$/u;
const resourceNamePattern =
  /^[a-z0-9](?:[-a-z0-9]*[a-z0-9])?(?:\.[a-z0-9](?:[-a-z0-9]*[a-z0-9])?)*$/u;
const lifecycleStatePattern = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/u;
const jsonPointerPattern = /^(?:\/(?:[^~/]|~0|~1)*)*$/u;
const canonicalArrayIndexPattern = /^(?:0|[1-9][0-9]*)$/u;

export class AuthoringContextResolutionError extends Error {
  constructor(code, field, reason) {
    super(`${code} at ${field}: ${reason}`);
    this.name = "AuthoringContextResolutionError";
    this.code = code;
    this.field = field;
    this.reason = reason;
  }
}

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

function sameValue(left, right) {
  return canonicalize(left) === canonicalize(right);
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

function escapePointerToken(value) {
  return value.replaceAll("~", "~0").replaceAll("/", "~1");
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
  if (
    typeof reference.apiVersion !== "string" ||
    reference.apiVersion.length < 3 ||
    reference.apiVersion.length > 128 ||
    !apiVersionPattern.test(reference.apiVersion)
  ) {
    fail(
      "RESOURCE_REFERENCE_INVALID",
      `${field}/apiVersion`,
      "Resource reference apiVersion is invalid."
    );
  }
  if (
    typeof reference.kind !== "string" ||
    reference.kind.length > 80 ||
    !kindPattern.test(reference.kind)
  ) {
    fail(
      "RESOURCE_REFERENCE_INVALID",
      `${field}/kind`,
      "Resource reference kind is invalid."
    );
  }
  if (
    typeof reference.name !== "string" ||
    reference.name.length > 253 ||
    !resourceNamePattern.test(reference.name)
  ) {
    fail(
      "RESOURCE_REFERENCE_INVALID",
      `${field}/name`,
      "Resource reference name is invalid."
    );
  }
  if (
    typeof reference.semanticDigest !== "string" ||
    !digestPattern.test(reference.semanticDigest)
  ) {
    fail(
      "RESOURCE_REFERENCE_INVALID",
      `${field}/semanticDigest`,
      "Resource reference semanticDigest is invalid."
    );
  }
}

function assertMetadata(metadata, field) {
  assertExactKeys(
    metadata,
    ["name"],
    ["annotations", "labels"],
    field,
    "STORED_RESOURCE_SHAPE_INVALID",
    "Stored resource metadata"
  );
  if (
    typeof metadata.name !== "string" ||
    metadata.name.length > 253 ||
    !resourceNamePattern.test(metadata.name)
  ) {
    fail(
      "STORED_RESOURCE_SHAPE_INVALID",
      `${field}/name`,
      "Stored resource metadata.name is invalid."
    );
  }
  for (const mapName of ["annotations", "labels"]) {
    if (!Object.hasOwn(metadata, mapName)) continue;
    const map = metadata[mapName];
    if (!isRecord(map)) {
      fail(
        "STORED_RESOURCE_SHAPE_INVALID",
        `${field}/${mapName}`,
        `Stored resource metadata.${mapName} must be an object.`
      );
    }
    const entries = Object.entries(map);
    if (
      entries.length > 64 ||
      entries.some(([key, value]) => (
        key.length < 1 ||
        key.length > 128 ||
        !/^[A-Za-z0-9](?:[A-Za-z0-9._/-]*[A-Za-z0-9])?$/u.test(key) ||
        typeof value !== "string" ||
        value.length > 4096
      ))
    ) {
      fail(
        "STORED_RESOURCE_SHAPE_INVALID",
        `${field}/${mapName}`,
        `Stored resource metadata.${mapName} is invalid.`
      );
    }
  }
}

function assertResourceDocument(resource, field) {
  assertExactKeys(
    resource,
    ["apiVersion", "kind", "metadata", "spec"],
    ["evidence", "status"],
    field,
    "STORED_RESOURCE_SHAPE_INVALID",
    "Stored resource"
  );
  if (
    typeof resource.apiVersion !== "string" ||
    resource.apiVersion.length < 3 ||
    resource.apiVersion.length > 128 ||
    !apiVersionPattern.test(resource.apiVersion)
  ) {
    fail(
      "STORED_RESOURCE_SHAPE_INVALID",
      `${field}/apiVersion`,
      "Stored resource apiVersion is invalid."
    );
  }
  if (
    typeof resource.kind !== "string" ||
    resource.kind.length > 80 ||
    !kindPattern.test(resource.kind)
  ) {
    fail(
      "STORED_RESOURCE_SHAPE_INVALID",
      `${field}/kind`,
      "Stored resource kind is invalid."
    );
  }
  assertMetadata(resource.metadata, `${field}/metadata`);
  for (const recordName of ["spec", "status", "evidence"]) {
    if (
      Object.hasOwn(resource, recordName) &&
      !isRecord(resource[recordName])
    ) {
      fail(
        "STORED_RESOURCE_SHAPE_INVALID",
        `${field}/${recordName}`,
        `Stored resource ${recordName} must be an object.`
      );
    }
  }
}

function assertStoredRecord(record, field) {
  assertExactKeys(
    record,
    ["reference", "integrityDigest", "resource"],
    [],
    field,
    "STORED_RESOURCE_VERSION_SHAPE_INVALID",
    "Stored resource version"
  );
  assertReference(record.reference, `${field}/reference`);
  assertResourceDocument(record.resource, `${field}/resource`);
}

function assertStoredIntegrityDigest(record, field) {
  if (
    typeof record.integrityDigest !== "string" ||
    !digestPattern.test(record.integrityDigest)
  ) {
    fail(
      "STORED_RESOURCE_VERSION_SHAPE_INVALID",
      `${field}/integrityDigest`,
      "Stored resource version integrityDigest is invalid."
    );
  }
}

function assertWorkspaceInventory(workspace, field) {
  if (
    !isRecord(workspace) ||
    workspace.apiVersion !== "authoring.mission-kit/v1alpha1" ||
    workspace.kind !== "AuthoringWorkspace" ||
    !isRecord(workspace.spec) ||
    !Array.isArray(workspace.spec.resourceVersions)
  ) {
    fail(
      "AUTHORING_WORKSPACE_INVALID",
      field,
      "Resource resolution requires one AuthoringWorkspace with a resourceVersions array."
    );
  }
  if (workspace.spec.resourceVersions.length > 16384) {
    fail(
      "AUTHORING_WORKSPACE_INVALID",
      `${field}/spec/resourceVersions`,
      "AuthoringWorkspace resourceVersions exceeds its closed bound."
    );
  }
}

function referenceIdentityKey(reference) {
  if (
    !isRecord(reference) ||
    typeof reference.apiVersion !== "string" ||
    typeof reference.kind !== "string" ||
    typeof reference.name !== "string" ||
    typeof reference.semanticDigest !== "string"
  ) {
    return undefined;
  }
  return [
    reference.apiVersion,
    reference.kind,
    reference.name,
    reference.semanticDigest
  ].join("\u0000");
}

function pointerTokens(pointer, field) {
  if (
    typeof pointer !== "string" ||
    pointer.length > 1024 ||
    !jsonPointerPattern.test(pointer)
  ) {
    fail(
      "JSON_POINTER_INVALID",
      field,
      "JSON Pointer must use strict RFC 6901 syntax and canonical ~0/~1 escapes."
    );
  }
  if (pointer.length === 0) return [];
  return pointer.slice(1).split("/").map((token) => (
    token.replaceAll("~1", "/").replaceAll("~0", "~")
  ));
}

function resolvePointerSnapshot(document, pointer, field) {
  const tokens = pointerTokens(pointer, field);
  let current = document;
  for (const token of tokens) {
    if (Array.isArray(current)) {
      if (!canonicalArrayIndexPattern.test(token)) {
        fail(
          "JSON_POINTER_ARRAY_INDEX_INVALID",
          field,
          `Array token ${token} is not one canonical array index.`
        );
      }
      const index = Number(token);
      if (
        !Number.isSafeInteger(index) ||
        index >= current.length ||
        !Object.hasOwn(current, index)
      ) {
        fail(
          "JSON_POINTER_UNRESOLVED",
          field,
          `JSON Pointer does not resolve at array token ${token}.`
        );
      }
      current = current[index];
      continue;
    }
    if (
      !isRecord(current) ||
      !Object.hasOwn(current, token)
    ) {
      fail(
        "JSON_POINTER_UNRESOLVED",
        field,
        `JSON Pointer does not resolve at own-property token ${token}.`
      );
    }
    current = current[token];
  }
  return current;
}

/**
 * Resolve one strict RFC 6901 pointer against a detached canonical snapshot.
 * The empty pointer selects the complete document. Inherited properties,
 * non-canonical escapes, and non-canonical array indices never resolve.
 */
export function resolveJsonPointer(document, pointer) {
  const source = canonicalSnapshot(document, "/document", "JSON Pointer document");
  const selectedPointer = canonicalSnapshot(
    pointer,
    "/pointer",
    "JSON Pointer"
  );
  const value = resolvePointerSnapshot(source, selectedPointer, "/pointer");
  return canonicalSnapshot(value, "/value", "resolved JSON Pointer value");
}

/**
 * Select exactly one immutable stored version by all four ResourceReference
 * identity fields, then independently prove its semantic and full integrity
 * digests. Other immutable versions of the same logical resource are ambient
 * inventory and are deliberately ignored.
 */
function resolveStoredResourceVersionFromIndex(
  sourceWorkspace,
  inventoryIndex,
  selectedReference
) {
  assertReference(selectedReference, "/reference");
  const candidates =
    inventoryIndex.get(referenceIdentityKey(selectedReference)) ?? [];
  if (candidates.length === 0) {
    fail(
      "STORED_RESOURCE_VERSION_NOT_FOUND",
      "/reference",
      "No exact immutable stored resource version matches the reference."
    );
  }
  if (candidates.length > 1) {
    fail(
      "STORED_RESOURCE_VERSION_DUPLICATE",
      `/workspace/spec/resourceVersions/${candidates[1].index}`,
      "The exact resource reference resolves to more than one stored resource body."
    );
  }

  const [{ index, record }] = candidates;
  const recordField = `/workspace/spec/resourceVersions/${index}`;
  assertStoredRecord(record, recordField);

  let derivedReference;
  try {
    derivedReference = resourceReferenceFrom(record.resource);
  } catch (error) {
    fail(
      "STORED_RESOURCE_SEMANTIC_DIGEST_MISMATCH",
      `${recordField}/reference`,
      `Stored resource semantic identity cannot be derived: ${error.message}`
    );
  }
  if (
    record.reference.apiVersion !== derivedReference.apiVersion ||
    record.reference.kind !== derivedReference.kind ||
    record.reference.name !== derivedReference.name ||
    record.reference.semanticDigest !== derivedReference.semanticDigest
  ) {
    fail(
      "STORED_RESOURCE_SEMANTIC_DIGEST_MISMATCH",
      `${recordField}/reference`,
      "Stored resource reference differs from the resource's canonical semantic identity."
    );
  }

  // Semantic identity precedes full-body integrity by contract.
  assertStoredIntegrityDigest(record, recordField);
  let derivedIntegrityDigest;
  try {
    derivedIntegrityDigest = resourceIntegrityDigest(record.resource);
  } catch (error) {
    fail(
      "STORED_RESOURCE_INTEGRITY_MISMATCH",
      `${recordField}/integrityDigest`,
      `Stored resource integrity cannot be derived: ${error.message}`
    );
  }
  if (record.integrityDigest !== derivedIntegrityDigest) {
    fail(
      "STORED_RESOURCE_INTEGRITY_MISMATCH",
      `${recordField}/integrityDigest`,
      "Stored resource integrityDigest differs from its complete canonical body."
    );
  }
  return record;
}

/**
 * Internal immutable-snapshot adapter used by ContextClosure construction.
 * Its workspace argument must be the detached, deeply frozen canonical
 * invocation snapshot. The inventory is indexed once and never exposed.
 */
export function createStoredResourceVersionResolverFromSnapshot(
  sourceWorkspace
) {
  assertWorkspaceInventory(sourceWorkspace, "/workspace");
  if (
    !Object.isFrozen(sourceWorkspace) ||
    !Object.isFrozen(sourceWorkspace.spec) ||
    !Object.isFrozen(sourceWorkspace.spec.resourceVersions)
  ) {
    fail(
      "CONTEXT_INPUT_NON_CANONICAL",
      "/workspace",
      "Prepared resource resolution requires one frozen canonical workspace snapshot."
    );
  }

  const inventoryIndex = new Map();
  sourceWorkspace.spec.resourceVersions.forEach((record, index) => {
    const key = referenceIdentityKey(record?.reference);
    if (key === undefined) return;
    const candidates = inventoryIndex.get(key) ?? [];
    candidates.push({ index, record });
    inventoryIndex.set(key, candidates);
  });
  const resolved = new Map();
  const resolve = (reference) => {
    assertReference(reference, "/reference");
    const key = referenceIdentityKey(reference);
    if (resolved.has(key)) return resolved.get(key);
    const record = resolveStoredResourceVersionFromIndex(
      sourceWorkspace,
      inventoryIndex,
      reference
    );
    resolved.set(key, record);
    return record;
  };
  return Object.freeze({
    resolveStoredResourceVersion: resolve,
    evaluateLifecycleRule: (selector, storedResourceVersion) => (
      evaluateLifecycleRuleFromSnapshot(
        selector,
        storedResourceVersion,
        resolve
      )
    )
  });
}

/**
 * Select exactly one immutable stored version by all four ResourceReference
 * identity fields, then independently prove its semantic and full integrity
 * digests. Other immutable versions of the same logical resource are ambient
 * inventory and are deliberately ignored.
 */
export function resolveStoredResourceVersion(workspace, reference) {
  const sourceWorkspace = canonicalSnapshot(
    workspace,
    "/workspace",
    "authoring workspace"
  );
  const selectedReference = canonicalSnapshot(
    reference,
    "/reference",
    "resource reference"
  );
  const resolver =
    createStoredResourceVersionResolverFromSnapshot(sourceWorkspace);
  return resolver.resolveStoredResourceVersion(selectedReference);
}

/**
 * Prove the selector's lifecycle rule against the exact integrity-bound
 * workspace record and return the complete ContextClosure lifecycle proof.
 */
function evaluateLifecycleRuleFromSnapshot(
  selectedSelector,
  selectedRecord,
  resolve
) {
  if (!isRecord(selectedSelector)) {
    fail(
      "CONTEXT_LIFECYCLE_RULE_INVALID",
      "/selector",
      "Lifecycle evaluation requires one context selector."
    );
  }
  if (
    typeof selectedSelector.requiredLifecycleState !== "string" ||
    selectedSelector.requiredLifecycleState.length > 80 ||
    !lifecycleStatePattern.test(selectedSelector.requiredLifecycleState)
  ) {
    fail(
      "CONTEXT_LIFECYCLE_RULE_INVALID",
      "/selector/requiredLifecycleState",
      "Selector requiredLifecycleState is invalid."
    );
  }
  assertStoredRecord(selectedRecord, "/storedResourceVersion");
  assertStoredIntegrityDigest(selectedRecord, "/storedResourceVersion");

  const resolvedRecord = resolve(selectedRecord.reference);
  if (
    selectedRecord !== resolvedRecord &&
    !sameValue(selectedRecord, resolvedRecord)
  ) {
    fail(
      "CONTEXT_LIFECYCLE_SOURCE_MISMATCH",
      "/storedResourceVersion",
      "Lifecycle source differs from its exact immutable workspace record."
    );
  }

  const rule = selectedSelector.lifecycleRule;
  if (!isRecord(rule) || typeof rule.mode !== "string") {
    fail(
      "CONTEXT_LIFECYCLE_RULE_INVALID",
      "/selector/lifecycleRule",
      "Selector lifecycleRule must be one closed supported rule."
    );
  }

  let observedState;
  if (rule.mode === "workspace-resource-version") {
    assertExactKeys(
      rule,
      ["mode"],
      [],
      "/selector/lifecycleRule",
      "CONTEXT_LIFECYCLE_RULE_INVALID",
      "Workspace-resource-version lifecycle rule"
    );
    if (selectedSelector.requiredLifecycleState !== "frozen") {
      fail(
        "CONTEXT_LIFECYCLE_RULE_INVALID",
        "/selector/requiredLifecycleState",
        "Workspace resource versions prove only the frozen lifecycle state."
      );
    }
    observedState = "frozen";
  } else if (rule.mode === "json-pointer-state") {
    assertExactKeys(
      rule,
      ["mode", "path"],
      [],
      "/selector/lifecycleRule",
      "CONTEXT_LIFECYCLE_RULE_INVALID",
      "JSON-pointer lifecycle rule"
    );
    if (typeof rule.path !== "string" || rule.path.length === 0) {
      fail(
        "CONTEXT_LIFECYCLE_RULE_INVALID",
        "/selector/lifecycleRule/path",
        "JSON-pointer lifecycle path must be non-empty."
      );
    }
    observedState = resolvePointerSnapshot(
      selectedRecord.resource,
      rule.path,
      "/selector/lifecycleRule/path"
    );
    if (
      typeof observedState !== "string" ||
      observedState.length > 80 ||
      !lifecycleStatePattern.test(observedState)
    ) {
      fail(
        "CONTEXT_LIFECYCLE_STATE_INVALID",
        "/selector/lifecycleRule/path",
        "Lifecycle pointer must resolve to one canonical lifecycle state."
      );
    }
  } else {
    fail(
      "CONTEXT_LIFECYCLE_RULE_INVALID",
      "/selector/lifecycleRule/mode",
      `Unsupported lifecycle rule mode ${rule.mode}.`
    );
  }

  if (observedState !== selectedSelector.requiredLifecycleState) {
    fail(
      "CONTEXT_LIFECYCLE_MISMATCH",
      "/selector/requiredLifecycleState",
      `Observed lifecycle state ${observedState} does not equal required state ${selectedSelector.requiredLifecycleState}.`
    );
  }

  let ruleDigest;
  try {
    ruleDigest = lifecycleRuleDigest(selectedSelector);
  } catch (error) {
    fail(
      "CONTEXT_LIFECYCLE_RULE_INVALID",
      "/selector/lifecycleRule",
      `Lifecycle rule digest cannot be derived: ${error.message}`
    );
  }
  return canonicalSnapshot(
    { ruleDigest, observedState },
    "/lifecycleProof",
    "lifecycle proof"
  );
}

export function evaluateLifecycleRule(selector, storedResourceVersion, workspace) {
  const selectedSelector = canonicalSnapshot(
    selector,
    "/selector",
    "context selector"
  );
  const selectedRecord = canonicalSnapshot(
    storedResourceVersion,
    "/storedResourceVersion",
    "stored resource version"
  );
  const sourceWorkspace = canonicalSnapshot(
    workspace,
    "/workspace",
    "authoring workspace"
  );
  const resolver =
    createStoredResourceVersionResolverFromSnapshot(sourceWorkspace);
  return resolver.evaluateLifecycleRule(selectedSelector, selectedRecord);
}

/**
 * Project every declared field in declaration order. Even a one-field
 * projection is represented as an ordered array of closed {path, value}
 * records.
 */
export function projectSelectedValue(resource, fields) {
  const source = canonicalSnapshot(
    resource,
    "/resource",
    "projection source resource"
  );
  const selectedFields = canonicalSnapshot(
    fields,
    "/fields",
    "projection fields"
  );
  if (
    !Array.isArray(selectedFields) ||
    selectedFields.length < 1 ||
    selectedFields.length > 256
  ) {
    fail(
      "CONTEXT_PROJECTION_FIELDS_INVALID",
      "/fields",
      "Projection fields must be a non-empty bounded array."
    );
  }
  const seen = new Set();
  const projected = selectedFields.map((path, index) => {
    const field = `/fields/${index}`;
    if (typeof path !== "string") {
      fail(
        "CONTEXT_PROJECTION_FIELDS_INVALID",
        field,
        "Projection field must be one JSON Pointer string."
      );
    }
    if (seen.has(path)) {
      fail(
        "CONTEXT_PROJECTION_FIELD_DUPLICATE",
        field,
        `Projection field ${path} is duplicated.`
      );
    }
    seen.add(path);
    const value = resolvePointerSnapshot(source, path, field);
    return { path, value };
  });
  return canonicalSnapshot(
    projected,
    "/selectedValue",
    "selected projection"
  );
}
