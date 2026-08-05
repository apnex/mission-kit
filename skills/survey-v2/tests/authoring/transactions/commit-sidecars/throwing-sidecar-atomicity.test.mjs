import assert from "node:assert/strict";
import test from "node:test";
import {
  createSidecarCoordinatorHarness,
  prepareSubmission,
  snapshot,
} from "./support.mjs";

test(
  "a throwing commit sidecar leaves the store byte-for-byte unchanged",
  async () => {
    const harness = await createSidecarCoordinatorHarness({
      sidecarInvoke() {
        throw new Error("hostile sidecar failure");
      },
    });
    const { command } = await prepareSubmission(harness);
    const before = await snapshot(harness);

    await assert.rejects(
      () => harness.coordinator.execute(
        harness.storeId,
        command,
      ),
      (error) => error?.code === "EXECUTABLE_THROWN",
    );

    assert.equal(harness.counts.sidecar, 1);
    assert.deepEqual(await snapshot(harness), before);
  },
);
