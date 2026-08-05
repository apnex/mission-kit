import assert from "node:assert/strict";
import test from "node:test";
import {
  alternateProtocol,
  createCoordinatorHarness,
  issueAssignment,
  writeCountingStoreTransform,
} from "./support.mjs";

test("pending Assignment reproduction rejects a configured protocol outside the persisted Workspace authority before callbacks or writes", async () => {
  const warm = await createCoordinatorHarness();
  await issueAssignment(warm);
  const writes = { count: 0 };
  const cold = await createCoordinatorHarness({
    storeId: warm.storeId,
    driver: warm.driver,
    persistence: warm.persistence,
    initialize: false,
    protocolTransform: alternateProtocol,
    storeTransform: writeCountingStoreTransform(writes),
  });

  await assert.rejects(
    () => cold.coordinator.execute(
      cold.storeId,
      { class: "next", inputs: {} },
    ),
    (error) => error?.code === "AUTHORITY_IDENTITY_MISMATCH",
  );

  assert.deepEqual(
    cold.callbackCounts,
    { guard: 0, handler: 0, validator: 0 },
  );
  assert.equal(writes.count, 0);
});
