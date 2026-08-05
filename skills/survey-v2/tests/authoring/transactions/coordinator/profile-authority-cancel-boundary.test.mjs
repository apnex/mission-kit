import assert from "node:assert/strict";
import test from "node:test";
import {
  alternateProfile,
  assignmentBinding,
  createCoordinatorHarness,
  digest,
  issueAssignment,
  writeCountingStoreTransform,
} from "./support.mjs";

test("cancellation rejects a configured profile outside the persisted Workspace authority before callbacks or writes", async () => {
  const warm = await createCoordinatorHarness();
  const issued = await issueAssignment(warm);
  const writes = { count: 0 };
  const cold = await createCoordinatorHarness({
    storeId: warm.storeId,
    driver: warm.driver,
    persistence: warm.persistence,
    initialize: false,
    profileTransform: alternateProfile,
    storeTransform: writeCountingStoreTransform(writes),
  });

  await assert.rejects(
    () => cold.coordinator.execute(cold.storeId, {
      class: "cancel",
      assignment: assignmentBinding(issued),
      cancellationEvidenceDigest: digest("c"),
    }),
    (error) => error?.code === "AUTHORITY_IDENTITY_MISMATCH",
  );

  assert.deepEqual(
    cold.callbackCounts,
    { guard: 0, handler: 0, validator: 0 },
  );
  assert.equal(writes.count, 0);
});
