import { dirname, join } from "node:path";
import { mkdir } from "node:fs/promises";
import {
  assertNoSymlinkAncestors,
  assertSafeSegment,
  atomicCreateOnce,
  exists,
  readFileNoFollow,
  readJsonFile,
  resolveContained,
} from "../engine/atomic-fs.mjs";
import {
  canonicalBytes,
  deepCloneCanonical,
} from "../engine/canonical-json.mjs";
import {
  HASH_PROFILE_ID,
  hashCanonical,
  rawSha256,
} from "../engine/hash.mjs";
import { ConflictError, IntegrityError, ValidationError } from "../engine/errors.mjs";

const FORBIDDEN_ENVELOPE_FIELDS = new Set([
  "protectedUnmaskGrant",
  "protectedUnmaskGrantDigest",
  "campaignLineageDisclosure",
  "campaignLineageDisclosureDigest",
  "futureTransition",
  "futureStateRoot",
]);

const FORBIDDEN_DERIVATION_OUTPUT_FIELDS = new Set([
  "derivationDigest",
  "derivationRecord",
  "derivationRecordDigest",
  "sidecarDigest",
]);

function assertEnvelopeAcyclic(value, path = "$") {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertEnvelopeAcyclic(item, `${path}[${index}]`));
    return;
  }
  for (const [key, item] of Object.entries(value)) {
    if (FORBIDDEN_ENVELOPE_FIELDS.has(key)) {
      throw new ValidationError("Campaign evidence envelope contains a future reference", {
        path: `${path}.${key}`,
      });
    }
    assertEnvelopeAcyclic(item, `${path}.${key}`);
  }
}

function assertDerivationOutputAcyclic(value, path = "$") {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      assertDerivationOutputAcyclic(item, `${path}[${index}]`),
    );
    return;
  }
  for (const [key, item] of Object.entries(value)) {
    if (FORBIDDEN_DERIVATION_OUTPUT_FIELDS.has(key)) {
      throw new ValidationError(
        "Derivation output contains a sidecar or self reference",
        { path: `${path}.${key}` },
      );
    }
    assertDerivationOutputAcyclic(item, `${path}.${key}`);
  }
}

function extensionFor(mediaType) {
  if (mediaType === "application/json") return ".json";
  if (mediaType === "text/plain") return ".txt";
  return ".bin";
}

export class EvidenceFreezer {
  constructor({ rootPath, clock = () => Date.now() }) {
    if (!rootPath) throw new ValidationError("EvidenceFreezer requires rootPath");
    this.rootPath = rootPath;
    this.clock = clock;
  }

  blobPath(rawDigest, mediaType = "application/octet-stream") {
    return resolveContained(
      this.rootPath,
      "evidence",
      "blobs",
      rawDigest.slice(0, 2),
      `${rawDigest}${extensionFor(mediaType)}`,
    );
  }

  blobRelativePath(rawDigest, mediaType = "application/octet-stream") {
    return join(
      "evidence",
      "blobs",
      rawDigest.slice(0, 2),
      `${rawDigest}${extensionFor(mediaType)}`,
    );
  }

  async freezeBytes(bytes, {
    mediaType = "application/octet-stream",
    disclosureClass = "protected",
  } = {}) {
    const payload = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
    const rawDigest = rawSha256(payload);
    const path = this.blobPath(rawDigest, mediaType);
    await mkdir(this.rootPath, { recursive: true, mode: 0o750 });
    await assertNoSymlinkAncestors(this.rootPath, path);
    await mkdir(dirname(path), { recursive: true, mode: 0o750 });
    await assertNoSymlinkAncestors(this.rootPath, path);
    await atomicCreateOnce(path, payload);
    return {
      hashProfileId: "raw-file-sha256/v1",
      rawDigest,
      byteLength: payload.length,
      mediaType,
      disclosureClass,
      path: this.blobRelativePath(rawDigest, mediaType),
    };
  }

  async freezeJson(value, options = {}) {
    return this.freezeBytes(canonicalBytes(value), {
      mediaType: "application/json",
      ...options,
    });
  }

