import test from "node:test";
import assert from "node:assert/strict";
import { director, newRun, reachAwaitingQ1, transition } from "../fixtures/runtime-fixture.mjs";

test("arbitrary text containing option letters is not parsed as a valid pick.", async () => {
  const run = await newRun();
  try {
    await reachAwaitingQ1(run);
    const result = await transition(run, {
      event: "RESPOND_Q1",
      eventId: "bad-is-not-b-a-d",
      actor: director(),
      payload: {
        raw: "bad",
        questionId: "Q1",
        acknowledgedViewDigest: run.session.outbox.digest
      }
    });
    assert.equal(result.rejected, true);
    assert.equal(result.session.responses.Q1, undefined);
  } finally {
    await run.cleanup();
  }
});
