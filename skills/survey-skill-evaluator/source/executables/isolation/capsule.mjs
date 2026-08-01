import { randomUUID } from "node:crypto";
import {
  deepCloneCanonical,
  deepFreeze,
} from "../engine/canonical-json.mjs";
import { HASH_PROFILE_ID, hashCanonical } from "../engine/hash.mjs";
import { AuthorizationError, ValidationError } from "../engine/errors.mjs";

const DEFAULT_FORBIDDEN_KEYS = new Set([
  "armMap",
  "armIdentity",
  "expectedDirection",
  "peerResults",
  "promotionCredential",
  "releaseCredential",
  "productionCredential",
  "canonicalRootWrite",
  "governanceRoot",
  "providerThread",
  "sharedCache",
]);

function scanForbidden(value, forbidden, path = "$") {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => scanForbidden(item, forbidden, `${path}[${index}]`));
    return;
  }
  for (const [key, item] of Object.entries(value)) {
    if (forbidden.has(key)) {
      throw new AuthorizationError("Role projection contains a forbidden field", {
        path: `${path}.${key}`,
      });
    }
    scanForbidden(item, forbidden, `${path}.${key}`);
  }
}

export function buildRoleCapsule({
  roleClass,
  workOrderId,
  inputProjection,
  allowedTools = [],
  writableWorkspaceId = randomUUID(),
  network = "disabled",
  outputSchemaId,
  executionConfigurationDigest = null,
  maskPolicyDigest = null,
  parentGrant = null,
  forbiddenKeys = [],
  byteLimit = 1_000_000,
}) {
  if (!roleClass || !workOrderId || !outputSchemaId) {
    throw new ValidationError("Role capsule is missing a required identity field");
  }
  if (
    executionConfigurationDigest !== null &&
    !/^[a-f0-9]{64}$/u.test(executionConfigurationDigest)
  ) {
    throw new ValidationError(
      "Role capsule execution-configuration binding must be a SHA-256 digest",
    );
  }
  const forbidden = new Set([...DEFAULT_FORBIDDEN_KEYS, ...forbiddenKeys]);
  const projection = deepCloneCanonical(inputProjection);
  scanForbidden(projection, forbidden);
  const projectionBytes = Buffer.byteLength(JSON.stringify(projection), "utf8");
  if (projectionBytes > byteLimit) {
    throw new ValidationError("Role projection exceeds its declared byte limit", {
      projectionBytes,
      byteLimit,
    });
  }
  const core = {
    hashProfileId: HASH_PROFILE_ID,
    roleClass,
    workOrderId,
    inputProjection: projection,
    inputProjectionDigest: hashCanonical("role-input-projection/v1", projection),
    allowedTools: [...new Set(allowedTools)].sort(),
    writableWorkspaceId,
    network,
    outputSchemaId,
    executionConfigurationDigest,
    maskPolicyDigest,
    parentGrant: parentGrant ? deepCloneCanonical(parentGrant) : null,
    isolation: {
      freshContext: true,
      sharedCache: false,
      sharedMemory: false,
      sharedClipboard: false,
      sharedProviderThread: false,
      siblingWorkspaceAccess: false,
      productionCredentials: false,
    },
  };
  const capsule = {
    ...core,
    capsuleDigest: hashCanonical("role-capsule/v1", core),
  };
  return deepFreeze(capsule);
}

export { DEFAULT_FORBIDDEN_KEYS };
