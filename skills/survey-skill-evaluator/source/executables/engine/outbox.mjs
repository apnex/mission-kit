import { randomUUID } from "node:crypto";
import { canonicalBytes, deepCloneCanonical } from "./canonical-json.mjs";
import { IntegrityError, ValidationError } from "./errors.mjs";

export class OutboxDispatcher {
  constructor({ stateStore, clock = () => Date.now() }) {
    this.stateStore = stateStore;
    this.clock = clock;
  }

  async pending(machineId, objectId) {
    const record = await this.stateStore.load(machineId, objectId, {
      required: true,
    });
    return record.authoritativeStateCore.outboxLedger
      .filter((entry) => !["acknowledged", "terminal"].includes(entry.deliveryState))
      .map(deepCloneCanonical);
  }

  async dispatchOne(machineId, objectId, messageDigest, deliver) {
    if (typeof deliver !== "function") {
      throw new ValidationError("Outbox delivery adapter must be a function");
    }
    const attemptId = randomUUID();
    const startedAtMs = this.clock();
    const attempted = await this.stateStore.updateOutbox(
      machineId,
      objectId,
      messageDigest,
      (entry) => {
        if (["acknowledged", "terminal"].includes(entry.deliveryState)) return entry;
        entry.attempts.push({
          attemptId,
          startedAtMs,
          status: "attempting",
        });
        return entry;
      },
    );
    if (["acknowledged", "terminal"].includes(attempted.deliveryState)) {
      return { replayed: true, entry: attempted };
    }
    let outcome;
    try {
      outcome = await deliver(deepCloneCanonical(attempted.payload), {
        attemptId,
        messageDigest,
      });
    } catch (error) {
      const failed = await this.stateStore.updateOutbox(
        machineId,
        objectId,
        messageDigest,
        (entry) => {
          const attempt = entry.attempts.find(
            (candidate) => candidate.attemptId === attemptId,
          );
          if (attempt) {
            attempt.status = "ambiguous";
            attempt.finishedAtMs = this.clock();
            attempt.errorClass = error?.code ?? error?.name ?? "delivery_error";
          }
          return entry;
        },
      );
      throw new IntegrityError(
        "Outbox delivery failed with an ambiguous receiver outcome",
        { machineId, objectId, messageDigest, attemptId, entry: failed },
        { cause: error },
      );
    }
    const normalized = {
      acknowledged: outcome?.acknowledged === true,
      terminal: outcome?.terminal === true,
      receipt: outcome?.receipt ?? null,
      receiver: outcome?.receiver ?? null,
    };
    const completed = await this.stateStore.updateOutbox(
      machineId,
      objectId,
      messageDigest,
      (entry) => {
        const attempt = entry.attempts.find(
          (candidate) => candidate.attemptId === attemptId,
        );
        if (attempt) {
          attempt.status = normalized.acknowledged
            ? "acknowledged"
            : normalized.terminal
              ? "terminal"
              : "delivered_unacknowledged";
          attempt.finishedAtMs = this.clock();
          attempt.receiver = normalized.receiver;
        }
        entry.deliveryState = normalized.acknowledged
          ? "acknowledged"
          : normalized.terminal
            ? "terminal"
            : "delivered";
        if (normalized.receipt !== null) {
          const prior = entry.acknowledgements[0];
          if (
            prior !== undefined &&
            !canonicalBytes(prior).equals(canonicalBytes(normalized.receipt))
          ) {
            throw new IntegrityError("Receiver returned conflicting acknowledgement bytes", {
              messageDigest,
            });
          }
          if (prior === undefined) {
            entry.acknowledgements.push(normalized.receipt);
          }
        }
        return entry;
      },
    );
    return { replayed: false, entry: completed, outcome: normalized };
  }

  async drain(machineId, objectId, deliver, { limit = Infinity } = {}) {
    const pending = await this.pending(machineId, objectId);
    const results = [];
    for (const entry of pending.slice(0, limit)) {
      results.push(
        await this.dispatchOne(
          machineId,
          objectId,
          entry.messageDigest,
          deliver,
        ),
      );
    }
    return results;
  }
}
