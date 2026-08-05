import assert from "node:assert/strict";
import test from "node:test";
import {
  createStoreHarness,
  deferred,
} from "./support.mjs";

test("writers for one store execute with asynchronous mutual exclusion", async () => {
  const harness = await createStoreHarness();
  const firstEntered = deferred();
  const releaseFirst = deferred();
  const order = [];

  const first = harness.store.withWriter(
    harness.storeId,
    async () => {
      order.push("first-enter");
      firstEntered.resolve();
      await releaseFirst.promise;
      order.push("first-exit");
    },
  );
  await firstEntered.promise;
  const second = harness.store.withWriter(
    harness.storeId,
    async () => {
      order.push("second-enter");
    },
  );
  await Promise.resolve();
  assert.deepEqual(order, ["first-enter"]);

  releaseFirst.resolve();
  await Promise.all([first, second]);
  assert.deepEqual(order, [
    "first-enter",
    "first-exit",
    "second-enter",
  ]);
});
