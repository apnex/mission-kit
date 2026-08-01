import assert from "node:assert/strict";
import test from "node:test";
import { applySurveyCommand } from "../../source/executables/runtime/lib/engine.mjs";
import {
  host,
  newRun,
  proposer,
  reachAwaitingQ1
} from "../fixtures/runtime-fixture.mjs";
import { surveyRoot } from "../fixtures/root.mjs";

test("cold takeover replays state and exposes only the current legal view", async () => {
  const run = await newRun();
  try {
    await reachAwaitingQ1(run);
    const phase = run.session.phase;
    const viewDigest = run.session.outbox.digest;
    let result = await applySurveyCommand(surveyRoot, run.runDirectory, {
      event: "PROCESS_START",
      eventId: "cold:process-start",
      expectedRevision: run.session.revision,
      payload: {}
    }, host());
    assert.equal(result.session.phase, phase);
    assert.equal(result.session.outbox.digest, viewDigest);
    await assert.rejects(
      applySurveyCommand(surveyRoot, run.runDirectory, {
        event: "BEGIN_R1_DESIGN",
        eventId: "cold:phase-before-pass",
        expectedRevision: result.session.revision,
        payload: {}
      }, proposer()),
      (error) => error.code === "ILLEGAL_STATE" || error.code === "ILLEGAL_PRODUCT_STATE"
    );
    result = await applySurveyCommand(surveyRoot, run.runDirectory, {
      event: "REHYDRATION_PASS",
      eventId: "cold:rehydration-pass",
      expectedRevision: result.session.revision,
      payload: {}
    }, host());
    assert.equal(result.session.phase, phase);
    assert.equal(result.session.outbox.digest, viewDigest);
    const proof = result.session.dependencies.rehydrationOutputs.at(-1);
    assert.equal(proof.initializationResultDigest, result.session.dependencies.outputs.initResolve.resultDigest);
    assert.equal(proof.complete, true);
  } finally {
    await run.cleanup();
  }
});
