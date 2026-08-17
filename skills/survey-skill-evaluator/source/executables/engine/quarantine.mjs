import { dirname } from "node:path";
import {
  assertNoSymlinkAncestors,
  assertSafeSegment,
  atomicCreateOnce,
  ensureContainedDirectory,
  exists,
  readJsonFile,
  resolveContained,
  withFileLock,
} from "./atomic-fs.mjs";
import { canonicalBytes, deepCloneCanonical } from "./canonical-json.mjs";
import { HASH_PROFILE_ID, hashCanonical } from "./hash.mjs";
import {
  ConflictError,
  IntegrityError,
  QuarantinedError,
  ValidationError,
} from "./errors.mjs";

const SCOPES = new Set(["attempt", "object", "request", "entry", "ledger", "campaign"]);

function rooted(latch) {
  const core = { ...latch };
  delete core.latchRoot;
  return { ...core, latchRoot: hashCanonical("quarantine-latch/v1", core) };
}

export class QuarantineStore {
  constructor({ rootPath, clock = () => Date.now() }) {
    if (!rootPath) throw new ValidationError("QuarantineStore requires rootPath");
    this.rootPath = rootPath;
    this.clock = clock;
  }

  pathFor(scope, scopeId) {
    if (!SCOPES.has(scope)) {
      throw new ValidationError("Unknown quarantine scope", { scope });
    }
    return resolveContained(
      this.rootPath,
      "quarantine",
      scope,
      `${assertSafeSegment(scopeId, "quarantine scope ID")}.json`,
    );
  }

  async load(scope, scopeId) {
    const path = this.pathFor(scope, scopeId);
    await assertNoSymlinkAncestors(this.rootPath, path);
    if (!(await exists(path, { authorityRoot: this.rootPath }))) return null;
    const latch = await readJsonFile(path, {
      authorityRoot: this.rootPath,
    });
    const expected = rooted(latch);
    if (
      latch.hashProfileId !== HASH_PROFILE_ID ||
      latch.scope !== scope ||
      latch.scopeId !== scopeId ||
      latch.latchRoot !== expected.latchRoot
    ) {
      throw new IntegrityError("Quarantine latch is unverifiable", {
        scope,
        scopeId,
      });
    }
    return latch;
  }

  async publish({
    scope,
    scopeId,
    reason,
    detectionEvidence,
    admissionConsequence,
    observedBytesDigest = null,
  }) {
    const path = this.pathFor(scope, scopeId);
    await ensureContainedDirectory(this.rootPath, dirname(path), {
      mode: 0o750,
    });
    await assertNoSymlinkAncestors(this.rootPath, path);
    return withFileLock(path, async () => {
      const latch = rooted({
        hashProfileId: HASH_PROFILE_ID,
        scope,
        scopeId,
        reason,
        detectionEvidence: deepCloneCanonical(detectionEvidence),
        observedBytesDigest,
        admissionConsequence,
        createdAtMs: this.clock(),
      });
      const current = await this.load(scope, scopeId);
      if (current) {
        let comparableCurrent = deepCloneCanonical(current);
        const comparableNext = deepCloneCanonical(latch);
        comparableCurrent.createdAtMs = comparableNext.createdAtMs;
        comparableCurrent = rooted(comparableCurrent);
        if (canonicalBytes(comparableCurrent).equals(canonicalBytes(comparableNext))) {
          return { replayed: true, latch: current };
        }
        throw new ConflictError("Quarantine scope already binds different evidence", {
          scope,
          scopeId,
        });
      }
      await atomicCreateOnce(path, canonicalBytes(latch), {
        authorityRoot: this.rootPath,
      });
      return { replayed: false, latch };
    }, { authorityRoot: this.rootPath });
  }

  async assertAdmissible(scope, scopeId) {
    const latch = await this.load(scope, scopeId);
    if (latch) {
      throw new QuarantinedError("Operation is blocked by a quarantine latch", {
        scope,
        scopeId,
        latchRoot: latch.latchRoot,
        admissionConsequence: latch.admissionConsequence,
      });
    }
  }
}

export { SCOPES as QUARANTINE_SCOPES };
