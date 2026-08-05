import assert from "node:assert/strict";
import test from "node:test";
import {
  acceptSubmission,
  createCoordinatorHarness,
  digest,
  eventCommand,
  issueAssignment,
  submissionFor,
  writeCountingStoreTransform,
} from "./support.mjs";

test(
  "event idempotency rejects every changed normalized operation-envelope field without mutation",
  async () => {
    const writes = { count: 0 };
    const harness = await createCoordinatorHarness({
      storeTransform: writeCountingStoreTransform(writes),
    });
    const issued = await issueAssignment(harness);
    await acceptSubmission(
      harness,
      issued,
      submissionFor(harness, issued),
    );
    const command = await eventCommand(harness, {
      commandFill: "4",
      payloadFill: "5",
      evidenceFill: "6",
    });
    await harness.coordinator.execute(
      harness.storeId,
      command,
    );
    const before = await harness.store.read(harness.storeId);
    const callbacksBefore = { ...harness.callbackCounts };
    const writesBefore = writes.count;
    const variants = [
      {
        label: "eventId",
        change(candidate) {
          candidate.eventId = "DIFFERENT_EVENT";
        },
      },
      {
        label: "base",
        change(candidate) {
          candidate.base.semanticRevision += 1;
        },
      },
      {
        label: "evidenceDigest",
        change(candidate) {
          candidate.evidenceDigest = digest("9");
        },
      },
      {
        label: "inputs",
        change(candidate) {
          candidate.inputs = { changed: true };
        },
      },
      {
        label: "externalCouplings",
        change(candidate) {
          candidate.externalCouplings = [{
            machineId: "changed-coupling",
          }];
        },
      },
    ];

    for (const variant of variants) {
      const changed = structuredClone(command);
      variant.change(changed);
      await assert.rejects(
        harness.coordinator.execute(
          harness.storeId,
          changed,
        ),
        (error) => {
          assert.equal(
            error?.code,
            "IDEMPOTENCY_KEY_REUSED",
            `${variant.label} must conflict with the retained operation envelope`,
          );
          return true;
        },
      );
      assert.deepEqual(
        await harness.store.read(harness.storeId),
        before,
        `${variant.label} must leave the store byte-for-byte unchanged`,
      );
      assert.deepEqual(
        harness.callbackCounts,
        callbacksBefore,
        `${variant.label} must invoke no reducer callback`,
      );
      assert.equal(
        writes.count,
        writesBefore,
        `${variant.label} must attempt no publication`,
      );
    }
  },
);
