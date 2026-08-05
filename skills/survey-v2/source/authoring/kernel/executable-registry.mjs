import { types } from "node:util";
import { stableValue } from "./canonical.mjs";
import {
  COMMIT_SIDECAR_RESOURCE_LIMIT,
} from "./limits.mjs";

const digestPattern = /^sha256:[0-9a-f]{64}$/u;
const semanticIdPattern =
  /^[a-z][a-z0-9]*(?:[._:/-][a-z0-9]+)*$/u;
const eventIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$/u;
const fieldPathPattern =
  /^(?:\/(?:[^~/]|~0|~1)*)*$/u;
const requiredRegistryKinds = Object.freeze([
  "guards",
  "handlers",
  "validators",
]);
const optionalRegistryKinds = Object.freeze([
  "projectors",
  "sidecars",
]);
const registryKinds = Object.freeze([
  ...requiredRegistryKinds,
  ...optionalRegistryKinds,
]);
const exactBytesMediaTypePattern =
  /^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+(?:;[A-Za-z0-9!#$&^_.+ -]+=[A-Za-z0-9!#$&^_.+ -]+)*$/u;
const promiseThen = Promise.prototype.then;
const compiledRegistryStates = new WeakMap();

export class AuthoringExecutableRegistryError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "AuthoringExecutableRegistryError";
    this.code = code;
    for (const [key, value] of Object.entries(details)) this[key] = value;
  }
}

