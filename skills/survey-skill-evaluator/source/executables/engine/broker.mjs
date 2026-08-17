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
import { HASH_PROFILE_ID, hashCanonical } from "./hash.mjs";
import {
  ConflictError,
  IntegrityError,
  NotFoundError,
  ValidationError,
} from "./errors.mjs";

const DRAIN_DISPOSITIONS = new Set([
  "source_advanced",
  "not_committed",
  "source_unverifiable",
]);

function rooted(record) {
  const core = { ...record };
  delete core.claimRoot;
  return { ...core, claimRoot: hashCanonical("broker-delivery-claim/v1", core) };
}

function verify(record, claimId) {
  if (
    record.hashProfileId !== HASH_PROFILE_ID ||
    record.claimId !== claimId ||
    !["pending", "delivered", "fenced_before_delivery"].includes(record.state)
  ) {
    throw new IntegrityError("Broker claim identity or state is invalid", {
      claimId,
    });
  }
  const expected = rooted(record).claimRoot;
  if (expected !== record.claimRoot) {
    throw new IntegrityError("Broker claim root mismatch", { claimId });
  }
  return record;
}

export class BrokerClaimStore {
  constructor({ rootPath, clock = () => Date.now() }) {
    if (!rootPath) throw new ValidationError("BrokerClaimStore requires rootPath");
    this.rootPath = rootPath;
    this.clock = clock;
  }

  pathFor(claimId) {
    return resolveContained(
      this.rootPath,
      "broker",
      "claims",
      `${assertSafeSegment(claimId, "broker claim ID")}.json`,
    );
  }

  async load(claimId, { required = false } = {}) {
    const path = this.pathFor(claimId);
    await assertNoSymlinkAncestors(this.rootPath, path);
    if (!(await exists(path, { authorityRoot: this.rootPath }))) {
      if (required) throw new NotFoundError("Broker claim does not exist", { claimId });
      return null;
    }
    return verify(
      await readJsonFile(path, { authorityRoot: this.rootPath }),
      claimId,
    );
  }

  async create({
    claimId,
    messageDigest,
    targetId,
    operationId,
    fence,
    source,
  }) {
    const path = this.pathFor(claimId);
    await ensureContainedDirectory(this.rootPath, dirname(path), {
      mode: 0o750,
    });
    await assertNoSymlinkAncestors(this.rootPath, path);
    return withFileLock(path, async () => {
      const current = await this.load(claimId);
      const core = {
        hashProfileId: HASH_PROFILE_ID,
        claimId,
        messageDigest,
        targetId,
        operationId,
        fence,
        source,
        state: "pending",
        createdAtMs: this.clock(),
        deliveryReceipt: null,
        postDeliveryFence: null,
        drainReceipt: null,
      };
      const next = rooted(core);
      if (current) {
        let comparableCurrent = deepCloneCanonical(current);
        const comparableNext = deepCloneCanonical(next);
        comparableCurrent.createdAtMs = comparableNext.createdAtMs;
        comparableCurrent = rooted(comparableCurrent);
        if (canonicalBytes(comparableCurrent).equals(canonicalBytes(comparableNext))) {
          return { replayed: true, claim: current };
        }
        throw new ConflictError("Broker claim ID already binds different bytes", {
          claimId,
        });
      }
      await atomicCreateOnce(path, canonicalBytes(next), {
        authorityRoot: this.rootPath,
      });
      return { replayed: false, claim: next };
    }, { authorityRoot: this.rootPath });
  }

  async mutate(claimId, operation) {
    const path = this.pathFor(claimId);
    await assertNoSymlinkAncestors(this.rootPath, path);
    return withFileLock(path, async () => {
      const current = await this.load(claimId, { required: true });
      const outcome = await operation(deepCloneCanonical(current));
      if (outcome.next) {
        const next = rooted(outcome.next);
        verify(next, claimId);
        await atomicReplace(path, canonicalBytes(next), {
          authorityRoot: this.rootPath,
        });
        outcome.result.claim = next;
      }
      return outcome.result;
    }, { authorityRoot: this.rootPath });
  }

