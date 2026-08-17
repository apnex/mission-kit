import assert from "node:assert/strict";
import test from "node:test";
import {
  initializationRequest,
  makeV1Adapter,
} from "../helpers/subject-adapter-fixture.mjs";

test("Survey subject adapters preserve an observed subject failure as failure", async () => {
  const { adapter } = makeV1Adapter({ terminalClass: "failed" });
  const initialized = await adapter.initialize(initializationRequest());
  assert.equal(initialized.terminalClass, "failed");
  assert.equal(initialized.envelopeRef, null);
});
