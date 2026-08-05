import assert from "node:assert/strict";
import test from "node:test";
import {
  createCoordinatorHarness,
  issueAssignment,
} from "./support.mjs";

test(
  "complete manifest executable closure is preflighted before the first projector callback or write",
  async () => {
    const storeCalls = {
      compareAndCommit: 0,
      read: 0,
      withWriter: 0,
    };
    let projectorCalls = 0;
    const harness = await createCoordinatorHarness({
      projectorInvoke() {
        projectorCalls += 1;
        throw new Error("projector must not run before closure preflight");
      },
      executablesTransform(executables) {
        return {
          ...executables,
          handlers: executables.handlers.filter(
            (entry) => entry.id !== "system-handler",
          ),
        };
      },
      storeTransform(store) {
        return {
          read(storeId) {
            storeCalls.read += 1;
            return store.read(storeId);
          },
          withWriter(storeId, operation) {
            storeCalls.withWriter += 1;
            return store.withWriter(
              storeId,
              (writer) => operation({
                read: writer.read,
                compareAndCommit(request) {
                  storeCalls.compareAndCommit += 1;
                  return writer.compareAndCommit(request);
                },
              }),
            );
          },
        };
      },
    });

    await assert.rejects(
      () => issueAssignment(harness),
      (error) =>
        error?.code === "EXECUTABLE_MISSING" &&
        error?.kind === "handlers" &&
        error?.id === "system-handler",
    );

    assert.deepEqual(harness.callbackCounts, {
      guard: 0,
      handler: 0,
      validator: 0,
    });
    assert.equal(projectorCalls, 0);
    assert.deepEqual(storeCalls, {
      compareAndCommit: 0,
      read: 0,
      withWriter: 0,
    });
    const after = await harness.backingStore.read(
      harness.storeId,
    );
    assert.equal(after.commitRevision, 0);
    assert.equal(after.workspace.spec.openAssignment, null);
    assert.deepEqual(after.journal, []);
    assert.deepEqual(after.idempotencyOutcomeView, []);
  },
);
