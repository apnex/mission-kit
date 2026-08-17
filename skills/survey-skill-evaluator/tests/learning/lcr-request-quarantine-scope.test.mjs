import assert from "node:assert/strict";
import test from "node:test";
import { HASH_PROFILE_ID } from "../../source/executables/engine/index.mjs";
import { makeLcrFixture, lcrDigest } from "../helpers/lcr-fixture.mjs";

test("request quarantine denies only its matching LCR admission", async () => {
  const { learning, request } = await makeLcrFixture();
  const denied = learning.buildOperationGrant({
    operationGrantId: "grant-denied",
    learningCapitalRequestId: "lcr-1",
    sourceRequest: request,
    fence: 2,
    quarantineLatch: {
      hashProfileId: HASH_PROFILE_ID,
      scope: "request",
      scopeId: "lcr-1",
      latchRoot: lcrDigest,
    },
  });
  assert.equal(denied.grant.invocable, false);
  assert.throws(
    () =>
      learning.assertCapitalInvocation({
        operationGrant: denied.grant,
        sourceRequest: request,
        transitionId: "LC01",
      }),
    /not invocable/u,
  );
  assert.throws(
    () =>
      learning.buildOperationGrant({
        operationGrantId: "grant-wrong-latch",
        learningCapitalRequestId: "lcr-2",
        sourceRequest: request,
        fence: 2,
        quarantineLatch: {
          scope: "request",
          scopeId: "lcr-1",
          latchRoot: lcrDigest,
        },
      }),
    /unrelated quarantine/u,
  );
});
