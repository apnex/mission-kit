import assert from "node:assert/strict";
import test from "node:test";
import {
  acceptSubmission,
  createCoordinatorHarness,
  eventCommand,
  issueAssignment,
  submissionFor,
} from "./support.mjs";

test(
  "machine-qualified idempotency reuse with a changed payload is read-only and invokes no callbacks",
  async () => {
    let compareAndCommitCalls = 0;
    const harness = await createCoordinatorHarness({
      storeTransform(store) {
        return {
          read(storeId) {
            return store.read(storeId);
          },
          withWriter(storeId, operation) {
            return store.withWriter(
              storeId,
              (writer) => operation({
                read: writer.read,
                compareAndCommit(request) {
                  compareAndCommitCalls += 1;
                  return writer.compareAndCommit(request);
                },
              }),
            );
          },
        };
      },
    });
    const issued = await issueAssignment(harness);
    await acceptSubmission(
      harness,
      issued,
      submissionFor(harness, issued),
    );
    const committedCommand = await eventCommand(harness, {
      commandFill: "4",
      payloadFill: "5",
      evidenceFill: "6",
    });
    await harness.coordinator.execute(
      harness.storeId,
      committedCommand,
    );
    const reusedKeyCommand = await eventCommand(harness, {
      commandFill: "4",
      payloadFill: "7",
      evidenceFill: "8",
    });
    const before = await harness.store.read(harness.storeId);
    const callbacksBefore = { ...harness.callbackCounts };
    const writesBefore = compareAndCommitCalls;

    await assert.rejects(
      harness.coordinator.execute(
        harness.storeId,
        reusedKeyCommand,
      ),
      (error) => error?.code === "IDEMPOTENCY_KEY_REUSED",
    );

    const after = await harness.store.read(harness.storeId);
    assert.deepEqual(after, before);
    assert.deepEqual(harness.callbackCounts, callbacksBefore);
    assert.equal(compareAndCommitCalls, writesBefore);
  },
);
