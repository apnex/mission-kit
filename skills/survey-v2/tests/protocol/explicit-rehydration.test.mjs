import test from "node:test";
import assert from "node:assert/strict";
import { newRun, proposer, transition } from "../fixtures/runtime-fixture.mjs";

test("a warm phase command does not inject process-start or rehydration events.", async () => {
  const run = await newRun();
  try {
    const before = run.session.events.length;
    await transition(run, {
      event: "BEGIN_R1_DESIGN",
      eventId: "warm-command",
      actor: proposer()
    });
    const appended = run.session.events.slice(before);
    assert.deepEqual(appended.map((event) => event.transitionId), ["T02"]);
  } finally {
    await run.cleanup();
  }
});
