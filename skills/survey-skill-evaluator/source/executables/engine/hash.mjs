import { createHash } from "node:crypto";
import { canonicalBytes } from "./canonical-json.mjs";
import { ValidationError } from "./errors.mjs";

export const HASH_PROFILE_ID = "survey-evaluator-sha256-jcs-v1";
export const HASH_DOMAIN_PREFIX = "survey-skill-evaluator/hash/v1";
export const RAW_FILE_HASH_PROFILE_ID = "raw-file-sha256/v1";

export function frame(value) {
  const bytes = Buffer.isBuffer(value) ? value : Buffer.from(value);
  const length = Buffer.allocUnsafe(8);
  length.writeBigUInt64BE(BigInt(bytes.length));
  return Buffer.concat([length, bytes]);
}

export function hashCanonical(tag, value) {
  if (typeof tag !== "string" || tag.length === 0) {
    throw new ValidationError("Hash domain tag must be a non-empty string");
  }
  return createHash("sha256")
    .update(frame(Buffer.from(HASH_DOMAIN_PREFIX, "utf8")))
    .update(frame(Buffer.from(tag, "utf8")))
    .update(frame(canonicalBytes(value)))
    .digest("hex");
}

export function rawSha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function digestText(tag, text) {
  return hashCanonical(tag, { text });
}

export function absentAuthoritativeStateRoot(machineId, objectId, schemaVersion) {
  return hashCanonical("absent-authoritative-state/v1", {
    machineId,
    objectId,
    schemaVersion,
  });
}

export function statePredecessor(objectId, priorRevision, root) {
  return hashCanonical("state-predecessor/v1", {
    objectId,
    priorRevision,
    root,
  });
}

export function outboxMessageDigest(payload) {
  return hashCanonical("outbox-message/v1", payload);
}

export function assertHashProfile(value) {
  if (value?.hashProfileId !== HASH_PROFILE_ID) {
    throw new ValidationError("Unknown or missing semantic hash profile", {
      expected: HASH_PROFILE_ID,
      actual: value?.hashProfileId,
    });
  }
}

export function inventoryEntry(entry) {
  if (!entry || !Buffer.isBuffer(entry.bytes)) {
    throw new ValidationError("Package inventory entry requires Buffer bytes", {
      path: entry?.path,
    });
  }
  if (!["0644", "0755"].includes(entry.mode)) {
    throw new ValidationError("Package inventory mode is not portable", {
      path: entry.path,
      mode: entry.mode,
    });
  }
  return {
    path: entry.path,
    mode: entry.mode,
    byteLength: entry.bytes.length,
    rawFileSha256: rawSha256(entry.bytes),
  };
}

function assertInventoryPaths(entries) {
  const caseFolded = new Map();
  for (const entry of entries) {
    const path = entry.path;
    if (
      typeof path !== "string" ||
      path.length === 0 ||
      path.startsWith("/") ||
      path.includes("\\") ||
      path.includes("\0")
    ) {
      throw new ValidationError("Package inventory path is unsafe", { path });
    }
    const segments = path.split("/");
    if (
      segments.some(
        (segment) => segment === "" || segment === "." || segment === "..",
      )
    ) {
      throw new ValidationError("Package inventory path has an unsafe segment", {
        path,
      });
    }
    const folded = path.replace(/[A-Z]/gu, (character) =>
      character.toLowerCase(),
    );
    if (caseFolded.has(folded)) {
      throw new ValidationError("Package inventory has an ASCII case-fold collision", {
        first: caseFolded.get(folded),
        second: path,
      });
    }
    caseFolded.set(folded, path);
  }
}

