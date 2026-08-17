import assert from "node:assert/strict";
import test from "node:test";
import { makeLcrFixture, lcrDigest } from "../helpers/lcr-fixture.mjs";

test("LCR emits an invocable grant only for its exact delivered broker claim", async () => {
  const { learning, request } = await makeLcrFixture();
  const outcome = learning.buildOperationGrant({
    operationGrantId: "grant-1",
    learningCapitalRequestId: "lcr-1",
    sourceRequest: request,
    fence: 2,
    brokerClaim: {
      claimId: "claim-1",
      state: "delivered",
      postDeliveryFence: null,
      targetId: "lcr-1",
      messageDigest: lcrDigest,
      fence: 2,
    },
  });
  assert.equal(outcome.grant.grantClass, "eligible");
  assert.equal(outcome.grant.invocable, true);
  assert.equal(
    learning.assertCapitalInvocation({
      operationGrant: outcome.grant,
      sourceRequest: request,
      transitionId: "LC01",
    }),
    true,
  );
});
