import assert from "node:assert/strict";
import test from "node:test";
import {
  createCoordinatorHarness,
  issueAssignment,
} from "./support.mjs";

test("coordinator reads each caller-owned store capability exactly once before retaining it", async () => {
  const reads = { read: 0, withWriter: 0 };
  const harness = await createCoordinatorHarness({
    storeTransform(store) {
      return Object.defineProperties({}, {
        read: {
          enumerable: true,
          get() {
            reads.read += 1;
            return (storeId) => store.read(storeId);
          },
        },
        withWriter: {
          enumerable: true,
          get() {
            reads.withWriter += 1;
            return (storeId, operation) =>
              store.withWriter(storeId, operation);
          },
        },
      });
    },
  });

  assert.deepEqual(reads, { read: 1, withWriter: 1 });
  await issueAssignment(harness);
  await harness.coordinator.read(harness.storeId);
  assert.deepEqual(reads, { read: 1, withWriter: 1 });
});