  async claimDelivery(claimId, receiverReceipt) {
    return this.mutate(claimId, (claim) => {
      if (claim.state === "fenced_before_delivery") {
        throw new ConflictError("Broker claim was fenced before delivery", {
          claimId,
        });
      }
      if (claim.state === "delivered") {
        if (
          canonicalBytes(claim.deliveryReceipt).equals(
            canonicalBytes(receiverReceipt),
          )
        ) {
          return {
            next: null,
            result: { replayed: true, disposition: "delivered", claim },
          };
        }
        throw new IntegrityError("Broker delivery receipt changed under one claim", {
          claimId,
        });
      }
      claim.state = "delivered";
      claim.deliveryReceipt = deepCloneCanonical(receiverReceipt);
      claim.deliveredAtMs = this.clock();
      return {
        next: claim,
        result: { replayed: false, disposition: "delivered" },
      };
    });
  }

  async fence(claimId, fenceEvidence) {
    return this.mutate(claimId, (claim) => {
      if (claim.state === "fenced_before_delivery") {
        if (
          canonicalBytes(claim.fenceEvidence).equals(canonicalBytes(fenceEvidence))
        ) {
          return {
            next: null,
            result: {
              replayed: true,
              disposition: "fenced_before_delivery",
              claim,
            },
          };
        }
        throw new IntegrityError("Broker fence evidence changed under one claim", {
          claimId,
        });
      }
      if (claim.state === "pending") {
        claim.state = "fenced_before_delivery";
        claim.fenceEvidence = deepCloneCanonical(fenceEvidence);
        claim.fencedAtMs = this.clock();
        return {
          next: claim,
          result: { replayed: false, disposition: "fenced_before_delivery" },
        };
      }
      if (claim.postDeliveryFence) {
        if (
          canonicalBytes(claim.postDeliveryFence.evidence).equals(
            canonicalBytes(fenceEvidence),
          )
        ) {
          return {
            next: null,
            result: {
              replayed: true,
              disposition: "delivery_already_claimed",
              claim,
            },
          };
        }
        throw new IntegrityError("Post-delivery fence changed under one claim", {
          claimId,
        });
      }
      claim.postDeliveryFence = {
        evidence: deepCloneCanonical(fenceEvidence),
        fencedAtMs: this.clock(),
      };
      return {
        next: claim,
        result: { replayed: false, disposition: "delivery_already_claimed" },
      };
    });
  }

  async recordDrain(claimId, receipt) {
    if (!DRAIN_DISPOSITIONS.has(receipt?.disposition)) {
      throw new ValidationError("Broker drain receipt has an invalid disposition", {
        disposition: receipt?.disposition,
      });
    }
    return this.mutate(claimId, (claim) => {
      if (claim.state !== "delivered" || !claim.postDeliveryFence) {
        throw new ConflictError(
          "A drain receipt requires delivered work and a post-delivery fence",
          { claimId },
        );
      }
      if (claim.drainReceipt) {
        if (canonicalBytes(claim.drainReceipt).equals(canonicalBytes(receipt))) {
          return {
            next: null,
            result: { replayed: true, receipt: claim.drainReceipt, claim },
          };
        }
        throw new IntegrityError("Drain receipt changed under one broker claim", {
          claimId,
        });
      }
      claim.drainReceipt = deepCloneCanonical(receipt);
      claim.drainedAtMs = this.clock();
      return {
        next: claim,
        result: { replayed: false, receipt: claim.drainReceipt },
      };
    });
  }

  async invocationStatus(claimId) {
    const claim = await this.load(claimId, { required: true });
    if (claim.state === "fenced_before_delivery") return "forbidden";
    if (claim.state === "pending") return "not_delivered";
    if (claim.postDeliveryFence) {
      return claim.drainReceipt ? "drained" : "drain_required";
    }
    return "in_flight";
  }
}

export { DRAIN_DISPOSITIONS };
