import test from "node:test";
import assert from "node:assert/strict";
import {
  ConflictError,
  QuarantineStore,
} from "../../source/executables/engine/index.mjs";
import { makeRuntimeFixture } from "../helpers/runtime-fixture.mjs";

test("concurrent identical quarantine publication converges while changed evidence conflicts", async (t) => {
  const fixture = await makeRuntimeFixture();
  t.after(fixture.cleanup);
  let now = 100;
  const quarantine = new QuarantineStore({
    rootPath: fixture.rootPath,
    clock: () => now++,
  });
  const command = {
    scope: "request",
    scopeId: "request-race",
    reason: "unverifiable_chain",
    detectionEvidence: { failedCheck: "event_root" },
    admissionConsequence: "fence_and_drain_exact_request",
  };
  const [left, right] = await Promise.all([
    quarantine.publish(command),
    quarantine.publish(command),
  ]);
  assert.equal([left.replayed, right.replayed].filter(Boolean).length, 1);
  assert.equal(left.latch.latchRoot, right.latch.latchRoot);
  await assert.rejects(
    quarantine.publish({
      ...command,
      detectionEvidence: { failedCheck: "different_root" },
    }),
    (error) => error instanceof ConflictError,
  );
});
