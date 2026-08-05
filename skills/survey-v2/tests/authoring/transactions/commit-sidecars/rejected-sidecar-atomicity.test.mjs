import assert from "node:assert/strict";
import test from "node:test";
import {
  createSidecarCoordinatorHarness,
  prepareSubmission,
  snapshot,
} from "./support.mjs";

test(
  "a domain-rejected commit sidecar leaves the store byte-for-byte unchanged",
  async () => {
    const harness = await createSidecarCoordinatorHarness({
      sidecarInvoke: () => ({
        status: "reject",
        issues: [{
          code: "AUDIT_REFUSED",
          field: "",
          reason: "Audit evidence was refused for this test.",
          correction: "Return one exact commit audit resource.",
        }],
      }),
    });
    const { command } = await prepareSubmission(harness);
    const before = await snapshot(harness);

    await assert.rejects(
      () => harness.coordinator.execute(
        harness.storeId,
        command,
      ),
      (error) => error?.code === "COMMIT_SIDECAR_REJECTED",
    );

    assert.equal(harness.counts.sidecar, 1);
    assert.deepEqual(await snapshot(harness), before);
  },
);
