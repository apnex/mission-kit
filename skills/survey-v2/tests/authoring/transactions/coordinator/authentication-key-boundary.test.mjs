import assert from "node:assert/strict";
import test from "node:test";
import {
  createInMemoryJournalIdentityConfiguration,
} from "../../../../source/authoring/adapters/in-memory-store.mjs";
import {
  createCoordinatorHarness,
  issueAssignment,
} from "./support.mjs";

test("a changed authentication key refuses cold coordination before callbacks or writes", async () => {
  const warm = await createCoordinatorHarness();
  await issueAssignment(warm);
  const before = await warm.store.read(warm.storeId);
  const callbackCounts = {
    guard: 0,
    handler: 0,
    validator: 0,
  };
  const wrongKey = Uint8Array.from(
    { length: 32 },
    (_, index) => index,
  );
  assert.throws(
    () => createInMemoryJournalIdentityConfiguration(
      warm.rawIdentity.identityScope,
    ),
    (error) =>
      error.code ===
      "IN_MEMORY_AUTHENTICATION_KEY_INVALID",
  );

  await assert.rejects(
    createCoordinatorHarness({
      persistence: warm.persistence,
      initialize: false,
      authenticationKey: wrongKey,
      callbackCounts,
    }),
    (error) =>
      error.code ===
      "IN_MEMORY_IDENTITY_AUTHORITY_MISMATCH",
  );

  assert.deepEqual(callbackCounts, {
    guard: 0,
    handler: 0,
    validator: 0,
  });
  assert.deepEqual(
    await warm.store.read(warm.storeId),
    before,
  );
});
