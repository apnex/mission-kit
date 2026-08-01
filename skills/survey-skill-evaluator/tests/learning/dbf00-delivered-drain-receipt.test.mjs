import assert from "node:assert/strict";
import test from "node:test";
import {
  makeDbf00Fixture,
  rootedBrokerClaim,
} from "../helpers/dbf00-fixture.mjs";

test("DBF00 accepts delivered work only with the exact not-committed drain receipt", async (t) => {
  const fixture = await makeDbf00Fixture();
  t.after(fixture.cleanup);
  const exactDrain = {
    disposition: "not_committed",
    claimId: "claim-1",
    fence: 1,
    operationId: "db-1",
    messageDigest: "a".repeat(64),
  };
  const delivered = rootedBrokerClaim({
    state: "delivered",
    deliveryReceipt: { receiver: "db-worker" },
    deliveredAtMs: 2,
    postDeliveryFence: { evidence: { reason: "capacity" }, fencedAtMs: 3 },
    drainReceipt: exactDrain,
    drainedAtMs: 4,
    fenceEvidence: undefined,
    fencedAtMs: undefined,
  });
  const result = await fixture.learning.buildDbf00Result({
    diagnosticDebateResultId: "db-result-1",
    terminalResultId: "terminal-1",
    diagnosticDebateId: "db-1",
    lr02GrantId: "lr02-grant-1",
    brokerClaim: delivered,
  });
  assert.equal(
    result.result.terminalResult.brokerClosure,
    "delivered_then_not_committed",
  );

  await assert.rejects(
    fixture.learning.buildDbf00Result({
      diagnosticDebateResultId: "db-result-2",
      terminalResultId: "terminal-2",
      diagnosticDebateId: "db-2",
      lr02GrantId: "lr02-grant-1",
      brokerClaim: rootedBrokerClaim({
        operationId: "db-2",
        state: "delivered",
        postDeliveryFence: { evidence: { reason: "capacity" } },
        drainReceipt: {
          ...exactDrain,
          operationId: "db-2",
          messageDigest: "b".repeat(64),
        },
        fenceEvidence: undefined,
        fencedAtMs: undefined,
      }),
    }),
    /requires a fenced-before-delivery/u,
  );
  await assert.rejects(
    fixture.learning.buildDbf00Result({
      diagnosticDebateResultId: "db-result-3",
      terminalResultId: "terminal-3",
      diagnosticDebateId: "db-3",
      lr02GrantId: "lr02-grant-1",
      brokerClaim: null,
    }),
    /authoritative broker closure/u,
  );
});
