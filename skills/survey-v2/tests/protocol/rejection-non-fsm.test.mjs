import test from "node:test";
import assert from "node:assert/strict";
import { readVerifiedSession } from "../../source/executables/runtime/lib/storage.mjs";
import { director, newRun, reachAwaitingQ1, transition } from "../fixtures/runtime-fixture.mjs";

test("RJ01 remains rejection evidence and never enters the accepted FSM event chain.", async () => {
  const run = await newRun();
  try {
    await reachAwaitingQ1(run);
    const revision = run.session.revision;
    const eventCount = run.session.events.length;
    const result = await transition(run, {
      event: "RESPOND_Q1",
      eventId: "invalid-pick-evidence",
      actor: director(),
      payload: {
        raw: "",
        questionId: "Q1",
        acknowledgedViewDigest: run.session.outbox.digest
      }
    });
    const session = await readVerifiedSession(run.runDirectory);
    assert.equal(result.rejected, true);
    assert.equal(session.phase, "round_1_q1_awaiting");
    assert.equal(session.revision, revision);
    assert.equal(session.events.length, eventCount);
    assert.equal(session.rejections.at(-1).ruleId, "RJ01");
    assert.equal(session.idempotency["invalid-pick-evidence"].transitionId, "REJECTION:RJ01");
  } finally {
    await run.cleanup();
  }
});
