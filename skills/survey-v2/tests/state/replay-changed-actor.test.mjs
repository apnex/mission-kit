import test from "node:test";
import assert from "node:assert/strict";
import { applySurveyCommand } from "../../source/executables/runtime/lib/engine.mjs";
import { newRun, proposer, transition } from "../fixtures/runtime-fixture.mjs";
import { surveyRoot } from "../fixtures/root.mjs";

test("a reused event ID with changed actor bytes is an integrity conflict.", async () => {
  const run = await newRun();
  try {
    await transition(run, {
      event: "BEGIN_R1_DESIGN",
      eventId: "changed-actor",
      actor: proposer()
    });
    await assert.rejects(
      applySurveyCommand(surveyRoot, run.runDirectory, {
        event: "BEGIN_R1_DESIGN",
        eventId: "changed-actor",
        payload: {},
        expectedRevision: run.session.revision
      }, proposer("different-proposer")),
      (error) => error.code === "EVENT_ID_CONFLICT"
    );
  } finally {
    await run.cleanup();
  }
});
