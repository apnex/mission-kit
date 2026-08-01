import { createHash } from "node:crypto";
import { types as utilTypes } from "node:util";

export const HASH_PROFILE_ID = "survey-evaluator-sha256-jcs-v1";
export const HASH_NAMESPACE = "survey-skill-evaluator/hash/v1";

function assertUnicodeScalarString(value, location) {
  for (let index = 0; index < value.length; index += 1) {
    const unit = value.charCodeAt(index);
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) {
        throw new TypeError(`${location}: unpaired high surrogate`);
      }
      index += 1;
    } else if (unit >= 0xdc00 && unit <= 0xdfff) {
      throw new TypeError(`${location}: unpaired low surrogate`);
    }
  }
}

function isPlainObject(value) {
  if (value === null || typeof value !== "object") return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function dataPropertyValue(value, key, location, { enumerable = true } = {}) {
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  if (
    descriptor === undefined ||
    !Object.hasOwn(descriptor, "value") ||
    descriptor.enumerable !== enumerable
  ) {
    throw new TypeError(
      `${location}: canonical JSON properties must be inert ${enumerable ? "enumerable " : ""}data properties`
    );
  }
  return descriptor.value;
}

function serialize(value, location, ancestors) {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "string") {
    assertUnicodeScalarString(value, location);
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError(`${location}: non-finite JSON number`);
    }
    return Object.is(value, -0) ? "0" : JSON.stringify(value);
  }
  if (typeof value !== "object") {
    throw new TypeError(`${location}: value is outside the JSON data model`);
  }
  if (utilTypes.isProxy(value)) {
    throw new TypeError(`${location}: proxy objects are outside the JSON data model`);
  }
  if (ancestors.has(value)) {
    throw new TypeError(`${location}: cyclic JSON value`);
  }
  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      const ownKeys = Reflect.ownKeys(value);
      const expectedKeys = new Set([
        ...Array.from({ length: value.length }, (_, index) => String(index)),
        "length"
      ]);
      if (
        ownKeys.length !== expectedKeys.size ||
        ownKeys.some((key) => typeof key !== "string" || !expectedKeys.has(key))
      ) {
        throw new TypeError(`${location}: JSON arrays cannot have extra properties`);
      }
      dataPropertyValue(value, "length", `${location}.length`, {
        enumerable: false
      });
      const items = [];
      for (let index = 0; index < value.length; index += 1) {
        const item = dataPropertyValue(
          value,
          String(index),
          `${location}[${index}]`
        );
        items.push(serialize(item, `${location}[${index}]`, ancestors));
      }
      return `[${items.join(",")}]`;
    }
    if (!isPlainObject(value)) {
      throw new TypeError(`${location}: JSON object must have a plain prototype`);
    }
    const ownKeys = Reflect.ownKeys(value);
    if (ownKeys.some((key) => typeof key !== "string")) {
      throw new TypeError(`${location}: JSON objects cannot have symbol properties`);
    }
    const keys = [...ownKeys].sort();
    const members = [];
    for (const key of keys) {
      assertUnicodeScalarString(key, `${location}{key}`);
      const member = dataPropertyValue(value, key, `${location}.${key}`);
      members.push(
        `${JSON.stringify(key)}:${serialize(member, `${location}.${key}`, ancestors)}`
      );
    }
    return `{${members.join(",")}}`;
  } finally {
    ancestors.delete(value);
  }
}

export function canonicalize(value) {
  return serialize(value, "$", new Set());
}

export function canonicalBytes(value) {
  return Buffer.from(canonicalize(value), "utf8");
}

export function rawSha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function frame(bytes) {
  const value = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  const prefix = Buffer.alloc(8);
  prefix.writeBigUInt64BE(BigInt(value.length));
  return Buffer.concat([prefix, value]);
}

export function semanticHash(tag, value) {
  const bytes = Buffer.concat([
    frame(Buffer.from(HASH_NAMESPACE, "utf8")),
    frame(Buffer.from(tag, "utf8")),
    frame(canonicalBytes(value))
  ]);
  return rawSha256(bytes);
}

export function inventoryEntry(entry) {
  if (!Buffer.isBuffer(entry.bytes)) {
    throw new TypeError(`inventory bytes must be a Buffer: ${entry.path}`);
  }
  if (!["0644", "0755"].includes(entry.mode)) {
    throw new Error(`invalid portable mode for ${entry.path}: ${entry.mode}`);
  }
  return {
    path: entry.path,
    mode: entry.mode,
    byteLength: entry.bytes.length,
    rawFileSha256: rawSha256(entry.bytes)
  };
}

function assertInventoryPaths(entries) {
  const folded = new Map();
  for (const entry of entries) {
    const relativePath = entry.path;
    if (
      typeof relativePath !== "string" ||
      relativePath.length === 0 ||
      relativePath.startsWith("/") ||
      relativePath.includes("\\") ||
      relativePath.includes("\0")
    ) {
      throw new Error(`invalid package path: ${JSON.stringify(relativePath)}`);
    }
    assertUnicodeScalarString(relativePath, "inventory path");
    const segments = relativePath.split("/");
    if (
      segments.some(
        (segment) => segment === "" || segment === "." || segment === ".."
      )
    ) {
      throw new Error(`invalid package path segment: ${relativePath}`);
    }
    const key = relativePath.replace(/[A-Z]/g, (character) =>
      character.toLowerCase()
    );
    const prior = folded.get(key);
    if (prior !== undefined) {
      throw new Error(`ASCII case-fold path collision: ${prior} <> ${relativePath}`);
    }
    folded.set(key, relativePath);
  }
}

