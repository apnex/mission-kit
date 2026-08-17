import { dirname } from "node:path";
import {
  assertNoSymlinkAncestors,
  assertSafeSegment,
  atomicCreateOnce,
  atomicReplace,
  ensureContainedDirectory,
  exists,
  readJsonFile,
  resolveContained,
  withFileLock,
} from "./atomic-fs.mjs";
import { canonicalBytes, deepCloneCanonical } from "./canonical-json.mjs";
import {
  HASH_PROFILE_ID,
  absentAuthoritativeStateRoot,
  hashCanonical,
  outboxMessageDigest,
} from "./hash.mjs";
import {
  ConflictError,
  IntegrityError,
  NotFoundError,
  ValidationError,
} from "./errors.mjs";
import { RuntimeProductStateValidator } from "./product-state-validator.mjs";

function stateCore(record) {
  return record?.authoritativeStateCore;
}

function verifyGenesisMetadata(record, core) {
  if (core.semanticState?.revision !== 0) return;
  const genesis = record.genesisRecord;
  if (!genesis || typeof genesis !== "object") {
    throw new IntegrityError(
      "Revision-zero state is missing parent-staged genesis metadata",
    );
  }
  if (
    hashCanonical(
      "parent-staged-genesis-core/v1",
      genesis.genesisCore,
    ) !== genesis.genesisCoreDigest ||
    genesis.initialSemanticCoreDigest !== core.semanticCoreDigest ||
    genesis.initialAuthoritativeStateRoot !== record.authoritativeStateRoot
  ) {
    throw new IntegrityError(
      "Parent-staged genesis metadata does not bind authoritative state",
    );
  }
  const recordCore = {
    genesisCore: genesis.genesisCore,
    genesisCoreDigest: genesis.genesisCoreDigest,
    initialSemanticCoreDigest: genesis.initialSemanticCoreDigest,
    initialAuthoritativeStateRoot: genesis.initialAuthoritativeStateRoot,
  };
  if (
    hashCanonical(
      "parent-staged-genesis-record/v1",
      recordCore,
    ) !== genesis.genesisRecordDigest
  ) {
    throw new IntegrityError("Parent-staged genesis record digest mismatch");
  }
}

