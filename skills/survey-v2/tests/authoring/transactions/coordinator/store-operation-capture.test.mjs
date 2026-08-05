import assert from "node:assert/strict";
import test from "node:test";
import {
  createCoordinatorHarness,
  issueAssignment,
} from "./support.mjs";

test("coordinator captures bound store operations before caller-owned method replacement", async () => {
  let facade;
  const harness = await createCoordinatorHarness({
    storeTransform(store) {
      facade = {
        read(storeId) {
          return store.read(storeId);
        },
        withWriter(storeId, operation) {
          return store.withWriter(storeId, operation);
        },
      };
      return facade;
    },
  });
  facade.read = () => {
    throw new Error("replacement read must not run");
  };
  facade.withWriter = () => {
    throw new Error("replacement withWriter must not run");
  };

  const issued = await issueAssignment(harness);
  const { snapshot } =
    await harness.coordinator.read(harness.storeId);

  assert.equal(issued.kind, "assignment");
  assert.equal(snapshot.commitRevision, 1);
});
