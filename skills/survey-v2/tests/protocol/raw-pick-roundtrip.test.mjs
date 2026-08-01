import test from "node:test";
import assert from "node:assert/strict";
import { readVerifiedSession } from "../../source/executables/runtime/lib/storage.mjs";
import { director, newRun, reachAwaitingQ1, transition } from "../fixtures/runtime-fixture.mjs";

test("accepted picks preserve raw evidence and deterministic normalized order.", async () => {
  const run = await newRun();
  try {
    await reachAwaitingQ1(run);
    await transition(run, {
      event: "RESPOND_Q1",
      eventId: "raw-pick",
      actor: director(),
      payload: {
        raw: "C, a, c",
        questionId: "Q1",
        acknowledgedViewDigest: run.session.outbox.digest
      }
    });
    const session = await readVerifiedSession(run.runDirectory);
    assert.equal(session.responses.Q1.raw, "C, a, c");
    assert.deepEqual(session.responses.Q1.normalizedPicks, ["a", "c"]);
    assert.deepEqual(session.responses.Q1.contradictions, [{
      kind: "exclusive-multi-pick",
      picks: ["a", "c"]
    }]);
  } finally {
    await run.cleanup();
  }
});
