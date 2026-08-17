import test from "node:test";
import assert from "node:assert/strict";
import { AwarenessLedger } from "../../source/executables/orchestrator/index.mjs";
import { ConflictError, hashCanonical } from "../../source/executables/engine/index.mjs";
import { makeRuntimeFixture } from "../helpers/runtime-fixture.mjs";

test("awareness invocation binds before dispatch and content commits before request", async (t) => {
  const fixture = await makeRuntimeFixture();
  t.after(fixture.cleanup);
  const ledger = new AwarenessLedger({ rootPath: fixture.rootPath });
  await ledger.register({
    obligationId: "aw-1",
    roleClass: "semantic_judge",
    purpose: "semantic",
    parentBinding: { reviewSlotId: "slot-1" },
    expectedInvocation: true,
    maskPolicyDigest: "a".repeat(64),
  });
  await assert.rejects(
    ledger.issueNeutralRequest("aw-1", { guess: "unknown" }),
    (error) => error instanceof ConflictError,
  );
  const binding = {
    workOrderId: "judge-1",
    parentOrderId: "grant-1",
    parentFence: 1,
  };
  await ledger.bindInvocation("aw-1", binding);
  await ledger.assertDispatchable(
    "aw-1",
    hashCanonical("awareness-invocation-binding/v1", binding),
  );
  await ledger.commitContent("aw-1", { resultDigest: "b".repeat(64) });
  const requested = await ledger.issueNeutralRequest("aw-1", {
    guess: "unknown",
  });
  assert.equal(requested.state, "AW2_REQUESTED");
});
