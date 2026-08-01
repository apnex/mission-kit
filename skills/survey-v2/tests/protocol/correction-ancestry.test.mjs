import assert from "node:assert/strict";
import test from "node:test";
import {
  director,
  newRun,
  proposer,
  reachAwaitingRatification,
  transition
} from "../fixtures/runtime-fixture.mjs";

test("a correction preserves candidate ancestry until a correctly classified revision supersedes it", async () => {
  const run = await newRun();
  try {
    await reachAwaitingRatification(run);
    const candidate = run.session.candidates[0];
    await transition(run, {
      event: "DIRECTOR_RETURN",
      eventId: "correction-ancestry:return",
      actor: director(),
      payload: {
        kind: "correction",
        feedback: "Revise only the composite wording."
      }
    });
    await assert.rejects(
      transition(run, {
        event: "BEGIN_COMPOSITE_REVISION",
        eventId: "correction-ancestry:wrong-class",
        actor: proposer(),
        payload: { correctionClass: "r2-derived" }
      }),
      (error) => error.code === "CORRECTION_CLASS_MISMATCH"
    );
    assert.equal(run.session.candidates[0].semanticDigest, candidate.semanticDigest);
    assert.equal(run.session.candidates[0].renderDigest, candidate.renderDigest);
    await transition(run, {
      event: "BEGIN_COMPOSITE_REVISION",
      eventId: "correction-ancestry:revision",
      actor: proposer(),
      payload: { correctionClass: "composite-owned" }
    });
    assert.equal(run.session.phase, "composite_drafting");
    assert.equal(run.session.candidates[0].superseded, true);
    assert.equal(run.session.candidates[0].semanticDigest, candidate.semanticDigest);
    assert.equal(run.session.candidates[0].renderDigest, candidate.renderDigest);
  } finally {
    await run.cleanup();
  }
});
