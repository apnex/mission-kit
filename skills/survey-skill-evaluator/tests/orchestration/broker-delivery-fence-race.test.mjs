import test from "node:test";
import assert from "node:assert/strict";
import { BrokerClaimStore } from "../../source/executables/engine/index.mjs";
import { makeRuntimeFixture } from "../helpers/runtime-fixture.mjs";

test("broker delivery and pre-delivery fence linearize on one claim", async (t) => {
  const fixture = await makeRuntimeFixture();
  t.after(fixture.cleanup);
  const broker = new BrokerClaimStore({ rootPath: fixture.rootPath });
  await broker.create({
    claimId: "claim-1",
    messageDigest: "a".repeat(64),
    targetId: "target-1",
    operationId: "operation-1",
    fence: 1,
    source: { machineId: "sample", objectId: "sample-1" },
  });
  const settled = await Promise.allSettled([
    broker.claimDelivery("claim-1", { receiver: "target-1", digest: "b".repeat(64) }),
    broker.fence("claim-1", { reason: "cutoff", fence: 2 }),
  ]);
  const claim = await broker.load("claim-1", { required: true });
  if (claim.state === "fenced_before_delivery") {
    assert.equal(settled[0].status, "rejected");
    assert.equal(await broker.invocationStatus("claim-1"), "forbidden");
  } else {
    assert.equal(claim.state, "delivered");
    assert.equal(settled[0].status, "fulfilled");
    assert.equal(settled[1].status, "fulfilled");
    assert.equal(await broker.invocationStatus("claim-1"), "drain_required");
  }
});
