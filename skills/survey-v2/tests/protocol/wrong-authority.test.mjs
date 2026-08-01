import test from "node:test";
import assert from "node:assert/strict";
import { applySurveyCommand } from "../../source/executables/runtime/lib/engine.mjs";
import { director, newRun } from "../fixtures/runtime-fixture.mjs";
import { surveyRoot } from "../fixtures/root.mjs";

test("a Director cannot execute a proposer-owned semantic transition.", async () => {
  const run = await newRun();
  try {
    await assert.rejects(
      applySurveyCommand(surveyRoot, run.runDirectory, {
        event: "BEGIN_R1_DESIGN",
        eventId: "wrong-authority",
        payload: {},
        expectedRevision: run.session.revision
      }, director()),
      (error) => error.code === "AUTHORITY_DENIED"
    );
  } finally {
    await run.cleanup();
  }
});
