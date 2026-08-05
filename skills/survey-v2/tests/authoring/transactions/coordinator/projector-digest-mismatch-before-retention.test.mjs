import assert from "node:assert/strict";
import test from "node:test";
import {
  createCoordinatorHarness,
  digest,
  issueAssignment,
} from "./support.mjs";

test(
  "a projector digest mismatch rejects Assignment issuance before any retention",
  async () => {
    const harness = await createCoordinatorHarness({
      executablesTransform(executables) {
        return {
          ...executables,
          projectors: executables.projectors.map(
            (projector) => ({
              ...projector,
              digest: digest("f"),
            }),
          ),
        };
      },
    });
    const before = await harness.store.read(harness.storeId);

    await assert.rejects(
      () => issueAssignment(harness),
      (error) =>
        error?.code === "EXECUTABLE_DIGEST_MISMATCH",
    );

    const after = await harness.store.read(harness.storeId);
    assert.deepEqual(after, before);
    assert.equal(after.commitRevision, 0);
    assert.equal(after.workspace.spec.openAssignment, null);
    assert.deepEqual(after.journal, []);
    assert.deepEqual(after.idempotencyOutcomeView, []);
  },
);
