import assert from "node:assert/strict";
import test from "node:test";
import {
  makeDbf00Fixture,
  rootedBrokerClaim,
} from "../helpers/dbf00-fixture.mjs";

test("diagnostic result acknowledgement occurs only after durable commit", async (t) => {
  const fixture = await makeDbf00Fixture();
  t.after(fixture.cleanup);
  const events = [];
  const result = (
    await fixture.learning.buildDbf00Result({
      diagnosticDebateResultId: "db-result-1",
      terminalResultId: "terminal-1",
      diagnosticDebateId: "db-1",
      lr02GrantId: "lr02-grant-1",
      brokerClaim: rootedBrokerClaim(),
    })
  ).result;

  await fixture.learning.commitDiagnosticResult({
    result,
    commit: async (_value, resultDigest) => {
      events.push("commit");
      return { resultDigest, durable: true };
    },
    acknowledge: async () => {
      events.push("acknowledge");
      return { acknowledged: true };
    },
  });
  assert.deepEqual(events, ["commit", "acknowledge"]);
});