export function foldPackageInventory(rootKind, entries, orderedExclusions) {
  if (!["candidate-package", "evaluator-payload"].includes(rootKind)) {
    throw new ValidationError("Unknown package inventory root kind", { rootKind });
  }
  const requiredExclusions =
    rootKind === "candidate-package" ? [] : ["package.manifest.json"];
  if (
    canonicalBytes(orderedExclusions).compare(
      canonicalBytes(requiredExclusions),
    ) !== 0
  ) {
    throw new ValidationError("Package inventory exclusions are not canonical", {
      rootKind,
      expected: requiredExclusions,
      actual: orderedExclusions,
    });
  }
  assertInventoryPaths(entries);
  const ordered = [...entries].sort((left, right) =>
    Buffer.compare(Buffer.from(left.path, "utf8"), Buffer.from(right.path, "utf8")),
  );
  let fold = hashCanonical("package-inventory-fold-empty/v1", {
    rootKind,
    exclusions: orderedExclusions,
  });
  const inventory = ordered.map(inventoryEntry);
  inventory.forEach((item, index) => {
    const entryDigest = hashCanonical("package-inventory-entry/v1", item);
    fold = hashCanonical("package-inventory-fold-step/v1", {
      rootKind,
      index: index + 1,
      prior: fold,
      entryDigest,
    });
  });
  return {
    inventory,
    root: hashCanonical(`${rootKind}-inventory/v1`, {
      entryCount: inventory.length,
      exclusions: orderedExclusions,
      finalFold: fold,
    }),
  };
}

const FORBIDDEN_GENESIS_PAYLOAD_FIELDS = new Set([
  "currentParentResultingRoot",
  "genesisRecordDigest",
  "futureRoot",
]);

function assertGenesisPayload(value, path = "$") {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      assertGenesisPayload(item, `${path}[${index}]`),
    );
    return;
  }
  for (const [key, item] of Object.entries(value)) {
    if (FORBIDDEN_GENESIS_PAYLOAD_FIELDS.has(key)) {
      throw new ValidationError("Parent-staged genesis contains a future/self root", {
        path: `${path}.${key}`,
      });
    }
    assertGenesisPayload(item, `${path}.${key}`);
  }
}

export function parentStagedGenesis(input) {
  if (
    Object.hasOwn(input, "revision") && input.revision !== 0
  ) {
    throw new ValidationError("Parent-staged genesis revision must be zero");
  }
  if (
    Object.hasOwn(input, "eventLedger") &&
    (!Array.isArray(input.eventLedger) || input.eventLedger.length !== 0)
  ) {
    throw new ValidationError("Parent-staged genesis event ledger must be empty");
  }
  if (
    Object.hasOwn(input, "outboxLedger") &&
    (!Array.isArray(input.outboxLedger) || input.outboxLedger.length !== 0)
  ) {
    throw new ValidationError("Parent-staged genesis outbox ledger must be empty");
  }
  const {
    machineId,
    objectId,
    schemaVersion,
    parentMachineId,
    parentObjectId,
    parentPriorAuthoritativeRoot,
    parentOrderId,
    parentFence,
    initialSemanticPayload,
  } = input;
  assertGenesisPayload(initialSemanticPayload);
  const absentSentinel = absentAuthoritativeStateRoot(
    machineId,
    objectId,
    schemaVersion,
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
      parentFence,
    },
    initialSemanticPayload,
  };
  const genesisCoreDigest = hashCanonical(
    "parent-staged-genesis-core/v1",
    genesisCore,
  );
  const semanticState = {
    revision: 0,
    creationClass: "parent_staged_genesis",
    genesisCoreDigest,
    semantic: initialSemanticPayload,
  };
  const initialSemanticCoreDigest = hashCanonical(
    "initial-semantic-core/v1",
    semanticState,
  );
  const authoritativeStateCore = {
    semanticState,
    semanticCoreDigest: initialSemanticCoreDigest,
    eventLedger: [],
    outboxLedger: [],
  };
  const initialAuthoritativeStateRoot = hashCanonical(
    "authoritative-state/v1",
    authoritativeStateCore,
  );
  const authoritativeStateRecord = {
    authoritativeStateCore,
    authoritativeStateRoot: initialAuthoritativeStateRoot,
  };
  const genesisRecord = {
    genesisCore,
    genesisCoreDigest,
    initialSemanticCoreDigest,
    initialAuthoritativeStateRoot,
  };
  const genesisRecordDigest = hashCanonical(
    "parent-staged-genesis-record/v1",
    genesisRecord,
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
    genesisRecordDigest,
  };
}
