import assert from "node:assert/strict";
import test from "node:test";
import {
  createSidecarCoordinatorHarness,
  prepareSubmission,
  snapshot,
} from "./support.mjs";

test(
  "a missing manifest-pinned sidecar executable rejects before projector dispatch or Assignment retention",
  async () => {
    const harness = await createSidecarCoordinatorHarness({
      includeSidecarExecutable: false,
    });
    const before = await snapshot(harness);

    await assert.rejects(
      () => prepareSubmission(harness),
      (error) =>
        error?.code === "EXECUTABLE_MISSING" &&
        error?.kind === "sidecars" &&
        error?.id === "commit-audit-sidecar",
    );

    assert.deepEqual(harness.counts, {
      guard: 0,
      handler: 0,
      projector: 0,
      sidecar: 0,
      validator: 0,
    });
    assert.deepEqual(await snapshot(harness), before);
    assert.equal(before.commitRevision, 0);
    assert.equal(before.workspace.spec.openAssignment, null);
  },
);
