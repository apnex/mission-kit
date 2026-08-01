import assert from "node:assert/strict";
import test from "node:test";
import {
  director,
  newRun,
  reachAwaitingQ1,
  transition
} from "../fixtures/runtime-fixture.mjs";

test("the atomic session contains every reached-state artifact and event", async () => {
  const run = await newRun();
  try {
    await reachAwaitingQ1(run);
    const frozen = run.session.interpretations.round1Instrument;
    await transition(run, {
      event: "RESPOND_Q1",
      eventId: "artifacts:q1",
      actor: director(),
      payload: {
        raw: "a + c",
        questionId: "Q1",
        acknowledgedViewDigest: run.session.outbox.digest
      }
    });
    assert.equal(run.session.drafts.round1Instruments.at(-1).freezeDigest, frozen.freezeDigest);
    assert.equal(run.session.responses.Q1.eventId, "artifacts:q1");
    assert.equal(run.session.events.at(-1).transitionId, "T06");
    assert.equal(run.session.outbox.payload.questionId, "Q2");
    assert.ok(run.session.dependencies.outputs.initResolve);
    assert.ok(run.session.dependencies.rehydrationOutputs.length >= 1);
    assert.equal(run.session.revision, run.session.events.length);
  } finally {
    await run.cleanup();
  }
});
