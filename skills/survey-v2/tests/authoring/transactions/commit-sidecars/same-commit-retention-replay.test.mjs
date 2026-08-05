import assert from "node:assert/strict";
import test from "node:test";
import {
  createSidecarCoordinatorHarness,
  prepareSubmission,
  snapshot,
} from "./support.mjs";

test(
  "a valid sidecar is retained with its Receipt and idempotent replay does not invoke it again",
  async () => {
    const harness = await createSidecarCoordinatorHarness();
    const { command } = await prepareSubmission(harness);

    const first = await harness.coordinator.execute(
      harness.storeId,
      command,
    );
    const committed = await snapshot(harness);
    assert.equal(first.kind, "committed");
    assert.equal(harness.counts.sidecar, 1);
    assert.equal(committed.commitRevision, 2);
    assert.equal(
      committed.workspace.spec.resourceVersions.filter(
        (stored) =>
          stored.resource.kind === "AuthoringCommitReceipt",
      ).length,
      1,
    );
    assert.equal(
      committed.workspace.spec.resourceVersions.filter(
        (stored) => stored.resource.kind === "CommitAudit",
      ).length,
      1,
    );

    const second = await harness.coordinator.execute(
      harness.storeId,
      command,
    );
    assert.deepEqual(second, first);
    assert.equal(harness.counts.sidecar, 1);
    assert.deepEqual(await snapshot(harness), committed);
  },
);
