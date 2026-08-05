import assert from "node:assert/strict";
import test from "node:test";
import {
  receiptOutcome,
} from "../../../../source/authoring/runtime/commit-records.mjs";
import {
  createSidecarCoordinatorHarness,
  prepareSubmission,
} from "./support.mjs";

test(
  "a transition outcome rejects a sidecar reference that aliases its Receipt",
  async () => {
    const harness = await createSidecarCoordinatorHarness();
    const { command } = await prepareSubmission(harness);
    const committed = await harness.coordinator.execute(
      harness.storeId,
      command,
    );

    assert.throws(
      () => receiptOutcome(
        committed.receipt,
        [committed.receipt],
      ),
      (error) => error?.code === "COMMIT_OUTCOME_INVALID",
    );
  },
);
