import assert from "node:assert/strict";
import test from "node:test";
import {
  canonicalize,
} from "../../../../source/authoring/kernel/canonical.mjs";
import {
  createCoordinatorHarness,
  issueAssignment,
  submissionFor,
  submitCommand,
} from "./support.mjs";

test("idempotent submit replay validates complete command resource contracts before lookup", async () => {
  const harness = await createCoordinatorHarness();
  const issued = await issueAssignment(harness);
  const submission = submissionFor(harness, issued);
  const command = await submitCommand(
    harness,
    issued,
    submission,
  );
  await harness.coordinator.execute(harness.storeId, command);
  const before = await harness.backingStore.read(harness.storeId);
  const callbacksBefore = { ...harness.callbackCounts };
  const invalid = structuredClone(command);
  invalid.submission.ambient = "not-owned";

  await assert.rejects(
    harness.coordinator.execute(harness.storeId, invalid),
    (error) =>
      error.code === "TRANSACTION_COMMAND_CONTRACT_INVALID",
  );
  const after = await harness.backingStore.read(harness.storeId);

  assert.equal(canonicalize(after), canonicalize(before));
  assert.deepEqual(harness.callbackCounts, callbacksBefore);
});
