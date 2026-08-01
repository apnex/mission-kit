import assert from "node:assert/strict";
import test from "node:test";
import {
  actionRequest,
  initializationRequest,
  makeV1Adapter,
  makeV2Adapter,
} from "../helpers/subject-adapter-fixture.mjs";

test("Survey v1 and v2 expose the same sovereign subject operation geometry", async () => {
  const adapters = [makeV1Adapter().adapter, makeV2Adapter().adapter];
  for (const adapter of adapters) {
    assert.deepEqual(
      Object.getOwnPropertyNames(Object.getPrototypeOf(adapter))
        .filter((name) => name !== "constructor")
        .sort(),
      ["action", "coldResume", "describe", "initialize", "observe", "stage"],
    );
    const initialized = await adapter.initialize(initializationRequest());
    const observed = await adapter.observe({
      sessionRef: initialized.sessionRef,
    });
    const receipt = await adapter.action(
      actionRequest(observed.subjectStateRoot),
    );
    assert.equal(receipt.observation.adapterId, adapter.describe().adapterId);
  }
});
