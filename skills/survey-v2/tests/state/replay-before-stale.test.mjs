import test from "node:test";
import assert from "node:assert/strict";
import { applySurveyCommand } from "../../source/executables/runtime/lib/engine.mjs";
import { newRun, proposer, transition } from "../fixtures/runtime-fixture.mjs";
import { surveyRoot } from "../fixtures/root.mjs";

test("an exact command replay succeeds before stale-revision admission.", async () => {
  const run = await newRun();
  try {
    const originalRevision = run.session.revision;
    await transition(run, {
      event: "BEGIN_R1_DESIGN",
      eventId: "replay-before-stale",
      actor: proposer(),
      expectedRevision: originalRevision
    });
    const advancedRevision = run.session.revision;
    const replay = await applySurveyCommand(surveyRoot, run.runDirectory, {
      event: "BEGIN_R1_DESIGN",
      eventId: "replay-before-stale",
      payload: {},
      expectedRevision: originalRevision
    }, proposer());
    assert.equal(replay.replayed, true);
    assert.equal(replay.session.revision, advancedRevision);
  } finally {
    await run.cleanup();
  }
});
