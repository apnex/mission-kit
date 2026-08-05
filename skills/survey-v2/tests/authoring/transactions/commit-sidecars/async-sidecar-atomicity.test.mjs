import assert from "node:assert/strict";
import test from "node:test";
import {
  createSidecarCoordinatorHarness,
  prepareSubmission,
  snapshot,
} from "./support.mjs";

test(
  "a promise-returning commit sidecar leaves the store byte-for-byte unchanged",
  async () => {
    const harness = await createSidecarCoordinatorHarness({
      sidecarInvoke: () => Promise.resolve({
        status: "accept",
        resources: [],
      }),
    });
    const { command } = await prepareSubmission(harness);
    const before = await snapshot(harness);

    await assert.rejects(
      () => harness.coordinator.execute(
        harness.storeId,
        command,
      ),
      (error) =>
        error?.code === "EXECUTABLE_ASYNC_FORBIDDEN",
    );

    assert.equal(harness.counts.sidecar, 1);
    assert.deepEqual(await snapshot(harness), before);
  },
);