export function verifyAuthoritativeState(record, expected = {}) {
  if (!record || typeof record !== "object") {
    throw new IntegrityError("Authoritative state is not an object");
  }
  if (record.hashProfileId !== HASH_PROFILE_ID) {
    throw new IntegrityError("Authoritative state hash profile mismatch", {
      actual: record.hashProfileId,
      expected: HASH_PROFILE_ID,
    });
  }
  for (const field of ["machineId", "objectId", "schemaVersion"]) {
    if (expected[field] !== undefined && record[field] !== expected[field]) {
      throw new IntegrityError(`Authoritative state ${field} mismatch`, {
        expected: expected[field],
        actual: record[field],
      });
    }
  }
  const core = stateCore(record);
  if (!core || typeof core !== "object") {
    throw new IntegrityError("Authoritative state core is missing");
  }
  verifyGenesisMetadata(record, core);
  const semanticDigest = hashCanonical(
    core.semanticState?.revision === 0
      ? "initial-semantic-core/v1"
      : "resulting-semantic-core/v1",
    core.semanticState,
  );
  if (semanticDigest !== core.semanticCoreDigest) {
    throw new IntegrityError("Semantic core digest mismatch", {
      expected: semanticDigest,
      actual: core.semanticCoreDigest,
    });
  }
  if (!Array.isArray(core.eventLedger) || !Array.isArray(core.outboxLedger)) {
    throw new IntegrityError("Event and outbox ledgers must be arrays");
  }
  let previousRevision;
  const seenIdempotencyKeys = new Set();
  for (const [index, event] of core.eventLedger.entries()) {
    const digest = hashCanonical("semantic-event/v1", event.core);
    if (digest !== event.eventRoot) {
      throw new IntegrityError("Event root mismatch", { index });
    }
    if (
      typeof event.resultingSemanticCoreDigest !== "string" ||
      event.resultingSemanticCoreDigest.length !== 64
    ) {
      throw new IntegrityError("Event resulting semantic-core link is invalid", {
        index,
      });
    }
    if (
      event.core?.machineId !== record.machineId ||
      event.core?.objectId !== record.objectId
    ) {
      throw new IntegrityError("Event identity does not match its authoritative object", {
        index,
      });
    }
    const priorRevision = event.core.priorRevision;
    const resultingRevision = event.core.resultingRevision;
    if (index === 0) {
      if (priorRevision?.kind === "absent") {
        if (resultingRevision !== 1) {
          throw new IntegrityError("Absent creation event must produce revision one", {
            index,
          });
        }
        const expectedAbsentRoot = absentAuthoritativeStateRoot(
          record.machineId,
          record.objectId,
          record.schemaVersion,
        );
        if (event.core.predecessor?.authoritativeStateRoot !== expectedAbsentRoot) {
          throw new IntegrityError("Absent creation event uses the wrong sentinel root", {
            index,
          });
        }
      } else if (priorRevision === 0) {
        if (resultingRevision !== 1) {
          throw new IntegrityError("First post-genesis event must produce revision one", {
            index,
          });
        }
      } else {
        throw new IntegrityError("First event has an invalid predecessor revision", {
          index,
          priorRevision,
        });
      }
    } else {
      if (priorRevision !== previousRevision) {
        throw new IntegrityError("Event ledger revision ancestry is not contiguous", {
          index,
          expectedPriorRevision: previousRevision,
          actualPriorRevision: priorRevision,
        });
      }
      if (resultingRevision !== priorRevision + 1) {
        throw new IntegrityError("Event resulting revision is not monotonic", {
          index,
          priorRevision,
          resultingRevision,
        });
      }
    }
    if (seenIdempotencyKeys.has(event.core.idempotencyKey)) {
      throw new IntegrityError("Event ledger repeats an idempotency key", {
        index,
        idempotencyKey: event.core.idempotencyKey,
      });
    }
    seenIdempotencyKeys.add(event.core.idempotencyKey);
    previousRevision = resultingRevision;
  }
  if (
    core.eventLedger.length > 0 &&
    core.eventLedger.at(-1).resultingSemanticCoreDigest !== core.semanticCoreDigest
  ) {
    throw new IntegrityError("Last event does not bind the current semantic core");
  }
  if (
    core.eventLedger.length > 0 &&
    previousRevision !== core.semanticState.revision
  ) {
    throw new IntegrityError("Event ledger revision does not reach semantic revision", {
      eventRevision: previousRevision,
      semanticRevision: core.semanticState.revision,
    });
  }
  if (
    core.eventLedger.length === 0 &&
    core.semanticState.revision !== 0
  ) {
    throw new IntegrityError("Non-genesis semantic state has an empty event ledger");
  }
  for (const [index, entry] of core.outboxLedger.entries()) {
    if (outboxMessageDigest(entry.payload) !== entry.messageDigest) {
      throw new IntegrityError("Outbox message digest mismatch", { index });
    }
    if (!["pending", "delivered", "acknowledged", "terminal"].includes(entry.deliveryState)) {
      throw new IntegrityError("Outbox delivery state is invalid", {
        index,
        deliveryState: entry.deliveryState,
      });
    }
  }
  const authoritativeRoot = hashCanonical("authoritative-state/v1", core);
  if (authoritativeRoot !== record.authoritativeStateRoot) {
    throw new IntegrityError("Authoritative state root mismatch", {
      expected: authoritativeRoot,
      actual: record.authoritativeStateRoot,
    });
  }
  const productStateValidation =
    expected.productStateValidator?.validate(record) ?? null;
  return {
    record,
    revision: core.semanticState.revision,
    state: core.semanticState.state ?? core.semanticState.semantic?.state,
    semanticCoreDigest: core.semanticCoreDigest,
    authoritativeStateRoot: record.authoritativeStateRoot,
    productStateValidation,
  };
}

export function withRecomputedAuthoritativeRoot(record) {
  const next = deepCloneCanonical(record);
  next.authoritativeStateRoot = hashCanonical(
    "authoritative-state/v1",
    next.authoritativeStateCore,
  );
  return next;
}

export class StateStore {
  constructor({
    rootPath,
    statePathResolver,
    schemaVersion = "1",
    productStateValidator = null,
  }) {
    if (!rootPath) throw new ValidationError("StateStore requires rootPath");
    if (
      productStateValidator !== null &&
      !(productStateValidator instanceof RuntimeProductStateValidator)
    ) {
      throw new ValidationError(
        "StateStore product-state authority must be a generated-schema validator",
      );
    }
    this.rootPath = rootPath;
    this.schemaVersion = schemaVersion;
    this.productStateValidator = productStateValidator;
    this.statePathResolver =
      statePathResolver ??
      ((machineId, objectId) =>
        resolveContained(
          this.rootPath,
          "objects",
          assertSafeSegment(machineId, "machine ID"),
          `${assertSafeSegment(objectId, "object ID")}.json`,
        ));
  }

