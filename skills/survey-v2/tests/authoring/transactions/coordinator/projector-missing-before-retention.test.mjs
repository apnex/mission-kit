import assert from "node:assert/strict";
import test from "node:test";
import {
  createCoordinatorHarness,
  issueAssignment,
} from "./support.mjs";

test(
  "a missing pinned projector rejects Assignment issuance before any retention",
  async () => {
    const harness = await createCoordinatorHarness({
      executablesTransform(executables) {
        const {
          projectors: omitted,
          ...legacyRegistry
        } = executables;
        assert.equal(Array.isArray(omitted), true);
        return legacyRegistry;
      },
    });
    const before = await harness.store.read(harness.storeId);

    await assert.rejects(
      () => issueAssignment(harness),
      (error) => error?.code === "EXECUTABLE_MISSING",
    );

    const after = await harness.store.read(harness.storeId);
    assert.deepEqual(after, before);
    assert.equal(after.commitRevision, 0);
    assert.equal(after.workspace.spec.openAssignment, null);
    assert.deepEqual(after.journal, []);
    assert.deepEqual(after.idempotencyOutcomeView, []);
  },
);
