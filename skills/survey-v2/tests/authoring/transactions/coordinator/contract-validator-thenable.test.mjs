import assert from "node:assert/strict";
import test from "node:test";
import {
  createCoordinatorHarness,
} from "./support.mjs";

test("coordinator rejects a contract-validator thenable without leaking its rejection", async () => {
  const harness = await createCoordinatorHarness({
    contractValidatorTransform() {
      return () => ({
        then(_resolve, reject) {
          reject(new Error("hostile asynchronous rejection"));
        },
      });
    },
  });

  await assert.rejects(
    harness.coordinator.read(harness.storeId),
    (error) =>
      error.code ===
      "TRANSACTION_CONTRACT_VALIDATOR_ASYNC_FORBIDDEN",
  );
  await new Promise((resolve) => setImmediate(resolve));
});
