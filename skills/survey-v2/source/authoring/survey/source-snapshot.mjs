import { types } from "node:util";
import { validateById } from "../../../generated/validators.mjs";
import {
  isUtf8RoundTrip
} from "../kernel/canonical.mjs";
import {
  encodeExactBytes,
  rawEvidenceDigest,
  sourceSnapshotDigest
} from "../kernel/digests.mjs";
import {
  validateContractSemantics
} from "../kernel/contract-semantics.mjs";

export const SURVEY_SOURCE_MAX_ENTRIES = 256;
export const SURVEY_SOURCE_MAX_ENTRY_BYTES = 1_048_576;
export const SURVEY_SOURCE_MAX_AGGREGATE_BYTES = 16_777_216;

const SOURCE_SNAPSHOT_SCHEMA_ID =
  "urn:mission-kit:authoring:schema:source-snapshot:v1alpha1";
const LOGICAL_NAME_PATTERN =
  /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))(?!.*\\)(?!.*\/\/)[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*$/;

function dataDescriptor(object, key, label) {
  const descriptor = Object.getOwnPropertyDescriptor(object, key);
  if (
    !descriptor?.enumerable ||
    !Object.prototype.hasOwnProperty.call(descriptor, "value")
  ) {
    throw new TypeError(`${label} must be an enumerable data property`);
  }
  return descriptor.value;
}

function assertExactRecord(value, keys, label) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    types.isProxy(value)
  ) {
    throw new TypeError(`${label} must be a plain record`);
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError(`${label} must be a plain record`);
  }
  const ownKeys = Reflect.ownKeys(value);
  if (
    ownKeys.length !== keys.length ||
    ownKeys.some((key) => typeof key !== "string" || !keys.includes(key))
  ) {
    throw new TypeError(`${label} must contain exactly ${keys.join(", ")}`);
  }
  return Object.fromEntries(
    keys.map((key) => [key, dataDescriptor(value, key, `${label}.${key}`)])
  );
}

function orderedEntries(entries) {
  if (!Array.isArray(entries) || types.isProxy(entries)) {
    throw new TypeError("Survey source entries must be an array");
  }
  if (
    entries.length < 1 ||
    entries.length > SURVEY_SOURCE_MAX_ENTRIES
  ) {
    throw new RangeError(
      `Survey source entries must contain 1..${SURVEY_SOURCE_MAX_ENTRIES} items`
    );
  }
  const ownKeys = Reflect.ownKeys(entries);
  if (
    ownKeys.some((key) => (
      key !== "length" &&
      (
        typeof key !== "string" ||
        !/^(?:0|[1-9][0-9]*)$/.test(key) ||
        Number(key) >= entries.length
      )
    ))
  ) {
    throw new TypeError("Survey source entries must not carry ambient fields");
  }
  return Array.from({ length: entries.length }, (_, index) => (
    dataDescriptor(entries, String(index), `Survey source entries[${index}]`)
  ));
}

function normalizedEntry(value, index, seenNames) {
  const entry = assertExactRecord(
    value,
    ["logicalName", "bytes"],
    `Survey source entry ${index + 1}`
  );
  if (
    typeof entry.logicalName !== "string" ||
    entry.logicalName.length < 1 ||
    entry.logicalName.length > 512 ||
    !LOGICAL_NAME_PATTERN.test(entry.logicalName)
  ) {
    throw new TypeError(
      `Survey source entry ${index + 1} has an unsafe logicalName`
    );
  }
  if (seenNames.has(entry.logicalName)) {
    throw new TypeError(
      `Survey source entry ${index + 1} duplicates logicalName ${entry.logicalName}`
    );
  }
  seenNames.add(entry.logicalName);
  if (!(entry.bytes instanceof Uint8Array) || types.isProxy(entry.bytes)) {
    throw new TypeError(
      `Survey source entry ${index + 1} bytes must be a Uint8Array`
    );
  }
  const bytes = Buffer.from(
    entry.bytes.buffer,
    entry.bytes.byteOffset,
    entry.bytes.byteLength
  );
  if (bytes.byteLength > SURVEY_SOURCE_MAX_ENTRY_BYTES) {
    throw new RangeError(
      `Survey source entry ${index + 1} exceeds the 1 MiB entry bound`
    );
  }
  if (!isUtf8RoundTrip(bytes)) {
    throw new TypeError(
      `Survey source entry ${index + 1} must contain strict UTF-8`
    );
  }
  const encoded = encodeExactBytes(bytes);
  return {
    ordinal: index + 1,
    logicalName: entry.logicalName,
    content: {
      mediaType: "text/plain;charset=utf-8",
      encoding: encoded.encoding,
      byteLength: bytes.byteLength,
      data: encoded.data
    },
    rawEvidenceDigest: rawEvidenceDigest(bytes)
  };
}

function freezeResource(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const item of Object.values(value)) freezeResource(item);
    Object.freeze(value);
  }
  return value;
}

function assertValidSnapshot(resource) {
  const structural = validateById(SOURCE_SNAPSHOT_SCHEMA_ID, resource);
  if (!structural.valid) {
    throw new Error(
      `constructed SourceSnapshot is structurally invalid: ${structural.errors.join("; ")}`
    );
  }
  const semanticIssues = validateContractSemantics(resource);
  if (semanticIssues.length > 0) {
    throw new Error(
      `constructed SourceSnapshot is semantically invalid: ${semanticIssues
        .map((item) => item.code)
        .join(", ")}`
    );
  }
}

/**
 * Freeze ordered, host-supplied Survey intake bytes into one immutable
 * SourceSnapshot. The caller supplies only logical names and exact bytes;
 * identity, provenance, media type, ordinals, and digests are deterministic.
 */
export function buildSurveySourceSnapshot(entries) {
  const inventory = [];
  const seenNames = new Set();
  let aggregateBytes = 0;
  for (const [index, value] of orderedEntries(entries).entries()) {
    const item = normalizedEntry(value, index, seenNames);
    aggregateBytes += item.content.byteLength;
    if (aggregateBytes > SURVEY_SOURCE_MAX_AGGREGATE_BYTES) {
      throw new RangeError("Survey source intake exceeds the 16 MiB aggregate bound");
    }
    inventory.push(item);
  }
  const resource = {
    apiVersion: "authoring.mission-kit/v1alpha1",
    kind: "SourceSnapshot",
    metadata: {
      name: "pending-survey-intake"
    },
    spec: {
      sourceDigest: `sha256:${"0".repeat(64)}`,
      provenance: {
        sourceClass: "host-supplied",
        sourceId: "survey-intake"
      },
      inventory
    }
  };
  resource.spec.sourceDigest = sourceSnapshotDigest(resource);
  resource.metadata.name =
    `survey-intake-${resource.spec.sourceDigest.slice("sha256:".length)}`;
  assertValidSnapshot(resource);
  return freezeResource(resource);
}
