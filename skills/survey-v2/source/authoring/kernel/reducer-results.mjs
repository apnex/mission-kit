import { types } from "node:util";
import { canonicalize, stableValue } from "./canonical.mjs";
import {
  contextClosureDigest,
  mutationDigest,
  requestCoreDigest,
  resourceIntegrityDigest,
  resourceReferenceFrom,
  resourceSemanticDigest,
} from "./digests.mjs";

const apiVersion = "authoring.mission-kit/v1alpha1";
const digestPattern = /^sha256:[0-9a-f]{64}$/u;
const apiVersionPattern =
  /^[a-z][a-z0-9.-]*\/v[0-9]+(?:alpha[0-9]+|beta[0-9]+)?$/u;
const eventIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$/u;
const kindPattern = /^[A-Z][A-Za-z0-9]*$/u;
const resourceNamePattern =
  /^[a-z0-9](?:[-a-z0-9]*[a-z0-9])?(?:\.[a-z0-9](?:[-a-z0-9]*[a-z0-9])?)*$/u;
const roleIdPattern =
  /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/u;
const semanticIdPattern =
  /^[a-z][a-z0-9]*(?:[._:/-][a-z0-9]+)*$/u;
const stateIdPattern = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/u;
const stringMapKeyPattern =
  /^[A-Za-z0-9](?:[A-Za-z0-9._/-]*[A-Za-z0-9])?$/u;
const fieldPathPattern =
  /^(?:\/(?:[^~/]|~0|~1)*)*$/u;
const nextActions = new Set([
  "edit-and-resubmit",
  "restore-compatible-build",
  "reissue-assignment",
  "retry",
  "start-linked-run",
  "no-safe-remediation",
]);

function fail(message) {
  throw new TypeError(message);
}

