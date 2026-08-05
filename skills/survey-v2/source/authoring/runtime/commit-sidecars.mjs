import { types } from "node:util";
import {
  canonicalize,
  stableValue,
} from "../kernel/canonical.mjs";
import {
  resourceReferenceFrom,
} from "../kernel/digests.mjs";
import {
  compileExecutableRegistry,
  invokeSidecar,
  invokeValidator,
} from "../kernel/executable-registry.mjs";
import {
  COMMIT_SIDECAR_RESOURCE_LIMIT,
} from "../kernel/limits.mjs";

export class AuthoringCommitSidecarError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "AuthoringCommitSidecarError";
    this.code = code;
    for (const [key, value] of Object.entries(details)) this[key] = value;
  }
}

function fail(code, message, details) {
  throw new AuthoringCommitSidecarError(code, message, details);
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
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function frozen(value, label) {
  try {
    return deepFreeze(stableValue(value));
  } catch (error) {
    fail(
      "COMMIT_SIDECAR_INPUT_INVALID",
      `${label} must be one canonical JSON value: ${error.message}`,
    );
  }
}

function same(left, right) {
  return canonicalize(left) === canonicalize(right);
}

function exactType(resource, target) {
  return (
    resource.apiVersion === target.resourceType.apiVersion &&
    resource.kind === target.resourceType.kind
  );
}

function one(values, predicate, code, label) {
  const matches = values.filter(predicate);
  if (matches.length !== 1) {
    fail(
      code,
      `${label} must resolve exactly once; resolved ${matches.length}`,
    );
  }
  return matches[0];
}

function validateClosedContract(validateContract, resource) {
  if (
    typeof validateContract !== "function" ||
    types.isAsyncFunction(validateContract)
  ) {
    fail(
      "COMMIT_SIDECAR_CONTRACT_VALIDATOR_INVALID",
      "commit sidecar validation requires one synchronous contract validator",
    );
  }
  let valid;
  try {
    valid = validateContract(frozen(resource, "sidecar resource"));
  } catch {
    fail(
      "COMMIT_SIDECAR_CONTRACT_REJECTED",
      `${resource?.kind ?? "sidecar resource"} failed its closed structural contract`,
    );
  }
  if (valid !== true) {
    if (valid !== null && types.isPromise(valid)) {
      Reflect.apply(Promise.prototype.then, valid, [undefined, () => {}]);
      fail(
        "COMMIT_SIDECAR_CONTRACT_VALIDATOR_INVALID",
        "commit sidecar contract validation returned asynchronously",
      );
    }
    fail(
      "COMMIT_SIDECAR_CONTRACT_REJECTED",
      `${resource?.kind ?? "sidecar resource"} failed its closed structural contract`,
    );
  }
}

function assertTargetConfinement(binding, resources) {
  const targets = binding.targets;
  const matchedIndexes = resources.map((resource, resourceIndex) => {
    const indexes = targets.flatMap((target, targetIndex) =>
      exactType(resource, target) ? [targetIndex] : []);
    if (indexes.length !== 1) {
      fail(
        "COMMIT_SIDECAR_TARGET_MISMATCH",
        `sidecar ${binding.id} resource ${resourceIndex} resolves ${indexes.length} targets`,
      );
    }
    return indexes[0];
  });
  for (let index = 1; index < matchedIndexes.length; index += 1) {
    if (matchedIndexes[index] < matchedIndexes[index - 1]) {
      fail(
        "COMMIT_SIDECAR_TARGET_ORDER_MISMATCH",
        `sidecar ${binding.id} resources differ from manifest target order`,
      );
    }
  }
  targets.forEach((target, targetIndex) => {
    const count = matchedIndexes.filter(
      (index) => index === targetIndex,
    ).length;
    if (
      count < target.cardinality.min ||
      count > target.cardinality.max
    ) {
      fail(
        "COMMIT_SIDECAR_CARDINALITY_MISMATCH",
        `sidecar ${binding.id} target ${target.resourceType.kind} produced ${count}, expected ${target.cardinality.min}..${target.cardinality.max}`,
      );
    }
  });
}

function assertUniqueNewResources(existingResources, resources) {
  const existing = new Set(
    existingResources.map((resource) =>
      canonicalize(resourceReferenceFrom(resource))),
  );
  const seen = new Set();
  for (const resource of resources) {
    let reference;
    try {
      reference = resourceReferenceFrom(resource);
    } catch (error) {
      fail(
        "COMMIT_SIDECAR_RESOURCE_INVALID",
        `sidecar resource cannot be identified: ${error.message}`,
      );
    }
    const key = canonicalize(reference);
    if (existing.has(key) || seen.has(key)) {
      fail(
        "COMMIT_SIDECAR_RESOURCE_DUPLICATE",
        `sidecar resource ${reference.name} is not one new exact identity`,
      );
    }
    seen.add(key);
  }
}

function validateResources({
  profile,
  compiled,
  resources,
  inventory,
  validateContract,
}) {
  for (const resource of resources) {
    validateClosedContract(validateContract, resource);
    const schemaBinding = one(
      profile.spec.schemaBindings,
      (entry) =>
        entry.resourceType.apiVersion === resource.apiVersion &&
        entry.resourceType.kind === resource.kind,
      "COMMIT_SIDECAR_SCHEMA_BINDING_UNRESOLVED",
      `sidecar ${resource.kind} schema binding`,
    );
    const structural = invokeValidator(
      compiled,
      schemaBinding.schema,
      {
        phase: "commit-sidecar-structure",
        resource,
        resources: inventory,
      },
    );
    if (structural.status === "reject") {
      fail(
        "COMMIT_SIDECAR_STRUCTURE_REJECTED",
        `${resource.kind} sidecar failed its profile-pinned structural validator`,
        { issues: structural.issues },
      );
    }
    const semantic = invokeValidator(
      compiled,
      schemaBinding.semanticValidator,
      {
        phase: "commit-sidecar-semantics",
        resource,
        resources: inventory,
      },
    );
    if (semantic.status === "reject") {
      fail(
        "COMMIT_SIDECAR_SEMANTICS_REJECTED",
        `${resource.kind} sidecar failed its profile-pinned semantic validator`,
        { issues: semantic.issues },
      );
    }
  }
}

/**
 * Derive profile-declared immutable evidence after a finalized Receipt exists
 * but before the transaction post-image is published.
 */
export function deriveCommitSidecars({
  profile: profileInput,
  transitionId,
  executables,
  request,
  assignment,
  submission,
  contextClosure,
  mutation,
  receipt,
  resources: resourceInput,
  validateContract,
}) {
  const profile = frozen(profileInput, "profile");
  const inventory = frozen(resourceInput, "resource inventory");
  if (!Array.isArray(inventory)) {
    fail(
      "COMMIT_SIDECAR_INPUT_INVALID",
      "commit sidecar inventory must be one resource array",
    );
  }
  const transition = one(
    profile.spec.transitionBindings,
    (binding) => binding.transitionId === transitionId,
    "COMMIT_SIDECAR_TRANSITION_UNRESOLVED",
    `transition ${String(transitionId)}`,
  );
  const bindingIds = transition.commitSidecarBindingIds ?? [];
  if (bindingIds.length === 0) return Object.freeze([]);
  for (const [label, value] of Object.entries({
    request,
    assignment,
    submission,
    contextClosure,
    mutation,
    receipt,
  })) {
    if (!isRecord(value)) {
      fail(
        "COMMIT_SIDECAR_ANCESTRY_REQUIRED",
        `commit sidecar transition requires exact ${label} ancestry`,
      );
    }
  }
  const compiled = compileExecutableRegistry(executables);
  const derived = [];
  for (const bindingId of bindingIds) {
    const binding = one(
      profile.spec.commitSidecarBindings ?? [],
      (candidate) => candidate.id === bindingId,
      "COMMIT_SIDECAR_BINDING_UNRESOLVED",
      `commit sidecar binding ${bindingId}`,
    );
    const callbackInventory = frozen(
      [...inventory, ...derived],
      "sidecar callback inventory",
    );
    const result = invokeSidecar(
      compiled,
      binding.executable,
      {
        request,
        assignment,
        submission,
        contextClosure,
        mutation,
        receipt,
        resources: callbackInventory,
      },
    );
    if (result.status === "reject") {
      fail(
        "COMMIT_SIDECAR_REJECTED",
        `commit sidecar ${binding.id} rejected its exact commit graph`,
        { issues: result.issues },
      );
    }
    if (
      derived.length + result.resources.length >
        COMMIT_SIDECAR_RESOURCE_LIMIT
    ) {
      fail(
        "COMMIT_SIDECAR_RESOURCE_LIMIT_EXCEEDED",
        `transition ${transitionId} produced more than ${COMMIT_SIDECAR_RESOURCE_LIMIT} total sidecar resources`,
      );
    }
    assertTargetConfinement(binding, result.resources);
    assertUniqueNewResources(
      [...inventory, ...derived],
      result.resources,
    );
    const completeInventory = frozen(
      [...callbackInventory, ...result.resources],
      "sidecar validation inventory",
    );
    validateResources({
      profile,
      compiled,
      resources: result.resources,
      inventory: completeInventory,
      validateContract,
    });
    derived.push(...result.resources.map((resource) =>
      frozen(resource, "commit sidecar resource")));
  }
  return frozen(derived, "derived commit sidecars");
}
