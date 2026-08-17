import { types as utilTypes } from "node:util";
import { deepCloneCanonical } from "../engine/canonical-json.mjs";
import { ValidationError } from "../engine/errors.mjs";

export function stabilizeJson(value) {
  return deepCloneCanonical(value);
}

function inertDataDescriptors(value, label) {
  if (utilTypes.isProxy(value)) {
    throw new ValidationError(`${label} rejects executable proxy views`);
  }
  if (
    value === null ||
    typeof value !== "object" ||
    (Object.getPrototypeOf(value) !== Object.prototype &&
      Object.getPrototypeOf(value) !== null)
  ) {
    throw new ValidationError(`${label} must be a plain object`);
  }
  const descriptors = Object.getOwnPropertyDescriptors(value);
  for (const property of Reflect.ownKeys(descriptors)) {
    const descriptor = descriptors[property];
    if (
      typeof property !== "string" ||
      !descriptor.enumerable ||
      !Object.hasOwn(descriptor, "value") ||
      Object.hasOwn(descriptor, "get") ||
      Object.hasOwn(descriptor, "set")
    ) {
      throw new ValidationError(`${label} rejects executable property views`);
    }
  }
  return descriptors;
}

function inertArrayValues(value, label) {
  if (utilTypes.isProxy(value)) {
    throw new ValidationError(`${label} rejects executable proxy views`);
  }
  if (!Array.isArray(value)) {
    throw new ValidationError(`${label} must be an array`);
  }
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const length = descriptors.length?.value;
  if (!Number.isSafeInteger(length) || length < 0) {
    throw new ValidationError(`${label} has an invalid array length`);
  }
  const expected = new Set([
    ...Array.from({ length }, (_, index) => String(index)),
    "length",
  ]);
  for (const property of Reflect.ownKeys(descriptors)) {
    const descriptor = descriptors[property];
    if (
      typeof property !== "string" ||
      !expected.has(property) ||
      !Object.hasOwn(descriptor, "value") ||
      Object.hasOwn(descriptor, "get") ||
      Object.hasOwn(descriptor, "set")
    ) {
      throw new ValidationError(`${label} rejects executable property views`);
    }
  }
  if (Reflect.ownKeys(descriptors).length !== expected.size) {
    throw new ValidationError(`${label} rejects sparse arrays`);
  }
  return Array.from(
    { length },
    (_, index) => descriptors[String(index)].value,
  );
}

/**
 * Registered functions are trusted package code. Everything around them is
 * copied through the inert canonical JSON boundary before the function can run.
 */
export function stabilizeTrustedCallbackConfig(
  value,
  callbackKeys,
  label = "Trusted callback configuration",
  requiredCallbackKeys = callbackKeys,
) {
  const descriptors = inertDataDescriptors(value, label);
  const callbackSet = new Set(callbackKeys);
  const callbacks = {};
  const data = Object.create(null);
  for (const [key, descriptor] of Object.entries(descriptors)) {
    if (callbackSet.has(key)) {
      if (typeof descriptor.value !== "function") {
        throw new ValidationError(`${label} requires registered callback ${key}`);
      }
      callbacks[key] = descriptor.value;
    } else {
      data[key] = descriptor.value;
    }
  }
  for (const key of requiredCallbackKeys) {
    if (!Object.hasOwn(callbacks, key)) {
      throw new ValidationError(`${label} requires registered callback ${key}`);
    }
  }
  return {
    config: stabilizeJson(data),
    callbacks: Object.freeze(callbacks),
    trustedCodeBoundary: "registered_package_function",
  };
}

export function stabilizeConfigWithTrustedFields(
  value,
  trustedKeys,
  label = "Trusted-field configuration",
  requiredTrustedKeys = trustedKeys,
) {
  const descriptors = inertDataDescriptors(value, label);
  const trustedSet = new Set(trustedKeys);
  const trusted = {};
  const data = Object.create(null);
  for (const [key, descriptor] of Object.entries(descriptors)) {
    if (trustedSet.has(key)) trusted[key] = descriptor.value;
    else data[key] = descriptor.value;
  }
  for (const key of requiredTrustedKeys) {
    if (!Object.hasOwn(trusted, key)) {
      throw new ValidationError(`${label} requires trusted field ${key}`);
    }
  }
  return {
    config: stabilizeJson(data),
    trusted: Object.freeze(trusted),
  };
}

export function stabilizeTrustedCallbackRecords(
  records,
  callbackKey,
  label = "Trusted callback records",
) {
  const recordValues = inertArrayValues(records, label);
  const stableRecords = stabilizeJson(
    recordValues.map((record, index) => {
      const descriptors = inertDataDescriptors(record, `${label}[${index}]`);
      const data = Object.create(null);
      for (const [key, descriptor] of Object.entries(descriptors)) {
        if (key !== callbackKey) data[key] = descriptor.value;
      }
      return data;
    }),
  );
  const callbacks = recordValues.map((record, index) => {
    const descriptors = inertDataDescriptors(record, `${label}[${index}]`);
    const callback = descriptors[callbackKey]?.value;
    if (typeof callback !== "function") {
      throw new ValidationError(
        `${label}[${index}] requires registered callback ${callbackKey}`,
      );
    }
    return callback;
  });
  return stableRecords.map((record, index) => ({
    ...record,
    [callbackKey]: callbacks[index],
  }));
}