export function foldPackageInventory(rootKind, entries, orderedExclusions) {
  if (!["candidate-package", "evaluator-payload"].includes(rootKind)) {
    throw new Error(`unsupported package rootKind: ${rootKind}`);
  }
  const requiredExclusions =
    rootKind === "candidate-package" ? [] : ["package.manifest.json"];
  if (canonicalize(orderedExclusions) !== canonicalize(requiredExclusions)) {
    throw new Error(
      `${rootKind} requires exclusions ${canonicalize(requiredExclusions)}`
    );
  }
  assertInventoryPaths(entries);
  const orderedEntries = [...entries].sort((left, right) =>
    Buffer.compare(Buffer.from(left.path, "utf8"), Buffer.from(right.path, "utf8"))
  );
  let fold = semanticHash("package-inventory-fold-empty/v1", {
    rootKind,
    exclusions: orderedExclusions
  });
  const inventory = orderedEntries.map(inventoryEntry);
  inventory.forEach((item, index) => {
    const entryDigest = semanticHash("package-inventory-entry/v1", item);
    fold = semanticHash("package-inventory-fold-step/v1", {
      rootKind,
      index: index + 1,
      prior: fold,
      entryDigest
    });
  });
  return {
    inventory,
    root: semanticHash(`${rootKind}-inventory/v1`, {
      entryCount: inventory.length,
      exclusions: orderedExclusions,
      finalFold: fold
    })
  };
}

export function foldNamedTree(tag, entries) {
  const inventory = [...entries]
    .sort((left, right) =>
      Buffer.compare(Buffer.from(left.path, "utf8"), Buffer.from(right.path, "utf8"))
    )
    .map(inventoryEntry);
  let fold = semanticHash(`${tag}-empty/v1`, { entryCount: 0 });
  inventory.forEach((item, index) => {
    fold = semanticHash(`${tag}-step/v1`, {
      index: index + 1,
      prior: fold,
      entryDigest: semanticHash(`${tag}-entry/v1`, item)
    });
  });
  return {
    inventory,
    root: semanticHash(`${tag}/v1`, {
      entryCount: inventory.length,
      finalFold: fold
    })
  };
}

export function evaluatorPackageDigest(manifestDigest, payloadRoot) {
  return semanticHash("evaluator-package/v1", { manifestDigest, payloadRoot });
}

export function evaluatorManifestDigest(manifestValue) {
  return semanticHash("evaluator-package-manifest/v1", manifestValue);
}

export function absentAuthoritativeStateRoot(machineId, objectId, schemaVersion) {
  return semanticHash("absent-authoritative-state/v1", {
    machineId,
    objectId,
    schemaVersion
  });
}

const FORBIDDEN_GENESIS_PAYLOAD_KEYS = new Set([
  "authoritativeStateRoot",
  "currentParentEventDigest",
  "currentParentResultingRoot",
  "eventLedger",
  "futureRoot",
  "genesisCoreDigest",
  "genesisRecord",
  "genesisRecordDigest",
  "initialAuthoritativeStateRoot",
  "initialSemanticCoreDigest",
  "outboxLedger",
  "semanticCoreDigest"
]);

function assertAcyclicGenesisPayload(value, location = "initialSemanticPayload") {
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      assertAcyclicGenesisPayload(item, `${location}[${index}]`)
    );
    return;
  }
  if (value === null || typeof value !== "object") return;
  for (const [key, item] of Object.entries(value)) {
    if (FORBIDDEN_GENESIS_PAYLOAD_KEYS.has(key) || /^future[A-Z_]/u.test(key)) {
      throw new Error(`${location}.${key}: forbidden genesis self/future field`);
    }
    assertAcyclicGenesisPayload(item, `${location}.${key}`);
  }
}

export function parentStagedGenesis({
  machineId,
  objectId,
  schemaVersion,
  parentMachineId,
  parentObjectId,
  parentPriorAuthoritativeRoot,
  parentOrderId,
  parentFence,
  initialSemanticPayload
}) {
  assertAcyclicGenesisPayload(initialSemanticPayload);
  const absentSentinel = absentAuthoritativeStateRoot(
    machineId,
    objectId,
    schemaVersion
  );
  const genesisCore = {
    creationClass: "parent_staged_genesis",
    machineId,
    objectId,
    schemaVersion,
    absentSentinel,
    parentBinding: {
      parentMachineId,
      parentObjectId,
      parentPriorAuthoritativeRoot,
      parentOrderId,
      parentFence
    },
    initialSemanticPayload
  };
  const genesisCoreDigest = semanticHash(
    "parent-staged-genesis-core/v1",
    genesisCore
  );
  const semanticState = {
    revision: 0,
    creationClass: "parent_staged_genesis",
    genesisCoreDigest,
    semantic: initialSemanticPayload
  };
  const initialSemanticCoreDigest = semanticHash(
    "initial-semantic-core/v1",
    semanticState
  );
  const authoritativeStateCore = {
    semanticState,
    semanticCoreDigest: initialSemanticCoreDigest,
    eventLedger: [],
    outboxLedger: []
  };
  const initialAuthoritativeStateRoot = semanticHash(
    "authoritative-state/v1",
    authoritativeStateCore
  );
  const authoritativeStateRecord = {
    authoritativeStateCore,
    authoritativeStateRoot: initialAuthoritativeStateRoot
  };
  const genesisRecord = {
    genesisCore,
    genesisCoreDigest,
    initialSemanticCoreDigest,
    initialAuthoritativeStateRoot
  };
  const genesisRecordDigest = semanticHash(
    "parent-staged-genesis-record/v1",
    genesisRecord
  );
  return {
    absentSentinel,
    genesisCore,
    genesisCoreDigest,
    semanticState,
    initialSemanticCoreDigest,
    authoritativeStateCore,
    initialAuthoritativeStateRoot,
    authoritativeStateRecord,
    genesisRecord,
    genesisRecordDigest
  };
}