  async verifyBlob(reference) {
    const path = resolveContained(this.rootPath, reference.path);
    await assertNoSymlinkAncestors(this.rootPath, path);
    const bytes = await readFileNoFollow(path);
    if (bytes.length !== reference.byteLength || rawSha256(bytes) !== reference.rawDigest) {
      throw new IntegrityError("Frozen evidence blob does not match its reference", {
        path: reference.path,
      });
    }
    return bytes;
  }

  async publishDerivation({
    derivationId,
    recipeId,
    inputRoots,
    output,
    actor,
    tool,
    disclosureClass = "protected",
  }) {
    assertSafeSegment(derivationId, "derivation ID");
    assertDerivationOutputAcyclic(output);
    const outputReference = Buffer.isBuffer(output)
      ? await this.freezeBytes(output, { disclosureClass })
      : await this.freezeJson(output, { disclosureClass });
    const recordCore = {
      hashProfileId: HASH_PROFILE_ID,
      derivationId,
      recipeId,
      inputRoots: [...inputRoots],
      output: {
        rawDigest: outputReference.rawDigest,
        byteLength: outputReference.byteLength,
        mediaType: outputReference.mediaType,
      },
      actor,
      tool,
      disclosureClass,
      createdAtMs: this.clock(),
    };
    const derivationDigest = hashCanonical("derivation-record/v1", recordCore);
    const record = { ...recordCore, derivationDigest };
    const relativePath = join(
      "evidence",
      "derivations",
      `${derivationId}.json`,
    );
    const path = resolveContained(
      this.rootPath,
      relativePath,
    );
    await mkdir(this.rootPath, { recursive: true, mode: 0o750 });
    await assertNoSymlinkAncestors(this.rootPath, path);
    await mkdir(dirname(path), { recursive: true, mode: 0o750 });
    await assertNoSymlinkAncestors(this.rootPath, path);
    const outcome = await atomicCreateOnce(path, canonicalBytes(record));
    return {
      replayed: !outcome.created,
      outputReference,
      record,
      path: relativePath,
    };
  }

  async freezeCampaignEnvelope({
    campaignId,
    populationRoots,
    contentRoot,
    awarenessRoot,
    qualificationRoots = [],
    derivationRoots = [],
    disclosurePolicy,
  }) {
    assertSafeSegment(campaignId, "campaign ID");
    const envelopeCore = {
      hashProfileId: HASH_PROFILE_ID,
      campaignId,
      populationRoots: deepCloneCanonical(populationRoots),
      contentRoot,
      awarenessRoot,
      qualificationRoots: [...qualificationRoots],
      derivationRoots: [...derivationRoots],
      disclosurePolicy: deepCloneCanonical(disclosurePolicy),
      frozenAtMs: this.clock(),
    };
    assertEnvelopeAcyclic(envelopeCore);
    const envelopeDigest = hashCanonical(
      "campaign-evidence-envelope/v1",
      envelopeCore,
    );
    const envelope = { ...envelopeCore, envelopeDigest };
    const relativePath = join(
      "campaigns",
      campaignId,
      "results",
      "campaign-evidence-envelope.json",
    );
    const path = resolveContained(
      this.rootPath,
      relativePath,
    );
    await mkdir(this.rootPath, { recursive: true, mode: 0o750 });
    await assertNoSymlinkAncestors(this.rootPath, path);
    await mkdir(dirname(path), { recursive: true, mode: 0o750 });
    await assertNoSymlinkAncestors(this.rootPath, path);
    const outcome = await atomicCreateOnce(path, canonicalBytes(envelope));
    return { replayed: !outcome.created, envelope, path: relativePath };
  }

  async loadFrozenJson(relativePath, expectedDigestTag = null, digestField = null) {
    const path = resolveContained(this.rootPath, relativePath);
    await assertNoSymlinkAncestors(this.rootPath, path);
    const value = await readJsonFile(path);
    if (expectedDigestTag && digestField) {
      const core = { ...value };
      const actual = core[digestField];
      delete core[digestField];
      const expected = hashCanonical(expectedDigestTag, core);
      if (actual !== expected) {
        throw new IntegrityError("Frozen JSON semantic digest mismatch", {
          path,
          digestField,
        });
      }
    }
    return value;
  }
}

export { assertDerivationOutputAcyclic, assertEnvelopeAcyclic };