  pathFor(machineId, objectId) {
    return this.statePathResolver(machineId, objectId);
  }

  async initialize() {
    const objectsPath = resolveContained(this.rootPath, "objects");
    await ensureContainedDirectory(this.rootPath, objectsPath, {
      mode: 0o750,
    });
  }

  async load(machineId, objectId, { required = false } = {}) {
    const path = this.pathFor(machineId, objectId);
    await assertNoSymlinkAncestors(this.rootPath, path);
    if (!(await exists(path, { authorityRoot: this.rootPath }))) {
      if (required) {
        throw new NotFoundError("Authoritative object does not exist", {
          machineId,
          objectId,
        });
      }
      return null;
    }
    const record = await readJsonFile(path, {
      authorityRoot: this.rootPath,
    });
    if (!this.productStateValidator) {
      throw new ValidationError(
        "StateStore cannot admit persisted state without generated product-state validation",
        { machineId, objectId },
      );
    }
    verifyAuthoritativeState(record, {
      machineId,
      objectId,
      schemaVersion: this.schemaVersion,
      productStateValidator: this.productStateValidator,
    });
    return record;
  }

  async transact(machineId, objectId, operation, lockOptions = {}) {
    const path = this.pathFor(machineId, objectId);
    await ensureContainedDirectory(this.rootPath, dirname(path), {
      mode: 0o750,
    });
    await assertNoSymlinkAncestors(this.rootPath, path);
    return withFileLock(
      path,
      async () => {
        const current = await this.load(machineId, objectId);
        const outcome = await operation(current);
        if (!outcome || !Object.hasOwn(outcome, "next")) {
          throw new ValidationError("State transaction must return a next record");
        }
        if (outcome.next === null) return outcome.result;
        if (!this.productStateValidator) {
          throw new ValidationError(
            "StateStore cannot commit state without generated product-state validation",
            { machineId, objectId },
          );
        }
        verifyAuthoritativeState(outcome.next, {
          machineId,
          objectId,
          schemaVersion: this.schemaVersion,
          productStateValidator: this.productStateValidator,
        });
        const bytes = canonicalBytes(outcome.next);
        if (current === null) {
          await atomicCreateOnce(path, bytes, {
            authorityRoot: this.rootPath,
          });
        } else {
          if (
            outcome.expectedRoot !== undefined &&
            outcome.expectedRoot !== current.authoritativeStateRoot
          ) {
            throw new ConflictError("Authoritative predecessor changed", {
              expected: outcome.expectedRoot,
              actual: current.authoritativeStateRoot,
            });
          }
          await atomicReplace(path, bytes, {
            authorityRoot: this.rootPath,
          });
        }
        return outcome.result;
      },
      { ...lockOptions, authorityRoot: this.rootPath },
    );
  }

  async updateOutbox(machineId, objectId, messageDigest, updater) {
    return this.transact(machineId, objectId, async (current) => {
      if (!current) {
        throw new NotFoundError("Cannot update outbox for an absent object", {
          machineId,
          objectId,
        });
      }
      const next = deepCloneCanonical(current);
      const index = next.authoritativeStateCore.outboxLedger.findIndex(
        (entry) => entry.messageDigest === messageDigest,
      );
      if (index < 0) {
        throw new NotFoundError("Outbox message is not present", {
          machineId,
          objectId,
          messageDigest,
        });
      }
      const prior = next.authoritativeStateCore.outboxLedger[index];
      const updated = await updater(deepCloneCanonical(prior));
      if (updated.messageDigest !== messageDigest) {
        throw new IntegrityError("Outbox metadata update changed message identity");
      }
      if (outboxMessageDigest(updated.payload) !== messageDigest) {
        throw new IntegrityError("Outbox metadata update changed message bytes");
      }
      next.authoritativeStateCore.outboxLedger[index] = updated;
      const rooted = withRecomputedAuthoritativeRoot(next);
      return {
        next: rooted,
        expectedRoot: current.authoritativeStateRoot,
        result: deepCloneCanonical(updated),
      };
    });
  }
}
