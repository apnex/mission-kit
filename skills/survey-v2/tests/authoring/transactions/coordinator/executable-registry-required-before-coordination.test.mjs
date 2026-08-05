import assert from "node:assert/strict";
import test from "node:test";
import {
  createCoordinatorHarness,
} from "./support.mjs";

test(
  "coordinator construction rejects an omitted executable registry without callbacks or Assignment retention",
  async () => {
    const storeId = "registry-required-store";
    const callbackCounts = {
      guard: 0,
      handler: 0,
      validator: 0,
    };
    let projectorCalls = 0;
    let backingStore;
    const storeCalls = {
      compareAndCommit: 0,
      read: 0,
      withWriter: 0,
    };

    await assert.rejects(
      () => createCoordinatorHarness({
        storeId,
        callbackCounts,
        projectorInvoke() {
          projectorCalls += 1;
          throw new Error("omitted registry projector must not run");
        },
        executablesTransform: () => undefined,
        storeTransform(store) {
          backingStore = store;
          return {
            read(storeIdInput) {
              storeCalls.read += 1;
              return store.read(storeIdInput);
            },
            withWriter(storeIdInput, operation) {
              storeCalls.withWriter += 1;
              return store.withWriter(
                storeIdInput,
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
      }),
      (error) =>
        error?.code ===
          "TRANSACTION_EXECUTABLE_REGISTRY_REQUIRED",
    );

    assert.notEqual(backingStore, undefined);
    assert.deepEqual(storeCalls, {
      compareAndCommit: 0,
      read: 0,
      withWriter: 0,
    });
    const snapshot = await backingStore.read(storeId);
    assert.deepEqual(callbackCounts, {
      guard: 0,
      handler: 0,
      validator: 0,
    });
    assert.equal(projectorCalls, 0);
    assert.equal(snapshot.commitRevision, 0);
    assert.equal(snapshot.workspace.spec.openAssignment, null);
    assert.deepEqual(snapshot.journal, []);
    assert.deepEqual(snapshot.idempotencyOutcomeView, []);
    assert.equal(
      snapshot.workspace.spec.resourceVersions.some(
        (entry) => entry.resource.kind === "AuthoringAssignment",
      ),
      false,
    );
  },
);
