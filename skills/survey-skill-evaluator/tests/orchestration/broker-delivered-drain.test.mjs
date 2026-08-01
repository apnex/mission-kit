import test from "node:test";
import assert from "node:assert/strict";
import { BrokerClaimStore } from "../../source/executables/engine/index.mjs";
import { makeRuntimeFixture } from "../helpers/runtime-fixture.mjs";

test("a delivered operation fences only after an exact drain receipt", async (t) => {
  const fixture = await makeRuntimeFixture();
  t.after(fixture.cleanup);
  const broker = new BrokerClaimStore({ rootPath: fixture.rootPath });
  await broker.create({
    claimId: "claim-drain",
    messageDigest: "c".repeat(64),
    targetId: "target",
    operationId: "operation",
    fence: 1,
    source: { machineId: "sample", objectId: "sample" },
  });
  await broker.claimDelivery("claim-drain", { receiver: "target" });
  const fence = await broker.fence("claim-drain", { reason: "retire", fence: 2 });
  assert.equal(fence.disposition, "delivery_already_claimed");
  assert.equal(await broker.invocationStatus("claim-drain"), "drain_required");
  const receipt = {
    disposition: "not_committed",
    targetId: "target",
    verifiedAbsentRoot: "d".repeat(64),
  };
  const drained = await broker.recordDrain("claim-drain", receipt);
  const replay = await broker.recordDrain("claim-drain", receipt);
  assert.equal(drained.replayed, false);
  assert.equal(replay.replayed, true);
  assert.equal(await broker.invocationStatus("claim-drain"), "drained");
});