function isRecord(value) {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    types.isProxy(value)
  ) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function exactKeys(value, keys) {
  if (!isRecord(value)) return false;
  const ownKeys = Reflect.ownKeys(value);
  const expected = new Set(keys);
  if (
    ownKeys.length !== keys.length ||
    ownKeys.some((key) => typeof key !== "string") ||
    ownKeys.some((key) => !expected.has(key))
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

function closedKeys(value, required, optional = []) {
  if (!isRecord(value)) return false;
  const ownKeys = Reflect.ownKeys(value);
  const allowed = new Set([...required, ...optional]);
  if (
    ownKeys.some((key) => typeof key !== "string") ||
    ownKeys.some((key) => !allowed.has(key)) ||
    required.some((key) => !Object.hasOwn(value, key))
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

function assertText(value, label) {
  if (
    typeof value !== "string" ||
    [...value].length < 1 ||
    [...value].length > 4096 ||
    !value.isWellFormed() ||
    !/\S/u.test(value)
  ) {
    fail(`${label} must be bounded non-whitespace Unicode scalar text`);
  }
}

function canonicalSnapshot(value, label) {
  try {
    return stableValue(value);
  } catch (error) {
    fail(
      `${label} must be canonical JSON: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

function assertIssueCode(code) {
  if (
    typeof code !== "string" ||
    [...code].length > 80 ||
    !eventIdPattern.test(code)
  ) {
    fail("validation issue code is invalid");
  }
}

function assertFieldPath(field) {
  if (
    typeof field !== "string" ||
    [...field].length > 1024 ||
    !field.isWellFormed() ||
    !fieldPathPattern.test(field)
  ) {
    fail("validation issue field is not a canonical JSON Pointer");
  }
}

function assertBoundary(boundary) {
  if (
    typeof boundary !== "string" ||
    [...boundary].length > 160 ||
    !semanticIdPattern.test(boundary)
  ) {
    fail("validation issue boundary is invalid");
  }
}

function assertBoundedPattern(value, label, maximum, pattern) {
  if (
    typeof value !== "string" ||
    [...value].length < 1 ||
    [...value].length > maximum ||
    !value.isWellFormed() ||
    !pattern.test(value)
  ) {
    fail(`${label} is invalid`);
  }
}

function assertDigest(value, label) {
  if (typeof value !== "string" || !digestPattern.test(value)) {
    fail(`${label} is not one canonical sha256 digest`);
  }
}

function assertStateId(value, label) {
  assertBoundedPattern(value, label, 80, stateIdPattern);
}

function assertStringMap(value, label) {
  if (!isRecord(value) || Reflect.ownKeys(value).length > 64) {
    fail(`${label} must be one bounded string map`);
  }
  for (const [key, entry] of Object.entries(value)) {
    if (
      [...key].length > 128 ||
      !key.isWellFormed() ||
      !stringMapKeyPattern.test(key) ||
      typeof entry !== "string" ||
      [...entry].length > 4096 ||
      !entry.isWellFormed()
    ) {
      fail(`${label} contains an invalid entry`);
    }
  }
}

function assertCanonicalValueBounds(value, label) {
  const pending = [value];
  while (pending.length > 0) {
    const current = pending.pop();
    if (Array.isArray(current)) {
      if (current.length > 4096) {
        fail(`${label} contains an array outside the canonical bound`);
      }
      pending.push(...current);
    } else if (isRecord(current)) {
      const entries = Object.values(current);
      if (entries.length > 4096) {
        fail(`${label} contains an object outside the canonical bound`);
      }
      pending.push(...entries);
    }
  }
}

function assertResourceReference(value, label) {
  if (
    !exactKeys(
      value,
      ["apiVersion", "kind", "name", "semanticDigest"],
    )
  ) {
    fail(`${label} is not one exact resource reference`);
  }
  assertBoundedPattern(
    value.apiVersion,
    `${label} apiVersion`,
    128,
    apiVersionPattern,
  );
  assertBoundedPattern(value.kind, `${label} kind`, 80, kindPattern);
  assertBoundedPattern(
    value.name,
    `${label} name`,
    253,
    resourceNamePattern,
  );
  assertDigest(value.semanticDigest, `${label} semanticDigest`);
}

function assertResourceDocument(value, label) {
  if (
    !closedKeys(
      value,
      ["apiVersion", "kind", "metadata", "spec"],
      ["evidence", "status"],
    )
  ) {
    fail(`${label} is not one closed resource document`);
  }
  assertBoundedPattern(
    value.apiVersion,
    `${label} apiVersion`,
    128,
    apiVersionPattern,
  );
  assertBoundedPattern(value.kind, `${label} kind`, 80, kindPattern);
  if (
    !closedKeys(
      value.metadata,
      ["name"],
      ["annotations", "labels"],
    )
  ) {
    fail(`${label} metadata is not closed`);
  }
  assertBoundedPattern(
    value.metadata.name,
    `${label} metadata.name`,
    253,
    resourceNamePattern,
  );
  for (const mapName of ["annotations", "labels"]) {
    if (Object.hasOwn(value.metadata, mapName)) {
      assertStringMap(
        value.metadata[mapName],
        `${label} metadata.${mapName}`,
      );
    }
  }
  for (const recordName of ["spec", "evidence", "status"]) {
    if (
      Object.hasOwn(value, recordName) &&
      (
        !isRecord(value[recordName]) ||
        Reflect.ownKeys(value[recordName]).length > 4096
      )
    ) {
      fail(`${label} ${recordName} must be one bounded object`);
    }
    if (Object.hasOwn(value, recordName)) {
      assertCanonicalValueBounds(
        value[recordName],
        `${label} ${recordName}`,
      );
    }
  }
}

function normalizeContextLayer(value, index) {
  const label = `task context closure layer ${index}`;
  if (
    !exactKeys(
      value,
      [
        "ordinal",
        "role",
        "selectorId",
        "selectorDigest",
        "requiredLifecycleState",
        "lifecycleProof",
        "sourceReference",
        "sourceIntegrityDigest",
        "sourceSnapshot",
        "selectedValue",
        "projectionDefinitionDigest",
      ],
    )
  ) {
    fail(`${label} does not contain its exact closed fields`);
  }
  if (value.ordinal !== index + 1) {
    fail(`${label} ordinal must be contiguous and match array order`);
  }
  assertBoundedPattern(value.role, `${label} role`, 80, roleIdPattern);
  assertBoundedPattern(
    value.selectorId,
    `${label} selectorId`,
    160,
    semanticIdPattern,
  );
  assertDigest(value.selectorDigest, `${label} selectorDigest`);
  assertStateId(
    value.requiredLifecycleState,
    `${label} requiredLifecycleState`,
  );
  if (
    !exactKeys(value.lifecycleProof, ["ruleDigest", "observedState"])
  ) {
    fail(`${label} lifecycleProof is not exact and closed`);
  }
  assertDigest(
    value.lifecycleProof.ruleDigest,
    `${label} lifecycleProof ruleDigest`,
  );
  assertStateId(
    value.lifecycleProof.observedState,
    `${label} lifecycleProof observedState`,
  );
  if (
    value.lifecycleProof.observedState !== value.requiredLifecycleState
  ) {
    fail(`${label} lifecycleProof does not prove the required state`);
  }
  assertResourceReference(
    value.sourceReference,
    `${label} sourceReference`,
  );
  assertDigest(
    value.sourceIntegrityDigest,
    `${label} sourceIntegrityDigest`,
  );
  assertResourceDocument(
    value.sourceSnapshot,
    `${label} sourceSnapshot`,
  );
  assertCanonicalValueBounds(
    value.selectedValue,
    `${label} selectedValue`,
  );
  assertDigest(
    value.projectionDefinitionDigest,
    `${label} projectionDefinitionDigest`,
  );

  let expectedReference;
  let expectedIntegrityDigest;
  try {
    expectedReference = resourceReferenceFrom(value.sourceSnapshot);
    expectedIntegrityDigest =
      resourceIntegrityDigest(value.sourceSnapshot);
  } catch (error) {
    fail(
      `${label} source identity cannot be derived: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
  if (
    canonicalize(value.sourceReference) !==
      canonicalize(expectedReference) ||
    value.sourceIntegrityDigest !== expectedIntegrityDigest
  ) {
    fail(`${label} source bindings differ from its exact snapshot`);
  }
  return `${value.role}\u0000${canonicalize(value.sourceReference)}`;
}

function normalizeValidationIssue(value, label) {
  const issue = canonicalSnapshot(value, label);
  if (
    !exactKeys(issue, ["apiVersion", "kind", "metadata", "spec"]) ||
    issue.apiVersion !== apiVersion ||
    issue.kind !== "ValidationIssue" ||
    !exactKeys(issue.metadata, ["name"]) ||
    !exactKeys(
      issue.spec,
      [
        "code",
        "field",
        "reason",
        "boundary",
        "nextAction",
        "correction",
      ],
    )
  ) {
    fail(`${label} is not one exact ValidationIssue resource`);
  }
  assertIssueCode(issue.spec.code);
  assertFieldPath(issue.spec.field);
  assertText(issue.spec.reason, `${label} reason`);
  assertBoundary(issue.spec.boundary);
  if (!nextActions.has(issue.spec.nextAction)) {
    fail(`${label} nextAction is not closed`);
  }
  assertText(issue.spec.correction, `${label} correction`);
  const expectedName =
    `issue-${resourceSemanticDigest(issue).slice("sha256:".length)}`;
  if (issue.metadata.name !== expectedName) {
    fail(`${label} metadata.name differs from its semantic identity`);
  }
  return issue;
}

function normalizeIdentityResource(
  value,
  {
    kind,
    label,
    specKeys,
    digestField,
    digestFunction,
    namePrefix,
  },
) {
  const resource = canonicalSnapshot(value, label);
  if (
    !exactKeys(resource, ["apiVersion", "kind", "metadata", "spec"]) ||
    resource.apiVersion !== apiVersion ||
    resource.kind !== kind ||
    !exactKeys(resource.metadata, ["name"]) ||
    !exactKeys(resource.spec, specKeys) ||
    !digestPattern.test(resource.spec[digestField] ?? "")
  ) {
    fail(`${label} is not one exact ${kind} resource shell`);
  }
  let expectedDigest;
  try {
    expectedDigest = digestFunction(resource);
  } catch (error) {
    fail(
      `${label} identity cannot be derived: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
  if (
    resource.spec[digestField] !== expectedDigest ||
    resource.metadata.name !==
      `${namePrefix}-${expectedDigest.slice("sha256:".length)}`
  ) {
    fail(`${label} differs from its deterministic digest identity`);
  }
  return resource;
}

function normalizeContextClosure(value) {
  const closure = normalizeIdentityResource(value, {
    kind: "ContextClosure",
    label: "task context closure",
    specKeys: ["closureDigest", "layers"],
    digestField: "closureDigest",
    digestFunction: contextClosureDigest,
    namePrefix: "context",
  });
  if (!Array.isArray(closure.spec.layers) || closure.spec.layers.length > 64) {
    fail("task context closure layers must be a bounded array");
  }
  const sources = new Set();
  closure.spec.layers.forEach((layer, index) => {
    const source = normalizeContextLayer(layer, index);
    if (sources.has(source)) {
      fail(
        `task context closure layer ${index} duplicates one role/source binding`,
      );
    }
    sources.add(source);
  });
  return closure;
}

function normalizeRequest(value) {
  return normalizeIdentityResource(value, {
    kind: "AuthoringRequest",
    label: "task request",
    specKeys: [
      "requestDigest",
      "operation",
      "base",
      "contextClosure",
      "submissionContract",
      "bindings",
    ],
    digestField: "requestDigest",
    digestFunction: requestCoreDigest,
    namePrefix: "request",
  });
}

function normalizeMutation(value) {
  const mutation = normalizeIdentityResource(value, {
    kind: "AuthoringMutation",
    label: "mutation result",
    specKeys: [
      "mutationDigest",
      "expected",
      "cause",
      "createdResources",
      "activeHeadChanges",
      "supersededResources",
      "dependencyEdges",
      "handoffProducts",
      "nextAuthoringState",
      "externalCouplings",
    ],
    digestField: "mutationDigest",
    digestFunction: mutationDigest,
    namePrefix: "mutation",
  });
  assertStateId(
    mutation.spec.nextAuthoringState,
    "mutation result nextAuthoringState",
  );
  if (
    !isRecord(mutation.spec.cause) ||
    !isRecord(mutation.spec.cause.edge)
  ) {
    fail("mutation result cause edge is not one closed transition edge");
  }
  assertStateId(
    mutation.spec.cause.edge.toState,
    "mutation result cause edge toState",
  );
  if (
    mutation.spec.nextAuthoringState !==
      mutation.spec.cause.edge.toState
  ) {
    fail(
      "mutation result nextAuthoringState must equal its cause edge toState",
    );
  }
  return mutation;
}

function normalizeState(value, expectedClass) {
  const state = canonicalSnapshot(value, `${expectedClass} result state`);
  if (
    !exactKeys(state, ["id", "label", "class"]) ||
    state.class !== expectedClass ||
    typeof state.id !== "string" ||
    [...state.id].length > 80 ||
    !stateIdPattern.test(state.id)
  ) {
    fail(`${expectedClass} result state is not one exact closed state`);
  }
  assertText(state.label, `${expectedClass} result state label`);
  return state;
}

/**
 * Construct one sovereign ValidationIssue. Its metadata name is derived from
 * the metadata-independent resource semantic digest, so callers cannot choose
 * issue identity or presentation order.
 */
export function createValidationIssue(fields) {
  if (
    !exactKeys(
      fields,
      ["code", "field", "reason", "boundary", "nextAction", "correction"],
    )
  ) {
    fail("validation issue fields must be exact and closed");
  }
  const {
    code,
    field,
    reason,
    boundary,
    nextAction,
    correction,
  } = fields;
  assertIssueCode(code);
  assertFieldPath(field);
  assertBoundary(boundary);
  if (!nextActions.has(nextAction)) {
    fail("validation issue nextAction is not closed");
  }
  assertText(reason, "validation issue reason");
  assertText(correction, "validation issue correction");
  const issue = {
    apiVersion,
    kind: "ValidationIssue",
    metadata: { name: "pending" },
    spec: {
      code,
      field,
      reason,
      boundary,
      nextAction,
      correction,
    },
  };
  const digest = resourceSemanticDigest(issue).slice("sha256:".length);
  issue.metadata.name = `issue-${digest}`;
  return frozen(issue);
}

export function validationIssuesFromDomain(
  domainIssues,
  { boundary, nextAction },
) {
  if (
    !Array.isArray(domainIssues) ||
    domainIssues.length < 1 ||
    domainIssues.length > 256
  ) {
    fail("domain issues must contain one through 256 records");
  }
  return sortValidationIssues(domainIssues.map((entry) => {
    if (
      !exactKeys(entry, ["code", "field", "reason", "correction"])
    ) {
      fail("domain issue does not have its exact closed fields");
    }
    return createValidationIssue({
      ...entry,
      boundary,
      nextAction,
    });
  }));
}

export function sortValidationIssues(issues) {
  if (!Array.isArray(issues) || issues.length < 1 || issues.length > 256) {
    fail("validation issues must contain one through 256 resources");
  }
  const values = issues.map((issue, index) =>
    normalizeValidationIssue(issue, `validation issue ${index}`));
  values.sort((left, right) => {
    for (const key of ["field", "code", "reason"]) {
      const order = Buffer.compare(
        Buffer.from(left.spec[key], "utf8"),
        Buffer.from(right.spec[key], "utf8"),
      );
      if (order !== 0) return order;
    }
    return Buffer.compare(
      Buffer.from(canonicalize(left), "utf8"),
      Buffer.from(canonicalize(right), "utf8"),
    );
  });
  return frozen(values);
}

export function rejectedResult(issues) {
  return frozen({
    kind: "rejected",
    issues: sortValidationIssues(issues),
  });
}

export function taskResult(value) {
  if (!exactKeys(value, ["contextClosure", "request"])) {
    fail("task result input must contain exactly contextClosure and request");
  }
  const contextClosure = normalizeContextClosure(value.contextClosure);
  const request = normalizeRequest(value.request);
  if (
    !exactKeys(request.spec.contextClosure, ["reference", "closureDigest"]) ||
    request.spec.contextClosure.closureDigest !==
      contextClosure.spec.closureDigest ||
    canonicalize(request.spec.contextClosure.reference) !==
      canonicalize(resourceReferenceFrom(contextClosure))
  ) {
    fail("task request does not bind its exact context closure");
  }
  return frozen({
    kind: "task",
    contextClosure,
    request,
  });
}

export function waitResult(state) {
  return frozen({ kind: "wait", state: normalizeState(state, "wait") });
}

export function terminalResult(state) {
  return frozen({
    kind: "terminal",
    state: normalizeState(state, "terminal"),
  });
}

export function mutationResult(mutation) {
  return frozen({ kind: "mutation", mutation: normalizeMutation(mutation) });
}