function fail(code, message, details) {
  throw new AuthoringExecutableRegistryError(code, message, details);
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

function isClosedArray(value, maximumLength) {
  if (
    !Array.isArray(value) ||
    types.isProxy(value) ||
    value.length > maximumLength
  ) {
    return false;
  }
  const ownKeys = Reflect.ownKeys(value);
  if (
    ownKeys.length !== value.length + 1 ||
    ownKeys.some(
      (key) =>
        key !== "length" &&
        (
          typeof key !== "string" ||
          !/^(?:0|[1-9][0-9]*)$/u.test(key) ||
          Number(key) >= value.length
        ),
    )
  ) {
    return false;
  }
  for (let index = 0; index < value.length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    if (
      descriptor?.enumerable !== true ||
      !Object.prototype.hasOwnProperty.call(descriptor, "value")
    ) {
      return false;
    }
  }
  return true;
}

function detachedFrozen(value) {
  const detached = stableValue(value);
  const pending = [detached];
  while (pending.length > 0) {
    const current = pending.pop();
    if (current === null || typeof current !== "object") continue;
    for (const item of Object.values(current)) {
      if (item !== null && typeof item === "object") pending.push(item);
    }
    Object.freeze(current);
  }
  return detached;
}

function assertBinding(binding, label) {
  if (
    !exactKeys(binding, ["id", "digest"]) ||
    typeof binding.id !== "string" ||
    binding.id.length > 160 ||
    !semanticIdPattern.test(binding.id) ||
    !digestPattern.test(binding.digest ?? "")
  ) {
    fail(
      "EXECUTABLE_BINDING_INVALID",
      `${label} must be one exact id-and-digest binding`,
    );
  }
}

function assertDomainIssue(value, label) {
  if (
    !exactKeys(value, ["code", "field", "reason", "correction"]) ||
    typeof value.code !== "string" ||
    [...value.code].length > 80 ||
    !eventIdPattern.test(value.code) ||
    typeof value.field !== "string" ||
    [...value.field].length > 1024 ||
    !value.field.isWellFormed() ||
    !fieldPathPattern.test(value.field) ||
    typeof value.reason !== "string" ||
    [...value.reason].length < 1 ||
    [...value.reason].length > 4096 ||
    !value.reason.isWellFormed() ||
    !/\S/u.test(value.reason) ||
    typeof value.correction !== "string" ||
    [...value.correction].length < 1 ||
    [...value.correction].length > 4096 ||
    !value.correction.isWellFormed() ||
    !/\S/u.test(value.correction)
  ) {
    fail(
      "EXECUTABLE_DOMAIN_ISSUE_INVALID",
      `${label} is not one closed DomainIssue record`,
    );
  }
}

function assertIssueList(value, label) {
  if (
    !Array.isArray(value) ||
    value.length < 1 ||
    value.length > 256
  ) {
    fail(
      "EXECUTABLE_DOMAIN_ISSUE_INVALID",
      `${label} must contain one through 256 DomainIssue records`,
    );
  }
  value.forEach((entry, index) =>
    assertDomainIssue(entry, `${label}/${index}`));
}

function assertExactBytes(value, label) {
  if (
    !exactKeys(value, ["mediaType", "encoding", "byteLength", "data"]) ||
    typeof value.mediaType !== "string" ||
    value.mediaType.length < 3 ||
    value.mediaType.length > 128 ||
    !exactBytesMediaTypePattern.test(value.mediaType) ||
    value.encoding !== "base64" ||
    !Number.isInteger(value.byteLength) ||
    value.byteLength < 0 ||
    value.byteLength > 1048576 ||
    typeof value.data !== "string" ||
    value.data.length > 1398104
  ) {
    fail(
      "EXECUTABLE_RESULT_INVALID",
      `${label} must be one closed bounded ExactBytes record`,
    );
  }
  const bytes = Buffer.from(value.data, "base64");
  if (
    bytes.toString("base64") !== value.data ||
    bytes.byteLength !== value.byteLength
  ) {
    fail(
      "EXECUTABLE_RESULT_INVALID",
      `${label} must contain canonical base64 with its exact decoded length`,
    );
  }
}

function assertRegistry(registry) {
  const keys = isRecord(registry)
    ? Reflect.ownKeys(registry)
    : [];
  if (
    !isRecord(registry) ||
    requiredRegistryKinds.some((kind) => !keys.includes(kind)) ||
    keys.some(
      (key) =>
        typeof key !== "string" ||
        !registryKinds.includes(key),
    ) ||
    keys.some((key) => {
      const descriptor = Object.getOwnPropertyDescriptor(registry, key);
      return (
        descriptor?.enumerable !== true ||
        !Object.prototype.hasOwnProperty.call(descriptor, "value")
      );
    })
  ) {
    fail(
      "EXECUTABLE_REGISTRY_INVALID",
      "executable registry must contain guards, handlers, validators, and only optional projectors or sidecars",
    );
  }
  for (const kind of registryKinds) {
    const entries = registry[kind] ?? [];
    if (!isClosedArray(entries, 512)) {
      fail(
        "EXECUTABLE_REGISTRY_INVALID",
        `${kind} must be a bounded executable array`,
      );
    }
    const identities = new Set();
    const ids = new Set();
    for (const [index, entry] of entries.entries()) {
      if (
        !exactKeys(entry, ["id", "digest", "invoke"]) ||
        typeof entry.id !== "string" ||
        entry.id.length > 160 ||
        !semanticIdPattern.test(entry.id) ||
        !digestPattern.test(entry.digest ?? "") ||
        typeof entry.invoke !== "function"
      ) {
        fail(
          "EXECUTABLE_REGISTRY_INVALID",
          `${kind}/${index} is not one closed executable entry`,
        );
      }
      if (types.isAsyncFunction(entry.invoke)) {
        fail(
          "EXECUTABLE_ASYNC_FORBIDDEN",
          `${kind} executable ${entry.id} is a native AsyncFunction`,
          { id: entry.id, kind },
        );
      }
      const identity = `${entry.id}\u0000${entry.digest}`;
      if (identities.has(identity) || ids.has(entry.id)) {
        fail(
          "EXECUTABLE_REGISTRY_DUPLICATE",
          `${kind} contains a duplicate executable identity`,
          { id: entry.id, kind },
        );
      }
      identities.add(identity);
      ids.add(entry.id);
    }
  }
}

/**
 * Validate and index one operational executable registry. Functions remain
 * outside every semantic digest; only exact manifest id-and-digest bindings
 * can select them.
 */
export function compileExecutableRegistry(registry) {
  assertRegistry(registry);
  const indexes = {};
  for (const kind of registryKinds) {
    indexes[kind] = new Map(
      (registry[kind] ?? []).map((entry) => [
        entry.id,
        Object.freeze({
          digest: entry.digest,
          id: entry.id,
          invoke: entry.invoke,
        }),
      ]),
    );
  }
  const compiled = Object.freeze(Object.create(null));
  compiledRegistryStates.set(compiled, indexes);
  return compiled;
}

export function resolveExecutable(compiled, kind, binding) {
  const indexes =
    compiled !== null &&
    (typeof compiled === "object" || typeof compiled === "function")
      ? compiledRegistryStates.get(compiled)
      : undefined;
  if (
    !registryKinds.includes(kind) ||
    !indexes
  ) {
    fail(
      "EXECUTABLE_REGISTRY_INVALID",
      "compiled executable registry is unavailable",
    );
  }
  assertBinding(binding, `${kind} binding`);
  const selected = indexes[kind].get(binding.id);
  if (!selected) {
    fail(
      "EXECUTABLE_MISSING",
      `${kind} executable ${binding.id} is not registered`,
      { id: binding.id, kind },
    );
  }
  if (selected.digest !== binding.digest) {
    fail(
      "EXECUTABLE_DIGEST_MISMATCH",
      `${kind} executable ${binding.id} differs from its manifest digest`,
      { id: binding.id, kind },
    );
  }
  return selected;
}

function invokeSync(executable, input, label) {
  let result;
  try {
    result = executable.invoke(detachedFrozen(input));
  } catch (error) {
    fail(
      "EXECUTABLE_THROWN",
      `${label} threw during synchronous invocation`,
    );
  }
  if (
    result !== null &&
    types.isPromise(result)
  ) {
    Reflect.apply(promiseThen, result, [undefined, () => {}]);
    fail(
      "EXECUTABLE_ASYNC_FORBIDDEN",
      `${label} returned an asynchronous result`,
    );
  }
  try {
    return detachedFrozen(result);
  } catch (error) {
    fail(
      "EXECUTABLE_RESULT_INVALID",
      `${label} returned a non-canonical value: ${error.message}`,
    );
  }
}

function validatePassRejectResult(result, label) {
  if (exactKeys(result, ["status"]) && result.status === "pass") {
    return result;
  }
  if (
    exactKeys(result, ["status", "issues"]) &&
    result.status === "reject"
  ) {
    assertIssueList(result.issues, `${label} issues`);
    return result;
  }
  fail(
    "EXECUTABLE_RESULT_INVALID",
    `${label} must return exactly pass or reject with DomainIssue records`,
  );
}

export function invokeGuard(compiled, binding, input) {
  const executable = resolveExecutable(compiled, "guards", binding);
  return validatePassRejectResult(
    invokeSync(executable, input, `guard ${binding.id}`),
    `guard ${binding.id}`,
  );
}

export function invokeValidator(compiled, binding, input) {
  const executable = resolveExecutable(compiled, "validators", binding);
  return validatePassRejectResult(
    invokeSync(executable, input, `validator ${binding.id}`),
    `validator ${binding.id}`,
  );
}

export function invokeHandler(compiled, binding, input) {
  const executable = resolveExecutable(compiled, "handlers", binding);
  const result = invokeSync(executable, input, `handler ${binding.id}`);
  if (
    exactKeys(result, ["status", "products"]) &&
    result.status === "accept" &&
    Array.isArray(result.products) &&
    result.products.length <= 256
  ) {
    return result;
  }
  if (
    exactKeys(result, ["status", "issues"]) &&
    result.status === "reject"
  ) {
    assertIssueList(result.issues, `handler ${binding.id} issues`);
    return result;
  }
  fail(
    "EXECUTABLE_RESULT_INVALID",
    `handler ${binding.id} must return exactly accept with products or reject with DomainIssue records`,
  );
}

export function invokeProjector(compiled, binding, input) {
  const executable = resolveExecutable(compiled, "projectors", binding);
  const result = invokeSync(
    executable,
    input,
    `projector ${binding.id}`,
  );
  if (
    exactKeys(result, ["status", "content"]) &&
    result.status === "accept"
  ) {
    assertExactBytes(
      result.content,
      `projector ${binding.id} content`,
    );
    return result;
  }
  if (
    exactKeys(result, ["status", "issues"]) &&
    result.status === "reject"
  ) {
    assertIssueList(result.issues, `projector ${binding.id} issues`);
    return result;
  }
  fail(
    "EXECUTABLE_RESULT_INVALID",
    `projector ${binding.id} must return exactly accept with ExactBytes or reject with DomainIssue records`,
  );
}

export function invokeSidecar(compiled, binding, input) {
  const executable = resolveExecutable(compiled, "sidecars", binding);
  const result = invokeSync(
    executable,
    input,
    `sidecar ${binding.id}`,
  );
  if (
    exactKeys(result, ["status", "resources"]) &&
    result.status === "accept" &&
    isClosedArray(
      result.resources,
      COMMIT_SIDECAR_RESOURCE_LIMIT,
    ) &&
    result.resources.every((resource) => isRecord(resource))
  ) {
    return result;
  }
  if (
    exactKeys(result, ["status", "issues"]) &&
    result.status === "reject"
  ) {
    assertIssueList(result.issues, `sidecar ${binding.id} issues`);
    return result;
  }
  fail(
    "EXECUTABLE_RESULT_INVALID",
    `sidecar ${binding.id} must return exactly accept with resources or reject with DomainIssue records`,
  );
}

export function freezeExecutableInput(value) {
  return detachedFrozen(value);
}
