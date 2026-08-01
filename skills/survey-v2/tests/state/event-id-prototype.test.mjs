import test from "node:test";
import assert from "node:assert/strict";
import { applySurveyCommand } from "../../source/executables/runtime/lib/engine.mjs";
import { readVerifiedSession } from "../../source/executables/runtime/lib/storage.mjs";
import { newRun, proposer } from "../fixtures/runtime-fixture.mjs";
import { surveyRoot } from "../fixtures/root.mjs";

test("prototype-like event IDs are rejected without mutating idempotency state.", async () => {
  const run = await newRun();
  try {
    const revision = run.session.revision;
    await assert.rejects(
      applySurveyCommand(surveyRoot, run.runDirectory, {
        event: "BEGIN_R1_DESIGN",
        eventId: "__proto__",
        payload: {},
        expectedRevision: revision
      }, proposer()),
      (error) => error.code === "EVENT_ID_INVALID"
    );
    const session = await readVerifiedSession(run.runDirectory);
    assert.equal(session.revision, revision);
    assert.equal(Object.hasOwn(session.idempotency, "__proto__"), false);
  } finally {
    await run.cleanup();
  }
});
