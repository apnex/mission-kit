import { createHash } from "node:crypto";
import { types } from "node:util";

function assertScalarString(value, label) {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) {
        throw new TypeError(`canonical JSON rejects unpaired surrogate in ${label}`);
      }
      index += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      throw new TypeError(`canonical JSON rejects unpaired surrogate in ${label}`);
    }
  }
}

function canonicalizeInner(value, active) {
  if (value === null || typeof value === "boolean" || typeof value === "string") {
    if (typeof value === "string") assertScalarString(value, "string");
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("canonical JSON rejects non-finite numbers");
    return JSON.stringify(Object.is(value, -0) ? 0 : value);
  }
  if (Array.isArray(value)) {
    if (types.isProxy(value)) throw new TypeError("canonical JSON rejects proxy arrays");
    if (active.has(value)) throw new TypeError("canonical JSON rejects cyclic arrays");
    if (
      Object.keys(value).length !== value.length ||
      Array.from({ length: value.length }, (_, index) => index).some((index) => !Object.hasOwn(value, index))
    ) {
      throw new TypeError("canonical JSON rejects sparse arrays");
    }
    const ownKeys = Reflect.ownKeys(value);
    if (ownKeys.some((key) => key !== "length" && (typeof key !== "string" || !/^(?:0|[1-9][0-9]*)$/.test(key)))) {
      throw new TypeError("canonical JSON rejects arrays with extra properties");
    }
    for (let index = 0; index < value.length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
      if (!descriptor?.enumerable || !hasOwnDataValue(descriptor)) {
        throw new TypeError("canonical JSON rejects accessor or non-enumerable array elements");
      }
    }
    active.add(value);
    try {
      return `[${Array.from({ length: value.length }, (_, index) => (
        canonicalizeInner(Object.getOwnPropertyDescriptor(value, String(index)).value, active)
      )).join(",")}]`;
    } finally {
      active.delete(value);
    }
  }
  if (typeof value === "object") {
    if (types.isProxy(value)) throw new TypeError("canonical JSON rejects proxy objects");
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError("canonical JSON rejects non-plain objects");
    }
    if (active.has(value)) throw new TypeError("canonical JSON rejects cyclic objects");
    const keys = Object.keys(value);
    const ownKeys = Reflect.ownKeys(value);
    if (ownKeys.length !== keys.length || ownKeys.some((key) => typeof key !== "string")) {
      throw new TypeError("canonical JSON rejects symbolic or non-enumerable properties");
    }
    const descriptors = new Map();
    for (const key of keys) {
      assertScalarString(key, "object key");
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor?.enumerable || !hasOwnDataValue(descriptor)) {
        throw new TypeError("canonical JSON rejects accessor or non-enumerable object properties");
      }
      descriptors.set(key, descriptor);
    }
    keys.sort();
    active.add(value);
    try {
      return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalizeInner(descriptors.get(key).value, active)}`).join(",")}}`;
    } finally {
      active.delete(value);
    }
  }
  throw new TypeError(`canonical JSON rejects ${typeof value}`);
}

function hasOwnDataValue(descriptor) {
  return Object.prototype.hasOwnProperty.call(descriptor, "value");
}

export function canonicalize(value) {
  return canonicalizeInner(value, new WeakSet());
}

export function stableValue(value) {
  return JSON.parse(canonicalize(value));
}

export function prettyJson(value) {
  return `${JSON.stringify(stableValue(value), null, 2)}\n`;
}

export function sha256Bytes(bytes) {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

export function sha256Value(value) {
  return sha256Bytes(Buffer.from(canonicalize(value), "utf8"));
}

export function withoutKey(object, key) {
  const copy = { ...object };
  delete copy[key];
  return copy;
}

export function base64urlCanonical(value) {
  return Buffer.from(canonicalize(value), "utf8").toString("base64url");
}

export function isUtf8RoundTrip(buffer) {
  const text = buffer.toString("utf8");
  return Buffer.from(text, "utf8").equals(buffer);
}
